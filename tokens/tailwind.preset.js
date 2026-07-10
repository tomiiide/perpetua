/** Perpetua Tailwind preset — maps utilities onto the CSS variables in tokens.css.
 *  Usage: presets: [require('@perpetua/theme/tailwind.preset')]
 *  Enables e.g.: bg-surface-1 text-long border-subtle h-row rounded-md-pt
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--pt-surface-0)', 1: 'var(--pt-surface-1)',
          2: 'var(--pt-surface-2)', 3: 'var(--pt-surface-3)',
        },
        long: { DEFAULT: 'var(--pt-long)', hover: 'var(--pt-long-hover)', muted: 'var(--pt-long-muted)' },
        short: { DEFAULT: 'var(--pt-short)', hover: 'var(--pt-short-hover)', muted: 'var(--pt-short-muted)' },
        accent: { DEFAULT: 'var(--pt-accent)', hover: 'var(--pt-accent-hover)', muted: 'var(--pt-accent-muted)' },
        warn: 'var(--pt-warn)',
        danger: 'var(--pt-danger)',
        primary: 'var(--pt-text-primary)',
        secondary: 'var(--pt-text-secondary)',
        muted: 'var(--pt-text-muted)',
      },
      borderColor: {
        subtle: 'var(--pt-border-subtle)',
        strong: 'var(--pt-border-strong)',
      },
      fontFamily: {
        ui: 'var(--pt-font-ui)',
        num: 'var(--pt-font-num)',
      },
      fontSize: {
        '2xs': 'var(--pt-text-2xs)', 'xs-pt': 'var(--pt-text-xs)',
        'sm-pt': 'var(--pt-text-sm)', 'md-pt': 'var(--pt-text-md)',
        'lg-pt': 'var(--pt-text-lg)', 'xl-pt': 'var(--pt-text-xl)',
      },
      height: {
        row: 'var(--pt-row-h)',
        control: 'var(--pt-control-h)',
      },
      borderRadius: {
        'sm-pt': 'var(--pt-radius-sm)', 'md-pt': 'var(--pt-radius-md)', 'lg-pt': 'var(--pt-radius-lg)',
      },
      boxShadow: {
        1: 'var(--pt-shadow-1)', 2: 'var(--pt-shadow-2)', 3: 'var(--pt-shadow-3)',
        focus: 'var(--pt-focus-ring)',
      },
      transitionTimingFunction: { pt: 'var(--pt-ease)' },
      transitionDuration: { fast: '100ms', med: '180ms' },
      zIndex: { popover: '40', modal: '50', toast: '60' },
    },
  },
  plugins: [
    // Style by component state: data-[side=long]:text-long, data-[delta=down]:text-short, etc.
    function ({ addVariant }) {
      addVariant('side-long', '&[data-side="long"]');
      addVariant('side-short', '&[data-side="short"]');
      addVariant('delta-up', '&[data-delta="up"]');
      addVariant('delta-down', '&[data-delta="down"]');
      addVariant('health-warn', '&[data-health="warn"]');
      addVariant('health-danger', '&[data-health="danger"]');
    },
  ],
};
