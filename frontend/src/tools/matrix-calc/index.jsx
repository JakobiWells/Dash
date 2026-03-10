import { useState, useCallback, useRef, useEffect } from 'react'

// ─── Matrix math ──────────────────────────────────────────────────────────────

function zeros(r, c) { return Array.from({ length: r }, () => Array(c).fill(0)) }
function identity(n) { return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0)) }
function clone(M) { return M.map(r => [...r]) }

// Clean up floating point noise
function clean(n) {
  if (!isFinite(n) || isNaN(n)) return n
  const r = Math.round(n * 1e9) / 1e9
  return r === 0 ? 0 : r
}

function fmt(n) {
  const c = clean(n)
  if (!isFinite(c) || isNaN(c)) return '?'
  if (c === 0) return '0'
  const s = c.toFixed(4).replace(/\.?0+$/, '')
  return s === '-0' ? '0' : s
}

function matAdd(A, B) { return A.map((r, i) => r.map((v, j) => v + B[i][j])) }
function matSub(A, B) { return A.map((r, i) => r.map((v, j) => v - B[i][j])) }
function matMul(A, B) {
  const m = A.length, n = B[0].length, p = B.length
  return Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)))
}
function matScale(A, s) { return A.map(r => r.map(v => v * s)) }
function matTranspose(A) { return A[0].map((_, j) => A.map(r => r[j])) }
function matTrace(A) { return A.reduce((s, r, i) => s + r[i], 0) }

function matDet(A) {
  const n = A.length
  if (n === 1) return A[0][0]
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0]
  let d = 0
  for (let j = 0; j < n; j++) {
    const minor = A.slice(1).map(r => [...r.slice(0, j), ...r.slice(j + 1)])
    d += (j % 2 === 0 ? 1 : -1) * A[0][j] * matDet(minor)
  }
  return d
}

// Returns { matrix, steps, pivotCols }
function matRREF(A, trackSteps = true) {
  const m = A.length, n = A[0].length
  const M = A.map(r => r.map(v => clean(v)))
  const steps = []
  let pivotRow = 0

  for (let col = 0; col < n && pivotRow < m; col++) {
    let maxRow = pivotRow
    for (let r = pivotRow + 1; r < m; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[maxRow][col])) maxRow = r
    }
    if (Math.abs(M[maxRow][col]) < 1e-10) continue

    if (maxRow !== pivotRow) {
      ;[M[pivotRow], M[maxRow]] = [M[maxRow], M[pivotRow]]
      if (trackSteps) steps.push({ desc: `R${pivotRow + 1} ↔ R${maxRow + 1}`, matrix: M.map(r => r.map(clean)) })
    }

    const piv = M[pivotRow][col]
    if (Math.abs(piv - 1) > 1e-10) {
      for (let j = 0; j < n; j++) M[pivotRow][j] /= piv
      const fd = fmt(piv)
      if (trackSteps) steps.push({ desc: `R${pivotRow + 1} ÷ ${fd}`, matrix: M.map(r => r.map(clean)) })
    }

    for (let r = 0; r < m; r++) {
      if (r === pivotRow) continue
      const factor = M[r][col]
      if (Math.abs(factor) < 1e-10) continue
      for (let j = 0; j < n; j++) M[r][j] -= factor * M[pivotRow][j]
      const fd = fmt(factor)
      if (trackSteps) steps.push({ desc: `R${r + 1} − (${fd})·R${pivotRow + 1}`, matrix: M.map(r => r.map(clean)) })
    }
    pivotRow++
  }

  const result = M.map(r => r.map(clean))
  const rank = result.filter(r => r.some(v => Math.abs(v) > 1e-10)).length
  return { matrix: result, steps, rank }
}

function matInverse(A) {
  const n = A.length
  const aug = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)])
  const { matrix: rref } = matRREF(aug, false)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (Math.abs(rref[i][j] - (i === j ? 1 : 0)) > 1e-6) return null
  return rref.map(r => r.slice(n).map(clean))
}

