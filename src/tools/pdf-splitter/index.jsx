import { useState, useRef, useCallback, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function baseName(filename) {
  return filename.replace(/\.pdf$/i, '')
}

async function renderThumbnails(fileRaw, thumbWidth = 80) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
  const pdf = await pdfjs.getDocument(await fileRaw.arrayBuffer()).promise
  const thumbs = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const vp = page.getViewport({ scale: 1 })
    const scale = thumbWidth / vp.width
    const scaledVp = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = scaledVp.width
    canvas.height = scaledVp.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: scaledVp }).promise
    thumbs.push(canvas.toDataURL())
  }
  return thumbs
}

export default function PdfSplitter() {
  const [file, setFile] = useState(null)       // { raw, name, pageCount }
  const [thumbs, setThumbs] = useState(null)   // null = not loaded, string[] = ready
  const [thumbsLoading, setThumbsLoading] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const lastClickedRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null)   // 'working' | 'done' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const loadFile = useCallback(async (f) => {
    if (!f || (!f.type.includes('pdf') && !f.name.endsWith('.pdf'))) return
    try {
      const bytes = await f.arrayBuffer()
      const doc = await PDFDocument.load(bytes)
      const pageCount = doc.getPageCount()
      setFile({ raw: f, name: f.name, pageCount })
      setSelected(new Set())
      lastClickedRef.current = null
      setStatus(null)
      setStatusMsg('')
      setThumbs(null)
      setThumbsLoading(true)
      const result = await renderThumbnails(f)
      setThumbs(result)
      setThumbsLoading(false)
    } catch {
      setStatus('error')
      setStatusMsg('Could not read PDF')
      setThumbsLoading(false)
    }
  }, [])

  // Global filedrop CustomEvent from Grid overlay
  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    const handler = (e) => loadFile(e.detail.files[0])
    el.addEventListener('filedrop', handler)
    return () => el.removeEventListener('filedrop', handler)
  }, [loadFile])

  function togglePage(pageNum, shiftKey) {
    setSelected(prev => {
      const next = new Set(prev)
      if (shiftKey && lastClickedRef.current !== null) {
        const from = Math.min(lastClickedRef.current, pageNum)
        const to = Math.max(lastClickedRef.current, pageNum)
        for (let i = from; i <= to; i++) next.add(i)
      } else {
        if (next.has(pageNum)) next.delete(pageNum)
        else next.add(pageNum)
      }
      return next
    })
    lastClickedRef.current = pageNum
  }

  function selectAll() {
    setSelected(new Set(Array.from({ length: file.pageCount }, (_, i) => i + 1)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function handleExtract() {
    if (!file || selected.size === 0) return
    const pages = [...selected].sort((a, b) => a - b)
    setStatus('working')
    setStatusMsg('Extracting…')
    try {
      const bytes = await file.raw.arrayBuffer()
      const src = await PDFDocument.load(bytes)
      const out = await PDFDocument.create()
      const copied = await out.copyPages(src, pages.map(n => n - 1))
      copied.forEach(p => out.addPage(p))
      const outBytes = await out.save()
      const label = pages.join('-')
      download(new Blob([outBytes], { type: 'application/pdf' }), `${baseName(file.name)}-pages-${label}.pdf`)
      setStatus('done')
      setStatusMsg('Download started!')
    } catch (err) {
      setStatus('error')
      setStatusMsg(err.message ?? 'Extraction failed')
    }
  }

  async function handleSplitAll() {
    if (!file) return
    setStatus('working')
    setStatusMsg(`Splitting into ${file.pageCount} files…`)
    try {
      const bytes = await file.raw.arrayBuffer()
      const src = await PDFDocument.load(bytes)
      const base = baseName(file.name)
      for (let i = 0; i < file.pageCount; i++) {
        const out = await PDFDocument.create()
        const [page] = await out.copyPages(src, [i])
        out.addPage(page)
        const outBytes = await out.save()
        download(new Blob([outBytes], { type: 'application/pdf' }), `${base}-page-${i + 1}.pdf`)
        await new Promise(r => setTimeout(r, 80))
      }
      setStatus('done')
      setStatusMsg(`${file.pageCount} files downloaded!`)
    } catch (err) {
      setStatus('error')
      setStatusMsg(err.message ?? 'Split failed')
    }
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        data-file-drop-target
        onDrop={(e) => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files[0]) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !file && inputRef.current?.click()}
        className={`
          flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed
          transition-colors select-none
          ${file ? 'py-2.5 cursor-default' : 'flex-1 flex-col cursor-pointer'}
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => loadFile(e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center gap-3 px-3 w-full">
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{file.pageCount} page{file.pageCount !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setThumbs(null); setSelected(new Set()); setStatus(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-xs text-gray-400">Drop a PDF here or click to browse</p>
          </>
        )}
      </div>

      {/* Thumbnail grid */}
      {file && (
        <>
          {thumbsLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-gray-400">Rendering pages…</p>
            </div>
          )}

          {thumbs && (
            <>
              {/* Selection controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 flex-1">
                  {selected.size === 0
                    ? 'Click pages to select · Shift+click for range'
                    : `${selected.size} of ${file.pageCount} pages selected`}
                </span>
                {selected.size > 0
                  ? <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Clear</button>
                  : <button onClick={selectAll} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">All</button>
                }
              </div>

              {/* Thumbnails */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                  {thumbs.map((src, i) => {
                    const pageNum = i + 1
                    const isSelected = selected.has(pageNum)
                    return (
                      <button
                        key={pageNum}
                        onClick={(e) => togglePage(pageNum, e.shiftKey)}
                        className={`
                          flex flex-col items-center gap-1 rounded-lg p-1 cursor-pointer transition-colors
                          ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className={`relative w-full rounded overflow-hidden border-2 transition-colors ${isSelected ? 'border-blue-400' : 'border-gray-200'}`}>
                          <img src={src} alt={`Page ${pageNum}`} className="w-full block" draggable={false} />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{pageNum}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExtract}
                  disabled={selected.size === 0 || status === 'working'}
                  className="w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
                    bg-gray-900 text-white hover:bg-gray-700"
                >
                  {status === 'working' && selected.size > 0
                    ? 'Extracting…'
                    : selected.size > 0
                      ? `Extract ${selected.size} page${selected.size !== 1 ? 's' : ''}`
                      : 'Extract pages'}
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300">or</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                <button
                  onClick={handleSplitAll}
                  disabled={status === 'working'}
                  className="w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-700
                    hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Split into {file.pageCount} individual PDF{file.pageCount !== 1 ? 's' : ''}
                </button>

                {status === 'done' && <p className="text-xs text-green-500 text-center">{statusMsg}</p>}
                {status === 'error' && <p className="text-xs text-red-400 text-center">{statusMsg}</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
