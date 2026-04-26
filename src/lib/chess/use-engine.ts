"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GameAnalysis } from "./blunder-detector";
import type { BlunderCategory } from "./player-store";

type WeaknessMap = Record<BlunderCategory, number>;

type EngineMove = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  score: number;
};

type WorkerResponse =
  | { id: number; type: "search"; best: EngineMove | null }
  | { id: number; type: "analyse"; analysis: GameAnalysis };

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (data: WorkerResponse) => void>>(
    new Map(),
  );
  const idRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("./engine.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      const resolver = pendingRef.current.get(data.id);
      if (resolver) {
        resolver(data);
        pendingRef.current.delete(data.id);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const bestMove = useCallback(
    (
      fen: string,
      depth: number,
      weaknesses?: WeaknessMap,
    ): Promise<EngineMove | null> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve(null);
          return;
        }
        const id = ++idRef.current;
        pendingRef.current.set(id, (r) =>
          resolve(r.type === "search" ? r.best : null),
        );
        worker.postMessage({ id, type: "search", fen, depth, weaknesses });
      });
    },
    [],
  );

  const analyse = useCallback(
    (pgn: string, playerColor: "w" | "b", depth = 3): Promise<GameAnalysis | null> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve(null);
          return;
        }
        const id = ++idRef.current;
        pendingRef.current.set(id, (r) =>
          resolve(r.type === "analyse" ? r.analysis : null),
        );
        worker.postMessage({ id, type: "analyse", pgn, playerColor, depth });
      });
    },
    [],
  );

  return { bestMove, analyse };
}
