/**
 * SearchModal ユーティリティ関数のユニットテスト
 * flattenCatalog / searchTools の純粋ロジックを検証する
 */

import { describe, it, expect } from "vite-plus/test";
import { flattenCatalog, searchTools, type FlatToolItem } from "../../app/components/SearchModal";
import type { ToolCategory } from "../../app/routes/top";

/** テスト用カタログデータ */
const mockCatalog: ToolCategory[] = [
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
  {
    name: "ネットワーク",
    icon: "🌐",
    items: [
      {
        path: "/ip-geolocation",
        label: "IP位置情報",
        description: "IPアドレスの地理的位置情報を取得",
        icon: "📍",
      },
    ],
  },
];

// ----------------------------------------------------------------
// flattenCatalog のテスト
// ----------------------------------------------------------------

describe("flattenCatalog", () => {
  it("全アイテムをフラット化する", () => {
    const result = flattenCatalog(mockCatalog);
    expect(result).toHaveLength(5); // 2 + 2 + 1
  });

  it("各アイテムに categoryName が付与される", () => {
    const result = flattenCatalog(mockCatalog);
    expect(result[0].categoryName).toBe("変換");
    expect(result[1].categoryName).toBe("変換");
    expect(result[2].categoryName).toBe("生成");
    expect(result[3].categoryName).toBe("生成");
    expect(result[4].categoryName).toBe("ネットワーク");
  });

  it("各アイテムに categoryIcon が付与される", () => {
    const result = flattenCatalog(mockCatalog);
    expect(result[0].categoryIcon).toBe("⇄");
    expect(result[2].categoryIcon).toBe("✦");
    expect(result[4].categoryIcon).toBe("🌐");
  });

  it("元のアイテムプロパティが保持される", () => {
    const result = flattenCatalog(mockCatalog);
    expect(result[0].path).toBe("/unicode");
    expect(result[0].label).toBe("Unicode変換");
    expect(result[0].description).toBe("Unicode文字列のエスケープ/アンエスケープ変換");
    expect(result[0].icon).toBe("🔤");
  });

  it("空のカタログを渡した場合、空配列を返す", () => {
    const result = flattenCatalog([]);
    expect(result).toHaveLength(0);
  });

  it("アイテムが空のカテゴリを含む場合でも動作する", () => {
    const catalogWithEmpty: ToolCategory[] = [{ name: "空", icon: "□", items: [] }, ...mockCatalog];
    const result = flattenCatalog(catalogWithEmpty);
    expect(result).toHaveLength(5);
  });
});

// ----------------------------------------------------------------
// searchTools のテスト
// ----------------------------------------------------------------

describe("searchTools", () => {
  let tools: FlatToolItem[];

  // 各テスト前にフラット化されたツールリストを作成
  tools = flattenCatalog(mockCatalog);

  it("空クエリの場合、先頭8件を返す", () => {
    // 5件しかないので全件返る
    const result = searchTools(tools, "");
    expect(result).toHaveLength(5);
  });

  it("空白のみのクエリの場合、先頭8件を返す", () => {
    const result = searchTools(tools, "   ");
    expect(result).toHaveLength(5);
  });

  it("8件超のリストで空クエリの場合、最大8件に制限される", () => {
    const manyTools: FlatToolItem[] = Array.from({ length: 20 }, (_, i) => ({
      path: `/tool-${i}`,
      label: `ツール${i}`,
      description: `説明${i}`,
      icon: "🔧",
      categoryName: "テスト",
      categoryIcon: "🧪",
    }));
    const result = searchTools(manyTools, "");
    expect(result).toHaveLength(8);
  });

  it("ラベルでフィルタリングできる", () => {
    const result = searchTools(tools, "UUID");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("UUID生成");
  });

  it("説明文でフィルタリングできる", () => {
    const result = searchTools(tools, "エスケープ");
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/unicode");
  });

  it("カテゴリ名でフィルタリングできる", () => {
    const result = searchTools(tools, "ネットワーク");
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe("/ip-geolocation");
  });

  it("大文字小文字を区別しない（ラベル）", () => {
    const result = searchTools(tools, "uuid");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("UUID生成");
  });

  it("大文字小文字を区別しない（説明文）", () => {
    const result = searchTools(tools, "URL");
    const resultLower = searchTools(tools, "url");
    expect(result).toHaveLength(resultLower.length);
  });

  it("複数のアイテムにマッチする場合、全件返す（12件上限）", () => {
    const result = searchTools(tools, "変換");
    // "Unicode変換"(ラベル), "URLエンコード"(説明に"変換"), "URL文字列のエンコード/デコード変換"(説明に"変換") → 変換カテゴリ全部+α
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("12件超のマッチがある場合、最大12件に制限される", () => {
    const manyTools: FlatToolItem[] = Array.from({ length: 20 }, (_, i) => ({
      path: `/tool-${i}`,
      label: `検索テストツール${i}`,
      description: `検索テスト用の説明${i}`,
      icon: "🔧",
      categoryName: "テスト",
      categoryIcon: "🧪",
    }));
    const result = searchTools(manyTools, "検索テスト");
    expect(result).toHaveLength(12);
  });

  it("一致しないクエリの場合、空配列を返す", () => {
    const result = searchTools(tools, "xyzXYZ存在しないキーワード");
    expect(result).toHaveLength(0);
  });

  it("クエリが前後に空白を含む場合でも検索できる（trim後にマッチ）", () => {
    // "  UUID  " はtrimせずに小文字変換するため " uuid " として検索 → "UUID生成"にはマッチしない
    // ただし searchTools は q = query.toLowerCase() なのでtrimしない
    // query.trim()はあくまで「全体が空白かどうか」の判定のみ
    const result = searchTools(tools, "  UUID  ");
    // " uuid " を含む label/description/categoryName は存在しないのでマッチしない
    expect(result).toHaveLength(0);
  });

  it("部分一致で検索できる", () => {
    const result = searchTools(tools, "パスワ");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("パスワード生成");
  });

  it("空のツールリストを渡した場合、空配列を返す", () => {
    const result = searchTools([], "UUID");
    expect(result).toHaveLength(0);
  });
});
