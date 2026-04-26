// One-off verification script. Runs in Node via `npx tsx tools/verify.ts`.
// Tests two advisor blockers:
//   1. searchMimic actually picks different moves than search() with bias
//   2. Alex's hand-typed FEN/played/best tuples parse cleanly in chess.js

import { Chess } from "chess.js";
import { search } from "../src/lib/chess/simple-engine";
import { searchMimic } from "../src/lib/chess/mimic-engine";
import { ALEX_PROFILE } from "../src/lib/chess/demo-persona";
import { bonusForCategory } from "../src/lib/chess/weakness-heuristics";
import { analyseGame } from "../src/lib/chess/blunder-detector";
import type { BlunderCategory } from "../src/lib/chess/player-store";

const EMPTY: Record<BlunderCategory, number> = {
  "hanging-piece": 0,
  "missed-mate": 0,
  "missed-tactic": 0,
  "weak-king": 0,
  "lost-material": 0,
  positional: 0,
};

// Mid-game positions with real tactical content — where weakness bias should matter
const TEST_POSITIONS = [
  // 1. After 1.e4 e5 2.Nf3 Nc6 3.Bc4 — opening, low tactics expected
  "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 3",
  // 2. Mid-game, IQP, tactics on the board
  "r1bq1rk1/pp2bppp/2nppn2/8/2BNP3/2N1B3/PPP2PPP/R2Q1RK1 w - - 0 9",
  // 3. Sicilian Najdorf middlegame, sharp
  "r1bq1rk1/3nbppp/p2p1n2/1p2p3/4P3/1NN1BP2/PPPQ2PP/R3KB1R w KQ - 0 11",
  // 4. Open position with hanging knight on b4
  "r2q1rk1/pp2bppp/2nppn2/8/1n2P3/2NBBP2/PPP1QPPP/R3K2R w KQ - 4 11",
  // 5. King-side attack potential
  "r2q1rk1/pp3pp1/2nb1n1p/3pp3/3P1B2/2N1PN2/PPP1QPPP/R4RK1 w - - 0 12",
  // 6. End-game — pawn race
  "8/5kpp/2p5/p2p4/3P4/2P2K2/PP4PP/8 w - - 0 30",
  // 7. Tactical mid-game (pinned knight)
  "r1bqr1k1/pp1n1ppp/2pb1n2/3p4/3P4/2NBPN2/PPB2PPP/R2QR1K1 w - - 0 11",
  // 8. Ruy Lopez exchange — multiple plans
  "r1bqkbnr/2pp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
  // 9. Closed Sicilian — quiet maneuvering
  "r1bqkbnr/pp1ppp1p/2n3p1/2p5/2P1P3/2N5/PP1P1PPP/R1BQKBNR w KQkq - 0 4",
  // 10. Caro-Kann advance — pawn structure
  "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
];

function san(fen: string, move: { from: string; to: string; promotion?: string }): string {
  const c = new Chess(fen);
  const m = c.move({ from: move.from, to: move.to, promotion: move.promotion });
  return m?.san ?? `${move.from}-${move.to}`;
}

console.log("\n=== A/B test: searchMimic with Alex weaknesses vs vanilla search ===\n");
console.log("Alex weaknesses:", JSON.stringify(ALEX_PROFILE.weaknesses));
console.log("Top category:", Object.entries(ALEX_PROFILE.weaknesses).sort((a, b) => b[1] - a[1])[0][0]);
console.log();

let differs = 0;
const DEPTH = 3;
for (const fen of TEST_POSITIONS) {
  const vanilla = search(fen, DEPTH);
  const mimic = searchMimic(fen, DEPTH, ALEX_PROFILE.weaknesses);
  const v = vanilla.move ? san(fen, vanilla.move) : "—";
  const m = mimic.move ? san(fen, mimic.move) : "—";
  const same = v === m;
  if (!same) differs++;
  console.log(
    `${same ? "  same  " : "  DIFFER"}  vanilla=${v.padEnd(8)}  mimic=${m.padEnd(8)}  fen="${fen.slice(0, 40)}..."`
  );
}
console.log(`\n${differs}/${TEST_POSITIONS.length} positions show different moves under Mimic bias.`);
if (differs === 0) {
  console.log("⚠️  BIAS NEVER CHANGES MOVE — calibration needed (raise BIAS_FACTOR or CP_WINDOW)");
}

