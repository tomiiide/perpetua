# Theming

`@perpkit/react` components are unstyled. They render structure and state; every visual decision flows through a CSS custom-property contract (`--pt-*`) and `data-*` attributes you target from your own styling system. Nothing is injected: if you never import the theme files, the primitives render bare.

The visual language behind the shipped values (terminal brutalist: near-black surfaces, hairlines, mono data, square corners) is documented in [design/STYLE_GUIDE.md](../design/STYLE_GUIDE.md). The machine-readable design source lives in [design/tokens/](../design/tokens/); `@perpkit/react` ships the compiled consumption layer.

## The token contract

Import the compiled tokens once at your app root:

```ts
import "@perpkit/react/theme/tokens.css";
```

That declares every `--pt-*` variable on `:root` (dark is the default theme). The categories:

| Group | Tokens | Notes |
| --- | --- | --- |
| Surfaces | `--pt-bg-0..3` | elevation ladder: page, panel, raised/hover, active/press |
| Hairlines | `--pt-border`, `--pt-border-strong`, `--pt-hairline` | 1px borders do all structural work; no shadows |
| Ink | `--pt-fg-0..3` | primary, secondary, labels, disabled |
| Accent | `--pt-accent`, `-strong`, `-dim`, `-ink`, `-wash` | electric teal, used sparingly |
| Market semantics | `--pt-long`, `--pt-short`, `--pt-long-wash`, `--pt-short-wash`, `--pt-flat` | the colors that carry information |
| Flash | `--pt-flash-up`, `--pt-flash-down`, `--pt-flash-duration` | flash-on-change, reuses the washes |
| Health | `--pt-health-safe`, `--pt-health-warn`, `--pt-health-danger` | account/margin state |
| Typography | `--pt-font-display`, `--pt-font-mono`, `--pt-display-*`, `--pt-mono-*`, `--pt-tracking-*`, `--pt-numeric` | serif display voice, mono for all data; tabular numerals |
| Spacing | `--pt-space-1..9` | 2px base scale |
| Shape | `--pt-radius` (0), `--pt-hairline` | square corners everywhere |
| Density | `--pt-row-h`, `--pt-control-h`, `--pt-cell-pad-x/y` | see density axis below |
| Motion | `--pt-ease`, `--pt-dur-fast`, `--pt-dur-med` | functional only, <= 150ms |
| Z | `--pt-z-sticky/popover/modal/toast` | |

Semantic aliases (`--pt-surface-panel`, `--pt-text-muted`, `--pt-link`, `--pt-focus-ring`) sit on top so app CSS can express intent instead of raw steps.

To retheme, override variables; never fork component styles:

```css
:root {
  --pt-accent: #7dd3fc;
  --pt-font-mono: "Berkeley Mono", ui-monospace, monospace;
}
```

## Theme, density, and regional axes

Three data attributes on `<html>` (or any subtree root) remap the variables:

```html
<html data-theme="dark" data-density="compact">
```

- `data-theme="light"`: opt-in light theme; overrides only the color tokens.
- `data-density="comfortable"`: remaps the density tokens (24px rows / 28px controls compact, 32px / 36px comfortable). Compact is the default because the audience is pro traders. Components size themselves from `--pt-row-h` and `--pt-control-h`, so density is one attribute flip, not a re-render.
- `data-updown="inverted"`: swaps long/short colors for red-up/green-down markets (KR/JP/CN).

Because these are plain attribute + variable remaps, they can be scoped: a comfortable settings panel inside a compact terminal is `<section data-density="comfortable">`.

## State styling via data attributes

Components expose state as attributes, never as baked-in colors:

| Attribute | Values | Emitted by |
| --- | --- | --- |
| `data-side` | `buy` / `sell` | side toggles, order rows |
| `data-delta` | `up` / `down` / `flat` | `Delta` |
| `data-flash` | `up` / `down` | `FlashCell` on change |
| `data-health` | `safe` / `warn` / `danger` | health meters |
| `data-status` | `connecting` / `live` / `stale` / `resyncing` / `error` | `StatusDot`, feed indicators |
| `data-part` | `sign` / `int` / `frac` / `unit` / `label` ... | sub-parts of `Num`, `Delta`, etc. |

Wire state to color in your CSS:

```css
[data-delta="up"]   { color: var(--pt-long); }
[data-delta="down"] { color: var(--pt-short); }
[data-flash="up"]   { background: var(--pt-flash-up); }
[data-num] [data-part="frac"] { color: var(--pt-fg-1); }
```

`Num` renders `sign`/`int`/`frac`/`unit` as separate `data-part` spans precisely so you can de-emphasize fractions or style signs without string parsing.

## Tailwind preset

The preset maps utilities onto the same variables, so Tailwind classes stay theme-, density-, and region-aware:

```js
// tailwind.config.js
module.exports = {
  presets: [require("@perpkit/react/tailwind.preset")],
  content: ["./src/**/*.{ts,tsx}"],
};
```

You get color scales (`bg-bg-1`, `text-fg-2`, `text-long`, `bg-short-wash`, `text-health-warn`), `border-hairline`, `font-mono`/`font-display`, mono type sizes (`text-mono-md`), token spacing, `h-row`/`h-control`, `rounded-pt`, and state variants for the data attributes:

```tsx
<span className="side-buy:text-long side-sell:text-short" data-side={side}>
<td className="flash-up:bg-long-wash flash-down:bg-short-wash">
```

Variants: `side-buy`, `side-sell`, `delta-up`, `delta-down`, `flash-up`, `flash-down`, `health-safe`, `health-warn`, `health-danger`.

## MUI bridge

For apps embedded in an MUI shell, `@perpkit/react/theme/mui` exports `perpetuaMuiTheme`, an MUI theme whose palette, typography, and component overrides resolve to the same `--pt-*` variables (square corners, hairline Paper, no shadows, mono type, plus `palette.long`/`palette.short`):

```tsx
import "@perpkit/react/theme/tokens.css";
import { ThemeProvider } from "@mui/material/styles";
import { perpetuaMuiTheme } from "@perpkit/react/theme/mui";

<ThemeProvider theme={perpetuaMuiTheme}>{app}</ThemeProvider>;
```

`@mui/material` is an optional peer dependency; the bridge is TypeScript source, compiled by your bundler like the rest of your app. Because palette values are `var(--pt-*)` strings, MUI components track theme and density flips with no MUI-side theme switching.

## Fonts

The tokens reference Newsreader (display) and IBM Plex Mono (data/UI) with system fallbacks, but do not load them. Load the fonts yourself (Google Fonts or self-hosted woff2); see the style guide's Fonts section.

## Worked example

[`examples/terminal`](../examples/terminal) is themed entirely through this contract: `tokens.css` imported once in `src/main.tsx`, one plain-CSS file (`src/styles.css`) of data-attribute state selectors with no literal colors, and live theme/density toggles that just set `data-theme` / `data-density` on `<html>`.
