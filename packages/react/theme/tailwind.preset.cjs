/** Perpetua Tailwind preset — maps utilities onto the CSS variables in theme/tokens.css.
 *  Usage: presets: [require('@perpetua/react/tailwind.preset')]
 *  Enables e.g.: bg-bg-1 text-long border-hairline h-row side-buy:text-long
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          0: "var(--pt-bg-0)", 1: "var(--pt-bg-1)",
          2: "var(--pt-bg-2)", 3: "var(--pt-bg-3)",
        },
        fg: {
          0: "var(--pt-fg-0)", 1: "var(--pt-fg-1)",
          2: "var(--pt-fg-2)", 3: "var(--pt-fg-3)",
        },
        accent: {
          DEFAULT: "var(--pt-accent)",
          strong: "var(--pt-accent-strong)",
          dim: "var(--pt-accent-dim)",
          ink: "var(--pt-accent-ink)",
          wash: "var(--pt-accent-wash)",
        },
        long: { DEFAULT: "var(--pt-long)", wash: "var(--pt-long-wash)" },
        short: { DEFAULT: "var(--pt-short)", wash: "var(--pt-short-wash)" },
        health: {
          safe: "var(--pt-health-safe)",
          warn: "var(--pt-health-warn)",
          danger: "var(--pt-health-danger)",
        },
      },
      borderColor: {
        hairline: "var(--pt-border)",
        strong: "var(--pt-border-strong)",
      },
      fontFamily: {
        display: "var(--pt-font-display)",
        mono: "var(--pt-font-mono)",
      },
      fontSize: {
        "mono-lg": ["16px", { lineHeight: "1.4", fontWeight: "500" }],
        "mono-md": ["13px", { lineHeight: "1.5" }],
        "mono-sm": ["12px", { lineHeight: "1.45" }],
        "mono-xs": ["11px", { lineHeight: "1.4" }],
        "mono-2xs": ["10px", { lineHeight: "1.3" }],
      },
      letterSpacing: {
        label: "var(--pt-tracking-label)",
        wide: "var(--pt-tracking-wide)",
      },
      spacing: {
        1: "var(--pt-space-1)", 2: "var(--pt-space-2)", 3: "var(--pt-space-3)",
        4: "var(--pt-space-4)", 5: "var(--pt-space-5)", 6: "var(--pt-space-6)",
        7: "var(--pt-space-7)", 8: "var(--pt-space-8)", 9: "var(--pt-space-9)",
      },
      height: {
        row: "var(--pt-row-h)",
        control: "var(--pt-control-h)",
      },
      borderRadius: {
        pt: "var(--pt-radius)",
      },
      transitionTimingFunction: { pt: "var(--pt-ease)" },
      transitionDuration: { fast: "100ms", med: "150ms" },
      zIndex: { popover: "40", modal: "50", toast: "60" },
    },
  },
  plugins: [
    // Style by component state: data-[side=long]:text-long, data-[delta=down]:text-short, etc.
    function ({ addVariant }) {
      addVariant("side-buy", '&[data-side="buy"]');
      addVariant("side-sell", '&[data-side="sell"]');
      addVariant("delta-up", '&[data-delta="up"]');
      addVariant("delta-down", '&[data-delta="down"]');
      addVariant("flash-up", '&[data-flash="up"]');
      addVariant("flash-down", '&[data-flash="down"]');
      addVariant("health-safe", '&[data-health="safe"]');
      addVariant("health-warn", '&[data-health="warn"]');
      addVariant("health-danger", '&[data-health="danger"]');
    },
  ],
};
