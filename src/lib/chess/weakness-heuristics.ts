import { Chess, type Move, type Square } from "chess.js";
import type { BlunderCategory } from "./player-store";
import { PIECE_VALUES } from "./evaluation";

// Sum of "we have a winnable threat against an opponent piece" signals on
// the whole board. Used as a baseline + delta gauge — the *change* in this
// number from before-our-move to after-our-move is what differentiates moves.
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

function kingProximity(chess: Chess, attackerColor: "w" | "b"): number {
  const defenderColor = attackerColor === "w" ? "b" : "w";
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
  let proximity = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== attackerColor || p.type === "k") continue;
      const dist = Math.abs(r - kr) + Math.abs(f - kf);
      const weight = PIECE_VALUES[p.type] ?? 0;
      proximity += Math.max(0, 8 - dist) * (weight / 100);
    }
  }
  return proximity;
}

// Squares around the defender king that are attacked by us.
function kingZoneAttacks(chess: Chess, attackerColor: "w" | "b"): number {
  const defenderColor = attackerColor === "w" ? "b" : "w";
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
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) {
      const r = kr + dr;
      const f = kf + df;
      if (r < 0 || r > 7 || f < 0 || f > 7) continue;
      const sq = (("abcdefgh"[f] as string) +
        (8 - r).toString()) as Square;
      if (chess.attackers(sq, attackerColor).length > 0) count++;
    }
  }
  return count;
}

function moveSharpness(move: Move): number {
  let s = 0;
  if (move.flags.includes("c")) s += 35;
  if (move.flags.includes("e")) s += 30;
  if (move.san.includes("+")) s += 25;
  if (move.san.includes("#")) s += 250;
  if (move.promotion) s += 50;
  return s;
}

// How many squares does the moved piece attack from its destination?
// Used as activity proxy — more active = more complex for the player to read.
function pieceActivity(after: Chess, move: Move): number {
  const piece = move.piece;
  if (!piece || piece === "k") return 0;
  const opp = after.turn();
  // Count squares the just-moved piece can reach by counting opp's defenders
  // of those squares — simpler proxy: just count moves available from `to`
  // for that piece type by inspecting board.
  // Cheap approximation: look at the target square — how many own pieces
  // attack it right now (us + this piece's coverage proxy).
  // Even cheaper: rate by piece type bias for activity.
  const targetSq = move.to as Square;
  // Number of squares our piece-on-target now attacks
  const ourColor = opp === "w" ? "b" : "w";
  let attacks = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = (("abcdefgh"[f] as string) +
        (8 - r).toString()) as Square;
      if (sq === targetSq) continue;
      const att = after.attackers(sq, ourColor);
      if (att.includes(targetSq)) attacks++;
    }
  }
  return attacks;
}

// Central / open-file control as a complexity gauge. Pieces in the center
// attack more squares = harder for the player to evaluate threats.
function centralFootprint(after: Chess, mimicColor: "w" | "b"): number {
  const center = ["d4", "d5", "e4", "e5", "c4", "c5", "f4", "f5"] as Square[];
  let cnt = 0;
  for (const sq of center) {
    if (after.attackers(sq, mimicColor).length > 0) cnt++;
  }
  return cnt;
}

// "hanging piece bait" — does this move place a meaningful piece on a square
// attacked by opponent but defended by us (the bait — looks free, isn't)?
function hangingPieceBait(after: Chess, move: Move): number {
  if (!move.piece || move.piece === "p" || move.piece === "k") return 0;
  const opponent = after.turn();
  const movedColor = opponent === "w" ? "b" : "w";
  const targetSq = move.to as Square;
  const attackers = after.attackers(targetSq, opponent);
  if (attackers.length === 0) return 0;
  const defenders = after.attackers(targetSq, movedColor);
  if (defenders.length === 0) return 0;
  const pieceValue = PIECE_VALUES[move.piece] ?? 0;
  if (pieceValue >= 320) return 50;
  return 20;
}

// For each weakness category, score how strongly THIS move (just played by
// Mimic) challenges that weakness. The bonus is a *delta* — change from the
// position before our move to after — so different moves get different scores.
export function bonusForCategory(
  beforeFen: string,
  move: Move,
  category: BlunderCategory,
): number {
  const before = new Chess(beforeFen);
  const after = new Chess(beforeFen);
  try {
    after.move({ from: move.from, to: move.to, promotion: move.promotion });
  } catch {
    return 0;
  }
  const mimicColor: "w" | "b" = after.turn() === "w" ? "b" : "w";

  const dPressure =
    tacticalPressure(after, mimicColor) -
    tacticalPressure(before, mimicColor);
  const dKingProx =
    kingProximity(after, mimicColor) - kingProximity(before, mimicColor);
  const dKingZone =
    kingZoneAttacks(after, mimicColor) -
    kingZoneAttacks(before, mimicColor);
  const sharp = moveSharpness(move);
  const activity = pieceActivity(after, move);
  const central = centralFootprint(after, mimicColor);

  switch (category) {
    case "hanging-piece":
      // Bait an attacked-but-defended piece + active position to confuse defender
      return (
        hangingPieceBait(after, move) +
        Math.max(0, dPressure) * 0.5 +
        activity * 1.5 +
        sharp * 0.3
      );

    case "missed-tactic":
      // New pressure + sharp moves + active piece development
      return (
        Math.max(0, dPressure) * 1.0 +
        sharp * 0.5 +
        activity * 2.0 +
        central * 4
      );

    case "missed-mate":
      // Force toward the king + checks
      return (
        Math.max(0, dKingProx) * 6 +
        dKingZone * 25 +
        sharp * 0.9 +
        activity * 0.8
      );

    case "lost-material":
      // Force exchanges + threats + activity
      return (
        Math.max(0, dPressure) * 0.9 +
        (move.flags.includes("c") ? 40 : 0) +
        activity * 1.0
      );

    case "weak-king":
      // King zone control
      return (
        Math.max(0, dKingProx) * 8 +
        dKingZone * 30 +
        activity * 0.5
      );

    case "positional":
      // Inverse: reward calm, low-activity, low-sharpness moves
      return (
        Math.max(0, 50 - sharp) +
        Math.max(0, -dPressure * 0.4) +
        Math.max(0, 30 - activity * 2)
      );
  }
}

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
