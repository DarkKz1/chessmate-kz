/// <reference lib="webworker" />

import { search } from "./simple-engine";
import { searchMimic } from "./mimic-engine";
import { analyseGame } from "./blunder-detector";
import type { BlunderCategory } from "./player-store";

type WeaknessMap = Record<BlunderCategory, number>;

type Request =
  | {
      id: number;
      type: "search";
      fen: string;
      depth: number;
      weaknesses?: WeaknessMap;
    }
  | {
      id: number;
      type: "analyse";
      pgn: string;
      playerColor: "w" | "b";
      depth: number;
    };

self.onmessage = (e: MessageEvent<Request>) => {
  const data = e.data;
  if (data.type === "search") {
    const result = data.weaknesses
      ? searchMimic(data.fen, data.depth, data.weaknesses)
      : search(data.fen, data.depth);
    (self as DedicatedWorkerGlobalScope).postMessage({
      id: data.id,
      type: "search",
      best: result.move
        ? {
            from: result.move.from,
            to: result.move.to,
            promotion: result.move.promotion,
            san: result.move.san,
            score: result.score,
          }
        : null,
    });
    return;
  }
  if (data.type === "analyse") {
    const analysis = analyseGame(data.pgn, data.playerColor, data.depth);
    (self as DedicatedWorkerGlobalScope).postMessage({
      id: data.id,
      type: "analyse",
      analysis,
    });
    return;
  }
};

export {};
