import { useState, useRef } from 'react'

const ACTIONS = [
  { id: 'summarize', label: 'Summarize',    system: 'Summarize the following text concisely using bullet points. Be brief and clear.' },
  { id: 'rewrite',   label: 'Rewrite',      system: 'Rewrite the following text to be clearer and more professional. Return only the rewritten text, nothing else.' },
  { id: 'grammar',   label: 'Fix Grammar',  system: 'Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text, nothing else.' },
  { id: 'expand',    label: 'Expand',       system: 'Expand the following text with more detail, examples, and depth. Keep the same tone and style.' },
]

export default function AIWriter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeAction, setActiveAction] = useState(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef(null)
  const copyTimer = useRef(null)

  async function run(action) {
    const apiKey = localStorage.getItem('dashpad-api-key')
    if (!apiKey) {
      setOutput('')
      setError('Add your API key in Settings to use AI tools.')
      return
    }
    if (!input.trim() || loading) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setOutput('')
    setActiveAction(action.id)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: apiKey,
          system: action.system,
          messages: [{ role: 'user', content: input }],
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error ?? `Error ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            if (json.error) throw new Error(json.error)
            if (json.text) setOutput(prev => prev + json.text)
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  function copy() {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Input */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Paste your text here…"
        rows={5}
        spellCheck={false}
        className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-sm text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-gray-300 dark:focus:border-[#555553]"
      />

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => run(action)}
            disabled={!input.trim() || loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeAction === action.id
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331]'
            }`}
          >
            {activeAction === action.id && <Spinner />}
            {action.label}
          </button>
        ))}
      </div>

      {/* Output */}
      {(output || error) && (
        <div className="flex-1 relative rounded-xl bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] overflow-hidden min-h-0">
          <div className="h-full overflow-auto px-3 py-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {error
              ? <span className="text-red-400 text-xs">{error}</span>
              : output
            }
          </div>
          {output && !loading && (
            <button
              onClick={copy}
              className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}
