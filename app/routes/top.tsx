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
        path: "/unicode",
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
        path: "/url-parser",
        label: "URLパーサー/ビルダー",
        description:
          "URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析し、各パーツからURLを組み立てる",
        icon: "🔗",
      },
      {
        path: "/env-parser",
        label: ".envパーサー",
        description: ".envファイルのパース・JSON/YAML/Shellへの変換",
        icon: "⚙️",
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
        path: "/json-path",
        label: "JSONPath評価",
        description: "JSONデータにJSONPathクエリを適用して値を抽出・評価",
        icon: "🔍",
      },
      {
        path: "/json-flatten",
        label: "JSONフラット化",
        description:
          "ネストされたJSONをフラットなキー構造に変換・復元するツール。区切り文字・配列処理・最大深さを設定可能。",
        icon: "⬇️",
      },
      {
        path: "/json-lines",
        label: "JSON Lines フォーマッター",
        description:
          "JSON Lines（NDJSON）の解析・整形・バリデーション。JSON配列との相互変換も可能。ログファイルやストリーミングAPIのデバッグに便利。",
        icon: "📄",
      },
      {
        path: "/html-to-jsx",
        label: "HTML→JSX変換",
        description:
          "HTMLをReact JSXに変換するツール。class→className、for→htmlFor などの属性変換に対応。",
        icon: "⚛️",
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
        path: "/css-unit",
        label: "CSS単位変換",
        description:
          "px・rem・em・vw・vh・%・pt・cm・mm・in などの CSS 単位をリアルタイムで相互変換。ベースフォントサイズやビューポートサイズも設定可能。",
        icon: "📏",
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
      {
        path: "/timezone",
        label: "タイムゾーン変換",
        description: "世界各地のタイムゾーン間で日時を変換",
        icon: "🌍",
      },
      {
        path: "/text-encrypt",
        label: "テキスト暗号化",
        description:
          "ROT13・Caesar暗号・Vigenère暗号・Atbash暗号でテキストを暗号化・復号化するツール",
        icon: "🔒",
      },
      {
        path: "/morse-code",
        label: "Morse Code変換",
        description:
          "テキストとモールス符号（Morse Code）を相互変換するツール。アルファベット・数字・記号対応",
        icon: "📡",
      },
      {
        path: "/number-base",
        label: "数値進数変換",
        description:
          "2進数・8進数・10進数・16進数の相互変換ツール。任意の欄入力で他が自動更新",
        icon: "🔢",
      },
      {
        path: "/csv-json",
        label: "CSV/JSON変換",
        description:
          "CSVとJSONの相互変換ツール。ヘッダー行の有無や区切り文字（カンマ・タブ・セミコロン）選択可",
        icon: "📊",
      },
      {
        path: "/math-eval",
        label: "数式評価ツール",
        description:
          "数式をリアルタイムで評価するツール。四則演算・三角関数・対数・べき乗など多彩な演算に対応",
        icon: "🧮",
      },
      {
        path: "/bitwise",
        label: "ビット演算計算機",
        description:
          "AND・OR・XOR・NOT・シフト演算をビジュアルで確認できる計算機。2進数・8進数・10進数・16進数で入力可能。32ビットビット表示付き。",
        icon: "🔢",
      },
      {
        path: "/hex-viewer",
        label: "Hex Viewer",
        description:
          "ファイルやテキストのバイナリデータを16進数・ASCII形式で表示するツール。バイトオフセット・カラーハイライト対応。",
        icon: "🔬",
      },
      {
        path: "/aspect-ratio",
        label: "アスペクト比計算機",
        description:
          "幅・高さからアスペクト比を計算。比から幅・高さを導出。16:9・4:3・1:1などよく使われる比率のプリセット付き。",
        icon: "📐",
      },
      {
        path: "/number-format",
        label: "数値フォーマット",
        description:
          "Intl.NumberFormat を使用して数値を各ロケール・通貨・パーセント形式でフォーマット。10言語のロケール別フォーマット比較も可能。",
        icon: "🔢",
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
        path: "/barcode",
        label: "バーコード生成",
        description: "各種バーコード形式を生成・ダウンロード",
        icon: "▮▮▮",
      },
      {
        path: "/lorem-ipsum",
        label: "Lorem Ipsum",
        description: "ダミーテキストの生成（段落・単語数・文数対応）",
        icon: "📝",
      },
      {
        path: "/gitignore",
        label: "Gitignore生成",
        description:
          ".gitignoreファイルを自動生成。言語・フレームワーク・IDEを選択してカスタマイズ。",
        icon: "🚫",
      },
      {
        path: "/robots-txt",
        label: "robots.txtジェネレーター",
        description:
          "robots.txtファイルをGUIで作成。User-agent別のAllow/Disallowルール設定、Crawl-delay、Sitemapを視覚的に編集してコードを即座に生成。",
        icon: "🤖",
      },
      {
        path: "/random-data",
        label: "ランダムデータ生成",
        description:
          "氏名・メール・電話番号・住所・UUID・IPアドレスなど様々な形式のテストデータを一括生成。JSON/CSV/TSV出力対応。",
        icon: "🎲",
      },
      {
        path: "/json-schema",
        label: "JSONスキーマ生成",
        description: "JSONデータからJSON Schema (draft-07) を自動生成するツール",
        icon: "📋",
      },
      {
        path: "/json-to-ts",
        label: "JSON→TS型変換",
        description: "JSONデータからTypeScriptのinterface/type定義を自動生成するツール",
        icon: "🔷",
      },
      {
        path: "/json-compare",
        label: "JSON比較",
        description: "2つのJSONを並べて比較し、追加・削除・変更されたキーを差分表示するツール",
        icon: "⇆",
      },
      {
        path: "/mermaid",
        label: "Mermaidプレビュー",
        description:
          "Mermaid記法のダイアグラムをリアルタイムでプレビューできるツール。フローチャート、シーケンス図など多数対応",
        icon: "🔀",
      },
      {
        path: "/jwt-generator",
        label: "JWT生成",
        description:
          "HS256/HS384/HS512アルゴリズムでJWTトークンをブラウザ内で生成するツール",
        icon: "🔐",
      },
      {
        path: "/ascii-art",
        label: "ASCIIアート生成",
        description:
          "テキストをASCIIアートに変換するツール。Standard、Block、Banner等の5種類フォント対応",
        icon: "🎨",
      },
      {
        path: "/slug",
        label: "スラッグ生成",
        description:
          "テキストをURLフレンドリーなスラッグに変換するツール。アクセント文字対応、区切り文字・大文字小文字設定可",
        icon: "🔗",
      },
      {
        path: "/cron",
        label: "Cron式ビルダー",
        description:
          "Cron式を視覚的に構築・編集できるツール。各フィールドをGUIで設定してCron式を生成",
        icon: "⏰",
      },
      {
        path: "/typography-scale",
        label: "タイポグラフィスケール生成",
        description:
          "モジュラースケール理論に基づきCSSタイポグラフィスケールを生成。CSS変数・SCSS・JSON・Tailwind形式で出力。Golden Ratio等のプリセット比率対応。",
        icon: "🔡",
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
        path: "/css-gradient",
        label: "CSSグラジェント生成",
        description:
          "linear/radial/conicグラジェントをビジュアルエディターで作成。カラーストップを編集してCSSコードを即座に生成。",
        icon: "🌈",
      },
      {
        path: "/css-animation",
        label: "CSSアニメーション生成",
        description:
          "keyframesアニメーションをビジュアルエディターで作成。duration・easing・delay・繰り返し設定を調整してCSSコードを即座に生成。",
        icon: "✨",
      },
      {
        path: "/css-flexbox",
        label: "CSSフレックスボックス",
        description:
          "flexbox のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。justify-content・align-items・flex-wrap などを直感的に試せる。",
        icon: "⬛",
      },
      {
        path: "/css-grid",
        label: "CSS Gridジェネレーター",
        description:
          "CSS Grid のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。grid-template-columns・gap・justify-items などを直感的に試せる。",
        icon: "⊞",
      },
      {
        path: "/css-box-shadow",
        label: "CSS Box Shadowジェネレーター",
        description:
          "box-shadowをビジュアルエディターで作成。複数レイヤー・inset・不透明度・プリセット対応。ニューモーフィズムやグロウ効果も直感的に試せる。",
        icon: "🌑",
      },
      {
        path: "/css-text-shadow",
        label: "CSS Text Shadowジェネレーター",
        description:
          "text-shadowをビジュアルエディターで作成。複数レイヤー・不透明度・プリセット対応。ネオン・エンボス・アウトラインなど多彩なテキスト効果を直感的に試せる。",
        icon: "✦",
      },
      {
        path: "/css-border-radius",
        label: "CSS Border Radiusジェネレーター",
        description:
          "border-radiusをビジュアルエディターで作成。4コーナー独立制御・楕円モード・プリセット対応。円形・ピル型・リーフなど多彩な形状を直感的に試せる。",
        icon: "⬜",
      },
      {
        path: "/css-filter",
        label: "CSS Filterジェネレーター",
        description:
          "CSS filterプロパティをビジュアルエディターで作成。blur・brightness・contrast・grayscale・hue-rotate・invert・saturate・sepiaをスライダーで調整。プリセット対応。",
        icon: "🔮",
      },
      {
        path: "/css-clip-path",
        label: "CSS Clip-pathジェネレーター",
        description:
          "CSS clip-pathプロパティをビジュアルエディターで作成。inset・circle・ellipse・polygonを操作してCSSコードを生成。三角形・星形など多彩なプリセット形状も利用可能。",
        icon: "✂️",
      },
      {
        path: "/css-transform",
        label: "CSS Transformジェネレーター",
        description:
          "CSS transformプロパティをビジュアルエディターで作成。translate・rotate・scale・skew・perspectiveをスライダーで調整してCSSコードを即座に生成。",
        icon: "🔄",
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
      {
        path: "/color-palette",
        label: "カラーパレット生成",
        description:
          "補色・三色・類似色など配色理論に基づいたカラーパレットを自動生成するツール",
        icon: "🎨",
      },
      {
        path: "/color-harmony",
        label: "カラーハーモニー",
        description:
          "補色・類似色・トライアド・分割補色・テトラッドを一覧生成するカラーハーモニー配色ツール",
        icon: "🌈",
      },
      {
        path: "/svg-optimizer",
        label: "SVG最適化",
        description:
          "SVGファイルの最適化・圧縮・整形ツール。メタデータ削除、数値精度調整、空白圧縮に対応",
        icon: "✨",
      },
      {
        path: "/color-converter",
        label: "カラーフォーマット変換",
        description:
          "HEX・RGB・HSL・HSV・CMYK・OKLCHなどカラーフォーマットをリアルタイムで相互変換するツール",
        icon: "🎨",
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
      {
        path: "/http-status",
        label: "HTTPステータスコード",
        description:
          "HTTPステータスコード（1xx〜5xx）のリファレンス。カテゴリ別フィルタリングとキーワード検索でコードを調べられる",
        icon: "ℹ️",
      },
      {
        path: "/http-headers",
        label: "HTTPヘッダーリファレンス",
        description:
          "リクエスト・レスポンスHTTPヘッダーの一覧リファレンス。用途・説明・使用例をカテゴリ別に検索できる",
        icon: "📋",
      },
      {
        path: "/mime-types",
        label: "MIMEタイプリファレンス",
        description:
          "MIMEタイプ（Content-Type）の一覧リファレンス。拡張子・カテゴリ別に検索し、ファイルタイプに対応するMIMEタイプを確認できる",
        icon: "📄",
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
      {
        path: "/user-agent",
        label: "User-Agentパーサー",
        description: "User-Agent文字列を解析してブラウザ・OS・デバイス情報を表示",
        icon: "🔍",
      },
      {
        path: "/markdown-table",
        label: "Markdownテーブル生成",
        description:
          "CSVやテキストデータからMarkdown形式のテーブルを生成。行・列の追加削除や整列方向の設定が可能",
        icon: "📊",
      },
      {
        path: "/markdown-preview",
        label: "Markdownプレビュー",
        description:
          "Markdownをリアルタイムでプレビューできるツール。見出し、リスト、コードブロック、テーブル等対応",
        icon: "📝",
      },
      {
        path: "/text-case",
        label: "テキストケース変換",
        description:
          "テキストをcamelCase、PascalCase、snake_case等様々な命名規則に一括変換するツール",
        icon: "🔤",
      },
      {
        path: "/text-replace",
        label: "テキスト置換",
        description:
          "正規表現対応のテキスト検索・置換ツール。大文字小文字区別・全件/1件置換・複数行モードに対応。マッチ箇所をハイライト表示。",
        icon: "🔄",
      },
      {
        path: "/text-stats",
        label: "テキスト統計・分析",
        description:
          "テキストの詳細な統計情報（単語数・文章数・段落数・読書時間・頻出単語等）をリアルタイム分析",
        icon: "📈",
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
        path: "/totp",
        label: "TOTP生成",
        description:
          "TOTP（Time-based One-Time Password）コードをブラウザ内で生成。Google Authenticator等の2FAコードをシークレットキーから確認。",
        icon: "🔑",
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
        path: "/cookie-parser",
        label: "クッキーパーサー",
        description:
          "HTTP Cookie / Set-Cookie ヘッダーを解析し、属性（Expires・Path・SameSite等）を視覚的に確認できるツール",
        icon: "🍪",
      },
      {
        path: "/cron-parser",
        label: "Cron式パーサー",
        description: "Cron式の解析と次回実行時刻の表示",
        icon: "⏰",
      },
      {
        path: "/keycode",
        label: "キーコードチェック",
        description:
          "キーボードキー押下時のイベント情報（key, code, keyCode等）をリアルタイムで確認できるツール",
        icon: "⌨️",
      },
      {
        path: "/color-contrast",
        label: "カラーコントラストチェッカー",
        description:
          "WCAG 2.1準拠のコントラスト比計算ツール。前景色と背景色の組み合わせをAA・AAAで判定",
        icon: "🎯",
      },
      {
        path: "/color-blind",
        label: "色覚シミュレーター",
        description:
          "色覚異常シミュレーター。Deuteranopia・Protanopia・Tritanopiaなど6種類の色覚タイプで画像がどのように見えるか確認できるアクセシビリティツール。",
        icon: "👁️",
      },
      {
        path: "/css-specificity",
        label: "CSS詳細度計算機",
        description:
          "CSSセレクターの詳細度（specificity）を計算するツール。IDセレクター・クラス・タイプの (a, b, c) 表記で表示。複数セレクターの比較も可能。",
        icon: "🎯",
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
      {
        path: "/http-client",
        label: "HTTP APIテスター",
        description:
          "HTTP APIリクエストを送信してレスポンスを確認。GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONSに対応。カスタムヘッダーとリクエストボディも設定可能。",
        icon: "🔌",
      },
      {
        path: "/port-check",
        label: "ポートチェック",
        description: "指定したホスト・IPアドレスのポートが開いているか確認するツール",
        icon: "🔌",
      },
      {
        path: "/chmod",
        label: "Chmod計算",
        description: "Unixファイルパーミッション（chmod）の数値・シンボル表記を変換・計算するツール",
        icon: "🔒",
      },
      {
        path: "/curl-builder",
        label: "curlビルダー",
        description: "GUIでcurlコマンドを組み立てる。HTTPメソッド、ヘッダー、ボディ、各種オプションを設定してコマンドを生成",
        icon: "🔧",
      },
      {
        path: "/openssl-builder",
        label: "OpenSSLビルダー",
        description: "OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応",
        icon: "🔐",
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
      {
        path: "/pomodoro",
        label: "ポモドーロタイマー",
        description:
          "ポモドーロ・テクニックに基づく集中タイマー。25分作業と短い休憩を繰り返して生産性を高める",
        icon: "⏱️",
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
