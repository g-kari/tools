import { createServerFn } from "@tanstack/react-start";
import { isPrivateOrLocalhost } from "./security-headers";

/**
 * HTTPリクエストのメソッド種別
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/**
 * HTTPリクエストのカスタムヘッダー
 */
export interface HttpHeader {
  /** ヘッダーのキー */
  key: string;
  /** ヘッダーの値 */
  value: string;
}

/**
 * HTTPリクエストのパラメータ
 */
export interface HttpRequestParams {
  /** リクエスト先URL */
  url: string;
  /** HTTPメソッド */
  method: HttpMethod;
  /** カスタムヘッダー */
  headers: HttpHeader[];
  /** リクエストボディ */
  body?: string;
}

/**
 * HTTPレスポンスのデータ構造
 */
export interface HttpResponseData {
  /** HTTPステータスコード */
  statusCode: number;
  /** ステータステキスト */
  statusText: string;
  /** レスポンスヘッダー */
  headers: Record<string, string>;
  /** レスポンスボディ */
  body: string;
  /** レスポンス時間（ミリ秒） */
  responseTime: number;
  /** エラーメッセージ */
  error?: string;
}

/**
 * URLが有効なHTTP/HTTPSかチェックする
 * @param urlString - チェック対象のURL文字列
 * @returns 有効なURLの場合true
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * ヘッダー配列をオブジェクトに変換する
 * 空のキーや値を持つヘッダーはスキップする
 * @param headers - ヘッダーの配列
 * @returns ヘッダーオブジェクト
 */
export function headersArrayToObject(headers: HttpHeader[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const header of headers) {
    const key = header.key.trim();
    const value = header.value.trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * JSONレスポンスボディを整形する
 * JSON以外の場合はそのまま返す
 * @param body - レスポンスボディ文字列
 * @returns 整形されたボディ文字列
 */
export function formatResponseBody(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

/**
 * レスポンスヘッダーをオブジェクトに変換する
 * @param headers - Fetch APIのHeadersオブジェクト
 * @returns ヘッダーのキーバリューオブジェクト
 */
export function responseHeadersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * HTTPリクエストを送信するサーバーファンクション
 * Cloudflare Workers上で実行されることでCORSを回避する
 */
export const sendHttpRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== "object") {
      throw new Error("リクエストパラメータが無効です");
    }

    const params = data as Partial<HttpRequestParams>;

    if (!params.url || typeof params.url !== "string") {
      throw new Error("URLを入力してください");
    }

    const trimmedUrl = params.url.trim();
    const urlWithProtocol = trimmedUrl.match(/^https?:\/\//) ? trimmedUrl : `https://${trimmedUrl}`;

    if (!isValidUrl(urlWithProtocol)) {
      throw new Error("無効なURL形式です。http://またはhttps://で始まるURLを入力してください");
    }

    // SSRF対策: プライベートIP・ローカルホストへのアクセスを拒否
    const parsedUrl = new URL(urlWithProtocol);
    if (isPrivateOrLocalhost(parsedUrl.hostname)) {
      throw new Error(
        "セキュリティ上の理由により、ローカルホストやプライベートIPアドレスへのアクセスはできません",
      );
    }

    const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
    const method = (params.method || "GET").toUpperCase() as HttpMethod;
    if (!validMethods.includes(method)) {
      throw new Error(`無効なHTTPメソッドです: ${method}`);
    }

    const headers = Array.isArray(params.headers) ? params.headers : [];
    const body = typeof params.body === "string" ? params.body : undefined;

    return {
      url: urlWithProtocol,
      method,
      headers,
      body,
    } satisfies HttpRequestParams;
  })
  .handler(async ({ data: params }): Promise<HttpResponseData> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const startTime = Date.now();

    try {
      const headerObject = headersArrayToObject(params.headers);
      const fetchOptions: RequestInit = {
        method: params.method,
        headers: headerObject,
        signal: controller.signal,
        redirect: "follow",
      };

      // GETとHEADはボディを持てない
      if (params.body && params.method !== "GET" && params.method !== "HEAD") {
        fetchOptions.body = params.body;
      }

      const response = await fetch(params.url, fetchOptions);
      const responseTime = Date.now() - startTime;

      // SSRF対策: リダイレクト後の最終URLもプライベートIPチェック
      if (response.url && response.url !== params.url) {
        try {
          const finalParsedUrl = new URL(response.url);
          if (isPrivateOrLocalhost(finalParsedUrl.hostname)) {
            return {
              statusCode: 0,
              statusText: "Error",
              headers: {},
              body: "",
              responseTime,
              error:
                "セキュリティ上の理由により、プライベートIPへのリダイレクトは許可されていません",
            };
          }
        } catch {
          // URLパース失敗は無視
        }
      }

      const responseHeaders = responseHeadersToObject(response.headers);

      // HEADリクエストはボディを持たない
      let body = "";
      if (params.method !== "HEAD") {
        const MAX_BODY_SIZE = 1024 * 1024; // 1MB
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
          body = "[レスポンスボディが大きすぎます (1MB超)]";
        } else {
          const reader = response.body?.getReader();
          if (reader) {
            let totalSize = 0;
            const chunks: Uint8Array[] = [];
            let exceeded = false;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              totalSize += value.byteLength;
              if (totalSize > MAX_BODY_SIZE) {
                exceeded = true;
                reader.cancel();
                break;
              }
              chunks.push(value);
            }
            if (exceeded) {
              body = "[レスポンスボディが大きすぎます (1MB超)]";
            } else {
              const combined = new Uint8Array(totalSize);
              let offset = 0;
              for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.byteLength;
              }
              body = new TextDecoder().decode(combined);
            }
          } else {
            body = await response.text();
          }
        }
      }

      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = "不明なエラーが発生しました";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "タイムアウト: サーバーからの応答が15秒以内にありませんでした";
        } else {
          errorMessage = "リクエストエラー: ネットワーク接続に失敗しました";
        }
      }

      return {
        statusCode: 0,
        statusText: "Error",
        headers: {},
        body: "",
        responseTime,
        error: errorMessage,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  });
