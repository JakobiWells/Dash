import { useEffect } from 'react'

export default function AddToolModal({ tools, onAdd, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Add a tool</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tool list */}
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {tools.length === 0 ? (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">All tools are on the board.</p>
          ) : (
            tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onAdd(tool.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className="text-xl">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{tool.name}</p>
                  <p className="text-xs text-gray-400 truncate">{tool.description}</p>
                </div>
                <span className="text-xs text-gray-300">Add</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
