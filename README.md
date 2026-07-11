# trader-pro (working name: Perpetua)

Foundational widgets for pro trading software. Perps-first; swap, DEX, and prediction-market verticals reuse the same primitives.

- **SPEC.md** — full component inventory: headless core → primitives → trading atoms → widgets → templates, plus adapter interfaces.
- **packages/** — the monorepo: `@perpetua/core` (headless client, actions, engines, decimal math), `@perpetua/venues` (Hyperliquid market-data venue), `@perpetua/react` (unstyled primitives + the theme layer).
- **design/** — the design system source of truth:
  - `STYLE_GUIDE.md` — the consolidated brand + visual style guide
  - `tokens/` — token definitions: `colors.css`, `typography.css`, `spacing.css`, `fonts.css`, and `tokens.json` (W3C Design Tokens)
  - `assets/` — logo marks
- **packages/react/theme/** — the React consumption layer, compiled from the design tokens:
  - `tokens.css` — the `--pt-*` CSS custom properties components reference (dark/light themes, density axis, inverted up/down colors)
  - `tailwind.preset.js` — Tailwind consumption
  - `mui-theme.ts` — MUI consumption
- **landing/index.html** — landing page. Self-contained, dogfoods the tokens, includes a live animated perps terminal mockup. Open directly in a browser.

Strategy (from planning discussion): headless logic is the defensible layer, open-core distribution (MIT core, paid Pro widgets), one vertical at a time.
