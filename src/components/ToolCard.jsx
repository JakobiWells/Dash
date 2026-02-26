import { Component } from 'react'

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

export default function ToolCard({ tool, onRemove, children }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1c] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2e2e2c] overflow-hidden">
      {/* Header / drag handle */}
      <div className="flex items-center border-b border-gray-100 dark:border-[#2e2e2c]">
        <div className="drag-handle flex items-center gap-2 px-4 py-3 flex-1 cursor-grab active:cursor-grabbing select-none">
          {tool.icon?.startsWith('/')
            ? <img src={tool.icon} alt={tool.name} className="w-5 h-5 object-contain shrink-0" />
            : <span className="text-lg">{tool.icon}</span>}
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

      {/* Tool content — isolated so a crash here can't take down the whole page */}
      <div className="flex-1 overflow-auto p-4">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  )
}
