import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
]

const DAILY_LIMIT = 1000

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getWordsUsed() {
  try {
    const raw = localStorage.getItem('translator-usage')
    if (!raw) return 0
    const { date, used } = JSON.parse(raw)
    return date === todayKey() ? used : 0
  } catch { return 0 }
}

function recordWords(n) {
  const used = getWordsUsed() + n
  localStorage.setItem('translator-usage', JSON.stringify({ date: todayKey(), used }))
  return used
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function CopyBtn({ text, copied, onCopy }) {
  return (
    <button
      onClick={onCopy}
      disabled={!text}
      title="Copy"
      className="text-gray-300 hover:text-gray-500 disabled:opacity-0 transition-colors cursor-pointer"
    >
      {copied
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  )
}

export default function Translator() {
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('es')
  const [input, setInput]   = useState('')
  const [output, setOutput] = useState('')
  const [detectedLang, setDetectedLang]         = useState(null)
  const [detectedLangCode, setDetectedLangCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [copiedInput, setCopiedInput]   = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)
  const [wordsUsed, setWordsUsed] = useState(() => getWordsUsed())

  const wordsRemaining = DAILY_LIMIT - wordsUsed
  const pct       = wordsRemaining / DAILY_LIMIT
  const barColor  = pct > 0.5 ? 'bg-gray-400' : pct > 0.2 ? 'bg-amber-400' : 'bg-red-400'
  const textColor = pct > 0.5 ? 'text-gray-400' : pct > 0.2 ? 'text-amber-500' : 'text-red-500'

  async function translateForward() {
    if (!input.trim() || loading) return
    const wordCount = countWords(input)
    if (wordsRemaining <= 0) { setError('Daily limit reached. Resets at midnight.'); return }
    if (wordCount > wordsRemaining) { setError(`Only ${wordsRemaining} words remaining today.`); return }

    setLoading(true)
    setError(null)
    setDetectedLang(null)
    setDetectedLangCode(null)

    const from = sourceLang === 'auto' ? 'autodetect' : sourceLang
    const url  = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${from}|${targetLang}`

    try {
      const res  = await fetch(url)
      const data = await res.json()
      if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed')

      setOutput(data.responseData.translatedText)

      const detected = data.matches?.[0]?.['detected-language']
      if (sourceLang === 'auto' && detected) {
        const code = detected.split('-')[0]
        const lang = LANGUAGES.find(l => l.code === code)
        setDetectedLang(lang?.name ?? detected)
        setDetectedLangCode(code)
      }

      setWordsUsed(recordWords(wordCount))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function translateBackward() {
    if (!output.trim() || loading) return
    const wordCount = countWords(output)
    if (wordsRemaining <= 0) { setError('Daily limit reached. Resets at midnight.'); return }
    if (wordCount > wordsRemaining) { setError(`Only ${wordsRemaining} words remaining today.`); return }

    setLoading(true)
    setError(null)

    const toLang = sourceLang === 'auto' ? (detectedLangCode || 'en') : sourceLang
    const url    = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(output)}&langpair=${targetLang}|${toLang}`

    try {
      const res  = await fetch(url)
      const data = await res.json()
      if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed')

      setInput(data.responseData.translatedText)
      setWordsUsed(recordWords(wordCount))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function swap() {
    if (sourceLang === 'auto') return
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setInput(output)
    setOutput(input)
    setDetectedLang(null)
    setDetectedLangCode(null)
  }

  function copyInput() {
    if (!input) return
    navigator.clipboard.writeText(input)
    setCopiedInput(true)
    setTimeout(() => setCopiedInput(false), 1500)
  }

  function copyOutput() {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopiedOutput(true)
    setTimeout(() => setCopiedOutput(false), 1500)
  }

  const selectClass   = 'flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-400 cursor-pointer'
  const textareaClass = 'w-full flex-1 min-h-[80px] resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400'

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Language bar */}
      <div className="flex items-center gap-2">
        <select
          value={sourceLang}
          onChange={e => { setSourceLang(e.target.value); setDetectedLang(null); setDetectedLangCode(null) }}
          className={selectClass}
        >
          <option value="auto">Auto-detect</option>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <button
          onClick={swap}
          disabled={sourceLang === 'auto'}
          title="Swap languages"
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L4 7l4 4M4 7h16"/>
            <path d="M16 21l4-4-4-4m4 4H4"/>
          </svg>
        </button>

        <select
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          className={selectClass}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      {/* Source textarea */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); translateForward() } }}
            placeholder="Type and press ↵ to translate…"
            className={`${textareaClass} bg-gray-50`}
          />
          {detectedLang && (
            <span className="absolute bottom-2 left-3 text-[10px] text-gray-400 pointer-events-none">
              Detected: {detectedLang}
            </span>
          )}
        </div>
        <div className="flex justify-end px-1">
          <CopyBtn text={input} copied={copiedInput} onCopy={copyInput} />
        </div>
      </div>

      {/* Translate button row */}
      <div className="flex items-center gap-2">
        <button
          onClick={translateForward}
          disabled={!input.trim() || loading || wordsRemaining <= 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? 'Translating…' : 'Translate'}
        </button>
        <span className="text-xs text-gray-300">↵</span>

        <div className="ml-auto flex flex-col items-end gap-0.5">
          <span className={`text-xs font-medium tabular-nums ${textColor}`}>
            {wordsRemaining.toLocaleString()} / {DAILY_LIMIT.toLocaleString()} words left
          </span>
          <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.max(0, pct * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Output textarea */}
      <div className="flex flex-col gap-1">
        <textarea
          value={output}
          onChange={e => setOutput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); translateBackward() } }}
          placeholder="Translation… (press ↵ to translate back)"
          className={`${textareaClass} bg-white`}
        />
        <div className="flex justify-end px-1">
          <CopyBtn text={output} copied={copiedOutput} onCopy={copyOutput} />
        </div>
      </div>

    </div>
  )
}
