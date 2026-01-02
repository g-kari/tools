/**
 * @fileoverview MUIテーマ設定
 * Material Design 3のカラーシステムに基づいたカスタムテーマ
 */

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { ReactNode } from "react";

/**
 * カスタムMUIテーマ
 * 既存のMaterial Design 3カラーシステムと統合
 */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8b6914",
      light: "#ffedb3",
      dark: "#2d1f00",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#6b5e3f",
      light: "#f4e7c3",
      dark: "#231b04",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ba1a1a",
      light: "#ffdad6",
      contrastText: "#ffffff",
    },
    success: {
      main: "#2e7d32",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffef",
      paper: "#ffffef",
    },
    text: {
      primary: "#1c1b1e",
      secondary: "#49454e",
    },
    divider: "#cac4cf",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8,
        },
        thumb: {
          width: 20,
          height: 20,
        },
        track: {
          height: 8,
          borderRadius: 4,
        },
        rail: {
          height: 8,
          borderRadius: 4,
          opacity: 0.3,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

/**
 * テーマプロバイダーコンポーネント
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
