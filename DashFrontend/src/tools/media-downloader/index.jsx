import { useState } from 'react'
import { usePro } from '../../hooks/usePro'
import { useAuth } from '../../context/AuthContext'
import UpgradeModal from '../../components/UpgradeModal'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

const AUDIO_FORMATS = ['mp3', 'ogg', 'wav', 'opus', 'best']
const VIDEO_QUALITIES = ['max', '1080', '720', '480', '360']

const SUPPORTED = ['YouTube', 'SoundCloud', 'Twitter/X', 'Instagram', 'TikTok', 'Vimeo', 'Twitch', 'Pinterest', '+more']

export default function MediaDownloader() {
  const { user } = useAuth()
  const { isPro, loading: proLoading } = usePro()
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('audio')
  const [audioFormat, setAudioFormat] = useState('mp3')
  const [videoQuality, setVideoQuality] = useState('1080')
  const [status, setStatus] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleDownload = () => {
    if (!url.trim()) return

    const params = new URLSearchParams({
      url: url.trim(),
      mode: mode === 'audio' ? 'audio' : 'video',
      format: audioFormat,
      quality: videoQuality,
    })

    const a = document.createElement('a')
    a.href = `${API_BASE}/api/media/download?${params}`
    a.click()
    setStatus('done')
  }

  if (proLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isPro) {
    return (
      <>
        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4">
          <span className="text-3xl">⬇️</span>
          <div>
            <p className="text-sm font-medium text-gray-800">Media Downloader is a Pro feature</p>
            <p className="text-xs text-gray-400 mt-1">Download audio & video from 1000+ sites</p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Upgrade to Pro
          </button>
          {!user && (
            <p className="text-xs text-gray-400">
              Already Pro?{' '}
              <button onClick={() => setShowUpgrade(true)} className="text-gray-700 hover:underline cursor-pointer">Sign in</button>
            </p>
          )}
        </div>
        {showUpgrade && (
          <UpgradeModal
            onClose={() => setShowUpgrade(false)}
            reason="Media Downloader requires a Pro subscription"
          />
        )}
      </>
    )
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* URL input */}
      <input
        type="url"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setStatus(null) }}
        onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
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

      {status === 'done' && (
        <p className="text-xs text-green-500 text-center">Download started!</p>
      )}

      <button
        onClick={handleDownload}
        disabled={!url.trim()}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
          disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
          bg-gray-900 text-white hover:bg-gray-700"
      >
        Download
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
