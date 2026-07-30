# @perpkit/react

Unstyled, accessible React primitives for trading UIs, plus the Perpetua theme layer. Components carry structure and state; every visual decision flows through a `--pt-*` CSS token contract and `data-*` attributes you style with plain CSS, Tailwind, or MUI.

Includes numeric display (`Num`, `Delta`, `FlashCell`, `Sparkline`, `CountdownText`), inputs (`NumericInput`, `SideToggle`, `SegmentedControl`, `SteppedSlider`, ...), structure (`DataTable`, `VirtualList`, `StatusDot`, `Meter`, ...), and Radix-based overlays (`Dialog`, `Popover`, `Tabs`, `Toast`, ...).

## Install

```bash
pnpm add @perpkit/react   # React 18/19 peer
```

## Example

```tsx
import "@perpkit/react/theme/tokens.css";
import { Num } from "@perpkit/react/components";
import { formatPrice } from "@perpkit/core";

<Num parts={formatPrice("64051.5", { tickSize: "0.1" })} />;
```

```css
[data-num] [data-part="frac"] { color: var(--pt-fg-1); }
[data-side="buy"] { color: var(--pt-long); }
```

Theme layer: `theme/tokens.css` (the token contract, dark default, `data-theme="light"`, `data-density` axis), `tailwind.preset` (utilities + state variants over the same variables), and `theme/mui` (MUI theme bridge).

## Docs

- [Getting started](https://github.com/tomiiide/perpetua/blob/main/docs/getting-started.md)
- [Theming](https://github.com/tomiiide/perpetua/blob/main/docs/theming.md)
- [Live terminal example](https://github.com/tomiiide/perpetua/tree/main/examples/terminal)

MIT.
