import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react'
import GridLayout from 'react-grid-layout'
import { getTools, getComponent } from '../registry'
import ToolCard from '../components/ToolCard'
import FileCard from './FileCard'
import AddToolModal from './AddToolModal'
import { useAuth } from '../context/AuthContext'
import { useDashFiles } from '../context/FileContext'
import { LAYOUTS } from '../layouts'

// Must match background-size in index.css
const CELL = 32
// Extra columns/rows always available beyond the rightmost/lowest tool
const EXTRA_COLS = 500
const EXTRA_ROWS = 500

function snapWidth(raw) {
  return Math.floor(raw / CELL) * CELL
}

const ALL_TOOLS = getTools()

// Instance IDs are `${toolId}__${suffix}` — split to get the base tool ID
function getToolId(instanceId) {
  return instanceId.split('__')[0]
}

const LAYOUT_KEY = 'toolbox-layout-v3'
const ACTIVE_KEY = 'toolbox-active-ids-v3'

const DEFAULT_TOOL_IDS = ['desmos', 'media-downloader', 'calculator', 'qr-code', 'google-drive', 'notepad']

function buildFirstVisitLayout() {
  // Two columns: col A = x:0 (w:14), col B = x:14
  const positions = [
    { x: 0,  y: 0  },  // desmos          14×16
    { x: 14, y: 0  },  // media-downloader  8×10
    { x: 14, y: 10 },  // calculator        8×14
    { x: 22, y: 0  },  // qr-code          10×18
    { x: 0,  y: 16 },  // google-drive     14×18
    { x: 14, y: 24 },  // notepad           8×10
  ]
  return DEFAULT_TOOL_IDS.map((id, i) => {
    const tool = ALL_TOOLS.find(t => t.id === id)
    if (!tool) return null
    return {
      i: `${id}__0`,
      x: positions[i].x,
      y: positions[i].y,
      w: tool.defaultSize?.w ?? 10,
      h: tool.defaultSize?.h ?? 8,
      minW: tool.minSize?.w ?? 4,
      minH: tool.minSize?.h ?? 4,
    }
  }).filter(Boolean)
}

// Build layout items from layout JSON tool defs.
// Each def is either a string "tool-id" or { id, x, y } with explicit grid position.
// Layout JSONs use x:20+ (designed with welcome card at x:0-19), so subtract 20.
function buildCategoryLayout(toolDefs) {
  const autoCols = [
    { x: 0, w: 14, nextY: 0 },
    { x: 14, w: 13, nextY: 0 },
  ]
  let autoIdx = 0
  return toolDefs.slice(0, 8).map(def => {
    const toolId = typeof def === 'string' ? def : def.id
    const tool = ALL_TOOLS.find(t => t.id === toolId)
    if (!tool) return null
    const w = tool.defaultSize?.w ?? 10
    const h = tool.defaultSize?.h ?? 8
    if (typeof def === 'object' && def.x != null && def.y != null) {
      return { i: toolId, x: Math.max(0, def.x - 20), y: def.y, w, h, minW: w, minH: h }
    }
    const col = autoCols[autoIdx % 2]
    const item = { i: toolId, x: col.x, y: col.nextY, w: col.w, h, minW: col.w, minH: h }
    col.nextY += h
    autoIdx++
    return item
  }).filter(Boolean)
}

// Convert the current browser viewport to grid cell coordinates
function getViewportGridBounds(container, zoom) {
  if (!container) return null
  const rect = container.getBoundingClientRect()
  const cellPx = CELL * zoom
  const minX = Math.max(0, Math.floor(-rect.left / cellPx))
  const minY = Math.max(0, Math.floor(-rect.top / cellPx))
  const maxX = minX + Math.floor(window.innerWidth / cellPx)
  const maxY = minY + Math.floor(window.innerHeight / cellPx)
  return { minX, minY, maxX, maxY }
}

