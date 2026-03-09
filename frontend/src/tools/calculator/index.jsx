import { useState, useRef, useEffect } from 'react'

// ── Expression parser ──────────────────────────────────────────────────────
// Recursive descent: handles +,-,*,/,%,^, parens, functions, constants.

class Parser {
  constructor(input) {
    this.s = input
    this.i = 0
  }

  parse() {
    const val = this.expr()
    this.skipWs()
    if (this.i < this.s.length) throw new Error(`Unexpected "${this.s[this.i]}"`)
    return val
  }

  expr()    { return this.addSub() }

  addSub() {
    let v = this.mulDiv()
    for (;;) {
      this.skipWs()
      const op = this.s[this.i]
      if (op !== '+' && op !== '-') break
      this.i++
      const r = this.mulDiv()
      v = op === '+' ? v + r : v - r
    }
    return v
  }

  mulDiv() {
    let v = this.power()
    for (;;) {
      this.skipWs()
      const op = this.s[this.i]
      if (op !== '*' && op !== '/' && op !== '%') break
      this.i++
      const r = this.power()
      if (op === '*') v = v * r
      else if (op === '/') v = v / r
      else v = v % r
    }
    return v
  }

  power() {
    let base = this.unary()
    this.skipWs()
    if (this.s[this.i] === '^') {
      this.i++
      const exp = this.unary()
      base = Math.pow(base, exp)
    }
    return base
  }

  unary() {
    this.skipWs()
    if (this.s[this.i] === '-') { this.i++; return -this.primary() }
    if (this.s[this.i] === '+') { this.i++ }
    return this.primary()
  }

  primary() {
    this.skipWs()
    const ch = this.s[this.i]

    if (ch === '(') {
      this.i++
      const v = this.expr()
      this.skipWs()
      if (this.s[this.i] !== ')') throw new Error('Missing )')
      this.i++
      return v
    }

    if (ch >= '0' && ch <= '9' || ch === '.') return this.number()
    if (/[a-zA-Z]/.test(ch)) return this.funcOrConst()

    throw new Error(`Unexpected "${ch}"`)
  }

  number() {
    let s = ''
    while (this.i < this.s.length && /[0-9.]/.test(this.s[this.i])) s += this.s[this.i++]
    const n = parseFloat(s)
    if (isNaN(n)) throw new Error('Invalid number')
    return n
  }

  funcOrConst() {
    let name = ''
    while (this.i < this.s.length && /[a-zA-Z]/.test(this.s[this.i])) name += this.s[this.i++]
    const n = name.toLowerCase()

    // Constants
    if (n === 'pi') return Math.PI
    if (n === 'e')  return Math.E
    if (n === 'inf') return Infinity
    if (n === 'tau') return 2 * Math.PI

    // Functions
    this.skipWs()
    if (this.s[this.i] !== '(') throw new Error(`Unknown: ${name}`)
    this.i++
    const a = this.expr()
    // Optional second argument (e.g. log(x, base))
    this.skipWs()
    let b = null
    if (this.s[this.i] === ',') {
      this.i++
      b = this.expr()
    }
    this.skipWs()
    if (this.s[this.i] !== ')') throw new Error('Missing )')
    this.i++

    switch (n) {
      case 'sqrt':  return Math.sqrt(a)
      case 'cbrt':  return Math.cbrt(a)
      case 'abs':   return Math.abs(a)
      case 'sin':   return Math.sin(a)
      case 'cos':   return Math.cos(a)
      case 'tan':   return Math.tan(a)
      case 'asin':  return Math.asin(a)
      case 'acos':  return Math.acos(a)
      case 'atan':  return Math.atan(a)
      case 'log':   return b !== null ? Math.log(a) / Math.log(b) : Math.log10(a)
      case 'ln':    return Math.log(a)
      case 'round': return b !== null ? parseFloat(a.toFixed(b)) : Math.round(a)
      case 'floor': return Math.floor(a)
      case 'ceil':  return Math.ceil(a)
      case 'min':   return Math.min(a, b ?? a)
      case 'max':   return Math.max(a, b ?? a)
      case 'pow':   return Math.pow(a, b ?? 1)
      default: throw new Error(`Unknown function: ${name}`)
    }
  }

