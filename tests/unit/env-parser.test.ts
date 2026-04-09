import { describe, it, expect } from "vite-plus/test";
import { parseEnv, toJSON, toYAML, toExports } from "../../app/utils/env-parser";
import type { EnvEntry } from "../../app/utils/env-parser";

// ===== テストスイート =====

describe("parseEnv", () => {
  describe("基本的なKEY=VALUEのパース", () => {
    it("単純なキーと値をパースできる", () => {
      const result = parseEnv("KEY=VALUE");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ key: "KEY", value: "VALUE" });
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
    });

    it("複数のエントリをパースできる", () => {
      const result = parseEnv("KEY1=VALUE1\nKEY2=VALUE2\nKEY3=VALUE3");
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0]).toEqual({ key: "KEY1", value: "VALUE1" });
      expect(result.entries[1]).toEqual({ key: "KEY2", value: "VALUE2" });
      expect(result.entries[2]).toEqual({ key: "KEY3", value: "VALUE3" });
    });

    it("アンダースコアを含むキーをパースできる", () => {
      const result = parseEnv("DATABASE_URL=postgres://localhost/mydb");
      expect(result.entries[0].key).toBe("DATABASE_URL");
      expect(result.entries[0].value).toBe("postgres://localhost/mydb");
    });

    it("小文字のキーをパースできる", () => {
      const result = parseEnv("my_var=hello");
      expect(result.entries[0].key).toBe("my_var");
    });

    it("アンダースコアで始まるキーをパースできる", () => {
      const result = parseEnv("_PRIVATE=secret");
      expect(result.entries[0].key).toBe("_PRIVATE");
    });
  });

  describe("コメント行のスキップ", () => {
    it("コメント行（#）はスキップされる", () => {
      const result = parseEnv("# this is a comment\nKEY=VALUE");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].key).toBe("KEY");
    });

    it("複数のコメント行がある場合もスキップされる", () => {
      const result = parseEnv("# comment 1\n# comment 2\nKEY=VALUE\n# comment 3");
      expect(result.entries).toHaveLength(1);
    });

    it("コメントのみの入力はエントリが0件になる", () => {
      const result = parseEnv("# only comments\n# another comment");
      expect(result.entries).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("空行のスキップ", () => {
    it("空行はスキップされる", () => {
      const result = parseEnv("\nKEY=VALUE\n\n");
      expect(result.entries).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it("空白のみの行はスキップされる", () => {
      const result = parseEnv("   \nKEY=VALUE\n   ");
      expect(result.entries).toHaveLength(1);
    });
  });

  describe("クォート付き値のパース", () => {
    it("ダブルクォート付きの値をパースできる", () => {
      const result = parseEnv('API_KEY="secret-key-123"');
      expect(result.entries[0].value).toBe("secret-key-123");
    });

    it("シングルクォート付きの値をパースできる", () => {
      const result = parseEnv("API_KEY='secret-key-123'");
      expect(result.entries[0].value).toBe("secret-key-123");
    });

    it("クォートなしの値はそのままパースされる", () => {
      const result = parseEnv("PORT=3000");
      expect(result.entries[0].value).toBe("3000");
    });

    it("ダブルクォートで囲まれたスペースを含む値をパースできる", () => {
      const result = parseEnv('GREETING="Hello World"');
      expect(result.entries[0].value).toBe("Hello World");
    });
  });

  describe("空値のパース", () => {
    it("空値（KEY=）をパースできる", () => {
      const result = parseEnv("EMPTY_KEY=");
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toEqual({ key: "EMPTY_KEY", value: "" });
    });

    it("空クォート値をパースできる", () => {
      const result = parseEnv('EMPTY_KEY=""');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].value).toBe("");
    });
  });

  describe("値にURLやコロンを含むケース", () => {
    it("URLを値に含む場合をパースできる", () => {
      const result = parseEnv("DATABASE_URL=postgresql://user:pass@localhost:5432/db");
      expect(result.entries[0].key).toBe("DATABASE_URL");
      expect(result.entries[0].value).toBe("postgresql://user:pass@localhost:5432/db");
    });

    it("値に=を含む場合は最初の=で分割される", () => {
      const result = parseEnv("ENCODED=a=b=c");
      expect(result.entries[0].key).toBe("ENCODED");
      expect(result.entries[0].value).toBe("a=b=c");
    });
  });

  describe("重複キーの検出", () => {
    it("同じキーが2回定義されると重複として検出される", () => {
      const result = parseEnv("KEY=value1\nKEY=value2");
      expect(result.duplicates).toContain("KEY");
      expect(result.entries).toHaveLength(2);
    });

    it("重複キーは1回だけ重複リストに追加される", () => {
      const result = parseEnv("KEY=v1\nKEY=v2\nKEY=v3");
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates).toContain("KEY");
    });

    it("異なるキーは重複として検出されない", () => {
      const result = parseEnv("KEY1=value1\nKEY2=value2");
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe("無効な行のエラー検出", () => {
    it("=がない行はエラーになる", () => {
      const result = parseEnv("INVALID_LINE");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[0].content).toBe("INVALID_LINE");
    });

    it("数字で始まるキーはエラーになる", () => {
      const result = parseEnv("1KEY=value");
      expect(result.errors).toHaveLength(1);
    });

    it("スペースを含むキーはエラーになる", () => {
      const result = parseEnv("KEY WITH SPACE=value");
      expect(result.errors).toHaveLength(1);
    });

    it("エラーがある行の行番号が正確に記録される", () => {
      const result = parseEnv("VALID=ok\nINVALID_LINE\nOTHER=ok");
      expect(result.errors[0].line).toBe(2);
    });

    it("複数のエラー行が検出される", () => {
      const result = parseEnv("BAD1\nGOOD=ok\nBAD2");
      expect(result.errors).toHaveLength(2);
    });
  });
});

describe("toJSON", () => {
  it("エントリをJSON形式に変換できる", () => {
    const entries: EnvEntry[] = [
      { key: "KEY1", value: "value1" },
      { key: "KEY2", value: "value2" },
    ];
    const result = toJSON(entries);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ KEY1: "value1", KEY2: "value2" });
  });

  it("空のエントリ配列は空のJSONオブジェクトになる", () => {
    const result = toJSON([]);
    expect(JSON.parse(result)).toEqual({});
  });

  it("空値を含むエントリをJSON変換できる", () => {
    const entries: EnvEntry[] = [{ key: "EMPTY", value: "" }];
    const result = toJSON(entries);
    const parsed = JSON.parse(result);
    expect(parsed.EMPTY).toBe("");
  });

  it("特殊文字を含む値もJSON変換できる", () => {
    const entries: EnvEntry[] = [{ key: "URL", value: "https://example.com/path?q=1&r=2" }];
    const result = toJSON(entries);
    const parsed = JSON.parse(result);
    expect(parsed.URL).toBe("https://example.com/path?q=1&r=2");
  });

  it("インデントが2スペースのJSONが生成される", () => {
    const entries: EnvEntry[] = [{ key: "KEY", value: "value" }];
    const result = toJSON(entries);
    expect(result).toContain("  ");
  });
});

