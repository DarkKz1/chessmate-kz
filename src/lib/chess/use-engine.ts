"use client";

import { useCallback, useEffect, useRef } from "react";
import { analyseGame, type GameAnalysis } from "./blunder-detector";
import { search } from "./simple-engine";
import { searchMimic } from "./mimic-engine";
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

  // Race a worker postMessage against a timeout. If the worker doesn't
  // respond within `ms`, run the same computation on the main thread
  // synchronously and resolve with that result. Production deploys (Netlify
  // + Next.js 16 Turbopack) have surfaced cases where the worker URL
  // bundle doesn't dispatch back; the fallback guarantees the user always
  // sees a result.
  const raceWithMain = useCallback(
    <T,>(
      workerSend: (id: number) => void,
      readResponse: (r: WorkerResponse) => T,
      mainCompute: () => T,
      ms: number,
    ): Promise<T> => {
      return new Promise<T>((resolve) => {
        let done = false;
        const finish = (val: T) => {
          if (done) return;
          done = true;
          resolve(val);
        };
        const timer = setTimeout(() => finish(mainCompute()), ms);
        const worker = workerRef.current;
        if (!worker) {
          clearTimeout(timer);
          finish(mainCompute());
          return;
        }
        const id = ++idRef.current;
        pendingRef.current.set(id, (r) => {
          clearTimeout(timer);
          finish(readResponse(r));
        });
        workerSend(id);
      });
    },
    [],
  );

  const bestMove = useCallback(
    (
      fen: string,
      depth: number,
      weaknesses?: WeaknessMap,
    ): Promise<EngineMove | null> => {
      return raceWithMain<EngineMove | null>(
        (id) =>
          workerRef.current!.postMessage({
            id,
            type: "search",
            fen,
            depth,
            weaknesses,
          }),
        (r) => (r.type === "search" ? r.best : null),
        () => {
          const result = weaknesses
            ? searchMimic(fen, depth, weaknesses)
            : search(fen, depth);
          if (!result.move) return null;
          return {
            from: result.move.from,
            to: result.move.to,
            promotion: result.move.promotion,
            san: result.move.san,
            score: result.score,
          };
        },
        // depth-1 worker should respond well under 1.5s; fall back at 2s
        2_000,
      );
    },
    [raceWithMain],
  );

  const analyse = useCallback(
    (
      pgn: string,
      playerColor: "w" | "b",
      depth = 3,
    ): Promise<GameAnalysis | null> => {
      return raceWithMain<GameAnalysis | null>(
        (id) =>
          workerRef.current!.postMessage({
            id,
            type: "analyse",
            pgn,
            playerColor,
            depth,
          }),
        (r) => (r.type === "analyse" ? r.analysis : null),
        () => analyseGame(pgn, playerColor, depth),
        // analyse with 30 plies @ depth 3 on main thread is ~1-2s; 4s grace
        4_000,
      );
    },
    [raceWithMain],
  );

  return { bestMove, analyse };
}
