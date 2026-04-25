"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "./chess-board";

const SHOWCASE_MOVES = [
  "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "d2d3", "f8c5", "c1g5",
  "h7h6", "g5f6", "d8f6", "b1c3", "d7d6", "h2h3", "c8e6", "c4e6", "f6e6",
  "d1d2", "e8g8", "e1g1", "a8d8",
];

export function LandingBoard() {
  const [fen, setFen] = useState(new Chess().fen());

  useEffect(() => {
    const game = new Chess();
    let i = 0;
    const interval = setInterval(() => {
      if (i >= SHOWCASE_MOVES.length) {
        game.reset();
        i = 0;
        setFen(game.fen());
        return;
      }
      const m = SHOWCASE_MOVES[i++];
      try {
        game.move({ from: m.slice(0, 2), to: m.slice(2, 4) });
        setFen(game.fen());
      } catch {
        /* noop */
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-primary/20 via-accent/15 to-steppe/15 blur-2xl" />
      <div className="absolute -inset-2 rounded-[28px] border border-border/60 bg-card/40 backdrop-blur-sm" />
      <div className="relative aspect-square w-full max-w-[480px] mx-auto p-3 md:p-4">
        <ChessBoard
          fen={fen}
          onAttemptMove={() => false}
          allowMoves={false}
        />
      </div>
      <div className="relative mx-auto mt-3 flex max-w-[480px] items-center justify-between rounded-xl bg-card/60 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-steppe animate-pulse" />
          Live demo
        </span>
        <span className="font-mono">Italian Game</span>
      </div>
    </div>
  );
}
