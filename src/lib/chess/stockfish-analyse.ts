"use client";

import { Chess, type Move } from "chess.js";
import { evaluateMultiPv } from "./stockfish-engine";
import type {
  Blunder,
  BlunderCategory,
} from "./player-store";
import type { GameAnalysis } from "./blunder-detector";

const PIECE_NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

function classify(
  played: Move,
  best: Move,
  cpLoss: number,
): BlunderCategory {
  if (best.san.endsWith("#") && !played.san.endsWith("#")) return "missed-mate";
  if (cpLoss > 400) return "lost-material";
  if (cpLoss > 200) {
    if (best.captured && (!played.captured || played.captured < best.captured)) {
      return "missed-tactic";
    }
    return "hanging-piece";
  }
  return "positional";
}

function lessonFor(
  category: BlunderCategory,
  played: Move,
  best: Move,
): string {
  switch (category) {
    case "missed-mate":
      return `mate was waiting. ${best.san} closes the door.`;
    case "lost-material":
      return `the wood walked off the board. ${best.san} keeps it.`;
    case "missed-tactic":
      return best.captured
        ? `${best.san} took the ${PIECE_NAME[best.captured]}. you blinked.`
        : `${best.san} was the spark. you held the match.`;
    case "hanging-piece":
      return `the ${PIECE_NAME[played.piece]} reached into nothing. ${best.san} keeps the line.`;
    case "weak-king":
      return `your king felt the draft. ${best.san} closes the window.`;
    case "positional":
    default:
      return `${best.san} hummed quieter, and won by a margin.`;
  }
}

function uciOf(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

// Analyse a finished game with Stockfish 18 (Lite NNUE) + MultiPV. One UCI
// `go depth N` per player position; the played move's eval is read off the
// MultiPV list, and the cp loss is `bestCp - playedCp`. If the played move
// fell outside the top-K, we treat it as a likely blunder using a
// conservative cp-loss floor (300).
//
// Returns null on Stockfish failure → caller must fall back.
export async function analyseGameWithStockfish(
  pgn: string,
  playerColor: "w" | "b",
  depth = 10,
  multiPv = 5,
): Promise<GameAnalysis | null> {
  const c = new Chess();
  try {
    c.loadPgn(pgn);
  } catch {
    return null;
  }
  const history = c.history({ verbose: true }) as Move[];

  const blunders: Blunder[] = [];
  let totalCpLoss = 0;
  let totalQuality = 0;
  let playerMoveCount = 0;

  const replay = new Chess();

  for (const move of history) {
    if (move.color !== playerColor) {
      replay.move({ from: move.from, to: move.to, promotion: move.promotion });
      continue;
    }

    const fenBefore = replay.fen();
    const result = await evaluateMultiPv(fenBefore, depth, multiPv);
    if (!result) return null;

    const playedUci = uciOf(move);
    const playedEntry = result.variations.get(playedUci);
    const bestEntry = result.variations.get(result.bestMoveUci);
    const bestCp = bestEntry?.cp ?? 0;
    const playedCp = playedEntry?.cp ?? bestCp - 300; // outside top-K → assume bad

    // Both cps from side-to-move (player's) perspective. cpLoss = best - played.
    const cpLoss = bestCp - playedCp;

    playerMoveCount += 1;
    totalCpLoss += Math.max(0, cpLoss);
    const quality = Math.max(0, 100 - cpLoss / 5);
    totalQuality += quality;

    if (cpLoss > 100) {
      const bestUci = result.bestMoveUci;
      const probe = new Chess(fenBefore);
      let bestMove: Move | null = null;
      try {
        bestMove = probe.move({
          from: bestUci.slice(0, 2),
          to: bestUci.slice(2, 4),
          promotion: bestUci.length > 4 ? bestUci[4] : undefined,
        }) as Move;
      } catch {
        bestMove = null;
      }
      if (bestMove) {
        const category = classify(move, bestMove, cpLoss);
        blunders.push({
          fen: fenBefore,
          played: move.san,
          best: bestMove.san,
          cpLoss: Math.round(cpLoss),
          category,
          shortLesson: lessonFor(category, move, bestMove),
          date: Date.now(),
          resolved: false,
        });
      }
    }

    replay.move({ from: move.from, to: move.to, promotion: move.promotion });
  }

  blunders.sort((a, b) => b.cpLoss - a.cpLoss);
  const accuracy = playerMoveCount > 0 ? totalQuality / playerMoveCount : 0;

  return {
    worstBlunder: blunders[0] ?? null,
    blunders,
    accuracy,
    totalCpLoss,
    moveCount: playerMoveCount,
  };
}
