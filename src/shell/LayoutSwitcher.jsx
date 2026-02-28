import { useState, useRef, useEffect } from 'react'
import { FREE_LAYOUT_LIMIT } from '../store/layout'

export default function LayoutSwitcher({ savedLayouts, activeLayoutId, onLoad, onSaveAs, onDelete }) {
  const [open, setOpen] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const atLimit = savedLayouts.length >= FREE_LAYOUT_LIMIT

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setShowNameInput(false)
        setNewName('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (showNameInput && inputRef.current) inputRef.current.focus()
  }, [showNameInput])

  async function handleSaveAs() {
    if (!newName.trim() || saving) return
    setSaving(true)
    await onSaveAs(newName.trim())
    setSaving(false)
    setNewName('')
    setShowNameInput(false)
    setOpen(false)
  }

  if (savedLayouts.length === 0) return null

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        aria-label="Saved layouts"
        title="Saved layouts"
      >
        {/* Layers icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-10 w-52 bg-white dark:bg-[#1e1e1c] rounded-xl shadow-lg border border-gray-200 dark:border-[#2e2e2c] py-1 z-50">

          {/* Saved layout list */}
          {savedLayouts.map(layout => (
            <button
              key={layout.id}
              onClick={() => { onLoad(layout.id); setOpen(false) }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
            >
              <span className="truncate">{layout.name}</span>
              {layout.id === activeLayoutId && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-500 dark:text-gray-400">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}

          <div className="border-t border-gray-100 dark:border-[#2e2e2c] my-1" />

          {/* Save as new */}
          {showNameInput ? (
            <div className="px-3 py-2 flex gap-1.5">
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveAs()
                  if (e.key === 'Escape') { setShowNameInput(false); setNewName('') }
                }}
                placeholder="Layout name…"
                className="flex-1 px-2 py-1 rounded-lg text-xs bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
              />
              <button
                onClick={handleSaveAs}
                disabled={!newName.trim() || saving}
                className="px-2 py-1 rounded-lg text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { if (!atLimit) setShowNameInput(true) }}
              disabled={atLimit}
              title={atLimit ? 'Upgrade to Pro to save more layouts' : undefined}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a28] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Save as new…
              {atLimit && <span className="ml-auto text-xs text-gray-300 dark:text-gray-600">Pro</span>}
            </button>
          )}

          {/* Delete (only if multiple layouts exist) */}
          {savedLayouts.length > 1 && activeLayoutId && (
            <>
              <div className="border-t border-gray-100 dark:border-[#2e2e2c] my-1" />
              <button
                onClick={() => { onDelete(activeLayoutId); setOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Delete this layout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
