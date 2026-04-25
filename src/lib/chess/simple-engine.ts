import { Chess, type Move } from "chess.js";
import { evaluatePosition, PIECE_VALUES } from "./evaluation";

function orderMoves(moves: Move[]): Move[] {
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
  if (depth === 0 || chess.isGameOver()) return evaluatePosition(chess);

  const moves = orderMoves(chess.moves({ verbose: true }) as Move[]);

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

export type SearchResult = {
  move: Move | null;
  score: number;
  ranked: { move: Move; score: number }[];
};

// Returns best move + ranked alternatives. Used both for AI play and for
// post-game analysis (find what the human should have played).
export function search(fen: string, depth: number): SearchResult {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return { move: null, score: 0, ranked: [] };
  if (depth <= 0) {
    const random = moves[Math.floor(Math.random() * moves.length)];
    return { move: random, score: 0, ranked: [] };
  }

  const maximizing = chess.turn() === "w";
  const ordered = orderMoves(moves);
  const ranked: { move: Move; score: number }[] = [];

  for (const move of ordered) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    const score = alphaBeta(chess, depth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    ranked.push({ move, score });
  }

  ranked.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));

  return { move: ranked[0].move, score: ranked[0].score, ranked };
}
