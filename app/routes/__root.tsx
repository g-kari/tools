import {
  Outlet,
  createRootRoute,
  Link,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useState, useRef, useCallback, useEffect } from "react";
import appCss from "../styles.css?url";
import { ToastProvider } from "../components/Toast";

const navCategories = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      { path: "/", label: "Unicode変換" },
      { path: "/url-encode", label: "URLエンコード" },
      { path: "/base64", label: "Base64変換" },
      { path: "/json", label: "JSON整形" },
      { path: "/audio-converter", label: "オーディオ変換" },
      { path: "/video-converter", label: "動画変換" },
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
    name: "画像",
    icon: "🎨",
    items: [
      { path: "/color-extractor", label: "カラー抽出" },
      { path: "/image-to-gif", label: "画像→GIF変換" },
      { path: "/emoji-converter", label: "絵文字変換" },
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
    name: "テキスト",
    icon: "📝",
    items: [
      { path: "/char-count", label: "文字数カウント" },
      { path: "/text-sort", label: "ソート/重複削除" },
    ],
  },
  {
    name: "検証",
    icon: "✓",
    items: [
      { path: "/regex-checker", label: "正規表現" },
      { path: "/jwt", label: "JWTデコード" },
      { path: "/email-dns", label: "メールDNS" },
      { path: "/hash", label: "ハッシュ生成" },
      { path: "/security-headers", label: "セキュリティヘッダー" },
    ],
  },
  {
    name: "情報",
    icon: "ℹ",
    items: [{ path: "/server-env", label: "サーバー環境" }],
  },
  {
    name: "ゲーム",
    icon: "🎲",
    items: [{ path: "/dice-roll", label: "ダイスロール" }],
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
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap",
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

/**
 * ナビゲーションカテゴリコンポーネント
 * ホバーまたはクリックでドロップダウンメニューを表示する
 * キーボードナビゲーション対応（WCAG 2.1準拠）
 * @param props - コンポーネントのプロパティ
 * @param props.category - カテゴリ情報（名前、アイコン、アイテム一覧）
 * @param props.pathname - 現在のパス名（アクティブ状態の判定に使用）
 * @returns カテゴリボタンとドロップダウンメニューを含むJSX要素
 */
function NavCategory({
  category,
  pathname,
}: {
  category: (typeof navCategories)[0];
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isActive = category.items.some((item) => item.path === pathname);

  // ドロップダウンが開いたときに最初のアイテムにフォーカス
  useEffect(() => {
    if (isOpen && focusedIndex === -1) {
      setFocusedIndex(0);
    }
  }, [isOpen, focusedIndex]);

  // フォーカスインデックスが変更されたときにフォーカスを更新
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
      items[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      // ドロップダウンが閉じている場合
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    // ドロップダウンが開いている場合
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < category.items.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : category.items.length - 1
        );
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case "Tab":
        // Tabでドロップダウンを閉じる
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(category.items.length - 1);
        break;
    }
  }, [isOpen, category.items.length]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  return (
    <div
      className="nav-category"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={handleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
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
        <div className="nav-dropdown" role="menu" ref={menuRef}>
          {category.items.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              className={`nav-dropdown-item ${pathname === item.path ? "active" : ""}`}
              onClick={handleClose}
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
