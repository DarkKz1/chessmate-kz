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
import { analyseGameWithStockfish } from "@/lib/chess/stockfish-analyse";

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
      // Try Stockfish 18 (Lite NNUE) first — accurate blunder detection.
      // Falls back to our in-house alpha-beta engine if Stockfish fails to
      // load (no internet, blocked worker, etc).
      let analysis = await analyseGameWithStockfish(game.pgn, playerColor, 12);
      if (!analysis) {
        analysis = await analyse(game.pgn, playerColor, 3);
      }
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
    if (!confirm("resign? this game ends as a loss.")) return;
    game.reset();
  }, [game]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b-2 border-ink/30 px-4 py-4 md:px-10">
        <Link
          href="/"
          className="group flex items-center gap-2 font-hand text-[26px] leading-none text-ink transition-colors hover:text-red-ink"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          mimic
        </Link>
        <div className="flex items-center gap-3">
          {player && (
            <button
              type="button"
              onClick={openDossier}
              className="flex items-center gap-2 border-2 border-ink/30 bg-paper-card px-3 py-1.5 font-typewriter text-[10px] uppercase tracking-[0.16em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              title="view mimic's dossier on you"
            >
              <span className="text-red-ink">●</span>
              {patternsCount} {patternsCount === 1 ? "pattern" : "patterns"}
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
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

        <div className="flex w-full max-w-[640px] gap-3">
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

        {resultBanner && analysing && (
          <div className="flex items-center justify-center gap-2 border-2 border-ink/40 bg-paper-card px-4 py-3 font-typewriter text-[11px] uppercase tracking-[0.15em] text-ink-soft animate-fade-up">
            <Loader2 className="size-4 animate-spin" />
            mimic is finding the move that broke you…
          </div>
        )}
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
