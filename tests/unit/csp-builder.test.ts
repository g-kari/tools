import { describe, it, expect } from "vite-plus/test";
import {
  parseCsp,
  buildCsp,
  validateCsp,
  formatCspMultiline,
  getDefaultPolicy,
  getStrictPolicy,
  findDirectiveInfo,
  ALL_CSP_DIRECTIVES,
  type CspDirectiveEntry,
} from "../../app/utils/csp-builder";

describe("findDirectiveInfo", () => {
  it("既知のディレクティブ名を返す", () => {
    const info = findDirectiveInfo("default-src");
    expect(info).toBeDefined();
    expect(info!.name).toBe("default-src");
  });

  it("大文字小文字を無視する", () => {
    const info = findDirectiveInfo("SCRIPT-SRC");
    expect(info).toBeDefined();
    expect(info!.name).toBe("script-src");
  });

  it("未知のディレクティブは undefined を返す", () => {
    expect(findDirectiveInfo("unknown-directive")).toBeUndefined();
  });
});

describe("parseCsp", () => {
  it("空文字列は空配列を返す", () => {
    const { directives, errors } = parseCsp("");
    expect(directives).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it("単一ディレクティブをパースする", () => {
    const { directives } = parseCsp("default-src 'self'");
    expect(directives).toHaveLength(1);
    expect(directives[0].name).toBe("default-src");
    expect(directives[0].sources).toEqual(["'self'"]);
  });

  it("複数ディレクティブをパースする", () => {
    const { directives } = parseCsp(
      "default-src 'self'; script-src 'self' https://cdn.example.com",
    );
    expect(directives).toHaveLength(2);
    expect(directives[0].name).toBe("default-src");
    expect(directives[1].name).toBe("script-src");
    expect(directives[1].sources).toEqual(["'self'", "https://cdn.example.com"]);
  });

  it("値なしディレクティブをパースする", () => {
    const { directives } = parseCsp("default-src 'self'; upgrade-insecure-requests");
    expect(directives).toHaveLength(2);
    expect(directives[1].name).toBe("upgrade-insecure-requests");
    expect(directives[1].sources).toHaveLength(0);
  });

  it("重複ディレクティブはエラーを返す", () => {
    const { directives, errors } = parseCsp("default-src 'self'; default-src 'none'");
    expect(directives).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("重複");
  });

  it("余分な空白を無視する", () => {
    const { directives } = parseCsp("  default-src   'self'   ;  script-src  'none'  ");
    expect(directives).toHaveLength(2);
  });

  it("ディレクティブ名を小文字に正規化する", () => {
    const { directives } = parseCsp("DEFAULT-SRC 'self'");
    expect(directives[0].name).toBe("default-src");
  });
});

describe("buildCsp", () => {
  it("空の配列は空文字列を返す", () => {
    expect(buildCsp([])).toBe("");
  });

  it("単一ディレクティブを生成する", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'self'"], enabled: true },
    ];
    expect(buildCsp(directives)).toBe("default-src 'self'");
  });

  it("複数ディレクティブをセミコロン区切りで生成する", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'self'"], enabled: true },
      { name: "script-src", sources: ["'self'", "https://cdn.example.com"], enabled: true },
    ];
    const result = buildCsp(directives);
    expect(result).toBe("default-src 'self'; script-src 'self' https://cdn.example.com");
  });

  it("無効化されたディレクティブはスキップされる", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'self'"], enabled: true },
      { name: "script-src", sources: ["'none'"], enabled: false },
    ];
    expect(buildCsp(directives)).toBe("default-src 'self'");
  });

  it("ソースなしの値なしディレクティブを生成する", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "upgrade-insecure-requests", sources: [], enabled: true },
    ];
    expect(buildCsp(directives)).toBe("upgrade-insecure-requests");
  });

  it("ソースが空のディレクティブはスキップされる", () => {
    const directives: CspDirectiveEntry[] = [{ name: "script-src", sources: [], enabled: true }];
    // script-src は hasSourceList=true なのでソースなしはスキップ
    expect(buildCsp(directives)).toBe("");
  });
});

