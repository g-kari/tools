import { describe, expect, it } from "vite-plus/test";
import { marked } from "marked";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
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
    expect(lines[1]).toMatch(/:-+\s/);
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
    expect(lines[1]).toMatch(/\s-+:/);
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

describe("generateMarkdown rendered cell semantics", () => {
  it("linear-time guard: backslash runを改行の有無に関わらず消費する", () => {
    const source = readFileSync(
      new URL("../../app/utils/markdown-table.ts", import.meta.url),
      "utf8",
    );
    // 改行がない長いrunで位置ごとに再試行する旧パターンを戻さない。
    expect(source).not.toContain(String.raw`/(\\*)(?:\r\n|\r|\n)/g`);
    expect(source).toContain(String.raw`/\\+|\r\n|\r|\n/g`);
  });

  it.each([4096, 8192, 16384])("長さ %i のbackslash runを改行ありなしで保持する", (size) => {
    const run = "\\".repeat(size);
    const plain = generateMarkdown({
      columns: [{ header: "header", align: "none" }],
      rows: [[run]],
    });
    expect(plain.split("\n")[2]).toBe(`| ${run} |`);
    const multiline = generateMarkdown({
      columns: [{ header: "header", align: "none" }],
      rows: [[`a${run}\nb`]],
    });
    expect(multiline.split("\n")).toHaveLength(3);
    expect(multiline.split("\n")[2]).toBe(`| a${run.repeat(2)}<br>b |`);
  });

  it.each(["\n", "\r\n", "\r"])(
    "改行 %j の直前のbackslashを失わずheader/bodyのbrを描画する",
    (newline) => {
      for (const count of [0, 1, 2, 3, 4]) {
        for (const before of ["a", "a|"]) {
          for (const after of ["b", "|b"]) {
            const value = before + "\\".repeat(count) + newline + after;
            const csv = [value, value].map((cell) => '"' + cell + '"').join("\n");
            const markdown = generateMarkdown(parseCSV(csv));
            const dom = new JSDOM(marked.parse(markdown, { async: false, gfm: true }));
            const document = dom.window.document;
            expect(document.querySelectorAll("th,td")).toHaveLength(2);
            for (const cell of document.querySelectorAll("th,td")) {
              expect(cell.textContent).toBe(before + "\\".repeat(count) + after);
              expect(cell.querySelectorAll("br")).toHaveLength(1);
              expect(cell.innerHTML).not.toContain("&lt;br&gt;");
            }
            expect(markdown.split("\n")).toHaveLength(3);
            expect(markdown).toContain(
              before.replace(/\|/g, "\\|") +
                "\\".repeat(count * 2) +
                "<br>" +
                after.replace(/\|/g, "\\|"),
            );
            dom.window.close();
          }
        }
      }
    },
  );

  it("セルの通常のraw Markdown記法と改行に隣接しないbackslashを維持する", () => {
    const value = "**bold** [link](https://example.invalid/) `code` \\*literal\\*";
    const markdown = generateMarkdown({
      columns: [{ header: "**header**", align: "none" }],
      rows: [[value]],
    });
    expect(markdown).toContain(value);
    const document = new JSDOM(marked.parse(markdown, { async: false })).window.document;
    expect(document.querySelector("th strong")?.textContent).toBe("header");
    expect(document.querySelector("td strong")?.textContent).toBe("bold");
    expect(document.querySelector("td a")?.getAttribute("href")).toBe("https://example.invalid/");
    expect(document.querySelector("td code")?.textContent).toBe("code");
    expect(document.querySelector("td")?.textContent).toContain("*literal*");
    expect(document.querySelector("td em")).toBeNull();
  });

  it("複数行inline-codeではbrが文字となる既知のraw Markdown制限を記録する", () => {
    const markdown = generateMarkdown(parseCSV('A\n"`a\nb`"'));
    const document = new JSDOM(marked.parse(markdown, { async: false })).window.document;
    expect(document.querySelector("td code")?.textContent).toBe("a<br>b");
    expect(document.querySelector("td br")).toBeNull();
  });
});

