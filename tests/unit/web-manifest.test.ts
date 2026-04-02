import { describe, it, expect } from "vitest";
import {
  DEFAULT_MANIFEST_OPTIONS,
  DISPLAY_MODES,
  ORIENTATIONS,
  COMMON_ICON_SIZES,
  COMMON_CATEGORIES,
  generateId,
  createDefaultIcons,
  isValidColor,
  isValidUrl,
  guessIconType,
  buildManifestObject,
  generateManifestJson,
  generateLinkTag,
  type ManifestOptions,
  type ManifestIcon,
} from "../../app/utils/webManifest";

describe("DEFAULT_MANIFEST_OPTIONS", () => {
  it("デフォルト値が正しく定義されている", () => {
    expect(DEFAULT_MANIFEST_OPTIONS.name).toBe("My App");
    expect(DEFAULT_MANIFEST_OPTIONS.short_name).toBe("App");
    expect(DEFAULT_MANIFEST_OPTIONS.start_url).toBe("/");
    expect(DEFAULT_MANIFEST_OPTIONS.scope).toBe("/");
    expect(DEFAULT_MANIFEST_OPTIONS.display).toBe("standalone");
    expect(DEFAULT_MANIFEST_OPTIONS.orientation).toBe("any");
    expect(DEFAULT_MANIFEST_OPTIONS.theme_color).toBe("#ffffff");
    expect(DEFAULT_MANIFEST_OPTIONS.background_color).toBe("#ffffff");
    expect(DEFAULT_MANIFEST_OPTIONS.lang).toBe("ja");
    expect(DEFAULT_MANIFEST_OPTIONS.dir).toBe("auto");
    expect(DEFAULT_MANIFEST_OPTIONS.categories).toEqual([]);
    expect(DEFAULT_MANIFEST_OPTIONS.icons).toEqual([]);
    expect(DEFAULT_MANIFEST_OPTIONS.screenshots).toEqual([]);
    expect(DEFAULT_MANIFEST_OPTIONS.prefer_related_applications).toBe(false);
  });
});

describe("DISPLAY_MODES", () => {
  it("4種類のディスプレイモードが含まれる", () => {
    const values = DISPLAY_MODES.map((m) => m.value);
    expect(values).toContain("standalone");
    expect(values).toContain("fullscreen");
    expect(values).toContain("minimal-ui");
    expect(values).toContain("browser");
    expect(DISPLAY_MODES).toHaveLength(4);
  });

  it("各モードにvalue・label・descriptionがある", () => {
    for (const mode of DISPLAY_MODES) {
      expect(mode.value).toBeTruthy();
      expect(mode.label).toBeTruthy();
      expect(mode.description).toBeTruthy();
    }
  });
});

