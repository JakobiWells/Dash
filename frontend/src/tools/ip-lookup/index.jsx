import { useState, useEffect, useRef, useCallback } from 'react'

const TOKEN_KEY = 'dash-ipinfo-token'

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  )
}

function Field({ label, value, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </span>
      {children ?? (
        <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate">
          {value || '—'}
        </span>
      )}
    </div>
  )
}

export default function IPLookup() {
  const [ownData, setOwnData]     = useState(null)
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [query, setQuery]         = useState('')
  const [token, setToken]         = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [editingToken, setEditingToken] = useState(false)
  const [tokenInput, setTokenInput]     = useState('')
  const inputRef  = useRef(null)
  const tokenRef  = useRef(null)

  // Fetch own IP on mount
  useEffect(() => {
    fetchIP(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIP = useCallback(async (target) => {
    setLoading(true)
    setError(null)
    try {
      const url = target
        ? `https://ipinfo.io/${encodeURIComponent(target)}/json${token ? `?token=${token}` : ''}`
        : `https://ipinfo.io/json${token ? `?token=${token}` : ''}`
      const res  = await fetch(url)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message || 'Lookup failed')
      if (!target) setOwnData(json)
      setData(json)
    } catch (e) {
      setError(e.message || 'Failed to fetch IP info')
    } finally {
      setLoading(false)
    }
  }, [token])

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    fetchIP(q)
  }

  function handleMyIP() {
    setQuery('')
    if (ownData) {
      setData(ownData)
      setError(null)
    } else {
      fetchIP(null)
    }
  }

  function openTokenEdit() {
    setTokenInput(token)
    setEditingToken(true)
    setTimeout(() => tokenRef.current?.focus(), 50)
  }

  function saveToken() {
    const t = tokenInput.trim()
    setToken(t)
    if (t) {
      localStorage.setItem(TOKEN_KEY, t)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setEditingToken(false)
  }

  function cancelTokenEdit() {
    setEditingToken(false)
    setTokenInput('')
  }

  // Parse loc field "lat,lng"
  function mapsLink(loc) {
    if (!loc) return null
    const [lat, lng] = loc.split(',')
    return `https://www.google.com/maps?q=${lat},${lng}`
  }

  const isOwnIP = data && ownData && data.ip === ownData.ip

  return (
    <div className="flex flex-col h-full overflow-hidden select-none text-gray-800 dark:text-gray-100">

      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 shrink-0">
        <span className="text-sm font-semibold flex-1 truncate">IP Lookup</span>
        {!isOwnIP && data && !loading && (
          <button
            onClick={handleMyIP}
            className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium cursor-pointer transition-colors shrink-0"
          >
            My IP
          </button>
        )}
      </div>

      {/* Search bar — only shown when token is present */}
      {token && (
        <form onSubmit={handleSearch} className="px-3 pb-2 shrink-0">
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="IP address or domain…"
              className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-300 dark:focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Look up
            </button>
          </div>
        </form>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">

        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-40 mb-1" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-6 text-center">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-red-500 dark:text-red-400 max-w-[180px]">{error}</p>
            <button
              onClick={() => fetchIP(query.trim() || null)}
              className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {data && !loading && !error && (
          <div className="flex flex-col gap-3">

            {/* IP address hero */}
            <div className="flex items-center gap-2">
              {data.country && (
                <img
                  src={`https://flagcdn.com/24x18/${data.country.toLowerCase()}.png`}
                  alt={data.country}
                  className="shrink-0 rounded-sm"
                  width={24}
                  height={18}
                />
              )}
              <span className="text-xl font-bold font-mono tracking-tight text-gray-800 dark:text-gray-100 truncate">
                {data.ip}
              </span>
            </div>

            {/* Field grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">

              <Field label="Location">
                <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                  {[data.city, data.region, data.country].filter(Boolean).join(', ') || '—'}
                </span>
              </Field>

              <Field label="Organization">
                <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate" title={data.org}>
                  {data.org || '—'}
                </span>
              </Field>

              <Field label="Timezone">
                <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">
                  {data.timezone || '—'}
                </span>
              </Field>

              <Field label="Coordinates">
                {data.loc ? (
                  <a
                    href={mapsLink(data.loc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium font-mono"
                  >
                    {data.loc}
                  </a>
                ) : (
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">—</span>
                )}
              </Field>

              {data.hostname && (
                <Field label="Hostname">
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate font-mono" title={data.hostname}>
                    {data.hostname}
                  </span>
                </Field>
              )}

              {data.postal && (
                <Field label="Postal" value={data.postal} />
              )}

            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-2.5 shrink-0 flex items-end justify-between gap-2">

        {/* No token prompt */}
        {!token && !editingToken && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
            <a
              href="https://ipinfo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Add a token
            </a>
            {' '}to look up any IP
          </p>
        )}

        {token && !editingToken && (
          <div className="flex-1" />
        )}

        {/* Token editor inline */}
        {editingToken && (
          <div className="flex-1 flex items-center gap-1.5">
            <input
              ref={tokenRef}
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveToken(); if (e.key === 'Escape') cancelTokenEdit() }}
              placeholder="Paste IPinfo token…"
              className="flex-1 min-w-0 text-[11px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-300 dark:focus:border-blue-500 transition-colors"
            />
            <button
              onClick={saveToken}
              className="text-[11px] px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium cursor-pointer transition-colors shrink-0"
            >
              Save
            </button>
            <button
              onClick={cancelTokenEdit}
              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Change token button */}
        {!editingToken && (
          <button
            onClick={openTokenEdit}
            className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors shrink-0"
          >
            {token ? 'Change token' : 'Add token'}
          </button>
        )}
      </div>
    </div>
  )
}
