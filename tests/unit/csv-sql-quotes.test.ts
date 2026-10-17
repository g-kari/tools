import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_OPTIONS, generateSql, parseCsv } from "../../app/utils/csv-sql";

const malformedFields = [
  { name: "閉じ忘れ", field: '"beta', reason: "引用符が閉じていません" },
  { name: "囲んでいない値の引用符", field: 'be"ta', reason: "値は全体を引用符で囲み" },
  { name: "閉じた引用符の後の文字", field: '"beta"x', reason: "閉じた引用符の後には" },
] as const;

describe("parseCsv - 不正な引用符", () => {
  for (const ending of ["\n", "\r\n", "\r"]) {
    it.each(malformedFields)(
      `$name をレコード・列付きで拒否する（改行 ${JSON.stringify(ending)}）`,
      ({ field, reason }) => {
        const result = parseCsv(`id,name${ending}1,"alpha${ending}line"${ending}2,${field}`);
        expect(result).toMatchObject({
          type: "parse",
          message: expect.stringContaining("CSV の3番目のレコードの2列目:"),
        });
        expect(result).toHaveProperty("message", expect.stringContaining(reason));
        expect(result).not.toHaveProperty("rows");
      },
    );
  }

  it.each([
    ['"id"x,name\n1,alpha', 1, 1, "閉じた引用符の後には"],
    ['id,na"me\n1,alpha', 1, 2, "値は全体を引用符で囲み"],
    ['id,name\n1,"alpha""', 2, 2, "引用符が閉じていません"],
    ['id,name\n1,"alpha" ,tail', 2, 2, "閉じた引用符の後には"],
    ['id,name\n1,"alpha"\t\n2,beta', 2, 2, "閉じた引用符の後には"],
    ['id,name\n1,"alpha";\n2,beta', 2, 2, "閉じた引用符の後には"],
  ] as const)(
    "不正なヘッダー・エスケープ終端・後続空白も拒否する: %j",
    (input, record, column, reason) => {
      expect(parseCsv(input)).toEqual({
        type: "parse",
        message: expect.stringMatching(
          new RegExp(`^CSV の${record}番目のレコードの${column}列目: .*${reason}`),
        ),
      });
    },
  );

  it("閉じた引用符の後の文字を別レコードに分割しない", () => {
    expect(generateSql('name\n"alpha"x', DEFAULT_OPTIONS)).toMatchObject({
      type: "parse",
      message: expect.stringContaining("2番目のレコードの1列目"),
    });
  });
});

describe("parseCsv - 引用符と既存の空白処理を保持する", () => {
  it.each(["\n", "\r\n", "\r"])(
    "引用符内のカンマ・改行・二重引用符と末尾空セルを保持する（改行 %j）",
    (ending) => {
      const result = parseCsv(
        `id,name,note${ending}1,"alpha,beta","line1${ending}""line2"""${ending}2,"",`,
      );
      expect(result).toMatchObject({
        rowCount: 3,
        columnCount: 3,
        rows: [
          ["id", "name", "note"],
          ["1", "alpha,beta", `line1${ending}"line2"`],
          ["2", "", ""],
        ],
      });
    },
  );

  it("文書全体の trim は引き続き適用し、引用符の内側の空白は残す", () => {
    expect(parseCsv(' \t"id",name\r\n1," alpha " \t\n ')).toMatchObject({
      rows: [
        ["id", "name"],
        ["1", " alpha "],
      ],
    });
    expect(parseCsv(" id,name\n 1,alpha ")).toMatchObject({
      rows: [
        ["id", "name"],
        [" 1", "alpha"],
      ],
    });
  });
});

describe("generateSql - 全ダイアレクトで不正な引用符を拒否する", () => {
  for (const dialect of ["mysql", "postgresql", "sqlite", "sqlserver"] as const) {
    for (const hasHeader of [true, false]) {
      for (const batchSize of [1, 2]) {
        const label = `${dialect} / header ${hasHeader} / batch ${batchSize}`;
        it.each(malformedFields)(`${label}: $name でSQL・統計を返さない`, ({ field, reason }) => {
          const input = `${hasHeader ? "id,name\n" : ""}1,alpha\n2,${field}`;
          const result = generateSql(input, { ...DEFAULT_OPTIONS, dialect, hasHeader, batchSize });
          expect(result).toEqual({
            type: "parse",
            message: expect.stringContaining(`CSV の${hasHeader ? 3 : 2}番目のレコードの2列目:`),
          });
          expect(result).toHaveProperty("message", expect.stringContaining(reason));
          for (const property of ["sql", "rowCount", "columnCount", "statementCount"]) {
            expect(result).not.toHaveProperty(property);
          }
        });

        it(`${label}: 正常な引用符、末尾空セル、不足列のNULL補完を維持する`, () => {
          const input = `${hasHeader ? "id,name,note\n" : ""}1,"alpha,beta","line1\n""line2"""\n2,beta,\n3,gamma`;
          const result = generateSql(input, {
            ...DEFAULT_OPTIONS,
            dialect,
            hasHeader,
            batchSize,
            convertNull: false,
          });
          expect(result).toMatchObject({
            rowCount: 3,
            columnCount: 3,
            statementCount: Math.ceil(3 / batchSize),
            sql: expect.stringContaining("(1, 'alpha,beta', 'line1\n\"line2\"')"),
          });
          expect(result).toHaveProperty("sql", expect.stringContaining("(2, 'beta', '')"));
          expect(result).toHaveProperty("sql", expect.stringContaining("(3, 'gamma', NULL)"));
        });
      }
    }
  }
});
