import { describe, expect, it } from "vitest";
import {
  createEmptyTable,
  generateMarkdown,
  parseCSV,
  addColumn,
  removeColumn,
  addRow,
  removeRow,
  setColumnAlign,
  updateHeader,
  updateCell,
} from "../../app/utils/markdown-table";

describe("createEmptyTable", () => {
  it("指定した列数・行数の空テーブルを生成する", () => {
    const table = createEmptyTable(3, 2);
    expect(table.columns).toHaveLength(3);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]).toHaveLength(3);
  });

  it("全セルが空文字列である", () => {
    const table = createEmptyTable(2, 2);
    for (const row of table.rows) {
      for (const cell of row) {
        expect(cell).toBe("");
      }
    }
  });

  it("デフォルトの整列はnoneである", () => {
    const table = createEmptyTable(2, 1);
    for (const col of table.columns) {
      expect(col.align).toBe("none");
    }
  });

  it("列ヘッダーのデフォルト名が設定される", () => {
    const table = createEmptyTable(3, 1);
    expect(table.columns[0].header).toBe("列1");
    expect(table.columns[1].header).toBe("列2");
    expect(table.columns[2].header).toBe("列3");
  });
});

describe("generateMarkdown", () => {
  it("基本的なテーブルを生成する", () => {
    const table = {
      columns: [
        { header: "名前", align: "none" as const },
        { header: "年齢", align: "none" as const },
      ],
      rows: [
        ["Alice", "30"],
        ["Bob", "25"],
      ],
    };
    const result = generateMarkdown(table);
    expect(result).toContain("名前");
    expect(result).toContain("年齢");
    expect(result).toContain("Alice");
    expect(result).toContain("Bob");
  });

  it("3行のMarkdownを生成する（ヘッダー・区切り・データ）", () => {
    const table = {
      columns: [{ header: "A", align: "none" as const }],
      rows: [["x"]],
    };
    const lines = generateMarkdown(table).split("\n");
    expect(lines).toHaveLength(3);
  });

  it("区切り行はパイプで始まり終わる", () => {
    const table = {
      columns: [{ header: "Col", align: "none" as const }],
      rows: [["val"]],
    };
    const lines = generateMarkdown(table).split("\n");
    expect(lines[1]).toMatch(/^\|.*\|$/);
  });

  it("left整列は:で始まるハイフン列の形式", () => {
    const table = {
      columns: [{ header: "Col", align: "left" as const }],
      rows: [["val"]],
    };
    const lines = generateMarkdown(table).split("\n");
    // :-- または :--- など :で始まる形式
    expect(lines[1]).toMatch(/:\-+\s/);
    expect(lines[1]).not.toMatch(/:.*:/);
  });

  it("center整列は:---:の形式", () => {
    const table = {
      columns: [{ header: "Col", align: "center" as const }],
      rows: [["val"]],
    };
    const lines = generateMarkdown(table).split("\n");
    expect(lines[1]).toMatch(/:.*:/);
  });

  it("right整列はハイフン列:で終わる形式", () => {
    const table = {
      columns: [{ header: "Col", align: "right" as const }],
      rows: [["val"]],
    };
    const lines = generateMarkdown(table).split("\n");
    // --: または ---: など :で終わる形式
    expect(lines[1]).toMatch(/\s\-+:/);
    expect(lines[1]).not.toMatch(/:.*:/);
  });

  it("セル内の|がエスケープされる", () => {
    const table = {
      columns: [{ header: "A|B", align: "none" as const }],
      rows: [["x|y"]],
    };
    const result = generateMarkdown(table);
    expect(result).toContain("A\\|B");
    expect(result).toContain("x\\|y");
  });

  it("列が空の場合は空文字列を返す", () => {
    const table = { columns: [], rows: [] };
    expect(generateMarkdown(table)).toBe("");
  });

  it("最小幅は3文字以上", () => {
    const table = {
      columns: [{ header: "A", align: "none" as const }],
      rows: [["B"]],
    };
    const lines = generateMarkdown(table).split("\n");
    const sepCell = lines[1].replace(/\|/g, "").trim();
    expect(sepCell.length).toBeGreaterThanOrEqual(3);
  });

  it("長いセル内容に合わせて幅が広がる", () => {
    const table = {
      columns: [{ header: "短", align: "none" as const }],
      rows: [["これは長いセルの内容です"]],
    };
    const lines = generateMarkdown(table).split("\n");
    const headerLine = lines[0];
    const dataLine = lines[2];
    // 各行の幅が同じ（パディングが揃っている）
    expect(headerLine.length).toBe(dataLine.length);
  });

  it("データ行なしでもヘッダーと区切りを生成する", () => {
    const table = {
      columns: [{ header: "只", align: "none" as const }],
      rows: [],
    };
    const lines = generateMarkdown(table).split("\n");
    expect(lines).toHaveLength(2);
  });
});

