"use client";

import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Sparkles, X } from "lucide-react";
import { ChessBoard } from "./chess-board";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { playSolved } from "@/lib/audio";
import {
  markBlunderResolved,
  type Blunder,
} from "@/lib/chess/player-store";

const RESULT_LABEL: Record<"win" | "loss" | "draw", string> = {
  win: "Победа",
  loss: "Поражение",
  draw: "Ничья",
};

const CATEGORY_LABEL: Record<Blunder["category"], string> = {
  "missed-mate": "Пропущенный мат",
  "lost-material": "Потеря материала",
  "missed-tactic": "Пропущенная тактика",
  "hanging-piece": "Подставленная фигура",
  "weak-king": "Слабый король",
  positional: "Неточность",
};

export function PostGameCard({
  result,
  accuracy,
  blunder,
  onReplay,
  onClose,
  initialStage = "reveal",
  replayLabel = "Сыграть ещё",
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

  // Compute the from→to squares for the best move (for the arrow overlay
  // shown during reveal stage). Done once per blunder.
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
                  color: "rgba(193, 72, 72, 0.55)",
                },
              ]
            : []),
          { from: bestArrow.from, to: bestArrow.to, color: "#d4a017" },
        ]
      : stage === "solved" && bestArrow
        ? [{ from: bestArrow.from, to: bestArrow.to, color: "#4d7c4d" }]
        : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-md animate-backdrop-in md:items-center">
      <div className="animate-modal-rise relative flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            {isDemo ? (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                Пример
              </span>
            ) : (
              <>
                <span>{RESULT_LABEL[result]}</span>
                {accuracy !== null && (
                  <span className="font-mono">
                    · точность {Math.round(accuracy)}%
                  </span>
                )}
              </>
            )}
          </div>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight md:text-4xl">
            {stage === "puzzle"
              ? "Найди лучший ход"
              : stage === "solved"
                ? "Запомнил"
                : "Этот ход решил всё"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {stage === "puzzle"
              ? "Та же позиция. Сделай ход, который ты пропустил."
              : stage === "solved"
                ? "Эта позиция вернётся завтра как утренняя задача."
                : blunder.shortLesson}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="aspect-square w-full max-w-[260px]">
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
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Категория
              </div>
              <div className="mt-1 font-display text-lg font-bold">
                {CATEGORY_LABEL[blunder.category]}
              </div>
            </div>

            {stage !== "puzzle" && (
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Ты сыграл" value={blunder.played} />
                <Stat label="Лучше было" value={blunder.best} accent />
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed">
              {stage === "puzzle" ? (
                <span className="text-muted-foreground">
                  Подсказка: ход называется <span className="font-mono font-semibold text-foreground">{blunder.best.replace(/[+#]$/, "?…")}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Эта позиция сохранилась — завтра решишь её ещё раз свежим
                  взглядом.
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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              Реши сам
            </button>
          )}
          {stage === "puzzle" && (
            <button
              type="button"
              onClick={() => {
                puzzleGame.reset(blunder.fen);
                setStage("reveal");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted"
            >
              Показать ответ
            </button>
          )}
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="size-4" />
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
      className={`rounded-2xl border p-4 ${
        accent ? "border-accent/40 bg-accent/10" : "border-border bg-background"
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-bold ${
          accent ? "text-accent-foreground" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
