import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { setDefaultResultOrder } from 'dns'
import { createSign } from 'crypto'
import { createCheckout, createPortal, handleWebhook } from './billing.js'
import { createQR, listQR, getQRStats, getQR, updateQR, deleteQR, redirectQR } from './qr.js'
setDefaultResultOrder('ipv4first')

// Cache the MusicKit developer token so we don't re-sign on every request
let _musicTokenCache = null

function getMusicKitToken() {
  const teamId = process.env.APPLE_TEAM_ID
  const keyId  = process.env.APPLE_KEY_ID
  // Railway stores multi-line env vars with literal \n — restore real newlines
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!teamId || !keyId || !privateKey) return null

  // Return cached token if still valid (> 1 hour left)
  if (_musicTokenCache && _musicTokenCache.exp - Date.now() / 1000 > 3600) {
    return _musicTokenCache.token
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 15_552_000 // 180 days

  const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now, exp })).toString('base64url')
  const input   = `${header}.${payload}`

  const sign = createSign('SHA256')
  sign.update(input)
  const sig = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url')

  const token = `${input}.${sig}`
  _musicTokenCache = { token, exp }
  return token
}

const app = new Hono()

const YTDLP_URL = process.env.YTDLP_URL || 'http://localhost:8000'
const STEM_URL = process.env.STEM_URL || 'http://localhost:8001'
const P2T_URL  = process.env.P2T_URL  || 'http://localhost:8002'
const PORT = process.env.PORT || 3000

// CORS — allow requests from Dash frontend
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Disposition'],
}))

// Health check
app.get('/', (c) => c.json({ ok: true, service: 'Dash API' }))

// MusicKit developer token — fetched by the Apple Music tile on load
app.get('/api/music/token', (c) => {
  const token = getMusicKitToken()
  if (!token) return c.json({ error: 'Apple Music not configured' }, 503)
  return c.json({ token })
})

// ── SoundCloud OAuth ──────────────────────────────────────────────────────────
// Returns the public client_id so the frontend can build the auth redirect URL
app.get('/api/sc/config', (c) => {
  const clientId = process.env.SC_CLIENT_ID
  if (!clientId) return c.json({ error: 'SoundCloud not configured' }, 503)
  return c.json({ clientId })
})

// Exchanges an auth code for an access token (keeps client_secret on server)
app.post('/api/sc/token', async (c) => {
  const { code, redirectUri } = await c.req.json()
  const clientId     = process.env.SC_CLIENT_ID
  const clientSecret = process.env.SC_CLIENT_SECRET
  if (!clientId || !clientSecret) return c.json({ error: 'SoundCloud not configured' }, 503)

  try {
    const res = await fetch('https://api.soundcloud.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json; charset=utf-8' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
        code,
      }),
    })
    const data = await res.json()
    return c.json(data, res.status)
  } catch (err) {
    return c.json({ error: err.message }, 502)
  }
})

// ── Shazam song recognition ───────────────────────────────────────────────────
app.post('/api/shazam/recognize', async (c) => {
  const body = await c.req.json()
  const { audio, apiKey: userKey } = body
  const apiKey = userKey || process.env.RAPIDAPI_KEY
  if (!apiKey) return c.json({ error: 'No RapidAPI key provided' }, 400)

  if (!audio) return c.json({ error: 'audio is required' }, 400)

  try {
    const res = await fetch('https://shazam.p.rapidapi.com/songs/detect', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'shazam.p.rapidapi.com',
      },
      body: audio,
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return c.json({ error: `Shazam API error (${res.status}): ${text.slice(0, 200)}` }, 502)
    }
    return c.json(data, res.status)
  } catch (err) {
    return c.json({ error: err.message }, 502)
  }
})

// ── AviationStack flight proxy (free tier is HTTP-only, must proxy server-side) ──
app.get('/api/flights', async (c) => {
  const apiKey = c.req.query('key')
  const flightIata = c.req.query('flight_iata')
  if (!apiKey) return c.json({ error: 'API key required' }, 400)
  if (!flightIata) return c.json({ error: 'flight_iata required' }, 400)

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flightIata)}&limit=5`
    const res = await fetch(url)
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch {
      return c.json({ error: `AviationStack error: ${text.slice(0, 200)}` }, 502)
    }
    return c.json(data, res.status)
  } catch (err) {
    return c.json({ error: err.message }, 502)
  }
})

// Media download — GET version for native browser download with progress bar
app.get('/api/media/download', async (c) => {
  const sourceUrl = c.req.query('url')
  if (!sourceUrl) return c.json({ error: 'url is required' }, 400)

  const audioOnly = c.req.query('mode') === 'audio'

  let res
  try {
    res = await fetch(`${YTDLP_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: decodeURIComponent(sourceUrl),
        audio_only: audioOnly,
        quality: c.req.query('quality') || 'best',
        audio_format: c.req.query('format') || 'mp3',
      }),
      signal: AbortSignal.timeout(120_000), // 2 min hard limit
    })
  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Download service timed out'
      : `Download service unreachable: ${err.message}`
    console.error('GET /api/media/download fetch error:', err.message)
    return c.json({ error: msg }, 502)
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    return c.json(data, res.status)
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') || 'attachment',
    },
  })
})