describe("parseCSV", () => {
  it("空文字列はcreateEmptyTable(3, 2)を返す", () => {
    const result = parseCSV("");
    expect(result.columns).toHaveLength(3);
    expect(result.rows).toHaveLength(2);
  });

  it("空白のみの文字列はcreateEmptyTable(3, 2)を返す", () => {
    const result = parseCSV("   \n  ");
    expect(result.columns).toHaveLength(3);
  });

  it("CSVをパースする", () => {
    const csv = "名前,年齢\nAlice,30\nBob,25";
    const result = parseCSV(csv);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].header).toBe("名前");
    expect(result.columns[1].header).toBe("年齢");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0][0]).toBe("Alice");
    expect(result.rows[0][1]).toBe("30");
    expect(result.rows[1][0]).toBe("Bob");
  });

  it("TSVをパースする", () => {
    const tsv = "名前\t年齢\nAlice\t30";
    const result = parseCSV(tsv);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[1].header).toBe("年齢");
    expect(result.rows[0][1]).toBe("30");
  });

  it("タブが含まれていればTSVとして解析する", () => {
    const mixed = "A\tB\nx\ty";
    const result = parseCSV(mixed);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].header).toBe("A");
    expect(result.columns[1].header).toBe("B");
  });

  it("1行目（ヘッダーのみ）でもパースできる", () => {
    const csv = "Col1,Col2,Col3";
    const result = parseCSV(csv);
    expect(result.columns).toHaveLength(3);
    expect(result.rows).toHaveLength(0);
  });

  it("デフォルトの整列はnoneである", () => {
    const csv = "A,B\n1,2";
    const result = parseCSV(csv);
    for (const col of result.columns) {
      expect(col.align).toBe("none");
    }
  });

  it("空行を除外する", () => {
    const csv = "A,B\n\n1,2\n\n3,4";
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });
});

describe("addColumn", () => {
  it("列が1つ増える", () => {
    const table = createEmptyTable(2, 2);
    const result = addColumn(table);
    expect(result.columns).toHaveLength(3);
    expect(result.rows[0]).toHaveLength(3);
    expect(result.rows[1]).toHaveLength(3);
  });

  it("追加した列のヘッダーが設定される", () => {
    const table = createEmptyTable(2, 1);
    const result = addColumn(table);
    expect(result.columns[2].header).toBe("列3");
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 2);
    addColumn(table);
    expect(table.columns).toHaveLength(2);
  });
});

describe("removeColumn", () => {
  it("指定列が削除される", () => {
    const table = {
      columns: [
        { header: "A", align: "none" as const },
        { header: "B", align: "none" as const },
        { header: "C", align: "none" as const },
      ],
      rows: [["1", "2", "3"]],
    };
    const result = removeColumn(table, 1);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].header).toBe("A");
    expect(result.columns[1].header).toBe("C");
    expect(result.rows[0]).toEqual(["1", "3"]);
  });

  it("最初の列を削除できる", () => {
    const table = createEmptyTable(3, 1);
    const result = removeColumn(table, 0);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].header).toBe("列2");
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(3, 1);
    removeColumn(table, 0);
    expect(table.columns).toHaveLength(3);
  });
});

describe("addRow", () => {
  it("行が1つ増える", () => {
    const table = createEmptyTable(3, 2);
    const result = addRow(table);
    expect(result.rows).toHaveLength(3);
  });

  it("追加行のセル数は列数に等しい", () => {
    const table = createEmptyTable(4, 1);
    const result = addRow(table);
    expect(result.rows[1]).toHaveLength(4);
    expect(result.rows[1].every((c) => c === "")).toBe(true);
  });

  it("行が0の状態でも追加できる", () => {
    const table = { columns: [{ header: "A", align: "none" as const }], rows: [] };
    const result = addRow(table);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveLength(1);
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 2);
    addRow(table);
    expect(table.rows).toHaveLength(2);
  });
});

