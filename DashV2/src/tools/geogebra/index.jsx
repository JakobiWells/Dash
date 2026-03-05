import { useState } from 'react'

const APPS = [
  { id: 'graphing',  label: 'Graphing',  url: 'https://www.geogebra.org/graphing?embed' },
  { id: 'geometry',  label: 'Geometry',  url: 'https://www.geogebra.org/geometry?embed' },
  { id: 'cas',       label: 'CAS',       url: 'https://www.geogebra.org/cas?embed' },
  { id: '3d',        label: '3D',        url: 'https://www.geogebra.org/3d?embed' },
  { id: 'scientific',label: 'Scientific',url: 'https://www.geogebra.org/scientific?embed' },
]

export default function GeoGebra() {
  const [active, setActive] = useState('graphing')
  const app = APPS.find(a => a.id === active)

  return (
    <div className="h-full flex flex-col gap-2">
      {/* App switcher */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {APPS.map(a => (
          <button
            key={a.id}
            onClick={() => setActive(a.id)}
            className={`px-2.5 py-0.5 rounded-full text-xs transition-colors cursor-pointer ${
              active === a.id
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331]'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Embed */}
      <div className="flex-1 rounded-xl overflow-hidden min-h-0">
        <iframe
          key={active}
          src={app.url}
          className="w-full h-full border-0"
          allowFullScreen
          title={`GeoGebra ${app.label}`}
        />
      </div>
    </div>
  )
}
