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
});

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
