"use client";

import { Chess, type Move, type Square, type PieceSymbol } from "chess.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type GameStatus =
  | "playing"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "threefold"
  | "insufficient";

export type ChessSide = "w" | "b";

export type GameSnapshot = {
  fen: string;
  pgn: string;
  turn: ChessSide;
  status: GameStatus;
  inCheck: boolean;
  history: Move[];
  winner: ChessSide | null;
};

function snapshotOf(chess: Chess): GameSnapshot {
  let status: GameStatus = "playing";
  let winner: ChessSide | null = null;

  if (chess.isCheckmate()) {
    status = "checkmate";
    winner = chess.turn() === "w" ? "b" : "w";
  } else if (chess.isStalemate()) {
    status = "stalemate";
  } else if (chess.isThreefoldRepetition()) {
    status = "threefold";
  } else if (chess.isInsufficientMaterial()) {
    status = "insufficient";
  } else if (chess.isDraw()) {
    status = "draw";
  }

  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn(),
    status,
    inCheck: chess.inCheck(),
    history: chess.history({ verbose: true }) as Move[],
    winner,
  };
}

export type MoveAttempt = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

export function useChessGame(initialFen?: string) {
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() =>
    snapshotOf(chessRef.current),
  );

  useEffect(() => {
    if (!initialFen) return;
    try {
      chessRef.current.load(initialFen);
      setSnapshot(snapshotOf(chessRef.current));
    } catch {
      /* invalid fen, keep current */
    }
  }, [initialFen]);

  const tryMove = useCallback((m: MoveAttempt): Move | null => {
    try {
      const move = chessRef.current.move({
        from: m.from,
        to: m.to,
        promotion: m.promotion ?? "q",
      });
      if (!move) return null;
      setSnapshot(snapshotOf(chessRef.current));
      return move;
    } catch {
      return null;
    }
  }, []);

  const applyUCIMove = useCallback((uci: string): Move | null => {
    if (uci.length < 4) return null;
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = (uci.length > 4 ? uci[4] : undefined) as
      | PieceSymbol
      | undefined;
    return tryMove({ from, to, promotion });
  }, [tryMove]);

  const reset = useCallback((fen?: string) => {
    chessRef.current = new Chess(fen);
    setSnapshot(snapshotOf(chessRef.current));
  }, []);

  const undo = useCallback(() => {
    chessRef.current.undo();
    setSnapshot(snapshotOf(chessRef.current));
  }, []);

  const legalMoves = useCallback(
    (square: Square) =>
      chessRef.current.moves({ square, verbose: true }) as Move[],
    [],
  );

  const api = useMemo(
    () => ({
      ...snapshot,
      tryMove,
      applyUCIMove,
      reset,
      undo,
      legalMoves,
      chess: chessRef.current,
    }),
    [snapshot, tryMove, applyUCIMove, reset, undo, legalMoves],
  );

  return api;
}
