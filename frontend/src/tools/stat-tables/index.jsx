import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

// ─── Math ─────────────────────────────────────────────────────────────────────

function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const v = 1 - p * Math.exp(-x * x)
  return x >= 0 ? v : -v
}

function normCDF(z) { return 0.5 * (1 + erf(z / Math.SQRT2)) }

function normInv(p) {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
    0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
    0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
  const y = p - 0.5
  if (Math.abs(y) < 0.42) {
    const r = y * y
    return y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) / ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1)
  }
  const r = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p))
  let x = c[0] + r * (c[1] + r * (c[2] + r * (c[3] + r * (c[4] + r * (c[5] + r * (c[6] + r * (c[7] + r * c[8])))))))
  return p < 0.5 ? -x : x
}

function logGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x, tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) ser += c[j] / ++y
  return -tmp + Math.log(2.5066282746310005 * ser / x)
}

function gammainc(a, x) {
  if (x <= 0) return 0
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum
    for (let i = 0; i < 200; i++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-12) break }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
  }
  let b = x + 1 - a, c = 1e30, d = 1 / b, h = d
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a); b += 2
    d = an * d + b; if (Math.abs(d) < 1e-30) d = 1e-30
    c = b + an / c; if (Math.abs(c) < 1e-30) c = 1e-30
    d = 1 / d; const del = d * c; h *= del
    if (Math.abs(del - 1) < 1e-12) break
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}

function betainc(x, a, b) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta)
  function cf(x, a, b) {
    let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < 1e-30) d = 1e-30
    d = 1 / d; let h = d
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m
      let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2))
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d; h *= d * c
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1))
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d; const del = d * c; h *= del
      if (Math.abs(del - 1) < 1e-12) break
    }
    return h
  }
  if (x < (a + 1) / (a + b + 2)) return front * cf(x, a, b) / a
  return 1 - (1 - x < (b + 1) / (a + b + 2) ? (1 - front * cf(1 - x, b, a) / b) : front * cf(1 - x, b, a) / b)
}

function tCDF(t, df) {
  const x = df / (df + t * t)
  const ib = betainc(x, df / 2, 0.5)
  return t >= 0 ? 1 - ib / 2 : ib / 2
}
function chiCDF(x, df) { return x <= 0 ? 0 : gammainc(df / 2, x / 2) }
function fCDF(x, d1, d2) { return x <= 0 ? 0 : betainc(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2) }

function bisectInv(cdf, p, lo, hi) {
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    if (cdf(mid) < p) lo = mid; else hi = mid
    if (hi - lo < 1e-9) break
  }
  return (lo + hi) / 2
}
function tInv(p, df) { return bisectInv(t => tCDF(t, df), p, -100, 100) }
function chiInv(p, df) { return bisectInv(x => chiCDF(x, df), p, 0, df * 10 + 100) }
function fInv(p, d1, d2) { return bisectInv(x => fCDF(x, d1, d2), p, 0, 1000) }

// ─── PDFs ─────────────────────────────────────────────────────────────────────

function normalPDF(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI) }
function tPDF(x, df) {
  const log = logGamma((df + 1) / 2) - 0.5 * Math.log(df * Math.PI) - logGamma(df / 2)
  return Math.exp(log) * Math.pow(1 + x * x / df, -(df + 1) / 2)
}
function chi2PDF(x, df) {
  if (x <= 0) return 0
  const log = (df / 2 - 1) * Math.log(x) - x / 2 - (df / 2) * Math.log(2) - logGamma(df / 2)
  return isFinite(log) ? Math.exp(log) : 0
}
function fPDF(x, d1, d2) {
  if (x <= 0) return 0
  const log = logGamma((d1 + d2) / 2) - logGamma(d1 / 2) - logGamma(d2 / 2) +
    (d1 / 2) * Math.log(d1 / d2) + (d1 / 2 - 1) * Math.log(x) -
    ((d1 + d2) / 2) * Math.log(1 + d1 * x / d2)
  return isFinite(log) ? Math.exp(log) : 0
}

// ─── Copy SVG as PNG ──────────────────────────────────────────────────────────

