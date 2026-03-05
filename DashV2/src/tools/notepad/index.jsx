import { useState, useCallback } from 'react'

const STORAGE_KEY = 'notepad-content'

export default function Notepad() {
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setText(val)
    localStorage.setItem(STORAGE_KEY, val)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Start typing…"
        spellCheck
        className="flex-1 w-full resize-none bg-transparent text-sm text-gray-700 placeholder-gray-300 focus:outline-none leading-relaxed"
      />
      {text.length > 0 && (
        <p className="text-right text-[10px] text-gray-300 pt-1 shrink-0">
          {text.length} chars · {text.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      )}
    </div>
  )
}