describe("ORIENTATIONS", () => {
  it("anyを含む複数のオリエンテーションが定義されている", () => {
    const values = ORIENTATIONS.map((o) => o.value);
    expect(values).toContain("any");
    expect(values).toContain("portrait");
    expect(values).toContain("landscape");
    expect(ORIENTATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it("各オリエンテーションにvalue・labelがある", () => {
    for (const orientation of ORIENTATIONS) {
      expect(orientation.value).toBeTruthy();
      expect(orientation.label).toBeTruthy();
    }
  });
});

describe("COMMON_ICON_SIZES", () => {
  it("192x192と512x512を含む", () => {
    expect(COMMON_ICON_SIZES).toContain("192x192");
    expect(COMMON_ICON_SIZES).toContain("512x512");
  });

  it("NxN形式の文字列リスト", () => {
    for (const size of COMMON_ICON_SIZES) {
      expect(size).toMatch(/^\d+x\d+$/);
    }
  });
});

describe("COMMON_CATEGORIES", () => {
  it("代表的なカテゴリが含まれる", () => {
    expect(COMMON_CATEGORIES).toContain("business");
    expect(COMMON_CATEGORIES).toContain("education");
    expect(COMMON_CATEGORIES).toContain("utilities");
  });

  it("文字列の配列である", () => {
    for (const cat of COMMON_CATEGORIES) {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    }
  });
});

describe("generateId", () => {
  it("文字列を返す", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("空でない文字列を返す", () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it("呼び出すたびに異なるIDを返す（高確率）", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBeGreaterThan(15);
  });
});

describe("createDefaultIcons", () => {
  it("3件のアイコンを返す", () => {
    const icons = createDefaultIcons();
    expect(icons).toHaveLength(3);
  });

  it("各アイコンにid・src・sizes・type・purposeがある", () => {
    for (const icon of createDefaultIcons()) {
      expect(icon.id).toBeTruthy();
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toBeTruthy();
      expect(icon.type).toBeTruthy();
      expect(icon.purpose).toBeTruthy();
    }
  });

  it("192x192と512x512のアイコンが含まれる", () => {
    const icons = createDefaultIcons();
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("maskableアイコンが含まれる", () => {
    const icons = createDefaultIcons();
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("呼び出すたびに異なるIDが付与される", () => {
    const icons1 = createDefaultIcons();
    const icons2 = createDefaultIcons();
    const ids1 = icons1.map((i) => i.id);
    const ids2 = icons2.map((i) => i.id);
    expect(ids1).not.toEqual(ids2);
  });
});

describe("isValidColor", () => {
  it("#RGB形式を有効と判定する", () => {
    expect(isValidColor("#fff")).toBe(true);
    expect(isValidColor("#000")).toBe(true);
    expect(isValidColor("#1aB")).toBe(true);
  });

  it("#RRGGBB形式を有効と判定する", () => {
    expect(isValidColor("#ffffff")).toBe(true);
    expect(isValidColor("#000000")).toBe(true);
    expect(isValidColor("#1a2b3c")).toBe(true);
    expect(isValidColor("#AABBCC")).toBe(true);
  });

  it("#RRGGBBAA形式（8桁）を有効と判定する", () => {
    expect(isValidColor("#ffffff80")).toBe(true);
    expect(isValidColor("#00000000")).toBe(true);
  });

  it("無効な形式はfalseを返す", () => {
    expect(isValidColor("")).toBe(false);
    expect(isValidColor("fff")).toBe(false);
    expect(isValidColor("ffffff")).toBe(false);
    expect(isValidColor("#gg0000")).toBe(false);
    expect(isValidColor("#12345")).toBe(false);
    expect(isValidColor("#1234567")).toBe(false);
    expect(isValidColor("red")).toBe(false);
    expect(isValidColor("rgb(255,0,0)")).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("絶対URLを有効と判定する", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("相対URLを有効と判定する", () => {
    expect(isValidUrl("/")).toBe(true);
    expect(isValidUrl("/app")).toBe(true);
    expect(isValidUrl("./icons/icon.png")).toBe(true);
  });

  it("空文字列はfalseを返す", () => {
    expect(isValidUrl("")).toBe(false);
  });
});

describe("guessIconType", () => {
  it("pngをimage/pngに変換する", () => {
    expect(guessIconType("/icons/icon.png")).toBe("image/png");
  });

  it("jpgをimage/jpegに変換する", () => {
    expect(guessIconType("/icons/icon.jpg")).toBe("image/jpeg");
  });

  it("jpegをimage/jpegに変換する", () => {
    expect(guessIconType("/icons/icon.jpeg")).toBe("image/jpeg");
  });

  it("svgをimage/svg+xmlに変換する", () => {
    expect(guessIconType("/icons/icon.svg")).toBe("image/svg+xml");
  });

  it("webpをimage/webpに変換する", () => {
    expect(guessIconType("/icons/icon.webp")).toBe("image/webp");
  });

  it("icoをimage/x-iconに変換する", () => {
    expect(guessIconType("/icons/favicon.ico")).toBe("image/x-icon");
  });

  it("大文字拡張子も正しく変換する", () => {
    expect(guessIconType("/icons/icon.PNG")).toBe("image/png");
    expect(guessIconType("/icons/icon.JPG")).toBe("image/jpeg");
  });

  it("不明な拡張子はimage/pngにフォールバック", () => {
    expect(guessIconType("/icons/icon.bmp")).toBe("image/png");
    expect(guessIconType("/icons/icon")).toBe("image/png");
  });
});

describe("buildManifestObject", () => {
  const baseOptions: ManifestOptions = {
    ...DEFAULT_MANIFEST_OPTIONS,
    name: "Test App",
    short_name: "Test",
  };

  it("必須フィールドを含むオブジェクトを生成する", () => {
    const result = buildManifestObject(baseOptions);
    expect(result.name).toBe("Test App");
    expect(result.short_name).toBe("Test");
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.theme_color).toBe("#ffffff");
    expect(result.background_color).toBe("#ffffff");
  });

  it("descriptionが空の場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, description: "" });
    expect(result).not.toHaveProperty("description");
  });

  it("descriptionがある場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, description: "説明文" });
    expect(result.description).toBe("説明文");
  });

  it("orientationがanyの場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, orientation: "any" });
    expect(result).not.toHaveProperty("orientation");
  });

  it("orientationがany以外の場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, orientation: "portrait" });
    expect(result.orientation).toBe("portrait");
  });

  it("langが設定されている場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, lang: "ja" });
    expect(result.lang).toBe("ja");
  });

  it("dirがautoの場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, dir: "auto" });
    expect(result).not.toHaveProperty("dir");
  });

  it("dirがltrの場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, dir: "ltr" });
    expect(result.dir).toBe("ltr");
  });

  it("categoriesが空の場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, categories: [] });
    expect(result).not.toHaveProperty("categories");
  });

  it("categoriesがある場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, categories: ["utilities"] });
    expect(result.categories).toEqual(["utilities"]);
  });

  it("iconsが空の場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, icons: [] });
    expect(result).not.toHaveProperty("icons");
  });

  it("iconsのidフィールドを除外してマッピングする", () => {
    const icons: ManifestIcon[] = [
      { id: "test-id", src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect(resultIcons[0]).not.toHaveProperty("id");
    expect(resultIcons[0].src).toBe("/icon.png");
    expect(resultIcons[0].sizes).toBe("192x192");
    expect(resultIcons[0].type).toBe("image/png");
  });

  it("purposeがanyのアイコンはpurposeフィールドを含まない", () => {
    const icons: ManifestIcon[] = [
      { id: "id1", src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect(resultIcons[0]).not.toHaveProperty("purpose");
  });

  it("purposeがmaskableのアイコンはpurposeフィールドを含む", () => {
    const icons: ManifestIcon[] = [
      { id: "id1", src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect(resultIcons[0].purpose).toBe("maskable");
  });

  it("screenshotsが空の場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, screenshots: [] });
    expect(result).not.toHaveProperty("screenshots");
  });

  it("screenshotsがある場合はidを除外してマッピングする", () => {
    const screenshots = [
      { id: "ss-id", src: "/ss.png", sizes: "1280x720", type: "image/png", form_factor: "wide" as const, label: "ホーム画面" },
    ];
    const result = buildManifestObject({ ...baseOptions, screenshots });
    const resultSs = result.screenshots as Record<string, string>[];
    expect(resultSs[0]).not.toHaveProperty("id");
    expect(resultSs[0].src).toBe("/ss.png");
    expect(resultSs[0].form_factor).toBe("wide");
    expect(resultSs[0].label).toBe("ホーム画面");
  });

  it("prefer_related_applicationsがfalseの場合はフィールドを含まない", () => {
    const result = buildManifestObject({ ...baseOptions, prefer_related_applications: false });
    expect(result).not.toHaveProperty("prefer_related_applications");
  });

  it("prefer_related_applicationsがtrueの場合はフィールドを含む", () => {
    const result = buildManifestObject({ ...baseOptions, prefer_related_applications: true });
    expect(result.prefer_related_applications).toBe(true);
  });
});

describe("generateManifestJson", () => {
  it("有効なJSON文字列を返す", () => {
    const json = generateManifestJson(DEFAULT_MANIFEST_OPTIONS);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("インデント付きのJSONを返す", () => {
    const json = generateManifestJson(DEFAULT_MANIFEST_OPTIONS);
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });

  it("必須フィールドを含むJSONを返す", () => {
    const options: ManifestOptions = { ...DEFAULT_MANIFEST_OPTIONS, name: "My PWA" };
    const json = generateManifestJson(options);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe("My PWA");
    expect(parsed.display).toBe("standalone");
  });
});

describe("generateLinkTag", () => {
  it("manifest.jsonへのlinkタグを含む", () => {
    const result = generateLinkTag(DEFAULT_MANIFEST_OPTIONS);
    expect(result).toContain('<link rel="manifest" href="/manifest.json">');
  });

  it("theme-colorのmetaタグを含む", () => {
    const options: ManifestOptions = { ...DEFAULT_MANIFEST_OPTIONS, theme_color: "#1234ab" };
    const result = generateLinkTag(options);
    expect(result).toContain('<meta name="theme-color" content="#1234ab">');
  });

  it("apple-mobile-web-app関連のmetaタグを含む", () => {
    const result = generateLinkTag(DEFAULT_MANIFEST_OPTIONS);
    expect(result).toContain("apple-mobile-web-app-capable");
    expect(result).toContain("apple-mobile-web-app-title");
  });

  it("short_nameをapple-mobile-web-app-titleに使用する", () => {
    const options: ManifestOptions = { ...DEFAULT_MANIFEST_OPTIONS, name: "Long Name", short_name: "Short" };
    const result = generateLinkTag(options);
    expect(result).toContain('content="Short"');
  });

  it("アイコンがない場合はapple-touch-iconタグを含まない", () => {
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons: [] });
    expect(result).not.toContain("apple-touch-icon");
  });

  it("PNG・非maskableアイコンがある場合はapple-touch-iconタグを含む", () => {
    const icons: ManifestIcon[] = [
      { id: "id1", src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { id: "id2", src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ];
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons });
    expect(result).toContain('rel="apple-touch-icon"');
    expect(result).toContain('href="/icon-512.png"');
  });

  it("maskableアイコンのみの場合はapple-touch-iconタグを含まない", () => {
    const icons: ManifestIcon[] = [
      { id: "id1", src: "/maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ];
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons });
    expect(result).not.toContain("apple-touch-icon");
  });

  it("複数行のタグを改行で結合して返す", () => {
    const result = generateLinkTag(DEFAULT_MANIFEST_OPTIONS);
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });
});
