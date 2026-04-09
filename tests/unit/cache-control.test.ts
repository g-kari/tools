import { describe, it, expect } from "vite-plus/test";
import {
  parseCacheControl,
  buildCacheControl,
  validateCacheControl,
  formatSeconds,
  findResponseDirectiveInfo,
  findRequestDirectiveInfo,
  RESPONSE_DIRECTIVES,
  REQUEST_DIRECTIVES,
  RESPONSE_PRESETS,
  type CacheControlDirectiveEntry,
} from "../../app/utils/cache-control";

describe("findResponseDirectiveInfo", () => {
  it("既知のディレクティブ名を返す", () => {
    const info = findResponseDirectiveInfo("max-age");
    expect(info).toBeDefined();
    expect(info!.name).toBe("max-age");
  });

  it("大文字小文字を無視する", () => {
    const info = findResponseDirectiveInfo("NO-STORE");
    expect(info).toBeDefined();
    expect(info!.name).toBe("no-store");
  });

  it("未知のディレクティブは undefined を返す", () => {
    expect(findResponseDirectiveInfo("unknown-directive")).toBeUndefined();
  });
});

describe("findRequestDirectiveInfo", () => {
  it("リクエスト専用ディレクティブを返す", () => {
    const info = findRequestDirectiveInfo("only-if-cached");
    expect(info).toBeDefined();
    expect(info!.name).toBe("only-if-cached");
  });

  it("未知のディレクティブは undefined を返す", () => {
    expect(findRequestDirectiveInfo("immutable")).toBeUndefined();
  });
});

describe("parseCacheControl", () => {
  it("空文字列は空配列を返す", () => {
    const { directives, errors } = parseCacheControl("");
    expect(directives).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it("値なしディレクティブをパースする", () => {
    const { directives } = parseCacheControl("no-store");
    expect(directives).toHaveLength(1);
    expect(directives[0].name).toBe("no-store");
    expect(directives[0].value).toBeUndefined();
    expect(directives[0].enabled).toBe(true);
  });

  it("値ありディレクティブをパースする", () => {
    const { directives } = parseCacheControl("max-age=3600");
    expect(directives).toHaveLength(1);
    expect(directives[0].name).toBe("max-age");
    expect(directives[0].value).toBe(3600);
  });

  it("複数ディレクティブをパースする（カンマ区切り）", () => {
    const { directives } = parseCacheControl("public, max-age=3600, stale-while-revalidate=60");
    expect(directives).toHaveLength(3);
    expect(directives[0].name).toBe("public");
    expect(directives[1].name).toBe("max-age");
    expect(directives[1].value).toBe(3600);
    expect(directives[2].name).toBe("stale-while-revalidate");
    expect(directives[2].value).toBe(60);
  });

  it("ディレクティブ名を小文字に正規化する", () => {
    const { directives } = parseCacheControl("NO-STORE");
    expect(directives[0].name).toBe("no-store");
  });

  it("重複ディレクティブはエラーを返す", () => {
    const { errors } = parseCacheControl("max-age=3600, max-age=7200");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("重複");
  });

  it("無効な値はエラーを返す", () => {
    const { errors } = parseCacheControl("max-age=abc");
    expect(errors.some((e) => e.includes("有効な整数"))).toBe(true);
  });

  it("必須の値が省略された場合エラーを返す", () => {
    const { errors } = parseCacheControl("max-age");
    expect(errors.some((e) => e.includes("max-age"))).toBe(true);
  });

  it("リクエストモードでパースする", () => {
    const { directives } = parseCacheControl("max-age=0, no-cache", "request");
    expect(directives).toHaveLength(2);
  });

  it("余分な空白を無視する", () => {
    const { directives } = parseCacheControl("  public ,  max-age=3600  ");
    expect(directives).toHaveLength(2);
    expect(directives[0].name).toBe("public");
    expect(directives[1].value).toBe(3600);
  });

  it("クォートされた値をパースする", () => {
    const { directives } = parseCacheControl('max-age="3600"');
    expect(directives[0].value).toBe(3600);
  });
});

describe("buildCacheControl", () => {
  it("空の配列は空文字列を返す", () => {
    expect(buildCacheControl([])).toBe("");
  });

  it("値なしディレクティブを生成する", () => {
    const directives: CacheControlDirectiveEntry[] = [{ name: "no-store", enabled: true }];
    expect(buildCacheControl(directives)).toBe("no-store");
  });

  it("値ありディレクティブを生成する", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "max-age", enabled: true, value: 3600 },
    ];
    expect(buildCacheControl(directives)).toBe("max-age=3600");
  });

  it("複数ディレクティブをカンマ区切りで生成する", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "public", enabled: true },
      { name: "max-age", enabled: true, value: 3600 },
    ];
    expect(buildCacheControl(directives)).toBe("public, max-age=3600");
  });

  it("無効化されたディレクティブはスキップされる", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "public", enabled: true },
      { name: "max-age", enabled: false, value: 3600 },
    ];
    expect(buildCacheControl(directives)).toBe("public");
  });

  it("値がないnumberディレクティブはスキップされる", () => {
    const directives: CacheControlDirectiveEntry[] = [{ name: "max-age", enabled: true }];
    expect(buildCacheControl(directives)).toBe("");
  });

  it("optional-number でも値なしで生成できる", () => {
    const directives: CacheControlDirectiveEntry[] = [{ name: "max-stale", enabled: true }];
    expect(buildCacheControl(directives, "request")).toBe("max-stale");
  });

  it("optional-number で値ありで生成できる", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "max-stale", enabled: true, value: 3600 },
    ];
    expect(buildCacheControl(directives, "request")).toBe("max-stale=3600");
  });
});

