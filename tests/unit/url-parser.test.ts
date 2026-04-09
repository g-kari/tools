import { describe, it, expect } from "vite-plus/test";
import {
  parseUrl,
  buildUrl,
  parseQueryString,
  buildQueryString,
  isValidUrl,
  getSampleUrl,
} from "../../app/utils/url-parser";

describe("parseQueryString", () => {
  it("空文字の場合は空配列を返す", () => {
    expect(parseQueryString("")).toEqual([]);
  });

  it("単一パラメータを解析する", () => {
    expect(parseQueryString("?key=value")).toEqual([{ key: "key", value: "value" }]);
  });

  it("複数パラメータを解析する", () => {
    const result = parseQueryString("?page=1&limit=10&lang=ja");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ key: "page", value: "1" });
    expect(result[1]).toEqual({ key: "limit", value: "10" });
    expect(result[2]).toEqual({ key: "lang", value: "ja" });
  });

  it("日本語パラメータを解析する", () => {
    const encoded = "?q=" + encodeURIComponent("検索");
    const result = parseQueryString(encoded);
    expect(result[0]).toEqual({ key: "q", value: "検索" });
  });
});

describe("buildQueryString", () => {
  it("空配列の場合は空文字を返す", () => {
    expect(buildQueryString([])).toBe("");
  });

  it("キーが空のパラメータを除外する", () => {
    expect(buildQueryString([{ key: "", value: "value" }])).toBe("");
  });

  it("単一パラメータのクエリ文字列を生成する", () => {
    const result = buildQueryString([{ key: "key", value: "value" }]);
    expect(result).toBe("?key=value");
  });

  it("複数パラメータのクエリ文字列を生成する", () => {
    const result = buildQueryString([
      { key: "page", value: "1" },
      { key: "lang", value: "ja" },
    ]);
    expect(result).toBe("?page=1&lang=ja");
  });

  it("特殊文字をエンコードする", () => {
    const result = buildQueryString([{ key: "q", value: "hello world" }]);
    expect(result).toBe("?q=hello+world");
  });
});

describe("parseUrl", () => {
  it("空文字の場合はisValid: falseを返す", () => {
    const result = parseUrl("");
    expect(result.isValid).toBe(false);
  });

  it("無効なURLの場合はisValid: falseを返す", () => {
    const result = parseUrl("not-a-url");
    expect(result.isValid).toBe(false);
  });

  it("有効なURLを正しく解析する", () => {
    const result = parseUrl("https://example.com/path?key=value#section");
    expect(result.isValid).toBe(true);
    expect(result.protocol).toBe("https:");
    expect(result.hostname).toBe("example.com");
    expect(result.pathname).toBe("/path");
    expect(result.search).toBe("?key=value");
    expect(result.hash).toBe("#section");
  });

  it("ポート番号を解析する", () => {
    const result = parseUrl("https://example.com:8080/api");
    expect(result.isValid).toBe(true);
    expect(result.port).toBe("8080");
    expect(result.host).toBe("example.com:8080");
  });

  it("ユーザー情報を解析する", () => {
    const result = parseUrl("https://user:pass@example.com/");
    expect(result.isValid).toBe(true);
    expect(result.username).toBe("user");
    expect(result.password).toBe("pass");
  });

  it("クエリパラメータを配列として返す", () => {
    const result = parseUrl("https://example.com/?page=1&limit=10");
    expect(result.isValid).toBe(true);
    expect(result.queryParams).toHaveLength(2);
    expect(result.queryParams[0]).toEqual({ key: "page", value: "1" });
  });

  it("クエリパラメータなしの場合は空配列を返す", () => {
    const result = parseUrl("https://example.com/");
    expect(result.isValid).toBe(true);
    expect(result.queryParams).toEqual([]);
  });

  it("FTPプロトコルを解析する", () => {
    const result = parseUrl("ftp://files.example.com/file.txt");
    expect(result.isValid).toBe(true);
    expect(result.protocol).toBe("ftp:");
  });
});

describe("buildUrl", () => {
  it("hostnameが空の場合は空文字を返す", () => {
    expect(buildUrl({ protocol: "https", hostname: "" })).toBe("");
  });

  it("最小構成のURLを生成する", () => {
    const result = buildUrl({ protocol: "https", hostname: "example.com" });
    expect(result).toBe("https://example.com/");
  });

  it("ポート番号を含むURLを生成する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      port: "8080",
    });
    expect(result).toBe("https://example.com:8080/");
  });

  it("パスを含むURLを生成する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      pathname: "/api/v1/users",
    });
    expect(result).toBe("https://example.com/api/v1/users");
  });

  it("クエリパラメータを含むURLを生成する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      queryParams: [{ key: "page", value: "1" }],
    });
    expect(result).toBe("https://example.com/?page=1");
  });

  it("フラグメントを含むURLを生成する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      hash: "section",
    });
    expect(result).toBe("https://example.com/#section");
  });

  it("フラグメントに # が既にある場合はそのまま使用する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      hash: "#section",
    });
    expect(result).toBe("https://example.com/#section");
  });

  it("ユーザー情報を含むURLを生成する", () => {
    const result = buildUrl({
      protocol: "https",
      hostname: "example.com",
      username: "user",
      password: "pass",
    });
    expect(result).toContain("user:pass@");
    expect(result).toContain("example.com");
  });

  it("プロトコルに : がない場合は自動で付加する", () => {
    const result = buildUrl({ protocol: "https", hostname: "example.com" });
    expect(result.startsWith("https://")).toBe(true);
  });

  it("プロトコルに : がある場合はそのまま使用する", () => {
    const result = buildUrl({ protocol: "https:", hostname: "example.com" });
    expect(result.startsWith("https://")).toBe(true);
  });
});

describe("isValidUrl", () => {
  it("有効なURLの場合はtrueを返す", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("無効なURLの場合はfalseを返す", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("空文字の場合はfalseを返す", () => {
    expect(isValidUrl("")).toBe(false);
  });
});

describe("getSampleUrl", () => {
  it("有効なURL文字列を返す", () => {
    const sample = getSampleUrl();
    expect(typeof sample).toBe("string");
    expect(isValidUrl(sample)).toBe(true);
  });

  it("クエリパラメータを含む", () => {
    const sample = getSampleUrl();
    expect(sample).toContain("?");
  });
});
