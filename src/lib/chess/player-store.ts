"use client";

const STORAGE_KEY = "chessmate.player.v1";

export type Blunder = {
  fen: string; // position before the blunder
  played: string; // SAN of the bad move
  best: string; // SAN of the best move
  cpLoss: number; // centipawn loss
  category: BlunderCategory;
  shortLesson: string;
  date: number; // timestamp
  resolved: boolean; // user solved this puzzle
};

export type BlunderCategory =
  | "hanging-piece"
  | "missed-mate"
  | "missed-tactic"
  | "weak-king"
  | "lost-material"
  | "positional";

export type PlayerState = {
  // Internal skill rating 0–100 → maps to engine depth
  rating: number;
  // Total games played
  games: number;
  // Wins, draws, losses
  wins: number;
  draws: number;
  losses: number;
  // Last 30 blunders (for daily puzzle and weakness analysis)
  blunders: Blunder[];
  // Daily streak: when the user solved at least one puzzle
  lastSolvedDay?: string; // YYYY-MM-DD
  streak: number;
  // Per-category counts for weakness map
  weaknesses: Record<BlunderCategory, number>;
};

const DEFAULT_STATE: PlayerState = {
  rating: 25, // starts as "easy" — depth ~2
  games: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  blunders: [],
  streak: 0,
  weaknesses: {
    "hanging-piece": 0,
    "missed-mate": 0,
    "missed-tactic": 0,
    "weak-king": 0,
    "lost-material": 0,
    positional: 0,
  },
};

export function loadPlayer(): PlayerState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      weaknesses: { ...DEFAULT_STATE.weaknesses, ...(parsed.weaknesses ?? {}) },
      blunders: parsed.blunders ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function savePlayer(state: PlayerState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Maps internal rating (0-100) to engine search depth.
// 0–15 → 1 (often random or shallow)
// 15–35 → 2
// 35–60 → 3
// 60–82 → 4
// 82+ → 5
export function ratingToDepth(rating: number): number {
  if (rating < 15) return 1;
  if (rating < 35) return 2;
  if (rating < 60) return 3;
  if (rating < 82) return 4;
  return 5;
}

// Adjust rating by a single move's quality. cpLoss is how many centipawns
// the player gave up vs the engine's best move.
export function ratingDeltaForMove(cpLoss: number): number {
  // A perfect move (0cp loss) → +0.6
  // 50cp loss → ~0
  // 200cp loss → -1.2
  // 500cp loss → -3.0
  if (cpLoss < 0) return 0.6;
  const quality = 100 - Math.min(100, cpLoss / 5);
  return (quality - 50) * 0.06;
}

// Adjust rating after game result (~1-2 points per game total)
export function ratingDeltaForResult(result: "win" | "loss" | "draw"): number {
  if (result === "win") return 1.2;
  if (result === "loss") return -1.2;
  return 0;
}

export function clampRating(r: number): number {
  return Math.max(0, Math.min(100, r));
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
