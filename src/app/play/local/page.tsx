"use client";

import { useState } from "react";
import type { Square } from "chess.js";
import { ChessBoard } from "@/components/chess-board";
import { GameShell } from "@/components/game-shell";
import { useChessGame } from "@/lib/chess/use-chess-game";

export default function LocalPlayPage() {
  const game = useChessGame();
  const [orientation, setOrientation] = useState<"white" | "black">("white");

  const lastMove =
    game.history.length > 0
      ? {
          from: game.history[game.history.length - 1].from,
          to: game.history[game.history.length - 1].to,
        }
      : null;

  return (
    <GameShell
      title="Два игрока"
      subtitle="Передавайте устройство друг другу. Доска переворачивается по запросу."
      whiteLabel="Игрок 1"
      blackLabel="Игрок 2"
      turn={game.turn}
      status={game.status}
      history={game.history}
      inCheck={game.inCheck}
      winner={game.winner}
      onReset={() => game.reset()}
      onUndo={() => game.undo()}
      onFlip={() =>
        setOrientation((o) => (o === "white" ? "black" : "white"))
      }
      board={
        <ChessBoard
          fen={game.fen}
          orientation={orientation}
          allowMoves={game.status === "playing"}
          inCheck={game.inCheck}
          lastMove={lastMove}
          legalMovesFor={(sq: Square) => game.legalMoves(sq)}
          onAttemptMove={(from, to) => Boolean(game.tryMove({ from, to }))}
        />
      }
    />
  );
}
