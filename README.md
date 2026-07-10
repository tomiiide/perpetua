# trader-pro (working name: Perpetua)

Foundational widgets for pro trading software. Perps-first; swap, DEX, and prediction-market verticals reuse the same primitives.

- **SPEC.md** — full component inventory: headless core → primitives → trading atoms → widgets → templates, plus adapter interfaces.
- **tokens/** — the design system contract:
  - `tokens.json` — W3C Design Tokens source of truth
  - `tokens.css` — CSS custom properties (dark/light themes, density axis, inverted up/down colors)
  - `tailwind.preset.js` — Tailwind consumption
  - `mui-theme.ts` — MUI consumption
- **landing/index.html** — landing page. Self-contained, dogfoods the tokens, includes a live animated perps terminal mockup. Open directly in a browser.

Strategy (from planning discussion): headless logic is the defensible layer, open-core distribution (MIT core, paid Pro widgets), one vertical at a time.
