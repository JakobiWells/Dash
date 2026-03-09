import { useState } from 'react'

const SHARPS = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B']
const FLATS  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B']
const FLAT_ROOTS = new Set([1, 3, 5, 6, 8, 10])
const ROOT_LABELS = ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B']

const CHORDS = [
  // Triads
  { name: 'Major',     sym: '',      ivs: [0,4,7],         hue: 38  },
  { name: 'Minor',     sym: 'm',     ivs: [0,3,7],         hue: 220 },
  { name: 'Dim',       sym: '°',     ivs: [0,3,6],         hue: 0   },
  { name: 'Aug',       sym: '+',     ivs: [0,4,8],         hue: 300 },
  { name: 'Sus2',      sym: 'sus2',  ivs: [0,2,7],         hue: 160 },
  { name: 'Sus4',      sym: 'sus4',  ivs: [0,5,7],         hue: 175 },
  { name: 'Power',     sym: '5',     ivs: [0,7],           hue: 0, gray: true },
  // 7ths
  { name: 'Dom 7',     sym: '7',     ivs: [0,4,7,10],      hue: 24  },
  { name: 'Maj 7',     sym: 'maj7',  ivs: [0,4,7,11],      hue: 50  },
  { name: 'Min 7',     sym: 'm7',    ivs: [0,3,7,10],      hue: 240 },
  { name: 'Min maj7',  sym: 'mM7',   ivs: [0,3,7,11],      hue: 270 },
  { name: 'Half-dim',  sym: 'ø7',   ivs: [0,3,6,10],      hue: 15  },
  { name: 'Dim 7',     sym: '°7',    ivs: [0,3,6,9],       hue: 350 },
  { name: 'Aug maj7',  sym: '+maj7', ivs: [0,4,8,11],      hue: 315 },
  // 6ths & extensions
  { name: '6th',       sym: '6',     ivs: [0,4,7,9],       hue: 45  },
  { name: 'Min 6',     sym: 'm6',    ivs: [0,3,7,9],       hue: 200 },
  { name: 'Add 9',     sym: 'add9',  ivs: [0,2,4,7],       hue: 80  },
  { name: 'Dom 9',     sym: '9',     ivs: [0,4,7,10,2],    hue: 30  },
  { name: 'Maj 9',     sym: 'maj9',  ivs: [0,4,7,11,2],    hue: 60  },
  { name: 'Min 9',     sym: 'm9',    ivs: [0,3,7,10,2],    hue: 230 },
]

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

function Piano({ root, chordSet, hue }) {
  const wPct = 100 / 7
  return (
    <div className="relative w-full" style={{ height: 68 }}>
      {WHITE.map((semi, wi) => {
        const pitch = semi % 12
        const isRoot = pitch === root
        const inChord = chordSet.has(pitch)
        return (
          <div key={`w-${wi}`}
            className="absolute top-0 bottom-0 border border-gray-200 rounded-b-sm"
            style={{
              left: `${wi * wPct}%`,
              width: `${wPct}%`,
              background: isRoot ? `hsl(${hue},72%,40%)` : inChord ? `hsl(${hue},62%,76%)` : 'white',
            }} />
        )
      })}
      {BLACK.map(({ semi, pos }) => {
        const pitch = semi % 12
        const isRoot = pitch === root
        const inChord = chordSet.has(pitch)
        return (
          <div key={`b-${semi}`}
            className="absolute top-0 rounded-b-sm z-10"
            style={{
              left: `${pos * wPct}%`,
              width: `${wPct * 0.62}%`,
              height: '60%',
              background: isRoot ? `hsl(${hue},65%,26%)` : inChord ? `hsl(${hue},52%,48%)` : '#d1d5db',
              border: '1px solid #9ca3af',
            }} />
        )
      })}
    </div>
  )
}

export default function ChordExplorer() {
  const [root, setRoot] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const chord    = CHORDS[selectedIdx]
  const hue      = chord.gray ? 0 : chord.hue
  const chordSet = new Set(chord.ivs.map(i => (root + i) % 12))
  const noteNames = chord.ivs.map(i => noteName((root + i) % 12, root))

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Root selector + chord name */}
      <div className="flex items-center gap-2">
        <select value={root} onChange={e => setRoot(Number(e.target.value))}
          className="flex-none px-2 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-gray-50 focus:outline-none cursor-pointer">
          {ROOT_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
        </select>
        <span className="text-sm font-semibold text-gray-700">
          {noteName(root, root)}{chord.sym}
        </span>
      </div>

      {/* Piano */}
      <Piano root={root} chordSet={chordSet} hue={hue} />

      {/* Note names */}
      <div className="flex gap-1.5 flex-wrap">
        {noteNames.map((name, i) => (
          <span key={i} className="px-2.5 py-0.5 rounded text-xs font-semibold"
            style={i === 0
              ? { background: chord.gray ? '#374151' : `hsl(${hue},72%,40%)`, color: 'white' }
              : { background: chord.gray ? '#f3f4f6' : `hsl(${hue},55%,92%)`, color: chord.gray ? '#374151' : `hsl(${hue},50%,28%)` }}>
            {name}
          </span>
        ))}
      </div>

      {/* Chord grid */}
      <div className="grid grid-cols-4 gap-1.5 mt-auto">
        {CHORDS.map((c, i) => {
          const active = selectedIdx === i
          const h = c.gray ? 0 : c.hue
          return (
            <button key={i}
              onClick={() => setSelectedIdx(i)}
              className="flex flex-col items-center py-1.5 px-1 rounded-lg border text-xs cursor-pointer transition-all"
              style={active ? {
                background: c.gray ? '#1f2937' : `hsl(${h},65%,50%)`,
                borderColor: c.gray ? '#111' : `hsl(${h},65%,40%)`,
                color: 'white',
                boxShadow: c.gray ? '0 0 0 2px #9ca3af' : `0 0 0 2px hsl(${h},65%,75%)`,
              } : {
                background: c.gray ? '#f9fafb' : `hsl(${h},55%,95%)`,
                borderColor: c.gray ? '#e5e7eb' : `hsl(${h},40%,84%)`,
                color: c.gray ? '#374151' : `hsl(${h},45%,32%)`,
              }}>
              <span className="font-semibold leading-tight">{c.sym || 'maj'}</span>
              <span className="text-[9px] opacity-70 leading-tight mt-0.5">{c.name}</span>
            </button>
          )
        })}
      </div>

    </div>
  )
}
