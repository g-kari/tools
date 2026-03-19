import { describe, test, expect } from "vitest";
import { generateTypeScript, getSampleSql } from "../../app/utils/sql-to-ts";

const defaultOptions = {
  useInterface: true,
  nullableAsOptional: true,
  dateAsDate: false,
};

describe("generateTypeScript", () => {
  describe("基本的な型変換", () => {
    test("VARCHAR/TEXTカラムがstringを生成する", () => {
      const sql = `CREATE TABLE users (name VARCHAR(255) NOT NULL, bio TEXT);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("name: string");
      expect(result).toContain("bio?: string");
    });

    test("INTEGERカラムがnumberを生成する", () => {
      const sql = `CREATE TABLE items (count INTEGER NOT NULL, total BIGINT);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("count: number");
      expect(result).toContain("total?: number");
    });

    test("DOUBLE PRECISIONカラムがnumberを生成する", () => {
      const sql = `CREATE TABLE scores (value DOUBLE PRECISION NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("value: number");
    });

    test("BOOLEANカラムがbooleanを生成する", () => {
      const sql = `CREATE TABLE flags (active BOOLEAN NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("active: boolean");
    });

    test("JSONBカラムがRecord<string, unknown>を生成する", () => {
      const sql = `CREATE TABLE data (meta JSONB);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("meta?: Record<string, unknown>");
    });

    test("TIMESTAMPカラムがstringを生成する（デフォルト）", () => {
      const sql = `CREATE TABLE events (created_at TIMESTAMP NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("createdAt: string");
    });

    test("TIMESTAMPカラムがDateを生成する（dateAsDate=true）", () => {
      const sql = `CREATE TABLE events (created_at TIMESTAMP NOT NULL);`;
      const result = generateTypeScript(sql, {
        ...defaultOptions,
        dateAsDate: true,
      });
      expect(result).toContain("createdAt: Date");
    });

    test("BYTEAカラムがUint8Arrayを生成する", () => {
      const sql = `CREATE TABLE files (data BYTEA);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("data?: Uint8Array");
    });

    test("UUIDカラムがstringを生成する", () => {
      const sql = `CREATE TABLE resources (id UUID NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("id: string");
    });
  });

  describe("interfaceとtypeの切り替え", () => {
    test("useInterface=trueでinterfaceキーワードを使用する", () => {
      const sql = `CREATE TABLE users (id INTEGER NOT NULL);`;
      const result = generateTypeScript(sql, {
        ...defaultOptions,
        useInterface: true,
      });
      expect(result).toMatch(/^interface /);
    });

    test("useInterface=falseでtypeキーワードを使用する", () => {
      const sql = `CREATE TABLE users (id INTEGER NOT NULL);`;
      const result = generateTypeScript(sql, {
        ...defaultOptions,
        useInterface: false,
      });
      expect(result).toMatch(/^type /);
    });
  });

  describe("nullableAsOptionalオプション", () => {
    test("nullableAsOptional=trueでNULLABLEカラムに?を付与する", () => {
      const sql = `CREATE TABLE users (name VARCHAR(255));`;
      const result = generateTypeScript(sql, {
        ...defaultOptions,
        nullableAsOptional: true,
      });
      expect(result).toContain("name?: string");
    });

    test("nullableAsOptional=falseでNULLABLEカラムに| nullを付与する", () => {
      const sql = `CREATE TABLE users (name VARCHAR(255));`;
      const result = generateTypeScript(sql, {
        ...defaultOptions,
        nullableAsOptional: false,
      });
      expect(result).toContain("name: string | null");
    });
  });

  describe("テーブル名の変換", () => {
    test("テーブル名がPascalCaseのinterface名になる", () => {
      const sql = `CREATE TABLE user_profiles (id INTEGER NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toMatch(/interface UserProfiles/);
    });

    test("ダブルクォートのテーブル名を解析する", () => {
      const sql = `CREATE TABLE "my_table" (id INTEGER NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toMatch(/interface MyTable/);
    });

    test("バッククォートのテーブル名を解析する", () => {
      const sql = "CREATE TABLE `order_items` (id INTEGER NOT NULL);";
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toMatch(/interface OrderItems/);
    });
  });

  describe("カラム名の変換", () => {
    test("スネークケースのカラム名がcamelCaseに変換される", () => {
      const sql = `CREATE TABLE users (created_at TIMESTAMP NOT NULL, first_name VARCHAR(100) NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("createdAt: string");
      expect(result).toContain("firstName: string");
    });
  });

  describe("テーブル制約のスキップ", () => {
    test("PRIMARY KEY制約をスキップする", () => {
      const sql = `CREATE TABLE users (
        id INTEGER NOT NULL,
        PRIMARY KEY (id)
      );`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("id: number");
      expect(result).not.toContain("PRIMARY");
    });

    test("FOREIGN KEY制約をスキップする", () => {
      const sql = `CREATE TABLE orders (
        id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("id: number");
      expect(result).toContain("userId: number");
      expect(result).not.toContain("FOREIGN");
    });

    test("CONSTRAINT制約をスキップする", () => {
      const sql = `CREATE TABLE users (
        id INTEGER NOT NULL,
        CONSTRAINT users_pkey PRIMARY KEY (id)
      );`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toContain("id: number");
      expect(result).not.toContain("CONSTRAINT");
    });
  });

  describe("IF NOT EXISTS構文", () => {
    test("IF NOT EXISTS付きのCREATE TABLE文を解析する", () => {
      const sql = `CREATE TABLE IF NOT EXISTS users (id INTEGER NOT NULL);`;
      const result = generateTypeScript(sql, defaultOptions);
      expect(result).toMatch(/interface Users/);
      expect(result).toContain("id: number");
    });
  });

  describe("エラーハンドリング", () => {
    test("空文字列でエラーをスローする", () => {
      expect(() => generateTypeScript("", defaultOptions)).toThrow(
        "SQLを入力してください"
      );
    });

    test("CREATE TABLEのない文字列でエラーをスローする", () => {
      expect(() =>
        generateTypeScript("SELECT * FROM users;", defaultOptions)
      ).toThrow("CREATE TABLE文が見つかりません");
    });

    test("カラムのない定義でエラーをスローする", () => {
      expect(() =>
        generateTypeScript("CREATE TABLE empty ();", defaultOptions)
      ).toThrow();
    });
  });

  describe("サンプルSQL", () => {
    test("getSampleSqlが有効なSQLを返す", () => {
      const sample = getSampleSql();
      expect(sample).toContain("CREATE TABLE");
      expect(sample).toContain("INTEGER");
      expect(sample).toContain("VARCHAR");
    });

    test("サンプルSQLから型定義を生成できる", () => {
      const sample = getSampleSql();
      const result = generateTypeScript(sample, defaultOptions);
      expect(result).toContain("interface");
      expect(result).toContain("id: number");
      expect(result).toContain("name: string");
      expect(result).toContain("email: string");
    });
  });
});
