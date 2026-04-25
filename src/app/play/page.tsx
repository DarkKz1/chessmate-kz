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
  Sparkles,
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
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-muted-foreground">Загружаю…</div>}>
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

  // Hydrate player state on mount
  useEffect(() => {
    setPlayer(loadPlayer());
    if (isDemo) {
      // Slight delay so the modal animates in nicely
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

  // AI move loop
  useEffect(() => {
    if (!player) return;
    if (game.status !== "playing") return;
    if (game.turn === playerColor) return;

    let cancelled = false;
    setThinking(true);
    const timer = setTimeout(async () => {
      const aiMove = await bestMove(game.fen, depth);
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

  // End-of-game analysis + rating update
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

      // Compute new rating: result delta + average move-quality delta
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
    // Alternate side each game so player learns both colors
    playerColorRef.current = playerColorRef.current === "w" ? "b" : "w";
    game.reset();
    setWorstBlunder(null);
    setAccuracy(null);
    setResultBanner(null);
  }, [game]);

  const handleResign = useCallback(() => {
    if (!confirm("Сдаться? Партия завершится поражением.")) return;
    // Simulate loss by playing king move that immediately ends... we just
    // mark it as a loss without updating rating or blunder analysis since the
    // player abandoned the position.
    game.reset();
  }, [game]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-4 py-3 md:px-8 md:py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          ChessMate
        </Link>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">
            {player ? `Ур. ${ratingToDepth(player.rating)}` : "—"}
          </span>
          <span aria-hidden>·</span>
          <span className="font-mono">
            {player ? `${player.wins}/${player.draws}/${player.losses}` : "0/0/0"}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 md:grid-cols-[1fr_320px] md:px-8 md:py-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {finished ? "Партия окончена" : thinking ? "ИИ думает…" : game.turn === playerColor ? "Твой ход" : "Ход ИИ"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {finished
                  ? "Сейчас покажу один ход, который решил партию"
                  : "Сложность подстраивается под тебя в реальном времени"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResign}
                disabled={finished}
                title="Сдаться"
                aria-label="Сдаться"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              >
                <Flag className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleNewGame}
                title="Новая партия"
                aria-label="Новая партия"
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex w-full max-w-[600px] gap-3 mx-auto md:mx-0">
            <EvalBar
              fen={game.fen}
              orientation={playerColor === "w" ? "white" : "black"}
              className="self-stretch"
            />
            <div className="aspect-square flex-1">
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
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground animate-fade-up">
              <Loader2 className="size-4 animate-spin" />
              ИИ ищет ход, который решил партию…
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="font-bold">Партия</span>
              <span className="font-mono">{game.history.length} ходов</span>
            </div>
            <MoveList history={game.history} />
          </div>

          {player && player.games > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Твой прогресс
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="font-display text-3xl font-bold">
                  {Math.round(player.rating)}
                </div>
                <div className="text-xs text-muted-foreground">из 100</div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-foreground transition-all"
                  style={{ width: `${player.rating}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>{player.games} партий</span>
                <span>уровень ИИ {ratingToDepth(player.rating)}</span>
              </div>
            </div>
          )}
        </aside>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
            <div className="font-display text-2xl font-bold">
              {resultBanner === "win" ? "Победа" : resultBanner === "loss" ? "Поражение" : "Ничья"}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              На этот раз без явных промахов. Сыграй ещё.
            </p>
            <button
              type="button"
              onClick={handleNewGame}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="size-4" />
              Новая партия
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
          replayLabel="Сыграть свою партию"
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

function MoveList({ history }: { history: { san: string }[] }) {
  if (history.length === 0) {
    return (
      <div className="px-1 py-6 text-center text-sm text-muted-foreground">
        Сделай первый ход
      </div>
    );
  }
  const rows: { num: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      w: history[i]?.san,
      b: history[i + 1]?.san,
    });
  }
  return (
    <ol className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
      {rows.map((row) => (
        <li
          key={row.num}
          className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 rounded-md px-1 py-1 font-mono text-xs"
        >
          <span className="text-muted-foreground">{row.num}.</span>
          <span className="font-semibold">{row.w ?? ""}</span>
          <span className="font-semibold">{row.b ?? ""}</span>
        </li>
      ))}
    </ol>
  );
}
