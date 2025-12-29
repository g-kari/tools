import {
  Outlet,
  createRootRoute,
  Link,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <RootDocument>
      <div className="not-found-container">
        <h1 className="not-found-heading">404</h1>
        <h2 className="not-found-title">ページが見つかりません</h2>
        <p className="not-found-message">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link to="/" className="not-found-link">
          ホームに戻る
        </Link>
      </div>
    </RootDocument>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          メインコンテンツへスキップ
        </a>

        <div className="container">
          <header role="banner">
            <h1>Web ツール集</h1>
            <p className="subtitle">便利なWebツールを提供します</p>
            <nav className="nav-links" aria-label="ツールナビゲーション">
              <Link to="/" data-active={pathname === "/" ? "true" : undefined}>
                Unicode変換
              </Link>
              <Link
                to="/whois"
                data-active={pathname === "/whois" ? "true" : undefined}
              >
                WHOIS検索
              </Link>
              <Link
                to="/ip-geolocation"
                data-active={pathname === "/ip-geolocation" ? "true" : undefined}
              >
                IP検索
              </Link>
              <Link
                to="/global-ip"
                data-active={pathname === "/global-ip" ? "true" : undefined}
              >
                グローバルIP
              </Link>
              <Link
                to="/regex-checker"
                data-active={pathname === "/regex-checker" ? "true" : undefined}
              >
                正規表現
              </Link>
              <Link
                to="/json"
                data-active={pathname === "/json" ? "true" : undefined}
              >
                JSON
              </Link>
              <Link
                to="/url-encode"
                data-active={pathname === "/url-encode" ? "true" : undefined}
              >
                URLエンコード
              </Link>
              <Link
                to="/uuid"
                data-active={pathname === "/uuid" ? "true" : undefined}
              >
                UUID生成
              </Link>
              <Link
                to="/password-generator"
                data-active={pathname === "/password-generator" ? "true" : undefined}
              >
                パスワード生成
              </Link>
              <Link
                to="/server-env"
                data-active={pathname === "/server-env" ? "true" : undefined}
              >
                サーバー環境
              </Link>
              <Link
                to="/ogp"
                data-active={pathname === "/ogp" ? "true" : undefined}
              >
                OGPチェック
              </Link>
              <Link
                to="/jwt"
                data-active={pathname === "/jwt" ? "true" : undefined}
              >
                JWTデコード
              </Link>
              <Link
                to="/dummy-audio"
                data-active={pathname === "/dummy-audio" ? "true" : undefined}
              >
                ダミー音声
              </Link>
            </nav>
          </header>

          <main id="main-content" role="main">
            {children}
          </main>
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="status-message"
        />

        <Scripts />
      </body>
    </html>
  );
}
