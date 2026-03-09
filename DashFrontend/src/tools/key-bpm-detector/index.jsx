import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Signal Processing ────────────────────────────────────────────────────────

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
const NOTE_NAMES    = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

// Circle of fifths order → evenly spaced hues
const FIFTH_ORDER = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
function keyColor(pc, mode, alpha = 1) {
  const pos = FIFTH_ORDER.indexOf(pc)
  const hue = Math.round((pos / 12) * 360)
  return mode === 'major'
    ? `hsla(${hue},72%,55%,${alpha})`
    : `hsla(${hue},50%,38%,${alpha})`
}

function pearson(a, b) {
  const n = a.length
  const ma = a.reduce((s, x) => s + x, 0) / n
  const mb = b.reduce((s, x) => s + x, 0) / n
  let num = 0, da = 0, db = 0
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da  += (a[i] - ma) ** 2
    db  += (b[i] - mb) ** 2
  }
  return da && db ? num / Math.sqrt(da * db) : 0
}

// Goertzel chromagram for a slice of samples.
// Step is capped at 10 so effective sample rate stays ≥ 4410 Hz (Nyquist ~2200 Hz),
// covering the full chromagram range C2–C7 without aliasing high-frequency content
// into wrong pitch classes — which is what caused major/minor confusion.
function computeChroma(samples, sr, startIdx, endIdx) {
  const chroma = new Float32Array(12)
  const len  = endIdx - startIdx
  // Cap step at 10 to prevent aliasing. Without this cap, long windows get
  // step≈40+ which folds E5→F♯, G♯5→G, etc. into wrong pitch classes.
  const step = Math.min(10, Math.max(1, Math.floor(len / 8192)))
  const aN   = Math.floor(len / step)
  const nyq  = sr / (2 * step) // highest detectable frequency

  for (let midi = 24; midi < 96; midi++) {
    const freq = 440 * 2 ** ((midi - 69) / 12)
    if (freq >= nyq) continue // skip notes that would alias
    const pc   = midi % 12
    const k    = (freq * aN * step) / sr
    const w    = (2 * Math.PI * k) / aN
    const cosW = Math.cos(w)
    let s1 = 0, s2 = 0
    for (let i = startIdx; i < endIdx; i += step) {
      const s0 = samples[i] + 2 * cosW * s1 - s2
      s2 = s1; s1 = s0
    }
    chroma[pc] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - 2 * cosW * s1 * s2))
  }
  return Array.from(chroma)
}

// Returns all 24 key correlation scores
function allKeyScores(chroma) {
  const scores = []
  for (let k = 0; k < 12; k++) {
    const rot = [...chroma.slice(k), ...chroma.slice(0, k)]
    scores.push({ pc: k, mode: 'major', score: pearson(MAJOR_PROFILE, rot) })
    scores.push({ pc: k, mode: 'minor', score: pearson(MINOR_PROFILE, rot) })
  }
  return scores
}

function detectKey(chroma) {
  const scores = allKeyScores(chroma)
  const best   = scores.reduce((a, b) => b.score > a.score ? b : a)
  return { pc: best.pc, note: NOTE_NAMES[best.pc], mode: best.mode, score: best.score }
}

// Detect key for a segment, but only declare a different key if it scores
// substantially better than the global key at this segment.
// This prevents relative-major/minor confusion and noisy short windows.
const CHANGE_THRESHOLD  = 0.15  // Pearson delta needed to report a key change
const MIN_CHANGE_SECS   = 20    // Minimum duration (s) for a key change to be shown

function detectSegmentKey(chroma, globalPc, globalMode) {
  const scores     = allKeyScores(chroma)
  const best       = scores.reduce((a, b) => b.score > a.score ? b : a)
  const globalScore = scores.find(s => s.pc === globalPc && s.mode === globalMode)?.score ?? -1

  if (best.pc === globalPc && best.mode === globalMode) {
    return { pc: best.pc, note: NOTE_NAMES[best.pc], mode: best.mode, score: best.score }
  }
  if (best.score - globalScore > CHANGE_THRESHOLD) {
    return { pc: best.pc, note: NOTE_NAMES[best.pc], mode: best.mode, score: best.score }
  }
  // Not convincingly different — stay on the global key
  return { pc: globalPc, note: NOTE_NAMES[globalPc], mode: globalMode, score: globalScore }
}

