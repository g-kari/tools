import { describe, expect, it } from "vite-plus/test";
import {
  OGP_TYPES,
  TWITTER_CARD_TYPES,
  OGP_INPUT_DEFAULTS,
  escapeHtmlAttribute,
  generateMetaTag,
  generateTwitterTag,
  generateOgpTags,
  isValidUrl,
  validateOgpInput,
  type OgpInput,
} from "../../app/utils/ogp-generator";

describe("OGP_TYPES", () => {
  it("website が含まれている", () => {
    expect(OGP_TYPES).toContain("website");
  });

  it("article が含まれている", () => {
    expect(OGP_TYPES).toContain("article");
  });

  it("12種類のタイプが定義されている", () => {
    expect(OGP_TYPES.length).toBe(12);
  });
});

describe("TWITTER_CARD_TYPES", () => {
  it("summary が含まれている", () => {
    expect(TWITTER_CARD_TYPES).toContain("summary");
  });

  it("summary_large_image が含まれている", () => {
    expect(TWITTER_CARD_TYPES).toContain("summary_large_image");
  });

  it("4種類のタイプが定義されている", () => {
    expect(TWITTER_CARD_TYPES.length).toBe(4);
  });
});

describe("OGP_INPUT_DEFAULTS", () => {
  it("type が website に設定されている", () => {
    expect(OGP_INPUT_DEFAULTS.type).toBe("website");
  });

  it("locale が ja_JP に設定されている", () => {
    expect(OGP_INPUT_DEFAULTS.locale).toBe("ja_JP");
  });

  it("enableTwitterCard が true に設定されている", () => {
    expect(OGP_INPUT_DEFAULTS.enableTwitterCard).toBe(true);
  });

  it("twitterCard が summary_large_image に設定されている", () => {
    expect(OGP_INPUT_DEFAULTS.twitterCard).toBe("summary_large_image");
  });
});

describe("escapeHtmlAttribute", () => {
  it("& を &amp; にエスケープする", () => {
    expect(escapeHtmlAttribute("A&B")).toBe("A&amp;B");
  });

  it('" を &quot; にエスケープする', () => {
    expect(escapeHtmlAttribute('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("< を &lt; にエスケープする", () => {
    expect(escapeHtmlAttribute("<script>")).toBe("&lt;script&gt;");
  });

  it("> を &gt; にエスケープする", () => {
    expect(escapeHtmlAttribute("a>b")).toBe("a&gt;b");
  });

  it("エスケープ不要な文字はそのまま返す", () => {
    expect(escapeHtmlAttribute("Hello World")).toBe("Hello World");
  });

  it("空文字列は空文字列を返す", () => {
    expect(escapeHtmlAttribute("")).toBe("");
  });

  it("複数の特殊文字を同時にエスケープする", () => {
    expect(escapeHtmlAttribute('<a href="x&y">test</a>')).toBe(
      "&lt;a href=&quot;x&amp;y&quot;&gt;test&lt;/a&gt;"
    );
  });
});

describe("generateMetaTag", () => {
  it("og:title のメタタグを生成する", () => {
    expect(generateMetaTag("og:title", "Hello")).toBe(
      '<meta property="og:title" content="Hello" />'
    );
  });

  it("特殊文字をエスケープする", () => {
    expect(generateMetaTag("og:title", 'Title & "Quote"')).toBe(
      '<meta property="og:title" content="Title &amp; &quot;Quote&quot;" />'
    );
  });

  it("og:type のメタタグを生成する", () => {
    expect(generateMetaTag("og:type", "website")).toBe(
      '<meta property="og:type" content="website" />'
    );
  });
});

describe("generateTwitterTag", () => {
  it("twitter:card のメタタグを生成する", () => {
    expect(generateTwitterTag("twitter:card", "summary")).toBe(
      '<meta name="twitter:card" content="summary" />'
    );
  });

  it("name 属性を使用する（property ではなく）", () => {
    const tag = generateTwitterTag("twitter:title", "Test");
    expect(tag).toContain('name="twitter:title"');
    expect(tag).not.toContain('property="');
  });

  it("特殊文字をエスケープする", () => {
    expect(generateTwitterTag("twitter:description", "A & B")).toBe(
      '<meta name="twitter:description" content="A &amp; B" />'
    );
  });
});

describe("isValidUrl", () => {
  it("空文字列は有効とみなす", () => {
    expect(isValidUrl("")).toBe(true);
  });

  it("https:// の URL は有効", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("http:// の URL は有効", () => {
    expect(isValidUrl("http://example.com/page")).toBe(true);
  });

  it("無効な URL は false を返す", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("ftp:// の URL は false を返す", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("クエリパラメータ付きの URL は有効", () => {
    expect(isValidUrl("https://example.com/page?q=test&lang=ja")).toBe(true);
  });

  it("パスとフラグメント付きの URL は有効", () => {
    expect(isValidUrl("https://example.com/path/to/page#section")).toBe(true);
  });
});

describe("generateOgpTags", () => {
  const baseInput: OgpInput = {
    title: "テストページ",
    description: "テストの説明文",
    url: "https://example.com",
    imageUrl: "https://example.com/image.png",
    type: "website",
    siteName: "テストサイト",
    locale: "ja_JP",
    twitterCard: "summary_large_image",
    twitterSite: "",
    twitterCreator: "",
    enableTwitterCard: false,
  };

  it("title が含まれる場合 og:title タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain('<meta property="og:title" content="テストページ" />');
  });

  it("description が含まれる場合 og:description タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain(
      '<meta property="og:description" content="テストの説明文" />'
    );
  });

  it("url が含まれる場合 og:url タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain(
      '<meta property="og:url" content="https://example.com" />'
    );
  });

  it("imageUrl が含まれる場合 og:image タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain(
      '<meta property="og:image" content="https://example.com/image.png" />'
    );
  });

  it("type が含まれる場合 og:type タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain('<meta property="og:type" content="website" />');
  });

  it("siteName が含まれる場合 og:site_name タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain(
      '<meta property="og:site_name" content="テストサイト" />'
    );
  });

  it("locale が含まれる場合 og:locale タグを生成する", () => {
    const result = generateOgpTags(baseInput);
    expect(result).toContain('<meta property="og:locale" content="ja_JP" />');
  });

  it("type と locale のデフォルト値のみ出力される（他フィールドが空の場合）", () => {
    const input: OgpInput = {
      ...OGP_INPUT_DEFAULTS,
      enableTwitterCard: false,
    };
    const result = generateOgpTags(input);
    expect(result).toContain("og:type");
    expect(result).toContain("og:locale");
    expect(result).not.toContain("og:title");
    expect(result).not.toContain("og:description");
  });

  it("enableTwitterCard が false の場合 twitter タグを生成しない", () => {
    const result = generateOgpTags({ ...baseInput, enableTwitterCard: false });
    expect(result).not.toContain("twitter:");
  });

  it("enableTwitterCard が true の場合 twitter:card タグを生成する", () => {
    const result = generateOgpTags({ ...baseInput, enableTwitterCard: true });
    expect(result).toContain('<meta name="twitter:card"');
  });

  it("twitterSite が @ なしで渡された場合 @ を付加する", () => {
    const result = generateOgpTags({
      ...baseInput,
      enableTwitterCard: true,
      twitterSite: "example",
    });
    expect(result).toContain('content="@example"');
  });

  it("twitterSite が @ 付きで渡された場合そのまま使用する", () => {
    const result = generateOgpTags({
      ...baseInput,
      enableTwitterCard: true,
      twitterSite: "@example",
    });
    expect(result).toContain('content="@example"');
    expect(result).not.toContain('content="@@example"');
  });

  it("twitterCreator が @ なしで渡された場合 @ を付加する", () => {
    const result = generateOgpTags({
      ...baseInput,
      enableTwitterCard: true,
      twitterCreator: "creator",
    });
    expect(result).toContain('content="@creator"');
  });

  it("全フィールド入力時に og と twitter 両方のタグを生成する", () => {
    const fullInput: OgpInput = {
      title: "完全なページ",
      description: "完全な説明",
      url: "https://example.com/page",
      imageUrl: "https://example.com/ogp.png",
      type: "article",
      siteName: "My Site",
      locale: "ja_JP",
      twitterCard: "summary_large_image",
      twitterSite: "@mysite",
      twitterCreator: "@author",
      enableTwitterCard: true,
    };
    const result = generateOgpTags(fullInput);
    expect(result).toContain("og:title");
    expect(result).toContain("og:description");
    expect(result).toContain("og:url");
    expect(result).toContain("og:image");
    expect(result).toContain("og:type");
    expect(result).toContain("og:site_name");
    expect(result).toContain("og:locale");
    expect(result).toContain("twitter:card");
    expect(result).toContain("twitter:title");
    expect(result).toContain("twitter:description");
    expect(result).toContain("twitter:image");
    expect(result).toContain("twitter:site");
    expect(result).toContain("twitter:creator");
  });
});

