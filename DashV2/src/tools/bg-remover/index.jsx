import { useState, useRef } from 'react'
import { removeBackground } from '@imgly/background-removal'

const BG_OPTIONS = [
  { id: 'transparent', label: 'Transparent' },
  { id: 'white',       label: 'White' },
  { id: 'black',       label: 'Black' },
  { id: 'custom',      label: 'Custom' },
]

// Checkerboard pattern to show transparency
const CHECKER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23ccc'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23ccc'/%3E%3Crect x='8' width='8' height='8' fill='%23fff'/%3E%3Crect y='8' width='8' height='8' fill='%23fff'/%3E%3C/svg%3E")`

export default function BgRemover() {
  const [resultUrl, setResultUrl]   = useState(null)
  const [loading, setLoading]       = useState(false)
  const [progress, setProgress]     = useState(0)
  const [progressLabel, setLabel]   = useState('')
  const [bg, setBg]                 = useState('transparent')
  const [customColor, setCustomColor] = useState('#00ff00')
  const [dragOver, setDragOver]     = useState(false)
  const inputRef = useRef(null)

  async function processFile(file) {
    if (!file?.type.startsWith('image/')) return
    setResultUrl(null)
    setLoading(true)
    setProgress(0)
    setLabel('Loading model…')
    try {
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const pct = total ? Math.round((current / total) * 100) : 0
          setProgress(pct)
          if (key.includes('fetch')) setLabel(`Downloading model… ${pct}%`)
          else if (key.includes('compute')) setLabel(`Processing… ${pct}%`)
        },
      })
      setResultUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function onFile(e) { processFile(e.target.files[0]) }
  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  async function download() {
    if (!resultUrl) return
    const resolvedColor = bg === 'custom' ? customColor : bg === 'white' ? '#ffffff' : bg === 'black' ? '#000000' : null

    if (!resolvedColor) {
      // Transparent — download directly
      const a = document.createElement('a')
      a.href = resultUrl; a.download = 'no-bg.png'; a.click()
      return
    }

    // Composite onto a solid color via canvas
    const img = new Image()
    img.src = resultUrl
    await new Promise(r => { img.onload = r })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = resolvedColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png'); a.download = 'no-bg.png'; a.click()
  }

  const previewBg = bg === 'transparent' ? CHECKER
    : bg === 'custom' ? customColor
    : bg === 'white' ? '#ffffff' : '#000000'

  return (
    <div className="h-full flex flex-col gap-2.5">

      {/* Drop zone / result preview */}
      <div
        className={`flex-1 min-h-0 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-colors cursor-pointer relative ${
          dragOver
            ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#2a2a28]'
            : 'border-dashed border-gray-200 dark:border-[#3a3a38]'
        }`}
        style={resultUrl ? { background: typeof previewBg === 'string' && previewBg.startsWith('url') ? undefined : previewBg, backgroundImage: typeof previewBg === 'string' && previewBg.startsWith('url') ? previewBg : undefined, backgroundSize: '16px 16px' } : {}}
        onClick={() => !loading && !resultUrl && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-400">
              <path d="M14 8A6 6 0 1 1 8 2"/>
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">{progressLabel}</p>
            {progress > 0 && (
              <div className="w-32 h-1 bg-gray-200 dark:bg-[#3a3a38] rounded-full overflow-hidden">
                <div className="h-full bg-gray-700 dark:bg-gray-300 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500">First run downloads the AI model (~60 MB) and caches it.</p>
          </div>
        ) : resultUrl ? (
          <img src={resultUrl} className="max-w-full max-h-full object-contain" alt="Result" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center select-none">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">Drop an image or click to upload</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600">Processed entirely in your browser</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      {/* Controls — only show when result is ready */}
      {resultUrl && (
        <>
          {/* Background picker */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">Background</span>
            <div className="flex items-center gap-1.5">
              {BG_OPTIONS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setBg(o.id)}
                  className={`px-2.5 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${
                    bg === o.id
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331]'
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {bg === 'custom' && (
                <input
                  type="color"
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#3a3a38] cursor-pointer p-0.5 bg-white dark:bg-[#2a2a28]"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={download}
              className="flex-1 py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
            >
              Download PNG
            </button>
            <button
              onClick={() => { setResultUrl(null); if (inputRef.current) inputRef.current.value = '' }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2e2e2c] text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors cursor-pointer"
            >
              New
            </button>
          </div>
        </>
      )}

      {/* Upload new while result shown — click hint */}
      {resultUrl && !loading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-center"
        >
          Upload a different image
        </button>
      )}
    </div>
  )
}
