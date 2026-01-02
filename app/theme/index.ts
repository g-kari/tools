import { createTheme } from "@mui/material/styles";

/**
 * MUIテーマ設定
 *
 * 既存のMaterial Design 3カラーシステム（styles.css）と一致するように設定
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: "#8b6914",
      contrastText: "#ffffff",
      light: "#ffedb3",
      dark: "#2d1f00",
    },
    secondary: {
      main: "#6b5e3f",
      contrastText: "#ffffff",
      light: "#f4e7c3",
      dark: "#231b04",
    },
    error: {
      main: "#ba1a1a",
      contrastText: "#ffffff",
      light: "#ffdad6",
    },
    success: {
      main: "#2e7d32",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffef",
      paper: "#ffffff",
    },
    text: {
      primary: "#1c1b1e",
      secondary: "#49454e",
    },
    divider: "#cac4cf",
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 400,
      letterSpacing: "-0.5px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 400,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 500,
          padding: "15px 30px",
          borderRadius: "4px",
          minWidth: "120px",
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8b6914",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8b6914",
            borderWidth: "2px",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#79747e",
          "&.Mui-checked": {
            color: "#8b6914",
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: "#8b6914",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "4px",
          "&:before": {
            display: "none",
          },
        },
      },
    },
  },
});
