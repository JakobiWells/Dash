import { useState, useRef, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://dashapi-production.up.railway.app'

// Load KaTeX from CDN once
let katexReady = false
let katexCallbacks = []
function ensureKatex(cb) {
  if (katexReady) { cb(); return }
  katexCallbacks.push(cb)
  if (document.getElementById('katex-css')) return
  const link = document.createElement('link')
  link.id = 'katex-css'
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
  document.head.appendChild(link)
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
  script.onload = () => {
    katexReady = true
    katexCallbacks.forEach(fn => fn())
    katexCallbacks = []
  }
  document.head.appendChild(script)
}

function renderLatex(tex) {
  if (!katexReady || !window.katex) return null
  try {
    return window.katex.renderToString(tex, { throwOnError: false, displayMode: true })
  } catch { return null }
}

export default function HandwritingConverter() {
  const [inputMode, setInputMode]   = useState('draw')   // 'draw' | 'upload'
  const [mathMode, setMathMode]     = useState('mixed')  // 'mixed' | 'math'
  const [status, setStatus]         = useState('idle')   // 'idle'|'loading'|'done'|'error'
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const [uploadImg, setUploadImg]   = useState(null)     // data URL
  const [katexLoaded, setKatexLoaded] = useState(false)
  const [penSize, setPenSize]       = useState(3)
  const [copied, setCopied]         = useState(false)

  const canvasRef  = useRef(null)
  const fileRef    = useRef(null)
  const drawing    = useRef(false)
  const lastPt     = useRef(null)

  // Load KaTeX
  useEffect(() => {
    ensureKatex(() => setKatexLoaded(true))
  }, [])

  // Init canvas white background
  useEffect(() => {
    if (inputMode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [inputMode])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  const onDown = useCallback((e) => {
    e.preventDefault()
    drawing.current = true
    lastPt.current = getPos(e, canvasRef.current)
  }, [])

  const onMove = useCallback((e) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pt = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPt.current.x, lastPt.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPt.current = pt
  }, [penSize])

  const onUp = useCallback(() => { drawing.current = false }, [])

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setResult(null)
    setStatus('idle')
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setUploadImg(ev.target.result)
    reader.readAsDataURL(file)
    setResult(null)
    setStatus('idle')
  }

  async function convert() {
    setStatus('loading')
    setError('')
    setResult(null)

    try {
      let blob
      if (inputMode === 'draw') {
        blob = await new Promise(res => canvasRef.current.toBlob(res, 'image/png'))
      } else {
        const r = await fetch(uploadImg)
        blob = await r.blob()
      }

      const fd = new FormData()
      fd.append('file', blob, 'input.png')
      fd.append('mode', mathMode)

      const res = await fetch(`${API}/api/p2t/convert`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setStatus('done')
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  function copyRaw() {
    if (!result?.raw) return
    navigator.clipboard.writeText(result.raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Build rendered output from segments
  function renderSegments(segments) {
    return segments.map((seg, i) => {
      if (seg.type === 'formula') {
        const html = katexLoaded ? renderLatex(seg.text) : null
        if (html) return (
          <div key={i} className="my-1 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }} />
        )
        return (
          <code key={i} className="block my-1 text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
            {seg.text}
          </code>
        )
      }
      return <p key={i} className="text-sm text-gray-800">{seg.text}</p>
    })
  }

  return (
    <div className="h-full flex flex-col gap-2.5">

      {/* Mode toggles */}
      <div className="flex gap-2">
        <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg text-xs">
          {['draw', 'upload'].map(m => (
            <button key={m} onClick={() => { setInputMode(m); setResult(null); setStatus('idle') }}
              className={`px-2.5 py-1 rounded-md font-medium capitalize cursor-pointer transition-colors
                ${inputMode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {m === 'draw' ? '✏️ Draw' : '🖼 Upload'}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg text-xs ml-auto">
          {[['mixed', 'Text + Math'], ['math', 'Math only']].map(([m, label]) => (
            <button key={m} onClick={() => setMathMode(m)}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors
                ${mathMode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas / Upload area */}
      {inputMode === 'draw' ? (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <canvas
            ref={canvasRef}
            width={600} height={300}
            className="w-full rounded-xl border border-gray-200 touch-none cursor-crosshair bg-white"
            style={{ flex: '1 1 0', minHeight: 0 }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Pen</span>
            {[2, 3, 5].map(s => (
              <button key={s} onClick={() => setPenSize(s)}
                className={`rounded-full transition-colors cursor-pointer
                  ${penSize === s ? 'bg-gray-800' : 'bg-gray-300 hover:bg-gray-400'}`}
                style={{ width: s * 4 + 4, height: s * 4 + 4 }} />
            ))}
            <button onClick={clearCanvas}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          {uploadImg ? (
            <div className="relative flex-1 min-h-0 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              <img src={uploadImg} alt="upload" className="w-full h-full object-contain" />
              <button onClick={() => { setUploadImg(null); setResult(null); setStatus('idle') }}
                className="absolute top-2 right-2 text-xs bg-white/90 border border-gray-200 rounded-md px-2 py-0.5 hover:bg-gray-50 cursor-pointer">
                Remove
              </button>
            </div>
          ) : (
            <button onClick={() => { if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click() } }}
              className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="text-2xl">🖼</span>
              <span className="text-sm text-gray-400">Click to upload image</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {/* Convert button */}
      <button
        onClick={convert}
        disabled={status === 'loading' || (inputMode === 'upload' && !uploadImg)}
        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
        {status === 'loading' ? <span className="flex items-center justify-center gap-2"><Spinner />Converting…</span> : 'Convert'}
      </button>

      {/* Result */}
      {status === 'done' && result && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Result</span>
            <button onClick={copyRaw}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              {copied ? '✓ Copied' : 'Copy LaTeX'}
            </button>
          </div>
          <div className="min-h-[2rem]">
            {renderSegments(result.segments || [])}
          </div>
        </div>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}