describe("validateOgpInput", () => {
  const validInput: OgpInput = {
    ...OGP_INPUT_DEFAULTS,
    url: "https://example.com",
    imageUrl: "https://example.com/image.png",
    title: "Valid Title",
    description: "Valid description",
  };

  it("有効な入力に対してエラーなしを返す", () => {
    const result = validateOgpInput(validInput);
    expect(result.isUrlValid).toBe(true);
    expect(result.isImageUrlValid).toBe(true);
    expect(result.isTitleTooLong).toBe(false);
    expect(result.isDescriptionTooLong).toBe(false);
  });

  it("無効な URL に対して isUrlValid が false になる", () => {
    const result = validateOgpInput({ ...validInput, url: "not-a-url" });
    expect(result.isUrlValid).toBe(false);
  });

  it("無効な画像 URL に対して isImageUrlValid が false になる", () => {
    const result = validateOgpInput({ ...validInput, imageUrl: "bad-url" });
    expect(result.isImageUrlValid).toBe(false);
  });

  it("101文字のタイトルに対して isTitleTooLong が true になる", () => {
    const result = validateOgpInput({
      ...validInput,
      title: "a".repeat(101),
    });
    expect(result.isTitleTooLong).toBe(true);
  });

  it("100文字のタイトルは警告なし", () => {
    const result = validateOgpInput({
      ...validInput,
      title: "a".repeat(100),
    });
    expect(result.isTitleTooLong).toBe(false);
  });

  it("301文字の説明文に対して isDescriptionTooLong が true になる", () => {
    const result = validateOgpInput({
      ...validInput,
      description: "a".repeat(301),
    });
    expect(result.isDescriptionTooLong).toBe(true);
  });

  it("300文字の説明文は警告なし", () => {
    const result = validateOgpInput({
      ...validInput,
      description: "a".repeat(300),
    });
    expect(result.isDescriptionTooLong).toBe(false);
  });

  it("空の URL は有効とみなす", () => {
    const result = validateOgpInput({ ...validInput, url: "" });
    expect(result.isUrlValid).toBe(true);
  });
});
