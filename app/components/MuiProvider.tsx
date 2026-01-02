import { type ReactNode, useState, useEffect, lazy, Suspense } from "react";

interface MuiProviderProps {
  children: ReactNode;
}

/**
 * MUIテーマプロバイダー（クライアント専用）
 * クライアントサイドでのみThemeProviderをレンダリングする
 */
const ClientMuiProvider = lazy(async () => {
  const [{ CacheProvider }, { ThemeProvider }, createEmotionCache, { theme }] =
    await Promise.all([
      import("@emotion/react"),
      import("@mui/material/styles"),
      import("../utils/createEmotionCache").then((m) => m.default),
      import("../theme"),
    ]);

  const cache = createEmotionCache();

  return {
    default: function InnerMuiProvider({ children }: MuiProviderProps) {
      return (
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </CacheProvider>
      );
    },
  };
});

/**
 * MUI Provider コンポーネント
 *
 * SSR環境（Cloudflare Workers Edge Runtime）ではMUI/Emotionをロードせず、
 * クライアントサイドでのみ動的インポートしてCacheProvider + ThemeProviderを有効化する。
 * これによりEdge RuntimeでのNode.js API依存問題を回避する。
 *
 * @param props - プロバイダーのプロパティ
 * @param props.children - ラップする子要素
 * @returns MUIテーマとEmotionキャッシュを提供するプロバイダー（CSR時のみ）
 */
export function MuiProvider({ children }: MuiProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR時は子要素をそのまま返す（MUI/Emotionをロードしない）
  if (!isClient) {
    return <>{children}</>;
  }

  // CSR時は動的にMUIプロバイダーをロード
  return (
    <Suspense fallback={<>{children}</>}>
      <ClientMuiProvider>{children}</ClientMuiProvider>
    </Suspense>
  );
}