describe("removeRow", () => {
  it("指定行が削除される", () => {
    const table = {
      columns: [{ header: "A", align: "none" as const }],
      rows: [["1"], ["2"], ["3"]],
    };
    const result = removeRow(table, 1);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0][0]).toBe("1");
    expect(result.rows[1][0]).toBe("3");
  });

  it("最後の行を削除できる", () => {
    const table = createEmptyTable(2, 3);
    const result = removeRow(table, 2);
    expect(result.rows).toHaveLength(2);
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 3);
    removeRow(table, 0);
    expect(table.rows).toHaveLength(3);
  });
});

describe("setColumnAlign", () => {
  it("指定列の整列がleftに変更される", () => {
    const table = createEmptyTable(3, 1);
    const result = setColumnAlign(table, 1, "left");
    expect(result.columns[1].align).toBe("left");
  });

  it("指定列の整列がcenterに変更される", () => {
    const table = createEmptyTable(2, 1);
    const result = setColumnAlign(table, 0, "center");
    expect(result.columns[0].align).toBe("center");
  });

  it("指定列の整列がrightに変更される", () => {
    const table = createEmptyTable(2, 1);
    const result = setColumnAlign(table, 0, "right");
    expect(result.columns[0].align).toBe("right");
  });

  it("他の列は変更されない", () => {
    const table = createEmptyTable(3, 1);
    const result = setColumnAlign(table, 1, "center");
    expect(result.columns[0].align).toBe("none");
    expect(result.columns[2].align).toBe("none");
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 1);
    setColumnAlign(table, 0, "right");
    expect(table.columns[0].align).toBe("none");
  });
});

describe("updateHeader", () => {
  it("指定列のヘッダーが更新される", () => {
    const table = createEmptyTable(2, 1);
    const result = updateHeader(table, 0, "新しいヘッダー");
    expect(result.columns[0].header).toBe("新しいヘッダー");
  });

  it("他の列のヘッダーは変更されない", () => {
    const table = createEmptyTable(3, 1);
    const result = updateHeader(table, 1, "変更後");
    expect(result.columns[0].header).toBe("列1");
    expect(result.columns[2].header).toBe("列3");
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 1);
    updateHeader(table, 0, "changed");
    expect(table.columns[0].header).toBe("列1");
  });
});

describe("updateCell", () => {
  it("指定セルの値が更新される", () => {
    const table = createEmptyTable(2, 2);
    const result = updateCell(table, 1, 0, "テスト値");
    expect(result.rows[1][0]).toBe("テスト値");
  });

  it("他のセルは変更されない", () => {
    const table = createEmptyTable(2, 2);
    const result = updateCell(table, 0, 0, "テスト");
    expect(result.rows[0][1]).toBe("");
    expect(result.rows[1][0]).toBe("");
    expect(result.rows[1][1]).toBe("");
  });

  it("元のテーブルを変更しない（イミュータブル）", () => {
    const table = createEmptyTable(2, 2);
    updateCell(table, 0, 0, "changed");
    expect(table.rows[0][0]).toBe("");
  });
});

describe("イミュータブル操作の確認", () => {
  it("全ての操作が新しいオブジェクトを返す", () => {
    const table = createEmptyTable(3, 3);
    expect(addColumn(table)).not.toBe(table);
    expect(removeColumn(table, 0)).not.toBe(table);
    expect(addRow(table)).not.toBe(table);
    expect(removeRow(table, 0)).not.toBe(table);
    expect(setColumnAlign(table, 0, "left")).not.toBe(table);
    expect(updateHeader(table, 0, "X")).not.toBe(table);
    expect(updateCell(table, 0, 0, "X")).not.toBe(table);
  });
});

describe("往復変換", () => {
  it("CSVをパースしてMarkdownに変換できる", () => {
    const csv = "名前,年齢\nAlice,30\nBob,25";
    const table = parseCSV(csv);
    const markdown = generateMarkdown(table);
    expect(markdown).toContain("名前");
    expect(markdown).toContain("Alice");
    expect(markdown).toContain("Bob");
    const lines = markdown.split("\n");
    expect(lines).toHaveLength(4); // ヘッダー + 区切り + データ2行
  });
});
