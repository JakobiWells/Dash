import { useState, useEffect, useRef } from 'react'
import Spinner from '../../components/Spinner'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function artworkUrl(artwork, size = 56) {
  if (!artwork?.url) return null
  return artwork.url.replace('{w}', size).replace('{h}', size)
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AppleMusic() {
  // 'loading' | 'unconfigured' | 'login' | 'ready'
  const [stage, setStage] = useState('loading')
  const musicRef = useRef(null)
  const [nowPlaying, setNowPlaying] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tab, setTab] = useState('recent')
  const [recent, setRecent] = useState(null)
  const [library, setLibrary] = useState(null)
  const [playlists, setPlaylists] = useState(null)

  // Initialise MusicKit on mount
  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Fetch developer token from our backend
      let devToken
      try {
        const res = await fetch(`${API_BASE}/api/music/token`)
        const data = await res.json()
        if (!res.ok || !data.token) { if (!cancelled) setStage('unconfigured'); return }
        devToken = data.token
      } catch { if (!cancelled) setStage('unconfigured'); return }

      // 2. Load MusicKit JS
      try {
        await loadScript('https://js-cdn.music.apple.com/musickit/v3/musickit.js')
      } catch { if (!cancelled) setStage('unconfigured'); return }
      if (cancelled) return

      // 3. Configure
      await MusicKit.configure({
        developerToken: devToken,
        app: { name: 'Dashpad', build: '1.0.0' },
      })
      if (cancelled) return

      const music = MusicKit.getInstance()
      musicRef.current = music

      music.addEventListener('nowPlayingItemDidChange', () => {
        setNowPlaying(music.nowPlayingItem ?? null)
      })
      music.addEventListener('playbackStateDidChange', () => {
        setIsPlaying(music.playbackState === MusicKit.PlaybackStates.playing)
      })

      if (!cancelled) setStage(music.isAuthorized ? 'ready' : 'login')
    }

    init().catch(() => { if (!cancelled) setStage('unconfigured') })
    return () => { cancelled = true }
  }, [])

  // Fetch data once authorized
  useEffect(() => {
    if (stage !== 'ready') return
    const music = musicRef.current
    if (!music) return

    music.api.music('/v1/me/recent/played/tracks', { limit: 30 })
      .then(r => setRecent(r.data?.data ?? []))
      .catch(() => setRecent([]))
  }, [stage])

  useEffect(() => {
    if (stage !== 'ready') return
    const music = musicRef.current
    if (!music) return

    if (tab === 'library' && !library) {
      music.api.music('/v1/me/library/songs', { limit: 100 })
        .then(r => setLibrary(r.data?.data ?? []))
        .catch(() => setLibrary([]))
    }
    if (tab === 'playlists' && !playlists) {
      music.api.music('/v1/me/library/playlists', { limit: 100 })
        .then(r => setPlaylists(r.data?.data ?? []))
        .catch(() => setPlaylists([]))
    }
  }, [stage, tab])

  async function authorize() {
    const music = musicRef.current
    if (!music) return
    try {
      await music.authorize()
      setStage('ready')
    } catch (err) {
      console.error('Apple Music auth error:', err)
    }
  }

  async function unauthorize() {
    const music = musicRef.current
    if (!music) return
    await music.unauthorize()
    setStage('login')
    setNowPlaying(null)
    setIsPlaying(false)
    setRecent(null)
    setLibrary(null)
    setPlaylists(null)
  }

  async function playSong(song) {
    const music = musicRef.current
    if (!music) return
    const playId = song.attributes?.playParams?.id ?? song.id
    await music.setQueue({ songs: [playId] })
    await music.play()
  }

  async function playPlaylist(playlist) {
    const music = musicRef.current
    if (!music) return
    const playId = playlist.attributes?.playParams?.id ?? playlist.id
    await music.setQueue({ libraryPlaylists: [playId] })
    await music.play()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (stage === 'loading') {
    return <div className="h-full flex items-center justify-center"><Spinner /></div>
  }

  if (stage === 'unconfigured') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AppleMusicIcon className="w-12 h-12" />
        <p className="text-sm font-semibold text-gray-700">Apple Music</p>
        <p className="text-xs text-gray-400">Coming soon — Apple Music integration is not yet configured.</p>
      </div>
    )
  }

  if (stage === 'login') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
        <AppleMusicIcon className="w-14 h-14" />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">Connect Apple Music</p>
          <p className="text-xs text-gray-400 mt-1">Browse your library and control playback</p>
        </div>
        <button
          onClick={authorize}
          className="px-5 py-2 rounded-full text-white text-sm font-semibold transition-colors cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #fc3c44, #ff6b6b)' }}
        >
          Log in with Apple
        </button>
      </div>
    )
  }

  // stage === 'ready'
  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <AppleMusicIcon className="w-4 h-4" />
          <span className="text-xs font-semibold text-gray-700">Apple Music</span>
        </div>
        <button onClick={unauthorize} className="text-[10px] text-gray-300 hover:text-gray-500 cursor-pointer">
          Disconnect
        </button>
      </div>

      {/* Now playing */}
      {nowPlaying && (
        <NowPlayingBar
          item={nowPlaying}
          isPlaying={isPlaying}
          onToggle={() => isPlaying ? musicRef.current?.pause() : musicRef.current?.play()}
          onNext={() => musicRef.current?.skipToNextItem()}
          onPrev={() => musicRef.current?.skipToPreviousItem()}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg shrink-0">
        {[['recent', 'Recent'], ['library', 'Library'], ['playlists', 'Playlists']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer
              ${tab === id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
        {tab === 'recent' && <TrackList items={recent} onPlay={playSong} />}
        {tab === 'library' && <TrackList items={library} onPlay={playSong} />}
        {tab === 'playlists' && <PlaylistList items={playlists} onPlay={playPlaylist} />}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NowPlayingBar({ item, isPlaying, onToggle, onNext, onPrev }) {
  const img = artworkUrl(item.artwork)
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
      {img
        ? <img src={img} alt="" className="w-8 h-8 rounded-md shrink-0 object-cover" />
        : <div className="w-8 h-8 rounded-md shrink-0" style={{ background: 'linear-gradient(135deg,#fc3c44,#ff6b6b)' }} />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
        <p className="text-[10px] text-gray-400 truncate">{item.artistName}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onPrev} className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer"
        >
          {isPlaying
            ? <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            : <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
          }
        </button>
        <button onClick={onNext} className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>
    </div>
  )
}

function TrackList({ items, onPlay }) {
  if (items === null) return <div className="flex justify-center pt-6"><Spinner /></div>
  if (items.length === 0) return <p className="text-xs text-gray-300 text-center pt-6">Nothing here yet</p>
  return items.map((item, i) => <TrackRow key={item.id ?? i} item={item} onPlay={() => onPlay(item)} />)
}

function TrackRow({ item, onPlay }) {
  const attrs = item.attributes ?? {}
  const img = artworkUrl(attrs.artwork)
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group cursor-pointer"
      onClick={onPlay}
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{attrs.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{attrs.artistName}</p>
      </div>
      <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 cursor-pointer">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  )
}

function PlaylistList({ items, onPlay }) {
  if (items === null) return <div className="flex justify-center pt-6"><Spinner /></div>
  if (items.length === 0) return <p className="text-xs text-gray-300 text-center pt-6">No playlists</p>
  return items.map((item, i) => <PlaylistRow key={item.id ?? i} item={item} onPlay={() => onPlay(item)} />)
}

function PlaylistRow({ item, onPlay }) {
  const attrs = item.attributes ?? {}
  const img = artworkUrl(attrs.artwork)
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group cursor-pointer"
      onClick={onPlay}
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded bg-gray-100 shrink-0" style={{ background: 'linear-gradient(135deg,#fc3c44,#ff6b6b)' }} />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{attrs.name}</p>
        <p className="text-[10px] text-gray-400">{attrs.trackCount ?? '?'} tracks</p>
      </div>
      <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 cursor-pointer">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  )
}

function AppleMusicIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="url(#am-grad)"/>
      <path d="M16.5 5.5v9.25a2.25 2.25 0 1 1-1.5-2.122V8.5L9.5 9.75v6a2.25 2.25 0 1 1-1.5-2.122V7.25L16.5 5.5z" fill="white"/>
      <defs>
        <linearGradient id="am-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fc3c44"/>
          <stop offset="1" stopColor="#ff6b6b"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
