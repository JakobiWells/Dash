import { useState, useRef, useCallback } from 'react'

const STORAGE_KEY = 'dash-shazam-api-key'
const CHUNK_SECONDS = 5
const SAMPLE_RATE = 44100

// ── Audio helpers ─────────────────────────────────────────────────────────────
function encodeWAV(samples, sampleRate) {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buf)
  const write = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)) }
  write(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); write(8, 'WAVE')
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buf
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function recordChunk(stream) {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
  recorder.start()
  await new Promise(resolve => setTimeout(resolve, CHUNK_SECONDS * 1000))
  await new Promise(resolve => { recorder.onstop = resolve; recorder.stop() })
  const blob = new Blob(chunks, { type: mimeType })
  const audioCtx = new AudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(await blob.arrayBuffer())
  await audioCtx.close()
  const src = audioBuffer.getChannelData(0)
  const ratio = audioBuffer.sampleRate / SAMPLE_RATE
  const len = Math.round(src.length / ratio)
  const samples = new Float32Array(len)
  for (let i = 0; i < len; i++) samples[i] = src[Math.min(Math.round(i * ratio), src.length - 1)]
  return bufferToBase64(encodeWAV(samples, SAMPLE_RATE))
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [key, setKey] = useState('')
  return (
    <div className="flex flex-col gap-4 p-4 h-full justify-center">
      <div className="text-center">
        <span className="text-4xl">🎵</span>
        <h2 className="mt-2 font-semibold text-gray-900 dark:text-white text-sm">Connect Shazam</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Paste your free RapidAPI key to start identifying songs.
        </p>
      </div>
      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())}
        placeholder="RapidAPI key"
        className="w-full px-3 py-2 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => key.trim() && onSave(key.trim())}
        disabled={!key.trim()}
        className="w-full py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
      >
        Save &amp; continue
      </button>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
        Need a key?{' '}
        <a href="https://rapidapi.com/apidojo/api/shazam" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Get one free on RapidAPI
        </a>{' '}
        — 500 recognitions/month at no cost.
      </p>
    </div>
  )
}

