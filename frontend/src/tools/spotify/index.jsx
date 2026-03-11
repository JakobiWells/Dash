import { useState, useEffect, useRef } from 'react'
import Spinner from '../../components/Spinner'

const CLIENT_ID = 'fd637b915ef54f6890381c8d70e0bd84'
const REDIRECT_URI = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? window.location.origin
  : 'https://www.dashpad.dev'

const SCOPES = [
  'user-read-private',
  'user-library-read',
  'playlist-read-private',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'streaming',
  'user-modify-playback-state',
].join(' ')

// --- PKCE helpers ---
function base64url(arr) {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generatePKCE() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const challenge = base64url(new Uint8Array(digest))
  return { verifier, challenge }
}

// --- Auth storage ---
const LS_KEY = 'spotify-auth-v1'

function loadAuth() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}

function saveAuth(auth) { localStorage.setItem(LS_KEY, JSON.stringify(auth)) }

function clearAuth() {
  localStorage.removeItem(LS_KEY)
  localStorage.removeItem('spotify-pkce-verifier')
  localStorage.removeItem('spotify-pkce-state')
}

async function getValidToken() {
  const auth = loadAuth()
  if (!auth) return null
  if (Date.now() < auth.expires_at - 60_000) return auth.access_token
  // Refresh
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: auth.refresh_token,
      }),
    })
    const data = await res.json()
    if (data.access_token) {
      const updated = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || auth.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      }
      saveAuth(updated)
      return updated.access_token
    }
  } catch {}
  return null
}

async function spotifyFetch(path, options = {}) {
  const token = await getValidToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

// Process Spotify callback at module load time — before React renders
const _sp = new URLSearchParams(window.location.search)
const _spCode     = _sp.get('code')
const _spState    = _sp.get('state')
const _spStored   = localStorage.getItem('spotify-pkce-state')
const _spVerifier = localStorage.getItem('spotify-pkce-verifier')
let _spotifyCallbackPromise = null

if (_spCode && _spState && _spState === _spStored && _spVerifier) {
  window.history.replaceState({}, '', window.location.pathname)
  localStorage.removeItem('spotify-pkce-verifier')
  localStorage.removeItem('spotify-pkce-state')
  _spotifyCallbackPromise = fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: _spCode,
      redirect_uri: REDIRECT_URI,
      code_verifier: _spVerifier,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.access_token) {
        const newAuth = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + data.expires_in * 1000,
        }
        saveAuth(newAuth)
        return newAuth
      }
      return null
    })
    .catch(() => null)
}

// --- Root component ---
export default function SpotifyTool() {
  const [auth, setAuth] = useState(() => loadAuth())
  const [callbackProcessing, setCallbackProcessing] = useState(!!_spotifyCallbackPromise)

  // Resolve pending callback promise
  useEffect(() => {
    if (!_spotifyCallbackPromise) return
    _spotifyCallbackPromise
      .then(newAuth => { if (newAuth) setAuth(newAuth) })
      .finally(() => setCallbackProcessing(false))
  }, [])

  async function login() {
    const { verifier, challenge } = await generatePKCE()
    const state = base64url(crypto.getRandomValues(new Uint8Array(8)))
    localStorage.setItem('spotify-pkce-verifier', verifier)
    localStorage.setItem('spotify-pkce-state', state)

    const url = new URL('https://accounts.spotify.com/authorize')
    url.searchParams.set('client_id', CLIENT_ID)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', REDIRECT_URI)
    url.searchParams.set('scope', SCOPES)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('code_challenge', challenge)
    window.location.href = url.toString()
  }

  function logout() {
    clearAuth()
    setAuth(null)
  }

  if (callbackProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!auth) return <LoginScreen onLogin={login} />

  return <Player onLogout={logout} />
}

