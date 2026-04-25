/// <reference lib="webworker" />

import { computeBestMove, type AILevel } from "./simple-engine";

type Request = {
  id: number;
  fen: string;
  level: AILevel;
};

type Response = {
  id: number;
  move: { from: string; to: string; promotion?: string; san: string } | null;
};

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, fen, level } = e.data;
  const move = computeBestMove(fen, level);
  const reply: Response = {
    id,
    move: move
      ? {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
        }
      : null,
  };
  (self as DedicatedWorkerGlobalScope).postMessage(reply);
};

export {};
