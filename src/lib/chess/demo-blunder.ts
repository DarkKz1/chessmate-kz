import type { Blunder } from "./player-store";

// Pre-computed demo blunder used to showcase the post-game flow without
// requiring the judge/visitor to play through a full game first. The
// position is from a real "Italian Game" middlegame where Black overlooks
// a tactical shot — this gives an instantly readable lesson.
export const DEMO_BLUNDER: Blunder = {
  fen: "r1bqk2r/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 7",
  played: "Bd3",
  best: "cxd5",
  cpLoss: 240,
  category: "missed-tactic",
  shortLesson:
    "cxd5 cracked d5 wide open. the initiative slipped through your fingers.",
  date: Date.now(),
  resolved: false,
};

// A second-pass position that is a clean "missed mate" — easier to understand
// at a glance for non-chess players (judges).
export const DEMO_MATE_BLUNDER: Blunder = {
  fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
  played: "Rd2",
  best: "Rd8#",
  cpLoss: 99000,
  category: "missed-mate",
  shortLesson: "mate was waiting. Rd8# closes the door.",
  date: Date.now(),
  resolved: false,
};
