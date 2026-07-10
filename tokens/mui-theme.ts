/** Perpetua → MUI bridge. Same tokens.css variables, consumed by MUI's theme.
 *  MUI v5+ supports CSS variables natively via `cssVariables` / string values.
 */
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    long: Palette['primary'];
    short: Palette['primary'];
  }
  interface PaletteOptions {
    long?: PaletteOptions['primary'];
    short?: PaletteOptions['primary'];
  }
}

export const perpetuaMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: 'var(--pt-surface-0)',
      paper: 'var(--pt-surface-1)',
    },
    primary: { main: 'var(--pt-accent)' },
    error: { main: 'var(--pt-danger)' },
    warning: { main: 'var(--pt-warn)' },
    success: { main: 'var(--pt-success)' },
    long: { main: 'var(--pt-long)', contrastText: 'var(--pt-text-inverse)' },
    short: { main: 'var(--pt-short)', contrastText: 'var(--pt-text-inverse)' },
    text: {
      primary: 'var(--pt-text-primary)',
      secondary: 'var(--pt-text-secondary)',
      disabled: 'var(--pt-text-muted)',
    },
    divider: 'var(--pt-border-subtle)',
  },
  typography: {
    fontFamily: 'var(--pt-font-ui)',
    fontSize: 13,
    // Use for any price/size/PnL text:
    // sx={{ fontFamily: 'var(--pt-font-num)', fontFeatureSettings: 'var(--pt-nums)' }}
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: 'var(--pt-control-h)',
          textTransform: 'none',
          transitionDuration: 'var(--pt-dur-fast)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { height: 'var(--pt-row-h)' } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none', boxShadow: 'var(--pt-shadow-2)' } },
    },
  },
});
