import { useState, useEffect, useRef } from 'react'

const KEY = 'dash-markets-watchlist'
const DEFAULT = ['AAPL', 'NVDA', 'SPY', 'DIA', 'BTC-USD', 'ETH-USD']

const NAMES = {
  'AAPL': 'Apple',       'MSFT': 'Microsoft', 'GOOGL': 'Google',  'AMZN': 'Amazon',
  'TSLA': 'Tesla',       'NVDA': 'NVIDIA',    'META': 'Meta',     'NFLX': 'Netflix',
  'AMD':  'AMD',         'INTC': 'Intel',     'SHOP': 'Shopify',  'ORCL': 'Oracle',
  'SPY':  'S&P 500 ETF', 'QQQ': 'NASDAQ ETF', 'DIA': 'Dow Jones ETF', 'IWM': 'Russell 2000',
  'GLD':  'Gold ETF',    'SLV': 'Silver ETF', 'USO': 'Oil ETF',
  'BTC-USD': 'Bitcoin',  'ETH-USD': 'Ethereum', 'SOL-USD': 'Solana',
  'BNB-USD': 'BNB',      'XRP-USD': 'XRP',      'DOGE-USD': 'Dogecoin',
}

// TradingView symbol format for crypto
const CRYPTO_MAP = {
  'BTC-USD':  'BINANCE:BTCUSDT',
  'ETH-USD':  'BINANCE:ETHUSDT',
  'SOL-USD':  'BINANCE:SOLUSDT',
  'BNB-USD':  'BINANCE:BNBUSDT',
  'XRP-USD':  'BINANCE:XRPUSDT',
  'DOGE-USD': 'BINANCE:DOGEUSDT',
}

function toTV(sym) { return CRYPTO_MAP[sym] ?? sym }

function initWidget(container, watchlist) {
  container.innerHTML = ''

  const widgetDiv = document.createElement('div')
  widgetDiv.className = 'tradingview-widget-container__widget'
  widgetDiv.style.height = 'calc(100% - 32px)' // TV appends a footer link
  container.appendChild(widgetDiv)

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
  script.async = true
  script.textContent = JSON.stringify({
    colorTheme: 'light',
    dateRange: '1M',
    showChart: true,
    locale: 'en',
    width: '100%',
    height: '100%',
    belowLineFillColorGrow: 'rgba(16, 185, 129, 0.12)',
    belowLineFillColorFall: 'rgba(239, 68, 68, 0.12)',
    gridLineColor: 'rgba(240, 243, 250, 0)',
    scaleFontColor: 'rgba(134, 137, 147, 1)',
    showFloatingTooltip: false,
    tabs: [{
      title: 'Watchlist',
      symbols: watchlist.map(sym => ({
        s: toTV(sym),
        d: NAMES[sym] || sym.replace('-USD', ''),
      })),
      originalTitle: 'Watchlist',
    }],
  })
  container.appendChild(script)
}

export default function Markets() {
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || DEFAULT }
    catch { return DEFAULT }
  })
  const [editing, setEditing] = useState(false)
  const [input, setInput]     = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (editing || !containerRef.current) return
    initWidget(containerRef.current, watchlist)
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [watchlist, editing])

  function saveWatchlist(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
  }

  function addSymbol() {
    const sym = input.trim().toUpperCase()
    if (!sym || watchlist.includes(sym)) { setInput(''); return }
    const next = [...watchlist, sym]
    setWatchlist(next)
    saveWatchlist(next)
    setInput('')
  }

  function removeSymbol(sym) {
    const next = watchlist.filter(s => s !== sym)
    setWatchlist(next)
    saveWatchlist(next)
  }

  function popOut(sym) {
    window.__dashPendingSymbol = sym
    window.dispatchEvent(new CustomEvent('dash:add-tool', { detail: { toolId: 'stock-chart' } }))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Markets</span>
        <div className="flex-1" />
        <button
          onClick={() => setEditing(e => !e)}
          className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
            editing
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {editing ? 'Done' : 'Edit Watchlist'}
        </button>
      </div>

      {/* Edit mode */}
      {editing ? (
        <div className="flex flex-col gap-2 p-3 flex-1 overflow-hidden">
          <form
            onSubmit={e => { e.preventDefault(); addSymbol() }}
            className="flex gap-1.5 shrink-0"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Add symbol (AAPL, BTC-USD, SPY…)"
              className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-0"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors cursor-pointer shrink-0"
            >
              Add
            </button>
          </form>

          <div className="flex-1 overflow-y-auto min-h-0">
            {watchlist.length === 0 && (
              <p className="text-xs text-gray-400 text-center pt-4">No symbols yet. Add one above.</p>
            )}
            {watchlist.map(sym => (
              <div
                key={sym}
                className="flex items-center justify-between py-2 px-1 border-b border-gray-50 last:border-0"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-800">{sym.replace('-USD', '')}</span>
                  <span className="text-[10px] text-gray-400">{NAMES[sym] ?? ''}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => popOut(sym)}
                    className="text-xs text-blue-400 hover:text-blue-600 cursor-pointer"
                  >
                    Open Chart ↗
                  </button>
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="text-xs text-gray-400 hover:text-red-400 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TradingView Market Overview widget */
        <div
          ref={containerRef}
          className="flex-1 min-h-0 tradingview-widget-container"
          style={{ overflow: 'hidden' }}
        />
      )}
    </div>
  )
}
