import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/http-status")({
  head: () => ({
    meta: [
      { title: "HTTPステータスコード | Web ツール集" },
      {
        name: "description",
        content:
          "HTTPステータスコード（1xx〜5xx）のリファレンス。カテゴリ別フィルタリングとキーワード検索でコードをすばやく調べられます。",
      },
      { property: "og:title", content: "HTTPステータスコード | Web ツール集" },
      {
        property: "og:description",
        content:
          "HTTPステータスコード（1xx〜5xx）のリファレンス。カテゴリ別フィルタリングとキーワード検索でコードをすばやく調べられます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/http-status` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "HTTPステータスコード | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "HTTPステータスコード（1xx〜5xx）のリファレンス。カテゴリ別フィルタリングとキーワード検索でコードをすばやく調べられます。",
      },
    ],
  }),
  component: HttpStatusPage,
});

/**
 * HTTPステータスコードの型定義
 */
export interface HttpStatusCode {
  /** HTTPステータスコード番号 */
  code: number;
  /** ステータス名 */
  name: string;
  /** ステータスの説明 */
  description: string;
  /** カテゴリ（1xx〜5xx） */
  category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
}

/**
 * すべてのHTTPステータスコードデータ
 */
export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 1xx Informational
  {
    code: 100,
    name: "Continue",
    description:
      "リクエストの最初の部分が受け取られ、クライアントは残りのリクエストを送信し続けるべきであることを示します。",
    category: "1xx",
  },
  {
    code: 101,
    name: "Switching Protocols",
    description:
      "サーバーがクライアントのUpgradeリクエストヘッダーに従い、プロトコルを切り替えることに同意したことを示します。",
    category: "1xx",
  },
  {
    code: 102,
    name: "Processing",
    description:
      "サーバーがリクエストを受け取り、処理中であるがまだ応答がないことを示します（WebDAV）。",
    category: "1xx",
  },
  {
    code: 103,
    name: "Early Hints",
    description:
      "最終的なHTTPメッセージの前にLink等のヒントを含むレスポンスヘッダーを返し、ブラウザがプリロードを開始できるようにします。",
    category: "1xx",
  },

  // 2xx Success
  {
    code: 200,
    name: "OK",
    description:
      "リクエストが成功したことを示します。GETではリソースの取得、POSTではアクションの結果がレスポンスに含まれます。",
    category: "2xx",
  },
  {
    code: 201,
    name: "Created",
    description:
      "リクエストが成功し、新しいリソースが作成されたことを示します。通常POSTまたはPUTリクエストへのレスポンスとして返されます。",
    category: "2xx",
  },
  {
    code: 202,
    name: "Accepted",
    description:
      "リクエストは受け取られましたが、まだ処理が完了していないことを示します。非同期処理に使用されます。",
    category: "2xx",
  },
  {
    code: 204,
    name: "No Content",
    description:
      "リクエストは成功しましたが、返すコンテンツがないことを示します。DELETE操作などで使用されます。",
    category: "2xx",
  },
  {
    code: 206,
    name: "Partial Content",
    description:
      "Rangeヘッダーで指定されたリソースの一部のみを転送することを示します。動画のシークや大ファイルのダウンロード再開に使用されます。",
    category: "2xx",
  },
  {
    code: 207,
    name: "Multi-Status",
    description:
      "複数のリソースに対する複数のステータスコードが適切な場合の情報を含みます（WebDAV）。",
    category: "2xx",
  },
  {
    code: 208,
    name: "Already Reported",
    description:
      "DAV バインディングのメンバーが以前の応答で既に列挙されており、再度含まれないことを示します（WebDAV）。",
    category: "2xx",
  },
  {
    code: 226,
    name: "IM Used",
    description:
      "サーバーがGETリクエストに対してdelta-encodingで応答しました。インスタンス操作の結果を表します（HTTP Delta encoding）。",
    category: "2xx",
  },

  // 3xx Redirection
  {
    code: 300,
    name: "Multiple Choices",
    description:
      "リクエストに対して複数の応答が考えられることを示します。ユーザーまたはユーザーエージェントが選択すべきです。",
    category: "3xx",
  },
  {
    code: 301,
    name: "Moved Permanently",
    description:
      "リクエストされたリソースのURLが恒久的に変更されたことを示します。新しいURLがLocationヘッダーに含まれます。",
    category: "3xx",
  },
  {
    code: 302,
    name: "Found",
    description:
      "リクエストされたリソースのURLが一時的に変更されたことを示します。将来同じURLを使用するよう、クライアントに伝えます。",
    category: "3xx",
  },
  {
    code: 303,
    name: "See Other",
    description:
      "クライアントを別のURLへGETリクエストでリダイレクトします。POSTリクエスト後のリダイレクト（PRGパターン）によく使われます。",
    category: "3xx",
  },
  {
    code: 304,
    name: "Not Modified",
    description:
      "条件付きGETまたはHEADリクエストで、リソースが変更されていないことを示します。キャッシュを使用するよう指示します。",
    category: "3xx",
  },
  {
    code: 307,
    name: "Temporary Redirect",
    description:
      "リクエストされたリソースが一時的に別のURIに移動しましたが、将来同じURIを使用するよう指示します。メソッドは変更されません。",
    category: "3xx",
  },
  {
    code: 308,
    name: "Permanent Redirect",
    description:
      "リクエストされたリソースが恒久的に別のURIに移動しました。301と異なり、HTTPメソッドを変更してはいけません。",
    category: "3xx",
  },

  // 4xx Client Errors
  {
    code: 400,
    name: "Bad Request",
    description:
      "クライアントのリクエストが不正であることを示します。構文エラー、無効なリクエストフレーミング、不正なルーティングなどが原因です。",
    category: "4xx",
  },
  {
    code: 401,
    name: "Unauthorized",
    description:
      "認証が必要であることを示します。クライアントはWWW-Authenticateヘッダーに従って認証を行う必要があります。",
    category: "4xx",
  },
  {
    code: 403,
    name: "Forbidden",
    description:
      "クライアントはコンテンツにアクセスする権限がないことを示します。401と異なり、サーバーはクライアントのIDを認識しています。",
    category: "4xx",
  },
  {
    code: 404,
    name: "Not Found",
    description:
      "サーバーがリクエストされたリソースを見つけられないことを示します。URLが間違っているか、リソースが存在しません。",
    category: "4xx",
  },
  {
    code: 405,
    name: "Method Not Allowed",
    description:
      "リクエストメソッドがサーバーによって認識されているが、ターゲットリソースではサポートされていないことを示します。",
    category: "4xx",
  },
  {
    code: 408,
    name: "Request Timeout",
    description:
      "サーバーがアイドル接続でタイムアウトを送信します。サーバーがこの接続を使用してリクエストを受信し続けることを望まないことを示します。",
    category: "4xx",
  },
  {
    code: 409,
    name: "Conflict",
    description:
      "リクエストがサーバーの現在の状態と競合していることを示します。ファイルのバージョン競合などに使用されます。",
    category: "4xx",
  },
  {
    code: 410,
    name: "Gone",
    description:
      "リクエストされたコンテンツがサーバーから恒久的に削除されたことを示します。404と異なり、恒久的な削除を明示します。",
    category: "4xx",
  },
  {
    code: 413,
    name: "Content Too Large",
    description:
      "リクエストエンティティがサーバーの定義した制限より大きいことを示します。ファイルアップロードサイズ超過などに使用されます。",
    category: "4xx",
  },
  {
    code: 414,
    name: "URI Too Long",
    description:
      "クライアントのリクエストURIがサーバーが解析しようとする長さより長いことを示します。",
    category: "4xx",
  },
  {
    code: 415,
    name: "Unsupported Media Type",
    description:
      "リクエストデータのメディアタイプがサーバーまたはリソースでサポートされていないことを示します。",
    category: "4xx",
  },
  {
    code: 422,
    name: "Unprocessable Content",
    description:
      "リクエストの形式は正しいが、意味的なエラーのためサーバーがリクエストを処理できないことを示します（WebDAV）。",
    category: "4xx",
  },
  {
    code: 429,
    name: "Too Many Requests",
    description:
      "クライアントが一定時間内に送信したリクエストが多すぎることを示します。レートリミットの超過時に使用されます。",
    category: "4xx",
  },
  {
    code: 431,
    name: "Request Header Fields Too Large",
    description:
      "サーバーがリクエストヘッダーフィールドが大きすぎるためリクエストを処理したくないことを示します。",
    category: "4xx",
  },
  {
    code: 451,
    name: "Unavailable For Legal Reasons",
    description:
      "法的な理由によりリクエストされたリソースにアクセスできないことを示します。政府の検閲や法的な制限に使用されます。",
    category: "4xx",
  },

  // 5xx Server Errors
  {
    code: 500,
    name: "Internal Server Error",
    description:
      "サーバーが処理方法を知らない状況に直面したことを示します。予期せぬサーバーエラーの汎用的なキャッチオールです。",
    category: "5xx",
  },
  {
    code: 501,
    name: "Not Implemented",
    description:
      "リクエストメソッドがサーバーでサポートされておらず、処理できないことを示します。GETとHEADのみが必須メソッドです。",
    category: "5xx",
  },
  {
    code: 502,
    name: "Bad Gateway",
    description:
      "ゲートウェイとして機能しているサーバーが、上流のサーバーから無効なレスポンスを受け取ったことを示します。",
    category: "5xx",
  },
  {
    code: 503,
    name: "Service Unavailable",
    description:
      "サーバーがリクエストを処理する準備ができていないことを示します。メンテナンスや過負荷のために一時的にダウンしています。",
    category: "5xx",
  },
  {
    code: 504,
    name: "Gateway Timeout",
    description:
      "ゲートウェイとして機能しているサーバーが、上流のサーバーからタイムアウト内にレスポンスを受け取れなかったことを示します。",
    category: "5xx",
  },
  {
    code: 505,
    name: "HTTP Version Not Supported",
    description:
      "リクエストで使用されたHTTPバージョンがサーバーでサポートされていないことを示します。",
    category: "5xx",
  },
  {
    code: 507,
    name: "Insufficient Storage",
    description:
      "リクエストを完了するために必要な表現を保存できなかったことを示します（WebDAV）。",
    category: "5xx",
  },
  {
    code: 508,
    name: "Loop Detected",
    description:
      "リクエストの処理中に無限ループを検出したことを示します（WebDAV）。",
    category: "5xx",
  },
  {
    code: 511,
    name: "Network Authentication Required",
    description:
      "クライアントがネットワークアクセスを取得するために認証する必要があることを示します。キャプティブポータルで使用されます。",
    category: "5xx",
  },
];

