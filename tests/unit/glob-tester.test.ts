import { describe, it, expect } from "vite-plus/test";
import {
  expandBraces,
  globPatternToRegex,
  matchSinglePattern,
  matchGlobPatterns,
} from "../../app/utils/glob-tester";

describe("expandBraces", () => {
  it("ブレースなしのパターンはそのまま返す", () => {
    expect(expandBraces("src/**/*.ts")).toEqual(["src/**/*.ts"]);
  });

  it("単純なブレース展開", () => {
    expect(expandBraces("{a,b,c}")).toEqual(["a", "b", "c"]);
  });

  it("プレフィックス付きブレース展開", () => {
    expect(expandBraces("src/**/*.{ts,tsx}")).toEqual(["src/**/*.ts", "src/**/*.tsx"]);
  });

  it("サフィックス付きブレース展開", () => {
    expect(expandBraces("{test,spec}.ts")).toEqual(["test.ts", "spec.ts"]);
  });

  it("閉じ括弧がない場合はそのまま返す", () => {
    expect(expandBraces("{a,b")).toEqual(["{a,b"]);
  });
});

describe("globPatternToRegex", () => {
  it("* は /以外の任意の文字列にマッチ", () => {
    const re = globPatternToRegex("*.ts");
    expect(re.test("index.ts")).toBe(true);
    expect(re.test("app.ts")).toBe(true);
    expect(re.test("src/index.ts")).toBe(false);
  });

  it("** は /を含む任意の文字列にマッチ", () => {
    const re = globPatternToRegex("src/**/*.ts");
    expect(re.test("src/index.ts")).toBe(true);
    expect(re.test("src/utils/helper.ts")).toBe(true);
    expect(re.test("src/a/b/c/deep.ts")).toBe(true);
    expect(re.test("dist/index.ts")).toBe(false);
  });

  it("? は /以外の任意の1文字にマッチ", () => {
    const re = globPatternToRegex("src/?.ts");
    expect(re.test("src/a.ts")).toBe(true);
    expect(re.test("src/ab.ts")).toBe(false);
    expect(re.test("src/a/b.ts")).toBe(false);
  });

  it("文字クラス [abc] にマッチ", () => {
    const re = globPatternToRegex("src/[abc].ts");
    expect(re.test("src/a.ts")).toBe(true);
    expect(re.test("src/b.ts")).toBe(true);
    expect(re.test("src/d.ts")).toBe(false);
  });

  it("否定文字クラス [^abc] にマッチ", () => {
    const re = globPatternToRegex("src/[^abc].ts");
    expect(re.test("src/d.ts")).toBe(true);
    expect(re.test("src/a.ts")).toBe(false);
  });

  it("glob否定文字クラス [!abc] にマッチ", () => {
    const re = globPatternToRegex("src/[!abc].ts");
    expect(re.test("src/d.ts")).toBe(true);
    expect(re.test("src/a.ts")).toBe(false);
  });

  it("ドットはリテラルとして扱う", () => {
    const re = globPatternToRegex("*.ts");
    expect(re.test("axts")).toBe(false);
  });

  it("先頭の ./ を除去して比較", () => {
    const re = globPatternToRegex("./src/**/*.ts");
    expect(re.test("src/index.ts")).toBe(true);
  });
});

describe("matchSinglePattern", () => {
  it("ブレース展開を含むパターンにマッチ", () => {
    expect(matchSinglePattern("**/*.{ts,tsx}", "src/app.tsx")).toBe(true);
    expect(matchSinglePattern("**/*.{ts,tsx}", "src/app.ts")).toBe(true);
    expect(matchSinglePattern("**/*.{ts,tsx}", "src/app.js")).toBe(false);
  });

  it("ルート直下のパターン", () => {
    expect(matchSinglePattern("*.ts", "index.ts")).toBe(true);
    expect(matchSinglePattern("*.ts", "src/index.ts")).toBe(false);
  });

  it("node_modules の除外パターン", () => {
    expect(matchSinglePattern("node_modules/**", "node_modules/react/index.js")).toBe(true);
    expect(matchSinglePattern("node_modules/**", "src/index.ts")).toBe(false);
  });
});

describe("matchGlobPatterns", () => {
  it("空のパターンリストはすべて不一致", () => {
    const results = matchGlobPatterns([], ["src/index.ts"]);
    expect(results[0].matched).toBe(false);
  });

  it("空のパスリストは空の結果", () => {
    const results = matchGlobPatterns(["**/*.ts"], []);
    expect(results).toHaveLength(0);
  });

  it("空白行のパスは除外される", () => {
    const results = matchGlobPatterns(["**/*.ts"], ["src/index.ts", "", "  "]);
    expect(results).toHaveLength(1);
  });

  it("単一パターンのマッチ", () => {
    const results = matchGlobPatterns(
      ["src/**/*.ts"],
      ["src/index.ts", "src/utils/helper.ts", "dist/index.js"],
    );
    expect(results[0].matched).toBe(true);
    expect(results[1].matched).toBe(true);
    expect(results[2].matched).toBe(false);
  });

  it("否定パターンによる除外", () => {
    const results = matchGlobPatterns(
      ["**/*.ts", "!**/*.test.ts"],
      ["src/index.ts", "src/index.test.ts"],
    );
    expect(results[0].matched).toBe(true);
    expect(results[0].negated).toBe(false);
    expect(results[1].matched).toBe(false);
    expect(results[1].negated).toBe(true);
  });

  it("複数パターンのOR マッチ", () => {
    const results = matchGlobPatterns(
      ["**/*.ts", "**/*.tsx"],
      ["src/app.ts", "src/App.tsx", "src/style.css"],
    );
    expect(results[0].matched).toBe(true);
    expect(results[1].matched).toBe(true);
    expect(results[2].matched).toBe(false);
  });

  it("matchedPattern に一致したパターンが記録される", () => {
    const results = matchGlobPatterns(["src/**/*.ts"], ["src/index.ts"]);
    expect(results[0].matchedPattern).toBe("src/**/*.ts");
  });

  it("マッチしない場合 matchedPattern は undefined", () => {
    const results = matchGlobPatterns(["src/**/*.ts"], ["dist/index.js"]);
    expect(results[0].matchedPattern).toBeUndefined();
  });

  it("否定パターンは肯定パターンより優先される", () => {
    const results = matchGlobPatterns(["**/*.ts", "!src/secret.ts"], ["src/secret.ts"]);
    expect(results[0].matched).toBe(false);
    expect(results[0].negated).toBe(true);
  });

  it("パスの空白はトリムされる", () => {
    const results = matchGlobPatterns(["**/*.ts"], ["  src/index.ts  "]);
    expect(results[0].path).toBe("src/index.ts");
    expect(results[0].matched).toBe(true);
  });
});
