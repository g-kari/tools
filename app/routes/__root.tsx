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
import { AdBanner } from "../components/AdBanner";
import {
  SITE_NAME,
  SITE_BASE_URL,
  SITE_DESCRIPTION,
  SITE_OGP_IMAGE,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOT_ID,
} from "../constants/site";

const navCategories = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      { path: "/number-theory", label: "数論ツール" },
      { path: "/unicode", label: "Unicode変換" },
      { path: "/url-encode", label: "URLエンコード" },
      { path: "/url-parser", label: "URLパーサー" },
      { path: "/utm-builder", label: "UTMパラメータビルダー" },
      { path: "/html-encode", label: "HTMLエンコード" },
      { path: "/html-formatter", label: "HTMLフォーマッター" },
      { path: "/number-base", label: "数値進数変換" },
      { path: "/msgpack", label: "MessagePack変換" },
      { path: "/base64", label: "Base64変換" },
      { path: "/base16", label: "Base16 (Hex) 変換" },
      { path: "/base32", label: "Base32変換" },
      { path: "/base64-image", label: "Base64画像デコード" },
      { path: "/json", label: "JSON整形" },
      { path: "/json-path", label: "JSONPath評価" },
      { path: "/json-flatten", label: "JSONフラット化" },
      { path: "/json-schema", label: "JSONスキーマ生成" },
      { path: "/json-to-ts", label: "JSON→TS型変換" },
      { path: "/json-to-zod", label: "JSON→Zodスキーマ生成" },
      { path: "/json-to-graphql", label: "JSON→GraphQLスキーマ生成" },
      { path: "/json-to-sql", label: "JSON→SQL CREATE TABLE生成" },
      { path: "/sql-to-ts", label: "SQL→TypeScript型変換" },
      { path: "/json-pointer", label: "JSON Pointer評価" },
      { path: "/html-to-jsx", label: "HTML→JSX変換" },
      { path: "/html-markdown", label: "HTML→Markdown変換" },
      { path: "/json-lines", label: "JSON Lines フォーマッター" },
      { path: "/json-compare", label: "JSON比較" },
      { path: "/json-merge", label: "JSONマージ" },
      { path: "/csv-json", label: "CSV/JSON変換" },
      { path: "/yaml-json", label: "YAML/JSON変換" },
      { path: "/yaml-toml", label: "YAML↔TOML変換" },
      { path: "/toml-json", label: "TOML/JSON変換" },
      { path: "/xml", label: "XMLフォーマッター" },
      { path: "/xpath", label: "XPath評価器" },
      { path: "/sql", label: "SQLフォーマッター" },
      { path: "/graphql", label: "GraphQL フォーマッター" },
      { path: "/php-serialize", label: "PHPシリアライズ" },
      { path: "/minify", label: "コード圧縮" },
      { path: "/unit-converter", label: "単位変換" },
      { path: "/storage-converter", label: "ストレージ単位変換" },
      { path: "/transfer-speed", label: "転送速度・転送時間計算" },
      { path: "/css-unit", label: "CSS単位変換" },
      { path: "/css-shorthand", label: "CSSショートハンド展開" },
      { path: "/css-clamp", label: "CSS Fluid/Clamp 計算機" },
      { path: "/math-eval", label: "数式評価" },
      { path: "/statistics", label: "統計計算" },
      { path: "/matrix", label: "行列計算" },
      { path: "/function-plotter", label: "関数グラフ描画" },
      { path: "/combinatorics", label: "順列・組合せ計算" },
      { path: "/geometry", label: "幾何計算機" },
      { path: "/truth-table", label: "論理式真理値表" },
      { path: "/bitwise", label: "ビット演算計算機" },
      { path: "/ieee754", label: "IEEE 754 浮動小数点数" },
      { path: "/hex-viewer", label: "Hex Viewer" },
      { path: "/audio-converter", label: "オーディオ変換" },
      { path: "/video-converter", label: "動画変換" },
      { path: "/timezone", label: "タイムゾーン変換" },
      { path: "/world-clock", label: "ワールドクロック" },
      { path: "/timestamp", label: "Unixタイムスタンプ" },
      { path: "/date-calc", label: "日付計算" },
      { path: "/number-format", label: "数値フォーマット" },
      { path: "/encoding", label: "文字コード変換" },
      { path: "/env-parser", label: ".envパーサー" },
      { path: "/xml-json", label: "XML/JSON変換" },
      { path: "/yaml-formatter", label: "YAMLフォーマッター" },
      { path: "/toml-formatter", label: "TOMLフォーマッター" },
      { path: "/unicode-inspector", label: "Unicodeコードポイント検査" },
      { path: "/punycode", label: "Punycode変換 (IDN)" },
      { path: "/string-escape", label: "文字列エスケープ" },
      { path: "/base36", label: "Base36変換" },
      { path: "/base58", label: "Base58変換" },
      { path: "/base62", label: "Base62変換" },
      { path: "/base85", label: "Base85変換" },
      { path: "/zenkaku", label: "全角/半角変換" },
      { path: "/kana-convert", label: "仮名・ローマ字変換" },
      { path: "/roman-numerals", label: "ローマ数字変換" },
      { path: "/wareki", label: "和暦・西暦変換" },
      { path: "/number-words", label: "数値テキスト変換" },
      { path: "/daiji", label: "大字変換" },
      { path: "/fraction", label: "分数変換" },
      { path: "/csv-sql", label: "CSV→SQL変換" },
      { path: "/ini-parser", label: "INIファイルパーサー" },
      { path: "/gzip", label: "GZip/Deflate 圧縮・解凍" },
      { path: "/template", label: "Mustache テンプレート" },
      { path: "/ascii-table", label: "ASCII テーブル" },
      { path: "/duration", label: "時間計算・変換" },
      { path: "/encode-chain", label: "エンコードチェーン" },
      { path: "/geohash", label: "Geohash変換" },
      { path: "/haversine", label: "Haversine距離計算" },
      { path: "/percentage-calculator", label: "パーセンテージ計算機" },
      { path: "/loan-calculator", label: "ローン計算機" },
      { path: "/compound-interest", label: "複利計算機" },
      { path: "/tax-calculator", label: "消費税計算機" },
      { path: "/warikan", label: "割り勘計算機" },
      { path: "/bmi-calculator", label: "BMI計算機" },
    ],
  },
  {
    name: "生成",
    icon: "✦",
    items: [
      { path: "/html-playground", label: "HTML/CSS/JS プレイグラウンド" },
      { path: "/sequences", label: "数列ジェネレーター" },
      { path: "/passphrase", label: "パスフレーズ" },
      { path: "/uuid", label: "UUID生成" },
      { path: "/uuid-inspector", label: "UUID解析" },
      { path: "/password-generator", label: "パスワード" },
      { path: "/dummy-image", label: "ダミー画像" },
      { path: "/dummy-audio", label: "ダミー音声" },
      { path: "/favicon-generator", label: "Favicon生成" },
      { path: "/qr-code", label: "QRコード" },
      { path: "/barcode", label: "バーコード" },
      { path: "/lorem-ipsum", label: "Lorem Ipsum" },
      { path: "/gitignore", label: "Gitignore生成" },
      { path: "/robots-txt", label: "robots.txtジェネレーター" },
      { path: "/sitemap", label: "Sitemap XMLジェネレーター" },
      { path: "/web-manifest", label: "Web App Manifestジェネレーター" },
      { path: "/random-data", label: "ランダムデータ生成" },
      { path: "/ascii-art", label: "ASCIIアート生成" },
      { path: "/jwt-generator", label: "JWT生成" },
      { path: "/slug", label: "スラッグ生成" },
      { path: "/typography-scale", label: "タイポグラフィスケール生成" },
      { path: "/ulid", label: "ULID生成" },
      { path: "/nano-id", label: "Nano ID 生成" },
      { path: "/short-code", label: "ショートコード生成" },
      { path: "/json-schema-validator", label: "JSON Schema バリデーター" },
      { path: "/seo-meta", label: "SEOメタタグ生成" },
      { path: "/mermaid", label: "Mermaidプレビュー" },
      { path: "/github-badge", label: "GitHubバッジ生成" },
      { path: "/vscode-snippet", label: "VSCodeスニペット生成" },
    ],
  },
  {
    name: "画像",
    icon: "🖼️",
    items: [
      { path: "/image-compress", label: "画像圧縮" },
      { path: "/image-base64", label: "Base64変換" },
      { path: "/image-resize", label: "画像リサイズ" },
      { path: "/image-crop", label: "画像トリミング" },
      { path: "/transparent-image", label: "透過画像" },
      { path: "/css-gradient", label: "CSSグラジェント生成" },
      { path: "/css-background-pattern", label: "CSS背景パターン生成" },
      { path: "/css-animation", label: "CSSアニメーション生成" },
      { path: "/css-cubic-bezier", label: "CSS Cubic Bezier ジェネレーター" },
      { path: "/css-flexbox", label: "CSSフレックスボックス" },
      { path: "/css-grid", label: "CSS Gridジェネレーター" },
      { path: "/css-box-shadow", label: "CSS Box Shadowジェネレーター" },
      { path: "/css-text-shadow", label: "CSS Text Shadowジェネレーター" },
      { path: "/css-border-radius", label: "CSS Border Radiusジェネレーター" },
      { path: "/css-filter", label: "CSS Filterジェネレーター" },
      { path: "/css-transform", label: "CSS Transformジェネレーター" },
      { path: "/css-clip-path", label: "CSS Clip-pathジェネレーター" },
      { path: "/css-container-query", label: "CSS Container Query ビルダー" },
      { path: "/css-scroll-snap", label: "CSS Scroll Snap ジェネレーター" },
      { path: "/css-specificity", label: "CSS詳細度計算機" },
      { path: "/css-variables", label: "CSS変数エクストラクター" },
      { path: "/aspect-ratio", label: "アスペクト比計算機" },
      { path: "/image-to-gif", label: "画像→GIF変換" },
      { path: "/emoji-converter", label: "絵文字変換" },
      { path: "/discord-emoji", label: "Discord絵文字" },
      { path: "/discord-sticker", label: "Discordスタンプ" },
      { path: "/svg-optimizer", label: "SVG最適化" },
      { path: "/css-media-query", label: "CSSメディアクエリビルダー" },
    ],
  },
  {
    name: "カラー",
    icon: "🎨",
    items: [
      { path: "/color-picker", label: "カラーピッカー" },
      { path: "/color-converter", label: "カラーフォーマット変換" },
      { path: "/color-palette", label: "カラーパレット生成" },
      { path: "/color-harmony", label: "カラーハーモニー" },
      { path: "/color-token", label: "カラートークン生成" },
      { path: "/color-contrast", label: "カラーコントラストチェッカー" },
      { path: "/color-blind", label: "色覚シミュレーター" },
      { path: "/color-mix", label: "CSS color-mix() プレイグラウンド" },
      { path: "/color-name", label: "色名検索" },
      { path: "/color-extractor", label: "カラー抽出" },
      { path: "/color-temperature", label: "色温度変換" },
    ],
  },
  {
    name: "検索",
    icon: "🔍",
    items: [
      { path: "/whois", label: "WHOIS" },
      { path: "/dns-lookup", label: "DNSレコード" },
      { path: "/ip-geolocation", label: "IP検索" },
      { path: "/global-ip", label: "グローバルIP" },
      { path: "/ogp", label: "OGPチェック" },
      { path: "/ogp-generator", label: "OGPメタタグ生成" },
    ],
  },
  {
    name: "テキスト",
    icon: "📝",
    items: [
      { path: "/char-count", label: "文字数カウント" },
      { path: "/text-sort", label: "ソート/重複削除" },
      { path: "/diff", label: "テキスト差分" },
      { path: "/markdown-preview", label: "Markdownプレビュー" },
      { path: "/text-case", label: "テキストケース変換" },
      { path: "/morse-code", label: "Morse Code変換" },
      { path: "/text-binary", label: "テキスト↔バイナリ変換" },
      { path: "/nato-alphabet", label: "NATOフォネティックアルファベット" },
      { path: "/braille", label: "点字（Braille）変換" },
      { path: "/markdown-table", label: "Markdownテーブル生成" },
      { path: "/text-encrypt", label: "テキスト暗号化" },
      { path: "/text-line", label: "テキスト行操作" },
      { path: "/text-stats", label: "テキスト統計" },
      { path: "/char-frequency", label: "文字頻度分析" },
      { path: "/word-frequency", label: "単語頻度分析" },
      { path: "/entropy", label: "シャノンエントロピー計算" },
      { path: "/text-replace", label: "テキスト置換" },
      { path: "/string-similarity", label: "文字列類似度計算" },
      { path: "/readability", label: "可読性スコア分析" },
      { path: "/token-estimator", label: "LLMトークン推定" },
      { path: "/line-ending", label: "改行コード変換" },
      { path: "/zero-width", label: "ゼロ幅文字検出・除去" },
      { path: "/caesar", label: "シーザー暗号・ROT13" },
      { path: "/vigenere", label: "ヴィジュネル暗号" },
      { path: "/affine", label: "アフィン暗号" },
      { path: "/rail-fence", label: "Rail Fence暗号（柵暗号）" },
      { path: "/fancy-text", label: "ファンシーテキスト変換" },
      { path: "/ansi-color", label: "ANSIターミナルカラーコードビルダー" },
    ],
  },
  {
    name: "検証",
    icon: "✓",
    items: [
      { path: "/regex-library", label: "正規表現ライブラリ" },
      { path: "/regex-checker", label: "正規表現" },
      { path: "/jwt", label: "JWTデコード" },
      { path: "/totp", label: "TOTP生成" },
      { path: "/email-dns", label: "メールDNS" },
      { path: "/email-header", label: "メールヘッダー解析" },
      { path: "/hash", label: "ハッシュ生成" },
      { path: "/security-headers", label: "セキュリティヘッダー" },
      { path: "/cron", label: "Cronパーサー (croner)" },
      { path: "/cron-parser", label: "Cron式パーサー" },
      { path: "/user-agent", label: "User-Agent解析" },
      { path: "/http-status", label: "HTTPステータスコード" },
      { path: "/http-headers", label: "HTTPヘッダーリファレンス" },
      { path: "/mime-types", label: "MIMEタイプリファレンス" },
      { path: "/cookie-parser", label: "Cookieパーサー" },
      { path: "/keycode", label: "キーコードチェック" },
      { path: "/hmac", label: "HMAC 生成" },
      { path: "/sri-hash", label: "SRI ハッシュ生成" },
      { path: "/semver", label: "Semver チェッカー" },
      { path: "/conventional-commits", label: "Conventional Commits" },
      { path: "/cache-control", label: "Cache-Control ビルダー" },
      { path: "/csp-builder", label: "CSP ビルダー" },
      { path: "/cors-builder", label: "CORS ヘッダービルダー" },
      { path: "/pkce", label: "PKCE ジェネレーター" },
      { path: "/cert-decoder", label: "X.509 証明書デコーダー" },
      { path: "/password-strength", label: "パスワード強度チェッカー" },
      { path: "/basic-auth", label: "HTTP Basic Auth" },
      { path: "/ssh-key", label: "SSH鍵生成" },
      { path: "/luhn-check", label: "Luhn / クレジットカード検証" },
      { path: "/iban", label: "IBAN バリデーター" },
      { path: "/isbn", label: "ISBN バリデーター" },
      { path: "/phone", label: "電話番号フォーマッター" },
      { path: "/css-selector", label: "CSS Selectorテスター" },
      { path: "/glob-tester", label: "Glob パターンテスター" },
    ],
  },
  {
    name: "ネットワーク",
    icon: "🌐",
    items: [
      { path: "/cidr", label: "CIDR計算" },
      { path: "/ip-cidr-check", label: "CIDR範囲チェック" },
      { path: "/ip-converter", label: "IP変換" },
      { path: "/ipv6", label: "IPv6解析・変換" },
      { path: "/port-check", label: "ポートチェック" },
      { path: "/ports", label: "ポート番号リファレンス" },
      { path: "/chmod", label: "Chmod計算" },
      { path: "/http-client", label: "HTTP APIテスター" },
      { path: "/curl-builder", label: "curlビルダー" },
      { path: "/curl-to-fetch", label: "cURL → fetch 変換" },
      { path: "/docker-run-to-compose", label: "docker run → Compose 変換" },
      { path: "/nginx-config", label: "Nginx設定ジェネレーター" },
      { path: "/dockerfile", label: "Dockerfileジェネレーター" },
      { path: "/redirect-tracer", label: "リダイレクトトレーサー" },
      { path: "/openssl-builder", label: "OpenSSLビルダー" },
      { path: "/har", label: "HAR アナライザー" },
      { path: "/websocket", label: "WebSocket テスター" },
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
    items: [
      { path: "/dice-roll", label: "ダイスロール" },
      { path: "/typing-speed", label: "タイピング速度測定" },
      { path: "/pomodoro", label: "ポモドーロタイマー" },
      { path: "/countdown", label: "カウントダウンタイマー" },
      { path: "/stopwatch", label: "ストップウォッチ" },
      { path: "/brainfuck", label: "Brainfuck インタープリター" },
      { path: "/random-picker", label: "ランダムピッカー" },
      { path: "/sudoku", label: "数独ゲーム" },
      { path: "/minesweeper", label: "マインスイーパー" },
      { path: "/game-2048", label: "2048" },
      { path: "/snake", label: "スネークゲーム" },
      { path: "/hangman", label: "ハングマン" },
      { path: "/tetris", label: "テトリス" },
      { path: "/life-game", label: "ライフゲーム" },
      { path: "/wordle", label: "Wordle" },
    ],
  },
];

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: SITE_NAME },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: SITE_BASE_URL },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SITE_OGP_IMAGE },
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
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap",
      },
      {
        rel: "preconnect",
        href: "https://pagead2.googlesyndication.com",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: ADSENSE_PUBLISHER_ID
      ? [
          {
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`,
            async: true,
            crossOrigin: 'anonymous' as const,
          },
        ]
      : [],
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
        <Link to="/top" className="not-found-link">
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
              <h1 className="terminal-cursor">Web ツール集</h1>
              <p className="subtitle">便利なWebツールを提供します</p>
              <nav className="nav-categories" aria-label="ツールナビゲーション">
                <Link
                  to="/top"
                  className={`nav-home-link ${pathname === "/top" ? "active" : ""}`}
                  aria-label="ツール一覧ホームへ"
                >
                  <span aria-hidden="true">🏠</span>
                  <span>ホーム</span>
                </Link>
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
              <AdBanner adSlot={ADSENSE_SLOT_ID} adType="responsive" />
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
