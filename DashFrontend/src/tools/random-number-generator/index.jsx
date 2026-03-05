import { useState } from 'react'

export default function RandomNumberGenerator() {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [result, setResult] = useState(null)

  const generateRandom = () => {
    const minNum = parseInt(min, 10)
    const maxNum = parseInt(max, 10)
    if (isNaN(minNum) || isNaN(maxNum) || minNum > maxNum) {
      alert('Please enter valid numbers with min ≤ max')
      return
    }
    const rand = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
    setResult(rand)
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <button onClick={generateRandom} className="tool-btn">
          Generate
        </button>
      </div>

      {result !== null && (
        <div className="text-xl font-semibold text-gray-800">
          🎯 Result: {result}
        </div>
      )}
    </div>
  )
}