  skipWs() {
    while (this.i < this.s.length && this.s[this.i] === ' ') this.i++
  }
}

function preprocess(raw) {
  return raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    // "15% of 200" → "15/100*200"
    .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*/gi, '($1/100)*')
    // implicit multiply: 2pi, 2(3), )(
    .replace(/(\d)(pi|e\b|tau)/gi, '$1*$2')
    .replace(/(\d)\s*\(/g, '$1*(')
    .replace(/\)\s*\(/g, ')*(')
}

function evaluate(expr) {
  const cleaned = preprocess(expr.trim())
  if (!cleaned) throw new Error('Empty')
  return new Parser(cleaned).parse()
}

function formatResult(n) {
  if (typeof n !== 'number') return 'Error'
  if (isNaN(n)) return 'Not a number'
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞'
  if (Number.isInteger(n) && Math.abs(n) < 1e15) {
    return n.toLocaleString('en-US')
  }
  const p = parseFloat(n.toPrecision(10))
  if (Math.abs(p) >= 1e12 || (Math.abs(p) < 1e-4 && p !== 0)) {
    return p.toExponential(4)
  }
  // Strip trailing zeros after decimal
  return p.toString()
}

// ── Component ──────────────────────────────────────────────────────────────

const HISTORY_KEY = 'calc-history'

export default function Calculator() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Live preview
  let preview = null
  let previewIsError = false
  if (input.trim()) {
    try {
      const r = evaluate(input)
      preview = formatResult(r)
      // Don't show preview if it matches what they typed (e.g. just a number)
      if (preview === input.trim()) preview = null
    } catch {
      previewIsError = true
    }
  }

  function submit() {
    const expr = input.trim()
    if (!expr) return

    let result, isError
    try {
      result = formatResult(evaluate(expr))
      isError = false
    } catch (err) {
      result = err.message || 'Error'
      isError = true
    }

    const entry = { id: Date.now(), expr, result, isError }
    const next = [entry, ...history].slice(0, 100)
    setHistory(next)
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
    setInput('')
  }

  function reuseEntry(entry) {
    setInput(entry.isError ? entry.expr : entry.result.replace(/,/g, ''))
    inputRef.current?.focus()
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    // Arrow up to recall last expression
    if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault()
      setInput(history[0].expr)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 shrink-0">
        <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">History</span>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 py-1 min-h-0 flex flex-col-reverse">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-300 text-sm text-center px-4">
            Type an expression and press Enter
          </div>
        ) : (
          <div className="space-y-1 pt-1" ref={bottomRef}>
            {[...history].reverse().map(entry => (
              <button
                key={entry.id}
                onClick={() => reuseEntry(entry)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="text-xs text-gray-400 font-mono truncate">{entry.expr}</div>
                <div className={`text-xl font-semibold font-mono leading-tight ${entry.isError ? 'text-red-400' : 'text-gray-800'}`}>
                  = {entry.result}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1 shrink-0">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-colors ${
          input && previewIsError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'
        }`}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="12 * (3 + 4) / 2"
            spellCheck={false}
            className="flex-1 text-sm font-mono bg-transparent outline-none text-gray-800 placeholder-gray-300 min-w-0"
          />
          {preview && !previewIsError && (
            <span className="text-sm font-mono text-blue-500 shrink-0 truncate max-w-[40%]">
              = {preview}
            </span>
          )}
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="text-gray-400 hover:text-blue-500 disabled:opacity-20 cursor-pointer transition-colors shrink-0 text-lg leading-none"
          >
            ↵
          </button>
        </div>
        <div className="text-xs text-gray-300 mt-1.5 px-1 leading-relaxed">
          +&nbsp;-&nbsp;*&nbsp;/&nbsp;^&nbsp;&nbsp;sqrt()&nbsp;sin()&nbsp;log()&nbsp;abs()&nbsp;&nbsp;pi&nbsp;e&nbsp;&nbsp;15%&nbsp;of&nbsp;200
        </div>
      </div>
    </div>
  )
}
