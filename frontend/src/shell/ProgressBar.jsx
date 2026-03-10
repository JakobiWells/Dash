import { useState, useEffect, useRef } from 'react'

/**
 * ProgressBar — two modes:
 *
 * Real progress:   <ProgressBar progress={0.45} />
 * Time-estimated:  <ProgressBar estimatedMs={300000} running={true} done={false} />
 *
 * Props:
 *   progress     0–1 exact value (takes priority over time-based)
 *   estimatedMs  estimated total duration in ms (for time-based)
 *   running      whether the task is running (for time-based)
 *   done         set true to snap bar to 100%
 *   label        optional string shown to the right of the bar (e.g. "42%")
 *   className    extra classes on the container div
 */
export default function ProgressBar({ progress, estimatedMs, running, done, label, className = '' }) {
  const [estimated, setEstimated] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  const isTimeBased = progress === undefined

  useEffect(() => {
    if (!isTimeBased) return
    if (done) { setEstimated(1); return }
    if (!running) { setEstimated(0); startRef.current = null; return }

    if (!startRef.current) startRef.current = Date.now()

    function tick() {
      const elapsed = Date.now() - startRef.current
      // Asymptotic curve: approaches ~95% over estimatedMs, never reaches 1 until done
      const t = elapsed / (estimatedMs || 300_000)
      const p = 1 - Math.exp(-t * 1.6)
      setEstimated(Math.min(p, 0.95))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running, done, estimatedMs, isTimeBased])

  const pct = done ? 100 : isTimeBased ? Math.round(estimated * 100) : Math.round((progress ?? 0) * 100)

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gray-800 h-1.5 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label !== undefined && (
        <p className="text-xs text-gray-400 text-center">{label}</p>
      )}
    </div>
  )
}
