import { useState, useEffect, useRef, useCallback } from 'react'

const CLIENT_ID_KEY = 'gdrive-client-id'
const TOKEN_KEY     = 'gdrive-token'
const SCOPE         = 'https://www.googleapis.com/auth/drive.readonly'

// ── Helpers ────────────────────────────────────────────────────────────────

function loadGIS() {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

function getSavedToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (obj.expires < Date.now()) return null
    return obj.token
  } catch { return null }
}

function saveToken(token, expiresIn) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      token,
      expires: Date.now() + expiresIn * 1000 - 60_000, // 1 min buffer
    }))
  } catch {}
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function fileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType === 'application/vnd.google-apps.folder')       return '📁'
  if (mimeType === 'application/vnd.google-apps.document')     return '📝'
  if (mimeType === 'application/vnd.google-apps.spreadsheet')  return '📊'
  if (mimeType === 'application/vnd.google-apps.presentation') return '📑'
  if (mimeType === 'application/vnd.google-apps.form')         return '📋'
  if (mimeType === 'application/vnd.google-apps.drawing')      return '🎨'
  if (mimeType === 'application/vnd.google-apps.script')       return '⚙️'
  if (mimeType.startsWith('video/'))                           return '🎬'
  if (mimeType.startsWith('audio/'))                           return '🎵'
  if (mimeType.startsWith('image/'))                           return '🖼️'
  if (mimeType === 'application/pdf')                          return '📕'
  if (mimeType.includes('zip') || mimeType.includes('tar'))    return '🗜️'
  return '📄'
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)          return `${bytes} B`
  if (bytes < 1024 ** 2)     return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)     return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function driveList(token, folderId, search) {
  const q = search
    ? `name contains '${search.replace(/'/g, "\\'")}' and trashed = false`
    : `'${folderId}' in parents and trashed = false`

  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', q)
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,webViewLink)')
  url.searchParams.set('orderBy', 'folder,name')
  url.searchParams.set('pageSize', '100')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new Error('TOKEN_EXPIRED')
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.files || []
}

// ── Setup screen ───────────────────────────────────────────────────────────

