import { describe, it, expect } from "vitest";
import {
  parseHar,
  formatBytes,
  formatDuration,
  getStatusCategory,
  getContentTypeLabel,
  analyzeHar,
  type HarFile,
  type HarEntry,
} from "../../app/utils/har";

// テスト用のHARエントリーを生成するヘルパー
function makeEntry(overrides: Partial<HarEntry> = {}): HarEntry {
  return {
    startedDateTime: "2024-01-01T00:00:00.000Z",
    time: 100,
    request: {
      method: "GET",
      url: "https://example.com/api/test",
      headers: [],
      queryString: [],
      headersSize: 200,
      bodySize: 0,
    },
    response: {
      status: 200,
      statusText: "OK",
      headers: [],
      content: {
        size: 1024,
        mimeType: "application/json",
      },
      redirectURL: "",
      headersSize: 100,
      bodySize: 924,
    },
    timings: {
      send: 1,
      wait: 80,
      receive: 19,
    },
    ...overrides,
  };
}

// テスト用の最小HARファイルを生成するヘルパー
function makeHarFile(entries: HarEntry[] = []): HarFile {
  return {
    log: {
      version: "1.2",
      creator: { name: "TestBrowser", version: "1.0" },
      entries,
    },
  };
}

describe("parseHar", () => {
  it("有効なHARのJSONをパースできる", () => {
    const har = makeHarFile([makeEntry()]);
    const json = JSON.stringify(har);
    const result = parseHar(json);
    expect(result.log.entries).toHaveLength(1);
    expect(result.log.version).toBe("1.2");
  });

  it("無効なJSONでエラーをスローする", () => {
    expect(() => parseHar("not json")).toThrow("無効なJSON");
  });

  it("log.entriesが存在しない場合にエラーをスローする", () => {
    const invalid = JSON.stringify({ log: { version: "1.2" } });
    expect(() => parseHar(invalid)).toThrow("無効なHARフォーマット");
  });

  it("logが存在しない場合にエラーをスローする", () => {
    const invalid = JSON.stringify({ foo: "bar" });
    expect(() => parseHar(invalid)).toThrow();
  });

  it("空のentriesでも正常にパースできる", () => {
    const har = makeHarFile([]);
    const result = parseHar(JSON.stringify(har));
    expect(result.log.entries).toHaveLength(0);
  });
});

describe("formatBytes", () => {
  it("1024未満はBで表示する", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("1024以上1MB未満はKBで表示する", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(10240)).toBe("10.0 KB");
  });

  it("1MB以上はMBで表示する", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("負の値は0 Bを返す", () => {
    expect(formatBytes(-1)).toBe("0 B");
  });
});

describe("formatDuration", () => {
  it("1000ms未満はmsで表示する", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(150)).toBe("150ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("1000ms以上はsで表示する", () => {
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(10000)).toBe("10.0s");
  });
});

describe("getStatusCategory", () => {
  it("2xx は success を返す", () => {
    expect(getStatusCategory(200)).toBe("success");
    expect(getStatusCategory(201)).toBe("success");
    expect(getStatusCategory(204)).toBe("success");
  });

  it("3xx は redirect を返す", () => {
    expect(getStatusCategory(301)).toBe("redirect");
    expect(getStatusCategory(302)).toBe("redirect");
    expect(getStatusCategory(304)).toBe("redirect");
  });

  it("4xx は client-error を返す", () => {
    expect(getStatusCategory(400)).toBe("client-error");
    expect(getStatusCategory(404)).toBe("client-error");
    expect(getStatusCategory(422)).toBe("client-error");
  });

  it("5xx は server-error を返す", () => {
    expect(getStatusCategory(500)).toBe("server-error");
    expect(getStatusCategory(502)).toBe("server-error");
    expect(getStatusCategory(503)).toBe("server-error");
  });

  it("その他は other を返す", () => {
    expect(getStatusCategory(0)).toBe("other");
    expect(getStatusCategory(100)).toBe("other");
  });
});

