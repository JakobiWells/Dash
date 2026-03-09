import { useState } from 'react'

const STORAGE_KEY = 'quick-links-data'
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#6366f1', '#ef4444', '#f59e0b']

function getColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch { return null }
}

function normalizeUrl(url) {
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) return `https://${url}`
  return url
}

function load() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
}
function persist(links) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links)) } catch {}
}

function AppIcon({ url, label }) {
  const [failed, setFailed] = useState(false)
  const initial = label?.[0]?.toUpperCase() || '?'

  if (failed) {
    return (
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm"
        style={{ backgroundColor: getColor(label) }}
      >
        <span className="text-white text-xl font-bold select-none">{initial}</span>
      </div>
    )
  }

  return (
    <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-[#2a2a28] flex items-center justify-center shadow-sm overflow-hidden">
      <img
        src={getFavicon(url)}
        className="w-8 h-8 object-contain"
        onError={() => setFailed(true)}
        alt={label}
      />
    </div>
  )
}

export default function QuickLinks() {
  const [links, setLinks] = useState(load)
  const [adding, setAdding] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  function save(next) { setLinks(next); persist(next) }

  function addLink() {
    const url = normalizeUrl(urlInput.trim())
    if (!url) return
    const label = labelInput.trim() || (() => {
      try { return new URL(url).hostname.replace('www.', '') } catch { return url }
    })()
    save([...links, { id: Date.now(), url, label }])
    setUrlInput('')
    setLabelInput('')
    setAdding(false)
  }

  function removeLink(id) { save(links.filter(l => l.id !== id)) }

  function handleDragStart(e, i) {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    // Transparent drag image so we don't get the browser ghost
    const blank = document.createElement('div')
    e.dataTransfer.setDragImage(blank, 0, 0)
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (i !== overIndex) setOverIndex(i)
  }

  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setOverIndex(null); return }
    const next = [...links]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    save(next)
    setDragIndex(null)
    setOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="h-full flex flex-col p-3 gap-2">

      {/* Icon grid */}
      <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 p-1">

          {links.map((link, i) => (
            <div
              key={link.id}
              draggable
              onDragStart={e => handleDragStart(e, i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex flex-col items-center gap-1 group relative transition-all duration-150 ${
                dragIndex === i ? 'opacity-30 scale-95' : ''
              } ${overIndex === i && dragIndex !== i ? 'scale-105' : ''}`}
            >
              {/* Delete badge */}
              <button
                onClick={() => removeLink(link.id)}
                className="absolute -top-1 -left-1 z-10 w-4 h-4 rounded-full bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 items-center justify-center hidden group-hover:flex transition-all cursor-pointer shadow"
                aria-label="Remove"
              >
                <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 3L3 9M3 3l6 6"/>
                </svg>
              </button>

              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 active:scale-95 transition-transform block"
                onClick={e => dragIndex !== null && e.preventDefault()}
              >
                <AppIcon url={link.url} label={link.label} />
              </a>

              <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center leading-tight w-full truncate px-0.5 select-none">
                {link.label}
              </span>
            </div>
          ))}

          {/* Add icon — always at the end of the grid */}
          <div
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => setAdding(true)}
          >
            <div className="w-12 h-12 rounded-[14px] bg-gray-100 dark:bg-[#2a2a28] border-2 border-dashed border-gray-300 dark:border-[#3a3a38] flex items-center justify-center hover:scale-110 active:scale-95 transition-transform hover:border-gray-400 dark:hover:border-[#555553]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-gray-400 dark:text-gray-500"/>
              </svg>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-600 select-none">Add</span>
          </div>

        </div>
      </div>

      {/* Add form — slides in at bottom */}
      {adding && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 dark:border-[#2e2e2c]">
          <input
            autoFocus
            type="text"
            placeholder="URL (e.g. iclicker.com)"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAdding(false) }}
            className="w-full px-2 py-1 text-sm rounded-lg bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-[#555553]"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAdding(false) }}
            className="w-full px-2 py-1 text-sm rounded-lg bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-[#555553]"
          />
          <div className="flex gap-1.5">
            <button
              onClick={addLink}
              className="flex-1 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setUrlInput(''); setLabelInput('') }}
              className="flex-1 py-1 rounded-lg border border-gray-200 dark:border-[#2e2e2c] text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
