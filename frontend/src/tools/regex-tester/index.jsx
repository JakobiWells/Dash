import { useState, useEffect } from 'react'

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')
  const [matches, setMatches] = useState([])

  useEffect(() => {
    if (!pattern) {
      setMatches([])
      return
    }
    try {
      const regex = new RegExp(pattern, flags)
      const allMatches = []
      let match
      while ((match = regex.exec(text)) !== null) {
        allMatches.push([...match])
        if (!flags.includes('g')) break // avoid infinite loop
      }
      setMatches(allMatches)
    } catch (e) {
      setMatches([{ error: e.message }])
    }
  }, [pattern, flags, text])

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Regex & Flags */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Enter regex pattern"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="Flags (e.g., g, i, m)"
          className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
        />
      </div>

      {/* Text input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to test regex"
        className="flex-1 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
      />

      {/* Matches output */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg p-2 bg-gray-50 text-sm text-gray-800">
        {matches.length === 0 ? (
          <div className="text-gray-400">Matches will appear here</div>
        ) : matches[0].error ? (
          <div className="text-red-500">Error: {matches[0].error}</div>
        ) : (
          <ul className="space-y-1">
            {matches.map((m, i) => (
              <li key={i}>
                <strong>Match {i + 1}:</strong> {m[0]}
                {m.length > 1 && (
                  <ul className="ml-4 list-disc">
                    {m.slice(1).map((g, j) => (
                      <li key={j}>Group {j + 1}: {g}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}