import { useState, useEffect, useCallback } from 'react'

const MAJORS = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD', 'SEK', 'NOK', 'MXN', 'INR', 'KRW', 'BRL', 'NZD', 'ZAR']

const FLAG = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CAD: '🇨🇦',
  AUD: '🇦🇺', CHF: '🇨🇭', CNY: '🇨🇳', HKD: '🇭🇰', SGD: '🇸🇬',
  SEK: '🇸🇪', NOK: '🇳🇴', MXN: '🇲🇽', INR: '🇮🇳', KRW: '🇰🇷',
  BRL: '🇧🇷', NZD: '🇳🇿', ZAR: '🇿🇦',
}

function formatRate(rate) {
  if (rate >= 100) return rate.toFixed(2)
  if (rate >= 1) return rate.toFixed(4)
  if (rate >= 0.01) return rate.toFixed(4)
  return rate.toFixed(6)
}

export default function Forex() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [rates, setRates] = useState(null)
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRates = useCallback(async (base) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?base=${base}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setRates(data.rates)
      setDate(data.date)
    } catch {
      setError('Could not load rates. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRates(from) }, [from, fetchRates])

  function swap() {
    setFrom(to)
    setTo(from)
  }

  const toOptions = MAJORS.filter(c => c !== from)

  const convertedRate = rates?.[to]
  const converted = convertedRate != null
    ? (parseFloat(amount || 0) * convertedRate)
    : null

  const tableRates = MAJORS.filter(c => c !== from && rates?.[c] != null)

  return (
    <div className="h-full flex flex-col gap-2 p-3 overflow-hidden text-gray-800">

      {/* Converter */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-0"
            min="0"
          />
          <select
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-0 cursor-pointer"
          >
            {MAJORS.map(c => (
              <option key={c} value={c}>{FLAG[c]} {c}</option>
            ))}
          </select>

          <button
            onClick={swap}
            title="Swap"
            className="px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-base transition-colors cursor-pointer shrink-0"
          >
            ⇄
          </button>

          <select
            value={to}
            onChange={e => setTo(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 min-w-0 cursor-pointer"
          >
            {toOptions.map(c => (
              <option key={c} value={c}>{FLAG[c]} {c}</option>
            ))}
          </select>
        </div>

        {/* Result row */}
        <div className="flex items-center justify-between px-0.5 min-h-[24px]">
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Spinner />Loading…
            </div>
          ) : error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : converted != null ? (
            <span className="text-lg font-semibold">
              {formatRate(converted)}{' '}
              <span className="text-sm font-normal text-gray-400">{to}</span>
            </span>
          ) : null}

          <div className="flex items-center gap-2 ml-auto">
            {date && !loading && (
              <span className="text-xs text-gray-400">ECB · {date}</span>
            )}
            <button
              onClick={() => fetchRates(from)}
              disabled={loading}
              title="Refresh"
              className="text-sm text-blue-400 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-40"
            >
              ↻
            </button>
          </div>
        </div>
      </div>

      {/* Rate line */}
      {!loading && !error && convertedRate != null && (
        <div className="text-xs text-gray-400 px-0.5 -mt-1">
          1 {from} = {formatRate(convertedRate)} {to}
        </div>
      )}

      <div className="border-t border-gray-100" />

      {/* Rate table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <p className="text-xs text-gray-400 mb-1.5">1 {from} =</p>
        {loading && !rates ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Spinner />Loading rates…
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            {tableRates.map(c => (
              <div
                key={c}
                className="flex items-center justify-between py-1 border-b border-gray-50 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                onClick={() => setTo(c)}
                title={`Set ${c} as target`}
              >
                <span className="text-xs text-gray-500">{FLAG[c]} {c}</span>
                <span className="text-xs font-mono font-medium text-gray-700">
                  {formatRate(rates[c])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}
