"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { X } from "lucide-react";
import { ChessBoard } from "./chess-board";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { playSolved } from "@/lib/audio";
import {
  markBlunderResolved,
  type Blunder,
} from "@/lib/chess/player-store";

const RESULT_LABEL: Record<"win" | "loss" | "draw", string> = {
  win: "you won",
  loss: "you lost",
  draw: "draw",
};

const CATEGORY_LABEL: Record<Blunder["category"], string> = {
  "missed-mate": "missed mate",
  "lost-material": "material lost",
  "missed-tactic": "missed tactic",
  "hanging-piece": "hung a piece",
  "weak-king": "king exposed",
  positional: "positional slip",
};

export function PostGameCard({
  result,
  accuracy,
  blunder,
  onReplay,
  onClose,
  initialStage = "reveal",
  replayLabel = "play again",
  isDemo = false,
}: {
  result: "win" | "loss" | "draw";
  accuracy: number | null;
  blunder: Blunder;
  onReplay: () => void;
  onClose: () => void;
  initialStage?: "reveal" | "puzzle" | "solved";
  replayLabel?: string;
  isDemo?: boolean;
}) {
  const [stage, setStage] = useState<"reveal" | "puzzle" | "solved">(initialStage);
  const puzzleGame = useChessGame(blunder.fen);

  const bestArrow = useMemo(() => {
    try {
      const c = new Chess(blunder.fen);
      const m = c.move(blunder.best);
      if (!m) return null;
      return { from: m.from as string, to: m.to as string };
    } catch {
      return null;
    }
  }, [blunder.fen, blunder.best]);

  const playedArrow = useMemo(() => {
    try {
      const c = new Chess(blunder.fen);
      const m = c.move(blunder.played);
      if (!m) return null;
      return { from: m.from as string, to: m.to as string };
    } catch {
      return null;
    }
  }, [blunder.fen, blunder.played]);

  const arrows =
    stage === "reveal" && bestArrow
      ? [
          ...(playedArrow
            ? [
                {
                  from: playedArrow.from,
                  to: playedArrow.to,
                  color: "rgba(184, 52, 30, 0.6)",
                },
              ]
            : []),
          { from: bestArrow.from, to: bestArrow.to, color: "#1c2a4a" },
        ]
      : stage === "solved" && bestArrow
        ? [{ from: bestArrow.from, to: bestArrow.to, color: "#3d6b3d" }]
        : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 animate-backdrop-in md:items-center">
      <div className="animate-modal-rise relative flex w-full max-w-3xl flex-col gap-6 border-2 border-ink bg-paper-card p-6 shadow-[10px_10px_0_var(--paper-dark)] md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="absolute right-4 top-4 flex size-9 items-center justify-center border-2 border-ink/20 text-ink-light transition-colors hover:border-ink hover:bg-paper-deep hover:text-ink"
        >
          <X className="size-4" />
        </button>

        <div>
          <div className="flex items-center gap-3 font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
            {isDemo ? (
              <span className="stamp">example</span>
            ) : (
              <>
                <span>{RESULT_LABEL[result]}</span>
                {accuracy !== null && (
                  <>
                    <span aria-hidden>·</span>
                    <span>accuracy {Math.round(accuracy)}%</span>
                  </>
                )}
              </>
            )}
          </div>
          <h2 className="mt-2 font-hand text-[44px] leading-none text-ink md:text-[60px]">
            {stage === "puzzle"
              ? "find the move"
              : stage === "solved"
                ? "remembered."
                : "this move broke you."}
          </h2>
          <p className="mt-3 font-typewriter text-[12px] uppercase tracking-[0.12em] text-ink-soft md:text-[13px]">
            {stage === "puzzle"
              ? "same position. play the move you missed."
              : stage === "solved"
                ? "this position is saved — it returns tomorrow."
                : blunder.shortLesson}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="aspect-square w-full max-w-[260px] border-2 border-ink shadow-[4px_4px_0_var(--paper-dark)]">
            <ChessBoard
              fen={stage === "puzzle" ? puzzleGame.fen : blunder.fen}
              allowMoves={stage === "puzzle"}
              arrows={arrows}
              legalMovesFor={(sq: Square) => puzzleGame.legalMoves(sq)}
              onAttemptMove={(from, to) => {
                const move = puzzleGame.tryMove({ from, to });
                if (!move) return false;
                if (move.san === blunder.best) {
                  markBlunderResolved(blunder.fen);
                  playSolved();
                  setStage("solved");
                  return true;
                }
                puzzleGame.undo();
                return false;
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="border-2 border-ink/40 bg-paper p-4">
              <div className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
                category
              </div>
              <div className="mt-1 font-hand text-[28px] leading-none text-ink">
                {CATEGORY_LABEL[blunder.category]}
              </div>
            </div>

            {stage !== "puzzle" && (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="you played" value={blunder.played} />
                <Stat label="best move" value={blunder.best} accent />
              </div>
            )}

            <div className="border-2 border-ink/40 bg-paper p-4 font-typewriter text-[12px] leading-relaxed">
              {stage === "puzzle" ? (
                <span className="text-ink-soft">
                  hint: starts with{" "}
                  <span className="font-mono font-semibold text-ink">
                    {blunder.best.replace(/[+#]$/, "?…")}
                  </span>
                </span>
              ) : (
                <span className="text-ink-soft">
                  this position is saved. tomorrow morning it returns —
                  fresh eyes, second chance.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
          {stage === "reveal" && (
            <button
              type="button"
              onClick={() => setStage("puzzle")}
              className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-paper-card px-5 py-2.5 font-typewriter text-[12px] uppercase tracking-[0.15em] text-ink transition-colors hover:bg-paper-deep"
            >
              solve it yourself
            </button>
          )}
          {stage === "puzzle" && (
            <button
              type="button"
              onClick={() => {
                puzzleGame.reset(blunder.fen);
                setStage("reveal");
              }}
              className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-paper-card px-5 py-2.5 font-typewriter text-[12px] uppercase tracking-[0.15em] text-ink transition-colors hover:bg-paper-deep"
            >
              show answer
            </button>
          )}
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-6 py-2.5 font-typewriter text-[12px] uppercase tracking-[0.15em] text-paper transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink-soft)]"
          >
            {replayLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`border-2 p-4 ${
        accent ? "border-red-ink bg-red-mute" : "border-ink/40 bg-paper"
      }`}
    >
      <div className="font-typewriter text-[10px] uppercase tracking-[0.18em] text-ink-light">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-bold ${
          accent ? "text-red-ink" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
