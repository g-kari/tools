import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";

/**
 * ツールアイテムの型定義
 */
interface ToolItem {
  /** ツールのパス */
  path: string;
  /** ツールの表示名 */
  label: string;
  /** ツールの説明 */
  description: string;
  /** ツールのアイコン（絵文字） */
  icon: string;
}

/**
 * ツールカテゴリの型定義
 */
interface ToolCategory {
  /** カテゴリ名 */
  name: string;
  /** カテゴリアイコン */
  icon: string;
  /** カテゴリに含まれるツール */
  items: ToolItem[];
}

/**
 * 全ツールのカタログデータ
 * カテゴリ別に整理されたツール一覧
 */
const toolCatalog: ToolCategory[] = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      {
        path: "/",
        label: "Unicode変換",
        description: "Unicode文字列のエスケープ/アンエスケープ変換",
        icon: "🔤",
      },
      {
        path: "/url-encode",
        label: "URLエンコード",
        description: "URL文字列のエンコード/デコード変換",
        icon: "🔗",
      },
      {
        path: "/html-encode",
        label: "HTMLエンコード",
        description: "HTML特殊文字のエスケープ変換",
        icon: "📄",
      },
      {
        path: "/msgpack",
        label: "MessagePack変換",
        description: "MessagePackとJSONの相互変換",
        icon: "📦",
      },
      {
        path: "/base64",
        label: "Base64変換",
        description: "文字列/バイナリのBase64エンコード・デコード",
        icon: "🔀",
      },
      {
        path: "/base64-image",
        label: "Base64画像デコード",
        description: "Base64エンコード画像のデコードとプレビュー",
        icon: "🖼️",
      },
      {
        path: "/json",
        label: "JSON整形",
        description: "JSONデータの整形・検証・圧縮",
        icon: "{ }",
      },
      {
        path: "/php-serialize",
        label: "PHPシリアライズ",
        description: "PHPシリアライズ形式とJSONの相互変換",
        icon: "🐘",
      },
      {
        path: "/minify",
        label: "コード圧縮",
        description: "HTML/CSS/JavaScriptのコード圧縮",
        icon: "⬇️",
      },
      {
        path: "/timestamp",
        label: "タイムスタンプ変換",
        description: "Unixタイムスタンプと日時の相互変換",
        icon: "⏱️",
      },
      {
        path: "/unit-converter",
        label: "単位変換",
        description: "長さ・重さ・温度など各種単位の相互変換",
        icon: "📐",
      },
      {
        path: "/audio-converter",
        label: "オーディオ変換",
        description: "音声ファイルの形式変換（MP3/WAV/OGG等）",
        icon: "🎵",
      },
      {
        path: "/video-converter",
        label: "動画変換",
        description: "動画ファイルの形式変換（MP4/WebM等）",
        icon: "🎬",
      },
      {
        path: "/yaml-json",
        label: "YAML/JSON変換",
        description: "YAMLとJSONの相互変換ツール。設定ファイルの変換に便利。",
        icon: "🔄",
      },
      {
        path: "/toml-json",
        label: "TOML/JSON変換",
        description:
          "TOMLとJSONの相互変換ツール。Cargo.toml、pyproject.toml等の変換に便利。",
        icon: "🔄",
      },
      {
        path: "/xml",
        label: "XMLフォーマッター",
        description: "XMLデータの整形・圧縮・構文検証ツール",
        icon: "📋",
      },
      {
        path: "/sql",
        label: "SQLフォーマッター",
        description: "SQLクエリの整形・圧縮・構文検証ツール",
        icon: "🗄️",
      },
    ],
  },
  {
    name: "生成",
    icon: "✦",
    items: [
      {
        path: "/uuid",
        label: "UUID生成",
        description: "UUID v4のランダム生成",
        icon: "🔑",
      },
      {
        path: "/password-generator",
        label: "パスワード生成",
        description: "安全なランダムパスワードの生成",
        icon: "🔐",
      },
      {
        path: "/dummy-image",
        label: "ダミー画像",
        description: "開発用プレースホルダー画像の生成",
        icon: "🎨",
      },
      {
        path: "/dummy-audio",
        label: "ダミー音声",
        description: "開発用テスト音声ファイルの生成",
        icon: "🔊",
      },
      {
        path: "/favicon-generator",
        label: "Favicon生成",
        description: "サイト用Faviconアイコンの生成",
        icon: "⭐",
      },
      {
        path: "/qr-code",
        label: "QRコード",
        description: "テキスト・URLからQRコードを生成",
        icon: "📱",
      },
      {
        path: "/lorem-ipsum",
        label: "Lorem Ipsum",
        description: "ダミーテキストの生成（段落・単語数・文数対応）",
        icon: "📝",
      },
    ],
  },
  {
    name: "画像",
    icon: "🎨",
    items: [
      {
        path: "/image-compress",
        label: "画像圧縮",
        description: "JPEG/PNG/WebPの画像サイズ圧縮",
        icon: "🗜️",
      },
      {
        path: "/image-base64",
        label: "Base64変換",
        description: "画像ファイルをBase64文字列に変換",
        icon: "🖼️",
      },
      {
        path: "/image-resize",
        label: "画像リサイズ",
        description: "画像の解像度・サイズ変更",
        icon: "📏",
      },
      {
        path: "/image-crop",
        label: "画像トリミング",
        description: "画像の指定範囲を切り抜き",
        icon: "✂️",
      },
      {
        path: "/transparent-image",
        label: "透過画像",
        description: "画像の背景を透過処理",
        icon: "🔍",
      },
      {
        path: "/color-extractor",
        label: "カラー抽出",
        description: "画像から主要な色を抽出",
        icon: "🎨",
      },
      {
        path: "/color-picker",
        label: "カラーピッカー",
        description: "カラーコードの選択・変換",
        icon: "🌈",
      },
      {
        path: "/image-to-gif",
        label: "画像→GIF変換",
        description: "複数画像からアニメーションGIFを作成",
        icon: "🎞️",
      },
      {
        path: "/emoji-converter",
        label: "絵文字変換",
        description: "画像を絵文字サイズに変換",
        icon: "😊",
      },
      {
        path: "/discord-emoji",
        label: "Discord絵文字",
        description: "画像をDiscord絵文字サイズ（128x128px）に変換",
        icon: "💬",
      },
      {
        path: "/discord-sticker",
        label: "Discordスタンプ",
        description: "画像をDiscordスタンプサイズ（320x320px）に変換",
        icon: "🏷️",
      },
    ],
  },
  {
    name: "検索",
    icon: "🔍",
    items: [
      {
        path: "/whois",
        label: "WHOIS",
        description: "ドメインの登録情報を検索",
        icon: "🌐",
      },
      {
        path: "/dns-lookup",
        label: "DNSレコード",
        description: "ドメインのDNSレコードを確認",
        icon: "📡",
      },
      {
        path: "/ip-geolocation",
        label: "IP検索",
        description: "IPアドレスから地理情報を取得",
        icon: "📍",
      },
      {
        path: "/global-ip",
        label: "グローバルIP",
        description: "アクセス元のグローバルIPアドレスを表示",
        icon: "🌍",
      },
      {
        path: "/ogp",
        label: "OGPチェック",
        description: "URLのOpen Graph Protocol情報を確認",
        icon: "🔗",
      },
    ],
  },
  {
    name: "テキスト",
    icon: "📝",
    items: [
      {
        path: "/char-count",
        label: "文字数カウント",
        description: "テキストの文字数・単語数・行数を計算",
        icon: "📝",
      },
      {
        path: "/text-sort",
        label: "ソート/重複削除",
        description: "テキストの行ソートと重複行削除",
        icon: "📋",
      },
      {
        path: "/diff",
        label: "テキスト差分",
        description: "2つのテキストの差分を色分け表示",
        icon: "↔️",
      },
    ],
  },
  {
    name: "検証",
    icon: "✓",
    items: [
      {
        path: "/regex-checker",
        label: "正規表現",
        description: "正規表現のパターンをテスト・検証",
        icon: "🔎",
      },
      {
        path: "/jwt",
        label: "JWTデコード",
        description: "JWTトークンのデコードと検証",
        icon: "🔓",
      },
      {
        path: "/email-dns",
        label: "メールDNS",
        description: "メールドメインのDNS設定を確認",
        icon: "📧",
      },
      {
        path: "/hash",
        label: "ハッシュ生成",
        description: "MD5/SHA-1/SHA-256ハッシュ値を生成",
        icon: "🔒",
      },
      {
        path: "/security-headers",
        label: "セキュリティヘッダー",
        description: "WebサイトのHTTPセキュリティヘッダーを確認",
        icon: "🛡️",
      },
      {
        path: "/cron-parser",
        label: "Cron式パーサー",
        description: "Cron式の解析と次回実行時刻の表示",
        icon: "⏰",
      },
    ],
  },
  {
    name: "ネットワーク",
    icon: "🌐",
    items: [
      {
        path: "/cidr",
        label: "CIDR計算",
        description: "CIDRブロックのIPレンジ計算",
        icon: "🌐",
      },
      {
        path: "/ip-cidr-check",
        label: "CIDR範囲チェック",
        description: "IPアドレスがCIDRブロックに含まれるか確認",
        icon: "✅",
      },
      {
        path: "/ip-converter",
        label: "IP変換",
        description: "IPアドレスの10進数・16進数・2進数変換",
        icon: "🔄",
      },
    ],
  },
  {
    name: "情報",
    icon: "ℹ",
    items: [
      {
        path: "/server-env",
        label: "サーバー環境",
        description: "Cloudflare Workers のサーバー環境情報を表示",
        icon: "💻",
      },
    ],
  },
  {
    name: "ゲーム",
    icon: "🎲",
    items: [
      {
        path: "/dice-roll",
        label: "ダイスロール",
        description: "各種ダイスのロールシミュレーター",
        icon: "🎲",
      },
    ],
  },
];

