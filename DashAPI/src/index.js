import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { setDefaultResultOrder } from 'dns'
import { createCheckout, createPortal, handleWebhook } from './billing.js'
setDefaultResultOrder('ipv4first')

const app = new Hono()

const YTDLP_URL = process.env.YTDLP_URL || 'http://localhost:8000'
const PORT = process.env.PORT || 3000

// CORS — allow requests from Dash frontend
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  exposeHeaders: ['Content-Disposition'],
}))

// Health check
app.get('/', (c) => c.json({ ok: true, service: 'Dash API' }))

// Media download — GET version for native browser download with progress bar
app.get('/api/media/download', async (c) => {
  const sourceUrl = c.req.query('url')
  if (!sourceUrl) return c.json({ error: 'url is required' }, 400)

  const audioOnly = c.req.query('mode') === 'audio'

  const res = await fetch(`${YTDLP_URL}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: decodeURIComponent(sourceUrl),
      audio_only: audioOnly,
      quality: c.req.query('quality') || 'best',
      audio_format: c.req.query('format') || 'mp3',
    }),
  })

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

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400)
  }

  const audioOnly = body.downloadMode === 'audio'

  const res = await fetch(`${YTDLP_URL}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: body.url,
      audio_only: audioOnly,
      quality: body.videoQuality || 'best',
      audio_format: body.audioFormat || 'mp3',
    }),
  })

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

// Billing — webhook must be raw text (Stripe signature verification)
app.post('/api/billing/webhook', handleWebhook)
app.post('/api/billing/checkout', createCheckout)
app.post('/api/billing/portal', createPortal)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Dash API running on port ${PORT}`)
})
