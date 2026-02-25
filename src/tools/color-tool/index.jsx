import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Color math ───────────────────────────────────────────────────────────────

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100
  const f = n => {
    const k = (n + h / 60) % 6
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255)
  }
  return { r: f(5), g: f(3), b: f(1) }
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = (((g - b) / d % 6) + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = Math.round(h * 60)
  }
  return { h, s: max ? Math.round(d / max * 100) : 0, v: Math.round(max * 100) }
}

function hsvToHsl(h, s, v) {
  s /= 100; v /= 100
  const l = v * (1 - s / 2)
  const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l)
  return { h, s: Math.round(sl * 100), l: Math.round(l * 100) }
}

function hslToHsv(h, s, l) {
  s /= 100; l /= 100
  const v = l + s * Math.min(l, 1 - l)
  const sv = v ? 2 * (1 - l / v) : 0
  return { h, s: Math.round(sv * 100), v: Math.round(v * 100) }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  if (hex.length !== 6 || !/^[0-9a-fA-F]+$/.test(hex)) return null
  const n = parseInt(hex, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Number input that doesn't fight the user while typing
function NumInput({ value, min, max, onChange }) {
  const [local, setLocal] = useState(String(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setLocal(String(value))
  }, [value])

  return (
    <input
      className="w-10 text-center text-xs bg-gray-50 border border-gray-200 rounded px-0.5 py-1 focus:outline-none focus:border-gray-400 tabular-nums"
      value={local}
      onChange={e => {
        setLocal(e.target.value)
        const n = parseInt(e.target.value, 10)
        if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
      }}
      onFocus={() => { focused.current = true }}
      onBlur={() => {
        focused.current = false
        const n = parseInt(local, 10)
        if (isNaN(n)) setLocal(String(value))
        else onChange(Math.max(min, Math.min(max, n)))
      }}
    />
  )
}

function CopyBtn({ text, label, copied, onCopy }) {
  return (
    <button
      onClick={() => onCopy(text, label)}
      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      {copied === label ? '✓' : 'copy'}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ColorTool() {
  const [hsv, setHsv] = useState({ h: 210, s: 75, v: 90 })
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(null)
  const [hexInput, setHexInput] = useState('')

  const hexFocused = useRef(false)
  const squareRef = useRef(null)
  const hueRef = useRef(null)
  const dragging = useRef(null) // 'square' | 'hue' | null
  const hsvRef = useRef(hsv)
  useEffect(() => { hsvRef.current = hsv }, [hsv])

  // Derived values
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v)
  const hsl = hsvToHsl(hsv.h, hsv.s, hsv.v)
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window

  // Keep hex input in sync when color changes externally
  useEffect(() => {
    if (!hexFocused.current) setHexInput(hex)
  }, [hex])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const updateSquare = useCallback((clientX, clientY) => {
    const rect = squareRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    setHsv(prev => ({ ...prev, s: Math.round(x * 100), v: Math.round((1 - y) * 100) }))
  }, [])

  const updateHue = useCallback((clientX) => {
    const rect = hueRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setHsv(prev => ({ ...prev, h: Math.round(x * 360) }))
  }, [])

  const commitToHistory = useCallback(() => {
    const { h, s, v } = hsvRef.current
    const { r, g, b } = hsvToRgb(h, s, v)
    const newHex = rgbToHex(r, g, b)
    setHistory(prev => [newHex, ...prev.filter(c => c !== newHex)].slice(0, 10))
  }, [])

  useEffect(() => {
    const onMove = e => {
      if (dragging.current === 'square') updateSquare(e.clientX, e.clientY)
      if (dragging.current === 'hue') updateHue(e.clientX)
    }
    const onUp = () => {
      if (dragging.current) commitToHistory()
      dragging.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [updateSquare, updateHue, commitToHistory])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function copy(text, label) {
    try { await navigator.clipboard.writeText(text) } catch { return }
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  async function pickFromScreen() {
    if (!hasEyeDropper) return
    try {
      const { sRGBHex } = await new window.EyeDropper().open()
      const parsed = hexToRgb(sRGBHex)
      if (!parsed) return
      setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b))
      setHistory(prev => [sRGBHex, ...prev.filter(c => c !== sRGBHex)].slice(0, 10))
    } catch {}
  }

  function setFromHex(h) {
    const parsed = hexToRgb(h)
    if (parsed) setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col gap-2">

      {/* Color gradient square — saturation (x) × value (y) */}
      <div
        ref={squareRef}
        className="flex-1 relative rounded-lg overflow-hidden cursor-crosshair select-none"
        style={{
          minHeight: 80,
          background: `
            linear-gradient(to bottom, transparent, #000),
            linear-gradient(to right, #fff, transparent),
            hsl(${hsv.h}, 100%, 50%)
          `,
        }}
        onMouseDown={e => {
          e.preventDefault()
          dragging.current = 'square'
          updateSquare(e.clientX, e.clientY)
        }}
      >
        {/* Picker dot */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: hex,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="h-3.5 rounded-full cursor-pointer relative select-none shrink-0"
        style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
        onMouseDown={e => {
          e.preventDefault()
          dragging.current = 'hue'
          updateHue(e.clientX)
        }}
      >
        {/* Hue dot */}
        <div
          className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          }}
        />
      </div>

      {/* Preview row */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-lg border border-gray-200 shrink-0"
          style={{ backgroundColor: hex }}
        />
        {hasEyeDropper && (
          <button
            onClick={pickFromScreen}
            title="Pick color from screen"
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
          >
            {/* Eyedropper icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 13.5V20h6.5l9.56-9.56-6.5-6.5L2 13.5z"/>
              <path d="M14.5 4.5l5 5"/>
              <path d="M16 3l5 5-1.5 1.5-5-5L16 3z"/>
            </svg>
          </button>
        )}
        <span className="flex-1 text-xs font-mono text-gray-600 select-all">{hex}</span>
        <CopyBtn text={hex} label="hex" copied={copied} onCopy={copy} />
      </div>

      {/* HEX input */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-7 text-right text-[11px] text-gray-400 shrink-0">HEX</span>
        <input
          className="flex-1 text-center text-xs bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none focus:border-gray-400 font-mono"
          value={hexInput}
          placeholder="#000000"
          onChange={e => {
            const val = e.target.value
            setHexInput(val)
            const parsed = hexToRgb(val)
            if (parsed) setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b))
          }}
          onFocus={() => { hexFocused.current = true }}
          onBlur={() => { hexFocused.current = false; setHexInput(hex) }}
        />
      </div>

      {/* RGB */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-7 text-right text-[11px] text-gray-400 shrink-0">RGB</span>
        <NumInput value={rgb.r} min={0} max={255} onChange={r => setHsv(rgbToHsv(r, rgb.g, rgb.b))} />
        <NumInput value={rgb.g} min={0} max={255} onChange={g => setHsv(rgbToHsv(rgb.r, g, rgb.b))} />
        <NumInput value={rgb.b} min={0} max={255} onChange={b => setHsv(rgbToHsv(rgb.r, rgb.g, b))} />
        <CopyBtn text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} label="rgb" copied={copied} onCopy={copy} />
      </div>

      {/* HSL */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-7 text-right text-[11px] text-gray-400 shrink-0">HSL</span>
        <NumInput value={hsl.h} min={0} max={360} onChange={h => setHsv(hslToHsv(h, hsl.s, hsl.l))} />
        <NumInput value={hsl.s} min={0} max={100} onChange={s => setHsv(hslToHsv(hsl.h, s, hsl.l))} />
        <NumInput value={hsl.l} min={0} max={100} onChange={l => setHsv(hslToHsv(hsl.h, hsl.s, l))} />
        <CopyBtn text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="hsl" copied={copied} onCopy={copy} />
      </div>

      {/* HSV */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-7 text-right text-[11px] text-gray-400 shrink-0">HSV</span>
        <NumInput value={hsv.h} min={0} max={360} onChange={h => setHsv(prev => ({ ...prev, h }))} />
        <NumInput value={hsv.s} min={0} max={100} onChange={s => setHsv(prev => ({ ...prev, s }))} />
        <NumInput value={hsv.v} min={0} max={100} onChange={v => setHsv(prev => ({ ...prev, v }))} />
        <CopyBtn text={`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`} label="hsv" copied={copied} onCopy={copy} />
      </div>

      {/* Color history */}
      {history.length > 0 && (
        <div className="flex gap-1 shrink-0 flex-wrap pt-0.5">
          {history.map((c, i) => (
            <button
              key={i}
              title={c}
              onClick={() => setFromHex(c)}
              className="w-6 h-6 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform shrink-0"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

    </div>
  )
}
