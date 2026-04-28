"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ArrowRight } from "lucide-react";
import { ChessBoard } from "./chess-board";
import { PostGameCard } from "./post-game-card";
import {
  loadPlayer,
  type PlayerState,
  type Blunder,
} from "@/lib/chess/player-store";
import { seedAlex } from "@/lib/chess/demo-persona";

// A real-feeling blunder we showcase on the landing page. Black to move —
// played Bb5+ (looks active), but Nxe5 was the tactic Mimic would punish you
// for missing. The arrows + handwritten margin note tell the whole story
// before a click.
const SHOWCASE_FEN =
  "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
const SHOWCASE_ARROWS = [
  // played — red ink (blundered move) — Bg5
  { from: "c1", to: "g5", color: "rgba(184, 52, 30, 0.65)" },
  // best — blue ink (the move you missed) — d4
  { from: "d2", to: "d4", color: "#1c2a4a" },
];

export function LandingHero() {
  const [pendingPuzzle, setPendingPuzzle] = useState<Blunder | null>(null);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    const p = loadPlayer();
    setPlayer(p);
    const next = p.blunders.find((b) => !b.resolved);
    if (next) setPendingPuzzle(next);
  }, []);

  const startAsAlex = () => {
    seedAlex();
    window.location.href = "/play";
  };

  const refresh = () => {
    const p = loadPlayer();
    setPlayer(p);
    const next = p.blunders.find((b) => !b.resolved);
    setPendingPuzzle(next ?? null);
  };

  const hasGames = player && player.games > 0;

  return (
    <>
      <section className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-16 pt-6 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-12">
        {/* LEFT PAGE — concept + CTA */}
        <div className="relative flex flex-col items-start gap-8 md:pr-4 animate-fade-up">
          <h1 className="font-hand text-[58px] font-semibold leading-[0.92] tracking-tight text-ink md:text-[88px]">
            chess that
            <br />
            <span className="relative inline-block text-red-ink">
              remembers
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-[-6px] inset-y-[-2px] -rotate-1 rounded-[40%] border-[2px] border-red-ink/70"
              />
            </span>
            <br />
            your mistakes.
          </h1>

          <p className="max-w-md font-typewriter text-[12px] uppercase leading-relaxed tracking-[0.16em] text-ink-soft md:text-[13px]">
            an opponent built from your blunders.
            <br />
            every weakness you reveal — mimic learns,
            <br />
            and plays it back at you.
          </p>

          {hasGames ? (
            <Link
              href="/play"
              className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-9 py-4 font-typewriter text-[15px] uppercase tracking-[0.12em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
            >
              continue
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={startAsAlex}
                className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-9 py-4 font-typewriter text-[15px] uppercase tracking-[0.12em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
              >
                play as alex (demo)
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
              <Link
                href="/play"
                className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light underline decoration-dashed underline-offset-4 hover:text-ink"
              >
                or start fresh →
              </Link>
            </div>
          )}

        </div>

        {/* RIGHT PAGE — showcase blunder */}
        <div className="relative flex flex-col gap-3 md:pl-4 animate-fade-up">
          {/* Page-edge crease — visible only on md+ */}
          <div
            aria-hidden
            className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-ink/15"
          />

          <div className="flex items-baseline justify-between font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
            <span>position #14 · italian game</span>
            <span>black to move</span>
          </div>

          <div className="relative aspect-square w-full max-w-[440px] animate-breath border-2 border-ink shadow-[6px_6px_0_var(--paper-dark)]">
            <ChessBoard
              fen={SHOWCASE_FEN}
              onAttemptMove={() => false}
              allowMoves={false}
              arrows={SHOWCASE_ARROWS}
            />
          </div>

          {/* Handwritten margin note pointing at the board */}
          <div className="relative mt-3 max-w-[440px]">
            <p className="font-hand text-[22px] leading-snug text-ink md:text-[26px] animate-ink-bleed">
              the knight reached into nothing.
              <br />
              <span className="relative inline-block text-red-ink">
                d4
                <svg
                  aria-hidden
                  className="ink-underline-svg absolute left-[-2px] right-[-2px] -bottom-1"
                  viewBox="0 0 60 8"
                  preserveAspectRatio="none"
                  width="100%"
                  height="8"
                >
                  <path
                    d="M2 5 Q 15 1 30 4 T 58 3"
                    stroke="var(--red-ink)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <span className="text-ink-soft">was the line.</span>
            </p>
            <p className="mt-2 font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
              category · missed-tactic · −1.8
            </p>
          </div>
        </div>

        {/* If the user has a yesterday puzzle, surface it under the spread */}
        {pendingPuzzle && (
          <button
            type="button"
            onClick={() => setPuzzleOpen(true)}
            className="group col-span-full mt-4 flex w-full items-center gap-3 border-2 border-ink bg-paper-card p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-paper-deep"
          >
            <div className="flex size-10 items-center justify-center border-2 border-red-ink bg-red-mute font-typewriter text-red-ink">
              !
            </div>
            <div className="flex-1">
              <div className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
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
