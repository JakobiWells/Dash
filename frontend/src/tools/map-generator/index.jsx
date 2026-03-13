import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'dash-geoapify-key'

const STYLES = [
  { id: 'osm-bright',       name: 'Bright' },
  { id: 'positron',         name: 'Positron' },
  { id: 'dark-matter',      name: 'Dark Matter' },
  { id: 'klokantech-basic', name: 'Basic' },
  { id: 'toner',            name: 'Toner' },
  { id: 'osm-liberty',      name: 'Liberty' },
  { id: 'osm-carto',        name: 'Carto' },
  { id: 'maptiler-3d',      name: '3D' },
]

const SIZES = [
  { label: '600×400',  w: 600,  h: 400  },
  { label: '800×600',  w: 800,  h: 600  },
  { label: '1200×630', w: 1200, h: 630  },
  { label: '1:1',      w: 600,  h: 600  },
  { label: '16:9',     w: 1280, h: 720  },
]

function buildUrl({ apiKey, style, lat, lon, zoom, width, height, marker }) {
  let url = `https://maps.geoapify.com/v1/staticmap?style=${style}&width=${width}&height=${height}&center=lonlat:${lon},${lat}&zoom=${zoom}&scaleFactor=2&apiKey=${apiKey}`
  if (marker) {
    url += `&marker=lonlat:${lon},${lat};type:awesome;color:%23ff0000;size:medium`
  }
  return url
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [key, setKey] = useState('')
  return (
    <div className="flex flex-col gap-4 p-4 h-full justify-center">
      <div className="text-center">
        <span className="text-4xl">🗺️</span>
        <h2 className="mt-2 font-semibold text-gray-900 dark:text-white text-sm">Connect Geoapify</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Paste your free Geoapify API key to generate maps.
        </p>
      </div>
      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())}
        placeholder="Geoapify API key"
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
        Get a free key at{' '}
        <a href="https://geoapify.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          geoapify.com
        </a>{' '}
        — 3,000 requests/day free.
      </p>
    </div>
  )
}

// ── Main tool ─────────────────────────────────────────────────────────────────
export default function MapGenerator() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')

  const [style, setStyle]   = useState('osm-bright')
  const [size, setSize]     = useState(SIZES[0])
  const [zoom, setZoom]     = useState(12)
  const [marker, setMarker] = useState(true)
  const [lat, setLat]       = useState(48.8566)
  const [lon, setLon]       = useState(2.3522)
  const [locationName, setLocationName] = useState('Paris, France')

  const [search, setSearch]     = useState('')
  const [searching, setSearching] = useState(false)
  const [copied, setCopied]     = useState(null) // 'url' | 'html' | 'md'

  const debounceRef = useRef(null)

  const saveKey = (k) => { localStorage.setItem(STORAGE_KEY, k); setApiKey(k) }
  const clearKey = () => { localStorage.removeItem(STORAGE_KEY); setApiKey('') }

  const mapUrl = buildUrl({ apiKey, style, lat, lon, zoom, width: size.w, height: size.h, marker })

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(q)}&limit=1&apiKey=${apiKey}`
      )
      const data = await res.json()
      const hit = data.features?.[0]
      if (hit) {
        const [hitLon, hitLat] = hit.geometry.coordinates
        setLat(hitLat)
        setLon(hitLon)
        setLocationName(hit.properties.formatted || q)
      }
    } catch {}
    setSearching(false)
  }, [apiKey])

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') doSearch(search)
  }

  const copy = useCallback(async (type) => {
    let text = ''
    if (type === 'url')  text = mapUrl
    if (type === 'html') text = `<img src="${mapUrl}" alt="${locationName}" width="${size.w}" height="${size.h}" />`
    if (type === 'md')   text = `![${locationName}](${mapUrl})`
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }, [mapUrl, locationName, size])

  if (!apiKey) return <SetupScreen onSave={saveKey} />

  return (
    <div className="flex flex-col h-full gap-3 p-3">

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Search a location…"
          className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => doSearch(search)}
          disabled={searching}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white transition-colors"
        >
          {searching ? '…' : 'Go'}
        </button>
      </div>

      {/* Map preview */}
      <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          key={mapUrl}
          src={mapUrl}
          alt={locationName}
          className="w-full h-full object-cover"
        />
        {locationName && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
            {locationName}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">

        {/* Style picker */}
        <div className="flex gap-1 flex-wrap">
          {STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${style === s.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {s.name}
            </button>
          ))}
        </div>

        {/* Size + zoom + marker row */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex gap-1 items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Size</span>
            <select
              value={size.label}
              onChange={e => setSize(SIZES.find(s => s.label === e.target.value))}
              className="text-[10px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              {SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex gap-1 items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">Zoom</span>
            <input type="range" min={1} max={18} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-20 accent-blue-500" />
            <span className="text-[10px] text-gray-500 w-4">{zoom}</span>
          </div>

          <label className="flex gap-1 items-center cursor-pointer">
            <input type="checkbox" checked={marker} onChange={e => setMarker(e.target.checked)}
              className="accent-blue-500 w-3 h-3" />
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Pin</span>
          </label>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          {[
            { type: 'url',  label: 'Copy URL' },
            { type: 'html', label: '<img>' },
            { type: 'md',   label: 'Markdown' },
          ].map(({ type, label }) => (
            <button key={type} onClick={() => copy(type)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${copied === type
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
              {copied === type ? '✓ Copied' : label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={clearKey}
        className="absolute bottom-3 right-3 text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
        Change API key
      </button>
    </div>
  )
}