function detectBPM(samples, sr) {
  const factor     = Math.max(1, Math.floor(sr / 11025))
  const effSr      = sr / factor
  const maxSamples = Math.min(samples.length, sr * 90)
  const ds = []
  for (let i = 0; i < maxSamples; i += factor) ds.push(samples[i])

  const fSz    = Math.floor(effSr * 0.04)  // ~40 ms frame
  const hop    = Math.floor(fSz / 2)       // ~20 ms hop
  const onsets = []
  let prev = 0
  for (let i = 0; i < ds.length - fSz; i += hop) {
    let e = 0
    for (let j = 0; j < fSz; j++) e += ds[i + j] ** 2
    e /= fSz
    onsets.push(Math.max(0, e - prev))
    prev = e
  }

  const hopSec = hop / effSr
  // Extend lower bound to 40 BPM so slow classical pieces aren't forced to double
  const minLag = Math.max(1, Math.floor(60 / (200 * hopSec)))
  const maxLag = Math.ceil(60 / (40 * hopSec))

  // Precompute raw autocorrelation for all candidate lags
  const acorr = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0
    const n = onsets.length - lag
    for (let i = 0; i < n; i++) s += onsets[i] * onsets[i + lag]
    acorr[lag] = s
  }

  // Score each lag with a sub-harmonic bonus + gentle tempo prior.
  // Problem: fast arpeggio/triplet patterns (e.g. 188 BPM) dominate raw
  // autocorrelation over the true beat (e.g. 63 BPM). The fix: give each
  // candidate lag credit for energy at its subdivisions — a 63 BPM beat
  // "claims" the strong 188 BPM triplet signal via the ÷3 sub-harmonic,
  // making the beat score higher than the subdivision score.
  let bestLag = minLag, bestScore = -Infinity
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = acorr[lag]
    for (const [div, w] of [[2, 0.55], [3, 0.50], [4, 0.35]]) {
      const sub = Math.round(lag / div)
      if (sub >= minLag && sub <= maxLag) score += acorr[sub] * w
    }
    // Gentle log-tempo prior: mild preference for 70–120 BPM, discourages extremes
    const bpmHere = 60 / (lag * hopSec)
    score *= Math.exp(-0.25 * Math.abs(Math.log2(bpmHere / 100)))
    if (score > bestScore) { bestScore = score; bestLag = lag }
  }

  return Math.round(Math.min(200, Math.max(40, 60 / (bestLag * hopSec))))
}

