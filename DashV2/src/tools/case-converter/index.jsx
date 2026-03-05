import { useState } from 'react'

export default function CaseConverter() {
  const [text, setText] = useState('')

  const toUpper = () => setText(text.toUpperCase())
  const toLower = () => setText(text.toLowerCase())

  const toTitle = () =>
    setText(
      text
        .toLowerCase()
        .split(' ')
        .map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(' ')
    )

  const toSentence = () =>
    setText(
      text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
    )

  return (
    <div className="h-full flex flex-col gap-3">
      <textarea
        className="flex-1 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        placeholder="Paste or type text here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={toUpper} className="tool-btn">UPPERCASE</button>
        <button onClick={toLower} className="tool-btn">lowercase</button>
        <button onClick={toTitle} className="tool-btn">Title Case</button>
        <button onClick={toSentence} className="tool-btn">Sentence case</button>
      </div>
    </div>
  )
}