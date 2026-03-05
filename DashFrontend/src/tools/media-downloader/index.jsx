import { useState } from 'react'

const API = 'https://dash-production-3e07.up.railway.app/api/media/download'

const AUDIO_FORMATS = ['mp3', 'ogg', 'wav', 'opus', 'best']
const VIDEO_QUALITIES = ['max', '1080', '720', '480', '360']

const SUPPORTED = ['YouTube', 'SoundCloud', 'Twitter/X', 'Instagram', 'TikTok', 'Vimeo', 'Twitch', 'Pinterest', '+more']

export default function MediaDownloader() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('audio')
  const [audioFormat, setAudioFormat] = useState('mp3')
  const [videoQuality, setVideoQuality] = useState('1080')
  const [status, setStatus] = useState(null) // null | 'loading' | 'done' | 'error'
  const [error, setError] = useState(null)

  const openUrl = (downloadUrl) => {
    const a = document.createElement('a')
    a.href = downloadUrl
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  const handleDownload = async () => {
    if (!url.trim()) return
    setStatus('loading')
    setError(null)

    try {
      const body = {
        url: url.trim(),
        downloadMode: mode === 'audio' ? 'audio' : 'auto',
        videoQuality: videoQuality,
      }

      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus('error')
        setError(data.detail ?? `Server error: ${res.status}`)
        return
      }

      if (data.url) {
        openUrl(data.url)
        setStatus('done')
        return
      }

      setStatus('error')
      setError('No download URL returned')
    } catch (err) {
      setStatus('error')
      setError(err.message ?? 'Request failed')
    }
  }

  const busy = status === 'loading'

  return (
    <div className="h-full flex flex-col gap-3">

      {/* URL input */}
      <input
        type="url"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setStatus(null); setError(null) }}
        onKeyDown={(e) => e.key === 'Enter' && !busy && handleDownload()}
        placeholder="Paste a URL — YouTube, SoundCloud, TikTok…"
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-400 placeholder-gray-300"
      />

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {[['audio', '🎵 Audio'], ['video', '🎬 Video']].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer
              ${mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Format / quality row */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
        <span className="text-xs text-gray-400 shrink-0">{mode === 'audio' ? 'Format' : 'Quality'}</span>
        {mode === 'audio' ? (
          <select
            value={audioFormat}
            onChange={(e) => setAudioFormat(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
          >
            {AUDIO_FORMATS.map(f => (
              <option key={f} value={f}>{f === 'best' ? 'best (auto)' : `.${f}`}</option>
            ))}
          </select>
        ) : (
          <select
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
          >
            {VIDEO_QUALITIES.map(q => (
              <option key={q} value={q}>{q === 'max' ? 'max (best available)' : `${q}p`}</option>
            ))}
          </select>
        )}
      </div>

      {/* Status messages */}
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Spinner />Fetching download link…
        </div>
      )}
      {status === 'done' && (
        <p className="text-xs text-green-500 text-center">Download started in a new tab!</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400 text-center leading-relaxed">{error}</p>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={!url.trim() || busy}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
          disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
          bg-gray-900 text-white hover:bg-gray-700"
      >
        {busy ? 'Fetching…' : 'Download'}
      </button>

      {/* Powered by note + supported sites */}
      <div className="flex flex-col gap-1 mt-auto">
        <p className="text-xs text-gray-300 text-center leading-relaxed">
          {SUPPORTED.join(' · ')}
        </p>
        <p className="text-xs text-gray-200 text-center">
          Powered by yt-dlp
        </p>
      </div>

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
