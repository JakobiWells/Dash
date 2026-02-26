import { useState, useEffect, useRef, useMemo } from 'react'

const CATEGORY_ORDER = ['Finance', 'Text', 'Files', 'Developer', 'Math', 'Productivity']

export default function AddToolModal({ tools, onAdd, onClose }) {
  const [query, setQuery] = useState('')
  const panelRef = useRef(null)
  const searchRef = useRef(null)
  const sectionRefs = useRef({})

  // Focus search on open
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Close on Escape or click outside
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

  // Build grouped sections
  const sections = useMemo(() => {
    const popular = tools.filter(t => t.popular)
    const byCategory = {}
    for (const t of tools) {
      const cat = t.category ?? 'Other'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(t)
    }
    const result = []
    if (popular.length) result.push({ label: 'Popular', tools: popular, isPopular: true })
    for (const cat of CATEGORY_ORDER) {
      if (byCategory[cat]) result.push({ label: cat, tools: byCategory[cat] })
    }
    // Any categories not in the ordered list
    for (const cat of Object.keys(byCategory)) {
      if (!CATEGORY_ORDER.includes(cat) && result.every(s => s.label !== cat)) {
        result.push({ label: cat, tools: byCategory[cat] })
      }
    }
    return result
  }, [tools])

  // Filtered flat list when searching
  const filtered = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    )
  }, [query, tools])

  function scrollToSection(label) {
    sectionRefs.current[label]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const categoryPills = sections.filter(s => !s.isPopular).map(s => s.label)

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2e2e2c] flex flex-col overflow-hidden"
      style={{ top: 72, left: '50%', transform: 'translateX(-50%)', width: 340, maxHeight: 480 }}
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

      {/* Category pills — hidden while searching */}
      {!filtered && categoryPills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-gray-100 dark:border-[#2e2e2c] shrink-0">
          {categoryPills.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToSection(cat)}
              className="px-2.5 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a28] hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable list */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {filtered ? (
          // Search results — flat list
          filtered.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">No tools match your search.</p>
          ) : (
            filtered.map(tool => (
              <ToolRow key={tool.id} tool={tool} onAdd={() => onAdd(tool.id)} />
            ))
          )
        ) : (
          // Grouped sections
          tools.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 dark:text-gray-500 text-center">All tools are on the board.</p>
          ) : (
            sections.map(section => (
              <div key={section.label} ref={el => { sectionRefs.current[section.label] = el }}>
                {/* Section header */}
                <div className="flex items-center gap-1.5 px-4 pt-4 pb-1">
                  {section.isPopular && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {section.label}
                  </span>
                </div>
                {section.tools.map(tool => (
                  <ToolRow key={`${section.label}-${tool.id}`} tool={tool} onAdd={() => onAdd(tool.id)} />
                ))}
              </div>
            ))
          )
        )}
      </div>
        {/* Fade indicator — hints there's more content below */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#1e1e1c] to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

function ToolRow({ tool, onAdd }) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors text-left cursor-pointer group"
    >
      <span className="text-lg shrink-0">{tool.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tool.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{tool.description}</p>
      </div>
      <span className="text-xs text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0">Add</span>
    </button>
  )
}
