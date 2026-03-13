---
title: Chess vs Computer
description: Play chess against an AI opponent at adjustable difficulty levels.
toolId: chess-vs-computer
icon: ♜
tags: [chess, games, ai]
---

# Chess vs Computer

Play a full game of chess against a built-in AI engine with adjustable strength.

## Starting a Game

1. Choose your **color** (White, Black, or Random).
2. Set the **difficulty level** (1–8 or Easy/Medium/Hard).
3. Click **New Game** to begin.

## Making Moves

- Click a piece to highlight its legal moves, then click the destination square.
- Or drag and drop pieces directly.
- Illegal moves are rejected automatically.

## Difficulty Levels

| Level | Approximate Elo |
|-------|----------------|
| Easy | ~400–600 |
| Medium | ~800–1200 |
| Hard | ~1400–1800 |
| Max | ~2000+ |

Lower levels intentionally make mistakes to keep games winnable for beginners.

## Game Controls

- **Undo** — take back your last move
- **New Game** — restart with the same settings
- **Flip Board** — view from the other side
- **Resign** — end the game

## Tips

- Use lower difficulty when learning new openings so you can experiment without punishment.
- The engine plays instantly — if you want time pressure, use the timer option.
- Pair with **Chess Puzzles** to practice specific tactics, then apply them in full games here.

## How It Works

Chess engines find strong moves through **minimax search with alpha-beta pruning**:

1. **Minimax**: Build a game tree by exploring all possible move sequences. At each leaf node, evaluate the position using a heuristic function. Maximize the score on your turn, minimize it on the opponent's turn.
2. **Alpha-beta pruning**: Prune branches of the tree that can't possibly affect the result — this reduces the search space from O(b^d) to roughly O(b^(d/2)), doubling the effective search depth.
3. **Iterative deepening**: Search to depth 1, then 2, then 3... using results from shallower searches to order moves better at deeper depths (better move ordering dramatically improves pruning efficiency).
4. **Evaluation function**: Assigns a numeric score to a position based on material count (piece values: pawn=1, knight=3, bishop=3.25, rook=5, queen=9), piece-square tables (bonuses for piece placement), king safety, pawn structure, and mobility.

Modern engines add **neural network evaluation** (NNUE — Efficiently Updatable Neural Networks) for much more accurate position assessment.

## What Powers This

The computer opponent uses **Stockfish** — the world's strongest open-source chess engine, consistently ranked #1 on computer chess rating lists. Stockfish runs in the browser via WebAssembly. Difficulty levels are implemented by limiting Stockfish's search depth or time, or by enabling randomized move selection at lower skill levels.