// ── Main tool ─────────────────────────────────────────────────────────────────
export default function Shazam() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [status, setStatus] = useState('idle') // idle | listening | result | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('mic')

  const cancelledRef = useRef(false)
  const streamRef = useRef(null)

  const saveKey = useCallback((k) => { localStorage.setItem(STORAGE_KEY, k); setApiKey(k) }, [])
  const clearKey = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setApiKey(''); setStatus('idle'); setResult(null) }, [])
  const reset = useCallback(() => { setStatus('idle'); setResult(null); setError(null) }, [])

  const stop = useCallback(() => {
    cancelledRef.current = true
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStatus('idle')
  }, [])

  const startListening = useCallback(async () => {
    if (status === 'listening') return
    setResult(null); setError(null)
    cancelledRef.current = false

    let stream
    try {
      if (mode === 'system') {
        const display = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
        display.getVideoTracks().forEach(t => t.stop())
        if (!display.getAudioTracks().length) {
          display.getTracks().forEach(t => t.stop())
          throw new Error('No audio — tick "Share audio" in the dialog.')
        }
        stream = display
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      }
    } catch (err) {
      setError(err.message || 'Could not access audio.')
      setStatus('error')
      return
    }

    streamRef.current = stream
    setStatus('listening')

    while (!cancelledRef.current) {
      let base64
      try {
        base64 = await recordChunk(stream)
      } catch (err) {
        if (cancelledRef.current) break
        stream.getTracks().forEach(t => t.stop())
        setError(err.message); setStatus('error'); return
      }
      if (cancelledRef.current) break
      try {
        const res = await fetch('https://shazam.p.rapidapi.com/songs/detect', {
          method: 'POST',
          headers: { 'content-type': 'text/plain', 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'shazam.p.rapidapi.com' },
          body: base64,
        })
        const text = await res.text()
        let data
        try { data = JSON.parse(text) } catch { throw new Error(`Unexpected response: ${text.slice(0, 200)}`) }
        if (data?.track) {
          stream.getTracks().forEach(t => t.stop())
          setResult(data.track); setStatus('result'); return
        }
      } catch (err) {
        if (cancelledRef.current) break
        stream.getTracks().forEach(t => t.stop())
        setError(err.message); setStatus('error'); return
      }
    }

    stream.getTracks().forEach(t => t.stop())
    if (!cancelledRef.current) setStatus('idle')
  }, [status, apiKey, mode])

  if (!apiKey) return <SetupScreen onSave={saveKey} />

  const links = result ? getLinks(result) : {}
  const isActive = status === 'listening'

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-5 p-4 select-none">

      {/* Idle — mode toggle + button */}
      {status === 'idle' && (
        <>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 text-xs">
            {['mic', 'system'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-full transition-colors font-medium ${mode === m
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {m === 'mic' ? '🎤 Mic' : '💻 Tab audio'}
              </button>
            ))}
          </div>
          <button onClick={startListening}
            className="relative flex items-center justify-center w-28 h-28 rounded-full bg-blue-500 hover:bg-blue-400 active:scale-95 cursor-pointer shadow-lg shadow-blue-500/30 transition-all">
            <span className="text-4xl">🎵</span>
          </button>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tap to identify a song</p>
        </>
      )}

      {/* Listening */}
      {isActive && (
        <>
          <button onClick={stop}
            className="relative flex items-center justify-center w-28 h-28 rounded-full bg-[#1B6BFF] hover:bg-[#3378FF] active:scale-95 cursor-pointer shadow-lg shadow-blue-500/40 transition-all">
            <span className="absolute inset-0 rounded-full bg-[#1B6BFF] animate-ping opacity-25" />
            <span className="absolute -inset-3 rounded-full bg-blue-500/15 animate-pulse" />
            <span className="text-4xl z-10">⏹</span>
          </button>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Listening…</p>
        </>
      )}

      {/* Result */}
      {status === 'result' && result && (
        <div className="flex flex-col items-center gap-3 w-full">
          {result.images?.coverarthq && (
            <img src={result.images.coverarthq} alt="Album art" className="w-32 h-32 rounded-2xl shadow-lg object-cover" />
          )}
          <div className="text-center">
            <p className="font-bold text-lg leading-tight text-gray-900 dark:text-white">{result.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{result.subtitle}</p>
            {result.sections?.[0]?.metadata?.find(m => m.title === 'Album') && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {result.sections[0].metadata.find(m => m.title === 'Album').text}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {links.spotify && (
              <a href={links.spotify} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500 hover:bg-green-400 text-white transition-colors">Spotify</a>
            )}
            {links.apple && (
              <a href={links.apple} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-pink-500 hover:bg-pink-400 text-white transition-colors">Apple Music</a>
            )}
            {links.shazam && (
              <a href={links.shazam} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 hover:bg-blue-400 text-white transition-colors">Shazam</a>
            )}
          </div>
          <button onClick={reset} className="mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors">
            Identify another
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[260px]">{error || 'Something went wrong.'}</p>
          <div className="flex gap-2">
            <button onClick={reset}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors">
              Try again
            </button>
            <button onClick={clearKey}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-600 dark:text-red-400 transition-colors">
              Change key
            </button>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <button onClick={clearKey} className="absolute bottom-3 right-3 text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
          Change API key
        </button>
      )}
    </div>
  )
}

function getLinks(track) {
  const links = {}
  if (track.share?.href) links.shazam = track.share.href
  const hub = track.hub
  if (!hub) return links
  const appleUri = hub.actions?.find(a => a.type === 'uri')?.uri
  if (appleUri) links.apple = appleUri
  const spotifyProvider = hub.providers?.find(p =>
    p.caption?.toLowerCase().includes('spotify') || p.actions?.some(a => a.uri?.includes('spotify'))
  )
  const spotifyUri = spotifyProvider?.actions?.find(a => a.uri?.includes('spotify'))?.uri
  if (spotifyUri) links.spotify = spotifyUri.startsWith('spotify:')
    ? `https://open.spotify.com/track/${spotifyUri.split(':').pop()}`
    : spotifyUri
  return links
}
