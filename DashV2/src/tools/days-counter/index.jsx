import { useState } from 'react'

const STORAGE_KEY = 'dashpad-days-counter'

function getDaysInfo(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  // Use local midnight to avoid timezone-shifting the date
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { count: 0,           type: 'today' }
  if (diff  > 0) return { count: diff,          type: 'until' }
                 return { count: Math.abs(diff), type: 'since' }
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function DaysCounter() {
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')

  function persist(next) {
    setEvents(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addEvent(e) {
    e.preventDefault()
    if (!label.trim() || !date) return
    persist([...events, { id: Date.now(), label: label.trim(), date }])
    setLabel('')
    setDate('')
  }

  function removeEvent(id) {
    persist(events.filter(ev => ev.id !== id))
  }

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Add form */}
      <form onSubmit={addEvent} className="flex gap-1.5">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Event name…"
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-sm bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-300 dark:focus:border-[#555553]"
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-32 px-2 py-1.5 rounded-lg text-sm bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-300 dark:focus:border-[#555553] cursor-pointer"
        />
        <button
          type="submit"
          disabled={!label.trim() || !date}
          className="w-8 h-8 shrink-0 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </form>

      {/* Events */}
      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-300 dark:text-gray-600">
          Add an event above
        </div>
      ) : (
        <div className="flex-1 overflow-auto flex flex-col gap-2 min-h-0">
          {events.map(ev => {
            const info = getDaysInfo(ev.date)
            return (
              <div
                key={ev.id}
                className="relative rounded-xl bg-gray-50 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] px-4 py-3 flex items-center gap-4"
              >
                {/* Delete */}
                <button
                  onClick={() => removeEvent(ev.id)}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Count */}
                <div className="text-center shrink-0 w-14">
                  <div className={`text-3xl font-bold tabular-nums leading-none ${
                    info.type === 'today' ? 'text-green-500' :
                    info.type === 'until' ? 'text-gray-800 dark:text-gray-100' :
                    'text-gray-400 dark:text-gray-500'
                  }`}>
                    {info.count}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium uppercase tracking-wide ${
                    info.type === 'today' ? 'text-green-500' :
                    info.type === 'until' ? 'text-blue-400' :
                    'text-gray-400 dark:text-gray-500'
                  }`}>
                    {info.type === 'today' ? 'today!' : info.type === 'until' ? 'days until' : 'days since'}
                  </div>
                </div>

                {/* Label + date */}
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{ev.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(ev.date)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
