import { Chess, type Move } from "chess.js";
import { search } from "./simple-engine";
import type { Blunder, BlunderCategory } from "./player-store";

const PIECE_NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

function classifyBlunder(
  played: Move,
  best: Move,
  cpLoss: number,
): BlunderCategory {
  if (best.san.endsWith("#") && !played.san.endsWith("#")) {
    return "missed-mate";
  }
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

export type GameAnalysis = {
  worstBlunder: Blunder | null;
  blunders: Blunder[];
  accuracy: number; // 0-100 — average move quality
  totalCpLoss: number;
  moveCount: number;
};

// Analyse a finished game from white/black perspective.
// `playerColor` says which side the human played.
// Lower depth = faster but coarser analysis. Depth 3 is a good MVP.
export function analyseGame(
  pgn: string,
  playerColor: "w" | "b",
  depth = 3,
): GameAnalysis {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const history = chess.history({ verbose: true }) as Move[];

  const blunders: Blunder[] = [];
  let totalQuality = 0;
  let totalCpLoss = 0;
  let playerMoveCount = 0;

  // Walk forward, evaluating each player move against the best option
  const replay = new Chess();
  for (const move of history) {
    if (move.color !== playerColor) {
      replay.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      continue;
    }

    const fenBefore = replay.fen();
    const result = search(fenBefore, depth);
    if (!result.move || result.ranked.length === 0) {
      replay.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      continue;
    }

    const playedRanked = result.ranked.find(
      (r) =>
        r.move.from === move.from &&
        r.move.to === move.to &&
        (r.move.promotion ?? null) === (move.promotion ?? null),
    );

    const bestScore = result.ranked[0].score;
    const playedScore = playedRanked?.score ?? bestScore - 800;

    // Convert to player's perspective: positive cpLoss = player gave up centipawns
    const cpLoss =
      playerColor === "w" ? bestScore - playedScore : playedScore - bestScore;

    playerMoveCount += 1;
    totalCpLoss += Math.max(0, cpLoss);
    const quality = Math.max(0, 100 - cpLoss / 5);
    totalQuality += quality;

    if (cpLoss > 100) {
      const category = classifyBlunder(move, result.ranked[0].move, cpLoss);
      blunders.push({
        fen: fenBefore,
        played: move.san,
        best: result.ranked[0].move.san,
        cpLoss: Math.round(cpLoss),
        category,
        shortLesson: lessonFor(category, move, result.ranked[0].move),
        date: Date.now(),
        resolved: false,
      });
    }

    replay.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
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
