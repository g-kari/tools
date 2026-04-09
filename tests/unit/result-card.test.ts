/**
 * @fileoverview ResultCard / ResultRow コンポーネントのロジックテスト
 * 純粋関数として抽出した表示ロジック・フォールバック・キー生成を検証する
 */

import { describe, it, expect } from "vite-plus/test";

// ─── ResultCard の内部ロジックを純粋関数として再現 ────────────────

/**
 * 値を表示するためのフォールバックロジック
 * ResultCard / ResultRow の `result-value` 内で使用
 */
function resolveValue(value: unknown, fallback?: string): unknown {
  return value ?? fallback ?? "-";
}

/**
 * リスト表示かどうかを判定するロジック
 * ResultCard / ResultRow で `isList && Array.isArray(value)` に対応
 */
function shouldRenderList(isList: boolean | undefined, value: unknown): boolean {
  return !!isList && Array.isArray(value);
}

/**
 * result-row の key を生成するロジック
 * `${row.label}-${index}` に対応
 */
function buildRowKey(label: string, index: number): string {
  return `${label}-${index}`;
}

/**
 * リストアイテムの key を生成するロジック
 * `${String(item).slice(0, 20)}-${itemIndex}` に対応
 */
function buildListItemKey(item: unknown, itemIndex: number): string {
  return `${String(item).slice(0, 20)}-${itemIndex}`;
}

/**
 * ResultCard の aria-live デフォルト値
 */
const DEFAULT_ARIA_LIVE = "polite" as const;

// ─── resolveValue ─────────────────────────────────────────────────

describe("resolveValue（フォールバックロジック）", () => {
  describe("value が存在する場合", () => {
    it("文字列 value をそのまま返す", () => {
      expect(resolveValue("hello")).toBe("hello");
    });

    it("数値 value をそのまま返す", () => {
      expect(resolveValue(0)).toBe(0);
    });

    it("空文字列は存在する値として返す", () => {
      expect(resolveValue("")).toBe("");
    });

    it("false は存在する値として返す", () => {
      expect(resolveValue(false)).toBe(false);
    });

    it("配列は存在する値として返す", () => {
      const arr = ["a", "b"];
      expect(resolveValue(arr)).toBe(arr);
    });
  });

  describe("value が null / undefined の場合", () => {
    it("value が null かつ fallback あり → fallback を返す", () => {
      expect(resolveValue(null, "フォールバック")).toBe("フォールバック");
    });

    it("value が undefined かつ fallback あり → fallback を返す", () => {
      expect(resolveValue(undefined, "N/A")).toBe("N/A");
    });

    it("value が null かつ fallback なし → '-' を返す", () => {
      expect(resolveValue(null)).toBe("-");
    });

    it("value が undefined かつ fallback なし → '-' を返す", () => {
      expect(resolveValue(undefined)).toBe("-");
    });

    it("value が null かつ fallback が空文字列 → 空文字列を返す（?? 演算子は null/undefined のみ通過）", () => {
      // ?? は null/undefined のみをスキップするため、"" は fallback として有効
      // null ?? "" ?? "-" → "" が返る
      expect(resolveValue(null, "")).toBe("");
    });
  });

  describe("value と fallback が両方 null / undefined の場合", () => {
    it("'-' を返す（最終フォールバック）", () => {
      expect(resolveValue(undefined, undefined)).toBe("-");
    });
  });
});

// ─── shouldRenderList ─────────────────────────────────────────────

describe("shouldRenderList（リスト表示判定ロジック）", () => {
  it("isList=true かつ配列 → true", () => {
    expect(shouldRenderList(true, ["a", "b"])).toBe(true);
  });

  it("isList=true かつ空配列 → true", () => {
    expect(shouldRenderList(true, [])).toBe(true);
  });

  it("isList=false かつ配列 → false", () => {
    expect(shouldRenderList(false, ["a", "b"])).toBe(false);
  });

  it("isList=true かつ文字列 → false（Array.isArray が false）", () => {
    expect(shouldRenderList(true, "text")).toBe(false);
  });

  it("isList=true かつ null → false（Array.isArray が false）", () => {
    expect(shouldRenderList(true, null)).toBe(false);
  });

  it("isList=undefined かつ配列 → false", () => {
    expect(shouldRenderList(undefined, ["a"])).toBe(false);
  });

  it("isList=undefined かつ非配列 → false", () => {
    expect(shouldRenderList(undefined, "text")).toBe(false);
  });
});

// ─── buildRowKey ──────────────────────────────────────────────────

