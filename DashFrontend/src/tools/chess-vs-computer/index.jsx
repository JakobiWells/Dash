import { useState, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

// ─── AI ──────────────────────────────────────────────────────────────────────

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }

// Piece-square tables (white's perspective, rank 8→1 top→bottom)
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
}

function squareIndex(sq, isWhite) {
  const file = sq.charCodeAt(0) - 97 // a=0..h=7
  const rank = parseInt(sq[1]) - 1   // 1=0..8=7
  const row = isWhite ? (7 - rank) : rank
  return row * 8 + file
}

function evaluate(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -900000 : 900000
  if (chess.isDraw()) return 0

  let score = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f]
      if (!sq) continue
      const isWhite = sq.color === 'w'
      const base = PIECE_VALUES[sq.type] ?? 0
      const pstIdx = isWhite ? r * 8 + f : (7 - r) * 8 + f
      const positional = PST[sq.type]?.[pstIdx] ?? 0
      score += isWhite ? (base + positional) : -(base + positional)
    }
  }
  return score
}

function minimax(chess, depth, alpha, beta, maximizing) {
  if (depth === 0 || chess.isGameOver()) return evaluate(chess)

  const moves = chess.moves()
  // Captures first for better alpha-beta pruning
  moves.sort((a, b) => (b.includes('x') ? 1 : 0) - (a.includes('x') ? 1 : 0))

  if (maximizing) {
    let best = -Infinity
    for (const m of moves) {
      chess.move(m)
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false))
      chess.undo()
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      chess.move(m)
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true))
      chess.undo()
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

function getBestMove(fen, difficulty) {
  const chess = new Chess(fen)
  const moves = chess.moves()
  if (!moves.length) return null

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  const depth = difficulty === 'hard' ? 3 : 2
  const maximizing = chess.turn() === 'w'

  // Shuffle for variety between equally-scored moves
  const shuffled = [...moves].sort(() => Math.random() - 0.5)

  let bestMove = shuffled[0]
  let bestScore = maximizing ? -Infinity : Infinity

  for (const move of shuffled) {
    chess.move(move)
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing)
    chess.undo()
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
  }
  return bestMove
}

// ─── Component ───────────────────────────────────────────────────────────────

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function ChessVsComputer() {
  const [phase, setPhase] = useState('setup') // setup | playing | over
  const [playerColor, setPlayerColor] = useState('white')
  const [difficulty, setDifficulty] = useState('medium')
  const [fen, setFen] = useState('start')
  const [result, setResult] = useState('')
  const [thinking, setThinking] = useState(false)

  const gameRef = useRef(null)

  function checkOver(chess) {
    if (!chess.isGameOver()) return false
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White'
      setResult(`Checkmate — ${winner} wins!`)
    } else if (chess.isStalemate()) {
      setResult('Draw by stalemate')
    } else if (chess.isThreefoldRepetition()) {
      setResult('Draw by repetition')
    } else if (chess.isInsufficientMaterial()) {
      setResult('Draw — insufficient material')
    } else {
      setResult('Draw')
    }
    setPhase('over')
    return true
  }

  function aiMove(chess, diff) {
    setThinking(true)
    setTimeout(() => {
      const move = getBestMove(chess.fen(), diff)
      if (move) chess.move(move)
      setFen(chess.fen())
      setThinking(false)
      checkOver(chess)
    }, 80)
  }

  function startGame() {
    const chess = new Chess()
    gameRef.current = chess
    setFen(chess.fen())
    setResult('')
    setPhase('playing')
    setThinking(false)

    if (playerColor === 'black') {
      aiMove(chess, difficulty)
    }
  }

  function onDrop(src, dst) {
    if (phase !== 'playing' || thinking) return false
    const chess = gameRef.current
    if (!chess) return false

    const turnColor = chess.turn() === 'w' ? 'white' : 'black'
    if (turnColor !== playerColor) return false

    try {
      chess.move({ from: src, to: dst, promotion: 'q' })
    } catch {
      return false
    }

    setFen(chess.fen())
    if (checkOver(chess)) return true

    aiMove(chess, difficulty)
    return true
  }

  // ── Setup screen ──
  if (phase === 'setup') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-2">
        <span className="text-2xl">♙</span>

        <div className="w-full max-w-[220px] flex flex-col gap-3">
          {/* Color */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Play as</p>
            <div className="flex gap-1.5">
              {['white', 'black'].map(c => (
                <button
                  key={c}
                  onClick={() => setPlayerColor(c)}
                  className={`flex-1 py-1.5 rounded-xl text-xs capitalize cursor-pointer transition-colors ${
                    playerColor === c
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a28]'
                  }`}
                >
                  {c === 'white' ? '♙ White' : '♟ Black'}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Difficulty</p>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] capitalize cursor-pointer transition-colors ${
                    difficulty === d
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border border-gray-200 dark:border-[#3a3a38] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2a28]'
                  }`}
                >{d}</button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            Start game
          </button>
        </div>
      </div>
    )
  }

  // ── Playing / Over screen ──
  return (
    <div className="h-full flex flex-col gap-2">
      {/* Status bar */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {phase === 'over'
            ? result
            : thinking
              ? '🤔 Thinking…'
              : `You play ${playerColor} · ${difficulty}`}
        </p>
        <button
          onClick={() => setPhase('setup')}
          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer shrink-0 ml-2"
        >
          New game
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-start justify-center">
        <div className="w-full aspect-square">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            isDraggablePiece={({ piece }) =>
              phase === 'playing' && !thinking && piece[0] === playerColor[0]
            }
            customBoardStyle={{ borderRadius: '8px', overflow: 'hidden' }}
            customDarkSquareStyle={{ backgroundColor: '#769656' }}
            customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
          />
        </div>
      </div>
    </div>
  )
}
