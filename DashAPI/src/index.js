import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { setDefaultResultOrder } from 'dns'
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

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Dash API running on port ${PORT}`)
})
