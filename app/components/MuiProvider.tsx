"use client";

import { type ReactNode, useMemo } from "react";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import createEmotionCache from "../utils/createEmotionCache";
import { theme } from "../theme";

interface MuiProviderProps {
  children: ReactNode;
}

/**
 * MUI Provider コンポーネント
 *
 * ClientOnlyでラップされることを前提としたクライアント専用プロバイダー。
 * Emotionキャッシュとテーマを提供する。
 *
 * @param props - プロバイダーのプロパティ
 * @param props.children - ラップする子要素
 * @returns MUIテーマとEmotionキャッシュを提供するプロバイダー
 */
export function MuiProvider({ children }: MuiProviderProps) {
  const emotionCache = useMemo(() => createEmotionCache(), []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
