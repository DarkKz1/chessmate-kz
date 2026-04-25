"use client";

import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import { useMemo, useState } from "react";
import type { Move } from "chess.js";
import { cn } from "@/lib/utils";

type Props = {
  fen: string;
  onAttemptMove: (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => boolean;
  legalMovesFor?: (sq: Square) => Move[];
  orientation?: "white" | "black";
  allowMoves?: boolean;
  inCheck?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  className?: string;
};

const lightSquare = "var(--color-light-square)";
const darkSquare = "var(--color-dark-square)";

export function ChessBoard({
  fen,
  onAttemptMove,
  legalMovesFor,
  orientation = "white",
  allowMoves = true,
  inCheck = false,
  lastMove,
  className,
}: Props) {
  const [selected, setSelected] = useState<Square | null>(null);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(212, 160, 23, 0.32)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(212, 160, 23, 0.42)",
      };
    }

    if (selected) {
      styles[selected] = {
        backgroundColor: "rgba(212, 160, 23, 0.5)",
        boxShadow: "inset 0 0 0 3px var(--color-accent)",
      };
      const moves = legalMovesFor?.(selected) ?? [];
      for (const m of moves) {
        const target = m.to;
        styles[target] = m.captured
          ? {
              backgroundImage:
                "radial-gradient(circle, transparent 56%, rgba(193, 72, 72, 0.55) 57%)",
            }
          : {
              backgroundImage:
                "radial-gradient(circle, rgba(77, 124, 77, 0.55) 22%, transparent 23%)",
            };
      }
    }

    if (inCheck) {
      // chess.js doesn't tell us which king is in check, but we can compute from FEN
      const board = fen.split(" ")[0];
      const turn = fen.split(" ")[1];
      const ranks = board.split("/");
      for (let r = 0; r < 8; r++) {
        let file = 0;
        for (const ch of ranks[r]) {
          if (/\d/.test(ch)) {
            file += parseInt(ch, 10);
          } else {
            const isKing = ch.toLowerCase() === "k";
            const isCurrent =
              (turn === "w" && ch === "K") || (turn === "b" && ch === "k");
            if (isKing && isCurrent) {
              const sq = `${"abcdefgh"[file]}${8 - r}`;
              styles[sq] = {
                ...(styles[sq] ?? {}),
                boxShadow: "inset 0 0 0 4px var(--color-check)",
              };
            }
            file += 1;
          }
        }
      }
    }

    return styles;
  }, [selected, lastMove, legalMovesFor, inCheck, fen]);

  return (
    <div className={cn("relative", className)}>
      <Chessboard
        options={{
          id: "main-board",
          position: fen,
          boardOrientation: orientation,
          showNotation: true,
          showAnimations: true,
          animationDurationInMs: 220,
          allowDragging: allowMoves,
          allowDrawingArrows: true,
          lightSquareStyle: { backgroundColor: lightSquare },
          darkSquareStyle: { backgroundColor: darkSquare },
          dropSquareStyle: {
            backgroundColor: "rgba(212, 160, 23, 0.45)",
            boxShadow: "inset 0 0 0 3px var(--color-accent)",
          },
          squareStyles,
          boardStyle: {
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.45), 0 18px 30px -15px rgba(0,0,0,0.3)",
          },
          onSquareClick: ({ square, piece }) => {
            if (!allowMoves) return;
            const sq = square as Square;
            if (selected) {
              if (sq === selected) {
                setSelected(null);
                return;
              }
              const ok = onAttemptMove(selected, sq);
              setSelected(ok ? null : piece ? sq : null);
              return;
            }
            if (piece) setSelected(sq);
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare) return false;
            setSelected(null);
            return onAttemptMove(
              sourceSquare as Square,
              targetSquare as Square,
            );
          },
        }}
      />
    </div>
  );
}
