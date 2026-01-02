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
 * SSR環境（Cloudflare Workers）ではEmotionキャッシュを使用せず、
 * クライアントサイドでのみCacheProviderを有効化する
 */
export function MuiProvider({ children }: MuiProviderProps) {
  const [emotionCache, setEmotionCache] = useState<ReturnType<
    typeof createEmotionCache
  > | null>(null);

  useEffect(() => {
    // クライアントサイドでのみEmotionキャッシュを作成
    setEmotionCache(createEmotionCache());
  }, []);

  // SSR時はThemeProviderのみ使用
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