/**
 * コード番号からカテゴリを取得する
 * @param code - HTTPステータスコード番号（100〜599の範囲を想定）
 * @returns カテゴリ文字列（例: "2xx"）
 * @note 100未満または500以上のコードはフォールバックとして "5xx" を返します
 */
export function getStatusCategory(
  code: number
): "1xx" | "2xx" | "3xx" | "4xx" | "5xx" {
  if (code >= 100 && code < 200) return "1xx";
  if (code >= 200 && code < 300) return "2xx";
  if (code >= 300 && code < 400) return "3xx";
  if (code >= 400 && code < 500) return "4xx";
  return "5xx";
}

/**
 * カテゴリの表示ラベルを返す
 * @param category - カテゴリ文字列
 * @returns 日本語ラベル
 */
export function getCategoryLabel(category: string): string {
  switch (category) {
    case "all":
      return "すべて";
    case "1xx":
      return "1xx 情報";
    case "2xx":
      return "2xx 成功";
    case "3xx":
      return "3xx リダイレクト";
    case "4xx":
      return "4xx クライアントエラー";
    case "5xx":
      return "5xx サーバーエラー";
    default:
      return category;
  }
}

/**
 * カテゴリのCSSクラス名を返す
 * @param category - カテゴリ文字列
 * @returns CSSクラス名
 */
