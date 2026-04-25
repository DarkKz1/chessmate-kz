"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ArrowRight, Sparkles, Flame } from "lucide-react";
import { ChessBoard } from "./chess-board";
import { PostGameCard } from "./post-game-card";
import {
  loadPlayer,
  type PlayerState,
  type Blunder,
} from "@/lib/chess/player-store";

const SHOWCASE = [
  "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
  "d2d3", "f8c5", "c1g5", "h7h6", "g5f6", "d8f6",
];

export function LandingHero() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [pendingPuzzle, setPendingPuzzle] = useState<Blunder | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    const p = loadPlayer();
    setPlayer(p);
    const next = p.blunders.find((b) => !b.resolved);
    if (next) setPendingPuzzle(next);
  }, []);

  useEffect(() => {
    const game = new Chess();
    let i = 0;
    const id = setInterval(() => {
      if (i >= SHOWCASE.length) {
        game.reset();
        i = 0;
        setFen(game.fen());
        return;
      }
      const m = SHOWCASE[i++];
      try {
        game.move({ from: m.slice(0, 2), to: m.slice(2, 4) });
        setFen(game.fen());
      } catch {
        /* noop */
      }
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const refresh = () => {
    const p = loadPlayer();
    setPlayer(p);
    const next = p.blunders.find((b) => !b.resolved);
    setPendingPuzzle(next ?? null);
  };

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12 text-center md:py-20">
        <div className="flex flex-col items-center gap-5 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3 text-accent" />
            You vs You
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Шахматы,{" "}
            <span className="italic text-muted-foreground">учат</span>
            <br />
            тебя из ошибок
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            ИИ подстраивается под твой уровень. После партии — один точный
            ход, который решил всё. Завтра он вернётся как задача.
          </p>
          <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <Link
              href="/play"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background shadow-xl shadow-foreground/15 transition-transform hover:-translate-y-0.5"
            >
              {player && player.games > 0 ? "Продолжить" : "Играть"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/play?demo=1"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/40"
            >
              <Sparkles className="size-4 text-accent" />
              Как это работает
            </Link>
          </div>
          {player && player.games > 0 && (
            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span>{player.games} партий</span>
              <span aria-hidden>·</span>
              <span>уровень {Math.round(player.rating)}</span>
              {player.streak > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Flame className="size-3" />
                    {player.streak}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative w-full max-w-[440px] animate-fade-up">
          <div className="absolute -inset-4 rounded-[36px] bg-foreground/5 blur-2xl" />
          <div className="relative aspect-square w-full">
            <ChessBoard
              fen={fen}
              onAttemptMove={() => false}
              allowMoves={false}
            />
          </div>
        </div>

        {pendingPuzzle && (
          <button
            type="button"
            onClick={() => setPuzzleOpen(true)}
            className="group flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/40"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Утренняя задача
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                {pendingPuzzle.shortLesson}
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </section>

      {puzzleOpen && pendingPuzzle && (
        <PostGameCard
          result="draw"
          accuracy={null}
          blunder={pendingPuzzle}
          initialStage="puzzle"
          replayLabel="Сыграть партию"
          onReplay={() => {
            setPuzzleOpen(false);
            window.location.href = "/play";
          }}
          onClose={() => {
            setPuzzleOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
