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

## Why now

Three windows are open at once:

1. **Chess is back as Gen-Z spectator content.** GothamChess + Hikaru + the Botez sisters pulled chess into TikTok in 2021–24; the engagement curve hasn't bent yet. Search interest in "how to get better at chess" is at a ten-year high.
2. **AI moved from "feature" to "selection function".** Until 2024, "AI in a chess app" meant Stockfish under the hood. Mimic's claim — *the AI's identity is your weakness map* — is only buildable now that personalisation engines and behavioural fingerprinting are cheap.
3. **The Stockfish / chess.com duopoly under-serves improvement.** Both platforms grade you ("accuracy 81%"); neither *coaches* you. There's an intent gap — players willing to pay $5–15/month for guidance — that neither incumbent has reason to fill.

Build the personal-coach product into that gap before chess.com decides it's worth doing.

## Five-year picture

Today: an opponent built from your blunders. One screen, no account.

**Year 1.** Web product reaches 50K MAU on the back of "play your past self" loop. Mobile app. First $15/mo paid tier — deeper analysis, longer history, cross-device sync.

**Year 3.** The same engine architecture for **Go, shogi, poker, StarCraft replays** — anywhere a player has a record of decisions and a "what should I have done?" question. Mimic isn't a chess product; it's a behavioural-mirror engine that ships first in the cleanest data domain (chess) before generalising.

**Year 5.** White-label "Mimic-style" coaches for non-game skill domains — coding interviews, sales-call analysis, music practice. Same bones: capture decisions → fingerprint weaknesses → drill them with synthetic challenge. The chess product is the wedge; the platform is the prize.

## First 100 users — concrete plan

Distribution will not happen by accident. Three plays in the first 7 days post-launch:

1. **r/chess "I built X"** post — focused on the *one* thing nobody else does ("AI that targets your weakest categories") with a 30-second clip of `play as alex` showing Mimic picking a tactic-trap move. /r/chess at 1.4M members, weekend post window.
2. **TikTok #chesstok seed** — three 30-sec clips: (a) the dossier-reveal "hello alex" screen, (b) Mimic playing a different move than Stockfish in the same position, (c) yesterday's blunder returns as morning puzzle. Aim: one of three crosses 10K views; that's enough.
3. **30 chess Discord DMs** — server admins of beginner-intermediate clubs (1000–1500 rating ranges). Personal note + invite to share with members. At 10% acceptance, 3 servers × ~50 active = 150 trial users.

Conversion gate to paid is *intentionally* delayed. We don't ship pricing in v0 — Mimic earns the right to charge by hitting D7 retention ≥ 20%. Until then the cost of running it is $0 (static deploy, browser-only compute).

## Pricing thesis

When D7 ≥ 20% triggers, **Mimic Coach** ships at $9/mo or $79/yr:
- Unlimited weakness-map history (free is capped at 30 days)
- Cross-device sync (free is `localStorage` only)
- Import games from chess.com / lichess for analysis
- "Bring your blunder" — load any FEN, ask "why is this a blunder?"

$9 is anchored against chess.com Diamond ($14/mo) and the typical chess-coach hourly rate ($30+) — Mimic is a fraction of either, with always-on availability. Target unit economics: 5% free → paid conversion at $9/mo, $108 ARPU, recoups CAC of < $30 from organic channels above within four months.

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

### Two-engine architecture

Mimic uses **two engines for two jobs**, deliberately:

| Job | Engine | Why |
|---|---|---|
| **Gameplay opponent** | Our adaptive bias minimax (`simple-engine.ts` + `mimic-engine.ts`, ~150 LOC, depth 1–5) | The AI you play against *is* the product's identity — it must be ours. Phase-3 (Murat): if you remove this engine, the product dies. Stockfish is interchangeable; this isn't. |
| **Post-game judge** | Stockfish 18 Lite NNUE (WASM, ~7 MB, depth 10 multiPV 5) | A 2400-Elo home engine grades a 3500-Elo player with 200-cp error bars; a 3500-Elo external engine grades the same with 10-cp bars. Accuracy of *blunder detection* matters; identity of *blunder finder* doesn't. |

The Stockfish integration is `analyseGameWithStockfish()` — runs locally in a Web Worker, no backend. If it fails to load (offline, blocked worker), the post-game flow falls back to our in-house analyser at depth 3. **Gameplay never depends on Stockfish.**

### Blunder detection (`lib/chess/stockfish-analyse.ts` + `blunder-detector.ts`)

After the game, the analyser walks the PGN move-by-move:

1. For each player move, ask Stockfish for top-5 candidate moves at depth 10 (one UCI call per position via MultiPV)
2. `cpLoss = bestCp − playedCp` (sign-adjusted to player's perspective)
3. `cpLoss > 100` → blunder
4. Sort by `cpLoss`, take the worst → that's the move that "broke" the player
5. Categorize it: `played != mate && best ends in #` → `missed-mate`; `cpLoss > 400` → `lost-material`; etc.

Total cost: ~6 seconds per game (30 player moves × ~200 ms). The user already finished the game; the wait is acceptable.

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
