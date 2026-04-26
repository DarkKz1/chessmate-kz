"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ArrowRight, Flame } from "lucide-react";
import { ChessBoard } from "./chess-board";
import { PostGameCard } from "./post-game-card";
import {
  loadPlayer,
  type PlayerState,
  type Blunder,
} from "@/lib/chess/player-store";
import { seedAlex, isAlexActive, clearPersona } from "@/lib/chess/demo-persona";

const SHOWCASE = [
  "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6",
  "d2d3", "f8c5", "c1g5", "h7h6", "g5f6", "d8f6",
];

export function LandingHero() {
  const [fen, setFen] = useState(() => new Chess().fen());
  const [pendingPuzzle, setPendingPuzzle] = useState<Blunder | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [asAlex, setAsAlex] = useState(false);

  useEffect(() => {
    const p = loadPlayer();
    setPlayer(p);
    setAsAlex(isAlexActive());
    const next = p.blunders.find((b) => !b.resolved);
    if (next) setPendingPuzzle(next);
  }, []);

  const startAsAlex = () => {
    seedAlex();
    window.location.href = "/play";
  };

  const resetSelf = () => {
    if (!confirm("clear your data and start fresh?")) return;
    clearPersona();
    window.location.reload();
  };

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
      <section className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-12 px-4 py-12 text-center md:py-24">
        <div className="flex flex-col items-center gap-7 animate-fade-up">
          <h1 className="font-hand text-[64px] font-semibold leading-[0.92] tracking-tight text-ink md:text-[128px]">
            chess that
            <br />
            <span className="text-red-ink">remembers</span>
            <br />
            your mistakes.
          </h1>

          {player && player.games > 0 ? (
            <Link
              href="/play"
              className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-9 py-4 font-typewriter text-[15px] uppercase tracking-[0.12em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
            >
              continue
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={startAsAlex}
              className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-9 py-4 font-typewriter text-[15px] uppercase tracking-[0.12em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
            >
              play
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}

          {player && player.games > 0 && (
            <button
              type="button"
              onClick={resetSelf}
              className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light underline decoration-dashed underline-offset-4 hover:text-ink"
            >
              start fresh
            </button>
          )}
        </div>

        <div className="relative w-full max-w-[440px] animate-fade-up">
          <div className="relative aspect-square w-full border-2 border-ink shadow-[6px_6px_0_var(--paper-dark)]">
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
            className="group flex w-full max-w-md items-center gap-3 border-2 border-ink bg-paper-card p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-paper-deep"
          >
            <div className="flex size-10 items-center justify-center border-2 border-red-ink bg-red-mute font-typewriter text-red-ink">
              !
            </div>
            <div className="flex-1">
              <div className="font-typewriter text-[11px] uppercase tracking-wider text-ink-light">
                yesterday's blunder
              </div>
              <div className="mt-0.5 font-hand text-[20px] text-ink">
                {pendingPuzzle.shortLesson}
              </div>
            </div>
            <ArrowRight className="size-4 text-ink-light transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </section>

      {puzzleOpen && pendingPuzzle && (
        <PostGameCard
          result="draw"
          accuracy={null}
          blunder={pendingPuzzle}
          initialStage="puzzle"
          replayLabel="play a game"
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
