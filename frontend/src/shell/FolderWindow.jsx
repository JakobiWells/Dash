import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Spinner from '../components/Spinner'

const TOKEN_KEY = 'gdrive-token'

function getSavedToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (obj.expires < Date.now()) return null
    return obj.token
  } catch { return null }
}

function fileIcon(mimeType) {
  if (!mimeType) return '📄'
  if (mimeType === 'application/vnd.google-apps.folder')       return '📁'
  if (mimeType === 'application/vnd.google-apps.document')     return '📝'
  if (mimeType === 'application/vnd.google-apps.spreadsheet')  return '📊'
  if (mimeType === 'application/vnd.google-apps.presentation') return '📑'
  if (mimeType.startsWith('video/'))  return '🎬'
  if (mimeType.startsWith('audio/'))  return '🎵'
  if (mimeType.startsWith('image/'))  return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  return '📄'
}

async function listFolder(token, folderId) {
  const url = new URL('https://www.googleapis.com/drive/v3/files')
  url.searchParams.set('q', `'${folderId}' in parents and trashed = false`)
  url.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,webViewLink)')
  url.searchParams.set('orderBy', 'folder,name')
  url.searchParams.set('pageSize', '100')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new Error('Session expired')
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.files || []
}

async function uploadToDrive(token, folderId, file) {
  const metadata = { name: file.name, parents: [folderId] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
  )
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export default function FolderWindow({ folderId, folderName, onClose }) {
  const [folder, setFolder] = useState([{ id: folderId, name: folderName }])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [pos, setPos] = useState(() => ({
    x: Math.max(40, window.innerWidth / 2 - 170),
    y: Math.max(40, window.innerHeight / 2 - 220),
  }))
  const draggingWindow = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const token = getSavedToken()
  const currentFolder = folder[folder.length - 1]

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    if (!token) { setError('Not connected to Drive'); setLoading(false); return }
    listFolder(token, currentFolder.id)
      .then(data => { if (!cancelled) setFiles(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [currentFolder.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Window dragging ────────────────────────────────────────────────────────
  function onTitleMouseDown(e) {
    if (e.button !== 0) return
    e.preventDefault()
    draggingWindow.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

    function onMove(e) {
      if (!draggingWindow.current) return
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
    }
    function onUp() {
      draggingWindow.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── Drag FROM window TO dashboard ─────────────────────────────────────────
  function handleDragStart(e, file) {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
    window.__driveFileDrag = {
      id: file.id, name: file.name, mimeType: file.mimeType,
      token, isFolder, href: file.webViewLink
    }
    e.dataTransfer.setData('text/plain', file.name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDragEnd() {
    window.__driveFileDrag = null
  }

  // ── Drop local files onto window to upload ────────────────────────────────
  function onWindowDragOver(e) {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      setDragOver(true)
    }
  }

  function onWindowDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
  }

  async function onWindowDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (!dropped.length || !token) return
    setUploading(true)
    try {
      for (const f of dropped) await uploadToDrive(token, currentFolder.id, f)
      const data = await listFolder(token, currentFolder.id)
      setFiles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function openItem(file) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setFolder(prev => [...prev, { id: file.id, name: file.name }])
    } else {
      window.open(file.webViewLink, '_blank')
    }
  }

  const content = (
    <div
      data-folder-window
      className="fixed z-[10000] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none"
      style={{
        left: pos.x, top: pos.y, width: 320, height: 420,
        background: dragOver ? '#eff6ff' : 'white',
        borderColor: dragOver ? '#93c5fd' : undefined,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onDragOver={onWindowDragOver}
      onDragLeave={onWindowDragLeave}
      onDrop={onWindowDrop}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 cursor-move shrink-0"
        onMouseDown={onTitleMouseDown}
      >
        <span className="text-sm">📁</span>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
          {folder.map((f, i) => (
            <span key={f.id} className="flex items-center gap-0.5 shrink-0">
              {i > 0 && <span className="text-gray-300 text-xs">/</span>}
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setFolder(prev => prev.slice(0, i + 1))}
                className={`text-xs px-0.5 rounded cursor-pointer transition-colors ${
                  i === folder.length - 1
                    ? 'text-gray-700 font-semibold'
                    : 'text-blue-500 hover:bg-blue-50'
                }`}
              >
                {f.name}
              </button>
            </span>
          ))}
        </div>

        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
          className="shrink-0 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 cursor-pointer transition-colors text-[10px]"
        >
          ✕
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
        )}
        {error && !loading && (
          <div className="flex items-center justify-center h-full text-xs text-red-400 px-4 text-center">{error}</div>
        )}
        {!loading && !error && files.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-300 text-sm">Empty folder</div>
        )}
        {!loading && !error && files.map(file => {
          const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
          return (
            <div
              key={file.id}
              draggable={true}
              onDragStart={e => handleDragStart(e, file)}
              onDragEnd={handleDragEnd}
              onDoubleClick={() => openItem(file)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 cursor-default transition-colors group"
            >
              <span className="text-base shrink-0 leading-none">{fileIcon(file.mimeType)}</span>
              <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>
              {!isFolder && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity text-xs cursor-pointer"
                  title="Open in Drive"
                >
                  ↗
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-1.5">
        {uploading ? (
          <>
            <Spinner size={11} />
            <span className="text-[10px] text-gray-400">Uploading…</span>
          </>
        ) : dragOver ? (
          <span className="text-[10px] text-blue-500 font-medium">Drop to upload to {currentFolder.name}</span>
        ) : (
          <>
            <span className="text-[10px] text-gray-300">{files.length} item{files.length !== 1 ? 's' : ''}</span>
            <span className="text-[10px] text-gray-300 ml-auto">Drag files here to upload · Double-click to open</span>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
