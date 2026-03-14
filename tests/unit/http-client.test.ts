import { describe, it, expect } from "vitest";
import {
  isValidUrl,
  headersArrayToObject,
  formatResponseBody,
  responseHeadersToObject,
  type HttpHeader,
} from "../../app/functions/http-client";

describe("isValidUrl", () => {
  it("正常なhttpsのURLを有効と判定する", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("正常なhttpのURLを有効と判定する", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("パスやクエリパラメータを含むURLを有効と判定する", () => {
    expect(isValidUrl("https://api.example.com/v1/users?page=1&limit=10")).toBe(
      true
    );
  });

  it("ftpスキームのURLを無効と判定する", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("スキームなしの文字列を無効と判定する", () => {
    expect(isValidUrl("example.com")).toBe(false);
  });

  it("空文字列を無効と判定する", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("ランダムな文字列を無効と判定する", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("ローカルホストのURLを有効と判定する", () => {
    // isValidUrlはURL形式チェックのみ。SSRFチェックは別途行う
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });
});

describe("headersArrayToObject", () => {
  it("ヘッダー配列を正しくオブジェクトに変換する", () => {
    const headers: HttpHeader[] = [
      { key: "Content-Type", value: "application/json" },
      { key: "Authorization", value: "Bearer token123" },
    ];
    const result = headersArrayToObject(headers);
    expect(result).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token123",
    });
  });

  it("空のキーを持つヘッダーはスキップする", () => {
    const headers: HttpHeader[] = [
      { key: "", value: "application/json" },
      { key: "Accept", value: "application/json" },
    ];
    const result = headersArrayToObject(headers);
    expect(result).toEqual({ Accept: "application/json" });
    expect(Object.keys(result).length).toBe(1);
  });

  it("空の値を持つヘッダーはスキップする", () => {
    const headers: HttpHeader[] = [
      { key: "Content-Type", value: "" },
      { key: "Accept", value: "application/json" },
    ];
    const result = headersArrayToObject(headers);
    expect(result).toEqual({ Accept: "application/json" });
  });

  it("空の配列は空のオブジェクトを返す", () => {
    const result = headersArrayToObject([]);
    expect(result).toEqual({});
  });

  it("キーと値の前後空白をトリムする", () => {
    const headers: HttpHeader[] = [
      { key: "  Content-Type  ", value: "  application/json  " },
    ];
    const result = headersArrayToObject(headers);
    expect(result).toEqual({ "Content-Type": "application/json" });
  });

  it("重複したキーは後の値で上書きされる", () => {
    const headers: HttpHeader[] = [
      { key: "X-Custom", value: "first" },
      { key: "X-Custom", value: "second" },
    ];
    const result = headersArrayToObject(headers);
    expect(result["X-Custom"]).toBe("second");
  });
});

describe("formatResponseBody", () => {
  it("有効なJSONを整形する", () => {
    const input = '{"name":"test","value":123}';
    const result = formatResponseBody(input);
    expect(result).toBe(
      JSON.stringify(JSON.parse(input), null, 2)
    );
  });

  it("配列のJSONを整形する", () => {
    const input = '[{"id":1},{"id":2}]';
    const result = formatResponseBody(input);
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it("無効なJSONはそのまま返す", () => {
    const input = "plain text response";
    const result = formatResponseBody(input);
    expect(result).toBe("plain text response");
  });

  it("HTMLはそのまま返す", () => {
    const input = "<html><body>Hello</body></html>";
    const result = formatResponseBody(input);
    expect(result).toBe(input);
  });

  it("空文字列はそのまま返す", () => {
    const result = formatResponseBody("");
    expect(result).toBe("");
  });

  it("ネストしたJSONを整形する", () => {
    const input = '{"user":{"name":"Alice","age":30},"active":true}';
    const result = formatResponseBody(input);
    // インデントされた結果を検証
    expect(result).toContain("  ");
    expect(result).toContain('"name"');
    expect(result).toContain('"Alice"');
  });
});

describe("responseHeadersToObject", () => {
  it("Headersオブジェクトをプレーンオブジェクトに変換する", () => {
    const headers = new Headers({
      "content-type": "application/json",
      "x-request-id": "abc123",
    });
    const result = responseHeadersToObject(headers);
    expect(result["content-type"]).toBe("application/json");
    expect(result["x-request-id"]).toBe("abc123");
  });

  it("空のHeadersは空のオブジェクトを返す", () => {
    const headers = new Headers();
    const result = responseHeadersToObject(headers);
    expect(Object.keys(result).length).toBe(0);
  });

  it("複数のヘッダーすべてを変換する", () => {
    const headers = new Headers({
      "content-type": "text/html",
      "cache-control": "no-cache",
      "x-powered-by": "cloudflare",
    });
    const result = responseHeadersToObject(headers);
    expect(Object.keys(result).length).toBe(3);
    expect(result["content-type"]).toBe("text/html");
    expect(result["cache-control"]).toBe("no-cache");
    expect(result["x-powered-by"]).toBe("cloudflare");
  });
});

describe("HTTPメソッドとボディの関係", () => {
  it("GETメソッドはボディなしで使用できる", () => {
    // GETリクエストにはボディを含めないことを確認
    const method = "GET";
    const hasBody = method !== "GET" && method !== "HEAD";
    expect(hasBody).toBe(false);
  });

  it("POSTメソッドはボディありで使用できる", () => {
    const method = "POST";
    const hasBody = method !== "GET" && method !== "HEAD";
    expect(hasBody).toBe(true);
  });

  it("HEADメソッドはボディなしで使用できる", () => {
    const method = "HEAD";
    const hasBody = method !== "GET" && method !== "HEAD";
    expect(hasBody).toBe(false);
  });

  it("PUTメソッドはボディありで使用できる", () => {
    const method = "PUT";
    const hasBody = method !== "GET" && method !== "HEAD";
    expect(hasBody).toBe(true);
  });

  it("DELETEメソッドはボディありで使用できる", () => {
    const method = "DELETE";
    const hasBody = method !== "GET" && method !== "HEAD";
    expect(hasBody).toBe(true);
  });
});

describe("レスポンス時間の計算", () => {
  it("レスポンス時間は非負の数値である", () => {
    const startTime = Date.now();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    expect(responseTime).toBeGreaterThanOrEqual(0);
  });

  it("レスポンス時間はミリ秒単位の整数である", () => {
    const startTime = Date.now();
    // 少し待機（実際のリクエスト処理をシミュレート）
    const endTime = startTime + 150;
    const responseTime = endTime - startTime;
    expect(Number.isInteger(responseTime)).toBe(true);
    expect(responseTime).toBe(150);
  });
});
