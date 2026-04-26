import { Chess, type Move, type Square } from "chess.js";
import type { BlunderCategory } from "./player-store";
import { PIECE_VALUES } from "./evaluation";

// For a position, return how many opponent pieces are attacked by us with
// fewer or equal-value defenders. This roughly measures "tactical pressure".
function tacticalPressure(chess: Chess, attackerColor: "w" | "b"): number {
  const board = chess.board();
  let pressure = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece || piece.color === attackerColor) continue;
      const sq = (("abcdefgh"[f] as string) +
        (8 - r).toString()) as Square;
      const attackers = chess.attackers(sq, attackerColor);
      if (attackers.length === 0) continue;
      const defenders = chess.attackers(
        sq,
        attackerColor === "w" ? "b" : "w",
      );
      // Net threat: attackers can win material if they outnumber defenders or
      // if the cheapest attacker is worth less than the target.
      const target = PIECE_VALUES[piece.type] ?? 0;
      const minAttacker = Math.min(
        ...attackers.map((a) => {
          const ap = chess.get(a);
          return ap ? (PIECE_VALUES[ap.type] ?? 0) : Infinity;
        }),
      );
      if (minAttacker < target) {
        pressure += Math.min(target - minAttacker, 500);
      }
      if (attackers.length > defenders.length) {
        pressure += 80;
      }
    }
  }
  return pressure;
}

function manhattanFromKing(chess: Chess, attackerColor: "w" | "b"): number {
  const defenderColor = attackerColor === "w" ? "b" : "w";
  // Find defender king
  const board = chess.board();
  let kr = 0;
  let kf = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (p && p.type === "k" && p.color === defenderColor) {
        kr = r;
        kf = f;
      }
    }
  }
  // Sum: closer attacker pieces = more pressure
  let proximity = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== attackerColor || p.type === "k") continue;
      const dist = Math.abs(r - kr) + Math.abs(f - kf);
      const weight = PIECE_VALUES[p.type] ?? 0;
      proximity += Math.max(0, (8 - dist)) * (weight / 100);
    }
  }
  return proximity;
}

function moveSharpness(move: Move): number {
  let s = 0;
  if (move.flags.includes("c")) s += 30; // capture
  if (move.flags.includes("e")) s += 25; // en-passant
  if (move.san.includes("+")) s += 20; // check
  if (move.san.includes("#")) s += 200; // mate
  if (move.promotion) s += 40;
  return s;
}

// "hangingPiece bait" — does this move place a meaningful piece (>= bishop)
// on a square attacked by opponent, but defended by us (so it's not actually
// hanging — but a casual player might grab it)?
function hangingPieceBait(chess: Chess, move: Move): number {
  if (!move.piece || move.piece === "p" || move.piece === "k") return 0;
  const own = chess.turn(); // turn after move switched, so opposite of our move
  // actually: in chess.js, after move, chess.turn() is opponent's turn.
  // So "we" who just moved are the opposite of chess.turn().
  const movedColor = own === "w" ? "b" : "w";
  const targetSq = move.to as Square;
  const attackers = chess.attackers(targetSq, own);
  if (attackers.length === 0) return 0;
  const defenders = chess.attackers(targetSq, movedColor);
  if (defenders.length === 0) return 0;
  // Looks attacked but is defended — bait
  const pieceValue = PIECE_VALUES[move.piece] ?? 0;
  if (pieceValue >= 320) return 35;
  return 15;
}

// For each weakness category, score how strongly THIS move (by Mimic, just played)
// challenges that weakness. Higher = better trap for player with that weakness.
export function bonusForCategory(
  beforeFen: string,
  move: Move,
  category: BlunderCategory,
): number {
  // Build a chess object AFTER our move was played
  const after = new Chess(beforeFen);
  try {
    after.move({ from: move.from, to: move.to, promotion: move.promotion });
  } catch {
    return 0;
  }
  // Mimic's color = the side that just moved = opposite of after.turn()
  const mimicColor: "w" | "b" = after.turn() === "w" ? "b" : "w";

  switch (category) {
    case "hanging-piece":
      // Bait the player into a capture they shouldn't take
      return hangingPieceBait(after, move) + tacticalPressure(after, mimicColor) * 0.2;

    case "missed-tactic":
      // Create complex tactical pressure — many attackers, multiple targets
      return tacticalPressure(after, mimicColor) * 0.8 + moveSharpness(move) * 0.3;

    case "missed-mate":
      // Bring pieces close to opponent king. Sharp checks especially.
      return manhattanFromKing(after, mimicColor) * 0.8 + moveSharpness(move) * 0.6;

    case "lost-material":
      // Force exchanges + create loose pieces
      return tacticalPressure(after, mimicColor) * 0.7 + (move.flags.includes("c") ? 25 : 0);

    case "weak-king":
      // Push pieces toward king + open files
      return manhattanFromKing(after, mimicColor) * 1.0;

    case "positional":
      // Quiet positions — REWARD calm, REWARD low complexity (inverse of sharpness)
      return Math.max(0, 40 - moveSharpness(move)) +
        Math.max(0, 100 - tacticalPressure(after, mimicColor) * 0.5);
  }
}

// Pick the top weakness category from the player's weakness map.
// If all zero, returns null (cold-start case).
export function topWeakness(
  weaknesses: Record<BlunderCategory, number>,
): BlunderCategory | null {
  let best: BlunderCategory | null = null;
  let bestCount = 0;
  for (const [cat, count] of Object.entries(weaknesses) as [
    BlunderCategory,
    number,
  ][]) {
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}
