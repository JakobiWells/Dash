import { useState, useEffect, useRef } from 'react'

const CRYPTO_MAP = {
  'BTC-USD':  'BINANCE:BTCUSDT',
  'ETH-USD':  'BINANCE:ETHUSDT',
  'SOL-USD':  'BINANCE:SOLUSDT',
  'BNB-USD':  'BINANCE:BNBUSDT',
  'XRP-USD':  'BINANCE:XRPUSDT',
  'DOGE-USD': 'BINANCE:DOGEUSDT',
}

function toTV(sym) { return CRYPTO_MAP[sym] ?? sym }

// Load tv.js once globally — safe to call multiple times
function loadTVScript() {
  return new Promise(resolve => {
    if (window.TradingView) { resolve(); return }
    const existing = document.getElementById('tv-core-script')
    if (existing) { existing.addEventListener('load', resolve); return }
    const s = document.createElement('script')
    s.id  = 'tv-core-script'
    s.src = 'https://s3.tradingview.com/tv.js'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

export default function StockChart() {
  const [symbol, setSymbol] = useState(() => {
    const pending = window.__dashPendingSymbol
    if (pending) { delete window.__dashPendingSymbol; return pending }
    return 'AAPL'
  })
  const [input, setInput] = useState(symbol)
  const containerRef = useRef(null)
  // Stable unique ID for this card instance
  const containerId  = useRef(`tv_${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    let alive = true

    loadTVScript().then(() => {
      if (!alive || !containerRef.current) return

      // Clear any previous widget
      containerRef.current.innerHTML = ''

      const div = document.createElement('div')
      div.id = containerId.current
      div.style.height = '100%'
      containerRef.current.appendChild(div)

      new window.TradingView.widget({
        container_id: containerId.current,
        symbol:   toTV(symbol),
        interval: 'D',
        theme:    'light',
        style:    '1',        // candlestick
        locale:   'en',
        autosize: true,
        enable_publishing: false,
        save_image:        false,
        hide_legend:       false,
        allow_symbol_change: true,  // let user also change symbol inside chart
      })
    })

    return () => { alive = false }
  }, [symbol])

  function submit() {
    const t = input.trim().toUpperCase()
    if (t && t !== symbol) setSymbol(t)
    else if (t) {
      // Same symbol — force reload by briefly changing state
      setSymbol('')
      requestAnimationFrame(() => setSymbol(t))
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Symbol input */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-gray-100">
        <form
          onSubmit={e => { e.preventDefault(); submit() }}
          className="flex gap-1.5 flex-1"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Symbol — AAPL, BTC-USD, SPY, ^DJI…"
            className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-0"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-700 transition-colors cursor-pointer shrink-0"
          >
            Go
          </button>
        </form>
      </div>

      {/* TradingView Advanced Chart */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ overflow: 'hidden' }}
      />
    </div>
  )
}