describe("parseCSV", () => {
  it.each(["\t\n", " \t \r\n", "\t\r"])(
    "先頭の空白物理行 %j のタブをヘッダー区切りと誤認しない",
    (prefix) => {
      const table = parseCSV(prefix + 'A,B\n"x,y",z');
      expect(table.columns.map((column) => column.header)).toEqual(["A", "B"]);
      expect(table.rows).toEqual([["x,y", "z"]]);
    },
  );
  it("引用符内のカンマ・改行・空白・二重引用符を保持する", () => {
    const result = parseCSV('"名,前",備考\r\n"  Alice  ","前\r\n\r\n""後"""');
    expect(result.columns.map((column) => column.header)).toEqual(["名,前", "備考"]);
    expect(result.rows).toEqual([["  Alice  ", '前\r\n\r\n"後"']]);
  });

  it.each(["\n", "\r\n", "\r"])("%j のレコード区切りを扱う", (newline) => {
    expect(parseCSV(`A,B${newline}1,2${newline}3,4${newline}`).rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("引用符の外側の空白だけを除去する", () => {
    const result = parseCSV(' A , B \n  plain  , " quoted "  ');
    expect(result.columns.map((column) => column.header)).toEqual(["A", "B"]);
    expect(result.rows).toEqual([["plain", " quoted "]]);
  });

  it("不足列を空文字で補完し末尾と引用符付きの空セルを保持する", () => {
    expect(parseCSV('A,B,C\n1,\n"",,\n2').rows).toEqual([
      ["1", "", ""],
      ["", "", ""],
      ["2", "", ""],
    ]);
    expect(parseCSV('A\n""').rows).toEqual([[""]]);
  });

  it.each(['A,B\n1,"open', 'A,B\n1,ab"cd', 'A,B\n1,"ok"tail'])(
    "不正な引用符をレコード・列番号付きで拒否する: %j",
    (csv) => expect(() => parseCSV(csv)).toThrow(/レコード 2.*列 2/),
  );

  it.each(["A,B\n1,2,3", "A,B\n1,2,", 'A,B\n"one\ntwo",2,3'])(
    "超過列を切り捨てず拒否する: %j",
    (csv) => expect(() => parseCSV(csv)).toThrow(/レコード 2.*2 列.*3 列/),
  );

  it("空の物理行は無視し引用符内の空行は保持する", () => {
    expect(parseCSV('\n  \nA,B\n\n1,"x\n\ny"\n  \n').rows).toEqual([["1", "x\n\ny"]]);
  });

  it("先頭のBOMをヘッダーに含めない", () => {
    expect(parseCSV('\uFEFF"A",B\n1,2').columns[0].header).toBe("A");
  });

  it("TSVの引用符は従来どおり文字として扱いカンマとtrimを維持する", () => {
    expect(parseCSV(' A \t B \n "x,y" \t "z" ').rows).toEqual([['"x,y"', '"z"']]);
  });

  it.each(["\n", "\r\n", "\r"])("TSVの引用符が物理行 %j を跨ぐ疑いがあれば拒否する", (newline) => {
    expect(() => parseCSV(`A\tB${newline}"x${newline}y"\tz`)).toThrow(/レコード 2.*列 1/);
  });

  it("TSVの引用符付きタブと閉じ忘れは曖昧な列へ分解せず拒否する", () => {
    expect(() => parseCSV('A\tB\n"x\ty"\tz')).toThrow(/レコード 2.*列 1/);
    expect(() => parseCSV('A\tB\n"open\tz')).toThrow(/レコード 2.*列 1/);
  });

  it("TSVの同一セル内で閉じる引用符と空の先頭列を維持する", () => {
    expect(parseCSV('\tB\n"x"\t"y"').rows).toEqual([['"x"', '"y"']]);
    expect(parseCSV("\tB\nx\ty").columns.map((column) => column.header)).toEqual(["", "B"]);
  });

  it("TSVの超過列も切り捨てず拒否する", () => {
    expect(() => parseCSV("A\tB\n1\t2\t3")).toThrow(/レコード 2.*2 列.*3 列/);
  });

  it("CSVの引用符内やデータ内のタブでTSVへ切り替えない", () => {
    expect(parseCSV('A,B\n"x\ty",z').rows).toEqual([["x\ty", "z"]]);
    expect(parseCSV("A,B\nx\ty,z").rows).toEqual([["x\ty", "z"]]);
    expect(parseCSV('"A\tB",C\nx,y').columns[0].header).toBe("A\tB");
    expect(parseCSV("A\nx\ty").rows).toEqual([["x\ty"]]);
    expect(parseCSV('"A\nB",C\n"x\ty",z').rows).toEqual([["x\ty", "z"]]);
  });

  it("引用符付きの空白と空文字のレコードを空行と区別する", () => {
    expect(parseCSV('A\n  \n" "\n""\n').rows).toEqual([[" "], [""]]);
  });

  it("閉じない引用符内のタブを曖昧なTSVとして解釈しない", () => {
    expect(() => parseCSV('"A\tB\nx\ty')).toThrow(/レコード 1.*列 1/);
    expect(() => parseCSV('\t\nA,B\n1,"open')).toThrow(/レコード 2.*列 2/);
  });

  it("セルとヘッダーの改行をMarkdownの同じ行内のbrへ変換する", () => {
    const markdown = generateMarkdown(parseCSV('"A\nB",C\n"x\r\ny\rz\nq|r",s'));
    expect(markdown.split("\n")).toHaveLength(3);
    expect(markdown).toContain("A<br>B");
    expect(markdown).toContain("x<br>y<br>z<br>q\\|r");
  });

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
