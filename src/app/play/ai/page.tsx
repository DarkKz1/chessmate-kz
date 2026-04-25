"use client";

import { useEffect, useState } from "react";
import type { Square } from "chess.js";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { ChessBoard } from "@/components/chess-board";
import { GameShell } from "@/components/game-shell";
import { useChessGame } from "@/lib/chess/use-chess-game";
import { useAIOpponent } from "@/lib/chess/use-ai-opponent";
import type { AILevel } from "@/lib/chess/simple-engine";
import { cn } from "@/lib/utils";

const LEVELS: { value: AILevel; label: string; sub: string }[] = [
  { value: "newbie", label: "Новичок", sub: "Случайные ходы" },
  { value: "easy", label: "Лёгкий", sub: "Глубина 2" },
  { value: "medium", label: "Средний", sub: "Глубина 3" },
  { value: "strong", label: "Сильный", sub: "Глубина 4" },
];

export default function AIPlayPage() {
  const game = useChessGame();
  const { requestMove } = useAIOpponent();
  const [level, setLevel] = useState<AILevel>("easy");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [thinking, setThinking] = useState(false);

  const orientation = playerColor === "w" ? "white" : "black";

  const lastMove =
    game.history.length > 0
      ? {
          from: game.history[game.history.length - 1].from as Square,
          to: game.history[game.history.length - 1].to as Square,
        }
      : null;

  useEffect(() => {
    if (game.status !== "playing") return;
    if (game.turn === playerColor) return;
    let cancelled = false;
    setThinking(true);
    const timer = setTimeout(async () => {
      const m = await requestMove(game.fen, level);
      if (cancelled || !m) {
        setThinking(false);
        return;
      }
      game.tryMove({
        from: m.from as Square,
        to: m.to as Square,
        promotion: (m.promotion as "q" | "r" | "b" | "n") ?? "q",
      });
      setThinking(false);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [game, game.fen, game.turn, game.status, playerColor, level, requestMove]);

  const handleStart = (color: "w" | "b") => {
    setPlayerColor(color);
    game.reset();
  };

  return (
    <GameShell
      title="Против ИИ"
      subtitle={
        thinking
          ? "ИИ думает…"
          : game.turn === playerColor
            ? "Твой ход"
            : "Ход ИИ"
      }
      whiteLabel={playerColor === "w" ? "Ты" : "ИИ"}
      blackLabel={playerColor === "b" ? "Ты" : "ИИ"}
      turn={game.turn}
      status={game.status}
      history={game.history}
      inCheck={game.inCheck}
      winner={game.winner}
      onReset={() => {
        game.reset();
      }}
      onUndo={() => {
        // Undo two — your move + AI's move
        game.undo();
        if (game.history.length > 0) game.undo();
      }}
      onResign={() => {
        if (confirm("Сдаться? Это засчитается как поражение.")) game.reset();
      }}
      board={
        <ChessBoard
          fen={game.fen}
          orientation={orientation}
          allowMoves={game.status === "playing" && game.turn === playerColor && !thinking}
          inCheck={game.inCheck}
          lastMove={lastMove}
          legalMovesFor={(sq) => game.legalMoves(sq)}
          onAttemptMove={(from, to) => Boolean(game.tryMove({ from, to }))}
        />
      }
      rightPanel={
        <>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 pb-3">
              <Bot className="size-4 text-primary" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Уровень
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all",
                    level === l.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-bold">{l.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {l.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 pb-3">
              <Sparkles className="size-4 text-accent" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Сторона
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStart("w")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold transition-all",
                  playerColor === "w"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <span className="size-3 rounded-full border border-border bg-light-square" />
                Белые
              </button>
              <button
                type="button"
                onClick={() => handleStart("b")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold transition-all",
                  playerColor === "b"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <span className="size-3 rounded-full border border-border bg-dark-square" />
                Чёрные
              </button>
            </div>
          </div>

          {thinking && (
            <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent-foreground">
              <Loader2 className="size-4 animate-spin text-accent" />
              ИИ обдумывает ход…
            </div>
          )}
        </>
      }
    />
  );
}
