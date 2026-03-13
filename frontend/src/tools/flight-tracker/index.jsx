import { useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://dash-production-3e07.up.railway.app'
const LS_KEY = 'dash-aviationstack-key'

const STATUS_STYLES = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  active:    { label: 'In Air',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  landed:    { label: 'Landed',    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  incident:  { label: 'Incident',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  diverted:  { label: 'Diverted',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
}

function statusStyle(status) {
  return STATUS_STYLES[status?.toLowerCase()] ?? { label: status ?? 'Unknown', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' }
}

function fmtTime(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function fmtDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

function TimeBlock({ label, scheduled, actual, terminal, gate }) {
  const schTime = fmtTime(scheduled)
  const actTime = fmtTime(actual)
  const schDate = fmtDate(scheduled)
  const different = actTime && schTime && actTime !== schTime

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</div>
      {schTime ? (
        <>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-sm font-semibold ${different ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {schTime}
            </span>
            {different && (
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{actTime}</span>
            )}
          </div>
          {schDate && <div className="text-xs text-gray-400 dark:text-gray-500">{schDate}</div>}
        </>
      ) : (
        <div className="text-sm text-gray-300 dark:text-gray-600">—</div>
      )}
      {(terminal || gate) && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {terminal && <span>T{terminal}</span>}
          {terminal && gate && <span className="mx-0.5">·</span>}
          {gate && <span>Gate {gate}</span>}
        </div>
      )}
    </div>
  )
}

function AirportBlock({ label, airport }) {
  const name = airport?.name
  const iata = airport?.iata
  const display = name
    ? iata ? `${name} (${iata})` : name
    : iata ?? '—'

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</div>
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate" title={display}>
        {iata && <span className="text-sm text-gray-800 dark:text-gray-100 mr-1">{iata}</span>}
        {name && <span className="text-gray-400 dark:text-gray-500 font-normal">{name}</span>}
      </div>
      {airport?.timezone && (
        <div className="text-xs text-gray-300 dark:text-gray-600 truncate">{airport.timezone}</div>
      )}
    </div>
  )
}

function FlightCard({ flight }) {
  const dep = flight.departure ?? {}
  const arr = flight.arrival ?? {}
  const airline = flight.airline?.name
  const flightNum = flight.flight?.iata ?? flight.flight?.icao ?? '—'
  const { label, cls } = statusStyle(flight.flight_status)
  const live = flight.live

  // Duration
  let duration = null
  if (dep.scheduled && arr.scheduled) {
    try {
      const mins = (new Date(arr.scheduled) - new Date(dep.scheduled)) / 60000
      if (mins > 0) {
        const h = Math.floor(mins / 60)
        const m = Math.round(mins % 60)
        duration = h > 0 ? `${h}h ${m}m` : `${m}m`
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/60 p-3 space-y-2.5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-50">{flightNum}</div>
          {airline && <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{airline}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
          {duration && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{duration}</span>
          )}
        </div>
      </div>

      {/* Route: departure → arrival airports */}
      <div className="flex items-start gap-2">
        <AirportBlock label="From" airport={dep.airport ? { name: dep.airport, iata: dep.iata, timezone: dep.timezone } : null} />
        <div className="mt-4 text-gray-200 dark:text-gray-600 text-base shrink-0">→</div>
        <AirportBlock label="To" airport={arr.airport ? { name: arr.airport, iata: arr.iata, timezone: arr.timezone } : null} />
      </div>

      {/* Times */}
      <div className="flex items-start gap-2 pt-0.5 border-t border-gray-50 dark:border-gray-700/40">
        <TimeBlock
          label="Departure"
          scheduled={dep.scheduled}
          actual={dep.actual ?? dep.estimated}
          terminal={dep.terminal}
          gate={dep.gate}
        />
        <div className="mt-4 text-gray-200 dark:text-gray-600 shrink-0">·</div>
        <TimeBlock
          label="Arrival"
          scheduled={arr.scheduled}
          actual={arr.actual ?? arr.estimated}
          terminal={arr.terminal}
          gate={arr.gate}
        />
      </div>

      {/* Live position */}
      {live && (live.latitude || live.longitude) && (
        <div className="pt-0.5 border-t border-gray-50 dark:border-gray-700/40">
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">Live Position</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 dark:text-gray-300">
            {live.latitude != null && (
              <span><span className="text-gray-400 dark:text-gray-500">Lat </span>{live.latitude.toFixed(4)}</span>
            )}
            {live.longitude != null && (
              <span><span className="text-gray-400 dark:text-gray-500">Lng </span>{live.longitude.toFixed(4)}</span>
            )}
            {live.altitude != null && (
              <span><span className="text-gray-400 dark:text-gray-500">Alt </span>{live.altitude.toLocaleString()} ft</span>
            )}
            {live.speed_horizontal != null && (
              <span><span className="text-gray-400 dark:text-gray-500">Speed </span>{Math.round(live.speed_horizontal)} kts</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FlightTracker() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || '')
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem(LS_KEY) || '')
  const [flightInput, setFlightInput] = useState('')
  const [flights, setFlights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  const saveKey = useCallback(() => {
    const trimmed = apiKey.trim()
    if (!trimmed) return
    localStorage.setItem(LS_KEY, trimmed)
    setSavedKey(trimmed)
  }, [apiKey])

  const clearKey = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    setSavedKey('')
    setApiKey('')
    setFlights(null)
    setError(null)
  }, [])

  const search = useCallback(async (e) => {
    e?.preventDefault()
    const q = flightInput.trim().toUpperCase()
    if (!q || !savedKey) return
    setLoading(true)
    setError(null)
    setFlights(null)
    setLastQuery(q)
    try {
      const res = await fetch(`${API_BASE}/api/flights?key=${encodeURIComponent(savedKey)}&flight_iata=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.data && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          setError(`No flights found for "${q}". Check the IATA flight number (e.g. BA123, AA100).`)
        } else {
          setFlights(data.data)
        }
      } else {
        setError('Unexpected response from API.')
      }
    } catch (err) {
      setError(`Request failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [flightInput, savedKey])

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!savedKey) {
    return (
      <div className="flex flex-col h-full p-4 gap-4 overflow-hidden select-none">
        <div className="flex-1 flex flex-col justify-center gap-4 max-w-xs mx-auto w-full">
          <div className="text-center">
            <div className="text-3xl mb-2">✈️</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Flight Tracker</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Requires a free AviationStack API key</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">API Key</label>
            <input
              autoFocus
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="Paste your access key…"
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
            />
          </div>

          <button
            onClick={saveKey}
            disabled={!apiKey.trim()}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-default"
          >
            Save & Continue
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Get a free key at{' '}
            <a
              href="https://aviationstack.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              aviationstack.com
            </a>
            {' '}— 100 requests/month on the free tier.
          </p>
        </div>
      </div>
    )
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">

      {/* Search bar */}
      <form onSubmit={search} className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <input
          value={flightInput}
          onChange={e => setFlightInput(e.target.value)}
          placeholder="Flight number (e.g. BA123)"
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-blue-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={loading || !flightInput.trim()}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-default shrink-0"
        >
          {loading ? '…' : 'Track'}
        </button>
      </form>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
            Looking up {flightInput.trim().toUpperCase()}…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 px-3 py-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {flights && !loading && (
          <div className="space-y-2.5 mt-1">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {flights.length} result{flights.length !== 1 ? 's' : ''} for <span className="font-bold text-gray-600 dark:text-gray-300">{lastQuery}</span>
            </div>
            {flights.map((flight, i) => (
              <FlightCard key={i} flight={flight} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!flights && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-300 dark:text-gray-600">
            <span className="text-3xl">✈️</span>
            <span className="text-xs">Enter a flight number above</span>
          </div>
        )}
      </div>

      {/* Footer: change API key */}
      <div className="shrink-0 px-3 pb-2 flex justify-end">
        <button
          onClick={clearKey}
          className="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
        >
          Change API key
        </button>
      </div>
    </div>
  )
}