/**
 * カタログをクエリ文字列でフィルタリングする
 * @param catalog - フィルタリング対象のカタログ
 * @param query - 検索クエリ文字列
 * @returns フィルタリング後のカタログ（アイテムが0のカテゴリは除外）
 */
export function filterCatalog(
  catalog: ToolCategory[],
  query: string
): ToolCategory[] {
  if (!query.trim()) return catalog;
  const q = query.toLowerCase();
  return catalog
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      ),
    }))
    .filter((category) => category.items.length > 0);
}

export const Route = createFileRoute("/top")({
  head: () => ({
    meta: [
      { title: "ツール一覧 | Web ツール集" },
      { name: "description", content: "50以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。" },
      { property: "og:title", content: "ツール一覧 | Web ツール集" },
      { property: "og:description", content: "50以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。" },
      { property: "og:url", content: `${SITE_BASE_URL}/top` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ツール一覧 | Web ツール集" },
      { name: "twitter:description", content: "50以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。" },
    ],
  }),
  component: TopPage,
});

/**
 * トップページコンポーネント
 * 全ツールをカテゴリ別に一覧表示し、検索機能を提供する
 */
function TopPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCatalog = useMemo(
    () => filterCatalog(toolCatalog, searchQuery),
    [searchQuery]
  );

  const totalCount = toolCatalog.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );
  const filteredCount = filteredCatalog.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  return (
    <div className="top-page-container">
      {/* ページヘッダー */}
      <div className="top-page-header">
        <h2 className="top-page-title">ツール一覧</h2>
        <p className="top-page-subtitle">
          {totalCount} 個のツールが利用可能です
        </p>
      </div>

      {/* 検索バー */}
      <div className="top-search-section" role="search">
        <label htmlFor="tool-search" className="sr-only">
          ツールを検索
        </label>
        <input
          id="tool-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ツール名や機能で検索..."
          className="top-search-input"
          aria-label="ツールを検索"
        />
        {searchQuery && (
          <button
            className="top-search-clear"
            onClick={() => setSearchQuery("")}
            aria-label="検索をクリア"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* 検索結果カウント */}
      {searchQuery && (
        <p
          className="top-search-result-count"
          aria-live="polite"
          role="status"
        >
          {filteredCount} 件のツールが見つかりました
        </p>
      )}

      {/* カテゴリ別ツールグリッド */}
      {filteredCatalog.map((category) => (
        <section
          key={category.name}
          className="top-category-section"
          aria-labelledby={`cat-${category.name}`}
        >
          <h3
            id={`cat-${category.name}`}
            className="top-category-heading"
          >
            <span aria-hidden="true">{category.icon}</span>
            {category.name}
            <span className="top-category-count">{category.items.length}</span>
          </h3>
          <div className="top-tool-grid" role="list">
            {category.items.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="top-tool-card"
                role="listitem"
              >
                <span className="top-tool-icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <div className="top-tool-info">
                  <span className="top-tool-name">{tool.label}</span>
                  <span className="top-tool-description">
                    {tool.description}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 検索結果なし */}
      {filteredCatalog.length === 0 && (
        <div className="top-no-results" role="status" aria-live="polite">
          <p>「{searchQuery}」に一致するツールが見つかりませんでした</p>
          <button
            onClick={() => setSearchQuery("")}
            type="button"
            className="btn-primary"
          >
            検索をクリア
          </button>
        </div>
      )}
    </div>
  );
}
