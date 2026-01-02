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
 * SSR環境（Cloudflare Workers）ではMUIプロバイダーを使用せず、
 * クライアントサイドでのみCacheProvider + ThemeProviderを有効化する
 *
 * @param props - プロバイダーのプロパティ
 * @param props.children - ラップする子要素
 * @returns MUIテーマとEmotionキャッシュを提供するプロバイダー（CSR時のみ）
 */
export function MuiProvider({ children }: MuiProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const [emotionCache, setEmotionCache] = useState<ReturnType<
    typeof createEmotionCache
  > | null>(null);

  useEffect(() => {
    // クライアントサイドでのみEmotionキャッシュを作成
    setIsClient(true);
    setEmotionCache(createEmotionCache());
  }, []);

  // SSR時はプロバイダーなしで子要素をそのまま返す
  if (!isClient || !emotionCache) {
    return <>{children}</>;
  }

  // CSR時はCacheProvider + ThemeProvider
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
