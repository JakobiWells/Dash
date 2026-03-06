import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

const MONTHLY_PRICE = 6
const YEARLY_PRICE = 48 // $4/mo billed yearly
const YEARLY_MONTHLY_EQUIV = (YEARLY_PRICE / 12).toFixed(0)

const PRO_FEATURES = [
  { icon: '⬇️', label: 'Media downloader (YouTube, SoundCloud, TikTok…)' },
  { icon: '🗂️', label: 'Unlimited saved layouts' },
  { icon: '🤖', label: 'AI-powered tools' },
  { icon: '⚡', label: 'Batch processing & workflows' },
]

export default function UpgradeModal({ onClose, reason }) {
  const { user } = useAuth()
  const [plan, setPlan] = useState('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpgrade() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Upgrade to Pro</h2>
            {reason && <p className="text-xs text-gray-400 mt-0.5">{reason}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Pro features list */}
        <ul className="flex flex-col gap-2">
          {PRO_FEATURES.map(f => (
            <li key={f.label} className="flex items-center gap-2.5 text-sm text-gray-700">
              <span className="text-base">{f.icon}</span>
              {f.label}
            </li>
          ))}
        </ul>

        {/* Plan toggle */}
        <div className="flex gap-2">
          {[
            { id: 'monthly', label: 'Monthly', price: `$${MONTHLY_PRICE}/mo` },
            { id: 'yearly',  label: 'Yearly',  price: `$${YEARLY_MONTHLY_EQUIV}/mo`, badge: 'Save 33%' },
          ].map(({ id, label, price, badge }) => (
            <button
              key={id}
              onClick={() => setPlan(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 rounded-xl border-2 transition-colors cursor-pointer
                ${plan === id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-gray-900">{price}</span>
              {badge && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              {id === 'yearly' && (
                <span className="text-[10px] text-gray-400">billed ${YEARLY_PRICE}/yr</span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* CTA */}
        {user ? (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting to checkout…' : `Get Pro — $${plan === 'yearly' ? YEARLY_PRICE + '/yr' : MONTHLY_PRICE + '/mo'}`}
          </button>
        ) : (
          <p className="text-xs text-center text-gray-500">
            <button onClick={onClose} className="text-gray-900 font-medium hover:underline cursor-pointer">Sign in</button>
            {' '}to upgrade
          </p>
        )}

        <p className="text-[11px] text-gray-400 text-center -mt-2">
          Cancel any time · Secure checkout via Stripe
        </p>
      </div>
    </div>
  )
}
