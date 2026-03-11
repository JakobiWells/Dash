import { useState, useEffect, useRef, useMemo } from 'react'

const CATEGORY_ORDER = ['Finance', 'Text', 'Files', 'Developer', 'Math', 'Science', 'Music', 'Productivity', 'Utilities', 'AI', 'Games']

export default function AddToolModal({ tools, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const panelRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    function onMouseDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [onClose])

  // Build ordered category list
  const categories = useMemo(() => {
    const cats = ['All']
    for (const cat of CATEGORY_ORDER) {
      if (tools.some(t => t.category === cat)) cats.push(cat)
    }
    for (const t of tools) {
      const cat = t.category ?? 'Other'
      if (!cats.includes(cat)) cats.push(cat)
    }
    return cats
  }, [tools])

  const displayedTools = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase()
      return tools.filter(t =>
        t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      )
    }
    if (activeCategory === 'All') return tools
    return tools.filter(t => (t.category ?? 'Other') === activeCategory)
  }, [tools, query, activeCategory])

  const isSearching = query.trim().length > 0

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2e2e2c] flex flex-col overflow-hidden"
      style={{ top: 72, left: '50%', transform: 'translateX(-50%)', width: 600, maxHeight: 600 }}
    >
      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#2e2e2c] shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600 shrink-0">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="flex-1 text-sm text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Category tabs — hidden while searching */}
      {!isSearching && (
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-gray-100 dark:border-[#2e2e2c] shrink-0 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                activeCategory === cat
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a28] hover:bg-gray-200 dark:hover:bg-[#333331]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 min-h-0">
        {displayedTools.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            {isSearching ? 'No tools match your search.' : 'No tools in this category.'}
          </p>
        ) : isSearching ? (
          // Search: flat list
          <div className="flex flex-col">
            {displayedTools.map(tool => (
              <SearchRow key={tool.id} tool={tool} onAdd={() => onAdd(tool.id)} />
            ))}
          </div>
        ) : (
          // Browse: 3-column card grid
          <div className="grid grid-cols-3 gap-2">
            {displayedTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onAdd={() => onAdd(tool.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ToolCard({ tool, onAdd }) {
  return (
    <button
      onClick={onAdd}
      className="group relative flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors cursor-pointer text-center"
    >
      {/* + on hover */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500">
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Icon container */}
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#252523] group-hover:bg-white dark:group-hover:bg-[#2e2e2c] transition-colors shadow-sm">
        {tool.icon?.startsWith('/')
          ? <img src={tool.icon} alt="" className="w-6 h-6 object-contain" />
          : <span className="text-2xl leading-none">{tool.icon}</span>}
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">{tool.name}</p>

      {/* Description */}
      {tool.description && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">{tool.description}</p>
      )}
    </button>
  )
}

function SearchRow({ tool, onAdd }) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors text-left cursor-pointer group"
    >
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-[#252523] shrink-0">
        {tool.icon?.startsWith('/')
          ? <img src={tool.icon} alt="" className="w-5 h-5 object-contain" />
          : <span className="text-base leading-none">{tool.icon}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tool.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tool.description}</p>
      </div>
      <span className="text-xs text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0">Add</span>
    </button>
  )
}
