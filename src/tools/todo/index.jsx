import { useState, useRef } from 'react'

function load(key) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : [] } catch { return [] }
}
function persist(key, todos) {
  try { localStorage.setItem(key, JSON.stringify(todos)) } catch {}
}

export default function Todo({ instanceId }) {
  const key = `todo-${instanceId}`
  const [todos, setTodos] = useState(() => load(key))
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const inputRef = useRef(null)

  function save(next) { setTodos(next); persist(key, next) }

  function addTodo() {
    const text = input.trim()
    if (!text) return
    save([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  function toggle(id) {
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function remove(id) { save(todos.filter(t => t.id !== id)) }

  function clearDone() { save(todos.filter(t => !t.done)) }

  // Drag reorder — only operates on the full todos array (available in 'all' view)
  function handleDragStart(e, i) {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    const blank = document.createElement('div')
    e.dataTransfer.setDragImage(blank, 0, 0)
  }
  function handleDragOver(e, i) {
    e.preventDefault()
    if (i !== overIdx) setOverIdx(i)
  }
  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...todos]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    save(next)
    setDragIdx(null); setOverIdx(null)
  }
  function handleDragEnd() { setDragIdx(null); setOverIdx(null) }

  const visible = todos.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })
  const doneCount = todos.filter(t => t.done).length
  const canDrag = filter === 'all'

  return (
    <div className="h-full flex flex-col">

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 mb-2.5">
        {['all', 'active', 'done'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-0.5 rounded-full text-xs capitalize transition-colors cursor-pointer ${
              filter === f
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-[#2a2a28] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333331]'
            }`}
          >
            {f}
          </button>
        ))}
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear {doneCount} done
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
        {visible.length === 0 ? (
          <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-10">
            {filter === 'done' ? 'Nothing completed yet.' : filter === 'active' ? 'All caught up!' : 'No tasks yet — add one below.'}
          </p>
        ) : (
          <div className="flex flex-col">
            {visible.map((todo, i) => (
              <div
                key={todo.id}
                draggable={canDrag}
                onDragStart={canDrag ? e => handleDragStart(e, i) : undefined}
                onDragOver={canDrag ? e => handleDragOver(e, i) : undefined}
                onDrop={canDrag ? e => handleDrop(e, i) : undefined}
                onDragEnd={canDrag ? handleDragEnd : undefined}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-xl group transition-all duration-100 hover:bg-gray-50 dark:hover:bg-[#2a2a28] ${
                  dragIdx === i ? 'opacity-30 scale-[0.98]' : ''
                } ${overIdx === i && dragIdx !== i ? 'translate-y-0.5' : ''}`}
              >
                {/* Drag grip */}
                {canDrag && (
                  <div className="shrink-0 text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                      <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                      <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
                      <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
                    </svg>
                  </div>
                )}

                {/* Checkbox */}
                <button
                  onClick={() => toggle(todo.id)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    todo.done
                      ? 'bg-gray-800 dark:bg-gray-200 border-gray-800 dark:border-gray-200'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
                  }`}
                >
                  {todo.done && (
                    <svg width="7" height="7" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-gray-900"/>
                    </svg>
                  )}
                </button>

                {/* Text */}
                <span className={`flex-1 text-sm leading-snug select-none transition-colors ${
                  todo.done
                    ? 'line-through text-gray-300 dark:text-gray-600'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {todo.text}
                </span>

                {/* Delete */}
                <button
                  onClick={() => remove(todo.id)}
                  className="shrink-0 text-gray-200 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  aria-label="Delete task"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add input */}
      <div
        className="flex items-center gap-2 pt-2.5 border-t border-gray-100 dark:border-[#2e2e2c] mt-1 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-700 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
          className="flex-1 text-sm text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none placeholder-gray-300 dark:placeholder-gray-600"
        />
        {input.trim() && (
          <button
            onClick={addTodo}
            className="w-5 h-5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer shrink-0"
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
