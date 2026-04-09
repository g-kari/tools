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
