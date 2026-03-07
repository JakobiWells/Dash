import { useState, useEffect, useCallback } from 'react'
import ICAL from 'ical.js'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const API_BASE = 'https://dash-production-3e07.up.railway.app'

const FEED_COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Persistence (localStorage fallback for guests) ──────────────────────────

function lsLoad(instanceId) {
  try { const s = localStorage.getItem(`cal-feeds-${instanceId}`); return s ? JSON.parse(s) : [] }
  catch { return [] }
}
function lsSave(instanceId, feeds) {
  try { localStorage.setItem(`cal-feeds-${instanceId}`, JSON.stringify(feeds)) } catch {}
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function getMonthCells(year, month) {
  const cells = []
  const firstDow = new Date(year, month, 1).getDay()
  const numDays  = new Date(year, month + 1, 0).getDate()
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d))
  return cells
}

// ─── ICS fetch + parse ────────────────────────────────────────────────────────

async function fetchFeedEvents(feed, rangeStart, rangeEnd, onError) {
  try {
    const proxyUrl = `${API_BASE}/api/ical?url=${encodeURIComponent(feed.url)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status} from proxy`)
    const text = await res.text()

    const events = []
    const jcalData = ICAL.parse(text)
    const comp     = new ICAL.Component(jcalData)
    const vevents  = comp.getAllSubcomponents('vevent')

    const startMs = rangeStart.getTime()
    const endMs   = rangeEnd.getTime()

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent)
        if (!event.summary) continue

        if (event.isRecurring()) {
          const icalStart = ICAL.Time.fromJSDate(rangeStart)
          const iter = event.iterator(icalStart)
          let next
          let guard = 0
          while ((next = iter.next()) && guard++ < 500) {
            const ms = next.toJSDate().getTime()
            if (ms > endMs) break
            if (ms >= startMs) {
              const det = event.getOccurrenceDetails(next)
              events.push({
                id:      `${feed.id}__${event.uid}__${ms}`,
                summary: event.summary,
                start:   det.startDate.toJSDate(),
                end:     det.endDate?.toJSDate() ?? null,
                allDay:  det.startDate.isDate,
                color:   feed.color,
              })
            }
          }
        } else {
          const start = event.startDate.toJSDate()
          const ms    = start.getTime()
          if (ms >= startMs && ms <= endMs) {
            events.push({
              id:      `${feed.id}__${event.uid}`,
              summary: event.summary,
              start,
              end:     event.endDate?.toJSDate() ?? null,
              allDay:  event.startDate.isDate,
              color:   feed.color,
            })
          }
        }
      } catch { /* skip malformed vevent */ }
    }

    return events
  } catch (e) {
    console.error(`Calendar: failed to load "${feed.label}":`, e)
    onError?.(`Failed to load "${feed.label}": ${e.message}`)
    return []
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarTool({ instanceId }) {
  const today = new Date()
  const { user } = useAuth()

  const [viewDate,  setViewDate]  = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected,  setSelected]  = useState(today)
  const [feeds,     setFeeds]     = useState([])
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [feedError, setFeedError] = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newFeed,   setNewFeed]   = useState({ url: '', label: '', color: FEED_COLORS[0] })

  // Load feeds from Supabase (logged in) or localStorage (guest)
  useEffect(() => {
    if (!user) {
      setFeeds(lsLoad(instanceId))
      return
    }
    supabase
      .from('calendar_feeds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setFeeds(data) })
  }, [user, instanceId])

  // Load events whenever feeds or viewed month changes
  const reload = useCallback(async (feedList, center) => {
    if (!feedList.length) { setEvents([]); return }
    setLoading(true)
    setFeedError(null)
    const rangeStart = new Date(center.getFullYear(), center.getMonth() - 1, 1)
    const rangeEnd   = new Date(center.getFullYear(), center.getMonth() + 2, 0)
    const results = await Promise.all(feedList.map(f => fetchFeedEvents(f, rangeStart, rangeEnd, setFeedError)))
    setEvents(results.flat().sort((a, b) => a.start - b.start))
    setLoading(false)
  }, [])

  useEffect(() => { reload(feeds, viewDate) }, [feeds, viewDate, reload])

  // ── Mutations ──
  async function addFeed() {
    if (!newFeed.url.trim()) return
    const feedData = {
      url:   newFeed.url.trim(),
      label: newFeed.label.trim() || 'Calendar',
      color: newFeed.color,
    }

    if (user) {
      const { data } = await supabase
        .from('calendar_feeds')
        .insert({ ...feedData, user_id: user.id })
        .select().single()
      if (data) setFeeds(prev => [...prev, data])
    } else {
      const feed = { ...feedData, id: Date.now().toString() }
      const next = [...feeds, feed]
      setFeeds(next)
      lsSave(instanceId, next)
    }

    setNewFeed({ url: '', label: '', color: FEED_COLORS[(feeds.length + 1) % FEED_COLORS.length] })
    setShowAdd(false)
  }

  async function removeFeed(id) {
    if (user) {
      await supabase.from('calendar_feeds').delete().eq('id', id).eq('user_id', user.id)
    } else {
      lsSave(instanceId, feeds.filter(f => f.id !== id))
    }
    setFeeds(prev => prev.filter(f => f.id !== id))
  }

  // ── Derived ──
  const cells        = getMonthCells(viewDate.getFullYear(), viewDate.getMonth())
  const selectedEvts = events.filter(e => isSameDay(e.start, selected))

  function dotsForDay(day) {
    if (!day) return []
    return events.filter(e => isSameDay(e.start, day))
  }

  function fmtTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  // ── Render ──
  return (
    <div className="h-full flex flex-col gap-2 min-h-0">

      {/* Month nav */}
      <div className="flex items-center shrink-0">
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a28] text-gray-400 dark:text-gray-500 cursor-pointer transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2L4 6l4 4"/>
          </svg>
        </button>
        <span className="flex-1 text-center text-xs font-semibold text-gray-700 dark:text-gray-200">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a28] text-gray-400 dark:text-gray-500 cursor-pointer transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 2l4 4-4 4"/>
          </svg>
        </button>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="ml-1 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a28] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
          title="Manage calendars"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1v10M1 6h10"/>
          </svg>
        </button>
      </div>

      {/* Add / manage feeds panel */}
      {showAdd && (
        <div className="shrink-0 flex flex-col gap-2 p-2.5 rounded-xl border border-gray-100 dark:border-[#2e2e2c]">
          <input
            value={newFeed.url}
            onChange={e => setNewFeed(f => ({ ...f, url: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addFeed()}
            className="text-xs border border-gray-200 dark:border-[#3a3a38] rounded-lg px-2 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
            placeholder="Paste ICS / iCal URL (Google, Apple, Outlook…)"
            autoFocus
          />
          <div className="flex gap-1.5 items-center">
            <input
              value={newFeed.label}
              onChange={e => setNewFeed(f => ({ ...f, label: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addFeed()}
              className="flex-1 text-xs border border-gray-200 dark:border-[#3a3a38] rounded-lg px-2 py-1.5 bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              placeholder="Label"
            />
            <div className="flex gap-1">
              {FEED_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewFeed(f => ({ ...f, color: c }))}
                  className="w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-110 shrink-0"
                  style={{ backgroundColor: c, outline: newFeed.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={addFeed} className="flex-1 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-1 rounded-lg border border-gray-200 dark:border-[#2e2e2c] text-gray-400 dark:text-gray-500 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a28] transition-colors">
              Cancel
            </button>
          </div>

          {/* Existing feeds */}
          {feeds.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-100 dark:border-[#2e2e2c]">
              {feeds.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-1 truncate">{f.label}</span>
                  <button
                    onClick={() => removeFeed(f.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 cursor-pointer transition-colors"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* How-to hint */}
          <p className="text-[9px] text-gray-300 dark:text-gray-600 leading-relaxed">
            Google: Calendar settings → Integrate → Secret address in iCal format<br/>
            Apple: Share calendar → check Public → Copy Link
          </p>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 shrink-0">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 pb-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5 shrink-0">
        {cells.map((day, i) => {
          const dots    = dotsForDay(day).slice(0, 3)
          const isToday = day && isSameDay(day, today)
          const isSel   = day && isSameDay(day, selected)
          return (
            <button
              key={i}
              disabled={!day}
              onClick={() => day && setSelected(day)}
              className={`flex flex-col items-center py-0.5 rounded-lg transition-colors ${
                !day     ? 'cursor-default' :
                isSel    ? 'bg-gray-900 dark:bg-gray-100' :
                isToday  ? 'bg-gray-100 dark:bg-[#2a2a28] cursor-pointer' :
                           'hover:bg-gray-50 dark:hover:bg-[#2a2a28] cursor-pointer'
              }`}
            >
              {day && (
                <>
                  <span className={`text-[10px] font-medium leading-4 ${
                    isSel   ? 'text-white dark:text-gray-900' :
                    isToday ? 'text-gray-900 dark:text-gray-100 font-bold' :
                              'text-gray-600 dark:text-gray-400'
                  }`}>
                    {day.getDate()}
                  </span>
                  <div className="flex gap-px h-1.5 items-center">
                    {dots.map((e, j) => (
                      <div key={j} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSel ? 'rgba(255,255,255,0.7)' : e.color }} />
                    ))}
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-[#2e2e2c] shrink-0" />

      {/* Events for selected day */}
      <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
          {isSameDay(selected, today)
            ? 'Today'
            : selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>

        {feedError && (
          <p className="text-[10px] text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-2 py-1.5 mb-2">{feedError}</p>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-300 dark:text-gray-600">
              <path d="M14 8A6 6 0 1 1 8 2"/>
            </svg>
          </div>
        )}

        {!loading && feeds.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">No calendars connected</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-[10px] text-blue-400 hover:text-blue-500 cursor-pointer transition-colors"
            >
              + Add a calendar
            </button>
            {!user && (
              <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-1">
                Sign in to sync across devices
              </p>
            )}
          </div>
        )}

        {!loading && feeds.length > 0 && selectedEvts.length === 0 && (
          <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-3">No events</p>
        )}

        {!loading && selectedEvts.map(e => (
          <div key={e.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 dark:border-[#252523] last:border-0">
            <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: e.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-snug truncate">{e.summary}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {e.allDay
                  ? 'All day'
                  : e.end
                    ? `${fmtTime(e.start)} – ${fmtTime(e.end)}`
                    : fmtTime(e.start)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
