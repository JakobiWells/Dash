import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { setDefaultResultOrder } from 'dns'
setDefaultResultOrder('ipv4first')

const app = new Hono()

const COBALT_URL = process.env.COBALT_URL || 'http://localhost:9000'
const COBALT_API_KEY = process.env.COBALT_API_KEY || ''
const PORT = process.env.PORT || 3000

// CORS — allow requests from Dash frontend
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

// Health check
app.get('/', (c) => c.json({ ok: true, service: 'Dash API' }))

// Media download — proxies to Cobalt
app.post('/api/media/download', async (c) => {
  const body = await c.req.json()

  if (!body.url) {
    return c.json({ error: 'url is required' }, 400)
  }

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }

  if (COBALT_API_KEY) {
    headers['Authorization'] = `Api-Key ${COBALT_API_KEY}`
  }

  const res = await fetch(`${COBALT_URL}/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json()
  console.log('Cobalt response:', res.status, JSON.stringify(data))
  return c.json(data, res.status)
})

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Dash API running on port ${PORT}`)
})
