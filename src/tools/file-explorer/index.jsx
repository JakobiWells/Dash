import { useState, useEffect } from 'react'

// ─── helpers ──────────────────────────────────────────────────────────────────
let _id = 0
const uid = () => ++_id

function fmt(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function getExt(name) { return name.split('.').pop()?.toLowerCase() ?? '' }

const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','svg','bmp','ico','avif'])
const TEXT_EXTS  = new Set([
  'txt','md','js','jsx','ts','tsx','py','css','scss','html','json','yaml','yml',
  'toml','sh','bash','zsh','sql','r','c','cpp','h','hpp','java','go','rs','rb',
  'php','swift','kt','xml','csv','log','env','gitignore','prettierrc','eslintrc','ini','cfg',
])

const isImage = n => IMAGE_EXTS.has(getExt(n))
const isText  = n => TEXT_EXTS.has(getExt(n))
const isPDF   = n => getExt(n) === 'pdf'

function updateTree(nodes, id, fn) {
  return nodes.map(n => {
    if (n.id === id) return fn(n)
    if (n.children) return { ...n, children: updateTree(n.children, id, fn) }
    return n
  })
}

function makeNode(name, path) {
  return { id: uid(), name, path, kind: 'directory', children: null, expanded: false }
}

// ─── icons ────────────────────────────────────────────────────────────────────
function FolderIcon({ open }) {
  return (
    <svg width="14" height="13" viewBox="0 0 16 14" fill="none" className="shrink-0">
      <path
        d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5v7c0 .83-.67 1.5-1.5 1.5h-11C1.67 13.5 1 12.83 1 12V3.5z"
        fill={open ? '#fef3c7' : '#fefce8'}
        stroke={open ? '#f59e0b' : '#fbbf24'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FileIcon({ name }) {
  const e = getExt(name)
  let color = '#94a3b8'
  if (isImage(name)) color = '#10b981'
  else if (isPDF(name)) color = '#ef4444'
  else if (['js','jsx','mjs'].includes(e)) color = '#f59e0b'
  else if (['ts','tsx'].includes(e)) color = '#3b82f6'
  else if (e === 'py') color = '#3b82f6'
  else if (['html','css','scss'].includes(e)) color = '#8b5cf6'
  else if (['json','yaml','yml','toml'].includes(e)) color = '#06b6d4'
  else if (['c','cpp','h','hpp'].includes(e)) color = '#ec4899'
  else if (['java','go','rs','swift','kt'].includes(e)) color = '#f97316'
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" className="shrink-0">
      <path d="M1 1h6.5L10 3.5V12a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 1 12V1z" fill={color + '25'} stroke={color} strokeWidth="1"/>
      <path d="M7 1v3h3" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

// ─── tree node ────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, onToggle, onSelect, selectedId, showHidden }) {
  if (!showHidden && node.name.startsWith('.')) return null

  return (
    <div>
      <div
        style={{ paddingLeft: `${6 + depth * 14}px` }}
        onClick={() => node.kind === 'directory' ? onToggle(node) : onSelect(node)}
        className={`flex items-center gap-1.5 pr-2 py-[3px] rounded-lg cursor-pointer transition-colors select-none ${
          selectedId === node.id
            ? 'bg-gray-100 dark:bg-[#2e2e2c]'
            : 'hover:bg-gray-50 dark:hover:bg-[#262624]'
        }`}
      >
        {node.kind === 'directory' && (
          <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"
            className={`shrink-0 text-gray-400 transition-transform duration-150 ${node.expanded ? 'rotate-90' : ''}`}
          >
            <path d="M2 1l4 3-4 3V1z"/>
          </svg>
        )}
        {node.kind === 'directory'
          ? <FolderIcon open={node.expanded} />
          : <div className="ml-[7px]"><FileIcon name={node.name} /></div>}
        <span className="text-xs text-gray-700 dark:text-gray-200 truncate flex-1 min-w-0">{node.name}</span>
        {node.kind === 'file' && (
          <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0 ml-1">{fmt(node.size)}</span>
        )}
      </div>
      {node.expanded && node.children && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onToggle={onToggle}
          onSelect={onSelect}
          selectedId={selectedId}
          showHidden={showHidden}
        />
      ))}
      {node.expanded && node.children?.length === 0 && (
        <div style={{ paddingLeft: `${20 + depth * 14}px` }} className="py-0.5">
          <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">Empty folder</span>
        </div>
      )}
    </div>
  )
}

// ─── file preview ─────────────────────────────────────────────────────────────
function Preview({ node, onClose }) {
  const [state, setState] = useState({ loading: true, text: null, url: null })

  useEffect(() => {
    setState({ loading: true, text: null, url: null })
    let cancelled = false

    async function load() {
      if (isText(node.name)) {
        try {
          const res = await fetch(`/__fs/read?path=${encodeURIComponent(node.path)}`)
          const data = await res.json()
          if (!cancelled) setState({ loading: false, text: data.error ? null : data.content, url: null })
        } catch {
          if (!cancelled) setState({ loading: false, text: null, url: null })
        }
      } else if (isImage(node.name) || isPDF(node.name)) {
        const url = `/__fs/file?path=${encodeURIComponent(node.path)}`
        if (!cancelled) setState({ loading: false, text: null, url })
      } else {
        if (!cancelled) setState({ loading: false, text: null, url: null })
      }
    }

    load()
    return () => { cancelled = true }
  }, [node.path])

  return (
    <div className="flex flex-col min-w-0 min-h-0 overflow-hidden" style={{ width: '55%' }}>
      <div className="flex items-center gap-1.5 px-3 h-8 border-b border-gray-100 dark:border-[#2e2e2c] shrink-0">
        <FileIcon name={node.name} />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate flex-1 min-w-0">{node.name}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{fmt(node.size)}</span>
        <button
          onClick={onClose}
          className="ml-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {state.loading ? (
          <div className="flex items-center justify-center h-full">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-300 dark:text-gray-600">
              <path d="M14 8A6 6 0 1 1 8 2"/>
            </svg>
          </div>
        ) : state.text !== null ? (
          <pre className="text-[10px] font-mono text-gray-700 dark:text-gray-300 p-3 whitespace-pre-wrap break-all leading-relaxed">
            {state.text}
          </pre>
        ) : state.url && isImage(node.name) ? (
          <div className="p-3 flex items-center justify-center min-h-full">
            <img src={state.url} className="max-w-full object-contain rounded-lg" alt={node.name} />
          </div>
        ) : state.url && isPDF(node.name) ? (
          <iframe src={state.url} className="w-full h-full border-0" title={node.name} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <FileIcon name={node.name} />
            <p className="text-xs text-gray-400 dark:text-gray-500">No preview available</p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600">
              {getExt(node.name).toUpperCase() || 'Unknown type'} · {fmt(node.size)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function FileExplorer() {
  const [tree, setTree]             = useState(null)  // null = initializing
  const [selected, setSelected]     = useState(null)
  const [showHidden, setShowHidden] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    fetch('/__fs/home')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(({ home, roots }) => {
        const nodes = [
          makeNode('~ Home', home),
          ...roots.map(r => makeNode(r === '/' ? '/ Root' : r, r)),
        ]
        setTree(nodes)
      })
      .catch(() => setUnavailable(true))
  }, [])

  async function toggleFolder(node) {
    if (node.expanded) {
      setTree(t => updateTree(t, node.id, n => ({ ...n, expanded: false })))
      return
    }
    if (!node.children) {
      try {
        const res = await fetch(`/__fs/list?path=${encodeURIComponent(node.path)}`)
        const data = await res.json()
        const children = Array.isArray(data) ? data.map(e => ({
          id: uid(),
          name: e.name,
          path: e.path,
          kind: e.kind,
          size: e.size,
          ...(e.kind === 'directory' ? { children: null, expanded: false } : {}),
        })) : []
        setTree(t => updateTree(t, node.id, n => ({ ...n, expanded: true, children })))
      } catch {
        setTree(t => updateTree(t, node.id, n => ({ ...n, expanded: true, children: [] })))
      }
    } else {
      setTree(t => updateTree(t, node.id, n => ({ ...n, expanded: true })))
    }
  }

  if (unavailable) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200 dark:text-gray-700">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Requires local dev server</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-[200px]">
          File Explorer reads your filesystem via the Vite dev server. Run with <code className="font-mono bg-gray-100 dark:bg-[#2a2a28] px-1 rounded">npm run dev</code> to use this tool.
        </p>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-300 dark:text-gray-600">
          <path d="M14 8A6 6 0 1 1 8 2"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2 shrink-0">
        <svg width="13" height="12" viewBox="0 0 16 14" fill="none" className="shrink-0">
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5v7c0 .83-.67 1.5-1.5 1.5h-11C1.67 13.5 1 12.83 1 12V3.5z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 flex-1">File System</span>
        <button
          onClick={() => setShowHidden(h => !h)}
          className={`shrink-0 text-[10px] transition-colors cursor-pointer ${showHidden ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          {showHidden ? 'Hide dotfiles' : 'Show dotfiles'}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Tree */}
        <div
          className={`overflow-y-auto hide-scrollbar min-h-0 ${selected ? 'border-r border-gray-100 dark:border-[#2e2e2c]' : 'w-full'}`}
          style={selected ? { width: '45%' } : {}}
        >
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              onToggle={toggleFolder}
              onSelect={setSelected}
              selectedId={selected?.id}
              showHidden={showHidden}
            />
          ))}
        </div>

        {/* Preview */}
        {selected && (
          <Preview node={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  )
}
