import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

async function apiReq(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
  return res.json()
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_TYPES = [
  { id: 'url',      icon: '🔗', label: 'Website',    desc: 'Redirect to any URL'        },
  { id: 'menu',     icon: '🍽️', label: 'Menu',       desc: 'Digital restaurant menu'    },
  { id: 'vcard',    icon: '👤', label: 'Contact',    desc: 'Mobile business card'       },
  { id: 'business', icon: '🏢', label: 'Business',   desc: 'Business info & hours'      },
  { id: 'links',    icon: '🔗', label: 'Multi-Link', desc: 'Link-in-bio style page'     },
  { id: 'social',   icon: '📱', label: 'Social',     desc: 'All social profiles in one' },
  { id: 'event',    icon: '📅', label: 'Event',      desc: 'Event details & RSVP'       },
  { id: 'coupon',   icon: '🎟️', label: 'Coupon',     desc: 'Discount or special offer'  },
  { id: 'feedback', icon: '⭐', label: 'Feedback',   desc: 'Request reviews & ratings'  },
  { id: 'wifi',     icon: '📶', label: 'WiFi',       desc: 'Share network credentials'  },
  { id: 'pdf',      icon: '📄', label: 'PDF',        desc: 'Share a document or file'   },
  { id: 'video',    icon: '🎥', label: 'Video',      desc: 'Link to a video'            },
]

const MGMT_TABS = [
  { id: 'active',    label: 'Active'    },
  { id: 'archived',  label: 'Archived'  },
  { id: 'stats',     label: 'Stats'     },
  { id: 'templates', label: 'Templates' },
  { id: 'folder',    label: 'Folder'    },
]

const DOT_STYLES = [
  { id: 'square',         label: 'Square'  },
  { id: 'rounded',        label: 'Rounded' },
  { id: 'dots',           label: 'Dots'    },
  { id: 'classy',         label: 'Classy'  },
  { id: 'classy-rounded', label: 'Classy+' },
  { id: 'extra-rounded',  label: 'Soft'    },
]
const CORNER_SQUARE_STYLES = [
  { id: 'square',        label: 'Square' },
  { id: 'extra-rounded', label: 'Round'  },
  { id: 'dot',           label: 'Dot'    },
]
const CORNER_DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dot',    label: 'Dot'    },
]

// Frame styles — scan-tab and circle are qr.io-style composited frames
const FRAME_STYLES = [
  { id: 'none',     label: 'None'     },
  { id: 'scan-tab', label: 'Scan Tab' },
  { id: 'circle',   label: 'Circle'   },
  { id: 'border',   label: 'Border'   },
  { id: 'text',     label: 'Text'     },
]

const FG_PALETTE = ['#000000','#1e293b','#1d4ed8','#7c3aed','#be185d','#dc2626','#ea580c','#16a34a']
const BG_PALETTE = ['#ffffff','#f8fafc','#f1f5f9','#e2e8f0','#1e293b','#0f172a','#000000','transparent']
const PAGE_COLOR_PALETTE = ['#e2e8f0','#f4a29a','#fef9c3','#bae6fd','#e9d5ff','#164e63','#374151','#166534','#1d4ed8','#7c3aed','#be185d','#dc2626','#ea580c','#0f766e']

function si(p) {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`)}`
}
const PRESET_LOGOS = [
  { id: 'wifi',  label: 'WiFi',      url: si('<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#000"/>') },
  { id: 'globe', label: 'Web',       url: si('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>') },
  { id: 'mail',  label: 'Email',     url: si('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>') },
  { id: 'phone', label: 'Phone',     url: si('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>') },
  { id: 'user',  label: 'vCard',     url: si('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
  { id: 'ig',    label: 'Instagram', url: si('<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>') },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT = 'w-full text-xs border border-gray-200 dark:border-[#3a3a38] rounded-xl px-3 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600'

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="shrink-0 border-t border-gray-100 dark:border-[#2e2e2c] pt-2.5">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full mb-2 cursor-pointer">
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform text-gray-400 ${open ? '' : '-rotate-90'}`}>
          <path d="M1 2.5l3 3 3-3"/>
        </svg>
      </button>
      {open && children}
    </div>
  )
}

function StyleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors ${
      active ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
             : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333330]'
    }`}>{children}</button>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer">
      <div onClick={() => onChange(!value)}
        className={`w-6 h-3.5 rounded-full transition-colors cursor-pointer flex items-center ${value ? 'bg-gray-700 dark:bg-gray-300' : 'bg-gray-200 dark:bg-[#3a3a38]'}`}>
        <div className={`w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-900 mx-0.5 transition-transform ${value ? 'translate-x-2.5' : ''}`} />
      </div>
      {label}
    </label>
  )
}

