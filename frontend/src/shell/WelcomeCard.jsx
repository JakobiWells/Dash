import { useState } from 'react'
import { LAYOUTS } from '../layouts'

const STEPS = [
  { icon: '+',  text: 'Press + to browse and add tools' },
  { icon: '⤢', text: 'Drag cards to rearrange your board' },
  { icon: '⤡', text: 'Resize cards from the corner handle' },
  { icon: '☁', text: 'Sign in to sync across devices' },
]

export default function WelcomeCard({ onDismiss, onPreviewCategory, onClearPreview, onApplyLayout }) {
  const [hoveredCat, setHoveredCat] = useState(null)

  function handleEnter(cat) {
    setHoveredCat(cat.id)
    onPreviewCategory?.(cat.id)
  }

  function handleLeave() {
    setHoveredCat(null)
    onClearPreview?.()
  }

  function handleApply(catId) {
    onApplyLayout?.(catId)
  }

  const activeCat = LAYOUTS.find(l => l.id === hoveredCat)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2e2e2c] overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-gray-100 dark:border-[#2e2e2c]">
        <div className="drag-handle flex items-center gap-2 px-4 py-3 flex-1 cursor-grab active:cursor-grabbing select-none">
          <span className="text-base">🧩</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Welcome to Dashpad</span>
        </div>
        <button
          onClick={onDismiss}
          className="px-3 py-3 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-50 dark:border-[#2a2a28]">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1.5">
            Your all-in-one<br />browser workspace.
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            50+ tools in one tab — no installs, no sign-up required.
            Arrange everything exactly how you work.
          </p>
        </div>

        {/* How it works */}
        <div className="px-5 py-4 border-b border-gray-50 dark:border-[#2a2a28]">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">How it works</p>
          <div className="grid grid-cols-2 gap-2">
            {STEPS.map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-md bg-gray-100 dark:bg-[#2a2a28] flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-semibold">
                  {icon}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-300 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category browser */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Browse by category
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-snug">
            Hover a category to preview its tools on the board →
          </p>
          <div className="flex flex-col gap-1.5">
            {LAYOUTS.map(cat => {
              const isHovered = hoveredCat === cat.id
              return (
                <button
                  key={cat.id}
                  onMouseEnter={() => handleEnter(cat)}
                  onMouseLeave={handleLeave}
                  onClick={() => handleApply(cat.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left cursor-pointer"
                  style={{
                    borderColor: isHovered ? cat.accent + '60' : 'transparent',
                    backgroundColor: isHovered ? cat.accent + '12' : 'transparent',
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all duration-150"
                    style={{ backgroundColor: isHovered ? cat.accent + '25' : '#f3f4f6' }}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{cat.name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 truncate">
                      {cat.tools.slice(0, 4).map(t => (typeof t === 'string' ? t : t.id).replace(/-/g, ' ')).join(', ')}
                      {cat.tools.length > 4 ? ` +${cat.tools.length - 4} more` : ''}
                    </div>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                    className="shrink-0 transition-all duration-150"
                    style={{ opacity: isHovered ? 1 : 0, color: cat.accent }}
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-[#2e2e2c]">
        {activeCat ? (
          <button
            onClick={() => handleApply(activeCat.id)}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-150 cursor-pointer"
            style={{ backgroundColor: activeCat.accent }}
          >
            Use {activeCat.name} layout →
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
          >
            Start exploring →
          </button>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2">
          Your data never leaves your browser.
        </p>
      </div>
    </div>
  )
}