// --- Login screen ---
function LoginScreen({ onLogin }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center">
        <SpotifyLogo className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">Connect Spotify</p>
        <p className="text-xs text-gray-400 mt-1">Browse your library and control playback</p>
      </div>
      <button
        onClick={onLogin}
        className="px-5 py-2 rounded-full bg-[#1DB954] text-white text-sm font-semibold hover:bg-[#1ed760] transition-colors cursor-pointer"
      >
        Log in with Spotify
      </button>
      <p className="text-[10px] text-gray-300 text-center">
        In-app playback requires Spotify Premium
      </p>
    </div>
  )
}

// --- Connected player ---
function Player({ onLogout }) {
  const [tab, setTab] = useState('recent')
  const [profile, setProfile] = useState(null)
  const [recent, setRecent] = useState(null)
  const [library, setLibrary] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  const [playerState, setPlayerState] = useState(null)
  const [deviceId, setDeviceId] = useState(null)
  const [sdkReady, setSdkReady] = useState(false)
  const playerRef = useRef(null)

  // Fetch profile
  useEffect(() => {
    spotifyFetch('/me')
      .then(setProfile)
      .catch(() => { clearAuth(); onLogout() })
  }, [])

  // Fetch recent tracks
  useEffect(() => {
    spotifyFetch('/me/player/recently-played?limit=30')
      .then(d => setRecent(d?.items || []))
      .catch(() => setRecent([]))
  }, [])

  // Fetch tab data on demand
  useEffect(() => {
    if (tab === 'library' && !library) {
      spotifyFetch('/me/tracks?limit=50')
        .then(d => setLibrary(d?.items || []))
        .catch(() => setLibrary([]))
    }
    if (tab === 'playlists' && !playlists) {
      spotifyFetch('/me/playlists?limit=50')
        .then(d => setPlaylists(d?.items || []))
        .catch(() => setPlaylists([]))
    }
  }, [tab])

  // Poll playback state
  useEffect(() => {
    let mounted = true
    const poll = () => {
      spotifyFetch('/me/player')
        .then(d => { if (mounted) setPlayerState(d) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  // Web Playback SDK
  useEffect(() => {
    let cancelled = false

    function initPlayer() {
      if (cancelled || playerRef.current) return
      getValidToken().then(token => {
        if (cancelled || !token || playerRef.current) return
        const player = new window.Spotify.Player({
          name: 'Dashpad',
          getOAuthToken: cb => getValidToken().then(t => t && cb(t)),
          volume: 0.8,
        })
        player.addListener('ready', ({ device_id }) => {
          if (!cancelled) { setDeviceId(device_id); setSdkReady(true) }
        })
        player.addListener('not_ready', () => {
          if (!cancelled) { setSdkReady(false) }
        })
        player.addListener('player_state_changed', state => {
          if (!cancelled && state) {
            setPlayerState({
              is_playing: !state.paused,
              item: state.track_window?.current_track,
              progress_ms: state.position,
            })
          }
        })
        player.connect()
        playerRef.current = player
      })
    }

    window.onSpotifyWebPlaybackSDKReady = initPlayer

    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script')
      script.id = 'spotify-sdk'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      document.head.appendChild(script)
    } else if (window.Spotify) {
      initPlayer()
    }

    return () => {
      cancelled = true
      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current = null
      }
      setSdkReady(false)
      setDeviceId(null)
    }
  }, [])

  async function playTrack(uri, contextUri) {
    if (!deviceId) return
    const token = await getValidToken()
    if (!token) return
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(contextUri ? { context_uri: contextUri } : { uris: [uri] }),
    })
  }

  const currentTrack = playerState?.item

  return (
    <div className="h-full flex flex-col gap-2 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <SpotifyLogo className="w-3.5 h-3.5 text-[#1DB954]" />
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
            {profile?.display_name || 'Spotify'}
          </span>
        </div>
        <button onClick={onLogout} className="text-[10px] text-gray-300 hover:text-gray-500 cursor-pointer">
          Disconnect
        </button>
      </div>

      {/* Now playing */}
      {currentTrack && (
        <NowPlayingBar
          track={currentTrack}
          isPlaying={playerState?.is_playing}
          sdkReady={sdkReady}
          onToggle={() => playerRef.current?.togglePlay()}
          onNext={() => playerRef.current?.nextTrack()}
          onPrev={() => playerRef.current?.previousTrack()}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg shrink-0">
        {[['recent', 'Recent'], ['library', 'Liked'], ['playlists', 'Playlists']].map(([id, label]) => (
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

      {/* Track list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
        {tab === 'recent' && (
          recent === null
            ? <div className="flex justify-center pt-6"><Spinner /></div>
            : recent.length === 0
              ? <Empty>No recent tracks</Empty>
              : recent.map((item, i) => (
                <TrackRow
                  key={`${item.track?.id}-${i}`}
                  track={item.track}
                  sdkReady={sdkReady}
                  onPlay={() => playTrack(item.track?.uri)}
                />
              ))
        )}
        {tab === 'library' && (
          library === null
            ? <div className="flex justify-center pt-6"><Spinner /></div>
            : library.length === 0
              ? <Empty>No liked songs</Empty>
              : library.map((item, i) => (
                <TrackRow
                  key={`${item.track?.id}-${i}`}
                  track={item.track}
                  sdkReady={sdkReady}
                  onPlay={() => playTrack(item.track?.uri)}
                />
              ))
        )}
        {tab === 'playlists' && (
          playlists === null
            ? <div className="flex justify-center pt-6"><Spinner /></div>
            : playlists.length === 0
              ? <Empty>No playlists</Empty>
              : playlists.map((pl, i) => (
                <PlaylistRow
                  key={pl.id || i}
                  playlist={pl}
                  sdkReady={sdkReady}
                  onPlay={() => playTrack(null, pl.uri)}
                />
              ))
        )}
      </div>
    </div>
  )
}

// --- Sub-components ---

function NowPlayingBar({ track, isPlaying, sdkReady, onToggle, onNext, onPrev }) {
  const img = track?.album?.images?.[2]?.url || track?.album?.images?.[0]?.url
  const artists = track?.artists?.map(a => a.name).join(', ')

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
      {img
        ? <img src={img} alt="" className="w-8 h-8 rounded-md shrink-0 object-cover" />
        : <div className="w-8 h-8 rounded-md bg-gray-200 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{track.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{artists}</p>
      </div>
      {sdkReady ? (
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
      ) : (
        <a
          href={track?.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[#1DB954]"
          title="Open in Spotify"
        >
          <ExternalIcon />
        </a>
      )}
    </div>
  )
}

function TrackRow({ track, onPlay, sdkReady }) {
  if (!track) return null
  const img = track.album?.images?.[2]?.url || track.album?.images?.[0]?.url
  const artists = track.artists?.map(a => a.name).join(', ')

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
      onClick={sdkReady ? onPlay : undefined}
      style={{ cursor: sdkReady ? 'pointer' : 'default' }}
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{track.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{artists}</p>
      </div>
      {sdkReady ? (
        <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
        </button>
      ) : (
        <a
          href={track.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#1DB954]"
          title="Open in Spotify"
        >
          <ExternalIcon />
        </a>
      )}
    </div>
  )
}

function PlaylistRow({ playlist, onPlay, sdkReady }) {
  if (!playlist) return null
  const img = playlist.images?.[0]?.url

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
      onClick={sdkReady ? onPlay : undefined}
      style={{ cursor: sdkReady ? 'pointer' : 'default' }}
    >
      {img
        ? <img src={img} alt="" className="w-7 h-7 rounded shrink-0 object-cover" />
        : <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{playlist.name}</p>
        <p className="text-[10px] text-gray-400">{playlist.tracks?.total ?? '?'} tracks</p>
      </div>
      {sdkReady ? (
        <button className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:'1px'}}><path d="M8 5v14l11-7z"/></svg>
        </button>
      ) : (
        <a
          href={playlist.external_urls?.spotify}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#1DB954]"
          title="Open in Spotify"
        >
          <ExternalIcon />
        </a>
      )}
    </div>
  )
}

function Empty({ children }) {
  return <p className="text-xs text-gray-300 text-center pt-6">{children}</p>
}

function SpotifyLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}
