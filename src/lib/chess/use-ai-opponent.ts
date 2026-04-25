"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AILevel } from "./simple-engine";

type AIMove = {
  from: string;
  to: string;
  promotion?: string;
  san: string;
};

export function useAIOpponent() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (m: AIMove | null) => void>>(new Map());
  const idRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("./engine.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (e: MessageEvent<{ id: number; move: AIMove | null }>) => {
      const { id, move } = e.data;
      const resolver = pendingRef.current.get(id);
      if (resolver) {
        resolver(move);
        pendingRef.current.delete(id);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const requestMove = useCallback(
    (fen: string, level: AILevel): Promise<AIMove | null> => {
      return new Promise((resolve) => {
        const worker = workerRef.current;
        if (!worker) {
          resolve(null);
          return;
        }
        const id = ++idRef.current;
        pendingRef.current.set(id, resolve);
        worker.postMessage({ id, fen, level });
      });
    },
    [],
  );

  return { requestMove };
}
