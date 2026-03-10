import { useState, useEffect, useRef } from 'react'

const API_BASE = 'https://dash-production-3e07.up.railway.app'
const SC_API   = 'https://api.soundcloud.com'
const SC_COLOR = '#ff5500'
const LS_KEY   = 'sc-auth-v1'
const REDIRECT_URI = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? window.location.origin
  : 'https://www.dashpad.dev'

// ── Auth helpers ──────────────────────────────────────────────────────────────

function loadToken() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null')?.access_token ?? null } catch { return null }
}

function saveToken(access_token) {
  localStorage.setItem(LS_KEY, JSON.stringify({ access_token }))
}

function clearToken() {
  localStorage.removeItem(LS_KEY)
  localStorage.removeItem('sc-oauth-state')
}

// Process the OAuth callback immediately at module load time — before React
// renders or the cloud layout loads. This way the token exchange starts even
// if the tile hasn't mounted yet.
const _params  = new URLSearchParams(window.location.search)
const _code    = _params.get('code')
const _state   = _params.get('state')
const _stored  = localStorage.getItem('sc-oauth-state')
let _callbackPromise = null   // resolves to access_token string or null

if (_code && _state && _state === _stored) {
  window.history.replaceState({}, '', window.location.pathname)
  localStorage.removeItem('sc-oauth-state')
  _callbackPromise = fetch(`${API_BASE}/api/sc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: _code, redirectUri: REDIRECT_URI }),
  })
    .then(r => r.json())
    .then(d => { if (d.access_token) { saveToken(d.access_token) } return d.access_token ?? null })
    .catch(() => null)
}

async function scFetch(path, token, params = {}) {
  const url = new URL(`${SC_API}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { Authorization: `OAuth ${token}`, Accept: 'application/json; charset=utf-8' },
  })
  if (!res.ok) throw new Error(res.status)
  return res.json()
}

function fmtMs(ms) {
  const s = Math.floor((ms ?? 0) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function SoundCloud() {
  // 'loading' | 'unconfigured' | 'login' | 'ready'
  const [stage, setStage]       = useState('loading')
  const [clientId, setClientId] = useState(null)
  const [token, setToken]       = useState(() => loadToken())

  // Fetch SC config + handle any pending callback promise
  useEffect(() => {
    const configPromise = fetch(`${API_BASE}/api/sc/config`)
      .then(r => r.json())
      .catch(() => null)

    // If a callback is in flight, wait for both; otherwise just wait for config
    Promise.all([configPromise, _callbackPromise ?? Promise.resolve(null)])
      .then(([config, newToken]) => {
        if (!config?.clientId) { setStage('unconfigured'); return }
        setClientId(config.clientId)
        const activeToken = newToken || loadToken()
        if (activeToken) { setToken(activeToken); setStage('ready') }
        else setStage('login')
      })
      .catch(() => setStage('unconfigured'))
  }, [])

  function login() {
    if (!clientId) return
    const state = Math.random().toString(36).slice(2)
    localStorage.setItem('sc-oauth-state', state)
    const url = new URL('https://api.soundcloud.com/connect')
    url.searchParams.set('client_id',     clientId)
    url.searchParams.set('redirect_uri',  REDIRECT_URI)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope',         '*')
    url.searchParams.set('state',         state)
    window.location.href = url.toString()
  }

  function logout() {
    clearToken()
    setToken(null)
    setStage('login')
  }

  if (stage === 'loading') {
    return <div className="h-full flex items-center justify-center"><Spinner /></div>
  }

  if (stage === 'unconfigured') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
        <SCLogo className="w-12 h-12 opacity-30" />
        <p className="text-sm font-semibold text-gray-700">SoundCloud</p>
        <p className="text-xs text-gray-400">SoundCloud integration is not yet configured.</p>
      </div>
    )
  }

  if (stage === 'login') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
        <SCLogo className="w-14 h-14" />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Connect SoundCloud</p>
          <p className="text-xs text-gray-400 mt-1">Browse your likes, playlists, and stream</p>
        </div>
        <button
          onClick={login}
          className="px-5 py-2 rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: SC_COLOR }}
        >
          Log in with SoundCloud
        </button>
      </div>
    )
  }

  return <Player token={token} onLogout={logout} />
}

// ── Player ────────────────────────────────────────────────────────────────────

