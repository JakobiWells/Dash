import { useState } from 'react'

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('')
  const [annualRate, setAnnualRate] = useState('')
  const [months, setMonths] = useState('')

  const P = parseFloat(principal) || 0
  const r = (parseFloat(annualRate) || 0) / 12 / 100
  const n = parseInt(months) || 0

  let emi = 0
  if (P > 0 && r > 0 && n > 0) {
    emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  } else if (P > 0 && n > 0) {
    emi = P / n
  }

  const totalPayment = emi * n
  const totalInterest = totalPayment - P

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Inputs */}
      <div className="flex flex-col gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="Loan Amount"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          placeholder="Annual Interest Rate (%)"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <input
          type="number"
          min="1"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          placeholder="Loan Term (Months)"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1 p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-800">
        <div>Monthly Payment (EMI): ${emi.toFixed(2)}</div>
        <div>Total Payment: ${totalPayment.toFixed(2)}</div>
        <div>Total Interest: ${totalInterest.toFixed(2)}</div>
      </div>
    </div>
  )
}