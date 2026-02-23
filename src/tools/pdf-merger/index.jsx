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

async function renderFirstPageThumb(fileRaw, thumbWidth = 48) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
  const pdf = await pdfjs.getDocument(await fileRaw.arrayBuffer()).promise
  const page = await pdf.getPage(1)
  const vp = page.getViewport({ scale: 1 })
  const scale = thumbWidth / vp.width
  const scaledVp = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = scaledVp.width
  canvas.height = scaledVp.height
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: scaledVp }).promise
  return canvas.toDataURL()
}

export default function PdfMerger() {
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null) // 'merging' | 'done' | 'error'
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const addFiles = useCallback((incoming) => {
    const pdfs = Array.from(incoming).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    if (!pdfs.length) return
    setStatus(null)

    const newEntries = pdfs.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      raw: f,
      thumb: null, // loads async below
    }))

    setFiles(prev => [...prev, ...newEntries])

    // Render first-page thumbnails asynchronously
    newEntries.forEach(entry => {
      renderFirstPageThumb(entry.raw).then(thumb => {
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, thumb } : f))
      }).catch(() => {}) // silently skip if thumb fails
    })
  }, [])

  // Global filedrop CustomEvent from Grid overlay
  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    const handler = (e) => addFiles(e.detail.files)
    el.addEventListener('filedrop', handler)
    return () => el.removeEventListener('filedrop', handler)
  }, [addFiles])

  function moveUp(index) {
    if (index === 0) return
    setFiles(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  function moveDown(index) {
    setFiles(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  function remove(id) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  async function handleMerge() {
    if (files.length < 2) return
    setStatus('merging')
    setError(null)
    try {
      const merged = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.raw.arrayBuffer()
        const doc = await PDFDocument.load(bytes)
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const outBytes = await merged.save()
      download(new Blob([outBytes], { type: 'application/pdf' }), 'merged.pdf')
      setStatus('done')
    } catch (err) {
      setError(err.message ?? 'Failed to merge PDFs')
      setStatus('error')
    }
  }

  const hasFiles = files.length > 0

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        data-file-drop-target
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed
          cursor-pointer transition-colors select-none
          ${hasFiles ? 'py-3' : 'flex-1'}
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="text-xs text-gray-400">
          {hasFiles ? 'Add more PDFs' : 'Drop PDFs here or click to browse'}
        </p>
      </div>

      {/* File list */}
      {hasFiles && (
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {files.map((file, i) => (
            <div key={file.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-gray-50 border border-gray-100">
              {/* Page thumbnail */}
              <div className="shrink-0 w-8 h-10 rounded overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                {file.thumb ? (
                  <img src={file.thumb} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <span className="text-[9px] text-gray-300">PDF</span>
                )}
              </div>

              <span className="flex-1 text-sm text-gray-700 truncate min-w-0">{file.name}</span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
                  aria-label="Move up"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === files.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-default"
                  aria-label="Move down"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  onClick={() => remove(file.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                  aria-label="Remove"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {hasFiles && (
          <span className="text-xs text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''}</span>
        )}
        <button
          onClick={handleMerge}
          disabled={files.length < 2 || status === 'merging'}
          className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
            disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
            bg-gray-900 text-white hover:bg-gray-700"
        >
          {status === 'merging' ? 'Merging…' : 'Merge PDFs'}
        </button>
      </div>

      {status === 'done' && <p className="text-xs text-green-500 text-center">Download started!</p>}
      {status === 'error' && <p className="text-xs text-red-400 text-center">{error}</p>}
      {files.length === 1 && status !== 'error' && (
        <p className="text-xs text-gray-400 text-center">Add at least one more PDF to merge</p>
      )}
    </div>
  )
}
