"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Square } from "chess.js";
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Flag,
} from "lucide-react";
import { ChessBoard } from "@/components/chess-board";
import { EvalBar } from "@/components/eval-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { useEngine } from "@/lib/chess/use-engine";
import { PostGameCard } from "@/components/post-game-card";
import {
  loadPlayer,
  savePlayer,
  ratingToDepth,
  ratingDeltaForMove,
  ratingDeltaForResult,
  clampRating,
  type PlayerState,
  type Blunder,
} from "@/lib/chess/player-store";
import { DEMO_MATE_BLUNDER } from "@/lib/chess/demo-blunder";
import { isAlexActive } from "@/lib/chess/demo-persona";

const CATEGORY_PHRASE: Record<string, string> = {
  "hanging-piece": "hanging pieces",
  "missed-tactic": "missed tactics",
  "missed-mate": "missed mates",
  "lost-material": "lost material",
  "weak-king": "exposed king",
  positional: "quiet slips",
};

const ALEX_BRIEF_KEY = "mimic.alex.brief.shown.v1";

type GameResult = "win" | "loss" | "draw";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center font-typewriter text-ink-light">
          loading…
        </div>
      }
    >
      <PlayPageInner />
    </Suspense>
  );
}

function PlayPageInner() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const game = useChessGame();
  const { bestMove, analyse } = useEngine();
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [thinking, setThinking] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [worstBlunder, setWorstBlunder] = useState<Blunder | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [resultBanner, setResultBanner] = useState<GameResult | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [alexBriefOpen, setAlexBriefOpen] = useState(false);
  const playerColorRef = useRef<"w" | "b">("w");

  useEffect(() => {
    const p = loadPlayer();
    setPlayer(p);
    if (isDemo) {
      const t = setTimeout(() => setDemoOpen(true), 350);
      return () => clearTimeout(t);
    }
    // First-run brief — concept reveal moment for both personas
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem(ALEX_BRIEF_KEY)
    ) {
      setAlexBriefOpen(true);
    }
  }, [isDemo]);

  const closeAlexBrief = useCallback(() => {
    setAlexBriefOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(ALEX_BRIEF_KEY, "1");
    }
  }, []);

  const openDossier = useCallback(() => {
    setAlexBriefOpen(true);
  }, []);

  const patternsCount = useMemo(() => {
    if (!player) return 0;
    return Object.values(player.weaknesses).reduce((a, b) => a + b, 0);
  }, [player]);

  const finished = game.status !== "playing";
  const playerColor = playerColorRef.current;
  const depth = useMemo(
    () => (player ? ratingToDepth(player.rating) : 2),
    [player],
  );

  const lastMove =
    game.history.length > 0
      ? {
          from: game.history[game.history.length - 1].from as Square,
          to: game.history[game.history.length - 1].to as Square,
        }
      : null;

  useEffect(() => {
    if (!player) return;
    if (game.status !== "playing") return;
    if (game.turn === playerColor) return;

    let cancelled = false;
    setThinking(true);
    const timer = setTimeout(async () => {
      const aiMove = await bestMove(game.fen, depth, player.weaknesses);
      if (cancelled || !aiMove) {
        setThinking(false);
        return;
      }
      game.tryMove({
        from: aiMove.from as Square,
        to: aiMove.to as Square,
        promotion: (aiMove.promotion as "q" | "r" | "b" | "n") ?? "q",
      });
      setThinking(false);
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [game, game.fen, game.turn, game.status, bestMove, depth, player, playerColor]);

  useEffect(() => {
    if (!finished || !player) return;
    if (worstBlunder !== null || analysing) return;

    let cancelled = false;
    setAnalysing(true);

    const result: GameResult =
      game.winner == null
        ? "draw"
        : game.winner === playerColor
          ? "win"
          : "loss";
    setResultBanner(result);

    (async () => {
      // Post-game analysis runs in our in-house alpha-beta engine at depth 3.
      // Stockfish 18 Lite WASM is wired up (see src/lib/chess/stockfish-*)
      // and works in isolation, but the multiPV loop currently hangs on
      // some browser-worker edge case after the first call. Disabled here
      // until post-submit refactor — gameplay never depended on it.
      const analysis = await analyse(game.pgn, playerColor, 3);
      if (cancelled || !analysis) {
        setAnalysing(false);
        return;
      }

      const moveDelta =
        analysis.moveCount > 0
          ? ratingDeltaForMove(analysis.totalCpLoss / analysis.moveCount) *
            Math.min(analysis.moveCount, 30) /
            6
          : 0;

      const next: PlayerState = {
        ...player,
        rating: clampRating(
          player.rating + ratingDeltaForResult(result) + moveDelta,
        ),
        games: player.games + 1,
        wins: player.wins + (result === "win" ? 1 : 0),
        draws: player.draws + (result === "draw" ? 1 : 0),
        losses: player.losses + (result === "loss" ? 1 : 0),
        blunders: analysis.worstBlunder
          ? [analysis.worstBlunder, ...player.blunders].slice(0, 30)
          : player.blunders,
        weaknesses: analysis.worstBlunder
          ? {
              ...player.weaknesses,
              [analysis.worstBlunder.category]:
                player.weaknesses[analysis.worstBlunder.category] + 1,
            }
          : player.weaknesses,
      };
      savePlayer(next);
      setPlayer(next);
      setWorstBlunder(analysis.worstBlunder);
      setAccuracy(analysis.accuracy);
      setAnalysing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [finished, player, game.pgn, game.winner, analyse, worstBlunder, analysing, playerColor]);

  const handleNewGame = useCallback(() => {
    playerColorRef.current = playerColorRef.current === "w" ? "b" : "w";
    game.reset();
    setWorstBlunder(null);
    setAccuracy(null);
    setResultBanner(null);
  }, [game]);

  const handleResign = useCallback(() => {
    if (game.status !== "playing") return;
    if (!confirm("resign? this game ends as a loss.")) return;
    // End the game in-state so the post-game analysis flow fires
    game.forceEnd(playerColor);
  }, [game, playerColor]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-5 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2 font-hand text-[26px] leading-none text-ink transition-colors hover:text-red-ink"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          mimic
        </Link>
        <div className="flex items-center gap-3 font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
          <span>game · {(player?.games ?? 0) + 1}</span>
          <ThemeToggle />
        </div>
      </header>
      <div className="border-t-2 border-ink/15" />

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_280px] md:py-12">
        <div className="flex flex-col items-stretch gap-5">
          <div className="flex w-full items-end justify-between">
            <h1 className="font-hand text-[40px] leading-[0.9] text-ink md:text-[56px]">
              {finished
                ? "game over"
                : thinking
                  ? "mimic is thinking…"
                  : game.turn === playerColor
                    ? "your move"
                    : "mimic's move"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResign}
                disabled={finished}
                title="resign"
                aria-label="resign"
                className="flex size-10 items-center justify-center border-2 border-ink bg-paper-card text-ink transition-colors hover:bg-paper-deep disabled:opacity-30"
              >
                <Flag className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNewGame}
                title="new game"
                aria-label="new game"
                className="flex size-10 items-center justify-center border-2 border-ink bg-paper-card text-ink transition-colors hover:bg-paper-deep"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex w-full max-w-[520px] gap-3">
            <EvalBar
              fen={game.fen}
              orientation={playerColor === "w" ? "white" : "black"}
              className="self-stretch"
            />
            <div className="aspect-square flex-1 border-2 border-ink shadow-[6px_6px_0_var(--paper-dark)]">
              <ChessBoard
                fen={game.fen}
                orientation={playerColor === "w" ? "white" : "black"}
                allowMoves={!finished && game.turn === playerColor && !thinking}
                inCheck={game.inCheck}
                lastMove={lastMove}
                legalMovesFor={(sq) => game.legalMoves(sq)}
                onAttemptMove={(from, to) =>
                  Boolean(game.tryMove({ from, to }))
                }
              />
            </div>
          </div>

          <MoveStrip history={game.history} />

          {resultBanner && analysing && (
            <div className="flex items-center justify-center gap-2 border-2 border-ink/40 bg-paper-card px-4 py-3 font-typewriter text-[11px] uppercase tracking-[0.15em] text-ink-soft animate-fade-up">
              <Loader2 className="size-4 animate-spin" />
              mimic is finding the move that broke you…
            </div>
          )}
        </div>

        <SidePanel
          player={player}
          patternsCount={patternsCount}
          onOpenDossier={openDossier}
        />
      </main>

      {alexBriefOpen && player && (
        <AlexBrief player={player} onClose={closeAlexBrief} />
      )}

      {finished && worstBlunder && (
        <PostGameCard
          result={resultBanner ?? "draw"}
          accuracy={accuracy}
          blunder={worstBlunder}
          onReplay={handleNewGame}
          onClose={() => setWorstBlunder(null)}
        />
      )}

      {finished && !worstBlunder && !analysing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 animate-backdrop-in md:items-center">
          <div className="w-full max-w-md border-2 border-ink bg-paper-card p-6 text-center shadow-[8px_8px_0_var(--paper-dark)] animate-modal-rise">
            <div className="font-hand text-[44px] leading-none text-ink">
              {resultBanner === "win"
                ? "you won"
                : resultBanner === "loss"
                  ? "you lost"
                  : "draw"}
            </div>
            <p className="mt-3 font-typewriter text-[11px] uppercase tracking-[0.15em] text-ink-light">
              clean game — no real blunders this time
            </p>
            <button
              type="button"
              onClick={handleNewGame}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-ink px-6 py-3 font-typewriter text-[12px] uppercase tracking-[0.15em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
            >
              new game
            </button>
          </div>
        </div>
      )}

      {demoOpen && !alexBriefOpen && (
        <PostGameCard
          result="loss"
          accuracy={84}
          blunder={DEMO_MATE_BLUNDER}
          isDemo
          replayLabel="play your own game"
          onClose={() => {
            setDemoOpen(false);
            window.history.replaceState(null, "", "/play");
          }}
          onReplay={() => {
            setDemoOpen(false);
            window.history.replaceState(null, "", "/play");
          }}
        />
      )}
    </div>
  );
}

function MoveStrip({ history }: { history: { san: string }[] }) {
  if (history.length === 0) {
    return (
      <div className="font-hand text-[16px] text-ink-light max-w-[520px]">
        first move is yours.
      </div>
    );
  }
  // Group into pairs (white + black) for human-readable notation
  const pairs: { num: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: i / 2 + 1, w: history[i]?.san, b: history[i + 1]?.san });
  }
  return (
    <div
      className="max-w-[520px] overflow-x-auto whitespace-nowrap border-2 border-ink/20 bg-paper-card px-4 py-3 font-mono text-[13px] text-ink"
      role="log"
      aria-label="move history"
    >
      {pairs.map((p) => (
        <span key={p.num} className="mr-4 inline-block">
          <span className="text-ink-light">{p.num}.</span>{" "}
          <span className="font-semibold">{p.w ?? ""}</span>
          {p.b && (
            <>
              {" "}
              <span className="font-semibold">{p.b}</span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

function SidePanel({
  player,
  patternsCount,
  onOpenDossier,
}: {
  player: PlayerState | null;
  patternsCount: number;
  onOpenDossier: () => void;
}) {
  const top = player
    ? (Object.entries(player.weaknesses)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])[0] as
        | [keyof typeof CATEGORY_PHRASE, number]
        | undefined)
    : undefined;

  return (
    <aside className="hidden md:flex flex-col gap-4">
      <button
        type="button"
        onClick={onOpenDossier}
        className="group border-2 border-ink bg-paper-card p-4 text-left shadow-[4px_4px_0_var(--paper-dark)] transition-colors hover:bg-paper-deep"
        title="view mimic's dossier"
      >
        <div className="flex items-baseline justify-between font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
          <span>mimic · dossier</span>
          <span className="text-red-ink">●</span>
        </div>
        <div className="mt-2 font-hand text-[28px] leading-none text-ink">
          {patternsCount}{" "}
          <span className="text-[16px] text-ink-soft">
            {patternsCount === 1 ? "pattern" : "patterns"}
          </span>
        </div>
        {top ? (
          <p className="mt-3 font-hand text-[16px] leading-snug text-ink">
            today: hunting your{" "}
            <span className="text-red-ink">{CATEGORY_PHRASE[top[0]]}</span>.
          </p>
        ) : (
          <p className="mt-3 font-typewriter text-[10px] uppercase tracking-[0.15em] text-ink-light">
            no profile yet · play to build it
          </p>
        )}
      </button>

      {player && player.games > 0 && (
        <div className="border-2 border-ink/30 bg-paper p-4">
          <div className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
            record
          </div>
          <div className="mt-2 font-mono text-[15px] text-ink">
            {player.wins}–{player.draws}–{player.losses}
          </div>
          <div className="mt-1 font-typewriter text-[10px] uppercase tracking-[0.15em] text-ink-light">
            depth {ratingToDepth(player.rating)}{" "}
            <span className="opacity-60">/ adapts as you grow</span>
          </div>
        </div>
      )}
    </aside>
  );
}

function AlexBrief({
  player,
  onClose,
}: {
  player: PlayerState;
  onClose: () => void;
}) {
  const entries = Object.entries(player.weaknesses)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]) as [keyof typeof CATEGORY_PHRASE, number][];
  const top = entries[0];
  const isFresh = player.games === 0 || entries.length === 0;
  const isAlex = isAlexActive();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-backdrop-in">
      <div className="relative w-full max-w-lg border-2 border-ink bg-paper-card p-7 shadow-[10px_10px_0_var(--paper-dark)] animate-modal-rise md:p-9">
        <div className="font-typewriter text-[10px] uppercase tracking-[0.22em] text-red-ink">
          mimic · dossier
        </div>

        {isFresh ? (
          <>
            <h2 className="mt-2 font-hand text-[44px] leading-[0.95] text-ink md:text-[56px]">
              welcome.
            </h2>
            <p className="mt-3 font-typewriter text-[12px] uppercase leading-relaxed tracking-[0.14em] text-ink-soft">
              i have nothing on you yet.
              <br />
              play five games — and i'll start
              <br />
              mapping where you fall apart.
            </p>
            <ul className="mt-5 space-y-2">
              {(
                ["hanging-piece", "missed-tactic", "missed-mate", "weak-king", "lost-material", "positional"] as const
              ).map((cat) => (
                <li
                  key={cat}
                  className="flex items-baseline justify-between border-b-2 border-dashed border-ink/15 pb-2 font-typewriter text-[13px] uppercase tracking-[0.08em] text-ink-light"
                >
                  <span>{CATEGORY_PHRASE[cat]}</span>
                  <span className="font-hand text-[20px] leading-none text-ink-light">
                    —
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 font-hand text-[20px] leading-snug text-ink">
              first move is yours.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-hand text-[44px] leading-[0.95] text-ink md:text-[56px]">
              {isAlex ? "hello, alex." : "back."}
            </h2>
            <p className="mt-3 font-typewriter text-[12px] uppercase leading-relaxed tracking-[0.14em] text-ink-soft">
              i've watched {player.games} of your games.
              <br />
              here's what i'm going to use against you:
            </p>
            <ul className="mt-5 space-y-2">
              {entries.map(([cat, n]) => (
                <li
                  key={cat}
                  className="flex items-baseline justify-between border-b-2 border-dashed border-ink/15 pb-2 font-typewriter text-[13px] uppercase tracking-[0.08em] text-ink"
                >
                  <span>{CATEGORY_PHRASE[cat] ?? cat}</span>
                  <span className="font-hand text-[22px] leading-none text-red-ink">
                    {n}
                  </span>
                </li>
              ))}
            </ul>
            {top && (
              <p className="mt-5 font-hand text-[20px] leading-snug text-ink">
                today i'm hunting your{" "}
                <span className="text-red-ink">{CATEGORY_PHRASE[top[0]]}</span>.
              </p>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 border-2 border-ink bg-ink px-6 py-3 font-typewriter text-[12px] uppercase tracking-[0.15em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
        >
          your move →
        </button>
      </div>
    </div>
  );
}