describe("toYAML", () => {
  it("エントリをYAML形式に変換できる", () => {
    const entries: EnvEntry[] = [
      { key: "KEY1", value: "value1" },
      { key: "KEY2", value: "value2" },
    ];
    const result = toYAML(entries);
    expect(result).toBe("KEY1: value1\nKEY2: value2");
  });

  it("空のエントリ配列は空文字列になる", () => {
    const result = toYAML([]);
    expect(result).toBe("");
  });

  it("コロンを含む値はクォートされる", () => {
    const entries: EnvEntry[] = [{ key: "URL", value: "http://example.com" }];
    const result = toYAML(entries);
    expect(result).toContain('"');
  });

  it("空値はクォートされる", () => {
    const entries: EnvEntry[] = [{ key: "EMPTY", value: "" }];
    const result = toYAML(entries);
    expect(result).toBe('EMPTY: ""');
  });

  it("波括弧を含む値はクォートされる", () => {
    const entries: EnvEntry[] = [{ key: "JSON", value: "{key: value}" }];
    const result = toYAML(entries);
    expect(result).toContain('"');
  });

  it("シンプルな値はクォートなしで出力される", () => {
    const entries: EnvEntry[] = [{ key: "PORT", value: "3000" }];
    const result = toYAML(entries);
    expect(result).toBe("PORT: 3000");
  });
});

describe("toExports", () => {
  it("エントリをShell export形式に変換できる", () => {
    const entries: EnvEntry[] = [
      { key: "KEY1", value: "value1" },
      { key: "KEY2", value: "value2" },
    ];
    const result = toExports(entries);
    expect(result).toBe('export KEY1="value1"\nexport KEY2="value2"');
  });

  it("空のエントリ配列は空文字列になる", () => {
    const result = toExports([]);
    expect(result).toBe("");
  });

  it("値に含まれるダブルクォートはエスケープされる", () => {
    const entries: EnvEntry[] = [{ key: "KEY", value: 'say "hello"' }];
    const result = toExports(entries);
    expect(result).toContain('\\"hello\\"');
  });

  it("値に含まれるバックスラッシュはエスケープされる", () => {
    const entries: EnvEntry[] = [{ key: "KEY", value: "C:\\path\\to\\file" }];
    const result = toExports(entries);
    expect(result).toContain("C:\\\\path\\\\to\\\\file");
  });

  it('空値はexport KEY=""になる', () => {
    const entries: EnvEntry[] = [{ key: "EMPTY", value: "" }];
    const result = toExports(entries);
    expect(result).toBe('export EMPTY=""');
  });
});

describe("ラウンドトリップ変換", () => {
  it("parseEnvしてtoJSONするとJSON.parseできる", () => {
    const input = "DATABASE_URL=postgresql://localhost/db\nAPI_KEY=secret123\nDEBUG=true";
    const result = parseEnv(input);
    const json = toJSON(result.entries);
    const parsed = JSON.parse(json);
    expect(parsed.DATABASE_URL).toBe("postgresql://localhost/db");
    expect(parsed.API_KEY).toBe("secret123");
    expect(parsed.DEBUG).toBe("true");
  });

  it("クォート付き入力をparseしてtoJSONすると正しい値になる", () => {
    const input = "KEY=\"hello world\"\nOTHER='simple'";
    const result = parseEnv(input);
    const json = toJSON(result.entries);
    const parsed = JSON.parse(json);
    expect(parsed.KEY).toBe("hello world");
    expect(parsed.OTHER).toBe("simple");
  });

  it("parseEnvしてtoYAMLすると正しい形式になる", () => {
    const input = "PORT=3000\nHOST=localhost";
    const result = parseEnv(input);
    const yaml = toYAML(result.entries);
    expect(yaml).toContain("PORT: 3000");
    expect(yaml).toContain("HOST: localhost");
  });

  it("parseEnvしてtoExportsするとexport文になる", () => {
    const input = "SECRET_KEY=mysecretkey\nNODE_ENV=production";
    const result = parseEnv(input);
    const exports = toExports(result.entries);
    expect(exports).toContain('export SECRET_KEY="mysecretkey"');
    expect(exports).toContain('export NODE_ENV="production"');
  });
});
