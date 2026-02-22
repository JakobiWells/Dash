import { useState } from 'react'

export default function TipCalculator() {
  const [bill, setBill] = useState('')
  const [tipPercent, setTipPercent] = useState(15)
  const [people, setPeople] = useState(1)

  const billAmount = parseFloat(bill) || 0
  const tipAmount = (billAmount * (parseFloat(tipPercent) || 0)) / 100
  const totalAmount = billAmount + tipAmount
  const perPerson = people > 0 ? totalAmount / people : totalAmount

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Bill & Tip inputs */}
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={bill}
          onChange={(e) => setBill(e.target.value)}
          placeholder="Bill Amount"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={tipPercent}
          onChange={(e) => setTipPercent(e.target.value)}
          placeholder="Tip %"
          className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* People input */}
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={people}
          onChange={(e) => setPeople(Math.max(1, e.target.value))}
          placeholder="Number of People"
          className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
        <div>Tip Amount: ${tipAmount.toFixed(2)}</div>
        <div>Total Amount: ${totalAmount.toFixed(2)}</div>
        <div>Per Person: ${perPerson.toFixed(2)}</div>
      </div>
    </div>
  )
}