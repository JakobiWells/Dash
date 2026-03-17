// PipelineArrow — downward arrow separating pipeline stages
// status: 'idle' | 'processing' | 'done' | 'error'
export default function PipelineArrow({ status = 'idle', label }) {
  const color =
    status === 'processing' ? '#3b82f6' :
    status === 'done'       ? '#22c55e' :
    status === 'error'      ? '#ef4444' :
    '#d1d5db'

  const labelCls =
    status === 'processing' ? 'text-blue-500' :
    status === 'done'       ? 'text-green-500' :
    status === 'error'      ? 'text-red-400' :
    'text-gray-400 dark:text-gray-600'

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        className={status === 'processing' ? 'animate-pulse' : ''}
      >
        <line x1="8" y1="1" x2="8" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 7.5L8 12L12 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <p className={`text-[10px] ${labelCls}`}>{label}</p>}
    </div>
  )
}
