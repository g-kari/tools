import { describe, test, expect } from "vite-plus/test";
import { generateSqlCreateTable, getSampleJson } from "../../app/utils/json-to-sql";

const defaultOptions = {
  tableName: "my_table",
  dialect: "postgresql" as const,
  notNull: false,
  addId: false,
};

describe("generateSqlCreateTable", () => {
  describe("PostgreSQL ダイアレクト", () => {
    test("文字列プロパティが TEXT を生成する", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', defaultOptions);
      expect(result).toContain("TEXT");
      expect(result).toContain('"name"');
    });

    test("整数プロパティが INTEGER を生成する", () => {
      const result = generateSqlCreateTable('{"age": 30}', defaultOptions);
      expect(result).toContain("INTEGER");
      expect(result).toContain('"age"');
    });

    test("小数プロパティが DOUBLE PRECISION を生成する", () => {
      const result = generateSqlCreateTable('{"score": 3.14}', defaultOptions);
      expect(result).toContain("DOUBLE PRECISION");
      expect(result).toContain('"score"');
    });

    test("真偽値プロパティが BOOLEAN を生成する", () => {
      const result = generateSqlCreateTable('{"active": true}', defaultOptions);
      expect(result).toContain("BOOLEAN");
      expect(result).toContain('"active"');
    });

    test("nullプロパティが TEXT を生成する", () => {
      const result = generateSqlCreateTable('{"bio": null}', defaultOptions);
      expect(result).toContain("TEXT");
      expect(result).toContain('"bio"');
    });

    test("オブジェクトプロパティが JSONB を生成する", () => {
      const result = generateSqlCreateTable('{"meta": {"key": "value"}}', defaultOptions);
      expect(result).toContain("JSONB");
      expect(result).toContain('"meta"');
    });

    test("配列プロパティが JSONB を生成する", () => {
      const result = generateSqlCreateTable('{"tags": ["a", "b"]}', defaultOptions);
      expect(result).toContain("JSONB");
      expect(result).toContain('"tags"');
    });

    test("ダイアレクトコメントが含まれる", () => {
      const result = generateSqlCreateTable('{"id": 1}', defaultOptions);
      expect(result).toContain("-- PostgreSQL");
    });

    test("CREATE TABLE文が生成される", () => {
      const result = generateSqlCreateTable('{"id": 1}', defaultOptions);
      expect(result).toContain('CREATE TABLE "my_table"');
    });
  });

  describe("MySQL ダイアレクト", () => {
    const mysqlOptions = { ...defaultOptions, dialect: "mysql" as const };

    test("文字列プロパティが VARCHAR(255) を生成する", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', mysqlOptions);
      expect(result).toContain("VARCHAR(255)");
    });

    test("整数プロパティが INT を生成する", () => {
      const result = generateSqlCreateTable('{"age": 30}', mysqlOptions);
      expect(result).toContain("INT");
    });

    test("小数プロパティが DOUBLE を生成する", () => {
      const result = generateSqlCreateTable('{"score": 3.14}', mysqlOptions);
      expect(result).toContain("DOUBLE");
    });

    test("真偽値プロパティが TINYINT(1) を生成する", () => {
      const result = generateSqlCreateTable('{"active": true}', mysqlOptions);
      expect(result).toContain("TINYINT(1)");
    });

    test("オブジェクトプロパティが JSON を生成する", () => {
      const result = generateSqlCreateTable('{"meta": {"key": "value"}}', mysqlOptions);
      expect(result).toContain("JSON");
    });

    test("テーブル名がバッククォートで囲まれる", () => {
      const result = generateSqlCreateTable('{"id": 1}', mysqlOptions);
      expect(result).toContain("CREATE TABLE `my_table`");
    });

    test("カラム名がバッククォートで囲まれる", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', mysqlOptions);
      expect(result).toContain("`name`");
    });

    test("ダイアレクトコメントが含まれる", () => {
      const result = generateSqlCreateTable('{"id": 1}', mysqlOptions);
      expect(result).toContain("-- MySQL");
    });
  });

  describe("SQLite ダイアレクト", () => {
    const sqliteOptions = { ...defaultOptions, dialect: "sqlite" as const };

    test("文字列プロパティが TEXT を生成する", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', sqliteOptions);
      expect(result).toContain("TEXT");
    });

    test("整数プロパティが INTEGER を生成する", () => {
      const result = generateSqlCreateTable('{"age": 30}', sqliteOptions);
      expect(result).toContain("INTEGER");
    });

    test("小数プロパティが REAL を生成する", () => {
      const result = generateSqlCreateTable('{"score": 3.14}', sqliteOptions);
      expect(result).toContain("REAL");
    });

    test("真偽値プロパティが INTEGER を生成する", () => {
      const result = generateSqlCreateTable('{"active": true}', sqliteOptions);
      expect(result).toContain("INTEGER");
    });

    test("オブジェクトプロパティが TEXT を生成する", () => {
      const result = generateSqlCreateTable('{"meta": {"key": "value"}}', sqliteOptions);
      expect(result).toContain("TEXT");
    });

    test("ダイアレクトコメントが含まれる", () => {
      const result = generateSqlCreateTable('{"id": 1}', sqliteOptions);
      expect(result).toContain("-- SQLite");
    });
  });

  describe("オプション", () => {
    test("テーブル名がカスタマイズできる", () => {
      const result = generateSqlCreateTable('{"id": 1}', {
        ...defaultOptions,
        tableName: "users",
      });
      expect(result).toContain('"users"');
      expect(result).not.toContain('"my_table"');
    });

    test("notNull=true のとき NOT NULL が付与される（null値以外）", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        notNull: true,
      });
      expect(result).toContain("NOT NULL");
    });

    test("notNull=false のとき NOT NULL が付与されない", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        notNull: false,
      });
      expect(result).not.toContain("NOT NULL");
    });

    test("nullプロパティには notNull=true でも NOT NULL が付与されない", () => {
      const result = generateSqlCreateTable('{"bio": null}', {
        ...defaultOptions,
        notNull: true,
      });
      expect(result).not.toContain("NOT NULL");
    });

    test("addId=true のとき id カラムが先頭に追加される", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        addId: true,
      });
      expect(result).toContain('"id" SERIAL PRIMARY KEY');
      const idPos = result.indexOf('"id"');
      const namePos = result.indexOf('"name"');
      expect(idPos).toBeLessThan(namePos);
    });

    test("addId=false のとき id カラムが追加されない", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        addId: false,
      });
      expect(result).not.toContain("SERIAL PRIMARY KEY");
    });

    test("MySQL の addId=true で AUTO_INCREMENT が含まれる", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        dialect: "mysql",
        addId: true,
      });
      expect(result).toContain("AUTO_INCREMENT PRIMARY KEY");
    });

    test("SQLite の addId=true で AUTOINCREMENT が含まれる", () => {
      const result = generateSqlCreateTable('{"name": "Alice"}', {
        ...defaultOptions,
        dialect: "sqlite",
        addId: true,
      });
      expect(result).toContain("AUTOINCREMENT");
    });
  });

  describe("キー名変換", () => {
    test("camelCase キーがスネークケースに変換される", () => {
      const result = generateSqlCreateTable('{"userName": "Alice"}', defaultOptions);
      expect(result).toContain('"user_name"');
      expect(result).not.toContain('"userName"');
    });

    test("PascalCase キーがスネークケースに変換される", () => {
      const result = generateSqlCreateTable('{"CreatedAt": "2024-01-01"}', defaultOptions);
      expect(result).toContain('"created_at"');
    });
  });

  describe("ルートが配列の場合", () => {
    test("配列の最初の要素を使用する", () => {
      const result = generateSqlCreateTable('[{"name": "Alice", "age": 30}]', defaultOptions);
      expect(result).toContain('"name"');
      expect(result).toContain('"age"');
    });
  });

  describe("エラーケース", () => {
    test("空文字列でエラーをスローする", () => {
      expect(() => generateSqlCreateTable("", defaultOptions)).toThrow("JSONを入力してください");
    });

    test("空白のみの文字列でエラーをスローする", () => {
      expect(() => generateSqlCreateTable("   ", defaultOptions)).toThrow("JSONを入力してください");
    });

    test("無効なJSONでエラーをスローする", () => {
      expect(() => generateSqlCreateTable("invalid json", defaultOptions)).toThrow(
        "無効なJSON形式です",
      );
    });

    test("プリミティブなルートでエラーをスローする", () => {
      expect(() => generateSqlCreateTable('"just a string"', defaultOptions)).toThrow(
        "JSONのルートはオブジェクト",
      );
    });
  });
});

describe("getSampleJson", () => {
  test("有効なJSONを返す", () => {
    const sample = getSampleJson();
    expect(() => JSON.parse(sample)).not.toThrow();
  });

  test("null値を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasNull = Object.values(parsed).some((v) => v === null);
    expect(hasNull).toBe(true);
  });

  test("配列を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasArray = Object.values(parsed).some((v) => Array.isArray(v));
    expect(hasArray).toBe(true);
  });

  test("ネストされたオブジェクトを含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasObject = Object.values(parsed).some(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v),
    );
    expect(hasObject).toBe(true);
  });
});