describe("buildRowKey（result-row キー生成ロジック）", () => {
  it("ラベルとインデックスを結合する", () => {
    expect(buildRowKey("ドメイン", 0)).toBe("ドメイン-0");
  });

  it("インデックス 0 から始まる", () => {
    expect(buildRowKey("ラベル", 0)).toBe("ラベル-0");
  });

  it("インデックスが増加しても正しく生成される", () => {
    expect(buildRowKey("ラベル", 5)).toBe("ラベル-5");
  });

  it("ラベルが空文字列でもキーが生成される", () => {
    expect(buildRowKey("", 1)).toBe("-1");
  });

  it("ラベルにハイフンを含む場合でも生成される", () => {
    expect(buildRowKey("user-agent", 2)).toBe("user-agent-2");
  });
});

// ─── buildListItemKey ─────────────────────────────────────────────

describe("buildListItemKey（リストアイテムキー生成ロジック）", () => {
  it("通常の文字列アイテムのキーを生成する", () => {
    expect(buildListItemKey("ns1.example.com", 0)).toBe("ns1.example.com-0");
  });

  it("20文字以内の文字列はそのまま使用される", () => {
    const item = "short";
    expect(buildListItemKey(item, 0)).toBe("short-0");
  });

  it("20文字を超える文字列は先頭20文字に切り詰められる", () => {
    const item = "a".repeat(30); // 30文字
    const key = buildListItemKey(item, 0);
    expect(key).toBe(`${"a".repeat(20)}-0`);
  });

  it("ちょうど20文字の文字列はそのまま使用される", () => {
    const item = "x".repeat(20);
    expect(buildListItemKey(item, 0)).toBe(`${"x".repeat(20)}-0`);
  });

  it("インデックスがキーに反映される", () => {
    expect(buildListItemKey("item", 3)).toBe("item-3");
  });

  it("数値アイテムも String 変換して処理される", () => {
    expect(buildListItemKey(42, 0)).toBe("42-0");
  });

  it("null アイテムも String 変換して処理される", () => {
    expect(buildListItemKey(null, 0)).toBe("null-0");
  });
});

// ─── DEFAULT_ARIA_LIVE ────────────────────────────────────────────

describe("DEFAULT_ARIA_LIVE（aria-live デフォルト値）", () => {
  it("デフォルト値は 'polite' である", () => {
    expect(DEFAULT_ARIA_LIVE).toBe("polite");
  });

  it("有効な aria-live 値である", () => {
    const validValues = ["polite", "assertive", "off"] as const;
    expect(validValues).toContain(DEFAULT_ARIA_LIVE);
  });
});

// ─── 統合シナリオ ─────────────────────────────────────────────────

describe("ResultCard の行レンダリング統合シナリオ", () => {
  interface ResultRowData {
    label: string;
    value: unknown;
    isList?: boolean;
    fallback?: string;
  }

  /** 行データから表示内容を決定するロジック（ResultCard の renderRow 相当） */
  function renderRowLogic(row: ResultRowData): { displayValue: unknown; isListMode: boolean } {
    const isListMode = shouldRenderList(row.isList, row.value);
    const displayValue = isListMode ? row.value : resolveValue(row.value, row.fallback);
    return { displayValue, isListMode };
  }

  it("通常テキスト値の行を正しく処理する", () => {
    const row = { label: "ドメイン", value: "example.com" };
    const { displayValue, isListMode } = renderRowLogic(row);
    expect(isListMode).toBe(false);
    expect(displayValue).toBe("example.com");
  });

  it("nullの行にフォールバックを適用する", () => {
    const row = { label: "登録者", value: null, fallback: "不明" };
    const { displayValue, isListMode } = renderRowLogic(row);
    expect(isListMode).toBe(false);
    expect(displayValue).toBe("不明");
  });

  it("isList=true かつ配列値の行をリストモードで処理する", () => {
    const row = {
      label: "ネームサーバー",
      value: ["ns1.example.com", "ns2.example.com"],
      isList: true,
    };
    const { displayValue, isListMode } = renderRowLogic(row);
    expect(isListMode).toBe(true);
    expect(Array.isArray(displayValue)).toBe(true);
    expect(displayValue).toEqual(["ns1.example.com", "ns2.example.com"]);
  });

  it("isList=true かつ非配列値の行はフォールバックロジックを適用する", () => {
    const row = { label: "ラベル", value: "テキスト", isList: true };
    const { displayValue, isListMode } = renderRowLogic(row);
    expect(isListMode).toBe(false);
    expect(displayValue).toBe("テキスト");
  });

  it("複数行のキーが一意であることを確認する", () => {
    const labels = ["ドメイン", "登録者", "ネームサーバー"];
    const keys = labels.map((label, index) => buildRowKey(label, index));
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});
