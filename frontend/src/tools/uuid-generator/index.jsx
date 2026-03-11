import { useState } from 'react'
import useClipboard from '../../hooks/useClipboard'

// Helper: generate UUID v4
function generateUUID() {
  if (crypto && crypto.getRandomValues) {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    buf[6] = (buf[6] & 0x0f) | 0x40
    buf[8] = (buf[8] & 0x3f) | 0x80
    const hex = Array.from(buf).map(b => b.toString(16).padStart(2, '0'))
    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
  } else {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

export default function UUIDGenerator() {
  const [count, setCount] = useState(1)
  const [uuids, setUUIDs] = useState([])
  const { copied, copy } = useClipboard()

  const handleGenerate = () => {
    const n = Math.max(1, Math.min(100, parseInt(count, 10) || 1)) // limit 1–100
    const list = Array.from({ length: n }, () => generateUUID())
    setUUIDs(list)
  }

  const handleCopyAll = () => {
    if (uuids.length) {
      copy(uuids.join('\n'))
    }
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="Number of UUIDs"
          className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <button onClick={handleGenerate} className="tool-btn">Generate</button>
        <button onClick={handleCopyAll} className="tool-btn" disabled={uuids.length === 0}>Copy All</button>
      </div>

      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
        {uuids.length === 0 ? (
          <div className="text-sm text-gray-400">Your UUIDs will appear here</div>
        ) : (
          <ul className="text-sm text-gray-800 space-y-1">
            {uuids.map((id, i) => (
              <li key={i}>{id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}