// Detailed breakdown of position #3 — italian opening
console.log("\n=== Bonus breakdown for italian opening (top weakness = hanging-piece) ===\n");
{
  const fen = TEST_POSITIONS[2];
  const result = search(fen, DEPTH);
  const top = "hanging-piece" as const;
  console.log("ranked top-8:");
  for (const r of result.ranked.slice(0, 8)) {
    const sanStr = san(fen, r.move);
    const bonus = bonusForCategory(fen, r.move, top);
    const c = new Chess(fen);
    const maximizing = c.turn() === "w";
    const engineScore = maximizing ? r.score : -r.score;
    console.log(
      `  ${sanStr.padEnd(8)} eval=${r.score.toString().padStart(6)} engineScore=${engineScore.toString().padStart(6)} bonus=${bonus.toFixed(1).padStart(6)} weighted=${(engineScore + 0.5 * bonus).toFixed(1)}`
    );
  }
}

console.log("\n=== Alex blunder validation ===\n");
let bad = 0;
for (const b of ALEX_PROFILE.blunders) {
  const c = new Chess(b.fen);
  let okPlayed = "?";
  let okBest = "?";
  try {
    const c1 = new Chess(b.fen);
    const mp = c1.move(b.played);
    okPlayed = mp ? mp.san : "INVALID";
  } catch (e) {
    okPlayed = `THROW: ${(e as Error).message}`;
  }
  try {
    const c2 = new Chess(b.fen);
    const mb = c2.move(b.best);
    okBest = mb ? mb.san : "INVALID";
  } catch (e) {
    okBest = `THROW: ${(e as Error).message}`;
  }
  const ok = okPlayed === b.played && okBest === b.best;
  if (!ok) bad++;
  console.log(
    `${ok ? "  ok  " : "  BAD"}  played=${b.played} → ${okPlayed}    best=${b.best} → ${okBest}    cat=${b.category}`
  );
  // Also check FEN itself loads
  if (c.fen() !== b.fen) {
    console.log(`     ⚠ fen normalized: stored="${b.fen}" → loaded="${c.fen()}"`);
  }
}
console.log(`\n${bad === 0 ? "✓" : "✗"} ${ALEX_PROFILE.blunders.length - bad}/${ALEX_PROFILE.blunders.length} Alex blunders parse cleanly.`);

// Full-game flow simulation: human plays plausible moves, Mimic responds with
// weakness-bias engine, run analyseGame() at the end and verify that we get
// a worstBlunder back with valid lesson text.
console.log("\n=== Full game flow simulation (Alex as black) ===\n");
{
  const game = new Chess();
  const playerColor: "w" | "b" = "b"; // Alex plays black
  const playerMoves: string[] = ["e5", "Nc6", "Bc5", "Bxc4", "d6", "Qd7", "O-O-O", "Kb8", "Rhe8"]; // semi-plausible black moves
  let humanIdx = 0;

  while (!game.isGameOver() && game.history().length < 60) {
    if (game.turn() === playerColor) {
      // Try to play scripted move; fall back to random legal
      let played = false;
      while (humanIdx < playerMoves.length && !played) {
        try {
          game.move(playerMoves[humanIdx++]);
          played = true;
        } catch {
          // skip illegal
        }
      }
      if (!played) {
        const legal = game.moves();
        if (legal.length === 0) break;
        game.move(legal[Math.floor(Math.random() * legal.length)]);
      }
    } else {
      // Mimic side
      const mimic = searchMimic(game.fen(), 3, ALEX_PROFILE.weaknesses);
      if (!mimic.move) break;
      game.move({
        from: mimic.move.from,
        to: mimic.move.to,
        promotion: mimic.move.promotion,
      });
    }
  }

  const pgn = game.pgn();
  const status = game.isCheckmate()
    ? "checkmate"
    : game.isDraw()
      ? "draw"
      : game.isStalemate()
        ? "stalemate"
        : "max-moves";
  console.log(`game ended: ${status}, ${game.history().length} half-moves`);

  const analysis = analyseGame(pgn, playerColor, 3);
  console.log(`accuracy: ${analysis.accuracy.toFixed(1)}%`);
  console.log(`blunders detected: ${analysis.blunders.length}`);
  if (analysis.worstBlunder) {
    const wb = analysis.worstBlunder;
    console.log(`worst blunder:`);
    console.log(`  category: ${wb.category}`);
    console.log(`  played: ${wb.played} → best: ${wb.best} (cpLoss ${wb.cpLoss})`);
    console.log(`  lesson: "${wb.shortLesson}"`);
    // English-only lesson check
    if (/[а-яА-Я]/.test(wb.shortLesson)) {
      console.log("  ⚠ Russian text detected — lesson should be English");
    }
  } else {
    console.log("no blunder detected (clean game, possible)");
  }
}

process.exit(bad > 0 || differs === 0 ? 1 : 0);
