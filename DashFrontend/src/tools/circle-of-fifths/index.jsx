import { useState } from 'react'

const CX = 120, CY = 120
const RM_O = 108
const RM_I = 66
const RN_I = 40
const RC_I = 25

const KEYS = [
  { camelot: 8,  major: 'C',   minor: 'Am'  },
  { camelot: 9,  major: 'G',   minor: 'Em'  },
  { camelot: 10, major: 'D',   minor: 'Bm'  },
  { camelot: 11, major: 'A',   minor: 'F♯m' },
  { camelot: 12, major: 'E',   minor: 'C♯m' },
  { camelot: 1,  major: 'B',   minor: 'G♯m' },
  { camelot: 2,  major: 'F♯',  minor: 'D♯m' },
  { camelot: 3,  major: 'D♭',  minor: 'B♭m' },
  { camelot: 4,  major: 'A♭',  minor: 'Fm'  },
  { camelot: 5,  major: 'E♭',  minor: 'Cm'  },
  { camelot: 6,  major: 'B♭',  minor: 'Gm'  },
  { camelot: 7,  major: 'F',   minor: 'Dm'  },
]

const hueFor = pos => pos * 30

function segPath(r1, r2, a1, a2) {
  const rad = d => d * Math.PI / 180
  const [s, e] = [rad(a1), rad(a2)]
  const p = (r, a) => `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`
  return `M${p(r2,s)}A${r2},${r2},0,0,1,${p(r2,e)}L${p(r1,e)}A${r1},${r1},0,0,0,${p(r1,s)}Z`
}

function midXY(r, deg) {
  const a = deg * Math.PI / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
}

function textRot(am) {
  let r = am + 90
  while (r > 180) r -= 360
  while (r < -180) r += 360
  if (r > 90) r -= 180
  if (r < -90) r += 180
  return r
}

export default function CircleOfFifths() {
  const [sel, setSel] = useState(null)

  function toggle(pos, mode) {
    setSel(s => s?.pos === pos && s?.mode === mode ? null : { pos, mode })
  }

  function segState(pos, mode) {
    if (!sel) return 'idle'
    if (sel.pos === pos && sel.mode === mode) return 'selected'
    if (sel.pos === pos) return 'compatible'
    const prev = (sel.pos - 1 + 12) % 12
    const next = (sel.pos + 1) % 12
    if (mode === sel.mode && (pos === prev || pos === next)) return 'compatible'
    return 'dim'
  }

  function segFill(pos, mode, state) {
    const h = hueFor(pos)
    const isMaj = mode === 'major'
    if (state === 'selected')   return `hsl(${h},82%,${isMaj ? 72 : 58}%)`
    if (state === 'compatible') return `hsl(${h},${isMaj ? 68 : 54}%,${isMaj ? 65 : 50}%)`
    if (state === 'dim')        return `hsl(${h},${isMaj ? 25 : 18}%,${isMaj ? 78 : 62}%)`
    return `hsl(${h},${isMaj ? 58 : 42}%,${isMaj ? 60 : 42}%)`
  }

  const sk = sel ? KEYS[sel.pos] : null
  const letter = sel?.mode === 'major' ? 'B' : 'A'
  const h = sel ? hueFor(sel.pos) : 0

  const relKey  = sk ? (sel.mode === 'major' ? `${sk.minor} · ${sk.camelot}A` : `${sk.major} · ${sk.camelot}B`) : null
  const domKey  = sk ? (sel.mode === 'major' ? `${KEYS[(sel.pos+1)%12].major} major` : `${KEYS[(sel.pos+1)%12].minor}`) : null
  const subKey  = sk ? (sel.mode === 'major' ? `${KEYS[(sel.pos-1+12)%12].major} major` : `${KEYS[(sel.pos-1+12)%12].minor}`) : null
  const parKey  = sk ? (sel.mode === 'major' ? sk.minor : sk.major + ' major') : null

  return (
    <div className="h-full select-none relative">
      <svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMin meet" style={{ width: '100%', height: '100%' }}>
        {KEYS.map((k, i) => {
          const a1 = -90 + i * 30
          const a2 = a1 + 30
          const am = a1 + 15
          const rot = textRot(am)
          const kh = hueFor(i)
          const [mx, my] = midXY((RM_O + RM_I) / 2, am)
          const [nx, ny] = midXY((RM_I + RN_I) / 2, am)
          const [cx, cy] = midXY((RN_I + RC_I) / 2, am)

          return (
            <g key={i}>
              <path d={segPath(RM_I, RM_O, a1, a2)}
                fill={segFill(i, 'major', segState(i, 'major'))}
                stroke="white" strokeWidth="1"
                onClick={() => toggle(i, 'major')}
                style={{ cursor: 'pointer', transition: 'fill 0.12s' }} />
              <path d={segPath(RN_I, RM_I, a1, a2)}
                fill={segFill(i, 'minor', segState(i, 'minor'))}
                stroke="white" strokeWidth="1"
                onClick={() => toggle(i, 'minor')}
                style={{ cursor: 'pointer', transition: 'fill 0.12s' }} />
              <path d={segPath(RC_I, RN_I, a1, a2)}
                fill={`hsl(${kh},28%,90%)`}
                stroke="white" strokeWidth="0.5" />
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central"
                fontSize="9.5" fontWeight="700" fill="white" pointerEvents="none"
                transform={`rotate(${rot},${mx},${my})`}>{k.major}</text>
              <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
                fontSize="7" fontWeight="500" fill="white" pointerEvents="none"
                transform={`rotate(${rot},${nx},${ny})`}>{k.minor}</text>
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize="6" fontWeight="700" fill={`hsl(${kh},40%,34%)`} pointerEvents="none"
                transform={`rotate(${rot},${cx},${cy})`}>{k.camelot}</text>
            </g>
          )
        })}

        <circle cx={CX} cy={CY} r={RC_I} fill="white" stroke="#e5e7eb" strokeWidth="1" />
        {sk ? (
          <>
            <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="central"
              fontSize="11" fontWeight="800" fill="#111">
              {sel.mode === 'major' ? sk.major : sk.minor.slice(0, -1)}
            </text>
            <text x={CX} y={CY + 7} textAnchor="middle" dominantBaseline="central"
              fontSize="7" fill="#6b7280">
              {sk.camelot}{letter}
            </text>
          </>
        ) : (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
            fontSize="6" fill="#d1d5db">tap</text>
        )}
      </svg>

      {/* Info overlay — sits at the bottom, only when a key is selected */}
      {sk && (
        <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-gray-100 bg-white/95 px-3 py-2 text-xs shadow-sm" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-gray-800">
              {sel.mode === 'major' ? `${sk.major} major` : `${sk.minor.slice(0, -1)} minor`}
            </span>
            <span className="font-mono font-bold" style={{ color: `hsl(${h},55%,40%)` }}>
              {sk.camelot}{letter}
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-gray-400">
            <span>Relative</span><span className="text-gray-600 font-medium">{relKey}</span>
            <span>Parallel</span><span className="text-gray-600">{parKey}</span>
            <span>Dominant</span><span className="text-gray-600">{domKey}</span>
            <span>Subdominant</span><span className="text-gray-600">{subKey}</span>
          </div>
        </div>
      )}
    </div>
  )
}
