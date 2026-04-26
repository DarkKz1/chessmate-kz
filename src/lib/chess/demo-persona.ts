import type { Blunder, PlayerState } from "./player-store";

// "Alex" — the cold-start demo persona. Hand-tuned weakness profile so that
// a first-time visitor (jury member, TikTok click) immediately experiences
// Mimic's behaviour: an AI that *targets* a real player's weak spots.
//
// Profile: ~1100 rated player who routinely hangs minor pieces and misses
// short tactical wins. Mimic plays this player by leaning into sharp tactical
// positions and offering bait captures.

const ALEX_BLUNDERS: Blunder[] = [
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    played: "Ng5",
    best: "d4",
    cpLoss: 180,
    category: "missed-tactic",
    shortLesson:
      "you went for a quick attack on f7. it doesn't work — knight chases nothing.",
    date: Date.now() - 1000 * 60 * 60 * 24 * 5,
    resolved: false,
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    played: "Bb5",
    best: "Bc4",
    cpLoss: 60,
    category: "positional",
    shortLesson: "italian was sharper here than spanish.",
    date: Date.now() - 1000 * 60 * 60 * 24 * 4,
    resolved: false,
  },
  {
    fen: "r2qkb1r/ppp2ppp/2n2n2/3pp1B1/3P4/2N2N2/PPP2PPP/R2QKB1R w KQkq - 0 6",
    played: "Bxf6",
    best: "Bb5",
    cpLoss: 220,
    category: "hanging-piece",
    shortLesson:
      "trading the bishop here gives black a fine pawn structure. the bishop was your best piece.",
    date: Date.now() - 1000 * 60 * 60 * 24 * 3,
    resolved: true,
  },
  {
    fen: "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 2 5",
    played: "Bd3",
    best: "cxd5",
    cpLoss: 140,
    category: "missed-tactic",
    shortLesson:
      "captures first. cxd5 opens the position before black gets coordinated.",
    date: Date.now() - 1000 * 60 * 60 * 24 * 2,
    resolved: false,
  },
  {
    fen: "r2q1rk1/ppp2ppp/2n1bn2/3pp3/2PPP3/2N2N2/PP3PPP/R1BQ1RK1 w - - 0 9",
    played: "exd5",
    best: "Nxe5",
    cpLoss: 290,
    category: "hanging-piece",
    shortLesson:
      "you missed the knight grab on e5 — black's pawn was overworked defending.",
    date: Date.now() - 1000 * 60 * 60 * 24 * 1,
    resolved: false,
  },
];

export const ALEX_PROFILE: PlayerState = {
  rating: 38,
  games: 8,
  wins: 3,
  draws: 1,
  losses: 4,
  blunders: ALEX_BLUNDERS,
  streak: 2,
  lastSolvedDay: undefined,
  weaknesses: {
    "hanging-piece": 5,
    "missed-tactic": 4,
    "missed-mate": 1,
    "lost-material": 2,
    "weak-king": 0,
    positional: 3,
  },
};

const STORAGE_KEY = "mimic.player.v1";
const PERSONA_FLAG_KEY = "mimic.persona.alex";

// Drop the Alex persona into localStorage so the next page render reads it
// as the player's actual profile. Idempotent — second call replaces with
// fresh state.
export function seedAlex(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ALEX_PROFILE));
  localStorage.setItem(PERSONA_FLAG_KEY, "1");
}

export function isAlexActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PERSONA_FLAG_KEY) === "1";
}

export function clearPersona(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PERSONA_FLAG_KEY);
  localStorage.removeItem(STORAGE_KEY);
}
