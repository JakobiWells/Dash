import { useState, useRef, useCallback, useEffect } from 'react'

const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'webm', 'mkv']
const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'flac']
const MIME = {
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  m4a: 'audio/mp4', flac: 'audio/flac',
}

function getExt(filename) {
  return filename.split('.').pop().toLowerCase()
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

let _ffmpeg = null

async function getFFmpeg(onProgress) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  if (!_ffmpeg) {
    _ffmpeg = new FFmpeg()
    _ffmpeg.on('progress', ({ progress }) => onProgress?.(Math.min(progress, 1)))
  }
  if (!_ffmpeg.loaded) {
    await _ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    })
  }
  return _ffmpeg
}

export default function AudioExtractor() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('mp3')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState(null) // null | 'loading' | 'extracting' | 'done' | 'error'
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const handleFile = useCallback((f) => {
    const ext = getExt(f.name)
    if (!VIDEO_EXTS.includes(ext)) {
      setError(`Unsupported type: .${ext} — drop a video file (MP4, MOV, AVI, WebM, MKV)`)
      return
    }
    setFile({ raw: f, ext })
    setStatus(null)
    setError(null)
    setProgress(0)
  }, [])

  // Grid overlay file-drop integration
  useEffect(() => {
    const el = dropZoneRef.current
    if (!el) return
    function onFileDrop(e) { const f = e.detail.files[0]; if (f) handleFile(f) }
    el.addEventListener('filedrop', onFileDrop)
    return () => el.removeEventListener('filedrop', onFileDrop)
  }, [handleFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleExtract = async () => {
    if (!file) return
    setError(null)
    setProgress(0)
    setStatus('loading')

    try {
      const { fetchFile } = await import('@ffmpeg/util')
      const ff = await getFFmpeg((p) => { setStatus('extracting'); setProgress(p) })

      const inputName  = `input.${file.ext}`
      const outputName = `output.${format}`

      await ff.writeFile(inputName, await fetchFile(file.raw))
      await ff.exec(['-i', inputName, '-vn', outputName])

      const data = await ff.readFile(outputName)
      await ff.deleteFile(inputName)
      await ff.deleteFile(outputName)

      const blob = new Blob([data.buffer], { type: MIME[format] })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.raw.name.replace(/\.[^.]+$/, '')}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const busy = status === 'loading' || status === 'extracting'

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        data-file-drop-target
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => { if (!file && inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
          transition-colors select-none flex-1
          ${dragging
            ? 'border-blue-400 bg-blue-50'
            : file
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 cursor-pointer'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,.mkv"
          className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f) }}
        />

        {file ? (
          <>
            <span className="text-3xl">🎬</span>
            <p className="text-sm font-medium text-gray-700 text-center break-all px-4">{file.raw.name}</p>
            <p className="text-xs text-gray-400">{formatBytes(file.raw.size)}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus(null); setError(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 cursor-pointer"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-gray-300">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
                <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <p className="text-sm text-gray-400">Drop a video or click to browse</p>
            <p className="text-xs text-gray-300">MP4 · MOV · AVI · WebM · MKV</p>
          </>
        )}
      </div>

      {/* Status */}
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Spinner />Loading FFmpeg…
        </div>
      )}
      {status === 'extracting' && (
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
      {status === 'done' && (
        <p className="text-xs text-green-500 text-center">Download started!</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <span className="text-xs text-gray-400 shrink-0">Extract as</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
          >
            {AUDIO_FORMATS.map(f => (
              <option key={f} value={f}>.{f}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExtract}
          disabled={!file || busy}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
            disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
            bg-gray-900 text-white hover:bg-gray-700"
        >
          {status === 'loading' ? 'Loading…' : status === 'extracting' ? 'Extracting…' : 'Extract'}
        </button>
      </div>

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