describe("getContentTypeLabel", () => {
  it("JSONを正しく識別する", () => {
    expect(getContentTypeLabel("application/json")).toBe("JSON");
    expect(getContentTypeLabel("application/json; charset=utf-8")).toBe("JSON");
  });

  it("HTMLを正しく識別する", () => {
    expect(getContentTypeLabel("text/html")).toBe("HTML");
    expect(getContentTypeLabel("text/html; charset=utf-8")).toBe("HTML");
  });

  it("JavaScriptを正しく識別する", () => {
    expect(getContentTypeLabel("application/javascript")).toBe("JS");
    expect(getContentTypeLabel("text/javascript")).toBe("JS");
  });

  it("CSSを正しく識別する", () => {
    expect(getContentTypeLabel("text/css")).toBe("CSS");
  });

  it("画像を正しく識別する", () => {
    expect(getContentTypeLabel("image/png")).toBe("Image");
    expect(getContentTypeLabel("image/jpeg")).toBe("Image");
    expect(getContentTypeLabel("image/webp")).toBe("Image");
  });

  it("不明なタイプはOtherを返す", () => {
    expect(getContentTypeLabel("application/octet-stream")).toBe("Other");
    expect(getContentTypeLabel("")).toBe("Other");
  });
});

describe("analyzeHar", () => {
  it("空のエントリーで初期値を返す", () => {
    const har = makeHarFile([]);
    const result = analyzeHar(har);
    expect(result.totalRequests).toBe(0);
    expect(result.totalSize).toBe(0);
    expect(result.totalTransferSize).toBe(0);
    expect(result.totalTime).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.slowestEntry).toBeNull();
    expect(result.largestEntry).toBeNull();
  });

  it("総リクエスト数が正しい", () => {
    const har = makeHarFile([makeEntry(), makeEntry(), makeEntry()]);
    const result = analyzeHar(har);
    expect(result.totalRequests).toBe(3);
  });

  it("エラー数（4xx + 5xx）が正しい", () => {
    const entries = [
      makeEntry({ response: { ...makeEntry().response, status: 200 } }),
      makeEntry({ response: { ...makeEntry().response, status: 404 } }),
      makeEntry({ response: { ...makeEntry().response, status: 500 } }),
    ];
    const har = makeHarFile(entries);
    const result = analyzeHar(har);
    expect(result.errorCount).toBe(2);
  });

  it("最も遅いエントリーが正しく選択される", () => {
    const slow = makeEntry({ time: 5000 });
    const fast = makeEntry({ time: 50 });
    const har = makeHarFile([fast, slow]);
    const result = analyzeHar(har);
    expect(result.slowestEntry?.time).toBe(5000);
  });

  it("最も大きなエントリーが正しく選択される", () => {
    const small = makeEntry({
      response: {
        ...makeEntry().response,
        content: { size: 100, mimeType: "application/json" },
      },
    });
    const large = makeEntry({
      response: {
        ...makeEntry().response,
        content: { size: 999999, mimeType: "application/json" },
      },
    });
    const har = makeHarFile([small, large]);
    const result = analyzeHar(har);
    expect(result.largestEntry?.response.content.size).toBe(999999);
  });

  it("コンテンツタイプ分布が正しい", () => {
    const entries = [
      makeEntry({
        response: {
          ...makeEntry().response,
          content: { size: 100, mimeType: "application/json" },
        },
      }),
      makeEntry({
        response: {
          ...makeEntry().response,
          content: { size: 200, mimeType: "text/html" },
        },
      }),
      makeEntry({
        response: {
          ...makeEntry().response,
          content: { size: 300, mimeType: "application/json" },
        },
      }),
    ];
    const har = makeHarFile(entries);
    const result = analyzeHar(har);
    expect(result.contentTypeDistribution["JSON"]).toBe(2);
    expect(result.contentTypeDistribution["HTML"]).toBe(1);
  });

  it("ステータス分布が正しい", () => {
    const entries = [
      makeEntry({ response: { ...makeEntry().response, status: 200 } }),
      makeEntry({ response: { ...makeEntry().response, status: 201 } }),
      makeEntry({ response: { ...makeEntry().response, status: 404 } }),
    ];
    const har = makeHarFile(entries);
    const result = analyzeHar(har);
    expect(result.statusDistribution["2xx"]).toBe(2);
    expect(result.statusDistribution["4xx"]).toBe(1);
  });
});
