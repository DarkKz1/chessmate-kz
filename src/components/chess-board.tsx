"use client";

import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Move } from "chess.js";
import { playTock } from "@/lib/audio";
import { cn } from "@/lib/utils";

type Props = {
  fen: string;
  onAttemptMove: (from: Square, to: Square, promotion?: "q" | "r" | "b" | "n") => boolean;
  legalMovesFor?: (sq: Square) => Move[];
  orientation?: "white" | "black";
  allowMoves?: boolean;
  inCheck?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  arrows?: Array<{ from: string; to: string; color?: string }>;
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
  arrows,
  className,
}: Props) {
  const [selected, setSelected] = useState<Square | null>(null);

  // Play a soft tock when the position changes after first render. We
  // skip the initial mount so opening the board doesn't fire a sound.
  const lastFenRef = useRef<string>(fen);
  useEffect(() => {
    if (lastFenRef.current !== fen) {
      lastFenRef.current = fen;
      if (allowMoves || lastMove) playTock();
    }
  }, [fen, allowMoves, lastMove]);

  const externalArrows = useMemo(
    () =>
      (arrows ?? []).map((a) => ({
        startSquare: a.from,
        endSquare: a.to,
        color: a.color ?? "var(--color-accent)",
      })),
    [arrows],
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(28, 42, 74, 0.16)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(28, 42, 74, 0.26)",
      };
    }

    if (selected) {
      styles[selected] = {
        backgroundColor: "rgba(28, 42, 74, 0.22)",
        boxShadow: "inset 0 0 0 3px var(--color-ink)",
      };
      const moves = legalMovesFor?.(selected) ?? [];
      for (const m of moves) {
        const target = m.to;
        styles[target] = m.captured
          ? {
              backgroundImage:
                "radial-gradient(circle, transparent 54%, var(--color-red-ink) 55%, var(--color-red-ink) 60%, transparent 61%)",
            }
          : {
              backgroundImage:
                "radial-gradient(circle, rgba(28, 42, 74, 0.55) 18%, transparent 19%)",
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
                boxShadow: "inset 0 0 0 4px var(--color-red-ink)",
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
          arrows: externalArrows,
          arrowOptions: {
            color: "var(--color-ink)",
            secondaryColor: "rgba(184, 52, 30, 0.7)",
            tertiaryColor: "rgba(61, 107, 61, 0.7)",
            arrowLengthReducerDenominator: 14,
            sameTargetArrowLengthReducerDenominator: 4,
            arrowWidthDenominator: 4,
            activeArrowWidthMultiplier: 1.2,
            opacity: 0.92,
            activeOpacity: 0.55,
            arrowStartOffset: 0.18,
          },
          lightSquareStyle: { backgroundColor: lightSquare },
          darkSquareStyle: { backgroundColor: darkSquare },
          dropSquareStyle: {
            backgroundColor: "rgba(28, 42, 74, 0.18)",
            boxShadow: "inset 0 0 0 3px var(--color-ink)",
          },
          squareStyles,
          boardStyle: {
            borderRadius: "0px",
            overflow: "hidden",
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
