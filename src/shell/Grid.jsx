import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import GridLayout from 'react-grid-layout'
import { getTools, getComponent } from '../registry'
import ToolCard from '../components/ToolCard'
import FileCard from './FileCard'
import WelcomeCard from './WelcomeCard'
import AddToolModal from './AddToolModal'
import { useAuth } from '../context/AuthContext'

// Must match background-size in index.css
const CELL = 32

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
const WELCOME_ID = 'welcome__0'
const WELCOME_ITEM = { i: WELCOME_ID, x: 0, y: 0, w: 11, h: 15, minW: 7, minH: 10 }

// Default tools shown on first visit, positioned to the right of the welcome card
const DEFAULT_TOOL_IDS = ['file-converter', 'color-tool', 'pomodoro-timer']

function buildFirstVisitLayout() {
  const positions = [
    { x: 11, y: 0 },  // file-converter
    { x: 23, y: 0 },  // color-tool
    { x: 11, y: 10 }, // pomodoro-timer
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

function loadSaved() {
  try { const s = localStorage.getItem(LAYOUT_KEY); return s ? JSON.parse(s) : null } catch { return null }
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

const PAD = CELL

const Grid = forwardRef(function Grid({ showAddModal, setShowAddModal, zoom = 1 }, ref) {
  const { user, loading } = useAuth()
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(
    () => snapWidth(window.innerWidth - PAD * 2)
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(snapWidth(entry.contentRect.width))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const cols = containerWidth / CELL

  const [activeIds, setActiveIds] = useState(() => {
    const saved = loadActiveIds()
    if (saved !== null) return saved
    return DEFAULT_TOOL_IDS.map(id => `${id}__0`)
  })

  // Session-only — welcome shows every page load for non-signed-in users
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const showWelcome = !loading && !user && !welcomeDismissed

  const [layout, setLayout] = useState(() => {
    const saved = loadSaved()
    if (saved !== null) return saved
    return buildFirstVisitLayout()
  })

  const [fileItems, setFileItems] = useState([])

  // Expose getState / loadState to parent (App.jsx) via ref for cloud save/load
  useImperativeHandle(ref, () => ({
    getState() {
      const toolsOnly = layout.filter(
        item => !item.i.startsWith('file__') && !item.i.startsWith('welcome__')
      )
      return { layout: toolsOnly, activeIds }
    },
    loadState({ layout: newLayout, activeIds: newIds }) {
      setLayout(newLayout)
      setActiveIds(newIds)
      saveSaved(newLayout)
      saveActiveIds(newIds)
    },
  }), [layout, activeIds])

  // Add or remove welcome card from layout whenever showWelcome changes
  useEffect(() => {
    setLayout(prev => {
      const withoutWelcome = prev.filter(item => item.i !== WELCOME_ID)
      return showWelcome ? [WELCOME_ITEM, ...withoutWelcome] : withoutWelcome
    })
  }, [showWelcome])

  const onLayoutChange = useCallback((newLayout) => {
    setLayout(newLayout)
    saveSaved(newLayout)
  }, [])

  const dismissWelcome = useCallback(() => {
    setWelcomeDismissed(true)
    // layout update is handled by the showWelcome effect above
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

  const addTool = useCallback((toolId) => {
    const tool = ALL_TOOLS.find((t) => t.id === toolId)
    const instanceId = `${toolId}__${Date.now()}`
    const w = tool?.defaultSize?.w ?? 10
    const h = tool?.defaultSize?.h ?? 8
    setLayout((prev) => {
      const maxY = prev.reduce((m, item) => Math.max(m, item.y + item.h), 0)
      const newItem = { i: instanceId, x: 0, y: maxY, w, h, minW: tool?.minSize?.w ?? 4, minH: tool?.minSize?.h ?? 4 }
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
  }, [setShowAddModal])

  const removeFileItem = useCallback((id) => {
    setFileItems((prev) => {
      const item = prev.find((f) => f.id === id)
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl)
      return prev.filter((f) => f.id !== id)
    })
    setLayout((prev) => prev.filter((item) => item.i !== id))
  }, [])

  // Show an invisible full-screen overlay the moment files enter the window.
  // The overlay sits above all tool cards, so it always receives the drop —
  // no risk of inner elements (inputs, textareas, etc.) swallowing the event.
  const [fileDragActive, setFileDragActive] = useState(false)

  useEffect(() => {
    function onDragEnter(e) {
      if (e.dataTransfer.types.includes('Files')) setFileDragActive(true)
    }
    document.addEventListener('dragenter', onDragEnter)
    return () => document.removeEventListener('dragenter', onDragEnter)
  }, [])

  function handleOverlayDrop(e) {
    e.preventDefault()
    setFileDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    // rect is in visual (post-transform) pixels; divide by scaled cell size
    const dropX = Math.max(0, Math.floor((e.clientX - rect.left - PAD * zoom) / (CELL * zoom)))
    const dropY = Math.max(0, Math.floor((e.clientY - rect.top  - PAD * zoom) / (CELL * zoom)))
    const now = Date.now()

    const newFileItems = files.map((file, i) => ({
      id: `file__${now + i}`,
      name: file.name,
      type: file.type,
      size: file.size,
      objectUrl: URL.createObjectURL(file),
    }))

    // Check if the cursor is over a tool's own file drop zone.
    // If so, forward the files there via a custom event instead of placing icons.
    const under = document.elementsFromPoint(e.clientX, e.clientY)
      .find(el => el !== e.currentTarget && el.hasAttribute('data-file-drop-target'))
    if (under) {
      under.dispatchEvent(new CustomEvent('filedrop', { detail: { files }, bubbles: true }))
      return
    }

    setFileItems((prev) => [...prev, ...newFileItems])
    setLayout((prev) => {
      const placed = []
      const additions = newFileItems.map((item, i) => {
        const w = 4, h = 5
        const x = Math.min(dropX + i * 4, Math.max(0, cols - w))
        // Bump y down until this item doesn't overlap any existing item or
        // previously placed file in this same drop batch
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
        style={{ padding: `${PAD}px` }}
        className="w-full relative"
      >

        <GridLayout
          width={containerWidth}
          cols={cols}
          rowHeight={CELL}
          margin={[0, 0]}
          layout={layout}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          compactType={null}
          preventCollision={true}
          useCSSTransforms={false}
          transformScale={zoom}
          resizableOpts={{ grid: [CELL, CELL] }}
        >
          {showWelcome && (
            <div key={WELCOME_ID}>
              <WelcomeCard onDismiss={dismissWelcome} />
            </div>
          )}
          {activeIds.map((instanceId) => {
            const toolId = getToolId(instanceId)
            const tool = ALL_TOOLS.find((t) => t.id === toolId)
            if (!tool) return null
            const Component = getComponent(toolId)
            return (
              <div key={instanceId}>
                <ToolCard tool={tool} onRemove={() => removeTool(instanceId)}>
                  {Component && <Component />}
                </ToolCard>
              </div>
            )
          })}
          {fileItems.map((file) => (
            <div key={file.id}>
              <FileCard file={file} onRemove={() => removeFileItem(file.id)} />
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
