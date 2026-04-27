"use client";

// Stockfish 18 (Lite NNUE, single-threaded) wrapper over UCI protocol.
// Loaded on demand from /stockfish/stockfish.js + stockfish.wasm.
//
// Used ONLY for post-game blunder analysis — gameplay still runs through
// our adaptive bias engine. Stockfish is the external judge that grades
// the game; the AI you played against is still ours.

let workerInstance: Worker | null = null;
let listeners: Array<(line: string) => void> = [];
let initialised: Promise<void> | null = null;

function ensureLoaded(): Promise<void> {
  if (initialised) return initialised;
  if (typeof window === "undefined") {
    return Promise.reject(new Error("stockfish requires browser"));
  }

  initialised = new Promise<void>((resolve, reject) => {
    try {
      workerInstance = new Worker("/stockfish/stockfish.js");
    } catch (e) {
      reject(e);
      return;
    }

    let uciSeen = false;
    let readySeen = false;
    const timeout = setTimeout(
      () => reject(new Error("stockfish init timeout")),
      10_000,
    );

    const onMessage = (e: MessageEvent) => {
      const line = String(e.data ?? "").trim();
      if (line === "uciok") {
        uciSeen = true;
        workerInstance!.postMessage("isready");
      }
      if (line === "readyok") readySeen = true;
      if (uciSeen && readySeen) {
        clearTimeout(timeout);
        resolve();
      }
      listeners.forEach((l) => l(line));
    };

    workerInstance!.onmessage = onMessage;
    workerInstance!.onerror = (err) => {
      clearTimeout(timeout);
      reject(err);
    };
    workerInstance!.postMessage("uci");
  });

  return initialised;
}

export type MultiPvResult = {
  bestMoveUci: string;
  // map of UCI move string -> centipawn score (from side-to-move's POV)
  variations: Map<string, { cp: number; mate: number | null }>;
};

// Run a single position through Stockfish with MultiPV, returning the top-K
// moves with their evaluations. One Stockfish call per position is enough
// to determine cpLoss for any played move that's in the top-K (and a fast
// heuristic for moves that fall outside).
export async function evaluateMultiPv(
  fen: string,
  depth = 10,
  multiPv = 5,
): Promise<MultiPvResult | null> {
  try {
    await ensureLoaded();
  } catch {
    return null;
  }
  if (!workerInstance) return null;

  return new Promise((resolve) => {
    const variations = new Map<
      string,
      { cp: number; mate: number | null; lastDepth: number }
    >();

    const listener = (line: string) => {
      // info depth N seldepth M multipv K score cp X pv e2e4 e7e5 ...
      // OR score mate Y
      const mpvMatch = line.match(/multipv (\d+)/);
      const pvMatch = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
      const cpMatch = line.match(/score cp (-?\d+)/);
      const mateMatch = line.match(/score mate (-?\d+)/);
      const depthMatch = line.match(/info depth (\d+)/);
      if (mpvMatch && pvMatch && depthMatch && (cpMatch || mateMatch)) {
        const move = pvMatch[1];
        const d = parseInt(depthMatch[1], 10);
        const existing = variations.get(move);
        if (!existing || existing.lastDepth <= d) {
          let cp = 0;
          let mate: number | null = null;
          if (mateMatch) {
            mate = parseInt(mateMatch[1], 10);
            cp = mate > 0 ? 100000 - Math.abs(mate) : -100000 + Math.abs(mate);
          } else if (cpMatch) {
            cp = parseInt(cpMatch[1], 10);
          }
          variations.set(move, { cp, mate, lastDepth: d });
        }
      }

      if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const bestMoveUci = parts[1] ?? "";
        listeners = listeners.filter((l) => l !== listener);
        const out = new Map<string, { cp: number; mate: number | null }>();
        for (const [move, v] of variations) {
          out.set(move, { cp: v.cp, mate: v.mate });
        }
        resolve({ bestMoveUci, variations: out });
      }
    };

    listeners.push(listener);
    workerInstance!.postMessage("ucinewgame");
    workerInstance!.postMessage(`setoption name MultiPV value ${multiPv}`);
    workerInstance!.postMessage(`position fen ${fen}`);
    workerInstance!.postMessage(`go depth ${depth}`);
  });
}

export function isStockfishAvailable(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

export function terminateStockfish(): void {
  if (workerInstance) {
    try {
      workerInstance.postMessage("quit");
      workerInstance.terminate();
    } catch {
      /* noop */
    }
    workerInstance = null;
    initialised = null;
    listeners = [];
  }
}