function ColorSwatch({ color, selected, onClick }) {
  const isT = color === 'transparent'
  return (
    <button onClick={onClick}
      className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0 border border-gray-200 dark:border-[#3a3a38]"
      style={{
        backgroundColor: isT ? 'transparent' : color,
        backgroundImage: isT ? 'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)' : undefined,
        backgroundSize: isT ? '6px 6px' : undefined,
        backgroundPosition: isT ? '0 0,3px 3px' : undefined,
        outline: selected ? `2px solid ${isT || color === '#ffffff' ? '#6b7280' : color}` : 'none',
        outlineOffset: '2px',
      }} />
  )
}

function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{title}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[180px] leading-relaxed">{desc}</p>
      {action && (
        <button onClick={onAction}
          className="mt-1 px-4 py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QRCodeTool() {
  const { user } = useAuth()
  const qrRef        = useRef(null)
  const logoFileRef  = useRef(null)
  const observerRef  = useRef(null)

  // ── API / list data ──
  const [qrCodes,    setQrCodes]    = useState([])
  const [loadingQRs, setLoadingQRs] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [savedCode,  setSavedCode]  = useState(null) // short_code after successful save

  // ── Mode, tabs, creation step ──
  const [mode,       setMode]       = useState('dynamic')
  const [mgmtTab,    setMgmtTab]    = useState('active')
  const [step,       setStep]       = useState(0)   // 0=list, 1=mode, 2=type, 3=content, 4=design
  const [pageType,   setPageType]   = useState(null)
  const [pageColor,  setPageColor]  = useState('#1d4ed8')

  // ── Dynamic content ──
  const [content, setContent] = useState({
    url:      { url: 'https://', buttonLabel: 'Visit Website' },
    menu:     { name: '', description: '' },
    vcard:    { name: '', title: '', phone: '', email: '', company: '', website: '' },
    business: { name: '', tagline: '', phone: '', email: '', address: '', hours: '' },
    links:    { title: '', bio: '' },
    social:   { name: '', bio: '', instagram: '', twitter: '', facebook: '', tiktok: '', linkedin: '', youtube: '' },
    event:    { name: '', date: '', time: '', location: '', description: '', rsvpUrl: '' },
    coupon:   { business: '', discount: '', code: '', expiry: '', terms: '' },
    feedback: { business: '', tagline: '', googleUrl: '', yelpUrl: '' },
    wifi:     { ssid: '', password: '', security: 'WPA' },
    pdf:      { title: '', description: '', fileUrl: '' },
    video:    { title: '', videoUrl: '' },
  })
  function setField(type, field, value) {
    setContent(c => ({ ...c, [type]: { ...c[type], [field]: value } }))
  }

  // ── Static type inputs ──
  const [staticType, setStaticType] = useState('url')
  const [urlVal,     setUrlVal]     = useState('https://dashpad.app')
  const [wifi,       setWifi]       = useState({ ssid: '', password: '', security: 'WPA', hidden: false })
  const [vcard,      setVcard]      = useState({ name: '', phone: '', email: '', company: '', website: '' })
  const [emailF,     setEmailF]     = useState({ to: '', subject: '', body: '' })
  const [sms,        setSms]        = useState({ phone: '', message: '' })
  const [textVal,    setTextVal]    = useState('')

  // ── QR style ──
  const [dotStyle,          setDotStyle]          = useState('rounded')
  const [cornerSquareStyle, setCornerSquareStyle] = useState('extra-rounded')
  const [cornerDotStyle,    setCornerDotStyle]    = useState('dot')
  const [dotColor,          setDotColor]          = useState('#000000')
  const [useGradient,       setUseGradient]       = useState(false)
  const [gradientColor2,    setGradientColor2]    = useState('#3b82f6')
  const [gradientAngle,     setGradientAngle]     = useState(0)
  const [cornerSquareColor, setCornerSquareColor] = useState('#000000')
  const [cornerDotColor,    setCornerDotColor]    = useState('#000000')
  const [bgColor,           setBgColor]           = useState('#ffffff')
  const [frameStyle,        setFrameStyle]        = useState('none')
  const [frameText,         setFrameText]         = useState('SCAN ME')
  const [frameFont,         setFrameFont]         = useState('sans-serif')
  const [frameColor,        setFrameColor]        = useState('#1d4ed8')
  const [logoUrl,           setLogoUrl]           = useState(null)
  const [logoSize,          setLogoSize]          = useState(0.3)
  const [removeLogoBg,      setRemoveLogoBg]      = useState(false)
  const [processedLogo,     setProcessedLogo]     = useState(null)
  const [qrSize,            setQrSize]            = useState(180)

  // ── QR data ──
  const qrData = useMemo(() => {
    if (mode === 'dynamic') return savedCode ? `https://dashqr.link/${savedCode}` : 'https://dashqr.link/preview'
    switch (staticType) {
      case 'url':   return urlVal || ' '
      case 'wifi':  return `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden};;`
      case 'vcard': {
        const l = ['BEGIN:VCARD','VERSION:3.0']
        if (vcard.name)    l.push(`FN:${vcard.name}`,`N:${vcard.name};;;;`)
        if (vcard.phone)   l.push(`TEL:${vcard.phone}`)
        if (vcard.email)   l.push(`EMAIL:${vcard.email}`)
        if (vcard.company) l.push(`ORG:${vcard.company}`)
        if (vcard.website) l.push(`URL:${vcard.website}`)
        l.push('END:VCARD'); return l.join('\n')
      }
      case 'email': return `mailto:${emailF.to}?subject=${encodeURIComponent(emailF.subject)}&body=${encodeURIComponent(emailF.body)}`
      case 'sms':   return `SMSTO:${sms.phone}:${sms.message}`
      case 'text':  return textVal || ' '
      default:      return ' '
    }
  }, [mode, staticType, urlVal, wifi, vcard, emailF, sms, textVal])

  // ── Logo bg removal ──
  useEffect(() => {
    if (!logoUrl)      { setProcessedLogo(null); return }
    if (!removeLogoBg) { setProcessedLogo(logoUrl); return }
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < d.data.length; i += 4)
        if (d.data[i] > 230 && d.data[i+1] > 230 && d.data[i+2] > 230) d.data[i+3] = 0
      ctx.putImageData(d, 0, 0); setProcessedLogo(c.toDataURL())
    }
    img.src = logoUrl
  }, [logoUrl, removeLogoBg])

  // ── QR options ──
  const buildOptions = useCallback(() => ({
    width: qrSize, height: qrSize, data: qrData,
    dotsOptions: useGradient
      ? { type: dotStyle, gradient: { type: 'linear', rotation: (gradientAngle * Math.PI) / 180, colorStops: [{ offset: 0, color: dotColor }, { offset: 1, color: gradientColor2 }] } }
      : { type: dotStyle, color: dotColor },
    cornersSquareOptions: { type: cornerSquareStyle, color: cornerSquareColor },
    cornersDotOptions:    { type: cornerDotStyle,    color: cornerDotColor    },
    backgroundOptions:    { color: bgColor === 'transparent' ? '#00000000' : bgColor },
    image:        processedLogo ?? undefined,
    imageOptions: { crossOrigin: 'anonymous', margin: 4, imageSize: logoSize },
    qrOptions:    { errorCorrectionLevel: processedLogo ? 'H' : 'M' },
  }), [qrData, qrSize, dotStyle, dotColor, useGradient, gradientColor2, gradientAngle, cornerSquareStyle, cornerSquareColor, cornerDotStyle, cornerDotColor, bgColor, processedLogo, logoSize])

  // ── Callback ref — fires when container mounts/unmounts ──
  const setContainerRef = useCallback(node => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null }
    if (!node) return
    if (!qrRef.current) qrRef.current = new QRCodeStyling({ width: 200, height: 200, data: ' ' })
    node.innerHTML = ''
    qrRef.current.append(node)
    observerRef.current = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setQrSize(Math.floor(w))
    })
    observerRef.current.observe(node)
  }, [])

  useEffect(() => { qrRef.current?.update(buildOptions()) }, [buildOptions])

  // ── Logo file ──
  function handleLogoFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setLogoUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Download with frame compositing ──
  async function download(ext) {
    if (frameStyle === 'none' || ext === 'svg') {
      qrRef.current?.download({ name: 'qr-code', extension: ext }); return
    }
    const blob = await qrRef.current.getRawData('png')
    const img = new Image()
    img.src = URL.createObjectURL(blob)
    await new Promise(r => { img.onload = r })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const bg = bgColor === 'transparent' ? '#ffffff' : bgColor

    if (frameStyle === 'scan-tab') {
      const pad = 14; const tabH = 36; const gap = 6
      canvas.width = qrSize + pad * 2
      canvas.height = qrSize + pad * 2 + gap + tabH
      ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height)
      // QR border
      ctx.strokeStyle = frameColor; ctx.lineWidth = 2
      rrect(ctx, 2, 2, canvas.width - 4, qrSize + pad * 2 - 4, 14); ctx.stroke()
      // QR
      ctx.drawImage(img, pad, pad, qrSize, qrSize)
      // Pill tab
      ctx.fillStyle = frameColor
      rrect(ctx, pad * 2, qrSize + pad + gap, qrSize - pad * 2, tabH, tabH / 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold 14px ${frameFont}`; ctx.textAlign = 'center'
      ctx.fillText((frameText || 'SCAN ME').toUpperCase(), canvas.width / 2, qrSize + pad + gap + tabH / 2 + 5)

    } else if (frameStyle === 'circle') {
      const pad = 14
      canvas.width = qrSize + pad * 2; canvas.height = qrSize + pad * 2
      ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Circle
      ctx.strokeStyle = frameColor; ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 4, 0, Math.PI * 2); ctx.stroke()
      ctx.drawImage(img, pad, pad, qrSize, qrSize)

    } else {
      const hasBorder = frameStyle === 'border' || frameStyle === 'both'
      const hasText   = frameStyle === 'text'   || frameStyle === 'both'
      const pad = hasBorder ? 12 : 0; const textH = hasText ? 32 : 0
      canvas.width = qrSize + pad * 2; canvas.height = qrSize + pad * 2 + textH
      ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (hasBorder) { ctx.strokeStyle = frameColor; ctx.lineWidth = 2; ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - textH - 8) }
      ctx.drawImage(img, pad, pad, qrSize, qrSize)
      if (hasText && frameText) {
        ctx.fillStyle = frameColor; ctx.font = `bold 13px ${frameFont}`; ctx.textAlign = 'center'
        ctx.fillText(frameText.toUpperCase(), canvas.width / 2, canvas.height - 10)
      }
    }

    canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'qr-code.png'; a.click() })
  }

  // ── Load QR codes from API ──
  const loadCodes = useCallback(async (archived = false) => {
    if (!user) return
    setLoadingQRs(true)
    try {
      const data = await apiReq('GET', `/api/qr?archived=${archived}`)
      setQrCodes(data)
    } catch (e) {
      console.error('Failed to load QR codes:', e)
    } finally {
      setLoadingQRs(false)
    }
  }, [user])

  useEffect(() => {
    if (step !== 0) return
    if (mgmtTab === 'active')   loadCodes(false)
    if (mgmtTab === 'archived') loadCodes(true)
    if (mgmtTab === 'stats')    loadCodes(false) // stats use active codes
  }, [step, mgmtTab, loadCodes])

  // ── Save a new dynamic QR code ──
  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const typeInfo = PAGE_TYPES.find(t => t.id === pageType)
      const qr = await apiReq('POST', '/api/qr', {
        name:            pageType === 'url' ? (content.url.url || 'Untitled') : (typeInfo?.label ?? pageType),
        type:            pageType,
        destination_url: pageType === 'url' ? (content.url.url || null) : null,
        content:         pageType !== 'url' ? (content[pageType] ?? null) : null,
        page_color:      pageColor,
      })
      setSavedCode(qr.short_code)
      // Show the real QR briefly, then return to the list
      setTimeout(() => {
        setStep(0)
        setMgmtTab('active')
        setSavedCode(null)
        setPageType(null)
      }, 1800)
    } catch (e) {
      console.error('Failed to save QR:', e)
    } finally {
      setSaving(false)
    }
  }

  // ── Archive / delete / copy ──
  async function handleArchive(qr) {
    try {
      await apiReq('PATCH', `/api/qr/${qr.id}`, { is_archived: !qr.is_archived })
      loadCodes(mgmtTab === 'archived')
    } catch (e) { console.error(e) }
  }

  async function handleDeleteQR(qr) {
    try {
      await apiReq('DELETE', `/api/qr/${qr.id}`)
      loadCodes(mgmtTab === 'archived')
    } catch (e) { console.error(e) }
  }

  function copyLink(qr) {
    navigator.clipboard.writeText(`https://dashqr.link/${qr.short_code}`)
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  function renderQRPreview() {
    if (frameStyle === 'scan-tab') {
      return (
        <div className="shrink-0 mx-auto w-full">
          <div className="rounded-xl overflow-hidden" style={{ outline: `2px solid ${frameColor}` }}>
            <div ref={setContainerRef} className="w-full aspect-square" />
          </div>
          <div className="mx-6 -mt-[1px] py-2 rounded-b-2xl text-center text-[11px] font-bold tracking-widest"
            style={{ backgroundColor: frameColor, color: '#fff' }}>
            {(frameText || 'SCAN ME').toUpperCase()}
          </div>
        </div>
      )
    }
    if (frameStyle === 'circle') {
      return (
        <div className="shrink-0 mx-auto w-full rounded-full overflow-hidden"
          style={{ outline: `3px solid ${frameColor}`, outlineOffset: '3px' }}>
          <div ref={setContainerRef} className="w-full aspect-square" />
        </div>
      )
    }
    const showBorder = frameStyle === 'border' || frameStyle === 'both'
    const showText   = frameStyle === 'text'   || frameStyle === 'both'
    return (
      <div className="shrink-0 mx-auto w-full rounded-xl overflow-hidden"
        style={showBorder ? { outline: `2px solid ${frameColor}` } : {}}>
        <div ref={setContainerRef} className="w-full aspect-square" />
        {showText && frameText && (
          <div className="text-center py-1.5 text-[11px] font-bold tracking-widest"
            style={{ color: frameColor, fontFamily: frameFont }}>
            {frameText.toUpperCase()}
          </div>
        )}
      </div>
    )
  }

  function renderLandingPreview() {
    if (!pageType) return null
    const c = content[pageType] || {}

    function Phone({ children }) {
      return (
        <div className="mx-auto rounded-[18px] border-2 border-gray-200 dark:border-[#3a3a38] overflow-hidden shadow-sm bg-white" style={{ width: 168 }}>
          <div className="h-4 bg-gray-100 flex items-center justify-center gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="w-8 h-1.5 rounded-full bg-gray-300" />
            <div className="w-1 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 300, fontSize: 9 }}>
            {children}
          </div>
        </div>
      )
    }

    if (pageType === 'url') {
      return (
        <div className="text-center py-8 flex flex-col items-center gap-2">
          <span className="text-3xl">🔗</span>
          <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300">Redirects directly to your URL</p>
          <p className="text-[9px] text-gray-400 dark:text-gray-500 max-w-[180px] leading-relaxed">No landing page — visitors go straight to <span className="text-blue-500 break-all">{c.url || 'your link'}</span></p>
        </div>
      )
    }

    if (pageType === 'vcard') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1 text-sm font-bold">
            {(c.name || 'A').charAt(0).toUpperCase()}
          </div>
          <p className="font-bold" style={{ fontSize: 10 }}>{c.name || 'Your Name'}</p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>{c.title || 'Job Title'}</p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{c.company || 'Company'}</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {c.phone   && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>📞</span>{c.phone}</div>}
          {c.email   && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>✉️</span>{c.email}</div>}
          {c.website && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>🌐</span>{c.website}</div>}
          <div className="mt-1 text-center text-white py-1 rounded" style={{ background: pageColor, fontSize: 8 }}>Save Contact</div>
        </div>
      </Phone>
    )

    if (pageType === 'wifi') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <span style={{ fontSize: 22 }}>📶</span>
          <p className="font-bold mt-1" style={{ fontSize: 10 }}>WiFi Access</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <p className="font-semibold" style={{ color: '#6b7280', fontSize: 8 }}>Network</p>
          <p className="font-bold" style={{ color: '#1f2937', fontSize: 11 }}>{c.ssid || 'Network Name'}</p>
          {c.password && <>
            <p className="font-semibold mt-1" style={{ color: '#6b7280', fontSize: 8 }}>Password</p>
            <div className="rounded px-2 py-1 font-mono" style={{ background: '#f3f4f6', color: '#374151', fontSize: 9 }}>{c.password}</div>
          </>}
          <div className="mt-2 text-center text-white py-1.5 rounded font-medium" style={{ background: pageColor, fontSize: 8 }}>Tap to Connect</div>
        </div>
      </Phone>
    )

    if (pageType === 'menu') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <span style={{ fontSize: 22 }}>🍽️</span>
          <p className="font-bold mt-1" style={{ fontSize: 10 }}>{c.name || 'Restaurant Name'}</p>
          {c.description && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{c.description}</p>}
        </div>
        <div className="p-2">
          {['Starters', 'Mains', 'Desserts', 'Drinks'].map(s => (
            <div key={s} className="mb-1.5">
              <p className="font-bold uppercase tracking-wide" style={{ fontSize: 7, color: '#9ca3af' }}>{s}</p>
              <div className="rounded p-1 italic" style={{ background: '#f9fafb', color: '#9ca3af', fontSize: 8 }}>Add items…</div>
            </div>
          ))}
        </div>
      </Phone>
    )

    if (pageType === 'business') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <p className="font-bold" style={{ fontSize: 10 }}>{c.name || 'Business Name'}</p>
          {c.tagline && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>{c.tagline}</p>}
        </div>
        <div className="p-2 flex flex-col gap-1">
          {c.phone   && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>📞</span>{c.phone}</div>}
          {c.email   && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>✉️</span>{c.email}</div>}
          {c.address && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>📍</span>{c.address}</div>}
          {c.hours   && <div className="mt-1"><p className="font-bold" style={{ fontSize: 7, color: '#9ca3af' }}>HOURS</p><p style={{ color: '#6b7280', whiteSpace: 'pre-line' }}>{c.hours}</p></div>}
        </div>
      </Phone>
    )

    if (pageType === 'links') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <p className="font-bold" style={{ fontSize: 10 }}>{c.title || 'Your Name'}</p>
          {c.bio && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{c.bio}</p>}
        </div>
        <div className="p-2 flex flex-col gap-1">
          {['Link 1', 'Link 2', 'Link 3'].map(l => (
            <div key={l} className="text-center py-1 rounded" style={{ border: '1px solid #e5e7eb', color: '#9ca3af', fontSize: 8 }}>{l}</div>
          ))}
        </div>
      </Phone>
    )

    if (pageType === 'social') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <div className="w-10 h-10 rounded-full mx-auto mb-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <p className="font-bold" style={{ fontSize: 10 }}>{c.name || 'Your Name'}</p>
          {c.bio && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{c.bio}</p>}
        </div>
        <div className="p-2 grid gap-1" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[['📸','Instagram'],['🐦','Twitter'],['🎵','TikTok'],['💼','LinkedIn'],['🎥','YouTube'],['👥','Facebook']].map(([icon, name]) => (
            <div key={name} className="rounded flex flex-col items-center py-1.5 gap-0.5" style={{ border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 7 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>{name}
            </div>
          ))}
        </div>
      </Phone>
    )

    if (pageType === 'event') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <span style={{ fontSize: 22 }}>📅</span>
          <p className="font-bold mt-1" style={{ fontSize: 10 }}>{c.name || 'Event Name'}</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {c.date     && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>📅</span>{c.date}{c.time && ` at ${c.time}`}</div>}
          {c.location && <div className="flex items-center gap-1" style={{ color: '#4b5563' }}><span>📍</span>{c.location}</div>}
          {c.description && <p style={{ color: '#6b7280', marginTop: 2 }}>{c.description}</p>}
          {c.rsvpUrl  && <div className="mt-2 text-center text-white py-1.5 rounded" style={{ background: pageColor, fontSize: 8 }}>RSVP Now</div>}
        </div>
      </Phone>
    )

    if (pageType === 'coupon') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <p className="font-bold" style={{ fontSize: 10 }}>{c.business || 'Business Name'}</p>
          <p className="font-black mt-0.5" style={{ fontSize: 26, lineHeight: 1.1 }}>{c.discount || '20% OFF'}</p>
        </div>
        <div className="p-2 text-center">
          {c.code && <>
            <p style={{ color: '#6b7280', fontSize: 7 }}>Use code</p>
            <div className="font-mono font-bold rounded px-2 py-1 my-0.5" style={{ border: '2px dashed #fca5a5', color: '#dc2626', fontSize: 10 }}>{c.code}</div>
          </>}
          {c.expiry && <p style={{ color: '#9ca3af', fontSize: 7 }}>Expires: {c.expiry}</p>}
          {c.terms   && <p style={{ color: '#9ca3af', fontSize: 7, marginTop: 2 }}>{c.terms}</p>}
        </div>
      </Phone>
    )

    if (pageType === 'feedback') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <p className="font-bold mt-1" style={{ fontSize: 10 }}>{c.business || 'Business Name'}</p>
          {c.tagline && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{c.tagline}</p>}
        </div>
        <div className="p-2 text-center flex flex-col gap-1">
          <p style={{ color: '#6b7280', fontSize: 8 }}>How was your experience?</p>
          <div className="flex justify-center" style={{ fontSize: 16, gap: 2 }}>⭐⭐⭐⭐⭐</div>
          {c.googleUrl && <div className="rounded py-1" style={{ border: '1px solid #e5e7eb', color: '#4b5563', fontSize: 8 }}>Google Review</div>}
          {c.yelpUrl   && <div className="rounded py-1" style={{ border: '1px solid #e5e7eb', color: '#4b5563', fontSize: 8 }}>Yelp Review</div>}
        </div>
      </Phone>
    )

    if (pageType === 'pdf') return (
      <Phone>
        <div className="p-3 text-center text-white" style={{ background: pageColor }}>
          <span style={{ fontSize: 22 }}>📄</span>
          <p className="font-bold mt-1" style={{ fontSize: 10 }}>{c.title || 'Document Title'}</p>
          {c.description && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>{c.description}</p>}
        </div>
        <div className="p-2 text-center">
          <div className="rounded flex items-center justify-center mb-2" style={{ border: '1px solid #e5e7eb', padding: 16 }}>
            <span style={{ fontSize: 28 }}>📄</span>
          </div>
          <div className="rounded py-1.5 text-white" style={{ background: pageColor, fontSize: 8 }}>View Document</div>
        </div>
      </Phone>
    )

    if (pageType === 'video') return (
      <Phone>
        <div className="flex items-center justify-center" style={{ background: '#000', aspectRatio: '16/9' }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white" style={{ fontSize: 12 }}>▶</span>
          </div>
        </div>
        <div className="p-2">
          <p className="font-bold" style={{ color: '#1f2937', fontSize: 10 }}>{c.title || 'Video Title'}</p>
          {c.videoUrl && <p className="truncate mt-0.5" style={{ color: '#3b82f6', fontSize: 8 }}>{c.videoUrl}</p>}
        </div>
      </Phone>
    )

    return null
  }

  function renderDesignPanel() {
    return (
      <div className="flex flex-col gap-3">
        {renderQRPreview()}

        <Section title="Dot Style">
          <div className="grid grid-cols-3 gap-1">
            {DOT_STYLES.map(s => <StyleBtn key={s.id} active={dotStyle === s.id} onClick={() => setDotStyle(s.id)}>{s.label}</StyleBtn>)}
          </div>
        </Section>

        <Section title="Marker Style">
          <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1">Border</p>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {CORNER_SQUARE_STYLES.map(s => <StyleBtn key={s.id} active={cornerSquareStyle === s.id} onClick={() => setCornerSquareStyle(s.id)}>{s.label}</StyleBtn>)}
          </div>
          <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1">Center</p>
          <div className="grid grid-cols-2 gap-1">
            {CORNER_DOT_STYLES.map(s => <StyleBtn key={s.id} active={cornerDotStyle === s.id} onClick={() => setCornerDotStyle(s.id)}>{s.label}</StyleBtn>)}
          </div>
        </Section>

        <Section title="Colors">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] text-gray-400 dark:text-gray-500">Dots</p>
              <Toggle value={useGradient} onChange={setUseGradient} label="Gradient" />
            </div>
            {useGradient ? (
              <div className="flex gap-2 items-center">
                <input type="color" value={dotColor} onChange={e => setDotColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border border-gray-200 dark:border-[#3a3a38] shrink-0" />
                <span className="text-[9px] text-gray-400">→</span>
                <input type="color" value={gradientColor2} onChange={e => setGradientColor2(e.target.value)} className="w-8 h-7 rounded cursor-pointer border border-gray-200 dark:border-[#3a3a38] shrink-0" />
                <div className="flex-1">
                  <input type="range" min="0" max="360" value={gradientAngle} onChange={e => setGradientAngle(+e.target.value)} className="w-full" style={{ accentColor: dotColor }} />
                  <p className="text-[9px] text-gray-400 text-center">{gradientAngle}°</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-1 flex-wrap mb-1.5">
                  {FG_PALETTE.map(c => <ColorSwatch key={c} color={c} selected={dotColor === c} onClick={() => setDotColor(c)} />)}
                </div>
                <input type="color" value={dotColor} onChange={e => setDotColor(e.target.value)} className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1">Marker Border</p>
              <input type="color" value={cornerSquareColor} onChange={e => setCornerSquareColor(e.target.value)} className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1">Marker Center</p>
              <input type="color" value={cornerDotColor} onChange={e => setCornerDotColor(e.target.value)} className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
            </div>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5">Background</p>
            <div className="flex gap-1 flex-wrap mb-1.5">
              {BG_PALETTE.map(c => <ColorSwatch key={c} color={c} selected={bgColor === c} onClick={() => setBgColor(c)} />)}
            </div>
            {bgColor !== 'transparent' && (
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
            )}
          </div>
        </Section>

        <Section title="Frame" defaultOpen={false}>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {FRAME_STYLES.map(s => <StyleBtn key={s.id} active={frameStyle === s.id} onClick={() => setFrameStyle(s.id)}>{s.label}</StyleBtn>)}
          </div>
          {frameStyle !== 'none' && (
            <div className="flex flex-col gap-1.5">
              {(frameStyle === 'scan-tab' || frameStyle === 'text' || frameStyle === 'both') && (
                <>
                  <input value={frameText} onChange={e => setFrameText(e.target.value)} placeholder="SCAN ME" className={INPUT} />
                  <select value={frameFont} onChange={e => setFrameFont(e.target.value)} className={INPUT}>
                    <option value="sans-serif">Sans-Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </>
              )}
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0">Color</p>
                <input type="color" value={frameColor} onChange={e => setFrameColor(e.target.value)} className="flex-1 h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
              </div>
            </div>
          )}
        </Section>

        <Section title="Logo" defaultOpen={false}>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {PRESET_LOGOS.map(p => (
              <button key={p.id} onClick={() => setLogoUrl(logoUrl === p.url ? null : p.url)} title={p.label}
                className={`w-8 h-8 rounded-lg border cursor-pointer transition-colors p-1 ${
                  logoUrl === p.url ? 'border-gray-700 dark:border-gray-300 bg-gray-100 dark:bg-[#2a2a28]' : 'border-gray-200 dark:border-[#3a3a38] hover:border-gray-400'
                }`}>
                <img src={p.url} className="w-full h-full" alt={p.label} />
              </button>
            ))}
            <input ref={logoFileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" id="qr-logo-file" />
            <label htmlFor="qr-logo-file" className="w-8 h-8 rounded-lg border border-dashed border-gray-200 dark:border-[#3a3a38] flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors text-gray-400">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
            </label>
          </div>
          {logoUrl && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <img src={logoUrl} className="w-8 h-8 rounded object-contain border border-gray-200 dark:border-[#3a3a38] shrink-0" />
                <div className="flex-1">
                  <input type="range" min="0.1" max="0.45" step="0.05" value={logoSize} onChange={e => setLogoSize(+e.target.value)} className="w-full" style={{ accentColor: dotColor }} />
                  <p className="text-[9px] text-gray-400 text-center">{Math.round(logoSize * 100)}% size</p>
                </div>
                <button onClick={() => { setLogoUrl(null); if (logoFileRef.current) logoFileRef.current.value = '' }} className="text-gray-300 hover:text-red-400 cursor-pointer transition-colors">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <Toggle value={removeLogoBg} onChange={setRemoveLogoBg} label="Remove white background" />
            </div>
          )}
        </Section>

        <div className="flex gap-2 pb-1">
          <button onClick={() => download('png')} className="flex-1 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
            Download PNG
          </button>
          <button onClick={() => download('svg')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 text-xs font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors">
            SVG
          </button>
        </div>
      </div>
    )
  }

  function renderContentForm() {
    if (!pageType) return null
    const c = content[pageType]
    const f = (field, placeholder, type = 'text') => (
      <input type={type} value={c[field] ?? ''} onChange={e => setField(pageType, field, e.target.value)} placeholder={placeholder} className={INPUT} />
    )
    const a = (field, placeholder, rows = 2) => (
      <textarea value={c[field] ?? ''} onChange={e => setField(pageType, field, e.target.value)} placeholder={placeholder} rows={rows} className={`${INPUT} resize-none`} />
    )

    const colorPicker = (
      <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100 dark:border-[#2e2e2c]">
        <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Page Color</p>
        <div className="flex gap-1 flex-wrap">
          {PAGE_COLOR_PALETTE.map(col => (
            <button key={col} onClick={() => setPageColor(col)}
              className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0 border border-gray-200 dark:border-[#3a3a38]"
              style={{ backgroundColor: col, outline: pageColor === col ? `2px solid ${col}` : 'none', outlineOffset: '2px' }} />
          ))}
        </div>
        <input type="color" value={pageColor} onChange={e => setPageColor(e.target.value)}
          className="w-full h-7 rounded-lg cursor-pointer border border-gray-200 dark:border-[#3a3a38]" />
      </div>
    )

    let fields = null
    switch (pageType) {
      case 'url':      fields = <>{f('url','Destination URL')}{f('buttonLabel','Button label')}</>; break
      case 'menu':     fields = <>{f('name','Restaurant / business name')}{a('description','Short tagline or description')}</>; break
      case 'vcard':    fields = <>{f('name','Full Name')}{f('title','Job Title')}{f('company','Company')}{f('phone','Phone')}{f('email','Email')}{f('website','Website')}</>; break
      case 'business': fields = <>{f('name','Business Name')}{f('tagline','Tagline')}{f('phone','Phone')}{f('email','Email')}{f('address','Address')}{a('hours','Hours (e.g. Mon–Fri 9am–5pm)')}</>; break
      case 'links':    fields = <>{f('title','Your name or brand')}{a('bio','Short bio')}</>; break
      case 'social':   fields = <>{f('name','Display name')}{a('bio','Bio')}{f('instagram','Instagram')}{f('twitter','X / Twitter')}{f('facebook','Facebook')}{f('tiktok','TikTok')}{f('linkedin','LinkedIn')}{f('youtube','YouTube')}</>; break
      case 'event':    fields = <>{f('name','Event name')}{f('date','Date','date')}{f('time','Time','time')}{f('location','Location')}{a('description','Description')}{f('rsvpUrl','RSVP link (optional)')}</>; break
      case 'coupon':   fields = <>{f('business','Business name')}{f('discount','Offer text (e.g. 20% off)')}{f('code','Coupon code (optional)')}{f('expiry','Expiry','date')}{a('terms','Terms & conditions')}</>; break
      case 'feedback': fields = <>{f('business','Business name')}{f('tagline','Tagline')}{f('googleUrl','Google Review URL')}{f('yelpUrl','Yelp URL (optional)')}</>; break
      case 'wifi':     fields = <>{f('ssid','Network name (SSID)')}<input type="password" value={c.password} onChange={e => setField('wifi','password',e.target.value)} placeholder="Password" className={INPUT} /><select value={c.security} onChange={e => setField('wifi','security',e.target.value)} className={INPUT}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></>; break
      case 'pdf':      fields = <>{f('title','Document title')}{a('description','Description')}{f('fileUrl','PDF URL')}</>; break
      case 'video':    fields = <>{f('title','Video title')}{f('videoUrl','Video URL')}</>; break
      default: return null
    }
    return (
      <div className="flex flex-col gap-1.5">
        {pageType !== 'url' && colorPicker}
        {fields}
      </div>
    )
  }

  function renderStaticForm() {
    const TYPES = [
      { id: 'url', label: 'URL' }, { id: 'wifi', label: 'WiFi' }, { id: 'vcard', label: 'vCard' },
      { id: 'email', label: 'Email' }, { id: 'sms', label: 'SMS' }, { id: 'text', label: 'Text' },
    ]
    return (
      <>
        <div className="flex gap-1 flex-wrap">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setStaticType(t.id)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
                staticType === t.id ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200'
              }`}>{t.label}</button>
          ))}
        </div>
        <div>
          {staticType === 'url'   && <input value={urlVal} onChange={e => setUrlVal(e.target.value)} placeholder="https://yoursite.com" className={INPUT} />}
          {staticType === 'wifi'  && <div className="flex flex-col gap-1.5"><input value={wifi.ssid} onChange={e => setWifi(w => ({...w,ssid:e.target.value}))} placeholder="SSID" className={INPUT} /><input type="password" value={wifi.password} onChange={e => setWifi(w => ({...w,password:e.target.value}))} placeholder="Password" className={INPUT} /><select value={wifi.security} onChange={e => setWifi(w => ({...w,security:e.target.value}))} className={INPUT}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></div>}
          {staticType === 'vcard' && <div className="flex flex-col gap-1.5">{[['name','Full Name'],['phone','Phone'],['email','Email'],['company','Company'],['website','Website']].map(([k,p]) => <input key={k} value={vcard[k]} onChange={e => setVcard(v => ({...v,[k]:e.target.value}))} placeholder={p} className={INPUT} />)}</div>}
          {staticType === 'email' && <div className="flex flex-col gap-1.5"><input value={emailF.to} onChange={e => setEmailF(f => ({...f,to:e.target.value}))} placeholder="To" className={INPUT} /><input value={emailF.subject} onChange={e => setEmailF(f => ({...f,subject:e.target.value}))} placeholder="Subject" className={INPUT} /><textarea value={emailF.body} onChange={e => setEmailF(f => ({...f,body:e.target.value}))} placeholder="Body" rows={2} className={`${INPUT} resize-none`} /></div>}
          {staticType === 'sms'   && <div className="flex flex-col gap-1.5"><input value={sms.phone} onChange={e => setSms(s => ({...s,phone:e.target.value}))} placeholder="Phone" className={INPUT} /><textarea value={sms.message} onChange={e => setSms(s => ({...s,message:e.target.value}))} placeholder="Message" rows={2} className={`${INPUT} resize-none`} /></div>}
          {staticType === 'text'  && <textarea value={textVal} onChange={e => setTextVal(e.target.value)} placeholder="Any text..." rows={3} className={`${INPUT} resize-none`} />}
        </div>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const backLabel = step === 1
    ? `Back to ${MGMT_TABS.find(t => t.id === mgmtTab)?.label ?? 'Active'}`
    : step === 2 ? 'Back to Mode'
    : step === 3 ? (mode === 'dynamic' ? 'Back to Type' : 'Back to Mode')
    : 'Back to Content'

  return (
    <div className="h-full flex flex-col gap-3 min-h-0 overflow-y-auto hide-scrollbar">

      {/* ── Tabs bar (step 0) or Back button (step > 0) ── */}
      <div className="flex shrink-0 items-center border-b border-gray-100 dark:border-[#2e2e2c] -mx-0.5 px-0.5">
        {step === 0 ? (
          MGMT_TABS.map(t => (
            <button key={t.id} onClick={() => setMgmtTab(t.id)}
              className={`flex-1 pb-1.5 text-[10px] font-medium cursor-pointer transition-colors border-b-2 ${
                mgmtTab === t.id
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}>{t.label}</button>
          ))
        ) : (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1 pb-1.5 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 1L2 4l3 3"/></svg>
            {backLabel}
          </button>
        )}
      </div>

      {/* ── Step indicator (dynamic, steps 2–4) ── */}
      {mode === 'dynamic' && step >= 2 && (
        <div className="flex items-center shrink-0">
          {['Type','Content','Design'].map((label, i) => {
            const indicatorStep = step - 1   // step 2 → 1, step 3 → 2, step 4 → 3
            const s = i + 1; const done = s < indicatorStep; const active = s === indicatorStep
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    done   ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900' :
                    active ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' :
                             'bg-gray-100 dark:bg-[#2a2a28] text-gray-400'
                  }`}>{done ? '✓' : s}</div>
                  <span className={`text-[10px] font-medium ${active ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-100 dark:bg-[#2e2e2c] mx-1.5" />}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Step 0: Tab content ── */}
      {step === 0 && mgmtTab === 'active' && (
        !user ? (
          <EmptyState icon="🔒" title="Sign in to manage QR codes" desc="Create an account to save, track, and update your QR codes" />
        ) : loadingQRs ? (
          <div className="text-center py-10 text-[11px] text-gray-400 dark:text-gray-500">Loading…</div>
        ) : qrCodes.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No active QR codes yet"
            desc="Create your first dynamic QR code — update the destination anytime without reprinting"
            action="+ Create QR Code"
            onAction={() => setStep(1)}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {qrCodes.map(qr => {
              const typeInfo = PAGE_TYPES.find(t => t.id === qr.type)
              return (
                <div key={qr.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-[#2e2e2c]">
                  <span className="text-base shrink-0">{typeInfo?.icon ?? '🔗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200 truncate">{qr.name || typeInfo?.label || qr.type}</p>
                    <p className="text-[9px] text-blue-500 truncate">dashqr.link/{qr.short_code}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">{qr.scan_count ?? 0} scan{qr.scan_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => copyLink(qr)} title="Copy link"
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button onClick={() => handleArchive(qr)} title="Archive"
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    </button>
                    <button onClick={() => handleDeleteQR(qr)} title="Delete"
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
            <button onClick={() => setStep(1)}
              className="w-full py-2 rounded-xl border border-dashed border-gray-200 dark:border-[#2e2e2c] text-[11px] text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors mt-1">
              + Create QR Code
            </button>
          </div>
        )
      )}
      {step === 0 && mgmtTab === 'archived' && (
        !user ? (
          <EmptyState icon="🔒" title="Sign in to manage QR codes" desc="Create an account to save, track, and update your QR codes" />
        ) : loadingQRs ? (
          <div className="text-center py-10 text-[11px] text-gray-400 dark:text-gray-500">Loading…</div>
        ) : qrCodes.length === 0 ? (
          <EmptyState icon="📦" title="No archived codes" desc="Deactivated QR codes will appear here" />
        ) : (
          <div className="flex flex-col gap-1.5">
            {qrCodes.map(qr => {
              const typeInfo = PAGE_TYPES.find(t => t.id === qr.type)
              return (
                <div key={qr.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-[#2e2e2c] opacity-60">
                  <span className="text-base shrink-0">{typeInfo?.icon ?? '🔗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200 truncate">{qr.name || typeInfo?.label || qr.type}</p>
                    <p className="text-[9px] text-gray-400 truncate">dashqr.link/{qr.short_code}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">{qr.scan_count ?? 0} scan{qr.scan_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handleArchive(qr)} title="Restore"
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.31"/></svg>
                    </button>
                    <button onClick={() => handleDeleteQR(qr)} title="Delete"
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
      {step === 0 && mgmtTab === 'stats' && (() => {
        const total = qrCodes.reduce((s, qr) => s + (qr.scan_count ?? 0), 0)
        const now = new Date()
        const thisMonth = qrCodes.reduce((s, qr) => {
          // scan_count is total — use it as best approximation for now
          return s + (qr.scan_count ?? 0)
        }, 0)
        const avgPerDay = qrCodes.length > 0 && total > 0
          ? (total / Math.max(1, Math.ceil((now - new Date(qrCodes[qrCodes.length - 1]?.created_at ?? now)) / 86400000))).toFixed(1)
          : '—'
        return (
          <div className="flex flex-col gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Total Scans',    total > 0 ? total.toLocaleString() : '0'],
                ['Active Codes',   qrCodes.length],
                ['Top Code',       qrCodes.sort((a,b) => (b.scan_count??0)-(a.scan_count??0))[0]?.name || '—'],
                ['Avg. Scans/Code', qrCodes.length > 0 ? (total / qrCodes.length).toFixed(1) : '—'],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-gray-100 dark:border-[#2e2e2c] p-3 text-center">
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-200 truncate">{String(val)}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {!user && <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">Sign in to see your real stats</p>}
          </div>
        )
      })()}
      {step === 0 && mgmtTab === 'templates' && (
        <EmptyState icon="🎨" title="No saved templates" desc="Save your QR design settings as a template to reuse across codes" action="+ Save Template" onAction={() => setStep(1)} />
      )}
      {step === 0 && mgmtTab === 'folder' && (
        <EmptyState icon="📁" title="No folders" desc="Organize your QR codes into folders by campaign, client, or location" action="+ New Folder" onAction={() => setStep(1)} />
      )}

      {/* ── Step 1: Dynamic / Static selection ── */}
      {step === 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Choose QR code type</p>
          {[
            { id: 'dynamic', icon: '⚡', label: 'Dynamic', desc: 'Change the destination anytime and track scan analytics. Best for campaigns, menus, and business cards.' },
            { id: 'static',  icon: '📷', label: 'Static',  desc: 'Fixed content encoded directly in the QR. Instant, no account needed. Best for WiFi, vCards, and one-off links.' },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setMode(opt.id); setStep(2) }}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#2e2e2c] hover:border-gray-300 dark:hover:border-[#3a3a38] text-left cursor-pointer transition-colors">
              <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{opt.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2 (dynamic): Page type grid ── */}
      {step === 2 && mode === 'dynamic' && (
        <div className="grid grid-cols-2 gap-1.5">
          {PAGE_TYPES.map(pt => (
            <button key={pt.id} onClick={() => { setPageType(pt.id); setStep(3) }}
              className={`flex items-start gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                pageType === pt.id
                  ? 'border-gray-700 dark:border-gray-300 bg-gray-50 dark:bg-[#2a2a28]'
                  : 'border-gray-100 dark:border-[#2e2e2c] hover:border-gray-300 dark:hover:border-[#3a3a38]'
              }`}>
              <span className="text-base leading-none mt-0.5">{pt.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 leading-snug">{pt.label}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-snug mt-0.5">{pt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2 (static): Form + design ── */}
      {step === 2 && mode === 'static' && (
        <div className="flex flex-col gap-3">
          {renderStaticForm()}
          {renderDesignPanel()}
        </div>
      )}

      {/* ── Step 3 (dynamic): Content form + landing preview ── */}
      {step === 3 && mode === 'dynamic' && pageType && (
        <div className="flex flex-col gap-3">

          {/* Type header */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{PAGE_TYPES.find(t => t.id === pageType)?.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{PAGE_TYPES.find(t => t.id === pageType)?.label}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500">{pageType === 'url' ? 'Enter destination URL' : 'Edit content · Preview page'}</p>
            </div>
          </div>

          {/* Content form */}
          {renderContentForm()}

          {/* Landing page preview */}
          {pageType !== 'url' && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 self-start uppercase tracking-wide">Page Preview</p>
              {renderLandingPreview()}
            </div>
          )}

          <button onClick={() => setStep(4)} className="w-full py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 transition-colors">
            Design QR →
          </button>
        </div>
      )}

      {/* ── Step 4 (dynamic): Design panel ── */}
      {step === 4 && mode === 'dynamic' && (
        <div className="flex flex-col gap-3">
          <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">Preview — final URL assigned on save</p>
          {renderDesignPanel()}
          <div className="pb-2">
            {savedCode ? (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">Saved!</p>
                </div>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">dashqr.link/{savedCode}</p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !user}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-xs font-semibold cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {saving ? 'Saving…' : 'Save & Generate QR Code'}
                </button>
                {!user && (
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center mt-1.5">Sign in to save QR codes</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