function Player({ token, onLogout }) {
  const [profile, setProfile]   = useState(null)
  const [tab, setTab]           = useState('stream')
  const [stream, setStream]     = useState(null)
  const [likes, setLikes]       = useState(null)
  const [playlists, setPlaylists] = useState(null)

  // Playback state
  const audioRef    = useRef(new Audio())
  const [queue, setQueue]       = useState([])   // array of track objects
  const [queueIdx, setQueueIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)   // seconds
  const [duration, setDuration] = useState(0)   // seconds
  const seekingRef  = useRef(false)

  // Fetch profile
  useEffect(() => {
    scFetch('/me', token).then(setProfile).catch(() => { clearToken(); onLogout() })
  }, [])

  // Wire up audio element events
  useEffect(() => {
    const audio = audioRef.current
    const onPlay     = () => setIsPlaying(true)
    const onPause    = () => setIsPlaying(false)
    const onEnded    = () => handleEnded()
    const onTime     = () => { if (!seekingRef.current) setPosition(audio.currentTime) }
    const onMeta     = () => setDuration(audio.duration || 0)
    audio.addEventListener('play',          onPlay)
    audio.addEventListener('pause',         onPause)
    audio.addEventListener('ended',         onEnded)
    audio.addEventListener('timeupdate',    onTime)
    audio.addEventListener('durationchange', onMeta)
    return () => {
      audio.removeEventListener('play',           onPlay)
      audio.removeEventListener('pause',          onPause)
      audio.removeEventListener('ended',          onEnded)
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('durationchange', onMeta)
      audio.pause()
    }
  }, [])

  function handleEnded() {
    setQueueIdx(i => {
      const next = i + 1
      if (next < queue.length) { loadTrack(queue[next]); return next }
      setIsPlaying(false); return i
    })
  }

  function loadTrack(track) {
    const audio = audioRef.current
    audio.src = `${track.stream_url}?oauth_token=${token}`
    audio.play().catch(() => {})
    setPosition(0)
    setDuration(track.duration / 1000 || 0)
  }

  function playTracks(tracks, startIndex = 0) {
    setQueue(tracks)
    setQueueIdx(startIndex)
    loadTrack(tracks[startIndex])
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio.src) return
    isPlaying ? audio.pause() : audio.play().catch(() => {})
  }

  function skipNext() {
    if (queueIdx + 1 < queue.length) {
      const next = queueIdx + 1
      setQueueIdx(next)
      loadTrack(queue[next])
    }
  }

  function skipPrev() {
    if (audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return }
    if (queueIdx > 0) {
      const prev = queueIdx - 1
      setQueueIdx(prev)
      loadTrack(queue[prev])
    }
  }

  function handleSeekChange(e) { setPosition(Number(e.target.value)) }
  function handleSeekEnd(e) {
    seekingRef.current = false
    audioRef.current.currentTime = Number(e.target.value)
  }

  // Fetch tab data on demand
  useEffect(() => {
    if (tab === 'stream' && !stream) {
      scFetch('/me/stream', token, { limit: 50 })
        .then(d => setStream((d.collection ?? []).filter(i => i.type === 'track' || i.type === 'track-repost').map(i => i.track)))
        .catch(() => setStream([]))
    }
    if (tab === 'likes' && !likes) {
      scFetch('/me/likes/tracks', token, { limit: 100 })
        .then(d => setLikes(d.collection ?? d ?? []))
        .catch(() => setLikes([]))
    }
    if (tab === 'playlists' && !playlists) {
      scFetch('/me/playlists', token, { limit: 50 })
        .then(d => setPlaylists(d ?? []))
        .catch(() => setPlaylists([]))
    }
  }, [tab])

  const currentTrack = queue[queueIdx] ?? null
  const pct = duration > 0 ? (position / duration) * 100 : 0

  const activeList = tab === 'stream' ? stream : tab === 'likes' ? likes : null

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <SCLogo className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
            {profile?.username ?? 'SoundCloud'}
          </span>
        </div>
        <button onClick={onLogout} className="text-[10px] text-gray-300 hover:text-gray-500 cursor-pointer">
          Disconnect
        </button>
      </div>

      {/* Now playing */}
      {currentTrack && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
          {currentTrack.artwork_url
            ? <img src={currentTrack.artwork_url.replace('-large', '-t67x67')} alt="" className="w-8 h-8 rounded-md shrink-0 object-cover" />
            : <div className="w-8 h-8 rounded-md shrink-0" style={{ background: SC_COLOR }} />
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate leading-tight">{currentTrack.title}</p>
            <p className="text-[10px] text-gray-400 truncate">{currentTrack.user?.username}</p>
            {/* Seek bar */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] text-gray-300 shrink-0 tabular-nums">{fmtMs(position * 1000)}</span>
              <input
                type="range" min={0} max={duration || 100} step={0.5} value={position}
                onMouseDown={() => { seekingRef.current = true }}
                onTouchStart={() => { seekingRef.current = true }}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${SC_COLOR} ${pct}%, #e5e7eb ${pct}%)` }}
              />
              <span className="text-[9px] text-gray-300 shrink-0 tabular-nums">{fmtMs(duration * 1000)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {currentTrack && (
        <div className="flex items-center justify-center gap-3 shrink-0">
          <button onClick={skipPrev} disabled={queueIdx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
            style={{ background: SC_COLOR }}
          >
            {isPlaying
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'2px'}}><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button onClick={skipNext} disabled={queueIdx >= queue.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg shrink-0">
        {[['stream', 'Stream'], ['likes', 'Likes'], ['playlists', 'Playlists']].map(([id, label]) => (
          <button
            key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer
              ${tab === id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
        {tab !== 'playlists' && (
          activeList === null
            ? <div className="flex justify-center pt-6"><Spinner /></div>
            : activeList.length === 0
              ? <p className="text-xs text-gray-300 text-center pt-6">Nothing here yet</p>
              : activeList.map((track, i) => (
                <TrackRow
                  key={track?.id ?? i}
                  track={track}
                  active={currentTrack?.id === track?.id}
                  playing={currentTrack?.id === track?.id && isPlaying}
                  onPlay={() => playTracks(activeList.filter(t => t?.stream_url), activeList.filter(t => t?.stream_url).findIndex(t => t?.id === track?.id))}
                />
              ))
        )}
        {tab === 'playlists' && (
          playlists === null
            ? <div className="flex justify-center pt-6"><Spinner /></div>
            : playlists.length === 0
              ? <p className="text-xs text-gray-300 text-center pt-6">No playlists</p>
              : playlists.map((pl, i) => (
                <PlaylistRow
                  key={pl.id ?? i}
                  playlist={pl}
                  onPlay={() => {
                    const tracks = (pl.tracks ?? []).filter(t => t?.stream_url)
                    if (tracks.length) playTracks(tracks, 0)
                  }}
                />
              ))
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TrackRow({ track, active, playing, onPlay }) {
  if (!track) return null
  const img = track.artwork_url?.replace('-large', '-t67x67')
  return (
    <div
      onClick={onPlay}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg group cursor-pointer transition-colors
        ${active ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded shrink-0" style={{ background: SC_COLOR, opacity: 0.4 }} />
      }
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate ${active ? 'font-semibold' : 'font-medium text-gray-700'}`}
          style={active ? { color: SC_COLOR } : {}}>
          {track.title}
        </p>
        <p className="text-[10px] text-gray-400 truncate">{track.user?.username}</p>
      </div>
      {playing
        ? <span className="shrink-0 text-[8px]" style={{ color: SC_COLOR }}>▶</span>
        : <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 cursor-pointer">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
          </button>
      }
    </div>
  )
}

function PlaylistRow({ playlist, onPlay }) {
  const img = playlist.artwork_url?.replace('-large', '-t67x67')
  return (
    <div
      onClick={onPlay}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group cursor-pointer"
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded shrink-0" style={{ background: SC_COLOR, opacity: 0.4 }} />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{playlist.title}</p>
        <p className="text-[10px] text-gray-400">{playlist.track_count ?? '?'} tracks</p>
      </div>
      <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 cursor-pointer">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}

function SCLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={SC_COLOR}>
      <path d="M1.543 12.738c0 .48.37.87.826.87s.826-.39.826-.87V9.37c0-.48-.37-.87-.826-.87s-.826.39-.826.87v3.368zm2.608.617c0 .48.37.87.826.87s.826-.39.826-.87V8.236c0-.48-.37-.87-.826-.87s-.826.39-.826.87v5.119zm2.609.503c0 .48.37.87.826.87s.826-.39.826-.87V8.236c0-.48-.37-.87-.826-.87s-.826.39-.826.87v5.622zm2.608.38c0 .48.37.87.826.87s.826-.39.826-.87V7.104c0-.48-.37-.87-.826-.87s-.826.39-.826.87v7.134zm2.609.126c0 .48.37.87.826.87s.826-.39.826-.87V6.602c0-.48-.37-.87-.826-.87s-.826.39-.826.87v7.762zm3.404.24c-.113 0-.225-.012-.335-.024C17.717 13.72 19 12.115 19 10.2c0-2.14-1.693-3.876-3.782-3.876-.553 0-1.074.128-1.537.355V14.6c.01.003.021.004.031.004z"/>
    </svg>
  )
}