// Scan for the first (topmost, leftmost) clear rectangle of size w×h in the layout.
// If viewportBounds is provided, search within the visible area first.
// The x range is always capped to the viewport's right edge so tools never appear off-screen to the right.
function findFreeSpace(layout, w, h, cols = 500, viewportBounds = null) {
  // Cap x so tools never land beyond the viewport's right edge (right space is reserved for zoom-out)
  const xCap = viewportBounds
    ? Math.max(0, Math.min(viewportBounds.maxX - w, cols - w))
    : Math.max(0, cols - w)

  // 1. Try to fit entirely within the current viewport
  if (viewportBounds) {
    const { minX, minY, maxX, maxY } = viewportBounds
    const xMax = Math.min(maxX - w, cols - w)
    const yMax = maxY - h
    if (xMax >= minX && yMax >= minY) {
      for (let y = minY; y <= yMax; y++) {
        for (let x = minX; x <= xMax; x++) {
          const clear = !layout.some(item =>
            item.x < x + w && item.x + item.w > x &&
            item.y < y + h && item.y + item.h > y
          )
          if (clear) return { x, y }
        }
      }
    }
  }
  // 2. Fall back: scan the full layout top→bottom, but keep x within the viewport's width
  const maxY = layout.reduce((m, item) => Math.max(m, item.y + item.h), 0)
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= xCap; x++) {
      const clear = !layout.some(item =>
        item.x < x + w && item.x + item.w > x &&
        item.y < y + h && item.y + item.h > y
      )
      if (clear) return { x, y }
    }
  }
  return { x: 0, y: maxY } // last resort: below everything
}

function loadSaved() {
  try {
    const s = localStorage.getItem(LAYOUT_KEY)
    if (!s) return null
    const parsed = JSON.parse(s)
    // Restore any items whose sizes were corrupted below their tool's minSize
    // (react-grid-layout can emit 1×1 on initial mount before constraints apply)
    return parsed.map(item => {
      const toolId = item.i.split('__')[0]
      const tool = ALL_TOOLS.find(t => t.id === toolId)
      if (!tool) return item
      const minW = tool.minSize?.w ?? 1
      const minH = tool.minSize?.h ?? 1
      if (item.w < minW || item.h < minH) {
        return { ...item, w: tool.defaultSize?.w ?? minW, h: tool.defaultSize?.h ?? minH }
      }
      return item
    })
  } catch { return null }
}
function saveSaved(layout) {
  // Never persist file or welcome items
  const toolsOnly = layout.filter(item => !item.i.startsWith('file__') && !item.i.startsWith('welcome__'))
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(toolsOnly)) } catch {}
}
function loadActiveIds() {
  try { const s = localStorage.getItem(ACTIVE_KEY); return s ? JSON.parse(s) : null } catch { return null }
}
function saveActiveIds(ids) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(ids)) } catch {}
}

// Google Workspace mimeTypes that must be exported (cannot be downloaded directly)
const WORKSPACE_EXPORT_MAP = {
  'application/vnd.google-apps.document':     'application/pdf',
  'application/vnd.google-apps.spreadsheet':  'application/pdf',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing':      'application/pdf',
}

