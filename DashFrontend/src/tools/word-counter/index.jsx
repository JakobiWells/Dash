import { useState } from 'react'

export default function WordCounter() {
  const [text, setText] = useState('')

  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const chars = text.length
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length

  return (
    <div className="h-full flex flex-col gap-3">
      <textarea
        className="flex-1 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        placeholder="Paste or type text here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-4 text-sm">
        <Stat label="Words" value={words} />
        <Stat label="Chars" value={chars} />
        <Stat label="Sentences" value={sentences} />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-gray-800">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
