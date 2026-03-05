import { useState, useEffect, useRef, useId } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })

const DEFAULT = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

export default function MermaidTool({ instanceId }) {
  const key = `mermaid-${instanceId}`
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem(key) || DEFAULT } catch { return DEFAULT }
  })
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('preview')
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    try { localStorage.setItem(key, code) } catch {}
    let cancelled = false
    async function render() {
      try {
        const { svg: result } = await mermaid.render(`mermaid-${uid}`, code)
        if (!cancelled) { setSvg(result); setError(null) }
      } catch (e) {
        if (!cancelled) setError(e.message?.split('\n')[0] || 'Syntax error')
      }
    }
    const t = setTimeout(render, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [code, uid, key])

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 shrink-0">
        {['preview', 'code'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-0.5 rounded-full text-xs capitalize transition-colors cursor-pointer ${
              tab === t
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331]'
            }`}
          >
            {t}
          </button>
        ))}
        {error && <span className="text-[10px] text-red-400 ml-auto truncate max-w-[60%]">{error}</span>}
      </div>

      {tab === 'code' ? (
        <textarea
          className="flex-1 resize-none font-mono text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] rounded-xl p-3 focus:outline-none focus:border-gray-400 dark:focus:border-[#555553] min-h-0"
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#2a2a28] border border-gray-100 dark:border-[#2e2e2c]">
          {svg
            ? <div
                className="p-4 max-w-full max-h-full overflow-auto [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            : !error && <span className="text-xs text-gray-400 dark:text-gray-500">Rendering…</span>
          }
          {error && !svg && (
            <div className="flex flex-col items-center gap-1 text-center p-4">
              <span className="text-lg">⚠️</span>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
