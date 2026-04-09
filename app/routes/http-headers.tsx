import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/http-headers")({
  head: () => ({
    meta: [
      { title: "HTTPヘッダーリファレンス | Web ツール集" },
      {
        name: "description",
        content:
          "HTTPリクエスト・レスポンスヘッダーの一覧リファレンス。用途・説明・使用例をカテゴリ別・キーワード検索で調べられます。",
      },
      {
        property: "og:title",
        content: "HTTPヘッダーリファレンス | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "HTTPリクエスト・レスポンスヘッダーの一覧リファレンス。用途・説明・使用例をカテゴリ別・キーワード検索で調べられます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/http-headers` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "HTTPヘッダーリファレンス | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "HTTPリクエスト・レスポンスヘッダーの一覧リファレンス。用途・説明・使用例をカテゴリ別・キーワード検索で調べられます。",
      },
    ],
  }),
  component: HttpHeadersPage,
});

/**
 * HTTPヘッダーのカテゴリ種別
 * - request: リクエストヘッダー
 * - response: レスポンスヘッダー
 * - general: 共通ヘッダー（リクエスト・レスポンス両方で使用可）
 */
export type HttpHeaderCategory = "request" | "response" | "general";

/**
 * HTTPヘッダーの型定義
 */
export interface HttpHeader {
  /** ヘッダー名（正確な大文字小文字） */
  name: string;
  /** カテゴリ */
  category: HttpHeaderCategory;
  /** 日本語説明 */
  description: string;
  /** 使用例 */
  example: string;
  /** セキュリティ関連ヘッダーかどうか */
  security: boolean;
  /** 非推奨かどうか */
  deprecated?: boolean;
}

/**
 * HTTPヘッダーのデータ一覧
 */
export const HTTP_HEADERS: HttpHeader[] = [
  // ===== リクエストヘッダー =====
  {
    name: "Accept",
    category: "request",
    description:
      "クライアントが受け入れ可能なメディアタイプ（MIMEタイプ）を指定します。サーバーはこの情報をもとに適切なフォーマットでレスポンスを返します。",
    example: "Accept: text/html, application/json",
    security: false,
  },
  {
    name: "Accept-Encoding",
    category: "request",
    description:
      "クライアントが対応している圧縮アルゴリズムを指定します。サーバーはこの情報をもとにレスポンスを圧縮できます。",
    example: "Accept-Encoding: gzip, deflate, br",
    security: false,
  },
  {
    name: "Accept-Language",
    category: "request",
    description:
      "クライアントが優先する自然言語を指定します。サーバーはコンテンツネゴシエーションに使用します。",
    example: "Accept-Language: ja, en-US;q=0.9",
    security: false,
  },
  {
    name: "Authorization",
    category: "request",
    description:
      "サーバーへの認証情報を送信します。BearerトークンやBasic認証の資格情報など、認証スキームに応じた値を設定します。",
    example: "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...",
    security: true,
  },
  {
    name: "Cache-Control",
    category: "general",
    description:
      "リクエスト・レスポンス両方で使用するキャッシュディレクティブを指定します。max-age、no-cache、no-store などのディレクティブで動作を制御します。",
    example: "Cache-Control: no-cache, no-store, must-revalidate",
    security: false,
  },
  {
    name: "Connection",
    category: "general",
    description:
      "現在のトランザクション完了後に接続を維持するか閉じるかを指定します。HTTP/2以降は非推奨です。",
    example: "Connection: keep-alive",
    security: false,
    deprecated: true,
  },
  {
    name: "Content-Length",
    category: "general",
    description:
      "リクエスト・レスポンスボディのバイト数を指定します。受信者がデータの終端を判断するために使用します。",
    example: "Content-Length: 1024",
    security: false,
  },
  {
    name: "Content-Type",
    category: "general",
    description:
      "ボディのメディアタイプとオプションの文字セットを指定します。リクエスト時はPOST/PUTボディの形式、レスポンス時はレスポンスボディの形式を示します。",
    example: "Content-Type: application/json; charset=utf-8",
    security: false,
  },
  {
    name: "Cookie",
    category: "request",
    description:
      "Set-Cookieヘッダーで以前にサーバーから送られたHTTP Cookieをサーバーに送り返します。セッション管理やユーザー識別に使用されます。",
    example: "Cookie: session_id=abc123; user_pref=dark",
    security: true,
  },
  {
    name: "Host",
    category: "request",
    description:
      "リクエスト先のサーバーのホスト名とポート番号を指定します。HTTP/1.1では必須ヘッダーです。バーチャルホスティングに不可欠です。",
    example: "Host: example.com:8080",
    security: false,
  },
  {
    name: "If-Match",
    category: "request",
    description:
      "ETagが一致する場合のみリクエストを処理するよう条件を指定します。楽観的ロックや条件付きリクエストに使用します。",
    example: 'If-Match: "abc123etag"',
    security: false,
  },
  {
    name: "If-Modified-Since",
    category: "request",
    description:
      "指定した日時以降にリソースが変更された場合のみレスポンスを返すよう要求します。キャッシュの検証に使用されます。",
    example: "If-Modified-Since: Mon, 01 Jan 2024 00:00:00 GMT",
    security: false,
  },
  {
    name: "If-None-Match",
    category: "request",
    description:
      "ETagが一致しない場合のみレスポンスを返すよう要求します。キャッシュの効率的な検証に広く使用されます。",
    example: 'If-None-Match: "abc123etag"',
    security: false,
  },
  {
    name: "If-Unmodified-Since",
    category: "request",
    description:
      "指定した日時以降にリソースが変更されていない場合のみリクエストを処理するよう条件を指定します。",
    example: "If-Unmodified-Since: Mon, 01 Jan 2024 00:00:00 GMT",
    security: false,
  },
  {
    name: "Origin",
    category: "request",
    description:
      "クロスオリジンリクエストの発信元（スキーム・ホスト・ポート）を示します。CORS（Cross-Origin Resource Sharing）プリフライトリクエストで使用されます。",
    example: "Origin: https://app.example.com",
    security: true,
  },
  {
    name: "Range",
    category: "request",
    description:
      "ドキュメントの一部のみを要求するバイト範囲を指定します。大きなファイルのダウンロード再開や動画のシークに使用されます。",
    example: "Range: bytes=0-1023",
    security: false,
  },
  {
    name: "Referer",
    category: "request",
    description:
      "現在リクエストされているページへのリンク元のURLを示します（スペルミスが仕様になっています）。アクセス解析やリンク元判定に使用されます。",
    example: "Referer: https://example.com/page",
    security: false,
  },
  {
    name: "User-Agent",
    category: "request",
    description:
      "リクエストを行っているクライアントの種類・バージョン・OS・エンジンなどを識別するための文字列です。",
    example: "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    security: false,
  },
  {
    name: "X-Forwarded-For",
    category: "request",
    description:
      "プロキシやロードバランサーを経由したリクエストの元のクライアントIPアドレスを示します。非標準ですが広く使われています。",
    example: "X-Forwarded-For: 203.0.113.1, 198.51.100.2",
    security: true,
  },
  {
    name: "X-Forwarded-Proto",
    category: "request",
    description:
      "リバースプロキシやロードバランサーを経由した元のリクエストのプロトコル（http/https）を示します。",
    example: "X-Forwarded-Proto: https",
    security: false,
  },
  {
    name: "X-Requested-With",
    category: "request",
    description:
      'XHR（XMLHttpRequest）を識別するために広く使われている非標準ヘッダーです。値は通常 "XMLHttpRequest" です。',
    example: "X-Requested-With: XMLHttpRequest",
    security: false,
  },

  // ===== レスポンスヘッダー =====
  {
    name: "Access-Control-Allow-Credentials",
    category: "response",
    description:
      "CORSリクエストでCookieなどのクレデンシャル情報を含めることを許可するかを示します。trueの場合、Access-Control-Allow-Originはワイルドカード不可です。",
    example: "Access-Control-Allow-Credentials: true",
    security: true,
  },
  {
    name: "Access-Control-Allow-Headers",
    category: "response",
    description:
      "CORSプリフライトリクエストへのレスポンスとして、実際のリクエストで使用可能なHTTPヘッダーを指定します。",
    example: "Access-Control-Allow-Headers: Content-Type, Authorization",
    security: true,
  },
  {
    name: "Access-Control-Allow-Methods",
    category: "response",
    description:
      "CORSプリフライトリクエストへのレスポンスとして、実際のリクエストで許可するHTTPメソッドを指定します。",
    example: "Access-Control-Allow-Methods: GET, POST, PUT, DELETE",
    security: true,
  },
  {
    name: "Access-Control-Allow-Origin",
    category: "response",
    description:
      "特定のオリジンからのリソースアクセスを許可するCORSヘッダーです。特定のオリジン、またはワイルドカード（*）を指定できます。",
    example: "Access-Control-Allow-Origin: https://app.example.com",
    security: true,
  },
  {
    name: "Access-Control-Expose-Headers",
    category: "response",
    description:
      "ブラウザのJavaScriptからアクセス可能にするレスポンスヘッダーのリストを指定します。",
    example: "Access-Control-Expose-Headers: X-Custom-Header, Content-Length",
    security: true,
  },
  {
    name: "Access-Control-Max-Age",
    category: "response",
    description:
      "CORSプリフライトリクエストの結果をキャッシュできる秒数を指定します。繰り返しのプリフライトを削減できます。",
    example: "Access-Control-Max-Age: 86400",
    security: true,
  },
  {
    name: "Age",
    category: "response",
    description: "プロキシキャッシュにオブジェクトが格納されてからの経過時間（秒）を示します。",
    example: "Age: 3600",
    security: false,
  },
  {
    name: "Allow",
    category: "response",
    description:
      "405 Method Not Allowed レスポンス時に、リソースに対して使用可能なHTTPメソッドを示します。",
    example: "Allow: GET, POST, HEAD",
    security: false,
  },
  {
    name: "Content-Disposition",
    category: "response",
    description:
      "コンテンツをブラウザ内でインライン表示するか、ダウンロードとして保存するかを指定します。ファイルダウンロード時のファイル名指定にも使用されます。",
    example: 'Content-Disposition: attachment; filename="report.pdf"',
    security: false,
  },
  {
    name: "Content-Encoding",
    category: "response",
    description:
      "メッセージボディに適用されたエンコーディング（圧縮）を示します。クライアントはデコードに使用します。",
    example: "Content-Encoding: gzip",
    security: false,
  },
  {
    name: "Content-Security-Policy",
    category: "response",
    description:
      "XSSやデータインジェクション攻撃を防ぐために、ページが読み込めるリソースのソースを指定するセキュリティポリシーです。",
    example: "Content-Security-Policy: default-src 'self'; script-src 'self' cdn.example.com",
    security: true,
  },
  {
    name: "Cross-Origin-Embedder-Policy",
    category: "response",
    description:
      "クロスオリジンリソースの埋め込みを制御します。SharedArrayBufferなどの強力な機能を利用するために必要です。",
    example: "Cross-Origin-Embedder-Policy: require-corp",
    security: true,
  },
  {
    name: "Cross-Origin-Opener-Policy",
    category: "response",
    description:
      "新しいトップレベルブラウジングコンテキストとの関係を制御します。Spectre攻撃などのサイドチャネル攻撃から保護します。",
    example: "Cross-Origin-Opener-Policy: same-origin",
    security: true,
  },
  {
    name: "Cross-Origin-Resource-Policy",
    category: "response",
    description:
      "クロスオリジンのリソース読み込みを制限します。Spectre攻撃などに対する追加の保護を提供します。",
    example: "Cross-Origin-Resource-Policy: same-site",
    security: true,
  },
  {
    name: "ETag",
    category: "response",
    description:
      "リソースの特定バージョンを識別する識別子です。リソースが変更されるたびに新しいETagが生成され、効率的なキャッシュ検証に使用されます。",
    example: 'ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"',
    security: false,
  },
  {
    name: "Expires",
    category: "response",
    description:
      "レスポンスが古くなるとみなされる日時を指定します。Cache-Controlヘッダーが存在する場合は無視されます。",
    example: "Expires: Mon, 01 Jan 2025 00:00:00 GMT",
    security: false,
    deprecated: true,
  },
  {
    name: "Last-Modified",
    category: "response",
    description:
      "サーバーがリソースを最後に変更した日時を示します。If-Modified-Sinceによるキャッシュ検証に使用されます。",
    example: "Last-Modified: Tue, 15 Oct 2024 10:30:00 GMT",
    security: false,
  },
  {
    name: "Link",
    category: "response",
    description:
      "現在のドキュメントとリンクされたリソースとの関係を定義します。プリロード・プリフェッチやページネーションのナビゲーションに使用されます。",
    example: 'Link: <https://example.com/style.css>; rel="stylesheet", </next>; rel="next"',
    security: false,
  },
  {
    name: "Location",
    category: "response",
    description:
      "リダイレクト先のURL、または新しく作成されたリソースのURLを示します。3xxリダイレクトや201 Createdレスポンスで使用されます。",
    example: "Location: https://www.example.com/new-page",
    security: false,
  },
  {
    name: "Permissions-Policy",
    category: "response",
    description:
      "ブラウザの機能（カメラ・マイク・位置情報など）の使用を制御するセキュリティヘッダーです。以前はFeature-Policyと呼ばれていました。",
    example: "Permissions-Policy: camera=(), microphone=(), geolocation=(self)",
    security: true,
  },
  {
    name: "Referrer-Policy",
    category: "response",
    description:
      "外部サイトへのリンクをクリックした際に送信されるRefererヘッダーの情報量を制御します。プライバシー保護に役立ちます。",
    example: "Referrer-Policy: strict-origin-when-cross-origin",
    security: true,
  },
  {
    name: "Retry-After",
    category: "response",
    description:
      "503 Service Unavailableや429 Too Many Requestsの際に、いつ再試行すべきかを秒数または日付で示します。",
    example: "Retry-After: 120",
    security: false,
  },
  {
    name: "Server",
    category: "response",
    description:
      "リクエストを処理したサーバーソフトウェアの情報を示します。セキュリティ上、バージョン情報は最小限にすることが推奨されます。",
    example: "Server: nginx",
    security: false,
  },
  {
    name: "Set-Cookie",
    category: "response",
    description:
      "サーバーからクライアントへCookieを送信します。名前・値・有効期限・パス・ドメイン・セキュリティ属性などを指定できます。",
    example: "Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict",
    security: true,
  },
  {
    name: "Strict-Transport-Security",
    category: "response",
    description:
      "HTTPSのみでアクセスするよう強制するセキュリティヘッダー（HSTS）です。中間者攻撃（MITM）やプロトコルダウングレード攻撃を防ぎます。",
    example: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    security: true,
  },
  {
    name: "Vary",
    category: "response",
    description:
      "このレスポンスをキャッシュする際に考慮すべきリクエストヘッダーを指定します。コンテンツネゴシエーションと組み合わせて使用されます。",
    example: "Vary: Accept-Encoding, Accept-Language",
    security: false,
  },
  {
    name: "WWW-Authenticate",
    category: "response",
    description:
      "401 Unauthorizedレスポンスで、クライアントが認証に使用すべき認証スキームを指定します。",
    example: 'WWW-Authenticate: Bearer realm="api"',
    security: true,
  },
  {
    name: "X-Content-Type-Options",
    category: "response",
    description:
      "Content-TypeヘッダーのMIMEタイプスニッフィングを無効化します。nosniffを指定することでMIMEタイプを変更したコンテンツの実行を防ぎます。",
    example: "X-Content-Type-Options: nosniff",
    security: true,
  },
  {
    name: "X-Frame-Options",
    category: "response",
    description:
      "ページをiframe・frame・object内に表示することを制御し、クリックジャッキング攻撃を防ぎます。Content-Security-PolicyのFrame-ancestorsが推奨です。",
    example: "X-Frame-Options: DENY",
    security: true,
  },
  {
    name: "X-Powered-By",
    category: "response",
    description:
      "サーバーで使用しているフレームワークやプラットフォームを示します。セキュリティ上、この情報の公開は推奨されません。",
    example: "X-Powered-By: Express",
    security: false,
  },
  {
    name: "X-XSS-Protection",
    category: "response",
    description:
      "旧式のブラウザのXSSフィルターを有効化します。現代のブラウザでは廃止されており、Content-Security-Policyの使用を推奨します。",
    example: "X-XSS-Protection: 1; mode=block",
    security: true,
    deprecated: true,
  },

  // ===== 共通ヘッダー =====
  {
    name: "Date",
    category: "general",
    description: "メッセージが生成された日時を示します。RFC 7231形式（IMF-fixdate）で記述します。",
    example: "Date: Tue, 15 Oct 2024 10:30:00 GMT",
    security: false,
  },
  {
    name: "Pragma",
    category: "general",
    description:
      "キャッシュ制御のための後方互換性ヘッダーです。HTTP/1.0時代のヘッダーで、現在はCache-Controlの使用を推奨します。",
    example: "Pragma: no-cache",
    security: false,
    deprecated: true,
  },
  {
    name: "Transfer-Encoding",
    category: "general",
    description:
      "エンドユーザーへメッセージを転送するためのエンコード形式を指定します。chunkedを指定すると可変長のチャンク転送が可能です。",
    example: "Transfer-Encoding: chunked",
    security: false,
  },
  {
    name: "Upgrade",
    category: "general",
    description:
      "クライアントとサーバーが別のプロトコル（例：WebSocket）にアップグレードするためのメカニズムを提供します。",
    example: "Upgrade: websocket",
    security: false,
  },
  {
    name: "Via",
    category: "general",
    description:
      "プロキシサーバーがリクエスト/レスポンスを転送した際に追加するヘッダーです。プロキシチェーンの追跡に使用されます。",
    example: "Via: 1.1 proxy.example.com",
    security: false,
  },
];

/** カテゴリのラベルマッピング */
const CATEGORY_LABELS: Record<string, string> = {
  all: "すべて",
  request: "リクエスト",
  response: "レスポンス",
  general: "共通",
  security: "セキュリティ",
};

/** フィルタータブの一覧 */
const FILTER_TABS = ["all", "request", "response", "general", "security"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

/** カテゴリに対応するCSSクラス */
const CATEGORY_COLORS: Record<HttpHeaderCategory, string> = {
  request: "http-headers-cat-request",
  response: "http-headers-cat-response",
  general: "http-headers-cat-general",
};

/**
 * HTTPヘッダーをフィルタリングする
 * @param headers - フィルタリング対象のヘッダー一覧
 * @param query - 検索クエリ
 * @param tab - フィルタータブ
 * @returns フィルタリングされたヘッダー一覧
 */
export function filterHeaders(headers: HttpHeader[], query: string, tab: FilterTab): HttpHeader[] {
  const lowerQuery = query.toLowerCase().trim();
  return headers.filter((h) => {
    if (tab === "security") {
      if (!h.security) return false;
    } else if (tab !== "all") {
      if (h.category !== tab) return false;
    }
    if (!lowerQuery) return true;
    return (
      h.name.toLowerCase().includes(lowerQuery) ||
      h.description.toLowerCase().includes(lowerQuery) ||
      h.example.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * HTTPヘッダーリファレンスページコンポーネント
 */
function HttpHeadersPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = filterHeaders(HTTP_HEADERS, searchQuery, activeTab);

  const handleCopyHeader = useCallback(
    async (name: string) => {
      const success = await copy(name);
      if (success) {
        showToast(`${name} をコピーしました`, "success");
        announceStatus(`${name} をクリップボードにコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
        announceStatus("コピーに失敗しました");
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleTabChange = useCallback(
    (tab: FilterTab) => {
      setActiveTab(tab);
      const count = filterHeaders(HTTP_HEADERS, searchQuery, tab).length;
      announceStatus(`${CATEGORY_LABELS[tab]} でフィルタリング。${count} 件表示`);
    },
    [searchQuery, announceStatus],
  );

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">HTTP ヘッダーリファレンス</h2>

        {/* カテゴリフィルター */}
        <div className="http-headers-filters" role="group" aria-label="カテゴリフィルター">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`http-headers-filter-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => handleTabChange(tab)}
              aria-pressed={activeTab === tab}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 検索ボックス */}
        <div className="http-headers-search">
          <label htmlFor="http-headers-search-input" className="sr-only">
            ヘッダーを検索
          </label>
          <input
            id="http-headers-search-input"
            type="search"
            className="http-headers-search-input"
            placeholder="ヘッダー名・説明・使用例で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="ヘッダーを検索"
          />
        </div>

        {/* 件数表示 */}
        <p className="http-headers-count" role="status" aria-live="polite" aria-atomic="true">
          {filtered.length} 件 / 全 {HTTP_HEADERS.length} 件
        </p>

        {/* グリッド表示 */}
        {filtered.length > 0 ? (
          <div className="http-headers-grid" role="list" aria-label="HTTPヘッダー一覧">
            {filtered.map((header) => (
              <article
                key={header.name}
                className={`http-headers-card ${CATEGORY_COLORS[header.category]}`}
                role="listitem"
                aria-label={header.name}
              >
                <div className="http-headers-card-header">
                  <code
                    className={`http-headers-name ${CATEGORY_COLORS[header.category]}`}
                    aria-label={`ヘッダー名 ${header.name}`}
                  >
                    {header.name}
                  </code>
                  <div className="http-headers-badges">
                    <span
                      className={`http-headers-badge ${CATEGORY_COLORS[header.category]}`}
                      aria-label={`カテゴリ ${CATEGORY_LABELS[header.category]}`}
                    >
                      {CATEGORY_LABELS[header.category]}
                    </span>
                    {header.security && (
                      <span
                        className="http-headers-badge http-headers-badge-security"
                        aria-label="セキュリティ関連"
                      >
                        🛡️ セキュリティ
                      </span>
                    )}
                    {header.deprecated && (
                      <span
                        className="http-headers-badge http-headers-badge-deprecated"
                        aria-label="非推奨"
                      >
                        非推奨
                      </span>
                    )}
                  </div>
                </div>
                <p className="http-headers-desc">{header.description}</p>
                <div className="http-headers-example">
                  <span className="http-headers-example-label">使用例:</span>
                  <code className="http-headers-example-value">{header.example}</code>
                </div>
                <div className="http-headers-card-footer">
                  <button
                    type="button"
                    className="http-headers-copy-btn"
                    onClick={() => handleCopyHeader(header.name)}
                    aria-label={`${header.name} をコピー`}
                  >
                    ヘッダー名をコピー
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="http-headers-empty" role="status" aria-live="polite">
            <p>該当するヘッダーが見つかりませんでした。</p>
            <p>検索条件を変更してお試しください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "HTTPヘッダーのカテゴリ",
              items: [
                "リクエスト: クライアントからサーバーへ送信するヘッダー（Accept、Authorization など）",
                "レスポンス: サーバーからクライアントへ返すヘッダー（Set-Cookie、Location など）",
                "共通: リクエスト・レスポンス両方で使用するヘッダー（Content-Type、Cache-Control など）",
                "セキュリティ: XSS・CSRF・クリックジャッキング等の攻撃を防ぐために重要なヘッダー",
              ],
            },
            {
              title: "重要なセキュリティヘッダー",
              items: [
                "Content-Security-Policy (CSP) - XSS・データインジェクション攻撃の防止",
                "Strict-Transport-Security (HSTS) - HTTPS強制・ダウングレード攻撃の防止",
                "X-Content-Type-Options: nosniff - MIMEスニッフィングの防止",
                "X-Frame-Options - クリックジャッキング攻撃の防止（CSP frame-ancestors 推奨）",
                "Referrer-Policy - 参照元URLの情報漏洩防止",
                "Permissions-Policy - ブラウザ機能へのアクセス制御",
              ],
            },
            {
              title: "ヘッダー名のコピー",
              items: [
                "「ヘッダー名をコピー」ボタンで正確なヘッダー名をクリップボードにコピーできます",
                "ヘッダー名は大文字・小文字を区別しませんが、慣例的にTitle-Caseで記述されます",
                "HTTP/2以降ではヘッダー名を小文字にすることが推奨されています",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
