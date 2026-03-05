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

// Media download — proxies to yt-dlp service
app.post('/api/media/download', async (c) => {
  const body = await c.req.json()

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400)
  }

  const audioOnly = body.downloadMode === 'audio'

  const res = await fetch(`${YTDLP_URL}/${audioOnly ? 'download' : 'extract'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: body.url,
      audio_only: audioOnly,
      quality: body.videoQuality || 'best',
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    console.log('yt-dlp error:', res.status, JSON.stringify(data))
    return c.json(data, res.status)
  }

  // Audio: proxy the mp3 file stream back to client
  if (audioOnly) {
    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': res.headers.get('content-disposition') || 'attachment; filename="download.mp3"',
      },
    })
  }

  // Video: return JSON with direct URL
  const data = await res.json()
  console.log('yt-dlp response:', res.status, JSON.stringify(data))
  return c.json(data, res.status)
})

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Dash API running on port ${PORT}`)
})
