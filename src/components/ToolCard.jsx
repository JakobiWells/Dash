export default function ToolCard({ tool, onRemove, children }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2e2e2c] overflow-hidden">
      {/* Header / drag handle */}
      <div className="flex items-center border-b border-gray-100 dark:border-[#2e2e2c]">
        <div className="drag-handle flex items-center gap-2 px-4 py-3 flex-1 cursor-grab active:cursor-grabbing select-none">
          <span className="text-lg">{tool.icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tool.name}</span>
        </div>
        <button
          className="px-3 py-3 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
          onClick={onRemove}
          aria-label="Close tool"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tool content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  )
}
