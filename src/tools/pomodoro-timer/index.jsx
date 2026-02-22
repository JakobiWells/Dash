import { useState, useEffect, useRef } from 'react'

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const intervalRef = useRef(null)

  // Timer tick
  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 0) {
          if (minutes === 0) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            return 0
          } else {
            setMinutes((m) => m - 1)
            return 59
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, minutes])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setMinutes(25)
    setSeconds(0)
  }

  const formatTime = (num) => String(num).padStart(2, '0')

  return (
    <div className="h-full flex flex-col gap-3 items-center justify-center">
      <div className="text-4xl font-mono">{formatTime(minutes)}:{formatTime(seconds)}</div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button onClick={handleStart} className="tool-btn">Start</button>
        ) : (
          <button onClick={handlePause} className="tool-btn">Pause</button>
        )}
        <button onClick={handleReset} className="tool-btn">Reset</button>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="number"
          min="1"
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, e.target.value))}
          placeholder="Minutes"
          className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>
    </div>
  )
}