# Mimic — chess that remembers your mistakes

**Live:** https://dr-chessmate-kz.vercel.app
**Submission:** nFactorial Incubator 2026, round 2

---

## What it is

A chess opponent built from your blunders.

You play. Mimic watches. After each game it picks the *one* move that broke you, files it as a category — "you hung a piece", "you missed mate in two", "you walked into a fork" — and stores it in a private weakness map.

Then the next game changes. The AI no longer just searches for the best move. From the top-N near-optimal moves, it picks the one that pushes the position into your worst category. If you hang pieces, Mimic offers you bait. If you miss tactics, it manufactures sharp positions. If you collapse against king attacks, it brings every piece to your monarch.

Tomorrow morning, that broken move is back as a puzzle on the home page. Solve it. Streak +1. Play again.

The longer you play, the sharper Mimic cuts.

## For whom

Adults rated 800–1600 who play chess 1–3 times a week and don't know *why* they lose. They've tried chess.com — accuracy 81%, three blunders, fine. They've tried lichess — Stockfish says −2.3, fine. Neither of those tells them anything about *themselves as players*. Mimic does.

## How it differs

|  | chess.com | lichess | **Mimic** |
|---|---|---|---|
| Difficulty | 30 levels | 8 levels | adapts to *your* weaknesses |
| Post-game | accuracy + blunder list | Stockfish eval | one move + one category + tomorrow's puzzle |
| Opponent | random | random / Stockfish | trained on **your** failures |
| Account | required | required | not required |
| Menus | infinite | infinite | one screen |

## What's AI-native about it

The product fails one of [Murat Abdrakhmanov's tests](https://www.linkedin.com/in/murat-abdrakhmanov/) for "real AI startups": *if you remove the AI, does the product still work?* Without the weakness map and the biased move selector, this is just another chess clone. The AI isn't an LLM wrapper bolted on top — it's the move-selection function itself.

Three things make it AI-native (Phase 3):

1. **Move selection biased by personal data.** Standard minimax finds the top-N near-optimal moves; a custom heuristic picks the one that most challenges the player's worst category.
2. **Personal weakness fingerprint.** Each player's `weaknesses` map is unique, grows with every game, and is impossible to copy without their data — Murat's "proprietary data" moat.
3. **Detection without LLMs.** Every blunder is classified by deterministic rules (mate-in-N pattern, hanging-piece detection, cpLoss thresholds) — no API calls, no LLM brittleness, no $5000/month token bill.

## Under the hood

### Move selection (`lib/chess/mimic-engine.ts`)

```
1. minimax with alpha-beta to depth D
2. take top-K candidates within W centipawns of best
3. for each candidate: compute weakness-bias score
4. pick max(eval + bias_factor × bias_score)
```

Calibrated so Mimic stays objectively strong (no intentional weak play), but within the band of optimal moves it consistently picks the one that probes the player's softest spot.

### Weakness heuristics (`lib/chess/weakness-heuristics.ts`)

Per-category scoring functions, each ~10 LOC:

| Category | What scores high |
|---|---|
| `hanging-piece` | bait moves — own piece looks attacked but is defended |
| `missed-tactic` | high tactical pressure (attackers > defenders on multiple targets) |
| `missed-mate` | pieces close to opponent king + check threats |
| `lost-material` | forcing exchanges, moves that create loose pieces |
| `weak-king` | pieces converging on the king's neighborhood |
| `positional` | inverse — quiet moves, low complexity |

### Blunder detection (`lib/chess/blunder-detector.ts`)

After the game, the worker walks the PGN move-by-move:

1. For each player move, compute best move at depth 3
2. `cpLoss = eval(best) − eval(played)`
3. `cpLoss > 100` → blunder
4. Sort by `cpLoss`, take the worst → that's the move that "broke" the player
5. Categorize it: `played != mate && best ends in #` → `missed-mate`; `cpLoss > 400` → `lost-material`; etc.

### Demo persona — "Alex"

First-time visitors can play as Alex, a pre-built 1100-rated profile with five archived blunders and a heavy `hanging-piece` + `missed-tactic` weakness skew. This solves the cold-start problem: a jury member opens the URL and immediately gets the full Mimic experience without playing 8 games to build a profile.

### Storage

Everything in `localStorage` under `mimic.player.v1`. No backend, no Supabase, no Stripe, no signup. Pure offline-capable static site. **Cost: $0/month per user.**

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** (strict)
- **Tailwind CSS 4** with a custom Soviet-chess-notebook design system (paper texture, ruled lines, ink + handwriting fonts)
- **chess.js 1.4** — rules, FEN/PGN
- **react-chessboard 5.10** — board UI
- **Web Worker** — minimax + analysis don't block UI
- **Vercel** — static deploy

## Design

Hand-drawn Soviet chess notebook — cream paper, blue ballpoint ink, red margin stamp, ruled lines, Caveat handwriting + Special Elite typewriter. Picked because:

1. **It's not "Claude default"**. 80% of jury submissions will be Tailwind / shadcn / Geist Sans. A typewriter-on-aged-paper look stands out at a glance.
2. **It matches the product**. A chess journal where you log your mistakes — visual metaphor and product metaphor align.
3. **It's globally readable**. The Soviet reference is in the *texture*, not the language; an English-speaker reads it as "old chess journal", which works.

Dark mode = the same notebook at midnight (dim aged paper, golden ink). Light is canonical.

## Why this and not "AI shadow that plays your style"

An earlier scope had Mimic literally imitate the player's move choices using behavioral fingerprinting + style-weighted minimax. We cut it after a pre-build review:

- Style imitation with 5 features = "playing personality preset 3 of 8". Trained eyes spot it in two moves. Demo dies.
- Took 12 of 30 hours. Couldn't ship cleanly.

The current design — *pick the move that targets the player's worst category* — is concrete, demonstrable in a 10-second clip, and uses the data we already have. We made the smaller, defensible claim instead of the bigger, hand-wavy one.

(Apple commandment #2: say no to 1000 things.)

## Roadmap

**v0.2** — Versions of You: snapshot weakness profile every 5 games; play against your past self ("you, two weeks ago").

**v0.3** — Daily mirror challenge: one position a day, drawn from real users' blunders; share-link the position with your solve time.

**v0.4** — Replay → 9:16 MP4 export of the breaking move with annotated arrows. TikTok-native loop.

**v1.0** — Sync via Supabase (only when D7 retention > 20% — until then the cloud is overhead).

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
```

## File map

```
src/
  app/
    page.tsx           ← landing
    play/page.tsx      ← game screen
    layout.tsx
    globals.css        ← notebook design system
  components/
    chess-board.tsx    ← react-chessboard wrapper
    landing-hero.tsx   ← hero + "play as alex"
    post-game-card.tsx ← blunder reveal modal
    eval-bar.tsx
    theme-provider.tsx
    theme-toggle.tsx
  lib/
    chess/
      use-chess-game.ts        ← chess.js hook
      use-engine.ts            ← worker channel
      engine.worker.ts         ← worker entry
      simple-engine.ts         ← minimax + alpha-beta
      mimic-engine.ts          ← biased selection
      weakness-heuristics.ts   ← per-category scoring
      evaluation.ts            ← position eval + PSTs
      blunder-detector.ts      ← post-game classifier
      player-store.ts          ← localStorage
      demo-persona.ts          ← Alex
```

## Author

Diyar Raimzhan, 17, Astana Hub. Solo founder of [ENTprep](https://entprep.kz) (10K+ users). Built Mimic for nFactorial Incubator 2026, round 2.

Contact: raimzhan1907@gmail.com
