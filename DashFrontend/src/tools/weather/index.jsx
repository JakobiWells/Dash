import { useState, useEffect } from 'react'

const WX = {
  0:  { label: 'Clear sky',           emoji: '☀️' },
  1:  { label: 'Mainly clear',        emoji: '🌤️' },
  2:  { label: 'Partly cloudy',       emoji: '⛅' },
  3:  { label: 'Overcast',            emoji: '☁️' },
  45: { label: 'Fog',                 emoji: '🌫️' },
  48: { label: 'Icy fog',             emoji: '🌫️' },
  51: { label: 'Light drizzle',       emoji: '🌦️' },
  53: { label: 'Drizzle',             emoji: '🌦️' },
  55: { label: 'Heavy drizzle',       emoji: '🌦️' },
  61: { label: 'Light rain',          emoji: '🌧️' },
  63: { label: 'Rain',                emoji: '🌧️' },
  65: { label: 'Heavy rain',          emoji: '🌧️' },
  71: { label: 'Light snow',          emoji: '❄️' },
  73: { label: 'Snow',                emoji: '❄️' },
  75: { label: 'Heavy snow',          emoji: '❄️' },
  77: { label: 'Snow grains',         emoji: '🌨️' },
  80: { label: 'Light showers',       emoji: '🌦️' },
  81: { label: 'Showers',             emoji: '🌦️' },
  82: { label: 'Heavy showers',       emoji: '🌦️' },
  85: { label: 'Snow showers',        emoji: '🌨️' },
  86: { label: 'Heavy snow showers',  emoji: '🌨️' },
  95: { label: 'Thunderstorm',        emoji: '⛈️' },
  96: { label: 'Thunderstorm',        emoji: '⛈️' },
  99: { label: 'Thunderstorm',        emoji: '⛈️' },
}

function wx(code) { return WX[code] ?? { label: 'Unknown', emoji: '🌡️' } }
function toF(c) { return Math.round(c * 9 / 5 + 32) }
function fmt(c, unit) { return unit === 'F' ? `${toF(c)}°F` : `${Math.round(c)}°C` }
function fmtShort(c, unit) { return unit === 'F' ? `${toF(c)}°` : `${Math.round(c)}°` }

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SAVED_KEY = 'weather-saved'

function getHourlyForDay(weather, dayDate) {
  if (!weather?.hourly?.time) return []
  const h = weather.hourly
  const out = []
  for (let i = 0; i < h.time.length; i++) {
    if (h.time[i].startsWith(dayDate)) {
      out.push({
        hour:  parseInt(h.time[i].slice(11, 13)),
        temp:  h.temperature_2m[i],
        code:  h.weather_code?.[i] ?? 0,
        precip: h.precipitation_probability?.[i] ?? 0,
      })
    }
  }
  return out
}