function buildWaveform(samples, pts = 1400) {
  const blockSize = Math.floor(samples.length / pts)
  const out = []
  for (let i = 0; i < pts; i++) {
    let mn = Infinity, mx = -Infinity
    for (let j = 0; j < blockSize; j++) {
      const v = samples[i * blockSize + j] || 0
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    out.push({ min: mn === Infinity ? 0 : mn, max: mx === -Infinity ? 0 : mx })
  }
  return out
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const yld = () => new Promise(r => setTimeout(r, 0))

const ACCEPT = 'audio/*,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,.mkv'

// ─── Component ────────────────────────────────────────────────────────────────

export default function KeyBpmDetector() {
  const [file,       setFile]       = useState(null)
  const [analyzing,  setAnalyzing]  = useState(false)
  const [step,       setStep]       = useState('')
  const [progress,   setProgress]   = useState(0)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [dragging,   setDragging]   = useState(false)
  const [isPlaying,  setIsPlaying]  = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // DOM / audio refs
  const inputRef      = useRef(null)
  const canvasRef     = useRef(null)
  const audioCtxRef   = useRef(null)
  const bufferRef     = useRef(null)   // AudioBuffer
  const sourceRef     = useRef(null)   // AudioBufferSourceNode
  const rafRef        = useRef(null)

  // Playback tracking refs (no re-render needed)
  const startTimeRef  = useRef(0)  // audioCtx.currentTime when play started
  const offsetRef     = useRef(0)  // audio offset at play start
  const durationRef   = useRef(0)
  const resultRef     = useRef(null)
  const ctRef         = useRef(0)  // current time mirror

  useEffect(() => { resultRef.current = result;  if (result) durationRef.current = result.duration }, [result])
  useEffect(() => { ctRef.current = currentTime }, [currentTime])

  // ─── Canvas draw ───────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const res    = resultRef.current
    if (!canvas || !res) return
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (!W || !H) return
    if (canvas.width !== W)  canvas.width  = W
    if (canvas.height !== H) canvas.height = H

    const c   = canvas.getContext('2d')
    const { waveform, segments, duration } = res
    const t   = ctRef.current

    // Background
    c.fillStyle = '#080808'
    c.fillRect(0, 0, W, H)

    // Colored segment backgrounds
    for (const seg of segments) {
      const x1 = Math.floor((seg.start / duration) * W)
      const x2 = Math.ceil((seg.end   / duration) * W)
      c.fillStyle = keyColor(seg.pc, seg.mode, 0.18)
      c.fillRect(x1, 0, x2 - x1, H)
    }

    // Waveform bars, colored by segment
    const cy = H / 2
    for (let i = 0; i < waveform.length; i++) {
      const x   = Math.round((i / waveform.length) * W)
      const pct = i / waveform.length
      const seg = segments.find(s => pct >= s.start / duration && pct < s.end / duration)
               || segments[segments.length - 1]
      c.strokeStyle = seg ? keyColor(seg.pc, seg.mode, 0.88) : 'rgba(120,120,120,0.7)'
      c.lineWidth   = 1
      const yMin = cy + waveform[i].min * cy * 0.9
      const yMax = cy + waveform[i].max * cy * 0.9
      c.beginPath()
      c.moveTo(x + 0.5, yMin)
      c.lineTo(x + 0.5, yMax)
      c.stroke()
    }

    // Segment boundary dividers
    for (const seg of segments) {
      const x = Math.round((seg.start / duration) * W)
      if (x <= 0) continue
      c.strokeStyle = 'rgba(255,255,255,0.08)'
      c.lineWidth   = 1
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke()
    }

    // Playhead
    const px = Math.round((t / duration) * W)
    c.strokeStyle = 'rgba(255,255,255,0.9)'
    c.lineWidth   = 1.5
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px, H); c.stroke()
    // Triangle
    c.fillStyle = 'rgba(255,255,255,0.9)'
    c.beginPath(); c.moveTo(px - 4, 0); c.lineTo(px + 4, 0); c.lineTo(px, 7); c.fill()
  }, [])

  // Re-draw when result or currentTime changes
  useEffect(() => { draw() }, [result, currentTime, draw])

  // ResizeObserver so waveform redraws on card resize
  useEffect(() => {
    if (!canvasRef.current?.parentElement) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvasRef.current.parentElement)
    return () => ro.disconnect()
  }, [draw])

  // ─── Playback ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const elapsed = ctx.currentTime - startTimeRef.current
    const t = Math.min(offsetRef.current + elapsed, durationRef.current)
    setCurrentTime(t)
    ctRef.current = t
    draw()
    if (t < durationRef.current - 0.05) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setIsPlaying(false)
      setCurrentTime(0); ctRef.current = 0
      offsetRef.current = 0
      draw()
    }
  }, [draw])

  const stopPlayback = useCallback(() => {
    try { sourceRef.current?.stop() } catch { /* already stopped */ }
    sourceRef.current = null
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    setIsPlaying(false)
  }, [])

  const startPlayback = useCallback((offset = 0) => {
    stopPlayback()
    if (!bufferRef.current) return
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
      audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const src = ctx.createBufferSource()
    src.buffer = bufferRef.current
    src.connect(ctx.destination)
    src.start(0, offset)
    src.onended = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null } }
    sourceRef.current    = src
    startTimeRef.current = ctx.currentTime
    offsetRef.current    = offset
    setIsPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [stopPlayback, tick])

  const togglePlay = () => isPlaying ? stopPlayback() : startPlayback(currentTime)

  const handleSeek = useCallback((e) => {
    if (!result || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const t = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * result.duration, result.duration))
    setCurrentTime(t); ctRef.current = t
    offsetRef.current = t
    if (isPlaying) startPlayback(t)
    else draw()
  }, [result, isPlaying, startPlayback, draw])

  // ─── File Analysis ────────────────────────────────────────────────────────
  const processFile = useCallback(async (f) => {
    if (!f) return
    stopPlayback()
    setFile(f); setResult(null); resultRef.current = null
    setError(null); setCurrentTime(0); ctRef.current = 0; offsetRef.current = 0
    setAnalyzing(true); setProgress(0)

    try {
      const arrayBuf = await f.arrayBuffer()
      setStep('Decoding audio…')

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
        audioCtxRef.current = new AudioContext()

      const audioBuf = await audioCtxRef.current.decodeAudioData(arrayBuf.slice(0))
      bufferRef.current   = audioBuf
      durationRef.current = audioBuf.duration

      const samples  = audioBuf.getChannelData(0)
      const sr       = audioBuf.sampleRate
      const duration = audioBuf.duration

      setStep('Building waveform…'); await yld()
      const waveform = buildWaveform(samples)
      setProgress(0.15)

      // ── Step 1: global key from the opening 30 seconds ──────────────────
      // Using the opening rather than the full track because tonal pieces state
      // their home key immediately and most clearly at the start. 30 seconds
      // captures the full first theme cycle — for C♯ minor, the phrase structure
      // is C♯m×2 → F♯m×1 → G♯×1 → C♯m×2, so C♯ genuinely dominates the window.
      // A full-track average would dilute this due to equal subdominant use.
      setStep('Detecting global key…'); await yld()
      const keyClipEnd  = Math.min(Math.floor(sr * 30), samples.length)
      const globalChroma = computeChroma(samples, sr, 0, keyClipEnd)
      const overallKey   = detectKey(globalChroma)
      setProgress(0.30)

      // ── Step 2: per-segment keys, anchored to global key ────────────────
      setStep('Detecting key changes…'); await yld()
      const segLen = duration < 60 ? 4 : duration < 300 ? 8 : 16
      const numSeg = Math.ceil(duration / segLen)
      const rawSegs = []

      for (let i = 0; i < numSeg; i++) {
        const s0 = Math.floor((i * segLen / duration) * samples.length)
        const s1 = Math.min(Math.floor(((i + 1) * segLen / duration) * samples.length), samples.length)
        if (s1 - s0 < 1000) continue
        const chroma = computeChroma(samples, sr, s0, s1)
        rawSegs.push({
          start: i * segLen,
          end:   Math.min((i + 1) * segLen, duration),
          ...detectSegmentKey(chroma, overallKey.pc, overallKey.mode),
        })
        setProgress(0.30 + 0.55 * ((i + 1) / numSeg))
        if (i % 3 === 0) await yld()
      }

      // ── Step 3: merge same-key segments ─────────────────────────────────
      let merged = []
      for (const seg of rawSegs) {
        const last = merged[merged.length - 1]
        if (last && last.pc === seg.pc && last.mode === seg.mode) last.end = seg.end
        else merged.push({ ...seg })
      }

      // ── Step 4: drop key changes shorter than MIN_CHANGE_SECS ───────────
      // Re-absorb short non-global segments back into the global key, then re-merge
      merged = merged.map(seg =>
        (seg.pc !== overallKey.pc || seg.mode !== overallKey.mode) && (seg.end - seg.start) < MIN_CHANGE_SECS
          ? { ...seg, pc: overallKey.pc, mode: overallKey.mode, note: overallKey.note }
          : seg
      )
      const segments = []
      for (const seg of merged) {
        const last = segments[segments.length - 1]
        if (last && last.pc === seg.pc && last.mode === seg.mode) last.end = seg.end
        else segments.push({ ...seg })
      }

      setStep('Detecting BPM…'); await yld()
      const bpm = detectBPM(samples, sr)

      setProgress(1); await yld()
      setResult({ waveform, segments, bpm, duration, overallKey })
    } catch (err) {
      console.error(err)
      setError('Could not decode — try MP3, WAV, OGG, FLAC, M4A, or MP4.')
    } finally {
      setAnalyzing(false)
    }
  }, [stopPlayback])

  const onDrop = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files?.[0]) }

  // Cleanup
  useEffect(() => () => { stopPlayback(); audioCtxRef.current?.close() }, [stopPlayback])

  // Unique keys for legend
  const legendKeys = result
    ? [...new Map(result.segments.map(s => [`${s.pc}-${s.mode}`, s])).values()]
    : []

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-2.5 min-h-0">

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => { if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() } }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors shrink-0
          ${dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <span className="text-xl shrink-0">🎵</span>
        <div className="flex-1 min-w-0">
          {file ? (
            <>
              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1048576).toFixed(1)} MB</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">Drop audio/video or click to browse</p>
              <p className="text-xs text-gray-300">MP3 · WAV · OGG · FLAC · M4A · MP4</p>
            </>
          )}
        </div>
        {file && (
          <button
            onClick={(e) => { e.stopPropagation(); stopPlayback(); setFile(null); setResult(null); setError(null); setCurrentTime(0) }}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors cursor-pointer shrink-0 px-1"
          >✕</button>
        )}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
          onChange={(e) => processFile(e.target.files?.[0])} />
      </div>

      {/* Analysis progress */}
      {analyzing && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Spinner />{step}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div className="bg-gray-800 h-1 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-400 text-center shrink-0">{error}</p>}

      {/* Results */}
      {result && !analyzing && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">

          {/* Key + BPM summary */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="flex flex-col items-center gap-0.5 rounded-lg py-2.5 border border-gray-100"
              style={{ background: keyColor(result.overallKey.pc, result.overallKey.mode, 0.12) }}>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Key</span>
              <span className="text-xl font-bold text-gray-900">{result.overallKey.note}</span>
              <span className="text-xs text-gray-500">{result.overallKey.mode}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 bg-gray-50 rounded-lg py-2.5 border border-gray-100">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">BPM</span>
              <span className="text-xl font-bold text-gray-900">{result.bpm}</span>
              <span className="text-xs text-gray-400">beats/min</span>
            </div>
          </div>

          {/* Waveform canvas */}
          <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-[#080808]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer" onClick={handleSeek} />
            {/* Time labels */}
            <div className="absolute bottom-1.5 left-2 right-2 flex justify-between pointer-events-none">
              <span className="text-[9px] text-white/35">0:00</span>
              <span className="text-[9px] text-white/35">{fmt(result.duration / 2)}</span>
              <span className="text-[9px] text-white/35">{fmt(result.duration)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {isPlaying
                ? <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><rect x="0" y="0" width="3" height="11" rx="0.8"/><rect x="6" y="0" width="3" height="11" rx="0.8"/></svg>
                : <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><polygon points="1,0 9,5.5 1,11"/></svg>
              }
            </button>
            <span className="text-xs font-mono text-gray-400 shrink-0 tabular-nums">
              {fmt(currentTime)} / {fmt(result.duration)}
            </span>
            {/* Seek bar */}
            <div className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const t = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * result.duration, result.duration))
                setCurrentTime(t); ctRef.current = t; offsetRef.current = t
                if (isPlaying) startPlayback(t); else draw()
              }}
            >
              <div className="h-1 bg-gray-800 rounded-full pointer-events-none"
                style={{ width: `${(currentTime / result.duration) * 100}%` }} />
            </div>
          </div>

          {/* Key legend */}
          {legendKeys.length > 1 && (
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 shrink-0">
              {legendKeys.map((seg) => (
                <div key={`${seg.pc}-${seg.mode}`} className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: keyColor(seg.pc, seg.mode, 1) }} />
                  {seg.note} {seg.mode}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tap tempo — shown when no result loaded */}
      {!result && !analyzing && (
        <div className="mt-auto shrink-0">
          <TapTempo />
        </div>
      )}

    </div>
  )
}

// ─── Tap Tempo ────────────────────────────────────────────────────────────────

function TapTempo() {
  const [taps, setTaps] = useState([])
  const [bpm,  setBpm]  = useState(null)

  const tap = () => {
    const now = Date.now()
    setTaps(prev => {
      const next = [...prev, now].filter(t => now - t < 4000)
      if (next.length >= 2) {
        const intervals = []
        for (let i = 1; i < next.length; i++) intervals.push(next[i] - next[i - 1])
        setBpm(Math.round(60000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)))
      } else {
        setBpm(null)
      }
      return next
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={tap}
        className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer active:scale-95">
        Tap Tempo
      </button>
      <span className="text-sm font-bold text-gray-700 w-16 text-center">{bpm ? `${bpm} BPM` : '— BPM'}</span>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  )
}
