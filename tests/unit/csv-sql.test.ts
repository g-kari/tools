import { describe, it, expect } from "vite-plus/test";
import { parseCsv, generateSql, isCsvSqlError, DEFAULT_OPTIONS } from "../../app/utils/csv-sql";

// ---------------------------------------------------------------------------
// parseCsv のテスト
// ---------------------------------------------------------------------------

describe("parseCsv", () => {
  it("シンプルな CSV を解析できる", () => {
    const result = parseCsv("id,name\n1,Alice\n2,Bob");
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.rowCount).toBe(3); // ヘッダー + 2行
      expect(result.columnCount).toBe(2);
      expect(result.headers).toEqual(["id", "name"]);
      expect(result.rows[1]).toEqual(["1", "Alice"]);
    }
  });

  it("ダブルクォートを含む CSV を解析できる", () => {
    const result = parseCsv('"id","name"\n"1","田中 太郎"\n"2","佐藤, 花子"');
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.rows[2][1]).toBe("佐藤, 花子");
    }
  });

  it("エスケープされたダブルクォートを処理できる", () => {
    const result = parseCsv('name,quote\nAlice,"She said ""hello"""\n');
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.rows[1][1]).toBe('She said "hello"');
    }
  });

  it("空 CSV でエラーを返す", () => {
    const result = parseCsv("   ");
    expect(isCsvSqlError(result)).toBe(true);
  });

  it("CRLF 改行を処理できる", () => {
    const result = parseCsv("id,name\r\n1,Alice\r\n2,Bob");
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.rowCount).toBe(3);
    }
  });
});

// ---------------------------------------------------------------------------
// generateSql のテスト
// ---------------------------------------------------------------------------

const csv = "id,name,score\n1,Alice,95.5\n2,Bob,82\n3,Carol,NULL";

describe("generateSql - 基本動作", () => {
  it("MySQL 向け INSERT 文を生成できる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, dialect: "mysql" });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.rowCount).toBe(3);
      expect(result.sql).toContain("INSERT INTO `my_table`");
      expect(result.sql).toContain("`id`, `name`, `score`");
    }
  });

  it("PostgreSQL 向け INSERT 文を生成できる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, dialect: "postgresql" });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain('INSERT INTO "my_table"');
      expect(result.sql).toContain('"id", "name", "score"');
    }
  });

  it("SQLite 向け INSERT 文を生成できる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, dialect: "sqlite" });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain('"my_table"');
    }
  });

  it("SQL Server 向け INSERT 文を生成できる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, dialect: "sqlserver" });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("[my_table]");
      expect(result.sql).toContain("[id], [name], [score]");
    }
  });
});

describe("generateSql - NULL 変換", () => {
  it("NULL 文字列を SQL NULL に変換する", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, convertNull: true });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("NULL");
    }
  });

  it("空セルを NULL に変換する", () => {
    const csvWithEmpty = "id,name\n1,\n2,Bob";
    const result = generateSql(csvWithEmpty, { ...DEFAULT_OPTIONS, convertNull: true });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("VALUES (1, NULL)");
    }
  });

  it("NULL 変換無効時は文字列として扱う", () => {
    const csvWithNull = "id,val\n1,NULL";
    const result = generateSql(csvWithNull, { ...DEFAULT_OPTIONS, convertNull: false });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("'NULL'");
    }
  });
});

describe("generateSql - 数値検出", () => {
  it("整数をクォートなしで出力する", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, detectNumbers: true });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("1,");
      expect(result.sql).not.toContain("'1'");
    }
  });

  it("小数をクォートなしで出力する", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, detectNumbers: true });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("95.5");
      expect(result.sql).not.toContain("'95.5'");
    }
  });

  it("数値検出無効時は文字列として扱う", () => {
    const csvNum = "id,val\n1,42";
    const result = generateSql(csvNum, {
      ...DEFAULT_OPTIONS,
      detectNumbers: false,
      convertNull: false,
    });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("'1'");
      expect(result.sql).toContain("'42'");
    }
  });
});

describe("generateSql - ブーリアン検出", () => {
  it("MySQL で true を 1 に変換する", () => {
    const csvBool = "id,active\n1,true\n2,false";
    const result = generateSql(csvBool, {
      ...DEFAULT_OPTIONS,
      dialect: "mysql",
      detectBooleans: true,
    });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("VALUES (1, 1)");
      expect(result.sql).toContain("VALUES (2, 0)");
    }
  });

  it("PostgreSQL で TRUE/FALSE を出力する", () => {
    const csvBool = "id,active\n1,true";
    const result = generateSql(csvBool, {
      ...DEFAULT_OPTIONS,
      dialect: "postgresql",
      detectBooleans: true,
    });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("TRUE");
    }
  });
});

describe("generateSql - バッチINSERT", () => {
  it("バッチサイズ 2 で 2行をひとつにまとめる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, batchSize: 2 });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.statementCount).toBe(2); // 2行+1行
    }
  });

  it("バッチサイズ 100 で全行をひとつにまとめる", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, batchSize: 100 });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.statementCount).toBe(1);
    }
  });
});

describe("generateSql - ヘッダーなし", () => {
  it("ヘッダーなしモードで col1/col2 を使用する", () => {
    const csvNoHeader = "1,Alice\n2,Bob";
    const result = generateSql(csvNoHeader, { ...DEFAULT_OPTIONS, hasHeader: false });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("`col1`");
      expect(result.sql).toContain("`col2`");
      expect(result.rowCount).toBe(2);
    }
  });
});

describe("generateSql - エラーケース", () => {
  it("空テーブル名でエラーを返す", () => {
    const result = generateSql(csv, { ...DEFAULT_OPTIONS, tableName: "" });
    expect(isCsvSqlError(result)).toBe(true);
  });

  it("ヘッダーのみの CSV でエラーを返す", () => {
    const result = generateSql("id,name", { ...DEFAULT_OPTIONS, hasHeader: true });
    expect(isCsvSqlError(result)).toBe(true);
  });

  it("空 CSV でエラーを返す", () => {
    const result = generateSql("", DEFAULT_OPTIONS);
    expect(isCsvSqlError(result)).toBe(true);
  });
});

describe("generateSql - エスケープ", () => {
  it("文字列内のシングルクォートをエスケープする", () => {
    const csvQuote = "id,name\n1,O'Brien";
    const result = generateSql(csvQuote, DEFAULT_OPTIONS);
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("'O''Brien'");
    }
  });

  it("MySQL でバッククォートを含むカラム名をエスケープする", () => {
    const csvTick = "`id`,name\n1,Alice";
    const result = generateSql(csvTick, { ...DEFAULT_OPTIONS, dialect: "mysql" });
    expect(isCsvSqlError(result)).toBe(false);
    if (!isCsvSqlError(result)) {
      expect(result.sql).toContain("``id``");
    }
  });
});
