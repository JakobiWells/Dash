import { useState, useRef, useEffect } from 'react'
import Grid from './shell/Grid'
import AuthModal from './components/AuthModal'
import { useAuth } from './context/AuthContext'

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

export default function App() {
  const { user, signOut, loading } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dashpad-dark') === '1')
  const settingsRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('dashpad-dark', darkMode ? '1' : '')
  }, [darkMode])

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false)
    }
    if (showSettings || showUserMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSettings, showUserMenu])

  function clearLayout() {
    localStorage.setItem('toolbox-layout-v3', '[]')
    localStorage.setItem('toolbox-active-ids-v3', '[]')
    setShowSettings(false)
    window.location.reload()
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <header
        className="flex items-center px-6 relative bg-[#f8f8f6] dark:bg-[#111110]"
        style={{ height: '64px' }}
      >
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">Dashpad</h1>

        {/* Add tool button — centered */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
          aria-label="Add tool"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="ml-auto flex items-center gap-2">

          {/* Account */}
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
                    <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 truncate border-b border-gray-100 dark:border-[#2e2e2c]">{user.email}</p>
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
                {/* Dark mode toggle */}
                <button
                  onClick={() => setDarkMode(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                >
                  <span>Dark mode</span>
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-4' : ''}`} />
                  </div>
                </button>
                <div className="border-t border-gray-100 dark:border-[#2e2e2c] my-1" />
                <button
                  onClick={clearLayout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer"
                >
                  Clear layout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <Grid showAddModal={showAddModal} setShowAddModal={setShowAddModal} />
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
