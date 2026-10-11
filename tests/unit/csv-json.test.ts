import { describe, it, expect } from "vite-plus/test";
import { csvToJson, jsonToCsv } from "../../app/routes/csv-json";

describe("csvToJson", () => {
  describe("ヘッダーあり変換", () => {
    it("基本的なCSVをオブジェクト配列に変換する", () => {
      const csv = "name,age\n田中,30\n佐藤,25";
      const result = JSON.parse(csvToJson(csv, ",", true));
      expect(result).toEqual([
        { name: "田中", age: "30" },
        { name: "佐藤", age: "25" },
      ]);
    });

    it("タブ区切りのCSVを変換する", () => {
      const csv = "name\tage\n田中\t30";
      const result = JSON.parse(csvToJson(csv, "\t", true));
      expect(result).toEqual([{ name: "田中", age: "30" }]);
    });

    it("セミコロン区切りのCSVを変換する", () => {
      const csv = "name;age\n田中;30";
      const result = JSON.parse(csvToJson(csv, ";", true));
      expect(result).toEqual([{ name: "田中", age: "30" }]);
    });

    it("ダブルクォートで囲まれたフィールドを正しく扱う", () => {
      const csv = 'name,city\n田中,"東京,渋谷"';
      const result = JSON.parse(csvToJson(csv, ",", true));
      expect(result).toEqual([{ name: "田中", city: "東京,渋谷" }]);
    });

    it("ダブルクォートのエスケープを正しく扱う", () => {
      const csv = 'name,desc\n田中,"彼は""天才""だ"';
      const result = JSON.parse(csvToJson(csv, ",", true));
      expect(result[0].desc).toBe('彼は"天才"だ');
    });

    it("値が不足しているフィールドは空文字にする", () => {
      const csv = "a,b,c\n1,2";
      const result = JSON.parse(csvToJson(csv, ",", true));
      expect(result[0].c).toBe("");
    });

    it("引用符内の改行と空行を1つのフィールドとして保持する", () => {
      const csv = 'name,note\n田中,"1行目\n\n3行目"\n佐藤,通常';
      expect(JSON.parse(csvToJson(csv, ",", true))).toEqual([
        { name: "田中", note: "1行目\n\n3行目" },
        { name: "佐藤", note: "通常" },
      ]);
    });

    it.each(["\n", "\r\n", "\r"])("レコード区切り %j を扱う", (newline) => {
      const csv = `name,note${newline}田中,"前${newline}後"${newline}佐藤,通常${newline}`;
      expect(JSON.parse(csvToJson(csv, ",", true))).toEqual([
        { name: "田中", note: `前${newline}後` },
        { name: "佐藤", note: "通常" },
      ]);
    });

    it("複数行フィールド内のエスケープされた引用符を保持する", () => {
      const csv = 'name,note\n田中,"彼は""天才""だ\n次の行"';
      expect(JSON.parse(csvToJson(csv, ",", true))).toEqual([
        { name: "田中", note: '彼は"天才"だ\n次の行' },
      ]);
    });

    it("ヘッダーと引用符の有無によらず値の前後の空白を保持する", () => {
      const csv = ' name ,note\n 田中 ,"  メモ  "';
      expect(JSON.parse(csvToJson(csv, ",", true))).toEqual([
        { " name ": " 田中 ", note: "  メモ  " },
      ]);
    });

    it("UTF-8 BOMとレコード間の空行を無視する", () => {
      const csv = '\uFEFFname,note\r\n\r\n田中,"メモ"\r\n \r\n';
      expect(JSON.parse(csvToJson(csv, ",", true))).toEqual([{ name: "田中", note: "メモ" }]);
    });

    it("特殊なプロパティ名もヘッダーとして保持する", () => {
      const csv = "__proto__,constructor\n値,別の値";
      const result = JSON.parse(csvToJson(csv, ",", true));
      expect(Object.keys(result[0])).toEqual(["__proto__", "constructor"]);
      expect(result[0]["__proto__"]).toBe("値");
    });
  });

  describe("ヘッダーなし変換", () => {
    it("CSVを配列の配列に変換する", () => {
      const csv = "1,2,3\n4,5,6";
      const result = JSON.parse(csvToJson(csv, ",", false));
      expect(result).toEqual([
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]);
    });

    it.each([",", "\t", ";"])("区切り文字 %j で複数行フィールドを保持する", (delimiter) => {
      const csv = `"前\n後"${delimiter}"引用符""と${delimiter}区切り"\n次${delimiter}`;
      expect(JSON.parse(csvToJson(csv, delimiter, false))).toEqual([
        ["前\n後", `引用符"と${delimiter}区切り`],
        ["次", ""],
      ]);
    });

    it("空の引用符付きレコードと先頭・末尾の空フィールドを保持する", () => {
      const csv = '\n""\n,値,\n';
      expect(JSON.parse(csvToJson(csv, ",", false))).toEqual([[""], ["", "値", ""]]);
    });

    it("最初と最後のフィールドの空白を保持する", () => {
      expect(JSON.parse(csvToJson("  前,後  ", ",", false))).toEqual([["  前", "後  "]]);
    });

    it("タブのみの空フィールドのレコードを保持する", () => {
      expect(JSON.parse(csvToJson("\t", "\t", false))).toEqual([["", ""]]);
      expect(JSON.parse(csvToJson("a\tb\n\t\nc\td", "\t", false))).toEqual([
        ["a", "b"],
        ["", ""],
        ["c", "d"],
      ]);
    });
  });

  describe("エラーケース", () => {
    it.each([",", "\t", ";"])("重複ヘッダーを %j 区切りで拒否する", (delimiter) => {
      const csv = `name${delimiter}"name"\n前${delimiter}後`;
      expect(() => csvToJson(csv, delimiter, true)).toThrow(
        "CSVヘッダー「name」が重複しています（列 1 と列 2）",
      );
      expect(JSON.parse(csvToJson(csv, delimiter, false))).toEqual([
        ["name", "name"],
        ["前", "後"],
      ]);
    });

    it("空のヘッダー名の重複も拒否し、大文字小文字の違いは保持する", () => {
      expect(() => csvToJson(",\n前,後", ",", true)).toThrow("CSVヘッダー「」が重複");
      expect(JSON.parse(csvToJson("Name,name\n前,後", ",", true))).toEqual([
        { Name: "前", name: "後" },
      ]);
    });

    it("ヘッダーを超える末尾の空セルも黙って捨てない", () => {
      expect(() => csvToJson("name\n田中,", ",", true)).toThrow("ヘッダー 1 列、データ 2 列");
      expect(JSON.parse(csvToJson("name\n田中,", ",", false))).toEqual([["name"], ["田中", ""]]);
    });

    it.each([",", "\t", ";"])("ヘッダーを超える列を %j 区切りで拒否する", (delimiter) => {
      const csv = `name\n"前\n後"${delimiter}追加`;
      expect(() => csvToJson(csv, delimiter, true)).toThrow(
        "CSVのレコード 2 はヘッダーより列数が多い",
      );
      expect(JSON.parse(csvToJson(csv, delimiter, false))).toEqual([["name"], ["前\n後", "追加"]]);
    });

    it("空文字列でエラーをスローする", () => {
      expect(() => csvToJson("", ",", true)).toThrow("CSVデータが空です");
    });

    it("空白のみでエラーをスローする", () => {
      expect(() => csvToJson("   \n  ", ",", true)).toThrow("CSVデータが空です");
    });

    it("引用符が閉じられていない場合にエラーをスローする", () => {
      expect(() => csvToJson('name,note\n田中,"前\n後', ",", true)).toThrow(
        "CSVのダブルクォートが閉じられていません",
      );
    });

    it("引用符の後に不正な文字が続く場合にエラーをスローする", () => {
      expect(() => csvToJson('"値"続き,他', ",", false)).toThrow(
        "引用符を閉じた後には区切り文字または改行を指定してください",
      );
    });

    it("引用符がフィールドの途中にある場合にエラーをスローする", () => {
      expect(() => csvToJson('前"後,他', ",", false)).toThrow(
        "引用符を含むフィールド全体をダブルクォートで囲んでください",
      );
    });
  });
});

