import { describe, it, expect } from "vite-plus/test";
import {
  generateRuleBlock,
  generateRobotsTxt,
  isValidPath,
  isValidSitemapUrl,
  createAllowAllPreset,
  createBlockAllPreset,
  createWordPressPreset,
  generateId,
  type CrawlerRule,
} from "../../app/utils/robots-txt";

const makeRule = (overrides: Partial<CrawlerRule> = {}): CrawlerRule => ({
  id: "test",
  userAgent: "*",
  allow: [],
  disallow: [],
  crawlDelay: null,
  ...overrides,
});

describe("isValidPath", () => {
  it("空文字列は有効", () => {
    expect(isValidPath("")).toBe(true);
  });

  it('"*" は有効', () => {
    expect(isValidPath("*")).toBe(true);
  });

  it('"/" で始まるパスは有効', () => {
    expect(isValidPath("/admin")).toBe(true);
    expect(isValidPath("/admin/")).toBe(true);
    expect(isValidPath("/")).toBe(true);
  });

  it('"/" で始まらないパスは無効', () => {
    expect(isValidPath("admin")).toBe(false);
    expect(isValidPath("admin/")).toBe(false);
  });
});

describe("isValidSitemapUrl", () => {
  it("http URL は有効", () => {
    expect(isValidSitemapUrl("http://example.com/sitemap.xml")).toBe(true);
  });

  it("https URL は有効", () => {
    expect(isValidSitemapUrl("https://example.com/sitemap.xml")).toBe(true);
  });

  it("不正な URL は無効", () => {
    expect(isValidSitemapUrl("not-a-url")).toBe(false);
    expect(isValidSitemapUrl("ftp://example.com/sitemap.xml")).toBe(false);
    expect(isValidSitemapUrl("")).toBe(false);
  });
});

describe("generateRuleBlock", () => {
  it("基本的なルールを生成する", () => {
    const rule = makeRule({ userAgent: "*" });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: *");
  });

  it("Disallow パスを含むルールを生成する", () => {
    const rule = makeRule({ disallow: ["/admin/"] });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: *\nDisallow: /admin/");
  });

  it("Allow パスを含むルールを生成する", () => {
    const rule = makeRule({ allow: ["/public/"] });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: *\nAllow: /public/");
  });

  it("Allow と Disallow の両方を含むルールを生成する（Allow が先）", () => {
    const rule = makeRule({
      userAgent: "Googlebot",
      allow: ["/public/"],
      disallow: ["/private/"],
    });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: Googlebot\nAllow: /public/\nDisallow: /private/");
  });

  it("Crawl-delay を含むルールを生成する", () => {
    const rule = makeRule({ crawlDelay: 10 });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: *\nCrawl-delay: 10");
  });

  it("Crawl-delay が null の場合は含まない", () => {
    const rule = makeRule({ crawlDelay: null });
    const result = generateRuleBlock(rule);
    expect(result).not.toContain("Crawl-delay");
  });

  it("Crawl-delay が 0 以下の場合は含まない", () => {
    const rule = makeRule({ crawlDelay: 0 });
    const result = generateRuleBlock(rule);
    expect(result).not.toContain("Crawl-delay");
  });

  it("空のパスはスキップする", () => {
    const rule = makeRule({ allow: ["", "/ok/", ""], disallow: [""] });
    const result = generateRuleBlock(rule);
    expect(result).toBe("User-agent: *\nAllow: /ok/");
  });

  it("userAgent が空の場合は * を使用する", () => {
    const rule = makeRule({ userAgent: "" });
    const result = generateRuleBlock(rule);
    expect(result).toContain("User-agent: *");
  });
});

describe("generateRobotsTxt", () => {
  it("単一ルールの robots.txt を生成する", () => {
    const result = generateRobotsTxt({
      rules: [makeRule({ disallow: ["/admin/"] })],
      sitemaps: [],
    });
    expect(result).toBe("User-agent: *\nDisallow: /admin/");
  });

  it("複数ルールをブロック区切りで生成する", () => {
    const result = generateRobotsTxt({
      rules: [
        makeRule({ userAgent: "*", disallow: ["/admin/"] }),
        makeRule({ id: "test2", userAgent: "Googlebot", allow: ["/"] }),
      ],
      sitemaps: [],
    });
    expect(result).toBe("User-agent: *\nDisallow: /admin/\n\nUser-agent: Googlebot\nAllow: /");
  });

  it("Sitemap を含む robots.txt を生成する", () => {
    const result = generateRobotsTxt({
      rules: [makeRule()],
      sitemaps: ["https://example.com/sitemap.xml"],
    });
    expect(result).toBe("User-agent: *\n\nSitemap: https://example.com/sitemap.xml");
  });

  it("無効なサイトマップ URL はスキップする", () => {
    const result = generateRobotsTxt({
      rules: [makeRule()],
      sitemaps: ["not-a-url", "https://example.com/sitemap.xml"],
    });
    expect(result).not.toContain("not-a-url");
    expect(result).toContain("https://example.com/sitemap.xml");
  });

  it("全許可プリセットは空の Disallow を生成する", () => {
    const preset = createAllowAllPreset();
    const result = generateRobotsTxt(preset);
    expect(result).toBe("User-agent: *");
    expect(result).not.toContain("Disallow");
  });

  it("全拒否プリセットは Disallow: / を生成する", () => {
    const preset = createBlockAllPreset();
    const result = generateRobotsTxt(preset);
    expect(result).toContain("User-agent: *");
    expect(result).toContain("Disallow: /");
  });

  it("WordPress プリセットは主要なディレクティブを含む", () => {
    const preset = createWordPressPreset();
    const result = generateRobotsTxt(preset);
    expect(result).toContain("Disallow: /wp-admin/");
    expect(result).toContain("Allow: /wp-content/uploads/");
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});

describe("generateId", () => {
  it("空でない文字列を返す", () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it("呼ぶたびに異なるIDを返す", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });
});
