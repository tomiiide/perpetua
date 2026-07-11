# Perpetua — Design System & Style Guide

Brand and design system for **Perpetua**, foundational widgets for pro trading software ("the viem/wagmi of perps"). This is the single source of truth for the visual language. The machine-readable tokens live in [`tokens/`](tokens/) (`colors.css`, `typography.css`, `spacing.css`, `fonts.css`, `tokens.json`); the logo lives in [`assets/`](assets/). The React consumption layer (compiled `tokens.css`, Tailwind preset, MUI bridge) lives in `packages/react/theme/`.

## Direction

**Terminal brutalist.** Dense, mono, hairlines — Bloomberg-meets-Linear. Dark-first (light theme available). Serif display voice over mono data. Compact density is the default because the audience is pro traders and the engineers who build for them.

## Content fundamentals

- **Voice:** terse declaratives, often fragments. "Headless logic. Unstyled primitives. Your terminal." Confidence through specificity, not adjectives.
- **Technical claims over marketing claims:** "Decimal-safe. Sixty frames. Zero float math." Numbers and guarantees, never "blazingly fast".
- **Casing:** sentence case for prose and display copy. UPPERCASE mono with wide tracking (0.12em) for labels, tickers, section eyebrows.
- **Person:** "your" for the reader's product ("Your terminal."); "we" is avoided — the library speaks for itself.
- **No emoji. Ever.**
- Code identifiers appear verbatim in copy (`useOrderBook`, `@perpetua/core`) set in mono.
- Market shorthand is native vocabulary: ETH-PERP, OI, uPnL, TIF, liq price.

## Color

Near-black cool neutrals for surfaces, one electric-teal brand accent used sparingly, and market semantics that carry the real information. Most of the UI is ink on near-black; accent appears only on links, focus, live values, and the P-candle logo mark.

### Surfaces & hairlines

Hierarchy comes from surface steps plus 1px hairlines. **No shadows, no elevation system.**

| Token | Dark | Light | Use |
|---|---|---|---|
| `--pt-bg-0` | `#0B0C0E` | `#FAFAFB` | page |
| `--pt-bg-1` | `#111316` | `#F1F2F4` | panel |
| `--pt-bg-2` | `#17191C` | `#E9EBED` | raised / hover |
| `--pt-bg-3` | `#1E2125` | `#DFE2E5` | active / press |
| `--pt-border` | `#232528` | `#D9DCDF` | hairline |
| `--pt-border-strong` | `#2E3136` | `#C3C8CD` | strong hairline |

### Ink

| Token | Dark | Use |
|---|---|---|
| `--pt-fg-0` | `#F0F1F2` | primary text, prices |
| `--pt-fg-1` | `#9CA3AF` | secondary |
| `--pt-fg-2` | `#6B7280` | labels, captions |
| `--pt-fg-3` | `#3F4650` | disabled, ghost marks |

### Accent — electric teal

Used sparingly: links, focus, live values, the P-candle body. On light surfaces teal darkens to `#0D9488` for contrast.

| Token | Dark | Light |
|---|---|---|
| `--pt-accent` | `#2DD4BF` | `#0D9488` |
| `--pt-accent-strong` | `#14B8A6` | `#0F766E` |
| `--pt-accent-dim` | `#134E4A` | `#99F6E4` |
| `--pt-accent-ink` | `#042F2E` | `#FAFAFB` |
| `--pt-accent-wash` | `rgba(45,212,191,.08)` | `rgba(13,148,136,.08)` |

### Market semantics & health

Long/short washes sit at ~10% alpha behind data rows and depth bars. `FlashCell` reuses these washes, fading ~600ms.

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `--pt-long` | `#34D399` | `#059669` | buy / up / profit (`+2.41%`) |
| `--pt-short` | `#F87171` | `#DC2626` | sell / down / loss (`−4.02%`) |
| `--pt-health-safe` | `#34D399` | `#059669` | — |
| `--pt-health-warn` | `#FBBF24` | `#D97706` | — |
| `--pt-health-danger` | `#F87171` | `#DC2626` | — |

**Regional convention:** `[data-updown="inverted"]` swaps long/short colors for KR/JP/CN markets (red-up/green-down).

## Typography

