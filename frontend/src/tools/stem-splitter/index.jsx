import { useState, useRef, useEffect } from 'react'
import ProgressBar from '../../shell/ProgressBar'
import Spinner from '../../components/Spinner'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

const STEM_META = {
  vocals:    { label: 'Vocals',       hue: 240 },
  drums:     { label: 'Drums',        hue: 10  },
  bass:      { label: 'Bass',         hue: 140 },
  other:     { label: 'Other',        hue: 270 },
  no_vocals: { label: 'Instrumental', hue: 210 },
}

export default function StemSplitter() {
  const [file, setFile] = useState(null)
  const [stems, setStems] = useState(2)
  const [status, setStatus] = useState('idle') // idle | uploading | processing | done | error
  const [jobId, setJobId] = useState(null)
  const [stemList, setStemList] = useState([])
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const inputRef = useRef(null)
  const pollRef = useRef(null)
  const timerRef = useRef(null)

  function reset() {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
    setFile(null)
    setStatus('idle')
    setJobId(null)
    setStemList([])
    setError(null)
    setElapsed(0)
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setError(null)
    setElapsed(0)

    const form = new FormData()
    form.append('file', file)
    form.append('stems', stems)

    let data
    try {
      const res = await fetch(`${API_BASE}/api/stems/split`, { method: 'POST', body: form })
      data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
    } catch (err) {
      setStatus('error')
      setError(err.message)
      return
    }

    setJobId(data.job_id)
    setStatus('processing')

    // Start elapsed timer
    const start = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)

    // Poll status
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stems/status/${data.job_id}`)
        const s = await res.json()
        if (s.status === 'done') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setStemList(s.stems || [])
          setStatus('done')
        } else if (s.status === 'error') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setStatus('error')
          setError(s.error || 'Processing failed')
        }
      } catch (_) {}
    }, 3000)
  }

  useEffect(() => () => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
  }, [])

  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="h-full flex flex-col gap-3">

      {status === 'idle' && (
        <>
          {/* File drop area */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => { if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}>
            <span className="text-2xl">🎵</span>
            {file ? (
              <>
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">Click to select audio</p>
                <p className="text-xs text-gray-300">MP3, WAV, FLAC, M4A · max 150 MB</p>
              </>
            )}
            <input ref={inputRef} type="file" accept="audio/*" className="hidden"
              onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]) }} />
          </div>

          {/* Stem count toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {[[2, '2 Stems', 'Vocals / Instrumental'], [4, '4 Stems', 'Vocals / Drums / Bass / Other']].map(([n, label, sub]) => (
              <button key={n} onClick={() => setStems(n)}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer
                  ${stems === n ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <div className="font-semibold">{label}</div>
                <div className="opacity-70 text-[10px]">{sub}</div>
              </button>
            ))}
          </div>

          <button onClick={handleUpload} disabled={!file}
            className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors
              disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
              bg-gray-900 text-white hover:bg-gray-700">
            Split Stems
          </button>
        </>
      )}

      {(status === 'uploading' || status === 'processing') && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Spinner />
          <div className="w-full flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700 text-center">
              {status === 'uploading' ? 'Uploading…' : 'Splitting stems…'}
            </p>
            {status === 'processing' && (
              <>
                <ProgressBar estimatedMs={300_000} running={true} done={false} />
                <p className="text-xs text-gray-400 text-center">{fmtTime(elapsed)} elapsed · typically 2–8 min</p>
              </>
            )}
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs text-gray-400">Stems ready — click to download</p>
          {stemList.map(stem => {
            const meta = STEM_META[stem] || { label: stem, hue: 200 }
            return (
              <a key={stem}
                href={`${API_BASE}/api/stems/download/${jobId}/${stem}`}
                download={`${stem}.mp3`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: `hsl(${meta.hue},60%,48%)` }}>
                <span className="text-lg">↓</span>
                {meta.label}
              </a>
            )
          })}
          <button onClick={reset} className="mt-auto text-xs text-gray-300 hover:text-gray-500 cursor-pointer transition-colors">
            Split another file
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-red-500 text-center">{error || 'Something went wrong'}</p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Try again</button>
        </div>
      )}

    </div>
  )
}
