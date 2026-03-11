import { useState, useRef, useEffect } from 'react'
import { useDashFiles } from '../context/FileContext'
import { getTools } from '../registry'
import FolderWindow from './FolderWindow'

const TYPE_COLORS = [
  ['image/',      '#4B9CF5'],
  ['video/',      '#8B5CF6'],
  ['audio/',      '#EF4444'],
  ['application/pdf', '#DC2626'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml', '#2563EB'],
  ['application/msword', '#2563EB'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml', '#16A34A'],
  ['application/vnd.ms-excel', '#16A34A'],
  ['text/', '#6B7280'],
]

function getColor(type) {
  for (const [prefix, color] of TYPE_COLORS) {
    if (type?.startsWith(prefix)) return color
  }
  return '#64748B'
}

// MIME prefix → tool IDs that can handle the file
const FILE_OPENERS = [
  { prefix: 'application/pdf',  tools: ['pdf-splitter', 'pdf-merger'] },
  { prefix: 'audio/',           tools: ['key-bpm-detector', 'stem-splitter'] },
  { prefix: 'video/',           tools: ['audio-extractor', 'stem-splitter'] },
  { prefix: 'image/',           tools: ['handwriting-converter'] },
]

function getOpenerToolIds(mimeType) {
  if (!mimeType) return []
  const ids = []
  for (const { prefix, tools } of FILE_OPENERS) {
    if (mimeType.startsWith(prefix) || mimeType === prefix) {
      for (const id of tools) if (!ids.includes(id)) ids.push(id)
    }
  }
  return ids
}

const ALL_TOOLS = getTools()

export default function FileCard({ fileId, onRemove }) {
  const { files } = useDashFiles()
  const file = files.find(f => f.id === fileId)
  const [showOpener, setShowOpener] = useState(false)
  const [showFolderWindow, setShowFolderWindow] = useState(false)
  const popoverRef = useRef(null)

  // Close popover on outside click
  useEffect(() => {
    if (!showOpener) return
    function onDown(e) {
      if (!popoverRef.current?.contains(e.target)) setShowOpener(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showOpener])

  if (!file) return null

  const isDriveFolder = file.type === 'application/x-drive-folder'
  const isImage = file.type?.startsWith('image/')
  const ext = file.name?.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE'
  const color = getColor(file.type)
  const openerIds = isDriveFolder ? [] : getOpenerToolIds(file.type)
  const openerTools = openerIds.map(id => ALL_TOOLS.find(t => t.id === id)).filter(Boolean)

  function openInTool(toolId) {
    setShowOpener(false)
    window.dispatchEvent(new CustomEvent('dash:open-file', {
      detail: { file: { name: file.name, type: file.type, size: file.size, objectUrl: file.objectUrl }, toolId }
    }))
  }

  return (
    <>
    {showFolderWindow && isDriveFolder && (
      <FolderWindow
        folderId={file.driveId}
        folderName={file.name}
        onClose={() => setShowFolderWindow(false)}
      />
    )}
    <div
      className="drag-handle h-full flex flex-col items-center justify-center gap-1.5 group relative cursor-grab active:cursor-grabbing select-none px-2"
      onDoubleClick={isDriveFolder ? () => setShowFolderWindow(true) : undefined}
    >

      {/* Remove button — top right */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900 text-white opacity-0 group-hover:opacity-70 flex items-center justify-center transition-opacity z-10 cursor-pointer"
        aria-label="Remove"
      >
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
          <path d="M1 1l5 5M6 1L1 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Drive folder — open link button top left */}
      {isDriveFolder && file.href && (
        <a
          href={file.href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 w-5 h-5 rounded-full bg-gray-900 text-white opacity-0 group-hover:opacity-70 flex items-center justify-center transition-opacity cursor-pointer z-10"
          title="Open in Google Drive"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 1h4v4M9 1L5 5M4 2H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6"/>
          </svg>
        </a>
      )}

      {/* Open with button — top left (only if compatible tools exist) */}
      {!isDriveFolder && openerTools.length > 0 && (
        <div className="absolute top-1 left-1 z-10" ref={popoverRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowOpener(v => !v) }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded-full bg-gray-900 text-white opacity-0 group-hover:opacity-70 flex items-center justify-center transition-opacity cursor-pointer"
            title="Open with…"
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 1h4v4M9 1L5 5M4 2H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6"/>
            </svg>
          </button>

          {showOpener && (
            <div className="absolute top-6 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px] z-50">
              <p className="px-3 pt-1 pb-1.5 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Open with</p>
              {openerTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={(e) => { e.stopPropagation(); openInTool(tool.id) }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <span>{tool.icon}</span>
                  <span>{tool.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isDriveFolder ? (
        <div className="text-5xl leading-none" title="Click to browse folder">📁</div>
      ) : isImage ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border-2 border-white">
          <img
            src={file.objectUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <div
          className="w-12 h-14 rounded-lg shadow-md flex flex-col items-center justify-end pb-2 relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {/* Folded corner */}
          <div className="absolute top-0 right-0 w-0 h-0" style={{
            borderTop: '14px solid #f8f8f6',
            borderLeft: '14px solid transparent',
          }} />
          <span className="text-[9px] font-bold text-white tracking-wider">{ext.slice(0, 4)}</span>
        </div>
      )}

      <p
        className="text-[11px] text-gray-700 text-center w-full leading-tight"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {file.name}
      </p>
    </div>
    </>
  )
}
