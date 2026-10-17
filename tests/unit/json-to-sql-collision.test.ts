import { describe, expect, it } from "vite-plus/test";
import {
  generateSqlCreateTable,
  getSampleJson,
  type SqlDialect,
} from "../../app/utils/json-to-sql";

const dialects: SqlDialect[] = ["postgresql", "mysql", "sqlite"];

describe.each(dialects)("JSON→SQLの列名衝突 (%s)", (dialect) => {
  const options = { tableName: "demo", dialect, notNull: true, addId: false };

  it.each([
    ['{"userName":1,"user_name":2}', "userName", "user_name"],
    ['{"a-b":1,"a b":2}', "a-b", "a_b"],
    ['{"ID":1,"id":2}', "ID", "id"],
    ['{"日本":1,"英語":2}', "日本", "__"],
    ['[{"userName":1,"user_name":2}]', "userName", "user_name"],
    ['{"user_name":1,"userName":2}', "userName", "user_name"],
  ])("正規化後に重複する %s を修復案内付きで拒否する", (json, sourceKey, column) => {
    expect(() => generateSqlCreateTable(json, options)).toThrow(sourceKey);
    expect(() => generateSqlCreateTable(json, options)).toThrow(column);
    expect(() => generateSqlCreateTable(json, options)).toThrow("入力キーを変更");
  });

  it.each(["id", "ID", "Id"])("追加idと入力キー %s の衝突を拒否する", (key) => {
    expect(() =>
      generateSqlCreateTable(JSON.stringify({ [key]: 7, name: "demo" }), {
        ...options,
        addId: true,
      }),
    ).toThrow("id カラムを追加する");
    expect(() =>
      generateSqlCreateTable(JSON.stringify({ [key]: 7, name: "demo" }), {
        ...options,
        addId: true,
      }),
    ).toThrow("オフ");
  });

  it("サンプルと追加idの衝突を成功出力しない", () => {
    expect(() => generateSqlCreateTable(getSampleJson(), { ...options, addId: true })).toThrow(
      "id",
    );
  });

  it("非衝突の正規化・型推論・id追加を保持する", () => {
    const sql = generateSqlCreateTable('{"userName":"demo","age":30,"bio":null}', {
      ...options,
      addId: true,
    });
    const quote = dialect === "mysql" ? "`" : '"';
    expect(sql).toContain(`${quote}user_name${quote}`);
    expect(sql).toContain(`${quote}age${quote}`);
    expect(sql).toContain(`${quote}bio${quote} TEXT`);
    expect(sql.match(new RegExp(`${quote}id${quote}`, "g"))).toHaveLength(1);
    expect(sql).toContain("PRIMARY KEY");
    expect(sql).toContain("NOT NULL");
  });

  it("追加idをオフにすれば入力idをそのまま生成する", () => {
    const sql = generateSqlCreateTable('{"id":7,"name":"demo"}', options);
    const quote = dialect === "mysql" ? "`" : '"';
    expect(sql.match(new RegExp(`${quote}id${quote}`, "g"))).toHaveLength(1);
    expect(sql).not.toContain("PRIMARY KEY");
  });
});