function SetupScreen({ onSave }) {
  const [clientId, setClientId] = useState('')
  const [step, setStep] = useState('instructions') // 'instructions' | 'input'

  return (
    <div className="flex flex-col h-full px-4 py-3 gap-3 overflow-y-auto text-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">📂</span>
        <div>
          <div className="font-semibold text-gray-800">Connect Google Drive</div>
          <div className="text-xs text-gray-400">One-time setup required</div>
        </div>
      </div>

      {step === 'instructions' && (
        <>
          <div className="space-y-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 text-sm">How to get a Client ID:</p>

            <div className="space-y-2">
              {[
                ['1', 'Go to', 'console.cloud.google.com', 'https://console.cloud.google.com'],
                ['2', 'Create a new project (or select one)'],
                ['3', 'Go to APIs & Services → Library → search "Google Drive API" → Enable'],
                ['4', 'Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID'],
                ['5', 'Set Application Type to Web Application'],
                ['6', `Under Authorized JavaScript Origins add your app's URL (e.g. http://localhost:5173)`],
                ['7', 'Click Create — copy the Client ID'],
              ].map(([num, text, linkText, href]) => (
                <div key={num} className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    {num}
                  </span>
                  <span>
                    {text}{' '}
                    {linkText && (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                        {linkText}
                      </a>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-700">
              You may also need to add yourself as a test user under OAuth consent screen → Test users.
            </div>
          </div>

          <button
            onClick={() => setStep('input')}
            className="shrink-0 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors"
          >
            I have my Client ID →
          </button>
        </>
      )}

      {step === 'input' && (
        <>
          <div className="text-xs text-gray-500">
            Paste your OAuth 2.0 Client ID below. It ends in <code className="bg-gray-100 px-1 rounded">.apps.googleusercontent.com</code>
          </div>
          <textarea
            autoFocus
            value={clientId}
            onChange={e => setClientId(e.target.value.trim())}
            placeholder="123456789-abc...xyz.apps.googleusercontent.com"
            rows={3}
            className="text-xs font-mono border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-300 resize-none bg-gray-50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStep('instructions')}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              ← Back
            </button>
            <button
              disabled={!clientId.includes('.apps.googleusercontent.com')}
              onClick={() => onSave(clientId)}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors"
            >
              Connect
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function GoogleDrive() {
  const [clientId, setClientId] = useState(() => localStorage.getItem(CLIENT_ID_KEY) || '')
  const [token, setToken]       = useState(() => getSavedToken())
  const [files, setFiles]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [folder, setFolder]     = useState([{ id: 'root', name: 'My Drive' }]) // breadcrumb stack
  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const tokenClientRef = useRef(null)
  const searchTimerRef = useRef(null)

  const currentFolder = folder[folder.length - 1]

  // ── Token client setup ──────────────────────────────────────────────────
  const initTokenClient = useCallback(async (id) => {
    await loadGIS()
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) { setError(`Auth error: ${resp.error}`); return }
        saveToken(resp.access_token, parseInt(resp.expires_in))
        setToken(resp.access_token)
        setError(null)
      },
    })
  }, [])

  useEffect(() => {
    if (clientId) initTokenClient(clientId)
  }, [clientId, initTokenClient])

  // ── Load files ──────────────────────────────────────────────────────────
  const loadFiles = useCallback(async (tok, folderId, searchQuery) => {
    if (!tok) return
    setLoading(true)
    setError(null)
    try {
      const data = await driveList(tok, folderId, searchQuery)
      setFiles(data)
    } catch (err) {
      if (err.message === 'TOKEN_EXPIRED') {
        clearToken()
        setToken(null)
        setError('Session expired — please reconnect.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) loadFiles(token, currentFolder.id, search)
  }, [token, currentFolder.id, search]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleSaveClientId(id) {
    localStorage.setItem(CLIENT_ID_KEY, id)
    setClientId(id)
    initTokenClient(id).then(() => {
      tokenClientRef.current?.requestAccessToken()
    })
  }

  function connect() {
    tokenClientRef.current?.requestAccessToken()
  }

  function disconnect() {
    clearToken()
    setToken(null)
    setFiles([])
    setFolder([{ id: 'root', name: 'My Drive' }])
    setSearch('')
    setSearchInput('')
  }

  function forgetAccount() {
    disconnect()
    localStorage.removeItem(CLIENT_ID_KEY)
    setClientId('')
  }

  function openFolder(file) {
    setFolder(prev => [...prev, { id: file.id, name: file.name }])
    setSearch('')
    setSearchInput('')
  }

  function navTo(idx) {
    setFolder(prev => prev.slice(0, idx + 1))
    setSearch('')
    setSearchInput('')
  }

  function handleSearchChange(e) {
    const val = e.target.value
    setSearchInput(val)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSearch(val), 400)
  }

  function refresh() {
    loadFiles(token, currentFolder.id, search)
  }

  // ── Render: setup ───────────────────────────────────────────────────────
  if (!clientId) return <SetupScreen onSave={handleSaveClientId} />

  // ── Render: connect ─────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6 text-center">
        <span className="text-4xl">📂</span>
        <div>
          <div className="font-semibold text-gray-800">Google Drive</div>
          <div className="text-xs text-gray-400 mt-0.5">Sign in to browse your files</div>
        </div>
        {error && <div className="text-xs text-red-400 px-3">{error}</div>}
        <button
          onClick={connect}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors"
        >
          <span>Connect Google Account</span>
        </button>
        <button onClick={forgetAccount} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
          Change Client ID
        </button>
      </div>
    )
  }

  // ── Render: file browser ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <div className="flex-1 flex items-center gap-1 min-w-0">
          {/* Search */}
          <div className="flex-1 flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
            <span className="text-xs text-gray-300">🔍</span>
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search Drive…"
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-300 min-w-0"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch('') }}
                className="text-gray-300 hover:text-gray-500 cursor-pointer text-xs"
              >✕</button>
            )}
          </div>
        </div>
        <button onClick={refresh} title="Refresh" className="text-sm opacity-40 hover:opacity-80 cursor-pointer transition-opacity shrink-0">🔄</button>
        <button onClick={disconnect} title="Disconnect" className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">Sign out</button>
      </div>

      {/* Breadcrumb */}
      {!search && (
        <div className="flex items-center gap-1 px-3 pb-1 shrink-0 overflow-x-auto">
          {folder.map((f, i) => (
            <span key={f.id} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className="text-gray-300 text-xs">/</span>}
              <button
                onClick={() => navTo(i)}
                className={`text-xs px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                  i === folder.length - 1
                    ? 'text-gray-700 font-semibold'
                    : 'text-blue-500 hover:bg-blue-50'
                }`}
              >
                {f.name}
              </button>
            </span>
          ))}
        </div>
      )}
      {search && (
        <div className="px-3 pb-1 shrink-0 text-xs text-gray-400">
          Search results for "{search}"
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="text-xs text-red-400">{error}</div>
            <button onClick={connect} className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer">
              Reconnect
            </button>
          </div>
        )}
        {!loading && !error && files.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">
            {search ? 'No results' : 'This folder is empty'}
          </div>
        )}
        {!loading && !error && files.length > 0 && (
          <div className="space-y-0.5">
            {files.map(file => {
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
              return (
                <button
                  key={file.id}
                  onClick={() => isFolder ? openFolder(file) : window.open(file.webViewLink, '_blank')}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors text-left group"
                >
                  <span className="text-xl shrink-0 leading-none">{fileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{file.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{fmtDate(file.modifiedTime)}</span>
                      {file.size && <span>{fmtSize(parseInt(file.size))}</span>}
                    </div>
                  </div>
                  {!isFolder && (
                    <span className="text-gray-200 group-hover:text-gray-400 text-xs shrink-0 transition-colors">↗</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
