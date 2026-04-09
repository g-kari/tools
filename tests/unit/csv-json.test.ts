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
  });

  describe("エラーケース", () => {
    it("空文字列でエラーをスローする", () => {
      expect(() => csvToJson("", ",", true)).toThrow("CSVデータが空です");
    });

    it("空白のみでエラーをスローする", () => {
      expect(() => csvToJson("   \n  ", ",", true)).toThrow("CSVデータが空です");
    });
  });
});

describe("jsonToCsv", () => {
  describe("オブジェクト配列の変換", () => {
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
  });
});
