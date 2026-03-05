import { useState, useEffect } from 'react'

const BASE_OPTIONS = [
  { label: 'Binary', value: 2 },
  { label: 'Octal', value: 8 },
  { label: 'Decimal', value: 10 },
  { label: 'Hexadecimal', value: 16 },
]

export default function NumberConverter() {
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(2)
  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')
  const [activeInput, setActiveInput] = useState('from') // track which box user is typing in

  // Whenever values or bases change, recalculate the other box
  useEffect(() => {
    if (activeInput === 'from') {
      if (fromValue === '') {
        setToValue('')
        return
      }
      let decimal
      try {
        decimal = parseInt(fromValue, fromBase)
        if (isNaN(decimal)) throw new Error()
        setToValue(decimal.toString(toBase).toUpperCase())
      } catch {
        setToValue('Invalid')
      }
    } else if (activeInput === 'to') {
      if (toValue === '') {
        setFromValue('')
        return
      }
      let decimal
      try {
        decimal = parseInt(toValue, toBase)
        if (isNaN(decimal)) throw new Error()
        setFromValue(decimal.toString(fromBase).toUpperCase())
      } catch {
        setFromValue('Invalid')
      }
    }
  }, [fromValue, toValue, fromBase, toBase, activeInput])

  return (
    <div className="h-full flex flex-col gap-3">
      {/* From input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={fromValue}
          onChange={(e) => {
            setActiveInput('from')
            setFromValue(e.target.value)
          }}
          placeholder="Enter number"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <select
          value={fromBase}
          onChange={(e) => setFromBase(parseInt(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        >
          {BASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* To input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={toValue}
          onChange={(e) => {
            setActiveInput('to')
            setToValue(e.target.value)
          }}
          placeholder="Converted number"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <select
          value={toBase}
          onChange={(e) => setToBase(parseInt(e.target.value))}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        >
          {BASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}