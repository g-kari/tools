import { type ReactNode, useState, useEffect } from "react";

/**
 * クライアントサイドのみでレンダリングするラッパーコンポーネント
 * SSR時はfallbackを表示し、ハイドレーション後にchildrenを表示
 * これによりSSR/CSR間のDOM不一致を防止
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