function matEigen2x2(A) {
  const tr = A[0][0] + A[1][1]
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
  const disc = tr * tr - 4 * det
  if (disc < -1e-10) {
    const re = clean(tr / 2), im = clean(Math.sqrt(-disc) / 2)
    return [{ value: `${fmt(re)} + ${fmt(im)}i`, real: false }, { value: `${fmt(re)} − ${fmt(im)}i`, real: false }]
  }
  const l1 = clean((tr + Math.sqrt(Math.max(0, disc))) / 2)
  const l2 = clean((tr - Math.sqrt(Math.max(0, disc))) / 2)
  const ev = (l) => {
    const B = [[A[0][0] - l, A[0][1]], [A[1][0], A[1][1] - l]]
    if (Math.abs(B[0][0]) > 1e-10 || Math.abs(B[0][1]) > 1e-10) {
      const [a, b] = Math.abs(B[0][0]) > 1e-10 ? B[0] : B[1]
      const mag = Math.sqrt(a * a + b * b)
      return `[${fmt(-b / mag)}, ${fmt(a / mag)}]`
    }
    return '[1, 0]'
  }
  return [{ value: fmt(l1), vec: ev(l1), real: true }, { value: fmt(l2), vec: ev(l2), real: true }]
}

// Characteristic poly for 3x3: λ³ - tr·λ² + p·λ - det = 0
// p = sum of 2x2 principal minors
function matEigen3x3(A) {
  const tr = A[0][0] + A[1][1] + A[2][2]
  const det = matDet(A)
  const p = (A[0][0]*A[1][1] - A[0][1]*A[1][0]) +
            (A[0][0]*A[2][2] - A[0][2]*A[2][0]) +
            (A[1][1]*A[2][2] - A[1][2]*A[2][1])

  // Find roots of t^3 - tr*t^2 + p*t - det = 0 via companion matrix / numerical
  const poly = (t) => t*t*t - tr*t*t + p*t - det
  const dpoly = (t) => 3*t*t - 2*tr*t + p

  // Find real roots via Newton's from several starting points
  const roots = []
  const tried = new Set()
  const starts = [-100, -10, -3, -1, 0, 1, 3, 10, 100]
  for (const s0 of starts) {
    let t = s0
    for (let i = 0; i < 100; i++) {
      const d = dpoly(t)
      if (Math.abs(d) < 1e-12) break
      t -= poly(t) / d
    }
    const tc = Math.round(t * 1e6) / 1e6
    if (Math.abs(poly(tc)) < 1e-4 && !tried.has(tc)) {
      tried.add(tc)
      roots.push(clean(t))
    }
  }

  if (roots.length === 0) return null
  const unique = [...new Set(roots.map(r => Math.round(r * 1e4) / 1e4))]
    .map(r => roots.find(x => Math.abs(x - r) < 1e-3))
  return unique.map(l => ({ value: fmt(l), real: true }))
}

function solveAxb(A, b) {
  const aug = A.map((r, i) => [...r, b[i]])
  const { matrix: rref, rank } = matRREF(aug, false)
  const n = A[0].length
  // Check inconsistency
  for (const r of rref) {
    if (r.slice(0, n).every(v => Math.abs(v) < 1e-10) && Math.abs(r[n]) > 1e-10)
      return { type: 'inconsistent' }
  }
  if (rank < n) return { type: 'infinite' }
  return { type: 'unique', x: rref.slice(0, n).map(r => clean(r[n])) }
}

// ─── Container resize hook ────────────────────────────────────────────────────

function useSize(ref) {
  const [size, setSize] = useState({ w: 500, h: 600 })
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return size
}

// ─── Matrix input grid ────────────────────────────────────────────────────────

