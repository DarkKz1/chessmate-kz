"use client";

import { useMemo } from "react";
import { Chess } from "chess.js";
import { evaluatePosition } from "@/lib/chess/evaluation";
import { cn } from "@/lib/utils";

type Props = {
  fen: string;
  /** Whose perspective to show — "w" puts white advantage on top */
  orientation?: "white" | "black";
  className?: string;
};

// Map centipawns to a 0-100 percentage (white share). 0 = full black, 100 = full white.
// Sigmoid keeps minor advantages from rendering as extreme.
function cpToWhitePercent(cp: number): number {
  if (Math.abs(cp) >= 50000) return cp > 0 ? 100 : 0;
  const k = 0.0035;
  const sigmoid = 1 / (1 + Math.exp(-cp * k));
  return Math.round(sigmoid * 100);
}

export function EvalBar({
  fen,
  orientation = "white",
  className,
}: Props) {
  const eval_ = useMemo(() => {
    try {
      const c = new Chess(fen);
      return evaluatePosition(c);
    } catch {
      return 0;
    }
  }, [fen]);

  const whitePercent = cpToWhitePercent(eval_);
  const isMate = Math.abs(eval_) >= 50000;
  const label = isMate
    ? eval_ > 0
      ? "M+"
      : "M−"
    : `${eval_ > 0 ? "+" : ""}${(eval_ / 100).toFixed(1)}`;

  // When orientation is "black", visually invert so the bottom of the bar
  // belongs to the player whose pieces are at the bottom of the board.
  const whiteAtTop = orientation === "white";
  const fillFromTopPct = whiteAtTop ? 100 - whitePercent : whitePercent;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between border-2 border-ink bg-paper-card text-[9px] font-mono text-ink-light overflow-hidden",
        className,
      )}
      style={{ width: 28, minHeight: 200 }}
      aria-label={`evaluation: ${label}`}
      title={`eval: ${label}`}
    >
      <div
        className="absolute inset-x-0 top-0 bg-ink transition-all duration-500 ease-out"
        style={{ height: `${fillFromTopPct}%` }}
      />
      <div className="relative z-10 mt-1 select-none">
        {whiteAtTop ? "" : label}
      </div>
      <div className="relative z-10 mb-1 select-none">
        {whiteAtTop ? label : ""}
      </div>
    </div>
  );
}
