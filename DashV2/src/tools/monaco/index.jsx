import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'swift', 'kotlin', 'ruby', 'php', 'html', 'css',
  'json', 'yaml', 'markdown', 'sql', 'shell', 'r', 'matlab',
]

const DEFAULTS = {
  javascript: '// JavaScript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("world"));\n',
  python: '# Python\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("world"))\n',
  cpp: '// C++\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n',
}

export default function MonacoTool({ instanceId }) {
  const key = `monaco-${instanceId}`

  const [lang, setLang] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key))?.lang || 'javascript' } catch { return 'javascript' }
  })
  const [code, setCode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return saved?.code ?? DEFAULTS['javascript']
    } catch { return DEFAULTS['javascript'] }
  })
  const [copied, setCopied] = useState(false)

  function persist(newLang, newCode) {
    try { localStorage.setItem(key, JSON.stringify({ lang: newLang, code: newCode })) } catch {}
  }

  function changeLang(newLang) {
    const newCode = DEFAULTS[newLang] ?? `// ${newLang}\n`
    setLang(newLang)
    setCode(newCode)
    persist(newLang, newCode)
  }

  const handleChange = useCallback((val) => {
    const v = val ?? ''
    setCode(v)
    persist(lang, v)
  }, [lang])

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={lang}
          onChange={e => changeLang(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2a28] border border-gray-200 dark:border-[#3a3a38] text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
        >
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button
          onClick={copy}
          className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331] transition-colors cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-100 dark:border-[#2e2e2c]">
        <Editor
          height="100%"
          language={lang}
          value={code}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            padding: { top: 8, bottom: 8 },
            overviewRulerBorder: false,
            renderLineHighlight: 'none',
            folding: false,
          }}
        />
      </div>
    </div>
  )
}