function MatrixGrid({ label, data, onChange, rows, cols, highlight, cellSize }) {
  const handleKey = (e, r, c) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      const next = e.shiftKey
        ? (c === 0 ? (r > 0 ? [r - 1, cols - 1] : null) : [r, c - 1])
        : (c === cols - 1 ? (r < rows - 1 ? [r + 1, 0] : null) : [r, c + 1])
      if (next) document.getElementById(`cell-${label}-${next[0]}-${next[1]}`)?.focus()
    }
  }
  return (
    <div>
      <div
        className="inline-grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}
      >
        {data.map((row, r) =>
          row.map((val, c) => (
            <input
              key={`${r}-${c}`}
              id={`cell-${label}-${r}-${c}`}
              value={val}
              onChange={e => onChange(r, c, e.target.value)}
              onKeyDown={e => handleKey(e, r, c)}
              className={`text-center font-mono text-xs rounded border outline-none transition-colors
                focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                ${highlight ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-white'}
              `}
              style={{ width: cellSize, height: cellSize, fontSize: cellSize > 36 ? 13 : 11 }}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Result matrix display ────────────────────────────────────────────────────

function MatrixDisplay({ M, label, colorMap }) {
  if (!M || M.length === 0) return null
  const maxW = Math.max(...M.flat().map(v => fmt(v).length))
  const cellW = Math.max(36, Math.min(60, maxW * 9 + 10))
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-gray-400 font-mono mr-1">{label}</span>}
      {/* bracket */}
      <div className="flex items-center">
        <svg width="10" height={M.length * 28 + 4} viewBox={`0 0 10 ${M.length * 28 + 4}`}>
          <path d={`M8,2 L2,2 L2,${M.length * 28 + 2} L8,${M.length * 28 + 2}`} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        </svg>
        <div className="flex flex-col gap-0.5 py-0.5">
          {M.map((row, r) => (
            <div key={r} className="flex gap-0.5">
              {row.map((val, c) => {
                const v = fmt(val)
                const color = colorMap?.[r]?.[c]
                return (
                  <div
                    key={c}
                    className={`text-center font-mono text-xs px-1 rounded ${color || 'text-gray-700'}`}
                    style={{ minWidth: cellW, height: 24, lineHeight: '24px' }}
                  >
                    {v}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <svg width="10" height={M.length * 28 + 4} viewBox={`0 0 10 ${M.length * 28 + 4}`}>
          <path d={`M2,2 L8,2 L8,${M.length * 28 + 2} L2,${M.length * 28 + 2}`} fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}

// ─── Op button ────────────────────────────────────────────────────────────────

function OpBtn({ label, sub, onClick, active, disabled, wide }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center rounded-lg border transition-all text-xs font-medium select-none
        ${wide ? 'px-3 py-1.5' : 'p-1.5'}
        ${active
          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
          : disabled
            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'}
      `}
      style={{ minWidth: wide ? 'auto' : 44, minHeight: 36 }}
    >
      <span>{label}</span>
      {sub && <span className="text-gray-400 text-[9px] leading-none mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.7)' : undefined }}>{sub}</span>}
    </button>
  )
}

// ─── Steps panel ─────────────────────────────────────────────────────────────

function StepsPanel({ steps }) {
  const [open, setOpen] = useState(false)
  if (!steps || steps.length === 0) return null
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
      >
        <span className={`transition-transform duration-150 text-gray-400 ${open ? 'rotate-90' : ''}`}>▶</span>
        Show {steps.length} row operation{steps.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-2 space-y-3 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-500 whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded">{s.desc}</span>
              <MatrixDisplay M={s.matrix} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function makeEmpty(r, c) {
  return Array.from({ length: r }, () => Array(c).fill(''))
}

function parseMatrix(data) {
  return data.map(row => row.map(v => {
    const n = parseFloat(v)
    return isNaN(n) ? 0 : n
  }))
}

function strMatrix(M) {
  return M.map(r => r.map(v => String(v)))
}

const PRESETS = {
  zero: (r, c) => makeEmpty(r, c),
  identity: (n) => strMatrix(identity(n)),
  random: (r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => String(Math.floor(Math.random() * 9) - 4))),
}

// ─── Matrix panel (label + row/col inputs + presets + grid) ──────────────────

function DimInput({ label, rows, cols, onRows, onCols, isSquare, onClear, onIdentity, onRandom, matLabel, data, onChange, cellSize }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-row gap-3 items-start">
      {/* Left: controls */}
      <div className="flex flex-col gap-2 shrink-0" style={{ minWidth: 68 }}>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 w-6">rows</span>
            <input
              type="number" min="1" max="8" value={rows}
              onChange={e => { const v = Math.max(1, Math.min(8, parseInt(e.target.value) || 1)); onRows(v) }}
              className="w-10 px-1.5 py-1 text-xs font-mono text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 w-6">cols</span>
            <input
              type="number" min="1" max="8" value={cols}
              onChange={e => { const v = Math.max(1, Math.min(8, parseInt(e.target.value) || 1)); onCols(v) }}
              className="w-10 px-1.5 py-1 text-xs font-mono text-center rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <button onClick={onClear} className="text-left text-xs text-gray-400 hover:text-gray-600 transition-colors">clear</button>
          <button onClick={onIdentity} disabled={!isSquare}
            className={`text-left text-xs transition-colors ${isSquare ? 'text-gray-400 hover:text-gray-600' : 'text-gray-200 cursor-default'}`}>
            identity
          </button>
          <button onClick={onRandom} className="text-left text-xs text-gray-400 hover:text-gray-600 transition-colors">random</button>
        </div>
      </div>
      {/* Right: grid */}
      <div className="overflow-x-auto">
        <MatrixGrid label={matLabel} data={data} onChange={onChange} rows={rows} cols={cols} highlight={false} cellSize={cellSize} />
      </div>
    </div>
  )
}

export default function MatrixCalc() {
  const rootRef = useRef(null)
  const { w: cw, h: ch } = useSize(rootRef)

  const [aRows, setARows] = useState(3)
  const [aCols, setACols] = useState(3)
  const [bRows, setBRows] = useState(3)
  const [bCols, setBCols] = useState(3)
  const [aData, setAData] = useState(makeEmpty(3, 3))
  const [bData, setBData] = useState(makeEmpty(3, 3))

  const [result, setResult] = useState(null) // { type, data, steps?, eigenvalues?, scalar? }
  const [activeOp, setActiveOp] = useState(null)

  const cellSize = cw > 600 ? 42 : 36

  // Resize matrix data when dimensions change
  const resizeA = (r, c) => {
    setARows(r); setACols(c)
    setAData(prev => Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => prev[i]?.[j] ?? '')))
    setResult(null)
  }
  const resizeB = (r, c) => {
    setBRows(r); setBCols(c)
    setBData(prev => Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => prev[i]?.[j] ?? '')))
    setResult(null)
  }

  const setACell = useCallback((r, c, v) => {
    setAData(prev => prev.map((row, i) => row.map((val, j) => i === r && j === c ? v : val)))
    setResult(null)
  }, [])
  const setBCell = useCallback((r, c, v) => {
    setBData(prev => prev.map((row, i) => row.map((val, j) => i === r && j === c ? v : val)))
    setResult(null)
  }, [])

  const A = parseMatrix(aData)
  const B = parseMatrix(bData)
  const isSquareA = aRows === aCols
  const canMul = aCols === bRows
  const sameDim = aRows === bRows && aCols === bCols
  const canSolve = isSquareA && aRows === bRows && bCols === 1

  function run(op) {
    setActiveOp(op)
    try {
      if (op === 'add') {
        if (!sameDim) return err('A and B must have the same dimensions')
        setResult({ type: 'matrix', label: 'A + B', data: matAdd(A, B) })
      } else if (op === 'sub') {
        if (!sameDim) return err('A and B must have the same dimensions')
        setResult({ type: 'matrix', label: 'A − B', data: matSub(A, B) })
      } else if (op === 'mul') {
        if (!canMul) return err(`A is ${aRows}×${aCols}, B is ${bRows}×${bCols} — inner dimensions must match`)
        setResult({ type: 'matrix', label: 'A × B', data: matMul(A, B) })
      } else if (op === 'AT') {
        setResult({ type: 'matrix', label: 'Aᵀ', data: matTranspose(A) })
      } else if (op === 'det') {
        if (!isSquareA) return err('Determinant requires a square matrix')
        setResult({ type: 'scalar', label: 'det(A)', value: clean(matDet(A)) })
      } else if (op === 'tr') {
        if (!isSquareA) return err('Trace requires a square matrix')
        setResult({ type: 'scalar', label: 'tr(A)', value: clean(matTrace(A)) })
      } else if (op === 'rank') {
        const { rank } = matRREF(A, false)
        setResult({ type: 'scalar', label: 'rank(A)', value: rank })
      } else if (op === 'inv') {
        if (!isSquareA) return err('Inverse requires a square matrix')
        const inv = matInverse(A)
        if (!inv) return err('Matrix is singular (det = 0), no inverse exists')
        setResult({ type: 'matrix', label: 'A⁻¹', data: inv })
      } else if (op === 'rref') {
        const { matrix, steps } = matRREF(A)
        setResult({ type: 'rref', label: 'RREF(A)', data: matrix, steps })
      } else if (op === 'eigen') {
        if (!isSquareA) return err('Eigenvalues require a square matrix')
        if (aRows === 2) {
          const eigs = matEigen2x2(A)
          setResult({ type: 'eigen', label: 'Eigenvalues of A', eigenvalues: eigs })
        } else if (aRows === 3) {
          const eigs = matEigen3x3(A)
          if (!eigs) return err('Could not find eigenvalues numerically')
          setResult({ type: 'eigen', label: 'Eigenvalues of A', eigenvalues: eigs })
        } else {
          return err('Eigenvalues supported for 2×2 and 3×3 matrices')
        }
      } else if (op === 'solve') {
        if (!isSquareA) return err('A must be square to solve Ax = b')
        if (aRows !== bRows) return err(`A is ${aRows}×${aCols}, b must have ${aRows} rows`)
        const b = B.map(r => r[0])
        const sol = solveAxb(A, b)
        setResult({ type: 'solve', ...sol })
      } else if (op === 'AxA') {
        if (!isSquareA) return err('A must be square for A²')
        setResult({ type: 'matrix', label: 'A²', data: matMul(A, A) })
      }
    } catch (e) {
      setResult({ type: 'error', message: e.message })
    }
  }

  function err(msg) { setResult({ type: 'error', message: msg }) }

  function copyResult() {
    if (!result) return
    let text = ''
    if (result.type === 'matrix' || result.type === 'rref') {
      text = result.data.map(r => r.map(fmt).join('\t')).join('\n')
    } else if (result.type === 'scalar') {
      text = String(result.value)
    } else if (result.type === 'solve' && result.type === 'unique') {
      text = result.x.map(fmt).join('\n')
    }
    if (text) navigator.clipboard.writeText(text).catch(() => {})
  }

  function loadPreset(which, target) {
    if (target === 'A') {
      setAData(which === 'identity' ? PRESETS.identity(aRows) : PRESETS.random(aRows, aCols))
    } else {
      setBData(which === 'identity' ? PRESETS.identity(bRows) : PRESETS.random(bRows, bCols))
    }
    setResult(null)
  }

  return (
    <div ref={rootRef} className="h-full flex flex-col gap-3 p-3 overflow-y-auto bg-gray-50 select-none">

      {/* Matrices — always side by side if space allows */}
      <div className={`flex gap-3 ${cw >= 480 ? 'flex-row items-start' : 'flex-col'}`}>
        <DimInput
          label="Matrix A" rows={aRows} cols={aCols}
          onRows={r => resizeA(r, aCols)} onCols={c => resizeA(aRows, c)}
          isSquare={isSquareA}
          onClear={() => { setAData(makeEmpty(aRows, aCols)); setResult(null) }}
          onIdentity={() => loadPreset('identity', 'A')}
          onRandom={() => loadPreset('random', 'A')}
          matLabel="A" data={aData} onChange={setACell} cellSize={cellSize}
        />
        <DimInput
          label="Matrix B" rows={bRows} cols={bCols}
          onRows={r => resizeB(r, bCols)} onCols={c => resizeB(bRows, c)}
          isSquare={bRows === bCols}
          onClear={() => { setBData(makeEmpty(bRows, bCols)); setResult(null) }}
          onIdentity={() => loadPreset('identity', 'B')}
          onRandom={() => loadPreset('random', 'B')}
          matLabel="B" data={bData} onChange={setBCell} cellSize={cellSize}
        />
      </div>

      {/* Operations */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Operations</span>

        <div className="flex flex-col gap-2">
          {/* Binary */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-14 shrink-0">A and B</span>
            <OpBtn label="A + B" onClick={() => run('add')} active={activeOp === 'add'} disabled={!sameDim} />
            <OpBtn label="A − B" onClick={() => run('sub')} active={activeOp === 'sub'} disabled={!sameDim} />
            <OpBtn label="A × B" onClick={() => run('mul')} active={activeOp === 'mul'} disabled={!canMul} />
            <OpBtn label="Ax = b" sub="B=column" onClick={() => run('solve')} active={activeOp === 'solve'} disabled={!canSolve} />
          </div>

          {/* Unary */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 w-14 shrink-0">A only</span>
            <OpBtn label="Aᵀ" sub="transpose" onClick={() => run('AT')} active={activeOp === 'AT'} />
            <OpBtn label="A⁻¹" sub="inverse" onClick={() => run('inv')} active={activeOp === 'inv'} disabled={!isSquareA} />
            <OpBtn label="RREF" sub="steps" onClick={() => run('rref')} active={activeOp === 'rref'} />
            <OpBtn label="det" sub="determinant" onClick={() => run('det')} active={activeOp === 'det'} disabled={!isSquareA} />
            <OpBtn label="tr" sub="trace" onClick={() => run('tr')} active={activeOp === 'tr'} disabled={!isSquareA} />
            <OpBtn label="rank" onClick={() => run('rank')} active={activeOp === 'rank'} />
            <OpBtn label="A²" onClick={() => run('AxA')} active={activeOp === 'AxA'} disabled={!isSquareA} />
            <OpBtn label="λ" sub="eigenvalues" onClick={() => run('eigen')} active={activeOp === 'eigen'} disabled={!isSquareA || aRows > 3} />
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {result.label || 'Result'}
            </span>
            {(result.type === 'matrix' || result.type === 'rref') && (
              <button onClick={copyResult} className="text-xs text-blue-500 hover:text-blue-600 transition-colors">Copy TSV</button>
            )}
          </div>

          {result.type === 'error' && (
            <p className="text-sm text-red-500">{result.message}</p>
          )}

          {(result.type === 'matrix' || result.type === 'rref') && (
            <>
              <div className="overflow-x-auto">
                <MatrixDisplay M={result.data} />
              </div>
              {result.type === 'rref' && <StepsPanel steps={result.steps} />}
            </>
          )}

          {result.type === 'scalar' && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-gray-400">{result.label} =</span>
              <span className="text-2xl font-semibold font-mono text-gray-800">{fmt(result.value)}</span>
            </div>
          )}

          {result.type === 'eigen' && (
            <div className="flex flex-col gap-2">
              {result.eigenvalues.map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 font-mono text-sm">
                  <span className="text-gray-400 text-xs">λ{i + 1}</span>
                  <span className="text-gray-800 font-semibold">{e.value}</span>
                  {e.vec && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-xs text-gray-500">v = {e.vec}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.type === 'solve' && result.type === 'inconsistent' && (
            <p className="text-sm text-red-500">System is inconsistent — no solution exists</p>
          )}
          {result.type === 'infinite' && (
            <p className="text-sm text-amber-600">Infinitely many solutions (underdetermined system)</p>
          )}
          {result.type === 'unique' && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 mb-1">Unique solution x:</p>
              {result.x.map((v, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-gray-400 text-xs w-8">x{i + 1} =</span>
                  <span className="text-gray-800 font-semibold">{fmt(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
