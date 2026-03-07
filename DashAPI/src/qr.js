import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Lazy init — same pattern as billing.js
function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function generateCode(len = 7) {
  return randomBytes(len).toString('base64url').slice(0, len)
}

async function getUser(c) {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const { data: { user }, error } = await getSupabase().auth.getUser(token)
  if (error) return null
  return user
}

// ── POST /api/qr ──────────────────────────────────────────────────────────────
export async function createQR(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const { name, type, destination_url, content, page_color } = body
  if (!type) return c.json({ error: 'type is required' }, 400)

  // Generate a unique short code (retry on collision)
  let short_code
  for (let i = 0; i < 10; i++) {
    const candidate = generateCode(7)
    const { data } = await getSupabase()
      .from('qr_codes')
      .select('id')
      .eq('short_code', candidate)
      .maybeSingle()
    if (!data) { short_code = candidate; break }
  }
  if (!short_code) return c.json({ error: 'Failed to generate unique code' }, 500)

  const { data, error } = await getSupabase()
    .from('qr_codes')
    .insert({
      user_id: user.id,
      short_code,
      name: name || '',
      type,
      destination_url: destination_url || null,
      content: content || null,
      page_color: page_color || '#1d4ed8',
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
}

// ── GET /api/qr ───────────────────────────────────────────────────────────────
export async function listQR(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const archived = c.req.query('archived') === 'true'

  const { data, error } = await getSupabase()
    .from('qr_codes')
    .select('*, qr_scans(count)')
    .eq('user_id', user.id)
    .eq('is_archived', archived)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data.map(qr => ({
    ...qr,
    scan_count: qr.qr_scans?.[0]?.count ?? 0,
    qr_scans: undefined,
  })))
}

// ── GET /api/qr/:id ───────────────────────────────────────────────────────────
export async function getQR(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')

  const { data, error } = await getSupabase()
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return c.json({ error: 'Not found' }, 404)

  const { count } = await getSupabase()
    .from('qr_scans')
    .select('*', { count: 'exact', head: true })
    .eq('qr_id', id)

  return c.json({ ...data, scan_count: count ?? 0 })
}

// ── PATCH /api/qr/:id ─────────────────────────────────────────────────────────
export async function updateQR(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')
  const body = await c.req.json()

  const allowed = ['name', 'destination_url', 'content', 'page_color', 'is_archived']
  const updates = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await getSupabase()
    .from('qr_codes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) return c.json({ error: 'Not found or unauthorized' }, 404)
  return c.json(data)
}

// ── DELETE /api/qr/:id ────────────────────────────────────────────────────────
export async function deleteQR(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')

  const { error } = await getSupabase()
    .from('qr_codes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
}

// ── GET /api/qr/:id/stats ─────────────────────────────────────────────────────
export async function getQRStats(c) {
  const user = await getUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const id = c.req.param('id')

  // Verify ownership first
  const { data: qr } = await getSupabase()
    .from('qr_codes')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!qr) return c.json({ error: 'Not found' }, 404)

  const { data: scans, error } = await getSupabase()
    .from('qr_scans')
    .select('scanned_at')
    .eq('qr_id', id)
    .order('scanned_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)

  // Aggregate scans by date (YYYY-MM-DD)
  const by_date = {}
  for (const scan of scans) {
    const date = scan.scanned_at.slice(0, 10)
    by_date[date] = (by_date[date] || 0) + 1
  }

  return c.json({ total: scans.length, by_date })
}

// ── GET /:code — public redirect + scan logging ────────────────────────────────
export async function redirectQR(c) {
  const code = c.req.param('code')

  const { data, error } = await getSupabase()
    .from('qr_codes')
    .select('id, type, destination_url, content, page_color, is_archived')
    .eq('short_code', code)
    .single()

  if (error || !data || data.is_archived) {
    return c.html(notFoundPage(), 404)
  }

  // Log scan — fire and forget, never block the redirect
  getSupabase()
    .from('qr_scans')
    .insert({
      qr_id: data.id,
      user_agent: c.req.header('user-agent') || null,
      ip: c.req.header('x-forwarded-for')?.split(',')[0].trim()
        || c.req.header('x-real-ip')
        || null,
    })
    .then(() => {})
    .catch(() => {})

  // URL type: straight redirect
  if (data.type === 'url') {
    const dest = data.destination_url
    if (!dest) return c.html(notFoundPage(), 404)
    return c.redirect(dest, 302)
  }

  // All other types: render a landing page
  return c.html(landingPage(data), 200)
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function notFoundPage() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not found</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f3}
p{color:#666;font-size:1rem}</style></head>
<body><p>This QR code is no longer active.</p></body></html>`
}

function landingPage({ type, content, page_color }) {
  const c = content || {}
  const color = page_color || '#1d4ed8'

  let body = ''

  switch (type) {
    case 'vcard': {
      const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
      body = `
        <h1>${esc(name)}</h1>
        ${c.company ? `<p class="sub">${esc(c.company)}${c.jobTitle ? ` · ${esc(c.jobTitle)}` : ''}</p>` : ''}
        <div class="links">
          ${c.phone ? `<a href="tel:${esc(c.phone)}" class="btn">📞 ${esc(c.phone)}</a>` : ''}
          ${c.email ? `<a href="mailto:${esc(c.email)}" class="btn">✉️ ${esc(c.email)}</a>` : ''}
          ${c.website ? `<a href="${esc(c.website)}" class="btn">🌐 Website</a>` : ''}
        </div>
        ${c.address ? `<p class="addr">📍 ${esc(c.address)}</p>` : ''}`
      break
    }
    case 'wifi': {
      body = `
        <h1>Wi-Fi</h1>
        <p class="sub">${esc(c.ssid || '')}</p>
        ${c.password ? `<div class="password-box"><span class="label">Password</span><span class="pw">${esc(c.password)}</span></div>` : '<p>Open network — no password</p>'}
        <p class="hint">Connect in your device's Wi-Fi settings</p>`
      break
    }
    case 'text': {
      body = `<p class="text-content">${esc(c.text || '').replace(/\n/g, '<br>')}</p>`
      break
    }
    case 'email': {
      body = `
        <h1>Send an email</h1>
        ${c.to ? `<p class="sub">To: ${esc(c.to)}</p>` : ''}
        ${c.subject ? `<p>Subject: ${esc(c.subject)}</p>` : ''}
        <a href="mailto:${esc(c.to || '')}${c.subject ? `?subject=${encodeURIComponent(c.subject)}` : ''}" class="cta">Open Mail</a>`
      break
    }
    case 'sms': {
      body = `
        <h1>Send a text</h1>
        <p class="sub">${esc(c.phone || '')}</p>
        ${c.message ? `<p>${esc(c.message)}</p>` : ''}
        <a href="sms:${esc(c.phone || '')}${c.message ? `?body=${encodeURIComponent(c.message)}` : ''}" class="cta">Open Messages</a>`
      break
    }
    case 'phone': {
      body = `
        <h1>Phone</h1>
        <p class="sub">${esc(c.phone || '')}</p>
        <a href="tel:${esc(c.phone || '')}" class="cta">Call</a>`
      break
    }
    case 'location': {
      const lat = c.lat || c.latitude || ''
      const lng = c.lng || c.longitude || ''
      const mapsUrl = lat && lng
        ? `https://maps.google.com/?q=${lat},${lng}`
        : `https://maps.google.com/?q=${encodeURIComponent(c.address || '')}`
      body = `
        <h1>Location</h1>
        ${c.address ? `<p class="sub">📍 ${esc(c.address)}</p>` : ''}
        <a href="${mapsUrl}" target="_blank" class="cta">Open in Maps</a>`
      break
    }
    case 'social': {
      body = `
        <h1>${esc(c.platform || 'Social')}</h1>
        ${c.username ? `<p class="sub">@${esc(c.username)}</p>` : ''}
        ${c.url ? `<a href="${esc(c.url)}" target="_blank" class="cta">Follow</a>` : ''}`
      break
    }
    case 'event': {
      body = `
        <h1>${esc(c.title || 'Event')}</h1>
        ${c.start ? `<p class="sub">📅 ${esc(c.start)}</p>` : ''}
        ${c.location ? `<p>📍 ${esc(c.location)}</p>` : ''}
        ${c.description ? `<p>${esc(c.description)}</p>` : ''}`
      break
    }
    case 'app': {
      body = `
        <h1>${esc(c.name || 'App')}</h1>
        <div class="links">
          ${c.ios ? `<a href="${esc(c.ios)}" target="_blank" class="btn">🍎 App Store</a>` : ''}
          ${c.android ? `<a href="${esc(c.android)}" target="_blank" class="btn">🤖 Google Play</a>` : ''}
        </div>`
      break
    }
    case 'pdf':
    case 'image':
    case 'video': {
      const label = type === 'pdf' ? '📄 Open PDF' : type === 'image' ? '🖼 View Image' : '▶️ Watch Video'
      body = `
        <h1>${esc(c.title || type.toUpperCase())}</h1>
        ${c.description ? `<p>${esc(c.description)}</p>` : ''}
        ${c.url ? `<a href="${esc(c.url)}" target="_blank" class="cta">${label}</a>` : ''}`
      break
    }
    default:
      body = `<p>${esc(JSON.stringify(c))}</p>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR Code</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;background:#f5f5f3;min-height:100vh;display:flex;flex-direction:column;align-items:center}
  .header{width:100%;background:${color};padding:40px 24px 60px;text-align:center}
  .card{background:#fff;border-radius:20px;padding:28px 24px;max-width:400px;width:calc(100% - 32px);margin:-36px auto 24px;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  h1{font-size:1.4rem;font-weight:700;color:#111;margin-bottom:6px}
  .sub{color:#666;font-size:.95rem;margin-bottom:16px}
  .links{display:flex;flex-direction:column;gap:10px;margin-top:16px}
  .btn{display:block;padding:13px 18px;background:#f5f5f3;border-radius:12px;text-decoration:none;color:#111;font-size:.95rem;font-weight:500}
  .cta{display:block;margin-top:20px;padding:14px;background:${color};color:#fff;border-radius:14px;text-decoration:none;text-align:center;font-weight:600;font-size:1rem}
  .password-box{background:#f5f5f3;border-radius:12px;padding:14px 16px;margin:12px 0}
  .password-box .label{display:block;font-size:.75rem;color:#999;margin-bottom:4px}
  .pw{font-size:1.1rem;font-weight:600;letter-spacing:.05em;color:#111}
  .hint{font-size:.8rem;color:#999;margin-top:12px}
  .text-content{font-size:1rem;color:#333;line-height:1.6;white-space:pre-wrap}
  .addr{font-size:.85rem;color:#666;margin-top:12px}
</style>
</head>
<body>
<div class="header"></div>
<div class="card">${body}</div>
</body>
</html>`
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
