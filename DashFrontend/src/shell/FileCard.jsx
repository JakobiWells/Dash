const TYPE_COLORS = [
  ['image/',      '#4B9CF5'],
  ['video/',      '#8B5CF6'],
  ['audio/',      '#EF4444'],
  ['application/pdf', '#DC2626'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml', '#2563EB'],
  ['application/msword', '#2563EB'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml', '#16A34A'],
  ['application/vnd.ms-excel', '#16A34A'],
  ['text/', '#6B7280'],
]

function getColor(type) {
  for (const [prefix, color] of TYPE_COLORS) {
    if (type.startsWith(prefix)) return color
  }
  return '#64748B'
}

export default function FileCard({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  const ext = file.name.includes('.') ? file.name.split('.').pop().toUpperCase() : 'FILE'
  const color = getColor(file.type)

  return (
    <div className="drag-handle h-full flex flex-col items-center justify-center gap-1.5 group relative cursor-grab active:cursor-grabbing select-none px-2">
      <button
        onClick={onRemove}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900 text-white opacity-0 group-hover:opacity-70 flex items-center justify-center transition-opacity z-10 cursor-pointer"
        aria-label="Remove"
      >
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
          <path d="M1 1l5 5M6 1L1 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {isImage ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border-2 border-white">
          <img
            src={file.objectUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <div
          className="w-12 h-14 rounded-lg shadow-md flex flex-col items-center justify-end pb-2 relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {/* Folded corner */}
          <div className="absolute top-0 right-0 w-0 h-0" style={{
            borderTop: '14px solid #f8f8f6',
            borderLeft: '14px solid transparent',
          }} />
          <span className="text-[9px] font-bold text-white tracking-wider">{ext.slice(0, 4)}</span>
        </div>
      )}

      <p
        className="text-[11px] text-gray-700 text-center w-full leading-tight"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {file.name}
      </p>
    </div>
  )
}
