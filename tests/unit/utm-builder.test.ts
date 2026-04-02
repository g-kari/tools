import { describe, it, expect } from "vitest";
import {
  isValidUrl,
  buildUtmUrl,
  parseUtmUrl,
} from "../../app/utils/utm";

describe("isValidUrl", () => {
  it("httpsのURLは有効", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("httpのURLは有効", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("パスやクエリを含むURLは有効", () => {
    expect(isValidUrl("https://example.com/page?foo=bar")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("URLでない文字列は無効", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("ftpスキームは無効", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("スキームなしのURLは無効", () => {
    expect(isValidUrl("example.com")).toBe(false);
  });

  it("空白のみは無効", () => {
    expect(isValidUrl("   ")).toBe(false);
  });
});

describe("buildUtmUrl", () => {
  it("sourceとmediumだけ指定してURLが生成される", () => {
    const result = buildUtmUrl("https://example.com", {
      source: "google",
      medium: "cpc",
    });
    expect(result).toContain("utm_source=google");
    expect(result).toContain("utm_medium=cpc");
  });

  it("全パラメータ指定でURLが生成される", () => {
    const result = buildUtmUrl("https://example.com", {
      source: "google",
      medium: "cpc",
      campaign: "spring_sale",
      term: "running shoes",
      content: "logolink",
    });
    expect(result).toContain("utm_source=google");
    expect(result).toContain("utm_medium=cpc");
    expect(result).toContain("utm_campaign=spring_sale");
    expect(result).toContain("utm_term=running+shoes");
    expect(result).toContain("utm_content=logolink");
  });

  it("空文字のパラメータは除外される", () => {
    const result = buildUtmUrl("https://example.com", {
      source: "google",
      medium: "",
      campaign: "test",
    });
    expect(result).toContain("utm_source=google");
    expect(result).not.toContain("utm_medium");
    expect(result).toContain("utm_campaign=test");
  });

  it("空のパラメータオブジェクトはベースURLをそのまま返す", () => {
    const result = buildUtmUrl("https://example.com", {});
    expect(result).toBe("https://example.com/");
  });

  it("ベースURLが空文字の場合は空文字を返す", () => {
    const result = buildUtmUrl("", { source: "google" });
    expect(result).toBe("");
  });

  it("無効なURLの場合は空文字を返す", () => {
    const result = buildUtmUrl("not-a-url", { source: "google" });
    expect(result).toBe("");
  });

  it("既存のクエリパラメータが保持される", () => {
    const result = buildUtmUrl("https://example.com?ref=home", {
      source: "google",
    });
    expect(result).toContain("ref=home");
    expect(result).toContain("utm_source=google");
  });

  it("値の前後の空白がトリムされる", () => {
    const result = buildUtmUrl("https://example.com", {
      source: "  google  ",
    });
    expect(result).toContain("utm_source=google");
    expect(result).not.toContain("utm_source=+google+");
  });
});

describe("parseUtmUrl", () => {
  it("UTMパラメータを含むURLを正しく解析する", () => {
    const { baseUrl, params } = parseUtmUrl(
      "https://example.com?utm_source=google&utm_medium=cpc"
    );
    expect(params.source).toBe("google");
    expect(params.medium).toBe("cpc");
    expect(baseUrl).not.toContain("utm_source");
    expect(baseUrl).not.toContain("utm_medium");
  });

  it("全UTMパラメータが解析される", () => {
    const { params } = parseUtmUrl(
      "https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=shoes&utm_content=logo"
    );
    expect(params.source).toBe("google");
    expect(params.medium).toBe("cpc");
    expect(params.campaign).toBe("spring");
    expect(params.term).toBe("shoes");
    expect(params.content).toBe("logo");
  });

  it("UTMパラメータのないURLはemptyなparamsを返す", () => {
    const { params } = parseUtmUrl("https://example.com");
    expect(Object.keys(params)).toHaveLength(0);
  });

  it("非UTMクエリパラメータはベースURLに残る", () => {
    const { baseUrl } = parseUtmUrl(
      "https://example.com?ref=home&utm_source=google"
    );
    expect(baseUrl).toContain("ref=home");
    expect(baseUrl).not.toContain("utm_source");
  });

  it("空文字列はemptyオブジェクトを返す", () => {
    const { baseUrl, params } = parseUtmUrl("");
    expect(baseUrl).toBe("");
    expect(Object.keys(params)).toHaveLength(0);
  });

  it("無効なURLはemptyオブジェクトを返す", () => {
    const { baseUrl, params } = parseUtmUrl("not-a-url");
    expect(baseUrl).toBe("");
    expect(Object.keys(params)).toHaveLength(0);
  });

  it("buildUtmUrlで生成したURLをparseUtmUrlで正しく解析できる", () => {
    const original = {
      source: "newsletter",
      medium: "email",
      campaign: "summer2024",
    };
    const built = buildUtmUrl("https://example.com", original);
    const { params } = parseUtmUrl(built);
    expect(params.source).toBe(original.source);
    expect(params.medium).toBe(original.medium);
    expect(params.campaign).toBe(original.campaign);
  });
});