// Media download — POST version (kept for programmatic use)
app.post('/api/media/download', async (c) => {
  const body = await c.req.json()
  if (!body.url) return c.json({ error: 'url is required' }, 400)

  const audioOnly = body.downloadMode === 'audio'

  let res
  try {
    res = await fetch(`${YTDLP_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: body.url,
        audio_only: audioOnly,
        quality: body.videoQuality || 'best',
        audio_format: body.audioFormat || 'mp3',
      }),
      signal: AbortSignal.timeout(120_000), // 2 min hard limit
    })
  } catch (err) {
    const msg = err.name === 'TimeoutError'
      ? 'Download service timed out'
      : `Download service unreachable: ${err.message}`
    console.error('POST /api/media/download fetch error:', err.message)
    return c.json({ error: msg }, 502)
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.log('yt-dlp error:', res.status, JSON.stringify(data))
    return c.json(data, res.status)
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') || 'attachment',
    },
  })
})

// ── GET /api/meta ─────────────────────────────────────────────────────────────
app.get('/api/meta', async (c) => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'url required' }, 400)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    const getMeta = (name) => {
      const a = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
      const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'))
      return (a?.[1] || b?.[1] || '').trim()
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = getMeta('og:title') || getMeta('twitter:title') || titleTag?.[1]?.trim() || ''
    const site = getMeta('og:site_name') || new URL(url).hostname.replace('www.', '')
    const author = getMeta('article:author') || getMeta('author') || ''
    const published = getMeta('article:published_time') || getMeta('og:updated_time') || ''

    let year = '', month = '', day = ''
    if (published) {
      const d = new Date(published)
      if (!isNaN(d)) {
        year = String(d.getFullYear())
        month = d.toLocaleString('en-US', { month: 'long' })
        day = String(d.getDate())
      }
    }

    return c.json({ title, site, author, year, month, day })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

// ── GET /api/ical ──────────────────────────────────────────────────────────────
// Proxy ICS/iCal feeds to avoid browser CORS restrictions.
// Converts webcal:// → https:// automatically.
app.get('/api/ical', async (c) => {
  const raw = c.req.query('url')
  if (!raw) return c.json({ error: 'url required' }, 400)

  try {
    const decoded = decodeURIComponent(raw)
    const fetchUrl = decoded.replace(/^webcal:\/\//i, 'https://')
    const parsed = new URL(fetchUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return c.json({ error: 'Invalid URL' }, 400)
    }

    const res = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return c.json({ error: `Upstream ${res.status}` }, res.status)

    const text = await res.text()
    return c.text(text, 200, { 'Content-Type': 'text/calendar; charset=utf-8' })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// ── Stem Splitter proxy ────────────────────────────────────────────────────────
app.post('/api/stems/split', async (c) => {
  const contentType = c.req.header('content-type') || ''
  let res
  try {
    res = await fetch(`${STEM_URL}/split`, {
      method: 'POST',
      body: c.req.raw.body,
      headers: { 'content-type': contentType },
      signal: AbortSignal.timeout(60_000),
      duplex: 'half',
    })
  } catch (err) {
    return c.json({ error: `Stem service unreachable: ${err.message}` }, 502)
  }
  const data = await res.json()
  return c.json(data, res.status)
})

app.get('/api/stems/status/:jobId', async (c) => {
  let res
  try {
    res = await fetch(`${STEM_URL}/status/${c.req.param('jobId')}`, {
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    return c.json({ error: err.message }, 502)
  }
  return c.json(await res.json(), res.status)
})

app.get('/api/stems/download/:jobId/:stem', async (c) => {
  let res
  try {
    res = await fetch(`${STEM_URL}/download/${c.req.param('jobId')}/${c.req.param('stem')}`, {
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    return c.json({ error: err.message }, 502)
  }
  if (!res.ok) return c.json(await res.json(), res.status)
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
      'Content-Disposition': res.headers.get('content-disposition') || 'attachment',
    },
  })
})

// ── Pix2Text proxy ─────────────────────────────────────────────────────────────
app.post('/api/p2t/convert', async (c) => {
  const contentType = c.req.header('content-type') || ''
  let res
  try {
    res = await fetch(`${P2T_URL}/convert`, {
      method: 'POST',
      body: c.req.raw.body,
      headers: { 'content-type': contentType },
      signal: AbortSignal.timeout(60_000),
      duplex: 'half',
    })
  } catch (err) {
    return c.json({ error: `Pix2Text service unreachable: ${err.message}` }, 502)
  }
  return c.json(await res.json(), res.status)
})

// Billing — webhook must be raw text (Stripe signature verification)
app.post('/api/billing/webhook', handleWebhook)
app.post('/api/billing/checkout', createCheckout)
app.post('/api/billing/portal', createPortal)

// QR code CRUD
app.post('/api/qr', createQR)
app.get('/api/qr', listQR)
app.get('/api/qr/:id/stats', getQRStats)
app.get('/api/qr/:id', getQR)
app.patch('/api/qr/:id', updateQR)
app.delete('/api/qr/:id', deleteQR)

// Public redirect — must be last so it doesn't swallow other routes
app.get('/:code', redirectQR)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Dash API running on port ${PORT}`)
})
