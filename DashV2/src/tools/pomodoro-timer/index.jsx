import { useState, useEffect, useRef } from 'react'

const DEFAULTS = { pomodoro: 25, shortBreak: 5, longBreak: 15 }
const META     = {
  pomodoro:   { label: 'Focus',       color: '#f97316', track: '#fff1e6' },
  shortBreak: { label: 'Short Break', color: '#10b981', track: '#ecfdf5' },
  longBreak:  { label: 'Long Break',  color: '#6366f1', track: '#eef2ff' },
}

const RADIUS = 52
const CIRC   = 2 * Math.PI * RADIUS

function fmt(n) { return String(n).padStart(2, '0') }

export default function PomodoroTimer() {
  const [mode, setMode]         = useState('pomodoro')
  const [durations, setDurations] = useState({ ...DEFAULTS }) // minutes per mode
  const [remaining, setRemaining] = useState(DEFAULTS.pomodoro * 60)
  const [isRunning, setIsRunning] = useState(false)

  // Refs so the interval callback is never stale
  const remainingRef = useRef(DEFAULTS.pomodoro * 60)
  const totalRef     = useRef(DEFAULTS.pomodoro * 60)

  // Timer is in a "fresh" state (not mid-run)
  const isFresh = remaining === totalRef.current

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      remainingRef.current -= 1
      setRemaining(remainingRef.current)
      if (remainingRef.current <= 0) setIsRunning(false)
    }, 1000)
    return () => clearInterval(id)
  }, [isRunning])

  function selectMode(key) {
    setIsRunning(false)
    setMode(key)
    const secs = durations[key] * 60
    remainingRef.current = secs
    totalRef.current     = secs
    setRemaining(secs)
  }

  function reset() {
    setIsRunning(false)
    remainingRef.current = totalRef.current
    setRemaining(totalRef.current)
  }

  function adjustMinutes(delta) {
    const next = Math.max(1, Math.min(99, durations[mode] + delta))
    const secs = next * 60
    setDurations(d => ({ ...d, [mode]: next }))
    remainingRef.current = secs
    totalRef.current     = secs
    setRemaining(secs)
  }

  const { color, track, label } = META[mode]
  const mins       = Math.floor(remaining / 60)
  const secs       = remaining % 60
  const progress   = totalRef.current > 0 ? remaining / totalRef.current : 1
  const dashOffset = CIRC * (1 - progress)

  return (
    <div className="h-full flex flex-col items-center justify-between py-3 px-2">

      {/* Mode pills */}
      <div className="flex gap-1.5">
        {Object.entries(META).map(([key, m]) => (
          <button
            key={key}
            onClick={() => selectMode(key)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
            style={mode === key
              ? { background: color, color: '#fff' }
              : { background: '#f3f4f6', color: '#6b7280' }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Circle */}
      <div className="flex items-center justify-center" style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox="0 0 120 120" style={{ width: '100%', maxWidth: 160, maxHeight: 160 }}>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke={track} strokeWidth="7" />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: isRunning ? 'stroke-dashoffset 0.9s linear' : 'none' }}
          />
          <text
            x="60" y="54"
            textAnchor="middle" dominantBaseline="middle"
            fontSize="18" fontWeight="600"
            fontFamily="ui-monospace, monospace"
            fill="#111827"
          >
            {fmt(mins)}:{fmt(secs)}
          </text>
          <text
            x="60" y="70"
            textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fontWeight="500"
            fill="#9ca3af" letterSpacing="0.08em"
          >
            {label.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Duration adjuster — only when fresh (not mid-run) */}
      {isFresh && !isRunning && (
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => adjustMinutes(-1)}
            disabled={durations[mode] <= 1}
            className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            −
          </button>
<button
            onClick={() => adjustMinutes(1)}
            disabled={durations[mode] >= 99}
            className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            +
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(r => !r)}
          disabled={remaining <= 0}
          className="px-5 py-1.5 rounded-full text-sm font-semibold text-white transition-opacity cursor-pointer disabled:opacity-40"
          style={{ background: color }}
        >
          {isRunning ? 'Pause' : isFresh ? 'Start' : 'Resume'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

    </div>
  )
}
