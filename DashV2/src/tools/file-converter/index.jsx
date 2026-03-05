import { useState, useRef, useCallback, useEffect } from 'react'
import { convert, getCategory } from './converter'

const CONVERSION_MAP = {
  png:  ['jpg', 'webp', 'gif', 'bmp', 'tiff'],
  jpg:  ['png', 'webp', 'gif', 'bmp', 'tiff'],
  jpeg: ['png', 'webp', 'gif', 'bmp', 'tiff'],
  webp: ['png', 'jpg', 'gif', 'bmp', 'tiff'],
  gif:  ['png', 'jpg', 'webp'],
  bmp:  ['png', 'jpg', 'webp'],
  tiff: ['png', 'jpg', 'webp'],
  svg:  ['png', 'jpg', 'webp'],
  mp3:  ['wav', 'ogg', 'flac', 'm4a'],
  wav:  ['mp3', 'ogg', 'flac', 'm4a'],
  ogg:  ['mp3', 'wav', 'flac'],
  flac: ['mp3', 'wav', 'ogg'],
  m4a:  ['mp3', 'wav', 'ogg'],
  aac:  ['mp3', 'wav', 'ogg'],
  mp4:  ['mov', 'avi', 'webm', 'mkv', 'gif'],
  mov:  ['mp4', 'avi', 'webm', 'mkv'],
  avi:  ['mp4', 'mov', 'webm', 'mkv'],
  webm: ['mp4', 'mov', 'avi', 'mkv'],
  mkv:  ['mp4', 'mov', 'avi', 'webm'],
  pdf:  ['docx', 'txt', 'png', 'jpg'],
  docx: ['pdf', 'txt', 'html', 'md'],
  doc:  ['pdf', 'docx', 'txt'],
  txt:  ['pdf', 'docx', 'md', 'html'],
  md:   ['pdf', 'html', 'txt', 'docx'],
  html: ['pdf', 'txt', 'md'],
  xlsx: ['csv', 'pdf'],
  xls:  ['xlsx', 'csv', 'pdf'],
  csv:  ['xlsx', 'pdf'],
  pptx: ['pdf'],
  ppt:  ['pdf', 'pptx'],
}

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileConverter() {
  const [file, setFile] = useState(null)
  const [outputFormat, setOutputFormat] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [outputs, setOutputs] = useState([])
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const handleFile = useCallback((f) => {
    const ext = getExtension(f.name)
    const formats = CONVERSION_MAP[ext] ?? []
    setFile({ raw: f, ext, formats })
    setOutputFormat(formats[0] ?? '')
    setStatus(null)
    setError(null)
    setProgress(0)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    function onFileDrop(e) {
      const f = e.detail.files[0]
      if (f) handleFile(f)
    }
    el.addEventListener('filedrop', onFileDrop)
    return () => el.removeEventListener('filedrop', onFileDrop)
  }, [handleFile])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e) => { const f = e.target.files[0]; if (f) handleFile(f) }

  const handleConvert = async () => {
    if (!file || !outputFormat) return
    const category = getCategory(file.ext)
    setError(null)
    setProgress(0)
    setStatus(category === 'audio' || category === 'video' ? 'loading' : 'converting')

    try {
      const result = await convert(file.raw, file.ext, outputFormat, (p) => {
        setStatus('converting')
        setProgress(p)
      })
      setOutputs(prev => [...prev, {
        id: Date.now(),
        filename: result.filename,
        blob: result.blob,
        icon: fileEmoji(outputFormat),
      }])
      setStatus(null)
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const unsupported = file && file.formats.length === 0

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        data-file-drop-target
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => { if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
          cursor-pointer transition-colors select-none flex-1
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : file
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
          }
        `}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={onInputChange} />

        {file ? (
          <>
            <span className="text-3xl">{fileEmoji(file.ext)}</span>
            <p className="text-sm font-medium text-gray-700 text-center break-all px-4">{file.raw.name}</p>
            <p className="text-xs text-gray-400">{formatBytes(file.raw.size)} · .{file.ext}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setOutputFormat(''); setStatus(null); setError(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-gray-400">Drop a file or click to browse</p>
            <p className="text-xs text-gray-300">Images · Audio · Video · Documents</p>
          </>
        )}
      </div>

      {/* Status */}
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Spinner />Loading FFmpeg…
        </div>
      )}
      {status === 'converting' && (
        <div className="flex flex-col gap-1">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gray-800 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Spinner />{Math.round(progress * 100)}%
          </div>
        </div>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <span className="text-xs text-gray-400 shrink-0">Convert to</span>
          {file && !unsupported ? (
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              {file.formats.map((fmt) => (
                <option key={fmt} value={fmt}>.{fmt}</option>
              ))}
            </select>
          ) : (
            <span className="flex-1 text-sm text-gray-300">
              {unsupported ? 'Unsupported file type' : 'Select a file first'}
            </span>
          )}
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || unsupported || !outputFormat || status === 'loading' || status === 'converting'}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
            disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
            bg-gray-900 text-white hover:bg-gray-700 cursor-pointer"
        >
          {status === 'loading' ? 'Loading…' : status === 'converting' ? 'Converting…' : 'Convert'}
        </button>
      </div>

      {/* Output stack */}
      <OutputSection outputs={outputs} setOutputs={setOutputs} />

    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}

function fileEmoji(ext) {
  if (['png','jpg','jpeg','webp','gif','bmp','tiff','svg'].includes(ext)) return '🖼️'
  if (['mp3','wav','ogg','flac','m4a','aac'].includes(ext)) return '🎵'
  if (['mp4','mov','avi','webm','mkv'].includes(ext)) return '🎬'
  if (['pdf'].includes(ext)) return '📕'
  if (['docx','doc'].includes(ext)) return '📝'
  if (['xlsx','xls','csv'].includes(ext)) return '📊'
  if (['pptx','ppt'].includes(ext)) return '📊'
  return '📄'
}

function OutputSection({ outputs, setOutputs }) {
  if (outputs.length === 0) return null
  return (
    <div className="flex flex-col gap-1 shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Output</span>
        {outputs.length > 1 && (
          <button onClick={() => setOutputs([])} className="text-[10px] text-gray-300 hover:text-gray-500 cursor-pointer">
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
        {outputs.map(out => (
          <OutputRow key={out.id} output={out} onRemove={() => setOutputs(p => p.filter(o => o.id !== out.id))} />
        ))}
      </div>
    </div>
  )
}

function OutputRow({ output, onRemove }) {
  function handleDownload() {
    const url = URL.createObjectURL(output.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = output.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
      <span className="text-sm shrink-0">{output.icon ?? '📄'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{output.filename}</p>
        <p className="text-[10px] text-gray-400">{formatBytes(output.blob.size)}</p>
      </div>
      <button
        onClick={handleDownload}
        className="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors cursor-pointer"
      >
        Download
      </button>
      <button onClick={onRemove} className="shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
