import { useState, useRef, useContext } from 'react'
import GUIDES from '../guides'
import { GuideContext } from '../context/GuideContext'
import { LAYOUTS } from '../layouts'

const PANEL_W = 420

// ── Inline markdown renderer ───────────────────────────────────────────────
function Inline({ text }) {
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let last = 0, key = 0, m
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if      (m[1] != null) parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-gray-100">{m[1]}</strong>)
    else if (m[2] != null) parts.push(<em key={key++} className="italic">{m[2]}</em>)
    else if (m[3] != null) parts.push(<code key={key++} className="text-[11px] bg-gray-100 dark:bg-[#2a2a28] px-1 py-px rounded font-mono text-indigo-600 dark:text-indigo-400">{m[3]}</code>)
    else if (m[4] != null) parts.push(<a key={key++} href={m[5]} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 underline">{m[4]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

// ── Block markdown renderer ────────────────────────────────────────────────
function MarkdownContent({ content }) {
  const lines = content.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++ }
      blocks.push({ type: 'code', lang, content: code.join('\n') })
      i++; continue
    }

    // Heading
    const hm = line.match(/^(#{1,3})\s+(.+)$/)
    if (hm) { blocks.push({ type: 'h', level: hm[1].length, text: hm[2] }); i++; continue }

    // HR
    if (/^---+$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue }

    // Blockquote
    if (line.startsWith('> ')) {
      const bqLines = []
      while (i < lines.length && lines[i].startsWith('> ')) { bqLines.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'blockquote', lines: bqLines }); continue
    }

    // Table (| col | col |)
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!/^\|[-:| ]+\|$/.test(lines[i])) { // skip separator row
          rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()))
        }
        i++
      }
      if (rows.length) blocks.push({ type: 'table', rows }); continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'ul', items }); continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++ }
      blocks.push({ type: 'ol', items }); continue
    }

    // Empty line
    if (line.trim() === '') { i++; continue }

    // Paragraph
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('|') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) { paraLines.push(lines[i]); i++ }
    if (paraLines.length) blocks.push({ type: 'p', text: paraLines.join(' ') })
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'h': {
            const cls = b.level === 1
              ? 'text-lg font-bold text-gray-900 dark:text-gray-100 mt-2'
              : b.level === 2
                ? 'text-sm font-bold text-gray-800 dark:text-gray-200 mt-4 pt-2 border-t border-gray-100 dark:border-[#2a2a28]'
                : 'text-xs font-semibold text-gray-700 dark:text-gray-300 mt-3 uppercase tracking-wide'
            return <div key={idx} className={cls}><Inline text={b.text} /></div>
          }
          case 'p':
            return <p key={idx} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"><Inline text={b.text} /></p>
          case 'ul':
            return (
              <ul key={idx} className="flex flex-col gap-1 pl-4 list-disc marker:text-gray-300 dark:marker:text-gray-600">
                {b.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"><Inline text={item} /></li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={idx} className="flex flex-col gap-1 pl-4 list-decimal marker:text-gray-400 dark:marker:text-gray-500">
                {b.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"><Inline text={item} /></li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre key={idx} className="bg-gray-50 dark:bg-[#1a1a18] border border-gray-100 dark:border-[#2e2e2c] rounded-xl p-3 overflow-x-auto">
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre">{b.content}</code>
              </pre>
            )
          case 'blockquote':
            return (
              <div key={idx} className="border-l-2 border-indigo-300 dark:border-indigo-700 pl-3 py-0.5">
                {b.lines.map((l, j) => (
                  <p key={j} className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed"><Inline text={l} /></p>
                ))}
              </div>
            )
          case 'table':
            return (
              <div key={idx} className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {b.rows[0]?.map((cell, j) => (
                        <th key={j} className="text-left px-2 py-1.5 bg-gray-50 dark:bg-[#1a1a18] border border-gray-100 dark:border-[#2e2e2c] font-semibold text-gray-700 dark:text-gray-300">{cell}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.slice(1).map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k} className="px-2 py-1.5 border border-gray-100 dark:border-[#2e2e2c] text-gray-600 dark:text-gray-400"><Inline text={cell} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'hr':
            return <hr key={idx} className="border-gray-100 dark:border-[#2e2e2c] my-1" />
          default:
            return null
        }
      })}
    </div>
  )
}

// ── Welcome / onboarding view ──────────────────────────────────────────────
const STEPS = [
  { icon: '+', text: 'Click + to browse and add tools' },
  { icon: '⤢', text: 'Drag the title bar to rearrange' },
  { icon: '⤡', text: 'Resize from the corner handle' },
  { icon: '☁', text: 'Sign in to sync across devices' },
]

