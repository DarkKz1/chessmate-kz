"use client";

import {
  Crown,
  Flag,
  RotateCcw,
  Undo2,
  ArrowLeftRight,
} from "lucide-react";
import type { Move } from "chess.js";
import type { GameStatus } from "@/lib/chess/use-chess-game";
import { cn } from "@/lib/utils";

type Props = {
  board: React.ReactNode;
  title: string;
  subtitle?: string;
  whiteLabel?: string;
  blackLabel?: string;
  turn: "w" | "b";
  status: GameStatus;
  history: Move[];
  inCheck: boolean;
  winner: "w" | "b" | null;
  onReset: () => void;
  onUndo?: () => void;
  onFlip?: () => void;
  onResign?: () => void;
  rightPanel?: React.ReactNode;
};

const STATUS_LABEL: Record<GameStatus, string> = {
  playing: "В игре",
  checkmate: "Мат",
  stalemate: "Пат",
  draw: "Ничья",
  threefold: "Ничья (повторение)",
  insufficient: "Ничья (мало материала)",
};

export function GameShell({
  board,
  title,
  subtitle,
  whiteLabel = "Белые",
  blackLabel = "Чёрные",
  turn,
  status,
  history,
  inCheck,
  winner,
  onReset,
  onUndo,
  onFlip,
  onResign,
  rightPanel,
}: Props) {
  const finished = status !== "playing";
  const moveRows: { num: number; w?: Move; b?: Move }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    moveRows.push({ num: i / 2 + 1, w: history[i], b: history[i + 1] });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1fr_320px] md:px-8 md:py-10">
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onFlip && (
              <ToolButton onClick={onFlip} label="Перевернуть">
                <ArrowLeftRight className="size-4" />
              </ToolButton>
            )}
            {onUndo && (
              <ToolButton onClick={onUndo} label="Отменить ход">
                <Undo2 className="size-4" />
              </ToolButton>
            )}
            {onResign && (
              <ToolButton onClick={onResign} label="Сдаться">
                <Flag className="size-4" />
              </ToolButton>
            )}
            <ToolButton onClick={onReset} label="Новая партия">
              <RotateCcw className="size-4" />
            </ToolButton>
          </div>
        </header>

        <PlayerStrip
          label={turn === "b" ? `${blackLabel} • ход` : blackLabel}
          color="b"
          active={turn === "b" && !finished}
          inCheck={inCheck && turn === "b"}
        />

        <div className="aspect-square w-full">{board}</div>

        <PlayerStrip
          label={turn === "w" ? `${whiteLabel} • ход` : whiteLabel}
          color="w"
          active={turn === "w" && !finished}
          inCheck={inCheck && turn === "w"}
        />

        {finished && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
            <div className="font-display text-xl font-bold">
              {status === "checkmate"
                ? `${winner === "w" ? whiteLabel : blackLabel} побеждают!`
                : STATUS_LABEL[status]}
            </div>
            <button
              type="button"
              onClick={onReset}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <RotateCcw className="size-4" />
              Сыграть ещё
            </button>
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        {rightPanel}

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Ходы
            </h3>
            <span className="font-mono text-xs text-muted-foreground">
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {moveRows.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Сделай первый ход
              </div>
            ) : (
              <ol className="space-y-0.5">
                {moveRows.map((row) => (
                  <li
                    key={row.num}
                    className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2 rounded-md px-2 py-1 font-mono text-sm hover:bg-muted/40"
                  >
                    <span className="text-muted-foreground">{row.num}.</span>
                    <span className="font-semibold">{row.w?.san ?? ""}</span>
                    <span className="font-semibold">{row.b?.san ?? ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

function PlayerStrip({
  label,
  color,
  active,
  inCheck,
}: {
  label: string;
  color: "w" | "b";
  active: boolean;
  inCheck: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border bg-card px-4 py-2.5 transition-colors",
        active ? "border-primary/40 shadow-sm" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border",
            color === "w"
              ? "border-border bg-light-square text-zinc-900"
              : "border-border bg-dark-square text-amber-50",
          )}
        >
          <Crown className="size-4" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-bold">{label}</div>
          {inCheck && (
            <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
              Шах
            </div>
          )}
        </div>
      </div>
      {active && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          ход
        </div>
      )}
    </div>
  );
}
