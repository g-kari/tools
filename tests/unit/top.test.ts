import { describe, it, expect } from "vite-plus/test";
import { filterCatalog } from "../../app/routes/top";

/** テスト用カタログデータ */
const mockCatalog = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      {
        path: "/unicode",
        label: "Unicode変換",
        description: "Unicode文字列のエスケープ/アンエスケープ変換",
        icon: "🔤",
      },
      {
        path: "/url-encode",
        label: "URLエンコード",
        description: "URL文字列のエンコード/デコード変換",
        icon: "🔗",
      },
      {
        path: "/json",
        label: "JSON整形",
        description: "JSONデータの整形・検証・圧縮",
        icon: "{ }",
      },
    ],
  },
  {
    name: "生成",
    icon: "✦",
    items: [
      {
        path: "/uuid",
        label: "UUID生成",
        description: "UUID v4のランダム生成",
        icon: "🔑",
      },
      {
        path: "/password-generator",
        label: "パスワード生成",
        description: "安全なランダムパスワードの生成",
        icon: "🔐",
      },
    ],
  },
];

describe("filterCatalog", () => {
  it.each(["JSON 圧縮", "圧縮 json", " ＪＳＯＮ　圧縮 ", "json\t圧縮", "json\n圧縮"])(
    "複数語を表記や順序によらずAND検索する: %s",
    (query) => {
      expect(filterCatalog(mockCatalog, query)[0]?.items.map((item) => item.path)).toEqual([
        "/json",
      ]);
    },
  );

  it("カテゴリとパスを組み合わせて検索する", () => {
    expect(filterCatalog(mockCatalog, "変換 /url-encode")[0]?.items[0].path).toBe("/url-encode");
  });

  it("一語でも一致しない場合は返さない", () => {
    expect(filterCatalog(mockCatalog, "JSON UUID")).toEqual([]);
  });

  it("カテゴリを検索して元のツール順を保持する", () => {
    expect(filterCatalog(mockCatalog, "生成")[0].items.map((item) => item.path)).toEqual([
      "/uuid",
      "/password-generator",
    ]);
  });

  it("全角・半角かなと結合文字を同じ表記として扱う", () => {
    expect(filterCatalog(mockCatalog, "ﾊﾟｽﾜｰﾄﾞ")[0]?.items[0].path).toBe("/password-generator");
  });

  it("単語を別ツールや別フィールドの境界でつなげない", () => {
    expect(filterCatalog(mockCatalog, "変換URL")).toEqual([]);
  });

  it("正規表現の記号はリテラルとして扱う", () => {
    expect(filterCatalog(mockCatalog, ".*")).toEqual([]);
  });

  it("空文字列の場合は全カタログを返す", () => {
    const result = filterCatalog(mockCatalog, "");
    expect(result).toEqual(mockCatalog);
  });

  it("空白のみの場合は全カタログを返す", () => {
    const result = filterCatalog(mockCatalog, "   ");
    expect(result).toEqual(mockCatalog);
  });

  it("ラベル名でフィルタリングできる", () => {
    const result = filterCatalog(mockCatalog, "UUID");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("生成");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].label).toBe("UUID生成");
  });

  it("説明文でフィルタリングできる", () => {
    const result = filterCatalog(mockCatalog, "エスケープ");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("変換");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].label).toBe("Unicode変換");
  });

  it("大文字小文字を区別しない", () => {
    const result = filterCatalog(mockCatalog, "json");
    expect(result).toHaveLength(1);
    expect(result[0].items[0].label).toBe("JSON整形");
  });

  it("一致するツールがないカテゴリは除外される", () => {
    const result = filterCatalog(mockCatalog, "UUID");
    const categoryNames = result.map((cat) => cat.name);
    expect(categoryNames).not.toContain("変換");
  });

  it("一致するツールがない場合は空配列を返す", () => {
    const result = filterCatalog(mockCatalog, "存在しないツール名XYZ");
    expect(result).toHaveLength(0);
  });

  it("複数カテゴリにまたがる検索が機能する", () => {
    const result = filterCatalog(mockCatalog, "変換");
    // 「変換」はカテゴリ「変換」のラベルと「オーディオ変換」などに含まれる
    // モックデータでは「URLエンコード」の説明にも「変換」が含まれる
    expect(result.length).toBeGreaterThan(0);
  });

  it("各カテゴリのitemsが正しくフィルタリングされる", () => {
    const result = filterCatalog(mockCatalog, "パスワード");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("生成");
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].path).toBe("/password-generator");
  });

  it("元のカタログオブジェクトを変更しない（イミュータビリティ）", () => {
    const originalLength = mockCatalog[0].items.length;
    filterCatalog(mockCatalog, "UUID");
    expect(mockCatalog[0].items.length).toBe(originalLength);
  });
});
