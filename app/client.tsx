/// <reference types="vinxi/types/client" />
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { createRouter } from "./router";
import createEmotionCache from "./utils/createEmotionCache";
import { theme } from "./theme";

const router = createRouter();
const emotionCache = createEmotionCache();

hydrateRoot(
  document,
  <CacheProvider value={emotionCache}>
    <ThemeProvider theme={theme}>
      <StartClient router={router} />
    </ThemeProvider>
  </CacheProvider>
);
