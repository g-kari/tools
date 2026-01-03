"use client";

import { type ReactNode, useState, useEffect } from "react";
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
 * SSR/CSR両方で同じReactツリー構造を維持しつつ、
 * クライアントサイドでのみEmotionキャッシュを有効化する。
 *
 * SSR時: CacheProvider + ThemeProviderをレンダリングするが、
 *        Emotionキャッシュは空の状態（スタイル生成なし）
 * CSR時: ハイドレーション後にEmotionキャッシュが有効化され、
 *        MUIコンポーネントのスタイルが適用される
 *
 * @param props - プロバイダーのプロパティ
 * @param props.children - ラップする子要素
 * @returns MUIテーマとEmotionキャッシュを提供するプロバイダー
 */
export function MuiProvider({ children }: MuiProviderProps) {
  // SSR時はnull、CSR時にキャッシュを作成
  const [emotionCache, setEmotionCache] = useState(() => {
    // SSR環境かどうかをチェック
    if (typeof window === "undefined") {
      return null;
    }
    return createEmotionCache();
  });

  useEffect(() => {
    // CSRでキャッシュがまだない場合は作成
    if (!emotionCache) {
      setEmotionCache(createEmotionCache());
    }
  }, [emotionCache]);

  // SSR時はThemeProviderのみ（Emotionなし）
  if (!emotionCache) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  }

  // CSR時はCacheProvider + ThemeProvider
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