function HourlyChart({ hours, unit }) {
  if (!hours.length) return null
  const temps = hours.map(h => h.temp)
  const minT = Math.min(...temps) - 2
  const maxT = Math.max(...temps) + 2
  const range = maxT - minT || 1

  const W = 280, H = 72
  const pL = 8, pR = 8, pT = 18, pB = 16
  const plotW = W - pL - pR
  const plotH = H - pT - pB
  const n = hours.length

  const cx = (i) => pL + (n < 2 ? plotW / 2 : (i / (n - 1)) * plotW)
  const cy = (t) => pT + plotH - ((t - minT) / range) * plotH

  const line = hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cy(h.temp).toFixed(1)}`).join(' ')
  const area = `${line}L${cx(n - 1).toFixed(1)},${(pT + plotH).toFixed(1)}L${pL},${(pT + plotH).toFixed(1)}Z`

  const labelIdxs = [0, 6, 12, 18, 23].filter(i => i < n)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wg)" />
      <path d={line} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {labelIdxs.map(i => {
        const h = hours[i]
        if (!h) return null
        const hr = h.hour
        const timeLabel = hr === 0 ? '12a' : hr === 12 ? '12p' : hr > 12 ? `${hr - 12}p` : `${hr}a`
        const tempLabel = unit === 'F' ? `${toF(h.temp)}°` : `${Math.round(h.temp)}°`
        return (
          <g key={i}>
            <text x={cx(i).toFixed(1)} y={(cy(h.temp) - 4).toFixed(1)} textAnchor="middle" fontSize="8" fontWeight="600" fill="#374151">
              {tempLabel}
            </text>
            <text x={cx(i).toFixed(1)} y={H - 2} textAnchor="middle" fontSize="7" fill="#9ca3af">
              {timeLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Weather() {
  const [unit, setUnit] = useState(() => localStorage.getItem('weather-unit') || 'C')
  const [location, setLocation] = useState(() => {
    try { return JSON.parse(localStorage.getItem('weather-location') || 'null') } catch { return null }
  })
  const [savedLocations, setSavedLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') } catch { return [] }
  })
  const [weather, setWeather]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [view, setView]         = useState('weather')
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    if (!location) return
    fetchWeather(location)
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location) return
    setPickerOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchWeather({ lat, lon }) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=5&past_hours=0`
      )
      const data = await res.json()
      if (data.error) throw new Error(data.reason || 'API error')
      setWeather(data)
    } catch {
      setError('Failed to load weather')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    const q = e.target.value
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`)
      setResults((await res.json()).results || [])
    } catch { setResults([]) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'My Location' }
        applyLocation(loc)
        setGeoLoading(false)
      },
      () => { setGeoLoading(false) }
    )
  }

  function applyLocation(loc) {
    setLocation(loc)
    localStorage.setItem('weather-location', JSON.stringify(loc))
    setSelectedDay(null)
    closePicker()
  }

  function selectSearchResult(r) {
    const loc = {
      lat: r.latitude,
      lon: r.longitude,
      name: r.admin1 ? `${r.name}, ${r.admin1}` : `${r.name}, ${r.country}`,
    }
    applyLocation(loc)
  }

  function closePicker() {
    setPickerOpen(false)
    setQuery('')
    setResults([])
  }

  function isSaved(loc) {
    if (!loc) return false
    return savedLocations.some(s => s.lat === loc.lat && s.lon === loc.lon)
  }

  function toggleSave() {
    if (!location) return
    let next
    if (isSaved(location)) {
      next = savedLocations.filter(s => !(s.lat === location.lat && s.lon === location.lon))
    } else {
      next = [...savedLocations, location].slice(-8)
    }
    setSavedLocations(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  function removeSaved(loc, e) {
    e.stopPropagation()
    const next = savedLocations.filter(s => !(s.lat === loc.lat && s.lon === loc.lon))
    setSavedLocations(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  function toggleUnit() {
    const next = unit === 'C' ? 'F' : 'C'
    setUnit(next)
    localStorage.setItem('weather-unit', next)
  }

  const cur   = weather?.current
  const daily = weather?.daily
  const hourly = selectedDay !== null && daily
    ? getHourlyForDay(weather, daily.time[selectedDay])
    : []
  const hourlyBreakdown = hourly.filter((_, i) => i % 3 === 0)

  // ── Location picker (full-card view) ──────────────────────────────────────
  if (pickerOpen) {
    return (
      <div className="flex flex-col h-full p-3 gap-2.5 overflow-hidden select-none">
        <div className="flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-gray-700">Choose Location</span>
          {location && (
            <button onClick={closePicker} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">
              ✕
            </button>
          )}
        </div>

        <button
          onClick={useMyLocation}
          disabled={geoLoading}
          className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm text-blue-600 font-medium cursor-pointer transition-colors disabled:opacity-50"
        >
          <span>📍</span>
          {geoLoading ? 'Detecting…' : 'Use My Location'}
        </button>

        <input
          autoFocus
          value={query}
          onChange={handleSearch}
          placeholder="Search city…"
          className="shrink-0 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none focus:border-blue-300 transition-colors"
        />

        {/* Search results */}
        {results.length > 0 && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="text-xs text-gray-400 mb-1.5 font-medium">Results</div>
            <div className="space-y-0.5">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => selectSearchResult(r)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-50 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <span className="font-medium truncate">{r.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved locations */}
        {results.length === 0 && savedLocations.length > 0 && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="text-xs text-gray-400 mb-1.5 font-medium">Saved</div>
            <div className="space-y-0.5">
              {savedLocations.map(loc => (
                <div
                  key={`${loc.lat},${loc.lon}`}
                  className="flex items-center rounded-xl overflow-hidden hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => applyLocation(loc)}
                    className="flex-1 text-left px-3 py-2 text-sm text-gray-700 cursor-pointer"
                  >
                    {loc.name}
                  </button>
                  <button
                    onClick={(e) => removeSaved(loc, e)}
                    className="px-3 py-2 text-xs text-gray-300 hover:text-gray-500 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && savedLocations.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-300 text-center px-4">
            Search for a city or use your location
          </div>
        )}
      </div>
    )
  }

  // ── Normal weather view ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden select-none">

      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex-1 text-left text-sm font-semibold truncate hover:opacity-60 transition-opacity cursor-pointer"
        >
          {location?.name || 'Weather'}
        </button>

        {location && (
          <button
            onClick={toggleSave}
            title={isSaved(location) ? 'Remove from saved' : 'Save location'}
            className="text-base shrink-0 cursor-pointer transition-opacity hover:opacity-70"
          >
            {isSaved(location) ? '⭐' : '☆'}
          </button>
        )}

        <button
          onClick={toggleUnit}
          className="text-xs px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 font-mono cursor-pointer transition-colors shrink-0"
        >
          °{unit}
        </button>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs shrink-0">
          <button
            onClick={() => setView('weather')}
            className={`px-2 py-1 cursor-pointer transition-colors ${view === 'weather' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >☀️</button>
          <button
            onClick={() => setView('map')}
            className={`px-2 py-1 cursor-pointer transition-colors ${view === 'map' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >🗺️</button>
        </div>

        {location && !loading && view === 'weather' && (
          <button
            onClick={() => fetchWeather(location)}
            title="Refresh"
            className="text-sm opacity-50 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          >🔄</button>
        )}
      </div>

      {/* Map view */}
      {view === 'map' && location && (
        <iframe
          className="flex-1 w-full border-0"
          src={`https://embed.windy.com/embed2.html?lat=${location.lat}&lon=${location.lon}&zoom=9&level=surface&overlay=rain&menu=&message=&marker=true&calendar=now&type=map&location=coordinates`}
          title="Weather map"
          allowFullScreen
        />
      )}
      {view === 'map' && !location && (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Set a location first
        </div>
      )}

      {/* Weather view */}
      {view === 'weather' && (
        <div className="flex-1 flex flex-col px-3 pb-3 gap-2 overflow-hidden min-h-0">

          {loading && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          )}
          {error && !loading && (
            <div className="flex-1 flex items-center justify-center text-center text-gray-400 text-sm px-4">{error}</div>
          )}

          {/* Current conditions + 5-day forecast */}
          {cur && daily && !loading && selectedDay === null && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0">
                <div className="text-5xl leading-none">{wx(cur.weather_code).emoji}</div>
                <div className="text-4xl font-bold tabular-nums mt-1">{fmt(cur.temperature_2m, unit)}</div>
                <div className="text-sm text-gray-500 font-medium">{wx(cur.weather_code).label}</div>
                <div className="text-xs text-gray-400">Feels like {fmt(cur.apparent_temperature, unit)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs shrink-0">
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span>💧</span>
                  <span className="text-gray-400">Humidity</span>
                  <span className="ml-auto font-semibold text-gray-700">{cur.relative_humidity_2m}%</span>
                </div>
                <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span>💨</span>
                  <span className="text-gray-400">Wind</span>
                  <span className="ml-auto font-semibold text-gray-700">{Math.round(cur.wind_speed_10m)} km/h</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1 shrink-0">
                {daily.time.slice(0, 5).map((date, i) => {
                  const d = new Date(date + 'T12:00:00')
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDay(i)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs cursor-pointer transition-colors ${
                        i === 0 ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-400 font-medium">{i === 0 ? 'Today' : DAY_SHORT[d.getDay()]}</span>
                      <span className="text-lg leading-tight">{wx(daily.weather_code[i]).emoji}</span>
                      <span className="font-semibold text-gray-700">{fmtShort(daily.temperature_2m_max[i], unit)}</span>
                      <span className="text-gray-400">{fmtShort(daily.temperature_2m_min[i], unit)}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Day detail */}
          {cur && daily && !loading && selectedDay !== null && (
            <>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
                >
                  ← Back
                </button>
                <span className="text-sm font-semibold">
                  {selectedDay === 0 ? 'Today' : DAY_FULL[new Date(daily.time[selectedDay] + 'T12:00:00').getDay()]}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(daily.time[selectedDay] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-3xl">{wx(daily.weather_code[selectedDay]).emoji}</span>
                <div>
                  <div className="text-sm font-medium">{wx(daily.weather_code[selectedDay]).label}</div>
                  <div className="text-xs text-gray-400">
                    {fmtShort(daily.temperature_2m_max[selectedDay], unit)} / {fmtShort(daily.temperature_2m_min[selectedDay], unit)}
                  </div>
                </div>
              </div>

              {hourly.length > 0 ? (
                <>
                  <div className="shrink-0 bg-gray-50 rounded-xl px-2 pt-1 pb-2">
                    <div className="text-xs text-gray-400 mb-1 px-1 font-medium">Temperature</div>
                    <HourlyChart hours={hourly} unit={unit} />
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="text-xs text-gray-400 mb-1 font-medium">Hourly</div>
                    <div className="space-y-0.5">
                      {hourlyBreakdown.map(h => {
                        const hr = h.hour
                        const timeLabel = hr === 0 ? '12 AM' : hr === 12 ? '12 PM' : hr > 12 ? `${hr - 12} PM` : `${hr} AM`
                        return (
                          <div key={hr} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                            <span className="w-10 text-gray-400 font-mono shrink-0">{timeLabel}</span>
                            <span className="text-base w-5 shrink-0">{wx(h.code).emoji}</span>
                            <span className="text-gray-500 flex-1 truncate">{wx(h.code).label}</span>
                            {h.precip > 0 && <span className="text-blue-400 shrink-0">{h.precip}%</span>}
                            <span className="font-semibold text-gray-700 w-8 text-right shrink-0">{fmtShort(h.temp, unit)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
                  No hourly data available
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
