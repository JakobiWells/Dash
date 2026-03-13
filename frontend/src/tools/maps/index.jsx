import { useState, useEffect, useRef, useCallback } from 'react'

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const API_KEY_KEY = 'dash-geoapify-key'
const VIEW_KEY    = 'dash-maps-view'

function tileUrl(apiKey, dark) {
  const style = dark ? 'dark-matter' : 'osm-bright'
  return `https://maps.geoapify.com/v1/tile/${style}/{z}/{x}/{y}.png?apiKey=${apiKey}`
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) { resolve(); return }

    // Link already injected — just poll
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel  = 'stylesheet'
      link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }

    if (document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      const iv = setInterval(() => { if (window.L) { clearInterval(iv); resolve() } }, 50)
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.head.appendChild(script)
  })
}

function getSavedView() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY))
    if (v && typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.zoom === 'number') return v
  } catch {}
  return null
}

// ── Setup screen ───────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [input, setInput] = useState('')

  function handleSave(e) {
    e.preventDefault()
    const key = input.trim()
    if (!key) return
    localStorage.setItem(API_KEY_KEY, key)
    onSave(key)
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-5 px-6 select-none">
      <div className="text-4xl">🗺️</div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Maps needs an API key</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Get a free key at{' '}
          <a
            href="https://www.geoapify.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-600"
          >
            geoapify.com
          </a>
          {' '}— 3,000 requests/day, no credit card required.
        </div>
      </div>
      <form onSubmit={handleSave} className="w-full flex flex-col gap-2">
        <input
          autoFocus
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your Geoapify API key…"
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-[#3a3a38] bg-white dark:bg-[#2a2a28] text-gray-800 dark:text-gray-100 outline-none focus:border-blue-300 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-full text-sm font-medium px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-40 cursor-pointer"
        >
          Save &amp; Open Map
        </button>
      </form>
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
        Your key is stored locally in your browser and never sent anywhere except Geoapify.
      </div>
    </div>
  )
}

// ── Main map ───────────────────────────────────────────────────────────────────
function MapView({ apiKey, onChangeKey }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const tileRef      = useRef(null)
  const markerRef    = useRef(null)

  const [query, setQuery]     = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)

  // Initialize map
  useEffect(() => {
    let active = true

    loadLeaflet().then(() => {
      if (!active || !containerRef.current || mapRef.current) return

      const L    = window.L
      const dark = document.documentElement.classList.contains('dark')
      const saved = getSavedView()

      const map = L.map(containerRef.current, {
        center:          saved ? [saved.lat, saved.lng] : [20, 0],
        zoom:            saved ? saved.zoom : 2,
        zoomControl:     true,
        attributionControl: true,
      })

      const tile = L.tileLayer(tileUrl(apiKey, dark), {
        attribution: '&copy; <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 20,
      }).addTo(map)

      map.on('moveend', () => {
        const c = map.getCenter()
        try {
          localStorage.setItem(VIEW_KEY, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }))
        } catch {}
      })

      mapRef.current  = map
      tileRef.current = tile
    }).catch(console.error)

    return () => {
      active = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current  = null
        tileRef.current = null
        markerRef.current = null
      }
    }
  }, [apiKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Dark mode observer
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!mapRef.current || !tileRef.current) return
      const dark = document.documentElement.classList.contains('dark')
      tileRef.current.setUrl(tileUrl(apiKey, dark))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [apiKey])

  const placeMarker = useCallback((lat, lng, label) => {
    if (!mapRef.current) return
    if (markerRef.current) {
      markerRef.current.remove()
    }
    const L = window.L
    const marker = L.marker([lat, lng]).addTo(mapRef.current)
    if (label) marker.bindPopup(label).openPopup()
    markerRef.current = marker
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchErr('')
    try {
      const res  = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&apiKey=${apiKey}&limit=1`
      )
      const data = await res.json()
      const feat = data.features?.[0]
      if (!feat) {
        setSearchErr('No results found')
        return
      }
      const [lng, lat] = feat.geometry.coordinates
      const name = feat.properties.formatted || q
      mapRef.current?.flyTo([lat, lng], 13, { duration: 1.2 })
      placeMarker(lat, lng, name)
    } catch {
      setSearchErr('Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        mapRef.current?.flyTo([lat, lng], 14, { duration: 1.2 })
        placeMarker(lat, lng, 'My Location')
        setGeoLoading(false)
      },
      () => setGeoLoading(false)
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Map container — edge-to-edge inside the card */}
      <div ref={containerRef} className="absolute inset-0" style={{ height: '100%' }} />

      {/* Search bar — floating top */}
      <div className="absolute top-2 left-2 right-2 z-[1000] pointer-events-none">
        <form
          onSubmit={handleSearch}
          className="pointer-events-auto flex items-center gap-1.5 bg-white dark:bg-[#1e1e1c] rounded-xl shadow-lg px-2 py-1.5 border border-gray-200 dark:border-[#3a3a38]"
        >
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchErr('') }}
            placeholder="Search places…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
          />
          {searchErr && (
            <span className="text-xs text-red-400 shrink-0">{searchErr}</span>
          )}
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            {searching ? '…' : 'Go'}
          </button>
        </form>
      </div>

      {/* Controls — floating bottom-right */}
      <div className="absolute bottom-6 right-2 z-[1000] flex flex-col gap-1.5 pointer-events-none">
        <button
          onClick={handleMyLocation}
          disabled={geoLoading}
          title="My location"
          className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#1e1e1c] border border-gray-200 dark:border-[#3a3a38] shadow text-base hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {geoLoading ? '…' : '📍'}
        </button>
        <button
          onClick={onChangeKey}
          title="Change API key"
          className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#1e1e1c] border border-gray-200 dark:border-[#3a3a38] shadow text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors cursor-pointer"
        >
          🔑
        </button>
      </div>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function Maps() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_KEY) || '')

  function handleSave(key) {
    setApiKey(key)
  }

  function handleChangeKey() {
    setApiKey('')
  }

  if (!apiKey) {
    return <SetupScreen onSave={handleSave} />
  }

  return <MapView apiKey={apiKey} onChangeKey={handleChangeKey} />
}
