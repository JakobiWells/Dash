import { useState, useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const STORAGE_KEY = 'dashpad-katex-input'
const SAVED_KEY   = 'dashpad-katex-saved'

const EXAMPLES = [
  { label: 'Quadratic',  latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: "Euler's",    latex: 'e^{i\\pi} + 1 = 0' },
  { label: 'Integral',   latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}' },
  { label: 'Basel',      latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}' },
  { label: 'Matrix',     latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Limit',      latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
]

function renderLatex(input) {
  try {
    return {
      html: katex.renderToString(input, { displayMode: true, throwOnError: true, output: 'html' }),
      error: null,
    }
  } catch (e) {
    return { html: null, error: e.message }
  }
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) ?? [] } catch { return [] }
}

export default function KaTeXEditor() {
  const [input, setInput] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
  )
  const [saved, setSaved] = useState(loadSaved)
  const [saving, setSaving] = useState(false)   // show name input
  const [saveName, setSaveName] = useState('')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)
  const nameInputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, input)
  }, [input])

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
  }, [saved])

  // Focus name input when it appears
  useEffect(() => {
    if (saving) nameInputRef.current?.focus()
  }, [saving])

  const { html, error } = renderLatex(input)

  function copy() {
    navigator.clipboard.writeText(input)
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }

  function confirmSave() {
    const name = saveName.trim()
    if (!name) return
    setSaved(prev => [...prev, { label: name, latex: input }])
    setSaveName('')
    setSaving(false)
  }

  function deleteSaved(index) {
    setSaved(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Rendered preview */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#2a2a28] rounded-xl border border-gray-100 dark:border-[#3a3a38] overflow-auto p-4 min-h-0">
        {error ? (
          <p className="text-xs text-red-400 font-mono text-center break-all">{error}</p>
        ) : (
          <div className="text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>

      {/* Built-in presets */}
      <div className="flex gap-1.5 flex-wrap">
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => setInput(ex.latex)}
            className="px-2.5 py-1 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a28] hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Saved presets */}
      {saved.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {saved.map((s, i) => (
            <div key={i} className="flex items-center gap-0.5 pl-2.5 pr-1 py-1 rounded-lg bg-gray-900 dark:bg-gray-100">
              <button
                onClick={() => setInput(s.latex)}
                className="text-xs text-white dark:text-gray-900 cursor-pointer"
              >
                {s.label}
              </button>
              <button
                onClick={() => deleteSaved(i)}
                className="ml-1 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Delete preset"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save name input (shown when saving) */}
      {saving && (
        <div className="flex gap-1.5">
          <input
            ref={nameInputRef}
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmSave(); if (e.key === 'Escape') setSaving(false) }}
            placeholder="Preset name…"
            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-sm text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={confirmSave}
            disabled={!saveName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={() => setSaving(false)}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a28] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* LaTeX input */}
      <div className="relative">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter LaTeX…"
          rows={3}
          spellCheck={false}
          className="w-full px-3 py-2 pr-24 rounded-xl bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-sm font-mono text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-gray-300 dark:focus:border-[#555553]"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={() => { setSaving(true); setSaveName('') }}
            className="px-2 py-1 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
            title="Save as preset"
          >
            Save
          </button>
          <button
            onClick={copy}
            className="px-2 py-1 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