function WelcomeView({ onClose }) {
  const guideCtx = useContext(GuideContext)

  function handleApply(catId) { guideCtx?.applyLayout?.(catId) }
  function handleEnter(catId) { guideCtx?.previewCategory?.(catId) }
  function handleLeave()      { guideCtx?.clearPreview?.() }

  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <div className="pb-4 border-b border-gray-100 dark:border-[#2a2a28]">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
          Welcome to Dashpad
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          Dashpad is built to eliminate tab switching, increase your productivity, and keep you organized — all in one place.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          Sign in to sync your dash across devices and save multiple layouts.
        </p>
      </div>

      {/* How it works */}
      <div>
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

      {/* Pricing note */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#2a2a28]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Most tools are free. Some require signing in, and a few require a subscription to unlock.
        </p>
      </div>

      {/* Category layouts */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Start with a layout</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5 leading-snug">Click a category to load it onto the board.</p>
        <div className="flex flex-col gap-1.5">
          {LAYOUTS.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleApply(cat.id)}
              onMouseEnter={() => handleEnter(cat.id)}
              onMouseLeave={handleLeave}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-[#2e2e2c] hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-all duration-150 text-left cursor-pointer group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all duration-150"
                style={{ backgroundColor: cat.accent + '20' }}
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
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Start exploring */}
      <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-[#2a2a28]">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
        >
          Start exploring →
        </button>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">Your data never leaves your browser.</p>
      </div>
    </div>
  )
}

// ── Browse list ────────────────────────────────────────────────────────────
function BrowseView({ onSelect }) {
  const general = GUIDES.filter(g => !g.toolId)
  const tools   = GUIDES.filter(g => g.toolId)

  return (
    <div className="flex flex-col gap-4">
      {general.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">General</p>
          <div className="flex flex-col gap-1">
            {general.map(g => <GuideRow key={g.id} guide={g} onSelect={onSelect} />)}
          </div>
        </section>
      )}
      {tools.length > 0 && (
        <section>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tool Guides</p>
          <div className="flex flex-col gap-1">
            {tools.map(g => <GuideRow key={g.id} guide={g} onSelect={onSelect} />)}
          </div>
        </section>
      )}
      {GUIDES.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No guides yet.</p>
      )}
    </div>
  )
}

function GuideRow({ guide, onSelect }) {
  return (
    <button
      onClick={() => onSelect(guide.id)}
      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors text-left cursor-pointer group"
    >
      <span className="text-base mt-0.5 shrink-0">{guide.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 leading-tight">{guide.title}</div>
        {guide.description && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-snug line-clamp-2">{guide.description}</div>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-1 text-gray-300 dark:text-gray-600 group-hover:text-gray-400">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────
// '__browse__' is a sentinel value meaning "open panel in browse mode, no guide selected"
export default function GuidePanel({ activeGuideId, onClose, onNavigate, width = PANEL_W, onWidthChange }) {
  const guide = (activeGuideId && activeGuideId !== '__browse__') ? GUIDES.find(g => g.id === activeGuideId) : null
  const isOpen = activeGuideId !== null
  const isDragging = useRef(false)
  const [resizing, setResizing] = useState(false)

  const handleResizeMouseDown = (e) => {
    isDragging.current = true
    setResizing(true)
    const startX = e.clientX
    const startWidth = width

    const onMouseMove = (e) => {
      const newWidth = Math.max(280, Math.min(720, startWidth + e.clientX - startX))
      onWidthChange?.(newWidth)
    }
    const onMouseUp = () => {
      isDragging.current = false
      setResizing(false)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  return (
    <>
      {/* Backdrop (mobile / narrow) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10 dark:bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white dark:bg-[#1e1e1c] border-r border-gray-100 dark:border-[#2e2e2c] shadow-xl"
        style={{
          width,
          paddingTop: '64px',
          transform: isOpen ? 'translateX(0)' : `translateX(-${width}px)`,
          transition: resizing ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Resize handle */}
        {isOpen && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize group z-10"
          >
            <div className="absolute inset-y-0 right-0 w-1 bg-transparent group-hover:bg-indigo-400/40 dark:group-hover:bg-indigo-500/30 transition-colors" />
          </div>
        )}
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-4 h-12 border-b border-gray-100 dark:border-[#2e2e2c]">
          {guide ? (
            <>
              <button
                onClick={() => onNavigate('__browse__')}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                aria-label="Back to guides"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">{guide.title}</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-gray-400 shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8 9V7.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">Guides</span>
            </>
          )}
          <button
            onClick={onClose}
            className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer"
            aria-label="Close guides"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {guide
            ? guide.id === 'getting-started'
              ? <WelcomeView onClose={onClose} />
              : <MarkdownContent content={guide.content} />
            : <BrowseView onSelect={onNavigate} />
          }
        </div>

        {/* Footer — only on regular guide view (not welcome) */}
        {guide && guide.id !== 'getting-started' && (
          <div className="shrink-0 px-4 py-3 border-t border-gray-100 dark:border-[#2e2e2c]">
            <button
              onClick={() => onNavigate('__browse__')}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All guides
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export { PANEL_W }