describe("validateCacheControl", () => {
  it("no-store + 他のディレクティブに警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "no-store", enabled: true },
      { name: "max-age", enabled: true, value: 3600 },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("no-store"))).toBe(true);
  });

  it("public + private の競合に警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "public", enabled: true },
      { name: "private", enabled: true },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("public") && w.includes("private"))).toBe(true);
  });

  it("no-cache + no-store の冗長に提案を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "no-cache", enabled: true },
      { name: "no-store", enabled: true },
    ];
    const { suggestions } = validateCacheControl(directives);
    expect(suggestions.some((s) => s.includes("no-store"))).toBe(true);
  });

  it("immutable + no-cache の矛盾に警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "immutable", enabled: true },
      { name: "no-cache", enabled: true },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("immutable"))).toBe(true);
  });

  it("immutable + max-age=0 の矛盾に警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "immutable", enabled: true },
      { name: "max-age", enabled: true, value: 0 },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("immutable") && w.includes("max-age=0"))).toBe(true);
  });

  it("must-revalidate + stale-while-revalidate の競合に警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "must-revalidate", enabled: true },
      { name: "stale-while-revalidate", enabled: true, value: 60 },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("must-revalidate"))).toBe(true);
  });

  it("private + s-maxage の競合に警告を返す", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "private", enabled: true },
      { name: "s-maxage", enabled: true, value: 86400 },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("private") && w.includes("s-maxage"))).toBe(true);
  });

  it("無効化されたディレクティブは検証しない", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "public", enabled: true },
      { name: "private", enabled: false },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings.some((w) => w.includes("private"))).toBe(false);
  });

  it("セキュアな設定では警告がない", () => {
    const directives: CacheControlDirectiveEntry[] = [
      { name: "public", enabled: true },
      { name: "max-age", enabled: true, value: 3600 },
      { name: "stale-while-revalidate", enabled: true, value: 60 },
    ];
    const { warnings } = validateCacheControl(directives);
    expect(warnings).toHaveLength(0);
  });
});

describe("formatSeconds", () => {
  it("0秒", () => {
    expect(formatSeconds(0)).toBe("0秒");
  });

  it("60秒未満", () => {
    expect(formatSeconds(30)).toBe("30秒");
  });

  it("ちょうど1分", () => {
    expect(formatSeconds(60)).toBe("1分");
  });

  it("1分30秒", () => {
    expect(formatSeconds(90)).toBe("1分30秒");
  });

  it("ちょうど1時間", () => {
    expect(formatSeconds(3600)).toBe("1時間");
  });

  it("1時間30分", () => {
    expect(formatSeconds(5400)).toBe("1時間30分");
  });

  it("ちょうど1日", () => {
    expect(formatSeconds(86400)).toBe("1日");
  });

  it("1日12時間", () => {
    expect(formatSeconds(86400 + 43200)).toBe("1日12時間");
  });

  it("7日", () => {
    expect(formatSeconds(604800)).toBe("7日");
  });

  it("1年（31536000秒）", () => {
    expect(formatSeconds(31536000)).toBe("365日");
  });
});

describe("parseCacheControl → buildCacheControl ラウンドトリップ", () => {
  it("パースして再ビルドしても同じ文字列になる（値なし）", () => {
    const original = "no-store";
    const { directives } = parseCacheControl(original);
    const rebuilt = buildCacheControl(directives);
    expect(rebuilt).toBe(original);
  });

  it("パースして再ビルドしても同じ文字列になる（複合）", () => {
    const original = "public, max-age=3600, stale-while-revalidate=60";
    const { directives } = parseCacheControl(original);
    const rebuilt = buildCacheControl(directives);
    expect(rebuilt).toBe(original);
  });
});

describe("RESPONSE_DIRECTIVES", () => {
  it("ディレクティブが存在する", () => {
    expect(RESPONSE_DIRECTIVES.length).toBeGreaterThan(0);
  });

  it("重複するディレクティブ名がない", () => {
    const names = RESPONSE_DIRECTIVES.map((d) => d.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("すべてのディレクティブに name と description がある", () => {
    RESPONSE_DIRECTIVES.forEach((d) => {
      expect(d.name).toBeTruthy();
      expect(d.description).toBeTruthy();
    });
  });
});

describe("REQUEST_DIRECTIVES", () => {
  it("ディレクティブが存在する", () => {
    expect(REQUEST_DIRECTIVES.length).toBeGreaterThan(0);
  });

  it("重複するディレクティブ名がない", () => {
    const names = REQUEST_DIRECTIVES.map((d) => d.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe("RESPONSE_PRESETS", () => {
  it("プリセットが存在する", () => {
    expect(RESPONSE_PRESETS.length).toBeGreaterThan(0);
  });

  it("すべてのプリセットに name・description・directives がある", () => {
    RESPONSE_PRESETS.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.directives.length).toBeGreaterThan(0);
    });
  });

  it("長期キャッシュプリセットに immutable が含まれる", () => {
    const preset = RESPONSE_PRESETS.find((p) => p.name.includes("長期"));
    expect(preset).toBeDefined();
    expect(preset!.directives.some((d) => d.name === "immutable")).toBe(true);
  });

  it("キャッシュなしプリセットに no-store が含まれる", () => {
    const preset = RESPONSE_PRESETS.find((p) => p.name.includes("キャッシュなし"));
    expect(preset).toBeDefined();
    expect(preset!.directives.some((d) => d.name === "no-store")).toBe(true);
  });
});
