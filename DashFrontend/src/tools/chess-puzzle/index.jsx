import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

export default function ChessPuzzle() {
  const [fen, setFen] = useState(null)
  const [status, setStatus] = useState('loading') // loading | playing | solved | error
  const [message, setMessage] = useState('')
  const [playerColor, setPlayerColor] = useState('white')
  const [rating, setRating] = useState(null)
  const [themes, setThemes] = useState([])
  const [waiting, setWaiting] = useState(false)

  const gameRef = useRef(null)
  const solutionRef = useRef([])
  const moveIdxRef = useRef(0)

  useEffect(() => { loadPuzzle() }, [])

  async function loadPuzzle() {
    setStatus('loading')
    setMessage('')
    setWaiting(false)
    moveIdxRef.current = 0

    try {
      const res = await fetch('https://lichess.org/api/puzzle/daily')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Replay the game PGN up to initialPly to get the puzzle start position.
      // Lichess returns PGN as bare move tokens (may or may not have move numbers),
      // so we parse manually instead of relying on loadPgn.
      const tokens = data.game.pgn
        .replace(/\{[^}]*\}/g, '')  // strip comments
        .split(/\s+/)
        .filter(t => t && !/^\d+\.+$/.test(t) && !['*', '1-0', '0-1', '1/2-1/2'].includes(t))

      const start = new Chess()
      const plyCount = Math.min(data.puzzle.initialPly, tokens.length)
      for (let i = 0; i < plyCount; i++) {
        try { start.move(tokens[i]) } catch { break }
      }

      gameRef.current = start
      solutionRef.current = data.puzzle.solution // UCI strings e.g. ["e2e4", "d7d5"]
      moveIdxRef.current = 0

      const color = start.turn() === 'w' ? 'white' : 'black'
      setPlayerColor(color)
      setFen(start.fen())
      setRating(data.puzzle.rating)
      setThemes(data.puzzle.themes ?? [])
      setStatus('playing')
      setMessage('Find the best move!')
    } catch {
      setStatus('error')
      setMessage('Failed to load puzzle')
    }
  }

  function onDrop(src, dst) {
    if (status !== 'playing' || waiting) return false
    const game = gameRef.current
    const solution = solutionRef.current
    const idx = moveIdxRef.current

    // Try move on a copy first
    let move
    try {
      const copy = new Chess(game.fen())
      move = copy.move({ from: src, to: dst, promotion: 'q' })
      const uci = move.from + move.to + (move.promotion ?? '')

      if (uci !== solution[idx]) {
        setMessage('❌ Not quite! Try again.')
        return false
      }

      // Correct — commit
      gameRef.current = copy
      setFen(copy.fen())
      moveIdxRef.current = idx + 1

      if (idx + 1 >= solution.length) {
        setStatus('solved')
        setMessage('🎉 Puzzle solved!')
        return true
      }

      // Play opponent response
      setWaiting(true)
      setMessage('✓ Correct!')

      setTimeout(() => {
        const opp = solution[idx + 1]
        const resp = new Chess(copy.fen())
        resp.move({ from: opp.slice(0, 2), to: opp.slice(2, 4), promotion: opp[4] ?? 'q' })
        gameRef.current = resp
        setFen(resp.fen())
        moveIdxRef.current = idx + 2

        if (idx + 2 >= solution.length) {
          setStatus('solved')
          setMessage('🎉 Puzzle solved!')
        } else {
          setMessage('✓ Keep going…')
        }
        setWaiting(false)
      }, 600)

      return true
    } catch {
      return false
    }
  }

  const msgColor =
    status === 'solved' ? 'text-green-500'
    : message.startsWith('❌') ? 'text-red-400'
    : message.startsWith('✓') ? 'text-blue-400'
    : 'text-gray-400 dark:text-gray-500'

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-start justify-between shrink-0">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">Lichess Daily Puzzle</p>
          {rating && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
              ★ {rating}{themes.length > 0 ? ` · ${themes.slice(0, 2).join(' · ')}` : ''}
            </p>
          )}
        </div>
        <button
          onClick={loadPuzzle}
          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer shrink-0 ml-2"
          title="Reload today's puzzle"
        >
          ↻
        </button>
      </div>

      {/* Status message */}
      <p className={`text-[10px] text-center shrink-0 ${msgColor}`}>
        {message}
      </p>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-start justify-center">
        {status === 'loading' && (
          <div className="flex items-center justify-center h-full">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="animate-spin text-gray-300 dark:text-gray-600">
              <path d="M14 8A6 6 0 1 1 8 2"/>
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-xs text-red-400">{message}</p>
            <button onClick={loadPuzzle} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Try again</button>
          </div>
        )}
        {(status === 'playing' || status === 'solved') && fen && (
          <div className="w-full aspect-square">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={playerColor}
              isDraggablePiece={({ piece }) =>
                status === 'playing' && !waiting && piece[0] === playerColor[0]
              }
              customBoardStyle={{ borderRadius: '8px', overflow: 'hidden' }}
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
