import { describe, it, expect } from "vitest";
import {
  isValidSitemapUrl,
  isValidPriority,
  normalizeDate,
  escapeXml,
  generateSitemapXml,
  formatPriority,
} from "../../app/utils/sitemap";

describe("isValidSitemapUrl", () => {
  it("有効なhttpsのURLを受け入れる", () => {
    expect(isValidSitemapUrl("https://example.com")).toBe(true);
  });

  it("有効なhttpのURLを受け入れる", () => {
    expect(isValidSitemapUrl("http://example.com")).toBe(true);
  });

  it("パスを含むURLを受け入れる", () => {
    expect(isValidSitemapUrl("https://example.com/path/to/page")).toBe(true);
  });

  it("クエリパラメータを含むURLを受け入れる", () => {
    expect(isValidSitemapUrl("https://example.com?foo=bar")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidSitemapUrl("")).toBe(false);
  });

  it("プロトコルなしのURLは無効", () => {
    expect(isValidSitemapUrl("example.com")).toBe(false);
  });

  it("ftpプロトコルは無効", () => {
    expect(isValidSitemapUrl("ftp://example.com")).toBe(false);
  });

  it("ランダムな文字列は無効", () => {
    expect(isValidSitemapUrl("not-a-url")).toBe(false);
  });
});

describe("isValidPriority", () => {
  it("0.0は有効", () => {
    expect(isValidPriority(0.0)).toBe(true);
  });

  it("1.0は有効", () => {
    expect(isValidPriority(1.0)).toBe(true);
  });

  it("0.5は有効", () => {
    expect(isValidPriority(0.5)).toBe(true);
  });

  it("負の値は無効", () => {
    expect(isValidPriority(-0.1)).toBe(false);
  });

  it("1.0より大きい値は無効", () => {
    expect(isValidPriority(1.1)).toBe(false);
  });
});

describe("normalizeDate", () => {
  it("ISO 8601形式の日付をYYYY-MM-DDに変換する", () => {
    expect(normalizeDate("2024-01-15")).toBe("2024-01-15");
  });

  it("空文字列は空文字列を返す", () => {
    expect(normalizeDate("")).toBe("");
  });

  it("無効な日付は空文字列を返す", () => {
    expect(normalizeDate("not-a-date")).toBe("");
  });

  it("スペースのみは空文字列を返す", () => {
    expect(normalizeDate("   ")).toBe("");
  });
});

describe("escapeXml", () => {
  it("&をエスケープする", () => {
    expect(escapeXml("a&b")).toBe("a&amp;b");
  });

  it("<をエスケープする", () => {
    expect(escapeXml("a<b")).toBe("a&lt;b");
  });

  it(">をエスケープする", () => {
    expect(escapeXml("a>b")).toBe("a&gt;b");
  });

  it('"をエスケープする', () => {
    expect(escapeXml('a"b')).toBe("a&quot;b");
  });

  it("'をエスケープする", () => {
    expect(escapeXml("a'b")).toBe("a&apos;b");
  });

  it("エスケープ不要な文字はそのまま返す", () => {
    expect(escapeXml("https://example.com/page")).toBe(
      "https://example.com/page"
    );
  });

  it("複数の特殊文字を含む文字列をエスケープする", () => {
    expect(escapeXml("<tag attr='val\"ue'>content & more</tag>")).toBe(
      "&lt;tag attr=&apos;val&quot;ue&apos;&gt;content &amp; more&lt;/tag&gt;"
    );
  });
});

describe("generateSitemapXml", () => {
  it("XMLヘッダーとurlsetを含む", () => {
    const xml = generateSitemapXml([{ loc: "https://example.com/" }]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
    expect(xml).toContain("</urlset>");
  });

  it("URLエントリを含む", () => {
    const xml = generateSitemapXml([{ loc: "https://example.com/page" }]);
    expect(xml).toContain("<url>");
    expect(xml).toContain("<loc>https://example.com/page</loc>");
    expect(xml).toContain("</url>");
  });

  it("lastmodを含む", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/", lastmod: "2024-01-15" },
    ]);
    expect(xml).toContain("<lastmod>2024-01-15</lastmod>");
  });

  it("changefreqを含む", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/", changefreq: "weekly" },
    ]);
    expect(xml).toContain("<changefreq>weekly</changefreq>");
  });

  it("priorityを含む", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/", priority: 0.8 },
    ]);
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("全フィールドを含むエントリを生成する", () => {
    const xml = generateSitemapXml([
      {
        loc: "https://example.com/",
        lastmod: "2024-03-01",
        changefreq: "daily",
        priority: 1.0,
      },
    ]);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<lastmod>2024-03-01</lastmod>");
    expect(xml).toContain("<changefreq>daily</changefreq>");
    expect(xml).toContain("<priority>1.0</priority>");
  });

  it("複数エントリを生成する", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/" },
      { loc: "https://example.com/about" },
      { loc: "https://example.com/contact" },
    ]);
    expect(xml).toContain("https://example.com/");
    expect(xml).toContain("https://example.com/about");
    expect(xml).toContain("https://example.com/contact");
  });

  it("無効なURLエントリはスキップする", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/" },
      { loc: "not-a-url" },
    ]);
    expect(xml).toContain("https://example.com/");
    expect(xml).not.toContain("not-a-url");
  });

  it("空のエントリ配列でもXML構造を返す", () => {
    const xml = generateSitemapXml([]);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
    expect(xml).not.toContain("<url>");
  });

  it("URLに含まれる&をエスケープする", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/?a=1&b=2" },
    ]);
    expect(xml).toContain("&amp;");
    expect(xml).not.toContain("&b=");
  });

  it("優先度0.0を正しく出力する", () => {
    const xml = generateSitemapXml([
      { loc: "https://example.com/", priority: 0.0 },
    ]);
    expect(xml).toContain("<priority>0.0</priority>");
  });
});

describe("formatPriority", () => {
  it("0.5を'0.5'に変換する", () => {
    expect(formatPriority(0.5)).toBe("0.5");
  });

  it("1.0を'1.0'に変換する", () => {
    expect(formatPriority(1.0)).toBe("1.0");
  });

  it("0.0を'0.0'に変換する", () => {
    expect(formatPriority(0.0)).toBe("0.0");
  });
});