describe("validateCsp", () => {
  it("default-src なしの場合に提案を返す", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "script-src", sources: ["'self'"], enabled: true },
    ];
    const { suggestions } = validateCsp(directives);
    expect(suggestions.some((s) => s.includes("default-src"))).toBe(true);
  });

  it("'unsafe-inline' の使用に警告を返す", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'self'"], enabled: true },
      { name: "script-src", sources: ["'self'", "'unsafe-inline'"], enabled: true },
    ];
    const { warnings } = validateCsp(directives);
    expect(warnings.some((w) => w.includes("unsafe-inline"))).toBe(true);
  });

  it("'unsafe-eval' の使用に警告を返す", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "script-src", sources: ["'self'", "'unsafe-eval'"], enabled: true },
    ];
    const { warnings } = validateCsp(directives);
    expect(warnings.some((w) => w.includes("unsafe-eval"))).toBe(true);
  });

  it("ワイルドカード '*' の使用に警告を返す", () => {
    const directives: CspDirectiveEntry[] = [{ name: "img-src", sources: ["*"], enabled: true }];
    const { warnings } = validateCsp(directives);
    expect(warnings.some((w) => w.includes("*"))).toBe(true);
  });

  it("report-uri は非推奨警告を返す", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "report-uri", sources: ["https://report.example.com/csp"], enabled: true },
    ];
    const { warnings } = validateCsp(directives);
    expect(warnings.some((w) => w.includes("report-uri"))).toBe(true);
  });

  it("セキュアな設定では警告がない", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'none'"], enabled: true },
      { name: "script-src", sources: ["'self'"], enabled: true },
      { name: "style-src", sources: ["'self'"], enabled: true },
    ];
    const { warnings } = validateCsp(directives);
    expect(warnings).toHaveLength(0);
  });

  it("無効化されたディレクティブは検証しない", () => {
    const directives: CspDirectiveEntry[] = [
      { name: "default-src", sources: ["'self'"], enabled: true },
      { name: "script-src", sources: ["'unsafe-inline'"], enabled: false },
    ];
    const { warnings } = validateCsp(directives);
    expect(warnings.some((w) => w.includes("unsafe-inline"))).toBe(false);
  });
});

describe("formatCspMultiline", () => {
  it("空文字列をそのまま返す", () => {
    expect(formatCspMultiline("")).toBe("");
  });

  it("各ディレクティブを改行で区切る", () => {
    const csp = "default-src 'self'; script-src 'none'";
    const result = formatCspMultiline(csp);
    expect(result).toContain("\n");
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("default-src");
    expect(lines[1]).toContain("script-src");
  });

  it("各行がセミコロンで終わる", () => {
    const csp = "default-src 'self'; script-src 'none'";
    const result = formatCspMultiline(csp);
    result.split("\n").forEach((line) => {
      expect(line.trim().endsWith(";")).toBe(true);
    });
  });
});

describe("getDefaultPolicy", () => {
  it("デフォルトポリシーは空でない", () => {
    const policy = getDefaultPolicy();
    expect(policy.length).toBeGreaterThan(0);
  });

  it("default-src が含まれる", () => {
    const policy = getDefaultPolicy();
    expect(policy.some((d) => d.name === "default-src")).toBe(true);
  });

  it("すべてのエントリが有効化されている", () => {
    const policy = getDefaultPolicy();
    expect(policy.every((d) => d.enabled)).toBe(true);
  });
});

describe("getStrictPolicy", () => {
  it("厳格ポリシーは空でない", () => {
    const policy = getStrictPolicy();
    expect(policy.length).toBeGreaterThan(0);
  });

  it("default-src が 'none' に設定されている", () => {
    const policy = getStrictPolicy();
    const defaultSrc = policy.find((d) => d.name === "default-src");
    expect(defaultSrc).toBeDefined();
    expect(defaultSrc!.sources).toContain("'none'");
  });
});

describe("ALL_CSP_DIRECTIVES", () => {
  it("ディレクティブが存在する", () => {
    expect(ALL_CSP_DIRECTIVES.length).toBeGreaterThan(0);
  });

  it("重複するディレクティブ名がない", () => {
    const names = ALL_CSP_DIRECTIVES.map((d) => d.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("すべてのディレクティブに name と description がある", () => {
    ALL_CSP_DIRECTIVES.forEach((d) => {
      expect(d.name).toBeTruthy();
      expect(d.description).toBeTruthy();
    });
  });
});

describe("parseCsp → buildCsp ラウンドトリップ", () => {
  it("パースして再ビルドしても同じ文字列になる", () => {
    const original =
      "default-src 'self'; script-src 'self' https://cdn.example.com; upgrade-insecure-requests";
    const { directives } = parseCsp(original);
    const rebuilt = buildCsp(directives);
    expect(rebuilt).toBe(original);
  });
});
