import { useState } from 'react'

const SHARPS = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']
const FLATS  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B']
const FLAT_ROOTS = new Set([1, 3, 5, 6, 8, 10])
const ROOT_LABELS = ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B']

const SCALES = {
  'Major':          [0,2,4,5,7,9,11],
  'Natural Minor':  [0,2,3,5,7,8,10],
  'Harmonic Minor': [0,2,3,5,7,8,11],
  'Melodic Minor':  [0,2,3,5,7,9,11],
  'Dorian':         [0,2,3,5,7,9,10],
  'Phrygian':       [0,1,3,5,7,8,10],
  'Lydian':         [0,2,4,6,7,9,11],
  'Mixolydian':     [0,2,4,5,7,9,10],
  'Locrian':        [0,1,3,5,6,8,10],
  'Pentatonic Maj': [0,2,4,7,9],
  'Pentatonic Min': [0,3,5,7,10],
  'Blues':          [0,3,5,6,7,10],
}

const DEGREES = {
  'Major':          ['1','2','3','4','5','6','7'],
  'Natural Minor':  ['1','2','♭3','4','5','♭6','♭7'],
  'Harmonic Minor': ['1','2','♭3','4','5','♭6','7'],
  'Melodic Minor':  ['1','2','♭3','4','5','6','7'],
  'Dorian':         ['1','2','♭3','4','5','6','♭7'],
  'Phrygian':       ['1','♭2','♭3','4','5','♭6','♭7'],
  'Lydian':         ['1','2','3','♯4','5','6','7'],
  'Mixolydian':     ['1','2','3','4','5','6','♭7'],
  'Locrian':        ['1','♭2','♭3','4','♭5','♭6','♭7'],
  'Pentatonic Maj': ['1','2','3','5','6'],
  'Pentatonic Min': ['1','♭3','4','5','♭7'],
  'Blues':          ['1','♭3','4','♭5','5','♭7'],
}

const WHITE = [0, 2, 4, 5, 7, 9, 11]
const BLACK = [
  { semi: 1,  pos: 0.67 },
  { semi: 3,  pos: 1.67 },
  { semi: 6,  pos: 3.67 },
  { semi: 8,  pos: 4.67 },
  { semi: 10, pos: 5.67 },
]

function noteName(s, root) {
  return FLAT_ROOTS.has(root) ? FLATS[s] : SHARPS[s]
}

function Piano({ root, scaleSet, hue }) {
  const wPct = 100 / 7
  return (
    <div className="relative w-full" style={{ height: 68 }}>
      {WHITE.map((semi, wi) => {
        const pitch = semi % 12
        const isRoot = pitch === root
        const inScale = scaleSet.has(pitch)
        return (
          <div key={`w-${wi}`}
            className="absolute top-0 bottom-0 border border-gray-200 rounded-b-sm"
            style={{
              left: `${wi * wPct}%`,
              width: `${wPct}%`,
              background: isRoot ? `hsl(${hue},70%,42%)` : inScale ? `hsl(${hue},60%,78%)` : 'white',
            }} />
        )
      })}
      {BLACK.map(({ semi, pos }) => {
        const pitch = semi % 12
        const isRoot = pitch === root
        const inScale = scaleSet.has(pitch)
        return (
          <div key={`b-${semi}`}
            className="absolute top-0 rounded-b-sm z-10"
            style={{
              left: `${pos * wPct}%`,
              width: `${wPct * 0.62}%`,
              height: '60%',
              background: isRoot ? `hsl(${hue},65%,28%)` : inScale ? `hsl(${hue},50%,52%)` : '#d1d5db',
              border: '1px solid #9ca3af',
            }} />
        )
      })}
    </div>
  )
}

export default function ScaleExplorer() {
  const [root, setRoot] = useState(0)
  const [scaleName, setScaleName] = useState('Major')

  const intervals = SCALES[scaleName]
  const degrees   = DEGREES[scaleName]
  const scaleSet  = new Set(intervals.map(i => (root + i) % 12))
  const names     = intervals.map(i => noteName((root + i) % 12, root))
  const hue       = root * 30

  return (
    <div className="h-full flex flex-col gap-3">

      <div className="flex gap-2">
        <select value={root} onChange={e => setRoot(Number(e.target.value))}
          className="flex-none px-2 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-gray-50 focus:outline-none cursor-pointer">
          {ROOT_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
        </select>
        <select value={scaleName} onChange={e => setScaleName(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none cursor-pointer">
          {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Piano root={root} scaleSet={scaleSet} hue={hue} />

      <div className="flex flex-wrap gap-1.5">
        {names.map((name, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-400">{degrees[i]}</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold"
              style={i === 0
                ? { background: `hsl(${hue},70%,42%)`, color: 'white' }
                : { background: `hsl(${hue},55%,92%)`, color: `hsl(${hue},50%,28%)` }}>
              {name}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
