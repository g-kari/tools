import { describe, it, expect } from "vitest";
import {
  generateManifestJson,
  generateLinkTag,
  buildManifestObject,
  isValidColor,
  isValidUrl,
  guessIconType,
  createDefaultIcons,
  generateId,
  DEFAULT_MANIFEST_OPTIONS,
  type ManifestOptions,
} from "../../app/utils/webManifest";

/** テスト用のデフォルトオプションを返す */
const makeOptions = (overrides: Partial<ManifestOptions> = {}): ManifestOptions => ({
  ...DEFAULT_MANIFEST_OPTIONS,
  ...overrides,
});

describe("isValidColor", () => {
  it("#RRGGBB 形式は有効", () => {
    expect(isValidColor("#ffffff")).toBe(true);
    expect(isValidColor("#000000")).toBe(true);
    expect(isValidColor("#1a2b3c")).toBe(true);
  });

  it("#RGB 形式は有効", () => {
    expect(isValidColor("#fff")).toBe(true);
    expect(isValidColor("#000")).toBe(true);
    expect(isValidColor("#abc")).toBe(true);
  });

  it("#RRGGBBAA 形式は有効", () => {
    expect(isValidColor("#ffffff80")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidColor("")).toBe(false);
  });

  it("# なしは無効", () => {
    expect(isValidColor("ffffff")).toBe(false);
    expect(isValidColor("fff")).toBe(false);
  });

  it("不正な文字を含む場合は無効", () => {
    expect(isValidColor("#gggggg")).toBe(false);
    expect(isValidColor("#12345")).toBe(false); // 5桁は無効
  });
});

describe("isValidUrl", () => {
  it("相対パスは有効", () => {
    expect(isValidUrl("/")).toBe(true);
    expect(isValidUrl("/app")).toBe(true);
    expect(isValidUrl("/app/start")).toBe(true);
  });

  it("絶対URLは有効", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/app")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidUrl("")).toBe(false);
  });
});

describe("guessIconType", () => {
  it("png拡張子は image/png を返す", () => {
    expect(guessIconType("/icons/icon.png")).toBe("image/png");
    expect(guessIconType("icon-192x192.png")).toBe("image/png");
  });

  it("jpg/jpeg 拡張子は image/jpeg を返す", () => {
    expect(guessIconType("icon.jpg")).toBe("image/jpeg");
    expect(guessIconType("icon.jpeg")).toBe("image/jpeg");
  });

  it("svg 拡張子は image/svg+xml を返す", () => {
    expect(guessIconType("icon.svg")).toBe("image/svg+xml");
  });

  it("webp 拡張子は image/webp を返す", () => {
    expect(guessIconType("icon.webp")).toBe("image/webp");
  });

  it("ico 拡張子は image/x-icon を返す", () => {
    expect(guessIconType("favicon.ico")).toBe("image/x-icon");
  });

  it("不明な拡張子は image/png にフォールバック", () => {
    expect(guessIconType("icon.bmp")).toBe("image/png");
    expect(guessIconType("noextension")).toBe("image/png");
  });
});

