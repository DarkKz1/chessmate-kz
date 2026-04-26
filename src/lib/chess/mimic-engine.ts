import { Chess, type Move } from "chess.js";
import { search, type SearchResult } from "./simple-engine";
import type { BlunderCategory } from "./player-store";
import { bonusForCategory, topWeakness } from "./weakness-heuristics";

// Within how many centipawns of the best move we still consider a candidate.
// Tightening this keeps Mimic objectively strong; loosening makes it more
// "personality-driven". 60 cp = within ~half a pawn of best.
const CP_WINDOW = 60;
const TOP_K = 5;

// How heavily to weight the weakness bonus vs raw eval. Calibrated so that
// 100 bonus points = 50 cp of evaluation.
const BIAS_FACTOR = 0.5;

// Search with bias toward the player's most common weakness category.
// Falls back to plain best-move when there's no weakness data yet (cold start)
// or when the position has only one viable move.
export function searchMimic(
  fen: string,
  depth: number,
  weaknesses: Record<BlunderCategory, number>,
): SearchResult {
  const result = search(fen, depth);
  if (!result.move || result.ranked.length <= 1) return result;

  const top = topWeakness(weaknesses);
  if (!top) return result;

  const chess = new Chess(fen);
  const maximizing = chess.turn() === "w";

  type Scored = {
    move: Move;
    score: number;
    engineScore: number;
    bonus: number;
    weighted: number;
  };

  // Convert minimax score → "engine perspective" where higher = better for us
  const all: Scored[] = result.ranked.map(({ move, score }) => ({
    move,
    score,
    engineScore: maximizing ? score : -score,
    bonus: 0,
    weighted: 0,
  }));

  const best = all[0].engineScore;
  const candidates = all
    .filter((c) => best - c.engineScore <= CP_WINDOW)
    .slice(0, TOP_K);

  if (candidates.length === 1) return result;

  for (const c of candidates) {
    c.bonus = bonusForCategory(fen, c.move, top);
    c.weighted = c.engineScore + BIAS_FACTOR * c.bonus;
  }

  candidates.sort((a, b) => b.weighted - a.weighted);
  const winner = candidates[0];

  return {
    move: winner.move,
    score: winner.score,
    ranked: result.ranked,
  };
}
