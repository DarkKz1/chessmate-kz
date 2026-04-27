# Mimic — Open Design Brief for Claude Design

> Use this brief as input for Claude Design (or any free-form design tool). It is
> deliberately decoupled from the existing Soviet-notebook implementation —
> describes the **concept**, not the current execution. Let the designer propose
> a fresh visual language.

---

## What this product actually is

Mimic is **a chess opponent built from your blunders**. After every game it
identifies the one move that broke you, classifies it into a weakness category
(*you hung a piece*, *you missed mate in two*, *you walked into a fork*), stores
it in a private weakness map, and uses that map to bias every future move it
plays against you. The longer you play, the sharper Mimic cuts.

It is **not** a chess engine, an analysis tool, or a coaching app. It is a
behavioural mirror that reveals **the player to themselves** through chess.

> The AI's identity is your weakness map. Remove the AI and the product dies.
> This is the load-bearing claim — the design must make it felt, not just
> stated.

## What we are designing for, emotionally

The user is an adult who plays 1–3 times a week, rated 800–1600. They have
played chess.com and lichess. Both told them their accuracy was 81%. Neither
told them anything about who they are as a player.

Mimic should feel like:

- A **private journal kept by someone watching you carefully** — a dossier with
  your name on it, opened when you arrive
- A **quiet, controlled menace** — not gaming hype; closer to a chess club
  trainer who already knows the move you're about to make and is mildly
  disappointed
- An **intimate diagnostic instrument** — like a medical chart, a polygraph
  readout, a therapist's notes from the previous session

It should NOT feel like:

- chess.com (overwhelming menus, accuracy bars, leaderboards, pop-up ads)
- A mobile game (hype colors, victory animations, achievement badges)
- A SaaS dashboard (Inter font, purple gradients, three feature cards)
- An AI startup (Geist Sans, blurred orbs, "Built with Claude" footer)

## Information architecture (open to redesign)

The product currently lives on **one screen** with two states. Open to
restructuring if the designer sees a stronger architecture, but keep the
discipline of *very few surfaces* — the opposite of chess.com's infinite menus
is a load-bearing differentiator.

| Surface | Purpose |
|---|---|
| **Landing / Dossier** | The arrival. User sees their name (or the demo persona "Alex"), their weakness map summary, today's puzzle drawn from a previous blunder, and a single CTA: "Play Mimic" |
| **Game** | Just the board, the opponent's recent move, a sparse status indicator. No analysis yet — Mimic is watching, not commenting |
| **Post-game reveal** | The moment the product earns its name. Mimic shows the *one* move that broke you, names the category, and tells you tomorrow's puzzle is already prepared |

The arc is: **arrive → confronted with yesterday's mistake → play → confronted
with today's mistake → leave knowing tomorrow's mistake is already loaded.**

## The signature moments — design these like a film director

Three moments carry the product. Anywhere else can be quieter, but these three
must be felt:

### 1. The "Hello, Alex" reveal (landing first paint)
The dossier opening on the user's name. This is the equivalent of a movie's
cold open — within 1–2 seconds the user must register: *something has been
prepared specifically for me.* Not a generic landing. The user's identity
and weakness summary appear with intent.

### 2. The post-game weakness verdict
The game ends. There's a beat. Then Mimic identifies the move and the category.
This must feel like a **diagnosis**, not a notification. Not "+12 XP" — closer
to a quiet card slid across a table.

### 3. The morning puzzle
Yesterday's broken move returns as today's puzzle. The framing must communicate
that **the product remembered something the user hoped to forget.** The user
should feel mildly seen.

## Visual constraints

### Hard avoid (these will fail the brief)

- Inter / Roboto / Geist as display
- Purple gradients, mesh gradients, glass orbs
- Hype color palettes (neon green, lime, electric blue) — chess engagement
  comes from focus, not stimulation
- Emoji icons of any kind
- Three-card feature grid
- Generic chess piece illustrations (clip-art knights). Either real chess
  graphics rendered with intent, or no pieces at all in marketing surfaces
