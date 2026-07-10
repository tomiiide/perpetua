# Perpetua Design System

Brand + design system for **Perpetua** — foundational widgets for pro trading software ("the viem/wagmi of perps"). Headless trading logic (`@perpetua/core`), venue implementations, multi-venue desk, unstyled React primitives, and a token-driven theme layer. Perps-first; primitives shared by swap, DEX, and prediction-market interfaces.

Source material: the Perpetua architecture brief (packages `core / venues / desk / react / theme`, layer inventory L0–L4). No external Figma or codebase was provided; this system was designed from scratch and approved by the user (direction 3b in `Brand Directions.dc.html`).

## Direction

**Terminal brutalist.** Dense, mono, hairlines — Bloomberg-meets-Linear. Dark-first (light theme available). Serif display voice over mono data. Compact density is the default because the audience is pro traders and the engineers who build for them.

## CONTENT FUNDAMENTALS

- **Voice:** terse declaratives, often fragments. "Headless logic. Unstyled primitives. Your terminal." Confidence through specificity, not adjectives.
- **Technical claims over marketing claims:** "Decimal-safe. Sixty frames. Zero float math." — numbers and guarantees, never "blazingly fast".
- **Casing:** sentence case for prose and display copy. UPPERCASE mono with wide tracking (0.12em) for labels, tickers, section eyebrows.
- **Person:** "your" for the reader's product ("Your terminal."); "we" is avoided — the library speaks for itself.
- **No emoji. Ever.**
- Code identifiers appear verbatim in copy (`useOrderBook`, `@perpetua/core`) set in mono.
- Market shorthand is native vocabulary: ETH-PERP, OI, uPnL, TIF, liq price.

## VISUAL FOUNDATIONS

- **Color:** near-black cool neutrals (`#0B0C0E` page → `#17191C` raised). One brand accent: electric teal `#2DD4BF`. Market semantics: long `#34D399` / short `#F87171`; health safe/warn/danger. Light theme flips to `#FAFAFB` with a darkened teal `#0D9488` for contrast. Accents used sparingly — most of the UI is ink on near-black.
- **Type:** Newsreader (serif, 300–400 weight, italics for emphasis) for display and voice; IBM Plex Mono for ALL data, UI chrome, labels, and code. Numerals are always tabular (`font-feature-settings: "tnum"`). Data type runs small: 10–13px.
- **Spacing:** tight. 2/4/8/12/16/24/32/48/64 scale. Density is a token axis: compact (24px rows) default, comfortable (32px) available.
- **Corners:** square. `--pt-radius: 0`. No rounded corners anywhere.
- **Borders:** 1px hairlines (`#232528`) do all structural work. No shadows, no elevation system — hierarchy comes from surface steps (bg-0/1/2/3) and hairlines.
- **Backgrounds:** flat fills only. No gradients, no textures, no imagery. The "imagery" of the brand is live data itself (books, tickers, candles).
- **Animation:** functional only — flash-on-change (accent/long/short wash fading ~600ms), no decorative motion. Transitions linear or ease-out, ≤150ms.
- **Hover:** background steps up one surface (bg-1 → bg-2). Press: steps to bg-3. Links: teal, brighten on hover.
- **Focus:** 1px teal outline, offset 1px.
- **Transparency/blur:** none, except semantic washes (rgba accent/long/short at ~8-10%) behind data rows.
- **Cards/panels:** flat `--pt-bg-1` with hairline border, square corners, labeled by an uppercase mono caption row with bottom hairline.

## LOGO

Mark: ascending candlestick triplet where the third candle forms a "P" — wick as stem, teal body as bowl (`assets/logo-mark.svg`, `assets/logo-mark-light.svg` for light surfaces). Ghost candles are fg-3/fg-2 grays. Wordmark: "Perpetua" in Newsreader 400, paired with the uppercase mono descriptor "FOUNDATIONAL TRADING WIDGETS". Minimum mark size 20px; keep clearspace of one candle-body width around the mark.

## ICONOGRAPHY

No icon font and no illustration system. The brand uses:
- **Unicode/ASCII glyphs as icons** in mono: ▲ ▼ for deltas, ● for status dots, − + for steppers, → for links/CTAs, ✕ for close.
- Status is color + glyph, never pictograms.
- If a real icon set is ever needed, use Lucide (1.5px stroke, squared caps) — but prefer glyphs.

## FONTS

Newsreader and IBM Plex Mono are loaded from Google Fonts (`tokens/fonts.css`). No local font binaries were provided — supply licensed woff2 files to self-host.

## INDEX

- `styles.css` — global entry; imports everything in `tokens/`
- `tokens/` — `colors.css` (dark default + `[data-theme="light"]`), `typography.css`, `spacing.css` (+ `[data-density="comfortable"]`), `fonts.css`
- `assets/` — `logo-mark.svg` (dark surfaces), `logo-mark-light.svg`
- `guidelines/` — foundation specimen cards (Design System tab)
- `Brand Directions.dc.html` — the exploration canvas that led to this direction (3b won)
- `Landing Page.dc.html` — marketing landing page with live-looking terminal hero
- `SKILL.md` — agent skill entry point

## Not yet built

The component library itself (Layer 1 primitives → Layer 3 molecules from the brief) is not yet authored as design-system components — the brief defines a large inventory (Num, FlashCell, NumericInput, DataTable, OrderBook, OrderEntryPanel, …). Ask to build it and specify which layers first.
