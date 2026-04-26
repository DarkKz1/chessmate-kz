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
  const playerColorRef = useRef<"w" | "b">("w");

  useEffect(() => {
    setPlayer(loadPlayer());
    if (isDemo) {
      const t = setTimeout(() => setDemoOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [isDemo]);

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
        <ThemeToggle />
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

      {demoOpen && (
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