- "Built the future of chess" type copy — the product doesn't claim that
- Dark-by-default cyber/dev-tool aesthetics (this isn't a developer product)

### Earned hooks (one of these, executed at 120%)

Pick ONE strong direction; execute it deeply. Some directions Claude Design
might explore:

- **Editorial dossier** — broadsheet typography, narrow columns, heavy display
  serifs, monospaced annotations, file-folder metaphor
- **Diagnostic instrument** — medical chart, ECG, polygraph traces; precise
  monospace + clean sans; calibration tick marks; readout aesthetic
- **Private archive** — card catalog, library card aesthetic, hand-typed
  index, the feel of paper records that have been kept for years
- **Surveillance dossier** — CIA-style intake form with name tab, redacted
  blocks, classification stamps (without the literal "TOP SECRET" cliche)
- **Soviet sportsbook journal** *(currently implemented — try beating it)* —
  cream paper, blue ballpoint, red margin, Caveat + Special Elite
- **Black-mirror minimal** — extreme reduction; near-blank page; one
  perfectly-set type element; quietness as the signal of confidence
- **Risograph zine** — analog print feel, limited 2-color palette, halftone
  textures, designer-magazine layout

The bar for the chosen direction: a designer would screenshot it and post it.

## Type and color

Open. Some constraints:

- **Display face must be recognizable, not generic.** Newsreader, Source Serif,
  EB Garamond, Caveat, Special Elite, FK Display, IBM Plex Mono, JetBrains
  Mono Display — examples of "has personality" not endorsements. NOT Inter,
  NOT Roboto.
- **One signature accent color**, used sparingly — the color of the verdict.
  Red works (margin red, court-redaction red, blunder red). So does cobalt
  (a fountain-pen ink). So does olive. So does pure black on cream. Avoid
  multi-color palettes — the product has ONE point of view.
- **Body type can be quiet** — that's where readability lives.
- **Numbers matter.** Move evaluations, weakness scores, dates — they should
  use a tabular monospace and feel like instrument readouts.

## Motion & interaction

- Restraint > flourish. **Scale 0.96 + 12px Y on entrance, no bounce.** This
  is not a game.
- The board should feel **physical and considered** — pieces have weight, the
  drop has settle. Borrow from chess.com's piece animation, not from mobile
  match-3 games.
- The post-game reveal can have **one** held moment of motion — a card
  sliding into view, a redaction line being drawn, a stamp pressing. ONE.
- **No autoplay celebration.** Mimic doesn't celebrate. It records.

## Tone of copy

The voice is the same as the visuals: quiet, observed, slightly clinical.

Examples (to set tone, not to be reused verbatim):
- *"You hung your queen on move 23. We've seen this pattern in three of your last five games."*
- *"Today's opponent: yourself, two weeks ago."*
- *"This puzzle is the move you didn't play yesterday."*

Not:
- *"Master your weaknesses!" "Level up your chess!" "Beat AI!"*

## What success looks like

A designer who has never seen the product opens the deliverable and within 3
seconds understands: *this is a private chess journal that knows me, and
something specific has been prepared for me.* They feel mildly unsettled, then
intrigued.

A user who has played twice opens the page on day three and feels recognized.

If neither of those land, the design has not earned its place.

## Concrete deliverables

Suggested screen list — designer free to add or merge:

1. **Cold landing** (no profile yet) — must convince a stranger Mimic is
   different in 5 seconds
2. **Returning landing** (Alex / user) — must feel like the product has been
   waiting
3. **Game in progress** — sparse, focused, one cue that Mimic is "thinking
   about you specifically"
4. **Post-game verdict** — the diagnosis moment
5. **Today's puzzle** — yesterday's broken move, framed as memory
6. **Weakness map detail** — the dossier itself, when expanded
7. **Demo mode entry** ("Play as Alex") — must read as a feature, not a
   shortcut

## What we're NOT designing in this pass

- Settings / preferences pages
- Account / signup (there is no account)
- Subscription / pricing surface (intentionally delayed)
- Mobile app screens (web-first launch)
- Marketing collateral (separate brief)

## Reference list (study these — don't copy them)

For tonal calibration, not visual reference:

- **Field Notes** memo books — quiet, considered, durable
- **The Atavist** longform editorial — narrow column, heavy display, white space
- **Phantom Wallet** — premium dark feel without falling into hype tropes
- **Linear changelog pages** — restraint as quality signal
- **The Browser Company / Arc** — opinionated, has a point of view
- **Are.na** — the platform that knows what it is and doesn't apologize
- **Old chess literature: Dvoretsky, Aagaard** — diagnostic, severe, respectful

## One last thing

The product's claim is *"the longer you play, the sharper Mimic cuts."* The
design should embody that line — not by stating it but by **getting noticeably
more precise the more the user comes back.** A dossier that grows. Type that
gets denser. Color that earns its place. The product matures as the player
does.

Make the chosen direction *believe* this.
