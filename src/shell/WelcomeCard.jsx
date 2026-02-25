export default function WelcomeCard({ onDismiss }) {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header / drag handle */}
      <div className="flex items-center border-b border-gray-100">
        <div className="drag-handle flex items-center gap-2 px-4 py-3 flex-1 cursor-grab active:cursor-grabbing select-none">
          <span className="text-lg">🧩</span>
          <span className="text-sm font-medium text-gray-700">Welcome to Dashpad</span>
        </div>
        <button
          onClick={onDismiss}
          className="px-3 py-3 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Your digital workspace.</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Dashpad is a free collection of tools that runs entirely in your browser.
            No ads, no uploads, no account required.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">How it works</p>
          {[
            { icon: '+', label: 'Press + to add tools to your board' },
            { icon: '⤢', label: 'Drag cards anywhere to rearrange' },
            { icon: '⤡', label: 'Resize any card from its corner' },
            { icon: '✕', label: 'Close cards you don\'t need' },
            { icon: '☁', label: 'Sign in to save your layout' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0 font-medium">
                {icon}
              </span>
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Get started
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Your files never leave your browser.
          </p>
        </div>
      </div>
    </div>
  )
}