async function downloadDriveFile(id, mimeType, name, token) {
  const exportMime = WORKSPACE_EXPORT_MAP[mimeType]
  let url, fileName

  if (exportMime) {
    url = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(exportMime)}`
    fileName = name.endsWith('.pdf') ? name : `${name}.pdf`
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`
    fileName = name
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`)
  const blob = await res.blob()
  return { blob, fileName, type: exportMime || mimeType }
}

const Grid = forwardRef(function Grid({ showAddModal, setShowAddModal, zoom = 1, onStateChange }, ref) {
  const { user, loading } = useAuth()
  const { files: dashFiles, addFile, removeFile: removeDashFile } = useDashFiles()
  const containerRef = useRef(null)
  const [windowWidth, setWindowWidth] = useState(() => snapWidth(window.innerWidth))

  useEffect(() => {
    function onResize() { setWindowWidth(snapWidth(window.innerWidth)) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [activeIds, setActiveIds] = useState(() => {
    const saved = loadActiveIds()
    if (saved !== null) return saved
    return DEFAULT_TOOL_IDS.map(id => `${id}__0`)
  })

  const [layout, setLayout] = useState(() => {
    const saved = loadSaved()
    if (saved !== null) return saved
    return buildFirstVisitLayout()
  })

  // Category preview (driven from guide panel WelcomeView hover)
  const [previewCategoryId, setPreviewCategoryId] = useState(null)

  const previewItems = useMemo(() => {
    if (!previewCategoryId) return []
    const cat = LAYOUTS.find(l => l.id === previewCategoryId)
    if (!cat) return []
    return buildCategoryLayout(cat.tools).map(item => ({ ...item, i: `preview__${item.i}` }))
  }, [previewCategoryId])

  const displayLayout = useMemo(() => {
    if (!previewItems.length) return layout
    const defaultInstanceIds = new Set(DEFAULT_TOOL_IDS.map(id => `${id}__0`))
    const base = layout.filter(item => !defaultInstanceIds.has(item.i))
    return [...base, ...previewItems]
  }, [layout, previewItems])

  // Dynamic grid size: use real layout only — preview items must not cause scroll/resize jumps
  const toolsRightEdge = layout.reduce((m, item) => Math.max(m, item.x + item.w), 0)
  const toolsBottomEdge = layout.reduce((m, item) => Math.max(m, item.y + item.h), 0)
  const cols = Math.max(Math.floor(windowWidth / CELL), toolsRightEdge + EXTRA_COLS)
  const effectiveWidth = cols * CELL
  const minGridHeight = (toolsBottomEdge + EXTRA_ROWS) * CELL

  // Expose getState / loadState / applyLayout to parent (App.jsx) via ref
  useImperativeHandle(ref, () => ({
    getState() {
      const toolsOnly = layout.filter(item => !item.i.startsWith('file__'))
      return { layout: toolsOnly, activeIds }
    },
    loadState({ layout: newLayout, activeIds: newIds }) {
      setLayout(newLayout)
      setActiveIds(newIds)
      saveSaved(newLayout)
      saveActiveIds(newIds)
    },
    applyLayout(categoryId) {
      const cat = LAYOUTS.find(l => l.id === categoryId)
      if (!cat) return
      const newIds = cat.tools.slice(0, 8).map(def => `${typeof def === 'string' ? def : def.id}__0`)
      const newLayout = buildCategoryLayout(cat.tools).map(item => ({ ...item, i: item.i + '__0' }))
      setActiveIds(newIds)
      saveActiveIds(newIds)
      setPreviewCategoryId(null)
      setLayout(prev => {
        const filesOnly = prev.filter(item => item.i.startsWith('file__'))
        const combined = [...filesOnly, ...newLayout]
        saveSaved(combined)
        return combined
      })
    },
    setPreviewCategory(categoryId) { setPreviewCategoryId(categoryId) },
    clearPreview() { setPreviewCategoryId(null) },
  }), [layout, activeIds])

  // Notify parent when grid state changes (for cloud auto-save)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!onStateChange) return
    const toolsOnly = layout.filter(item => !item.i.startsWith('file__'))
    onStateChange({ layout: toolsOnly, activeIds })
  }, [layout, activeIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const onLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout)
    // Guard: skip saving if any tool item is below its manifest minSize
    // (react-grid-layout can emit shrunken sizes on initial mount)
    const corrupted = newLayout.some(item => {
      if (item.i.startsWith('file__')) return false
      const tool = ALL_TOOLS.find(t => t.id === item.i.split('__')[0])
      if (!tool) return false
      return item.w < (tool.minSize?.w ?? 1) || item.h < (tool.minSize?.h ?? 1)
    })
    if (!corrupted) saveSaved(newLayout)
  }, [])

  const removeTool = useCallback((instanceId) => {
    setActiveIds((prev) => {
      const next = prev.filter((i) => i !== instanceId)
      saveActiveIds(next)
      return next
    })
    setLayout((prev) => {
      const updated = prev.filter((item) => item.i !== instanceId)
      saveSaved(updated)
      return updated
    })
  }, [])

  // colsRef / zoomRef keep dynamic values in sync for callbacks without stale closures
  const colsRef = useRef(cols)
  useEffect(() => { colsRef.current = cols }, [cols])
  const zoomRef = useRef(zoom)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const addTool = useCallback((toolId) => {
    const tool = ALL_TOOLS.find((t) => t.id === toolId)
    const instanceId = `${toolId}__${Date.now()}`
    const w = tool?.defaultSize?.w ?? 10
    const h = tool?.defaultSize?.h ?? 8
    const vp = getViewportGridBounds(containerRef.current, zoomRef.current)
    setLayout((prev) => {
      const { x, y } = findFreeSpace(prev, w, h, colsRef.current, vp)
      const newItem = { i: instanceId, x, y, w, h, minW: tool?.minSize?.w ?? 4, minH: tool?.minSize?.h ?? 4 }
      const updated = [...prev, newItem]
      saveSaved(updated)
      return updated
    })
    setActiveIds((prev) => {
      const next = [...prev, instanceId]
      saveActiveIds(next)
      return next
    })
    setShowAddModal(false)
    return instanceId
  }, [setShowAddModal])

  // Allow any tool to programmatically add a new card via:
  //   window.dispatchEvent(new CustomEvent('dash:add-tool', { detail: { toolId } }))
  useEffect(() => {
    const handler = (e) => addTool(e.detail.toolId)
    window.addEventListener('dash:add-tool', handler)
    return () => window.removeEventListener('dash:add-tool', handler)
  }, [addTool])

  // ── dash:open-file — open a dashboard file in a tool ──────────────────────
  // Dispatched by FileCard with { file: {name,type,size,objectUrl}, toolId }
  const activeIdsRef = useRef(activeIds)
  useEffect(() => { activeIdsRef.current = activeIds }, [activeIds])

  useEffect(() => {
    async function onOpenFile(e) {
      const { file, toolId } = e.detail
      if (!file || !toolId) return

      // Find existing instance or create a new one
      let instanceId = activeIdsRef.current.find(id => id.startsWith(toolId + '__'))
      const isNew = !instanceId
      if (isNew) {
        const tool = ALL_TOOLS.find(t => t.id === toolId)
        instanceId = `${toolId}__${Date.now()}`
        const w = tool?.defaultSize?.w ?? 10
        const h = tool?.defaultSize?.h ?? 8
        const vp = getViewportGridBounds(containerRef.current, zoomRef.current)
        setLayout(prev => {
          const { x, y } = findFreeSpace(prev, w, h, colsRef.current, vp)
          const newItem = { i: instanceId, x, y, w, h, minW: tool?.minSize?.w ?? 4, minH: tool?.minSize?.h ?? 4 }
          saveSaved([...prev, newItem])
          return [...prev, newItem]
        })
        setActiveIds(prev => {
          const next = [...prev, instanceId]
          saveActiveIds(next)
          return next
        })
      }

      // Wait for tool to mount if new, then forward the file
      const delay = isNew ? 300 : 0
      setTimeout(async () => {
        const wrapper = document.querySelector(`[data-instance-id="${instanceId}"]`)
        const target = wrapper?.querySelector('[data-file-drop-target]')
        if (!target) return
        try {
          const res = await fetch(file.objectUrl)
          const blob = await res.blob()
          const fileObj = new File([blob], file.name, { type: file.type || blob.type })
          target.dispatchEvent(new CustomEvent('filedrop', { detail: { files: [fileObj] }, bubbles: true }))
        } catch (err) {
          console.error('dash:open-file delivery failed:', err)
        }
      }, delay)
    }

    window.addEventListener('dash:open-file', onOpenFile)
    return () => window.removeEventListener('dash:open-file', onOpenFile)
  }, []) // intentionally empty — uses refs for activeIds

  // ── dash:open-drive-folder — open a Drive folder in a Drive tool ───────────
  useEffect(() => {
    function onOpenFolder(e) {
      const { folderId, folderName } = e.detail || {}
      if (!folderId) return

      // Find existing google-drive instance or create one
      let instanceId = activeIdsRef.current.find(id => id.startsWith('google-drive__'))
      const isNew = !instanceId
      if (isNew) {
        const tool = ALL_TOOLS.find(t => t.id === 'google-drive')
        instanceId = `google-drive__${Date.now()}`
        const w = tool?.defaultSize?.w ?? 10
        const h = tool?.defaultSize?.h ?? 8
        const vp = getViewportGridBounds(containerRef.current, zoomRef.current)
        setLayout(prev => {
          const { x, y } = findFreeSpace(prev, w, h, colsRef.current, vp)
          const newItem = { i: instanceId, x, y, w, h, minW: tool?.minSize?.w ?? 4, minH: tool?.minSize?.h ?? 4 }
          saveSaved([...prev, newItem])
          return [...prev, newItem]
        })
        setActiveIds(prev => {
          const next = [...prev, instanceId]
          saveActiveIds(next)
          return next
        })
      }

      // After mount (if new), tell the Drive tool to navigate to the folder
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dash:drive-navigate', {
          detail: { instanceId, folderId, folderName }
        }))
      }, isNew ? 400 : 0)
    }

    window.addEventListener('dash:open-drive-folder', onOpenFolder)
    return () => window.removeEventListener('dash:open-drive-folder', onOpenFolder)
  }, []) // intentionally empty — uses refs for activeIds

  const removeFileItem = useCallback((id) => {
    removeDashFile(id) // context handles objectUrl revocation
    setLayout((prev) => prev.filter((item) => item.i !== id))
  }, [removeDashFile])

  // Show an invisible full-screen overlay the moment files (or a Drive drag) enter the window.
  // The overlay sits above all tool cards, so it always receives the drop —
  // no risk of inner elements (inputs, textareas, etc.) swallowing the event.
  const [fileDragActive, setFileDragActive] = useState(false)

  useEffect(() => {
    function onDragEnter(e) {
      // Don't activate when dragging into an open folder window — let it handle its own drops
      if (e.target?.closest?.('[data-folder-window]')) return
      if (e.dataTransfer.types.includes('Files') || window.__driveFileDrag) {
        setFileDragActive(true)
      }
    }
    document.addEventListener('dragenter', onDragEnter)
    return () => document.removeEventListener('dragenter', onDragEnter)
  }, [])

  async function handleOverlayDrop(e) {
    e.preventDefault()
    setFileDragActive(false)

    // If dropped over an open folder window, let it handle the drop
    if (document.elementsFromPoint(e.clientX, e.clientY).some(el => el.closest?.('[data-folder-window]'))) return

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    // rect is in visual (post-transform) pixels; divide by scaled cell size
    const dropX = Math.max(0, Math.floor((e.clientX - rect.left) / (CELL * zoom)))
    const dropY = Math.max(0, Math.floor((e.clientY - rect.top) / (CELL * zoom)))
    const now = Date.now()

    // ── Drive-to-Dashboard drop ──────────────────────────────────────────
    const driveDrag = window.__driveFileDrag
    if (driveDrag) {
      window.__driveFileDrag = null
      const fileId = `file__${now}`

      if (driveDrag.isFolder) {
        // Folder shortcut — no download, just store a link card
        addFile({ id: fileId, name: driveDrag.name, type: 'application/x-drive-folder', size: 0, objectUrl: null, href: driveDrag.href, driveId: driveDrag.id })
      } else {
        try {
          const { blob, fileName, type } = await downloadDriveFile(
            driveDrag.id, driveDrag.mimeType, driveDrag.name, driveDrag.token
          )
          addFile({ id: fileId, name: fileName, type, size: blob.size, objectUrl: URL.createObjectURL(blob) })
        } catch (err) {
          console.error('Drive download failed:', err)
          return
        }
      }

      setLayout(prev => {
        const w = 4, h = 5
        const x = Math.min(dropX, Math.max(0, colsRef.current - w))
        let y = dropY
        while (prev.some(li => li.x < x + w && li.x + li.w > x && li.y < y + h && li.y + li.h > y)) y++
        return [...prev, { i: fileId, x, y, w, h, minW: 3, minH: 4 }]
      })
      return
    }

    // ── Local file drop ──────────────────────────────────────────────────
    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    // Check if the cursor is over a tool's own file drop zone.
    // If so, forward the files there via a custom event instead of placing icons.
    const under = document.elementsFromPoint(e.clientX, e.clientY)
      .find(el => el !== e.currentTarget && el.hasAttribute('data-file-drop-target'))
    if (under) {
      under.dispatchEvent(new CustomEvent('filedrop', { detail: { files }, bubbles: true }))
      return
    }

    const newFiles = files.map((file, i) => ({
      id: `file__${now + i}`,
      name: file.name,
      type: file.type,
      size: file.size,
      objectUrl: URL.createObjectURL(file),
    }))

    newFiles.forEach(f => addFile(f))
    setLayout((prev) => {
      const placed = []
      const additions = newFiles.map((item, i) => {
        const w = 4, h = 5
        const x = Math.min(dropX + i * 4, Math.max(0, colsRef.current - w))
        let y = dropY
        const occupied = [...prev, ...placed]
        while (occupied.some(li =>
          li.x < x + w && li.x + li.w > x &&
          li.y < y + h && li.y + li.h > y
        )) { y++ }
        const entry = { i: item.id, x, y, w, h, minW: 3, minH: 4 }
        placed.push(entry)
        return entry
      })
      return [...prev, ...additions]
    })
  }

  return (
    <>
      {fileDragActive && (
        <div
          className="fixed inset-0 z-[9999]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleOverlayDrop}
          onDragLeave={() => setFileDragActive(false)}
        />
      )}
      <div
        ref={containerRef}
        style={{ width: `${effectiveWidth}px`, minHeight: `${minGridHeight}px` }}
        className="grid-bg relative"
      >

        <GridLayout
          width={effectiveWidth}
          cols={cols}
          rowHeight={CELL}
          margin={[0, 0]}
          layout={displayLayout}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          compactType={null}
          preventCollision={true}
          useCSSTransforms={false}
          transformScale={zoom}
          resizableOpts={{ grid: [CELL, CELL] }}
        >
          {activeIds
            .filter(instanceId => !previewItems.length || !DEFAULT_TOOL_IDS.some(id => instanceId === `${id}__0`))
            .map((instanceId) => {
              const toolId = getToolId(instanceId)
              const tool = ALL_TOOLS.find((t) => t.id === toolId)
              if (!tool) return null
              const Component = getComponent(toolId)
              return (
                <div key={instanceId} data-instance-id={instanceId}>
                  <ToolCard tool={tool} instanceId={instanceId} onRemove={() => removeTool(instanceId)}>
                    {Component && <Component instanceId={instanceId} />}
                  </ToolCard>
                </div>
              )
            })}
          {previewItems.map((item) => {
            const toolId = item.i.replace('preview__', '')
            const tool = ALL_TOOLS.find((t) => t.id === toolId)
            if (!tool) return null
            const Component = getComponent(toolId)
            return (
              <div key={item.i} style={{ pointerEvents: 'none' }}>
                <ToolCard tool={tool} instanceId={item.i} onRemove={() => {}}>
                  {Component && <Component instanceId={item.i} />}
                </ToolCard>
              </div>
            )
          })}
          {dashFiles.map((file) => (
            <div key={file.id}>
              <FileCard fileId={file.id} onRemove={() => removeFileItem(file.id)} />
            </div>
          ))}
        </GridLayout>
      </div>

      {showAddModal && (
        <AddToolModal
          tools={ALL_TOOLS}
          onAdd={addTool}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
})

export default Grid