describe("jsonToCsv", () => {
  describe("オブジェクト配列の変換", () => {
    it("後続のオブジェクトだけに存在するキーも出現順の列として保持する", () => {
      const json = '[{"name":"田中"},{"email":"taro@example.com","name":"佐藤"},{"active":false}]';
      expect(jsonToCsv(json, ",")).toBe(
        "name,email,active\n田中,,\n佐藤,taro@example.com,\n,,false",
      );
    });

    it("整数形式のキーは各レコードのObject.keys順で初出の列に追加する", () => {
      const json = '[{"b":1,"10":"ten","2":"two"},{"1":"one","b":2,"a":3}]';
      expect(jsonToCsv(json, ",")).toBe("2,10,b,1,a\ntwo,ten,1,,\n,,2,one,3");
    });

    it.each([",", "\t", ";"])(
      "空の先頭レコードと後続の複数行・区切り文字を %j で保持する",
      (delimiter) => {
        const json = JSON.stringify([{}, { note: `前\n後${delimiter}値` }, { other: " " }]);
        expect(JSON.parse(csvToJson(jsonToCsv(json, delimiter), delimiter, true))).toEqual([
          { note: "", other: "" },
          { note: `前\n後${delimiter}値`, other: "" },
          { note: "", other: " " },
        ]);
      },
    );

    it("特殊なキーが別のレコードにない場合は継承プロパティを出力しない", () => {
      const json = '[{"__proto__":"値","constructor":"別の値"},{"name":"田中"}]';
      expect(JSON.parse(csvToJson(jsonToCsv(json, ","), ",", true))).toEqual([
        { ["__proto__"]: "値", constructor: "別の値", name: "" },
        { ["__proto__"]: "", constructor: "", name: "田中" },
      ]);
    });

    it("空オブジェクトの行を1列の場合も空のレコードとして保持する", () => {
      expect(jsonToCsv('[{}, {"note":"値"}, {}]', ",")).toBe('note\n""\n値\n""');
    });

    it("オブジェクト配列をCSVに変換する（ヘッダー行あり）", () => {
      const json = JSON.stringify([
        { name: "田中", age: 30 },
        { name: "佐藤", age: 25 },
      ]);
      const result = jsonToCsv(json, ",");
      const lines = result.split("\n");
      expect(lines[0]).toBe("name,age");
      expect(lines[1]).toBe("田中,30");
      expect(lines[2]).toBe("佐藤,25");
    });

    it("カンマを含む値をダブルクォートで囲む", () => {
      const json = JSON.stringify([{ name: "東京,渋谷" }]);
      const result = jsonToCsv(json, ",");
      expect(result).toContain('"東京,渋谷"');
    });

    it('ダブルクォートを含む値は "" でエスケープする', () => {
      const json = JSON.stringify([{ name: '彼は"天才"だ' }]);
      const result = jsonToCsv(json, ",");
      expect(result).toContain('"彼は""天才""だ"');
    });

    it("タブ区切りで変換する", () => {
      const json = JSON.stringify([{ name: "田中", age: 30 }]);
      const result = jsonToCsv(json, "\t");
      expect(result).toBe("name\tage\n田中\t30");
    });

    it("null値は空文字に変換する", () => {
      const json = JSON.stringify([{ name: "田中", age: null }]);
      const result = jsonToCsv(json, ",");
      const lines = result.split("\n");
      expect(lines[1]).toBe("田中,");
    });
  });

  describe("配列の配列の変換", () => {
    it("列数が異なる配列のレコードを失わず保持する", () => {
      const records = [["前"], ["後", "追加"], [""]];
      expect(JSON.parse(csvToJson(jsonToCsv(JSON.stringify(records), ","), ",", false))).toEqual(
        records,
      );
    });
    it("配列の配列をCSVに変換する（ヘッダー行なし）", () => {
      const json = JSON.stringify([
        ["1", "2"],
        ["3", "4"],
      ]);
      const result = jsonToCsv(json, ",");
      expect(result).toBe("1,2\n3,4");
    });
  });

  describe("エラーケース", () => {
    it.each(["[]", "null", "1", '"値"', "true"])(
      "オブジェクト以外の後続レコード %s を拒否する",
      (row) => {
        expect(() => jsonToCsv(`[{"a":1},${row}]`, ",")).toThrow(
          "JSONのレコード 2 はオブジェクトである必要があります",
        );
      },
    );

    it.each(["{}", "null", "1", '"値"', "true"])("配列以外の後続レコード %s を拒否する", (row) => {
      expect(() => jsonToCsv(`[["前"],${row}]`, ",")).toThrow(
        "JSONのレコード 2 は配列である必要があります",
      );
    });

    it.each(["[[]]", '[["前"],[]]'])("CSVで表せない空の配列レコード %s を拒否する", (json) => {
      expect(() => jsonToCsv(json, ",")).toThrow("空の配列です");
    });

    it("全レコードにキーがない場合は空CSVで成功扱いしない", () => {
      expect(() => jsonToCsv("[{},{}]", ",")).toThrow("CSVの列として使用できるキーがありません");
    });

    it("無効なJSONでエラーをスローする", () => {
      expect(() => jsonToCsv("{invalid}", ",")).toThrow("無効なJSON形式です");
    });

    it("配列でないJSONでエラーをスローする", () => {
      expect(() => jsonToCsv('{"a": 1}', ",")).toThrow(
        "JSONはオブジェクトの配列または配列の配列である必要があります",
      );
    });

    it("空配列でエラーをスローする", () => {
      expect(() => jsonToCsv("[]", ",")).toThrow("JSONデータが空の配列です");
    });

    it("プリミティブの配列でエラーをスローする", () => {
      expect(() => jsonToCsv("[1, 2, 3]", ",")).toThrow(
        "JSONはオブジェクトの配列または配列の配列である必要があります",
      );
    });
  });

  describe("ラウンドトリップ変換", () => {
    it("CSV → JSON → CSV のラウンドトリップが保持される", () => {
      const originalCsv = "name,age,city\n田中,30,東京\n佐藤,25,大阪";
      const json = csvToJson(originalCsv, ",", true);
      const backToCsv = jsonToCsv(json, ",");
      expect(backToCsv).toBe(originalCsv);
    });

    it.each([",", "\t", ";"])("区切り文字 %j で複数行と空白を往復変換する", (delimiter) => {
      const original = [
        { " name ": " 田中 ", note: '前\r\n\r\n"後"', other: `a${delimiter}b` },
        { " name ": "佐藤", note: " ", other: "" },
      ];
      const csv = jsonToCsv(JSON.stringify(original), delimiter);
      expect(JSON.parse(csvToJson(csv, delimiter, true))).toEqual(original);
    });

    it("ヘッダーなしで特殊文字・空フィールド・空白を往復変換する", () => {
      const original = [
        ["", '改行\n"引用符"', "  空白  "],
        ["次", "\r\n", ""],
      ];
      const csv = jsonToCsv(JSON.stringify(original), ",");
      expect(JSON.parse(csvToJson(csv, ",", false))).toEqual(original);
    });

    it.each([",", "\t", ";"])("1列の空文字と空白を %j 区切りで往復変換する", (delimiter) => {
      const arrays = [[""], [" "], ["\t"], ["通常"]];
      expect(
        JSON.parse(csvToJson(jsonToCsv(JSON.stringify(arrays), delimiter), delimiter, false)),
      ).toEqual(arrays);
      const records = [{ note: "" }, { note: " " }, { note: "\t" }, { note: "通常" }];
      expect(
        JSON.parse(csvToJson(jsonToCsv(JSON.stringify(records), delimiter), delimiter, true)),
      ).toEqual(records);
    });
  });
});