export function getCategoryColor(category: string): string {
  switch (category) {
    case "1xx":
      return "http-status-cat-1xx";
    case "2xx":
      return "http-status-cat-2xx";
    case "3xx":
      return "http-status-cat-3xx";
    case "4xx":
      return "http-status-cat-4xx";
    case "5xx":
      return "http-status-cat-5xx";
    default:
      return "";
  }
}

/**
 * ステータスコードをフィルタリングする
 * @param codes - フィルタリング対象のコード一覧
 * @param query - 検索クエリ（コード番号・名前・説明）
 * @param category - カテゴリフィルタ（"all"または"1xx"〜"5xx"）
 * @returns フィルタリングされたコード一覧
 */
export function filterStatusCodes(
  codes: HttpStatusCode[],
  query: string,
  category: string
): HttpStatusCode[] {
  const lowerQuery = query.toLowerCase().trim();

  return codes.filter((item) => {
    // カテゴリフィルタ
    if (category !== "all" && item.category !== category) {
      return false;
    }

    // キーワード検索（空の場合はすべてマッチ）
    if (!lowerQuery) return true;

    return (
      String(item.code).includes(lowerQuery) ||
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  });
}

const CATEGORIES = ["all", "1xx", "2xx", "3xx", "4xx", "5xx"] as const;

/**
 * HTTPステータスコードリファレンスページコンポーネント
 */
function HttpStatusPage() {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  const filteredCodes = filterStatusCodes(
    HTTP_STATUS_CODES,
    searchQuery,
    selectedCategory
  );

  /**
   * コード番号をクリップボードにコピーする
   * @param code - コピーするHTTPステータスコード番号
   */
  const handleCopyCode = useCallback(
    async (code: number) => {
      const success = await copy(String(code));
      if (success) {
        showToast(`${code} をコピーしました`, "success");
        announceStatus(`${code} をクリップボードにコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
        announceStatus("コピーに失敗しました");
      }
    },
    [copy, showToast, announceStatus]
  );

  /**
   * カテゴリを選択する
   * @param category - 選択するカテゴリ
   */
  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      announceStatus(
        `${getCategoryLabel(category)} でフィルタリング。${filterStatusCodes(HTTP_STATUS_CODES, searchQuery, category).length} 件表示`
      );
    },
    [searchQuery, announceStatus]
  );

  /**
   * 検索クエリを更新する
   * @param query - 検索クエリ
   */
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    []
  );

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">HTTPステータスコード リファレンス</h2>

        {/* カテゴリフィルタ */}
        <div
          className="http-status-filters"
          role="group"
          aria-label="カテゴリフィルター"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`http-status-filter-btn${selectedCategory === cat ? " active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* 検索ボックス */}
        <div className="http-status-search">
          <label htmlFor="http-status-search-input" className="sr-only">
            ステータスコードを検索
          </label>
          <input
            id="http-status-search-input"
            type="search"
            className="http-status-search-input"
            placeholder="コード番号・名前・説明で検索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="ステータスコードを検索"
          />
        </div>

        {/* 件数表示 */}
        <p
          className="http-status-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredCodes.length} 件 / 全 {HTTP_STATUS_CODES.length} 件
        </p>

        {/* グリッド表示 */}
        {filteredCodes.length > 0 ? (
          <div
            className="http-status-grid"
            role="list"
            aria-label="HTTPステータスコード一覧"
          >
            {filteredCodes.map((item) => (
              <article
                key={item.code}
                className={`http-status-card ${getCategoryColor(item.category)}`}
                role="listitem"
                aria-label={`${item.code} ${item.name}`}
              >
                <div className="http-status-card-header">
                  <span
                    className={`http-status-code ${getCategoryColor(item.category)}`}
                    aria-label={`コード ${item.code}`}
                  >
                    {item.code}
                  </span>
                  <span
                    className={`http-status-badge ${getCategoryColor(item.category)}`}
                    aria-label={`カテゴリ ${item.category}`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="http-status-name">{item.name}</p>
                <p className="http-status-desc">{item.description}</p>
                <div className="http-status-card-footer">
                  <button
                    type="button"
                    className="http-status-copy-btn"
                    onClick={() => handleCopyCode(item.code)}
                    aria-label={`${item.code} をコピー`}
                  >
                    コードをコピー
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="http-status-empty" role="status" aria-live="polite">
            <p>該当するステータスコードが見つかりませんでした。</p>
            <p>検索条件を変更してお試しください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "HTTPステータスコードとは",
              items: [
                "1xx（情報）: リクエストを受け取り、処理を継続中",
                "2xx（成功）: リクエストが正常に完了した",
                "3xx（リダイレクト）: リクエストを完了するにはさらなるアクションが必要",
                "4xx（クライアントエラー）: クライアント側のリクエストに問題がある",
                "5xx（サーバーエラー）: サーバー側で処理に失敗した",
              ],
            },
            {
              title: "よく使われるコード",
              items: [
                "200 OK - 最も基本的な成功レスポンス",
                "201 Created - リソース作成成功（POST/PUT後）",
                "301/302 - 恒久的/一時的なリダイレクト",
                "400 Bad Request - クライアントの入力ミス",
                "401 Unauthorized - 認証が必要",
                "403 Forbidden - アクセス権なし",
                "404 Not Found - リソースが存在しない",
                "500 Internal Server Error - サーバー内部エラー",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
