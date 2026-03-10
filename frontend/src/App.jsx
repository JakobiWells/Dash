import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import Grid from './shell/Grid'
import AuthModal from './components/AuthModal'
import UpgradeModal from './components/UpgradeModal'
import LayoutSwitcher from './shell/LayoutSwitcher'
import { useAuth } from './context/AuthContext'
import { usePro } from './hooks/usePro'
import {
  fetchLayouts,
  upsertLayout,
  deleteLayout,
  loadLayoutById,
  FREE_LAYOUT_LIMIT,
} from './store/layout'

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function MiniSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10"/>
    </svg>
  )
}

export default function App() {
  const { user, signOut, loading } = useAuth()
  const { isPro } = usePro()
  const gridRef = useRef(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const mainRef = useRef(null)
  const pendingScrollRef = useRef(null)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // After zoom re-render, apply the pre-computed scroll adjustment
  useLayoutEffect(() => {
    const p = pendingScrollRef.current
    if (!p) return
    pendingScrollRef.current = null
    p.el.scrollLeft = p.scrollLeft
    window.scrollTo({ top: p.scrollTop, behavior: 'instant' })
  }, [zoom])
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dashpad-dark') === '1')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('dashpad-api-key') ?? '')
  const [showKey, setShowKey] = useState(false)

  // Cloud layout state
  const [savedLayouts, setSavedLayouts] = useState([])
  const [activeLayoutId, setActiveLayoutId] = useState(
    () => localStorage.getItem('dashpad-active-layout-id') ?? null
  )
  const [saving, setSaving] = useState(false)
  const [savedTick, setSavedTick] = useState(false)
  const autoSaveTimer = useRef(null)
  const activeLayoutIdRef = useRef(activeLayoutId)
  useEffect(() => { activeLayoutIdRef.current = activeLayoutId }, [activeLayoutId])

  const settingsRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('dashpad-dark', darkMode ? '1' : '')
  }, [darkMode])

  useEffect(() => {
    function handleWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const main = mainRef.current
      if (!main) return
      const z = zoomRef.current
      const newZ = Math.min(2, Math.max(0.4, +(z - e.deltaY * 0.005).toFixed(2)))
      if (newZ === z) return
      // Capture cursor position in content space before zoom changes
      const rect = main.getBoundingClientRect()
      const cx = (e.clientX - rect.left + main.scrollLeft) / z
      const cy = (e.clientY - rect.top + window.scrollY) / z
      // Store scroll target — applied after React re-renders the new zoom
      pendingScrollRef.current = {
        el: main,
        scrollLeft: Math.max(0, cx * newZ - (e.clientX - rect.left)),
        scrollTop: Math.max(0, cy * newZ - (e.clientY - rect.top)),
      }
      setZoom(newZ)
    }
    function handleKeyDown(e) {
      if (!(e.metaKey || e.ctrlKey)) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(2)))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    if (showSettings || showUserMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettings, showUserMenu])

  // Fetch cloud layouts when user signs in; auto-load or migrate on first login
  useEffect(() => {
    if (!user) { setSavedLayouts([]); return }
    fetchLayouts()
      .then(async (data) => {
        const layouts = data ?? []
        setSavedLayouts(layouts)

        if (layouts.length === 0) {
          // First login — migrate current localStorage layout to cloud
          if (!gridRef.current) return
          const state = gridRef.current.getState()
          const saved = await upsertLayout(null, 'Default', state).catch(console.error)
          if (saved?.[0]?.id) {
            const newId = saved[0].id
            setActiveLayoutId(newId)
            activeLayoutIdRef.current = newId
            localStorage.setItem('dashpad-active-layout-id', newId)
            setSavedLayouts([{ id: newId, name: 'Default' }])
          }
        } else {
          // Auto-load: prefer the previously active layout, fall back to most recent
          const targetId = (activeLayoutIdRef.current && layouts.find(l => l.id === activeLayoutIdRef.current))
            ? activeLayoutIdRef.current
            : layouts[layouts.length - 1].id
          const layoutData = await loadLayoutById(targetId).catch(console.error)
          if (layoutData && gridRef.current) {
            gridRef.current.loadState(layoutData)
            setActiveLayoutId(targetId)
            activeLayoutIdRef.current = targetId
            localStorage.setItem('dashpad-active-layout-id', targetId)
          }
        }
      })
      .catch(console.error)
  }, [user])

  function clearLayout() {
    localStorage.setItem('toolbox-layout-v3', '[]')
    localStorage.setItem('toolbox-active-ids-v3', '[]')
    setShowSettings(false)
    window.location.reload()
  }

  // Save current grid state to cloud
  async function handleSave() {
    if (!user || !gridRef.current) return
    setSaving(true)
    try {
      const state = gridRef.current.getState()
      const name = savedLayouts.find(l => l.id === activeLayoutId)?.name ?? 'Default'
      const data = await upsertLayout(activeLayoutId, name, state)
      if (data?.[0]?.id) {
        const newId = data[0].id
        setActiveLayoutId(newId)
        localStorage.setItem('dashpad-active-layout-id', newId)
        setSavedLayouts(prev => {
          const exists = prev.find(l => l.id === newId)
          return exists
            ? prev.map(l => l.id === newId ? { ...l, name } : l)
            : [...prev, { id: newId, name }]
        })
      }
      setSavedTick(true)
      setTimeout(() => setSavedTick(false), 2000)
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  // Load a saved layout into the grid
  async function handleLoadLayout(layoutId) {
    try {
      const layoutData = await loadLayoutById(layoutId)
      if (layoutData && gridRef.current) {
        gridRef.current.loadState(layoutData)
        setActiveLayoutId(layoutId)
        localStorage.setItem('dashpad-active-layout-id', layoutId)
      }
    } catch (e) {
      console.error('Load failed:', e)
    }
  }

  // Save current state as a new named layout
  async function handleSaveAs(name) {
    if (!user || !gridRef.current) return
    // Free users are limited to 1 saved layout
    if (!isPro && savedLayouts.length >= FREE_LAYOUT_LIMIT) {
      setShowUpgradeModal(true)
      return
    }
    try {
      const state = gridRef.current.getState()
      const data = await upsertLayout(null, name, state)
      if (data?.[0]?.id) {
        const newId = data[0].id
        setActiveLayoutId(newId)
        localStorage.setItem('dashpad-active-layout-id', newId)
        setSavedLayouts(prev => [...prev, { id: newId, name }])
      }
    } catch (e) {
      console.error('Save as failed:', e)
    }
  }

  // Delete a saved layout
  async function handleDeleteLayout(layoutId) {
    try {
      await deleteLayout(layoutId)
      const remaining = savedLayouts.filter(l => l.id !== layoutId)
      setSavedLayouts(remaining)
      if (activeLayoutId === layoutId) {
        const newActive = remaining[0]?.id ?? null
        setActiveLayoutId(newActive)
        localStorage.setItem('dashpad-active-layout-id', newActive ?? '')
      }
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  // Auto-save: debounced cloud save whenever grid state changes
  function handleStateChange(state) {
    if (!user) return
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      const layoutId = activeLayoutIdRef.current
      if (!layoutId) return // no layout to save to yet
      try {
        const name = savedLayouts.find(l => l.id === layoutId)?.name ?? 'Default'
        await upsertLayout(layoutId, name, state)
        setSavedTick(true)
        setTimeout(() => setSavedTick(false), 1500)
      } catch (e) {
        console.error('Auto-save failed:', e)
      }
    }, 3000)
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'
  const canSave = !!user && !saving

  return (
    <div>
      <header
        className="flex items-center px-6 relative bg-[#f8f8f6] dark:bg-[#111110]"
        style={{ height: '64px' }}
      >
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">Dashpad</h1>

        {/* Center: layout switcher + add tool */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {/* Layout switcher — only visible when signed in and has at least one saved layout */}
          {user && savedLayouts.length > 0 && (
            <LayoutSwitcher
              savedLayouts={savedLayouts}
              activeLayoutId={activeLayoutId}
              onLoad={handleLoadLayout}
              onSaveAs={handleSaveAs}
              onDelete={handleDeleteLayout}
            />
          )}

          {/* Add tool button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
            aria-label="Add tool"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">

          {/* Feedback */}
          <button
            data-tally-open="9qdXyp"
            data-tally-width="400"
            data-tally-overlay="1"
            data-tally-form-events-forwarding="1"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Feedback"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Save layout button */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            title={!user ? 'Sign in to save your layout' : 'Save layout to cloud'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              !user
                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer'
            }`}
            aria-label="Save layout"
          >
            {saving ? <MiniSpinner /> : savedTick ? <CheckIcon /> : <SaveIcon />}
          </button>

          {/* Settings */}
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setShowSettings(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Settings"
            >
              <GearIcon />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-10 w-52 bg-white dark:bg-[#1e1e1c] rounded-lg shadow-lg border border-gray-200 dark:border-[#2e2e2c] py-1 z-50">
                <button
                  onClick={() => setDarkMode(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                >
                  <span>Dark mode</span>
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
                <button
                  onClick={clearLayout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                >
                  Clear layout
                </button>
                <div className="border-t border-gray-100 dark:border-[#2e2e2c] my-1" />
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">AI API key</p>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => { setApiKey(e.target.value); localStorage.setItem('dashpad-api-key', e.target.value) }}
                      placeholder="sk-… / sk-ant-… / AIza…"
                      className="w-full px-2 py-1 pr-7 rounded-lg text-xs bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-[#555553]"
                    />
                    <button
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer"
                      aria-label={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account — far right */}
          {!loading && (
            user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
                  aria-label="Account"
                >
                  {initials}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-10 w-52 bg-white dark:bg-[#1e1e1c] rounded-xl shadow-lg border border-gray-200 dark:border-[#2e2e2c] py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-[#2e2e2c]">
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                      <p className="text-[11px] font-medium mt-0.5">{isPro ? '✦ Pro' : 'Free plan'}</p>
                    </div>
                    {isPro ? (
                      <button
                        onClick={async () => {
                          setShowUserMenu(false)
                          const res = await fetch(`https://dash-production-3e07.up.railway.app/api/billing/portal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id }),
                          })
                          const data = await res.json()
                          if (data.url) window.location.href = data.url
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                      >
                        Manage subscription
                      </button>
                    ) : (
                      <button
                        onClick={() => { setShowUserMenu(false); setShowUpgradeModal(true) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                      >
                        Upgrade to Pro ✦
                      </button>
                    )}
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Sign in
              </button>
            )
          )}
        </div>
      </header>

      <main ref={mainRef} className="overflow-x-auto">
        <div
          className="grid-bg"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${(100 / zoom).toFixed(4)}%`,
            minHeight: `calc((100vh - 64px) / ${zoom})`,
          }}
        >
          <Grid ref={gridRef} zoom={zoom} showAddModal={showAddModal} setShowAddModal={setShowAddModal} onStateChange={handleStateChange} />
        </div>
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  )
}
