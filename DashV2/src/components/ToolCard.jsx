import { Component, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tool failed to load</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono break-all">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}

function loadCustom(instanceId) {
  try {
    const raw = localStorage.getItem(`tool-custom-${instanceId}`)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCustom(instanceId, data) {
  localStorage.setItem(`tool-custom-${instanceId}`, JSON.stringify(data))
}

export default function ToolCard({ tool, instanceId, onRemove, children }) {
  const [showSettings, setShowSettings] = useState(false)
  const [dropdownPos, setDropdownPos]   = useState({ top: 0, right: 0 })
  const gearBtnRef  = useRef(null)
  const dropdownRef = useRef(null)

  // Per-instance overrides
  const [custom, setCustom] = useState(() => loadCustom(instanceId))
  // Draft state inside settings — only committed on Save
  const [draft, setDraft] = useState({ label: '', emoji: '' })

  const displayName  = custom.label  !== undefined ? custom.label  : tool.name
  const displayEmoji = custom.emoji  !== undefined ? custom.emoji  : tool.icon

  function openSettings() {
    const rect = gearBtnRef.current?.getBoundingClientRect()
    if (rect) setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    // Seed draft from current values
    setDraft({
      label: custom.label  !== undefined ? custom.label  : tool.name,
      emoji: custom.emoji  !== undefined ? custom.emoji  : (tool.icon?.startsWith('/') ? '' : (tool.icon ?? '')),
    })
    setShowSettings(s => !s)
  }

  function saveCustomization() {
    const next = { label: draft.label, emoji: draft.emoji }
    setCustom(next)
    saveCustom(instanceId, next)
    setShowSettings(false)
  }

  useEffect(() => {
    if (!showSettings) return
    function handleOutside(e) {
      if (!gearBtnRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showSettings])

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2e2e2c] overflow-hidden">
      {/* Header / drag handle */}
      <div className="flex items-center border-b border-gray-100 dark:border-[#2e2e2c] h-8 shrink-0">
        <div className="drag-handle flex items-center gap-1.5 px-3 flex-1 h-full cursor-grab active:cursor-grabbing select-none min-w-0">
          {displayEmoji?.startsWith('/')
            ? <img src={displayEmoji} alt={displayName} className="w-4 h-4 object-contain shrink-0" />
            : displayEmoji
              ? <span className="text-sm leading-none shrink-0">{displayEmoji}</span>
              : null}
          {displayName
            ? <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</span>
            : null}
        </div>
        <button
          ref={gearBtnRef}
          className="px-2 h-full text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer shrink-0"
          onClick={openSettings}
          aria-label="Settings"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2.5"/>
            <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06"/>
          </svg>
        </button>
        <button
          className="px-2 h-full text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer shrink-0"
          onClick={onRemove}
          aria-label="Close tool"
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tool content */}
      <div className="flex-1 overflow-auto p-3">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      {/* Settings dropdown */}
      {showSettings && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-56 bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2e2e2c] overflow-hidden"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-9 border-b border-gray-100 dark:border-[#2e2e2c]">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Settings</span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Customize section */}
          <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customize</p>

            {/* Emoji + label row */}
            <div className="flex gap-1.5">
              <input
                value={draft.emoji}
                onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))}
                className="w-9 text-center text-sm border border-gray-200 dark:border-[#3a3a38] rounded-lg bg-transparent focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
                placeholder={tool.icon?.startsWith('/') ? '' : (tool.icon ?? '?')}
                maxLength={2}
              />
              <input
                value={draft.label}
                onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveCustomization()}
                className="flex-1 text-xs border border-gray-200 dark:border-[#3a3a38] rounded-lg px-2 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                placeholder="No label"
              />
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={saveCustomization}
                className="flex-1 py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
              >Save</button>
              {(custom.label !== undefined || custom.emoji !== undefined) && (
                <button
                  onClick={() => {
                    setCustom({})
                    saveCustom(instanceId, {})
                    setShowSettings(false)
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#2e2e2c] text-gray-400 dark:text-gray-500 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors"
                  title="Reset to default"
                >Reset</button>
              )}
            </div>
          </div>

          {/* Tool info */}
          <div className="border-t border-gray-100 dark:border-[#2e2e2c] px-3 py-2">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tool</p>
            <div className="flex items-center gap-1.5">
              {tool.icon?.startsWith('/')
                ? <img src={tool.icon} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                : <span className="text-xs leading-none">{tool.icon}</span>}
              <span className="text-xs text-gray-500 dark:text-gray-400">{tool.name}</span>
            </div>
            {tool.description && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{tool.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 dark:border-[#2e2e2c] p-2">
            <button
              onClick={() => { setShowSettings(false); onRemove() }}
              className="w-full px-3 py-1.5 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-left"
            >
              Remove tool
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
