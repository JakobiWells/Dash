import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function pastDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function calcStreak(habitId, completionSet) {
  let count = 0
  const d = new Date()
  // If today not done yet, start counting from yesterday (streak still alive)
  if (!completionSet.has(`${habitId}:${d.toISOString().split('T')[0]}`)) {
    d.setDate(d.getDate() - 1)
  }
  while (completionSet.has(`${habitId}:${d.toISOString().split('T')[0]}`)) {
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

const DAYS = pastDays(28)

export default function HabitTracker() {
  const { user } = useAuth()
  const [tab, setTab]               = useState('today')
  const [habits, setHabits]         = useState([])
  const [completionSet, setCompletionSet] = useState(new Set())
  const [loading, setLoading]       = useState(true)
  const [adding, setAdding]         = useState(false)
  const [form, setForm]             = useState({ name: '', emoji: '✨', color: COLORS[5], goal: '' })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const [{ data: habitsData }, { data: completionsData }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('habit_completions').select('habit_id, date').eq('user_id', user.id).gte('date', pastDays(28)[0]),
    ])
    setHabits(habitsData ?? [])
    setCompletionSet(new Set((completionsData ?? []).map(c => `${c.habit_id}:${c.date}`)))
    setLoading(false)
  }

  async function toggleCompletion(habitId) {
    const key = `${habitId}:${todayStr()}`
    const done = completionSet.has(key)
    if (done) {
      await supabase.from('habit_completions').delete().eq('habit_id', habitId).eq('date', todayStr()).eq('user_id', user.id)
      setCompletionSet(s => { const n = new Set(s); n.delete(key); return n })
    } else {
      await supabase.from('habit_completions').insert({ habit_id: habitId, user_id: user.id, date: todayStr() })
      setCompletionSet(s => new Set([...s, key]))
    }
  }

  async function addHabit() {
    if (!form.name.trim()) return
    const { data } = await supabase
      .from('habits')
      .insert({ user_id: user.id, name: form.name.trim(), emoji: form.emoji || '✨', color: form.color, goal: form.goal.trim() || null })
      .select().single()
    if (data) setHabits(h => [...h, data])
    setForm({ name: '', emoji: '✨', color: COLORS[5], goal: '' })
    setAdding(false)
  }

  async function deleteHabit(id) {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(h => h.filter(x => x.id !== id))
    setCompletionSet(s => { const n = new Set(s); for (const k of n) if (k.startsWith(id)) n.delete(k); return n })
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
        <span className="text-3xl">🔥</span>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Sign in to track habits</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Your habits sync across all your devices</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-300 dark:text-gray-600">
          <path d="M14 8A6 6 0 1 1 8 2"/>
        </svg>
      </div>
    )
  }

  const t = todayStr()
  const doneToday = habits.filter(h => completionSet.has(`${h.id}:${t}`)).length

  return (
    <div className="h-full flex flex-col min-h-0">

      {/* Header */}
      <div className="flex items-center gap-2 pb-2 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Today</p>
          {habits.length > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{doneToday} / {habits.length} done</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#2a2a28] rounded-lg p-0.5 shrink-0">
          {['today', 'history'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer capitalize ${
                tab === t
                  ? 'bg-white dark:bg-[#1e1e1c] text-gray-700 dark:text-gray-200 shadow-sm'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">

        {/* ── Today tab ── */}
        {tab === 'today' && (
          <div className="flex flex-col gap-0.5">
            {habits.length === 0 && !adding && (
              <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">No habits yet</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600">Add your first habit below</p>
              </div>
            )}

            {habits.map(h => {
              const done = completionSet.has(`${h.id}:${t}`)
              const s = calcStreak(h.id, completionSet)
              return (
                <div
                  key={h.id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                    done ? 'bg-gray-50 dark:bg-[#1e1e1c]' : 'hover:bg-gray-50 dark:hover:bg-[#1e1e1c]'
                  }`}
                >
                  {/* Color bar */}
                  <div className="w-0.5 h-5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />

                  {/* Circular checkbox */}
                  <button
                    onClick={() => toggleCompletion(h.id)}
                    className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer"
                    style={{ borderColor: h.color, backgroundColor: done ? h.color : 'transparent' }}
                  >
                    {done && (
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Emoji */}
                  <span className="text-sm shrink-0 leading-none">{h.emoji}</span>

                  {/* Name + goal */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate transition-colors ${
                      done ? 'line-through text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'
                    }`}>{h.name}</p>
                    {h.goal && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{h.goal}</p>
                    )}
                  </div>

                  {/* Streak */}
                  {s > 1 && (
                    <span className="text-[10px] text-orange-400 shrink-0">🔥 {s}</span>
                  )}

                  {/* Delete — visible on row hover */}
                  <button
                    onClick={() => deleteHabit(h.id)}
                    className="shrink-0 text-gray-200 dark:text-gray-700 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )
            })}

            {/* Add form */}
            {adding ? (
              <div className="mt-1 flex flex-col gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-[#2e2e2c]">
                <div className="flex gap-2">
                  <input
                    value={form.emoji}
                    onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-9 text-center text-sm border border-gray-200 dark:border-[#3a3a38] rounded-lg bg-transparent focus:outline-none"
                    placeholder="✨"
                    maxLength={2}
                  />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addHabit()}
                    className="flex-1 text-xs border border-gray-200 dark:border-[#3a3a38] rounded-lg px-2 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    placeholder="Habit name"
                    autoFocus
                  />
                </div>
                <input
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                  className="text-xs border border-gray-200 dark:border-[#3a3a38] rounded-lg px-2 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Goal (optional) — e.g. 8 glasses, 30 min"
                />
                {/* Color swatches */}
                <div className="flex gap-1.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0"
                      style={{
                        backgroundColor: c,
                        outline: form.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={addHabit}
                    className="flex-1 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                  >Add</button>
                  <button
                    onClick={() => setAdding(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2e2e2c] text-gray-400 dark:text-gray-500 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors"
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e1e1c] transition-colors cursor-pointer text-xs w-full mt-1"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add habit
              </button>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <div className="flex flex-col gap-5">
            {habits.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No habits yet</p>
            )}
            {habits.map(h => {
              const s = calcStreak(h.id, completionSet)
              const total = DAYS.filter(d => completionSet.has(`${h.id}:${d}`)).length
              return (
                <div key={h.id}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm leading-none">{h.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 flex-1 min-w-0 truncate">{h.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{total}/28</span>
                    {s > 0 && <span className="text-[10px] text-orange-400 shrink-0">🔥 {s}</span>}
                  </div>
                  {/* 28-day grid */}
                  <div className="flex gap-0.5 flex-wrap">
                    {DAYS.map(d => {
                      const done = completionSet.has(`${h.id}:${d}`)
                      const isToday = d === t
                      return (
                        <div
                          key={d}
                          title={d}
                          className={`w-3 h-3 rounded-sm ${isToday ? 'ring-1 ring-offset-1 ring-gray-400 dark:ring-gray-500' : ''}`}
                          style={{ backgroundColor: done ? h.color : undefined }}
                        >
                          {!done && <div className="w-full h-full rounded-sm bg-gray-100 dark:bg-[#2a2a28]" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
