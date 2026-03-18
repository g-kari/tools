import { createServerFn } from "@tanstack/react-start";
import { isPrivateOrLocalhost } from "./security-headers";

/** リダイレクトの1ホップ分の情報 */
export interface RedirectHop {
  /** リクエストしたURL */
  url: string;
  /** HTTPステータスコード (0は接続エラー) */
  statusCode: number;
  /** HTTPステータステキスト */
  statusText: string;
  /** Location ヘッダーの値 (リダイレクトの場合) */
  location?: string;
  /** レスポンス時間（ミリ秒）*/
  responseTime: number;
}

/** リダイレクトトレース結果 */
export interface RedirectTraceResult {
  /** 各ホップの情報リスト */
  hops: RedirectHop[];
  /** 最終到達URL */
  finalUrl: string;
  /** 合計所要時間（ミリ秒）*/
  totalTime: number;
  /** エラーメッセージ (失敗時のみ) */
  error?: string;
}

/** 最大ホップ数 */
export const MAX_HOPS = 15;

/**
 * URLの形式が有効か検証する
 * @param urlString - 検証するURL文字列
 * @returns http/https URLであれば true
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * HTTPステータスコードからリダイレクトかどうかを判定する
 * @param status - HTTPステータスコード
 * @returns リダイレクトコードであれば true
 * @example
 * isRedirectStatus(301) // true
 * isRedirectStatus(200) // false
 */
export function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

/**
 * HTTPステータスコードの種別ラベルを返す
 * @param status - HTTPステータスコード
 * @returns ステータス種別文字列
 * @example
 * getStatusLabel(301) // "恒久リダイレクト"
 * getStatusLabel(200) // "成功"
 */
export function getStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    200: "成功",
    201: "作成完了",
    204: "コンテンツなし",
    301: "恒久リダイレクト",
    302: "一時リダイレクト",
    303: "他を参照",
    304: "未変更",
    307: "一時リダイレクト (メソッド保持)",
    308: "恒久リダイレクト (メソッド保持)",
    400: "不正なリクエスト",
    401: "認証エラー",
    403: "アクセス拒否",
    404: "見つからない",
    500: "サーバーエラー",
    502: "ゲートウェイエラー",
    503: "サービス利用不可",
  };
  return labels[status] ?? `ステータス ${status}`;
}

/**
 * URLのリダイレクトチェーンをサーバー側でトレースするサーバー関数
 *
 * SSRF対策として、プライベートIP・ローカルホストへのアクセスを拒否します。
 * 最大 MAX_HOPS ホップまで追跡します。
 */
export const traceRedirects = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "string") {
      throw new Error("URLを入力してください");
    }

    const trimmedUrl = data.trim();

    // プロトコルが省略されている場合は https:// を補完
    const urlWithProtocol = trimmedUrl.match(/^https?:\/\//)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    if (!isValidUrl(urlWithProtocol)) {
      throw new Error("無効なURL形式です");
    }

    // SSRF対策: プライベートIP・ローカルホストへのアクセスを拒否
    const parsedUrl = new URL(urlWithProtocol);
    if (isPrivateOrLocalhost(parsedUrl.hostname)) {
      throw new Error(
        "セキュリティ上の理由により、ローカルホストやプライベートIPアドレスへのアクセスはできません"
      );
    }

    return urlWithProtocol;
  })
  .handler(async ({ data: startUrl }): Promise<RedirectTraceResult> => {
    const hops: RedirectHop[] = [];
    let currentUrl = startUrl;
    const totalStart = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      for (let i = 0; i < MAX_HOPS; i++) {
        const hopStart = Date.now();

        let response: Response;
        try {
          response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
            },
          });
        } catch (e) {
          const err = e as Error;
          const isTimeout = err.name === "AbortError";
          const responseTime = Date.now() - hopStart;

          hops.push({
            url: currentUrl,
            statusCode: 0,
            statusText: isTimeout ? "タイムアウト" : "接続エラー",
            responseTime,
          });

          return {
            hops,
            finalUrl: currentUrl,
            totalTime: Date.now() - totalStart,
            error: isTimeout
              ? "タイムアウト: サーバーからの応答がありませんでした"
              : `接続エラー: ${err.message}`,
          };
        }

        const responseTime = Date.now() - hopStart;
        const location = response.headers.get("location") ?? undefined;

        hops.push({
          url: currentUrl,
          statusCode: response.status,
          statusText: response.statusText || getStatusLabel(response.status),
          location,
          responseTime,
        });

        // リダイレクトレスポンスかつ Location ヘッダーがある場合に追跡を続ける
        if (isRedirectStatus(response.status) && location) {
          try {
            // 相対URLを絶対URLに解決
            currentUrl = new URL(location, currentUrl).href;
          } catch {
            return {
              hops,
              finalUrl: currentUrl,
              totalTime: Date.now() - totalStart,
              error: `無効なリダイレクト先URL: ${location}`,
            };
          }

          // SSRF対策: リダイレクト先もプライベートIPチェック
          try {
            const redirectedUrl = new URL(currentUrl);
            if (isPrivateOrLocalhost(redirectedUrl.hostname)) {
              return {
                hops,
                finalUrl: currentUrl,
                totalTime: Date.now() - totalStart,
                error:
                  "セキュリティ上の理由により、プライベートIPへのリダイレクトのためトレースを停止しました",
              };
            }
          } catch {
            return {
              hops,
              finalUrl: currentUrl,
              totalTime: Date.now() - totalStart,
              error: `リダイレクト先URLの解析に失敗しました: ${currentUrl}`,
            };
          }
        } else {
          // リダイレクトではない (最終応答)
          break;
        }
      }

      // 最大ホップ数に到達した場合
      if (hops.length >= MAX_HOPS && hops[hops.length - 1]?.location) {
        return {
          hops,
          finalUrl: currentUrl,
          totalTime: Date.now() - totalStart,
          error: `最大ホップ数（${MAX_HOPS}）に達しました。リダイレクトループの可能性があります。`,
        };
      }

      return {
        hops,
        finalUrl: currentUrl,
        totalTime: Date.now() - totalStart,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  });
