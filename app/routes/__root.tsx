import {
  Outlet,
  createRootRoute,
  Link,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import appCss from "../styles.css?url";
import { ToastProvider } from "../components/Toast";

const navCategories = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      { path: "/", label: "Unicode変換" },
      { path: "/url-encode", label: "URLエンコード" },
      { path: "/json", label: "JSON整形" },
    ],
  },
  {
    name: "生成",
    icon: "✦",
    items: [
      { path: "/uuid", label: "UUID生成" },
      { path: "/password-generator", label: "パスワード" },
      { path: "/dummy-image", label: "ダミー画像" },
      { path: "/dummy-audio", label: "ダミー音声" },
    ],
  },
  {
    name: "検索",
    icon: "🔍",
    items: [
      { path: "/whois", label: "WHOIS" },
      { path: "/ip-geolocation", label: "IP検索" },
      { path: "/global-ip", label: "グローバルIP" },
      { path: "/ogp", label: "OGPチェック" },
    ],
  },
  {
    name: "検証",
    icon: "✓",
    items: [
      { path: "/regex-checker", label: "正規表現" },
      { path: "/jwt", label: "JWTデコード" },
      { path: "/email-dns", label: "メールDNS" },
    ],
  },
  {
    name: "情報",
    icon: "ℹ",
    items: [{ path: "/server-env", label: "サーバー環境" }],
  },
];

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

function NavCategory({
  category,
  pathname,
}: {
  category: (typeof navCategories)[0];
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = category.items.some((item) => item.path === pathname);

  return (
    <div
      className="nav-category"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`nav-category-btn ${isActive ? "active" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="nav-category-icon" aria-hidden="true">
          {category.icon}
        </span>
        <span>{category.name}</span>
        <span className="nav-category-arrow" aria-hidden="true">
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="nav-dropdown" role="menu">
          {category.items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              role="menuitem"
              className={`nav-dropdown-item ${pathname === item.path ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
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
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            メインコンテンツへスキップ
          </a>

          <div className="container">
            <header role="banner">
              <h1>Web ツール集</h1>
              <p className="subtitle">便利なWebツールを提供します</p>
              <nav className="nav-categories" aria-label="ツールナビゲーション">
                {navCategories.map((category) => (
                  <NavCategory
                    key={category.name}
                    category={category}
                    pathname={pathname}
                  />
                ))}
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
        </ToastProvider>

        <Scripts />
      </body>
    </html>
  );
}