describe("generateId", () => {
  it("ユニークなIDを生成する", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it("空でないIDを生成する", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("createDefaultIcons", () => {
  it("3つのアイコンを返す", () => {
    const icons = createDefaultIcons();
    expect(icons.length).toBe(3);
  });

  it("192x192 と 512x512 のアイコンを含む", () => {
    const icons = createDefaultIcons();
    expect(icons.some((i) => i.sizes === "192x192")).toBe(true);
    expect(icons.some((i) => i.sizes === "512x512")).toBe(true);
  });

  it("maskable アイコンを含む", () => {
    const icons = createDefaultIcons();
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("各アイコンにユニークなIDが付与されている", () => {
    const icons = createDefaultIcons();
    const ids = new Set(icons.map((i) => i.id));
    expect(ids.size).toBe(icons.length);
  });
});

describe("buildManifestObject", () => {
  it("必須フィールドを含むオブジェクトを生成する", () => {
    const opts = makeOptions({ name: "Test App", short_name: "Test" });
    const obj = buildManifestObject(opts);
    expect(obj.name).toBe("Test App");
    expect(obj.short_name).toBe("Test");
    expect(obj.start_url).toBe("/");
    expect(obj.display).toBe("standalone");
    expect(obj.theme_color).toBe("#ffffff");
    expect(obj.background_color).toBe("#ffffff");
  });

  it("description が空の場合は含めない", () => {
    const opts = makeOptions({ description: "" });
    const obj = buildManifestObject(opts);
    expect(obj).not.toHaveProperty("description");
  });

  it("description がある場合は含める", () => {
    const opts = makeOptions({ description: "アプリの説明" });
    const obj = buildManifestObject(opts);
    expect(obj.description).toBe("アプリの説明");
  });

  it("orientation が 'any' の場合は含めない", () => {
    const opts = makeOptions({ orientation: "any" });
    const obj = buildManifestObject(opts);
    expect(obj).not.toHaveProperty("orientation");
  });

  it("orientation が 'portrait' の場合は含める", () => {
    const opts = makeOptions({ orientation: "portrait" });
    const obj = buildManifestObject(opts);
    expect(obj.orientation).toBe("portrait");
  });

  it("dir が 'auto' の場合は含めない", () => {
    const opts = makeOptions({ dir: "auto" });
    const obj = buildManifestObject(opts);
    expect(obj).not.toHaveProperty("dir");
  });

  it("dir が 'ltr' の場合は含める", () => {
    const opts = makeOptions({ dir: "ltr" });
    const obj = buildManifestObject(opts);
    expect(obj.dir).toBe("ltr");
  });

  it("categories が空の場合は含めない", () => {
    const opts = makeOptions({ categories: [] });
    const obj = buildManifestObject(opts);
    expect(obj).not.toHaveProperty("categories");
  });

  it("categories がある場合は含める", () => {
    const opts = makeOptions({ categories: ["productivity", "utilities"] });
    const obj = buildManifestObject(opts);
    expect(obj.categories).toEqual(["productivity", "utilities"]);
  });

  it("prefer_related_applications が false の場合は含めない", () => {
    const opts = makeOptions({ prefer_related_applications: false });
    const obj = buildManifestObject(opts);
    expect(obj).not.toHaveProperty("prefer_related_applications");
  });

  it("prefer_related_applications が true の場合は含める", () => {
    const opts = makeOptions({ prefer_related_applications: true });
    const obj = buildManifestObject(opts);
    expect(obj.prefer_related_applications).toBe(true);
  });

  it("アイコンの purpose が 'any' の場合は省略する", () => {
    const opts = makeOptions({
      icons: [
        { id: "1", src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      ],
    });
    const obj = buildManifestObject(opts) as Record<string, unknown>;
    const icons = obj.icons as Array<Record<string, string>>;
    expect(icons[0]).not.toHaveProperty("purpose");
  });

  it("アイコンの purpose が 'maskable' の場合は含める", () => {
    const opts = makeOptions({
      icons: [
        { id: "1", src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    });
    const obj = buildManifestObject(opts) as Record<string, unknown>;
    const icons = obj.icons as Array<Record<string, string>>;
    expect(icons[0].purpose).toBe("maskable");
  });

  it("アイコンのIDフィールドは除外する", () => {
    const opts = makeOptions({
      icons: [
        { id: "test-id", src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      ],
    });
    const obj = buildManifestObject(opts) as Record<string, unknown>;
    const icons = obj.icons as Array<Record<string, string>>;
    expect(icons[0]).not.toHaveProperty("id");
  });
});

describe("generateManifestJson", () => {
  it("有効な JSON 文字列を生成する", () => {
    const opts = makeOptions({ name: "My App", short_name: "App" });
    const json = generateManifestJson(opts);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("インデント付きでフォーマットされる", () => {
    const opts = makeOptions({ name: "My App" });
    const json = generateManifestJson(opts);
    expect(json).toContain("\n");
    expect(json).toContain("  "); // 2スペースインデント
  });

  it("name フィールドを含む", () => {
    const opts = makeOptions({ name: "Awesome App" });
    const json = generateManifestJson(opts);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("Awesome App");
  });

  it("display モードを正しく出力する", () => {
    const opts = makeOptions({ display: "fullscreen" });
    const json = generateManifestJson(opts);
    const parsed = JSON.parse(json);
    expect(parsed.display).toBe("fullscreen");
  });
});

describe("generateLinkTag", () => {
  it("manifest の link タグを含む", () => {
    const opts = makeOptions();
    const html = generateLinkTag(opts);
    expect(html).toContain('<link rel="manifest" href="/manifest.json">');
  });

  it("theme-color メタタグを含む", () => {
    const opts = makeOptions({ theme_color: "#1976d2" });
    const html = generateLinkTag(opts);
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('content="#1976d2"');
  });

  it("apple-mobile-web-app メタタグを含む", () => {
    const opts = makeOptions({ short_name: "App" });
    const html = generateLinkTag(opts);
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('apple-mobile-web-app-title');
  });

  it("アイコンがある場合 apple-touch-icon を含む", () => {
    const opts = makeOptions({
      icons: [
        { id: "1", src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      ],
    });
    const html = generateLinkTag(opts);
    expect(html).toContain('<link rel="apple-touch-icon"');
    expect(html).toContain("/icon-192.png");
  });

  it("maskable アイコンは apple-touch-icon として使わない", () => {
    const opts = makeOptions({
      icons: [
        { id: "1", src: "/icon-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      ],
    });
    const html = generateLinkTag(opts);
    expect(html).not.toContain("/icon-maskable.png");
  });
});
