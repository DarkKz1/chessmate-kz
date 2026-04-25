import { Chess, type Move } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables — encourage sane positional play
const PST = {
  p: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  r: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0],
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20],
  ],
} as const;

function squareToIndex(sq: string): [number, number] {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
  return [rank, file];
}

function evaluate(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate()) return 0;

  let score = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type];
      const pst = PST[piece.type];
      // White uses table as-is; Black uses mirrored
      const positional =
        piece.color === "w"
          ? pst[r][f]
          : pst[7 - r][f];
      score += piece.color === "w" ? value + positional : -(value + positional);
    }
  }
  return score;
}

function orderMoves(chess: Chess, moves: Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const score = (m: Move) => {
      let s = 0;
      if (m.captured) s += PIECE_VALUES[m.captured] - PIECE_VALUES[m.piece] / 10;
      if (m.promotion) s += PIECE_VALUES[m.promotion];
      return s;
    };
    return score(b) - score(a);
  });
}

function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluate(chess);
  }

  const moves = orderMoves(chess, chess.moves({ verbose: true }) as Move[]);

  if (maximizing) {
    let value = -Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      value = Math.max(value, alphaBeta(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      value = Math.min(value, alphaBeta(chess, depth - 1, alpha, beta, true));
      chess.undo();
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

export type AILevel = "newbie" | "easy" | "medium" | "strong";

const LEVEL_DEPTH: Record<AILevel, number> = {
  newbie: 0, // random legal move
  easy: 2,
  medium: 3,
  strong: 4,
};

export function computeBestMove(fen: string, level: AILevel): Move | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  const depth = LEVEL_DEPTH[level];
  if (depth === 0) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const maximizing = chess.turn() === "w";
  let bestMove: Move = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  const ordered = orderMoves(chess, moves);
  for (const move of ordered) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = alphaBeta(chess, depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