async function copySvgAsPng(svgEl, title, pLabel, pValStr) {
  const VW = 600, VH = 220, PAD = 24
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = VW * scale
  canvas.height = VH * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.roundRect(0, 0, VW, VH, 12)
  ctx.fill()

  // Title
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.fillText(title, PAD, PAD + 4)

  // p-value label top right
  if (pValStr) {
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, monospace'
    ctx.fillStyle = '#3b82f6'
    ctx.textAlign = 'right'
    ctx.fillText(`${pLabel} = ${pValStr}`, VW - PAD, PAD + 4)
    ctx.textAlign = 'left'
  }

  // Render SVG into canvas
  const svgClone = svgEl.cloneNode(true)
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svgClone.setAttribute('width', VW - PAD * 2)
  svgClone.setAttribute('height', VH - PAD * 2 - 20)
  // Remove white bg rect if present (we drew our own)
  const bgRect = svgClone.querySelector('#chart-bg')
  if (bgRect) bgRect.remove()

  const svgData = new XMLSerializer().serializeToString(svgClone)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, PAD, PAD + 18, VW - PAD * 2, VH - PAD * 2 - 20)
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = reject
    img.src = url
  })

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

// ─── Container size hook ──────────────────────────────────────────────────────

function useContainerSize(ref) {
  const [size, setSize] = useState({ w: 400, h: 500 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return size
}

// ─── Distribution chart ───────────────────────────────────────────────────────

function DistChart({ svgRef, pdfFn, xMin, xMax, statVal, critVal, tail, symmetric, chartH }) {
  const W = 480, H = 160, PX = 14, PY = 12

  const pts = useMemo(() => {
    const arr = [], N = 300
    for (let i = 0; i <= N; i++) {
      const x = xMin + (xMax - xMin) * i / N
      const y = pdfFn(x)
      arr.push([x, isNaN(y) || !isFinite(y) ? 0 : y])
    }
    return arr
  }, [pdfFn, xMin, xMax])

  const maxY = useMemo(() => Math.max(...pts.map(p => p[1])), [pts])
  if (maxY === 0) return null

  const sx = x => PX + (x - xMin) / (xMax - xMin) * (W - 2 * PX)
  const sy = y => H - PY - (y / (maxY * 1.1)) * (H - 2 * PY)
  const baseY = sy(0)

  const curvePath = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`
  ).join(' ')

  const shadeD = useCallback((x0, x1) => {
    const x0c = Math.max(xMin, x0), x1c = Math.min(xMax, x1)
    if (x0c >= x1c) return ''
    const steps = 120
    const pts2 = []
    for (let i = 0; i <= steps; i++) {
      const x = x0c + (x1c - x0c) * i / steps
      pts2.push(`${sx(x).toFixed(1)},${sy(pdfFn(x)).toFixed(1)}`)
    }
    return `M${sx(x0c).toFixed(1)},${baseY} ${pts2.map(p => 'L' + p).join(' ')} L${sx(x1c).toFixed(1)},${baseY}Z`
  }, [xMin, xMax, pdfFn, sx, sy, baseY])

  const shadeRegions = useMemo(() => {
    if (isNaN(statVal)) return []
    if (tail === 'left') return [shadeD(xMin, statVal)]
    if (tail === 'right') return [shadeD(statVal, xMax)]
    if (tail === 'two') { const a = Math.abs(statVal); return [shadeD(xMin, -a), shadeD(a, xMax)] }
    return []
  }, [statVal, tail, shadeD, xMin, xMax])

  const statX = !isNaN(statVal) ? sx(Math.max(xMin + 0.01, Math.min(xMax - 0.01, statVal))) : null
  const critX = !isNaN(critVal) ? sx(Math.max(xMin + 0.01, Math.min(xMax - 0.01, critVal))) : null
  const critXNeg = (tail === 'two' && !isNaN(critVal))
    ? sx(Math.max(xMin + 0.01, Math.min(xMax - 0.01, -Math.abs(critVal)))) : null

  const xLabels = useMemo(() => {
    if (symmetric) {
      const step = xMax <= 5 ? 1 : xMax <= 15 ? 5 : Math.ceil(xMax / 5)
      const labels = []
      for (let v = 0; v >= xMin; v -= step) labels.push(v)
      for (let v = step; v <= xMax; v += step) labels.push(v)
      return labels
    }
    const step = xMax <= 10 ? 2 : xMax <= 30 ? 5 : xMax <= 100 ? 20 : 50
    const labels = [0]
    for (let v = step; v <= xMax * 0.95; v += step) labels.push(Math.round(v))
    return labels
  }, [xMin, xMax, symmetric])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: chartH }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* White bg for copy */}
      <rect id="chart-bg" x="0" y="0" width={W} height={H} fill="white" />

      {shadeRegions.filter(Boolean).map((d, i) => (
        <path key={i} d={d} fill="#3b82f6" fillOpacity="0.15" />
      ))}
      <path
        d={curvePath + ` L${sx(xMax).toFixed(1)},${baseY} L${sx(xMin).toFixed(1)},${baseY}Z`}
        fill="#3b82f6" fillOpacity="0.05"
      />
      <path d={curvePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      <line x1={PX} y1={baseY} x2={W - PX} y2={baseY} stroke="#e5e7eb" strokeWidth="1" />
      {symmetric && (
        <line x1={sx(0)} y1={PY} x2={sx(0)} y2={baseY} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3" />
      )}
      {critX !== null && (
        <line x1={critX} y1={PY + 4} x2={critX} y2={baseY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
      )}
      {critXNeg !== null && (
        <line x1={critXNeg} y1={PY + 4} x2={critXNeg} y2={baseY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" />
      )}
      {statX !== null && (
        <>
          <line x1={statX} y1={PY} x2={statX} y2={baseY} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,3" />
          <circle cx={statX} cy={PY} r="3.5" fill="#ef4444" />
        </>
      )}
      {xLabels.map(v => (
        <text key={v} x={sx(v)} y={H - 1} textAnchor="middle" fontSize="9" fill="#9ca3af">{v}</text>
      ))}
    </svg>
  )
}

// ─── Reference table ──────────────────────────────────────────────────────────

function RefTable({ headers, rows, tableH }) {
  return (
    <div className="overflow-auto rounded-lg border border-gray-100" style={{ maxHeight: tableH }}>
      <table className="text-xs border-collapse w-full font-mono">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1.5 text-center text-gray-500 bg-gray-50 border-b border-gray-200 whitespace-nowrap sticky top-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-blue-50/40 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-2 py-1 text-center border-b border-gray-50 whitespace-nowrap ${ci === 0 ? 'text-gray-500 font-semibold bg-gray-50/60' : 'text-gray-700'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Shared DistView ──────────────────────────────────────────────────────────

const ALPHA_OPTIONS = ['0.10', '0.05', '0.025', '0.01', '0.005', '0.001']

function ParamInput({ label, value, onChange, placeholder, inputW }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{label} =</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: inputW }}
        className="px-2 py-1 text-xs font-mono rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
      />
    </div>
  )
}

function DistView({
  title, chartProps, tail, setTail, tailOptions, stat, setStat, statLabel,
  pVal, critVal, alpha, setAlpha, params, showTable, setShowTable,
  tableData, tableNote, cw, ch,
}) {
  const svgRef = useRef(null)
  const [copyState, setCopyState] = useState('idle') // idle | copying | done | error

  // Scale chart height with container
  const chartH = Math.max(100, Math.min(320, ch * 0.30))
  const tableH = Math.max(120, Math.min(260, ch * 0.22))
  const inputW = cw > 500 ? 88 : 72
  const statW = cw > 500 ? 120 : 96
  const compact = cw < 420

  const significant = pVal !== null && !isNaN(parseFloat(alpha)) && pVal < parseFloat(alpha)
  const hasCrit = !isNaN(critVal)

  const pValStr = pVal !== null
    ? (pVal < 0.0001 ? pVal.toExponential(3) : pVal.toFixed(4))
    : null

  async function handleCopyImage() {
    if (!svgRef.current) return
    setCopyState('copying')
    try {
      const blob = await copySvgAsPng(svgRef.current, title, statLabel, pValStr)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopyState('done')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  function copyTSV() {
    const lines = [tableData.headers.join('\t'), ...tableData.rows.map(r => r.join('\t'))]
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
  }

  const copyLabel = copyState === 'copying' ? '…' : copyState === 'done' ? 'Copied!' : copyState === 'error' ? 'Failed' : 'Copy image'

  return (
    <div className="flex flex-col gap-2.5 min-h-0">

      {/* Chart card */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
            {/* Legend */}
            <div className="flex gap-2.5 items-center">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" /></svg>
                stat
              </span>
              {hasCrit && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" /></svg>
                  critical
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#3b82f6', opacity: 0.3 }} />
                p-area
              </span>
            </div>
          </div>
          <button
            onClick={handleCopyImage}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            {!compact && copyLabel}
          </button>
        </div>
        <div className="px-2 pb-2">
          <DistChart svgRef={svgRef} {...chartProps} chartH={chartH} />
        </div>
      </div>

      {/* Controls card */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-3 py-2.5 flex flex-col gap-2">

        {/* Tail + params row */}
        <div className="flex flex-wrap gap-2 items-center">
          {tailOptions && (
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {tailOptions.map(t => (
                <button
                  key={t}
                  onClick={() => setTail(t)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${tail === t ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {t === 'left' ? 'Left' : t === 'right' ? 'Right' : 'Two-tail'}
                </button>
              ))}
            </div>
          )}
          {params}
        </div>

        {/* Stat + alpha row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-mono">{statLabel} =</span>
            <input
              value={stat}
              onChange={e => setStat(e.target.value)}
              placeholder="test statistic"
              style={{ width: statW }}
              className="px-2 py-1 text-xs font-mono rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">α =</span>
            <select
              value={alpha}
              onChange={e => setAlpha(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white cursor-pointer"
            >
              {ALPHA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-wrap gap-2">
          {pVal !== null ? (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono ${significant ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              <span>p = {pValStr}</span>
              <span className="opacity-40">|</span>
              <span>{significant ? '✓ significant' : '✗ not significant'}</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-400 font-mono">
              p = —
            </div>
          )}
          {hasCrit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono text-amber-700">
              crit = {tailOptions?.includes('two') && tail === 'two' ? '±' : ''}{Math.abs(critVal).toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* Reference table */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={() => setShowTable(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            <span className={`inline-block transition-transform duration-150 text-gray-400 ${showTable ? 'rotate-90' : ''}`}>▶</span>
            Reference Table
          </button>
          {showTable && (
            <button onClick={copyTSV} className="text-xs text-blue-500 hover:text-blue-600 transition-colors">
              Copy TSV
            </button>
          )}
        </div>
        {showTable && (
          <>
            <p className="text-xs text-gray-400 mb-1.5">{tableNote}</p>
            <RefTable headers={tableData.headers} rows={tableData.rows} tableH={tableH} />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Distribution tabs ────────────────────────────────────────────────────────

function ZDist({ cw, ch }) {
  const [stat, setStat] = useState('')
  const [tail, setTail] = useState('two')
  const [alpha, setAlpha] = useState('0.05')
  const [showTable, setShowTable] = useState(false)
  const sv = parseFloat(stat), av = parseFloat(alpha), hasV = !isNaN(sv)

  const pVal = useMemo(() => {
    if (!hasV) return null
    const left = normCDF(sv)
    if (tail === 'left') return left
    if (tail === 'right') return 1 - left
    return 2 * Math.min(left, 1 - left)
  }, [sv, tail, hasV])

  const critVal = useMemo(() => {
    if (isNaN(av)) return NaN
    if (tail === 'left') return normInv(av)
    if (tail === 'right') return normInv(1 - av)
    return normInv(1 - av / 2)
  }, [av, tail])

  const tableData = useMemo(() => {
    const cols = [0, .01, .02, .03, .04, .05, .06, .07, .08, .09]
    const rows = []
    for (let i = 0; i <= 34; i++) {
      const z0 = (i / 10).toFixed(1)
      rows.push([z0, ...cols.map(c => normCDF(parseFloat(z0) + c).toFixed(4))])
    }
    return { headers: ['z', '.00', '.01', '.02', '.03', '.04', '.05', '.06', '.07', '.08', '.09'], rows }
  }, [])

  return (
    <DistView
      title="Standard Normal (Z)"
      chartProps={{ pdfFn: normalPDF, xMin: -4, xMax: 4, statVal: sv, critVal, tail, symmetric: true }}
      tail={tail} setTail={setTail} tailOptions={['left', 'right', 'two']}
      stat={stat} setStat={setStat} statLabel="z"
      pVal={pVal} critVal={critVal} alpha={alpha} setAlpha={setAlpha}
      showTable={showTable} setShowTable={setShowTable}
      tableData={tableData} tableNote="P(Z ≤ z) — cumulative left-tail probability"
      cw={cw} ch={ch}
    />
  )
}

function TDist({ cw, ch }) {
  const [stat, setStat] = useState('')
  const [df, setDf] = useState('10')
  const [tail, setTail] = useState('two')
  const [alpha, setAlpha] = useState('0.05')
  const [showTable, setShowTable] = useState(false)
  const sv = parseFloat(stat), dfv = Math.max(1, parseFloat(df) || 10), av = parseFloat(alpha)
  const hasV = !isNaN(sv)
  const xRange = Math.max(5, Math.abs(sv) * 1.4 || 5)

  const pVal = useMemo(() => {
    if (!hasV) return null
    const left = tCDF(sv, dfv)
    if (tail === 'left') return left
    if (tail === 'right') return 1 - left
    return 2 * (1 - tCDF(Math.abs(sv), dfv))
  }, [sv, dfv, tail, hasV])

  const critVal = useMemo(() => {
    if (isNaN(av)) return NaN
    if (tail === 'left') return tInv(av, dfv)
    if (tail === 'right') return tInv(1 - av, dfv)
    return tInv(1 - av / 2, dfv)
  }, [av, dfv, tail])

  const tableData = useMemo(() => {
    const alphas = [0.10, 0.05, 0.025, 0.01, 0.005, 0.001]
    const dfs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,30,40,50,60,80,100,120]
    return {
      headers: ['df', ...alphas.map(a => `α=${a}`)],
      rows: dfs.map(d => [d, ...alphas.map(a => tInv(1 - a, d).toFixed(3))]),
    }
  }, [])

  return (
    <DistView
      title="Student's t"
      chartProps={{ pdfFn: x => tPDF(x, dfv), xMin: -xRange, xMax: xRange, statVal: sv, critVal, tail, symmetric: true }}
      tail={tail} setTail={setTail} tailOptions={['left', 'right', 'two']}
      stat={stat} setStat={setStat} statLabel="t"
      pVal={pVal} critVal={critVal} alpha={alpha} setAlpha={setAlpha}
      params={<ParamInput label="df" value={df} onChange={setDf} placeholder="10" inputW={56} />}
      showTable={showTable} setShowTable={setShowTable}
      tableData={tableData} tableNote="One-tail α critical values t*"
      cw={cw} ch={ch}
    />
  )
}

function Chi2Dist({ cw, ch }) {
  const [stat, setStat] = useState('')
  const [df, setDf] = useState('5')
  const [alpha, setAlpha] = useState('0.05')
  const [showTable, setShowTable] = useState(false)
  const sv = parseFloat(stat), dfv = Math.max(1, parseFloat(df) || 5), av = parseFloat(alpha)
  const hasV = !isNaN(sv)
  const xMax = Math.max(dfv * 3 + 10, hasV && sv > 0 ? sv * 1.3 : 0, 10)

  const pVal = useMemo(() => {
    if (!hasV || sv < 0) return null
    return 1 - chiCDF(sv, dfv)
  }, [sv, dfv, hasV])

  const critVal = useMemo(() => isNaN(av) ? NaN : chiInv(1 - av, dfv), [av, dfv])

  const tableData = useMemo(() => {
    const alphas = [0.995, 0.99, 0.975, 0.95, 0.90, 0.10, 0.05, 0.025, 0.01, 0.005]
    const dfs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,30,40,50,60,80,100]
    return {
      headers: ['df', ...alphas.map(a => `p=${a}`)],
      rows: dfs.map(d => [d, ...alphas.map(a => chiInv(a, d).toFixed(3))]),
    }
  }, [])

  return (
    <DistView
      title="Chi-square (χ²)"
      chartProps={{ pdfFn: x => chi2PDF(x, dfv), xMin: 0, xMax, statVal: sv, critVal, tail: 'right', symmetric: false }}
      tail="right"
      stat={stat} setStat={setStat} statLabel="χ²"
      pVal={pVal} critVal={critVal} alpha={alpha} setAlpha={setAlpha}
      params={<ParamInput label="df" value={df} onChange={setDf} placeholder="5" inputW={56} />}
      showTable={showTable} setShowTable={setShowTable}
      tableData={tableData} tableNote="Critical values χ²* for cumulative probability p"
      cw={cw} ch={ch}
    />
  )
}

function FDist({ cw, ch }) {
  const [stat, setStat] = useState('')
  const [df1, setDf1] = useState('3')
  const [df2, setDf2] = useState('20')
  const [alpha, setAlpha] = useState('0.05')
  const [showTable, setShowTable] = useState(false)
  const sv = parseFloat(stat), d1v = Math.max(1, parseFloat(df1) || 3), d2v = Math.max(1, parseFloat(df2) || 20)
  const av = parseFloat(alpha), hasV = !isNaN(sv)
  const xMax = Math.max(d1v / d2v * 8 + 3, hasV && sv > 0 ? sv * 1.4 : 0, 6)

  const pVal = useMemo(() => {
    if (!hasV || sv < 0) return null
    return 1 - fCDF(sv, d1v, d2v)
  }, [sv, d1v, d2v, hasV])

  const critVal = useMemo(() => isNaN(av) ? NaN : fInv(1 - av, d1v, d2v), [av, d1v, d2v])

  const tableData = useMemo(() => {
    const d1s = [1,2,3,4,5,6,7,8,9,10,12,15,20,24,30,40,60,120]
    const d2s = [1,2,3,4,5,6,7,8,9,10,12,15,20,24,30,40,60,120]
    return {
      headers: ['df₂╲df₁', ...d1s],
      rows: d2s.map(d2 => [d2, ...d1s.map(d1 => fInv(0.95, d1, d2).toFixed(3))]),
    }
  }, [])

  return (
    <DistView
      title="F distribution"
      chartProps={{ pdfFn: x => fPDF(x, d1v, d2v), xMin: 0, xMax, statVal: sv, critVal, tail: 'right', symmetric: false }}
      tail="right"
      stat={stat} setStat={setStat} statLabel="F"
      pVal={pVal} critVal={critVal} alpha={alpha} setAlpha={setAlpha}
      params={
        <>
          <ParamInput label="df₁" value={df1} onChange={setDf1} placeholder="3" inputW={50} />
          <ParamInput label="df₂" value={df2} onChange={setDf2} placeholder="20" inputW={50} />
        </>
      }
      showTable={showTable} setShowTable={setShowTable}
      tableData={tableData} tableNote="F critical values α=0.05 — df₁ (columns) × df₂ (rows)"
      cw={cw} ch={ch}
    />
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const DISTS = ['Z', 't', 'χ²', 'F']

export default function StatTables() {
  const [dist, setDist] = useState('Z')
  const rootRef = useRef(null)
  const { w: cw, h: ch } = useContainerSize(rootRef)

  return (
    <div ref={rootRef} className="h-full flex flex-col gap-3 p-3 overflow-y-auto bg-gray-50">
      <div className="flex gap-1.5 shrink-0">
        {DISTS.map(d => (
          <button
            key={d}
            onClick={() => setDist(d)}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              dist === d
                ? 'bg-blue-500 text-white shadow-sm text-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 text-sm'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {dist === 'Z' && <ZDist cw={cw} ch={ch} />}
      {dist === 't' && <TDist cw={cw} ch={ch} />}
      {dist === 'χ²' && <Chi2Dist cw={cw} ch={ch} />}
      {dist === 'F' && <FDist cw={cw} ch={ch} />}
    </div>
  )
}
