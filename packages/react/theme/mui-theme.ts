/** Perpetua → MUI bridge. Consumes the same theme/tokens.css variables.
 *  MUI v5+ supports CSS variables natively via string palette values.
 *  Brand: mono UI, square corners, hairlines, no shadows.
 */
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    long: Palette["primary"];
    short: Palette["primary"];
  }
  interface PaletteOptions {
    long?: PaletteOptions["primary"];
    short?: PaletteOptions["primary"];
  }
}

export const perpetuaMuiTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "var(--pt-bg-0)",
      paper: "var(--pt-bg-1)",
    },
    primary: { main: "var(--pt-accent)", contrastText: "var(--pt-accent-ink)" },
    error: { main: "var(--pt-health-danger)" },
    warning: { main: "var(--pt-health-warn)" },
    success: { main: "var(--pt-health-safe)" },
    long: { main: "var(--pt-long)", contrastText: "var(--pt-accent-ink)" },
    short: { main: "var(--pt-short)", contrastText: "var(--pt-accent-ink)" },
    text: {
      primary: "var(--pt-fg-0)",
      secondary: "var(--pt-fg-1)",
      disabled: "var(--pt-fg-2)",
    },
    divider: "var(--pt-border)",
  },
  typography: {
    // IBM Plex Mono for all UI/data; Newsreader (var(--pt-font-display)) reserved for display copy.
    fontFamily: "var(--pt-font-mono)",
    fontSize: 13,
  },
  shape: { borderRadius: 0 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: "var(--pt-control-h)",
          textTransform: "none",
          transitionDuration: "var(--pt-dur-fast)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { height: "var(--pt-row-h)" } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
          border: "var(--pt-hairline)",
        },
      },
    },
  },
});