Newsreader (serif, 300–400 weight, italics for emphasis) for display and voice; IBM Plex Mono for **all** data, UI chrome, labels, and code. Numerals are always tabular (`font-feature-settings: "tnum"`). Data type runs small: 10–13px.

**Display (Newsreader):**

| Token | Spec | Use |
|---|---|---|
| `--pt-display-xl` | `300 64px/1.08` | hero |
| `--pt-display-lg` | `300 44px/1.15` | page titles |
| `--pt-display-md` | `400 30px/1.25` | section heads |
| `--pt-display-sm` | `400 22px/1.35` | supporting prose, italics for emphasis |

**Mono data/UI (IBM Plex Mono):**

| Token | Spec | Use |
|---|---|---|
| `--pt-mono-lg` | `500 16px/1.4` | hero prices `64,210.5` |
| `--pt-mono-md` | `400 13px/1.5` | table cells, body UI `3,412.55` |
| `--pt-mono-sm` | `400 12px/1.45` | dense blotters `148.22` |
| `--pt-mono-xs` | `400 11px/1.4` | captions, meta `0.0031%` |
| `--pt-mono-2xs` | `400 10px/1.3` | swatch labels, fine print |

**Labels:** uppercase mono with wide tracking (`--pt-tracking-label: 0.12em`, `--pt-tracking-wide: 0.14em`).

## Spacing, density & shape

- **Scale (2px base):** `--pt-space-1..9` = 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px.
- **Density is a token axis:** compact (24px rows, default) via `--pt-row-h`; comfortable (32px) via `[data-density="comfortable"]`. Controls: 28px → 36px.
- **Corners:** square. `--pt-radius: 0`. No rounded corners anywhere.
- **Borders:** 1px hairlines do all structural work. `--pt-hairline: 1px solid var(--pt-border)`.
- **Backgrounds:** flat fills only. No gradients, textures, or imagery. The "imagery" of the brand is live data itself (books, tickers, candles).

## Interaction & motion

- **Animation:** functional only — flash-on-change (accent/long/short wash fading ~600ms). No decorative motion. Transitions linear or ease-out, ≤150ms.
- **Hover:** background steps up one surface (`bg-1` → `bg-2`). **Press:** steps to `bg-3`.
- **Links:** teal, brighten on hover.
- **Focus:** 1px teal outline, offset 1px.
- **Transparency/blur:** none, except the semantic washes (rgba accent/long/short at ~8–10%) behind data rows.
- **Cards/panels:** flat `--pt-bg-1` with hairline border, square corners, labeled by an uppercase mono caption row with a bottom hairline.

## Logo

Mark: an ascending candlestick triplet where the third candle forms a "P" — wick as stem, teal body as bowl ([`assets/logo-mark.svg`](assets/logo-mark.svg); [`assets/logo-mark-light.svg`](assets/logo-mark-light.svg) for light surfaces). Ghost candles are `fg-3`/`fg-2` grays. Wordmark: "Perpetua" in Newsreader 400, paired with the uppercase mono descriptor "FOUNDATIONAL TRADING WIDGETS". Minimum mark size 20px; keep clearspace of one candle-body width around the mark.

## Iconography

No icon font, no illustration system.

- **Unicode/ASCII glyphs as icons** in mono: ▲ ▼ for deltas, ● for status dots, − + for steppers, → for links/CTAs, ✕ for close.
- Status is color + glyph, never pictograms.
- If a real icon set is ever needed, use Lucide (1.5px stroke, squared caps) — but prefer glyphs.

## Fonts

Newsreader and IBM Plex Mono load from Google Fonts (see [`tokens/fonts.css`](tokens/fonts.css)). No local font binaries are provided — supply licensed woff2 files to self-host.

## Consuming the tokens

- **Design source of truth:** [`tokens/`](tokens/) — `colors.css` (dark default + `[data-theme="light"]`), `typography.css`, `spacing.css` (+ `[data-density="comfortable"]`), `fonts.css`, and `tokens.json` (W3C Design Tokens format for Style Dictionary).
- **React / app consumption:** `@perpetua/react` ships the compiled contract at `packages/react/theme/` — `tokens.css` (the `--pt-*` variable declarations components reference), `tailwind.preset.js`, and `mui-theme.ts`. Components style themselves only through these variables and expose state via `data-*` attributes (`data-side`, `data-delta`, `data-health`, `data-flash`), so any styling system can target them.
