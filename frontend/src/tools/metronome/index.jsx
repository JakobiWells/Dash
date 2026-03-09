import { useState, useRef, useEffect } from 'react'

const MIN_BPM = 40
const MAX_BPM = 240
const TIME_SIGS = [2, 3, 4, 5, 6, 7]

export default function Metronome() {
  const [bpm, setBpmState] = useState(120)
  const [timeSig, setTimeSigState] = useState(4)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeBeat, setActiveBeat] = useState(-1)

  // Refs so scheduler always reads latest values
  const bpmRef = useRef(120)
  const timeSigRef = useRef(4)
  const isPlayingRef = useRef(false)
  const nextNoteTimeRef = useRef(0)
  const currentBeatRef = useRef(0)
  const timerIdRef = useRef(null)
  const audioCtxRef = useRef(null)
  const tapTimesRef = useRef([])

  function setBpm(v) {
    const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, v))
    bpmRef.current = clamped
    setBpmState(clamped)
  }

  function setTimeSig(v) {
    timeSigRef.current = v
    setTimeSigState(v)
  }

  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  function click(time, isDown) {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = isDown ? 1100 : 880
    gain.gain.setValueAtTime(0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
    osc.start(time)
    osc.stop(time + 0.04)
  }

  function schedule() {
    if (!isPlayingRef.current) return
    const ctx = getCtx()
    const LOOKAHEAD = 0.1 // seconds
    const INTERVAL  = 25  // ms

    while (nextNoteTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const beat = currentBeatRef.current
      const t    = nextNoteTimeRef.current
      click(t, beat === 0)
      // Schedule visual update
      const delay = (t - ctx.currentTime) * 1000
      setTimeout(() => setActiveBeat(beat), Math.max(0, delay))

      nextNoteTimeRef.current += 60 / bpmRef.current
      currentBeatRef.current = (beat + 1) % timeSigRef.current
    }

    timerIdRef.current = setTimeout(schedule, INTERVAL)
  }

  function start() {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    currentBeatRef.current = 0
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    isPlayingRef.current = true
    setIsPlaying(true)
    schedule()
  }

  function stop() {
    isPlayingRef.current = false
    clearTimeout(timerIdRef.current)
    setIsPlaying(false)
    setActiveBeat(-1)
  }

  function tap() {
    const now = Date.now()
    const taps = tapTimesRef.current
    taps.push(now)
    if (taps.length > 4) taps.shift()
    if (taps.length >= 2) {
      let sum = 0
      for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1]
      setBpm(Math.round(60000 / (sum / (taps.length - 1))))
    }
  }

  // Reset tap buffer if idle for 2s
  useEffect(() => {
    const id = setTimeout(() => { tapTimesRef.current = [] }, 2000)
    return () => clearTimeout(id)
  }, [bpm])

  useEffect(() => () => {
    clearTimeout(timerIdRef.current)
    audioCtxRef.current?.close()
  }, [])

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Beat dots */}
      <div className="flex gap-2 justify-center pt-1">
        {Array.from({ length: timeSig }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all"
            style={{
              height: 10,
              background: isPlaying && activeBeat === i
                ? i === 0 ? '#111' : '#6b7280'
                : '#e5e7eb',
              transform: isPlaying && activeBeat === i ? 'scaleY(1.3)' : 'scaleY(1)',
            }}
          />
        ))}
      </div>

      {/* BPM display */}
      <div className="text-center">
        <span className="text-5xl font-bold text-gray-900 tabular-nums leading-none">{bpm}</span>
        <span className="text-sm text-gray-400 ml-1.5">BPM</span>
      </div>

      {/* Slider */}
      <input
        type="range" min={MIN_BPM} max={MAX_BPM} value={bpm}
        onChange={e => setBpm(Number(e.target.value))}
        className="w-full accent-gray-900 cursor-pointer"
      />

      {/* ±1 / ±5 buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {[[-5,'−5'], [-1,'−1'], [1,'+1'], [5,'+5']].map(([d, label]) => (
          <button key={label} onClick={() => setBpm(bpm + d)}
            className="py-1.5 text-sm font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
            {label}
          </button>
        ))}
      </div>

      {/* Time signature */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {TIME_SIGS.map(ts => (
          <button key={ts}
            onClick={() => { setTimeSig(ts); if (isPlaying) stop() }}
            className={`flex-1 py-1 text-sm font-medium rounded-md transition-colors cursor-pointer
              ${timeSig === ts ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {ts}/4
          </button>
        ))}
      </div>

      {/* Start / Stop */}
      <button
        onClick={isPlaying ? stop : start}
        className={`w-full py-3 rounded-lg text-sm font-semibold cursor-pointer transition-colors
          ${isPlaying ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
        {isPlaying ? '⏹ Stop' : '▶ Start'}
      </button>

      {/* Tap tempo */}
      <button onClick={tap}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
        Tap Tempo
      </button>

    </div>
  )
}
