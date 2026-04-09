/**
 * @fileoverview TipsCard コンポーネントのロジックテスト
 * aria-labelledby ID 割り当て・CSSクラス生成・セクションレンダリングロジックを検証する
 */

import { describe, it, expect } from "vite-plus/test";

// ─── TipsCard の内部ロジックを純粋関数として再現 ────────────────

/**
 * セクションインデックスに対応する h3 要素の id を返す
 * TipsCard.tsx の `index === 0 ? "usage-title" : index === 1 ? "about-tool-title" : undefined` に対応
 */
function getSectionId(index: number): string | undefined {
  if (index === 0) return "usage-title";
  if (index === 1) return "about-tool-title";
  return undefined;
}

/**
 * Card に付与する mt-4 クラスを決定するロジック
 * TipsCard.tsx の `index > 0 ? "mt-4" : ""` に対応
 */
function getMarginTopClass(index: number): string {
  return index > 0 ? "mt-4" : "";
}

/**
 * Card のクラス名を組み立てるロジック
 * `tips-card info-box p-6 ${index > 0 ? "mt-4" : ""}` に対応
 */
function buildCardClass(index: number): string {
  const marginClass = getMarginTopClass(index);
  return ["tips-card", "info-box", "p-6", marginClass].filter(Boolean).join(" ");
}

/**
 * セクションインデックスに対応する aria-labelledby 値を返す
 * TipsCard.tsx の Card コンポーネントに渡す aria-labelledby と同じロジック
 */
function getAriaLabelledBy(index: number): string | undefined {
  return getSectionId(index);
}

// ─── getSectionId ─────────────────────────────────────────────────

describe("getSectionId（セクション ID 割り当てロジック）", () => {
  it("index=0 → 'usage-title' を返す", () => {
    expect(getSectionId(0)).toBe("usage-title");
  });

  it("index=1 → 'about-tool-title' を返す", () => {
    expect(getSectionId(1)).toBe("about-tool-title");
  });

  it("index=2 → undefined を返す", () => {
    expect(getSectionId(2)).toBeUndefined();
  });

  it("index=3 → undefined を返す", () => {
    expect(getSectionId(3)).toBeUndefined();
  });

  it("index=10 → undefined を返す", () => {
    expect(getSectionId(10)).toBeUndefined();
  });

  it("index=0 と index=1 は異なる ID を返す", () => {
    expect(getSectionId(0)).not.toBe(getSectionId(1));
  });

  it("index >= 2 はすべて undefined を返す", () => {
    for (let i = 2; i <= 5; i++) {
      expect(getSectionId(i)).toBeUndefined();
    }
  });
});

// ─── getMarginTopClass ────────────────────────────────────────────

describe("getMarginTopClass（mt-4 クラス生成ロジック）", () => {
  it("index=0 → 空文字列（mt-4 なし）", () => {
    expect(getMarginTopClass(0)).toBe("");
  });

  it("index=1 → 'mt-4'", () => {
    expect(getMarginTopClass(1)).toBe("mt-4");
  });

  it("index=2 → 'mt-4'", () => {
    expect(getMarginTopClass(2)).toBe("mt-4");
  });

  it("index=10 → 'mt-4'", () => {
    expect(getMarginTopClass(10)).toBe("mt-4");
  });

  it("index > 0 はすべて 'mt-4' を返す", () => {
    for (let i = 1; i <= 5; i++) {
      expect(getMarginTopClass(i)).toBe("mt-4");
    }
  });
});

// ─── buildCardClass ───────────────────────────────────────────────

describe("buildCardClass（Card クラス名生成ロジック）", () => {
  it("index=0 → 'tips-card info-box p-6'（mt-4 なし）", () => {
    expect(buildCardClass(0)).toBe("tips-card info-box p-6");
  });

  it("index=1 → 'tips-card info-box p-6 mt-4'", () => {
    expect(buildCardClass(1)).toBe("tips-card info-box p-6 mt-4");
  });

  it("index=2 → 'tips-card info-box p-6 mt-4'", () => {
    expect(buildCardClass(2)).toBe("tips-card info-box p-6 mt-4");
  });

  it("すべての index で 'tips-card' クラスを含む", () => {
    for (let i = 0; i < 3; i++) {
      expect(buildCardClass(i)).toContain("tips-card");
    }
  });

  it("すべての index で 'info-box' クラスを含む", () => {
    for (let i = 0; i < 3; i++) {
      expect(buildCardClass(i)).toContain("info-box");
    }
  });

  it("すべての index で 'p-6' クラスを含む", () => {
    for (let i = 0; i < 3; i++) {
      expect(buildCardClass(i)).toContain("p-6");
    }
  });

  it("index=0 のクラス名に 'mt-4' を含まない", () => {
    expect(buildCardClass(0)).not.toContain("mt-4");
  });

  it("index >= 1 のクラス名に 'mt-4' を含む", () => {
    for (let i = 1; i <= 3; i++) {
      expect(buildCardClass(i)).toContain("mt-4");
    }
  });
});

// ─── getAriaLabelledBy ────────────────────────────────────────────

describe("getAriaLabelledBy（aria-labelledby ロジック）", () => {
  it("index=0 → 'usage-title'", () => {
    expect(getAriaLabelledBy(0)).toBe("usage-title");
  });

  it("index=1 → 'about-tool-title'", () => {
    expect(getAriaLabelledBy(1)).toBe("about-tool-title");
  });

  it("index=2 → undefined", () => {
    expect(getAriaLabelledBy(2)).toBeUndefined();
  });

  it("getSectionId と同じ値を返す（アクセシビリティの一貫性）", () => {
    for (let i = 0; i <= 3; i++) {
      expect(getAriaLabelledBy(i)).toBe(getSectionId(i));
    }
  });
});

// ─── セクションデータのレンダリングロジック統合テスト ────────────

describe("TipsCard セクションレンダリング統合シナリオ", () => {
  interface TipsSection {
    title: string;
    items: string[];
  }

  /** セクションのレンダリングメタデータを生成する */
  function computeSectionMeta(sections: TipsSection[]): Array<{
    title: string;
    items: string[];
    cardClass: string;
    sectionId: string | undefined;
    ariaLabelledBy: string | undefined;
  }> {
    return sections.map((section, index) => ({
      title: section.title,
      items: section.items,
      cardClass: buildCardClass(index),
      sectionId: getSectionId(index),
      ariaLabelledBy: getAriaLabelledBy(index),
    }));
  }

  it("1セクションの場合、最初のセクションに usage-title が付与される", () => {
    const sections: TipsSection[] = [{ title: "使い方", items: ["ステップ1", "ステップ2"] }];
    const meta = computeSectionMeta(sections);
    expect(meta[0].sectionId).toBe("usage-title");
    expect(meta[0].ariaLabelledBy).toBe("usage-title");
    expect(meta[0].cardClass).not.toContain("mt-4");
  });

  it("2セクションの場合、各セクションに適切な ID が付与される", () => {
    const sections: TipsSection[] = [
      { title: "使い方", items: ["説明1"] },
      { title: "ツールについて", items: ["説明2"] },
    ];
    const meta = computeSectionMeta(sections);
    expect(meta[0].sectionId).toBe("usage-title");
    expect(meta[1].sectionId).toBe("about-tool-title");
    expect(meta[1].cardClass).toContain("mt-4");
  });

  it("3セクション以降は ID が undefined になる", () => {
    const sections: TipsSection[] = [
      { title: "使い方", items: [] },
      { title: "ツールについて", items: [] },
      { title: "追加情報", items: [] },
    ];
    const meta = computeSectionMeta(sections);
    expect(meta[2].sectionId).toBeUndefined();
    expect(meta[2].ariaLabelledBy).toBeUndefined();
    expect(meta[2].cardClass).toContain("mt-4");
  });

  it("空のセクション配列でも動作する", () => {
    const meta = computeSectionMeta([]);
    expect(meta).toHaveLength(0);
  });

  it("各セクションのアイテムが保持される", () => {
    const items = ["テキスト入力", "変換実行", "コピー"];
    const sections: TipsSection[] = [{ title: "使い方", items }];
    const meta = computeSectionMeta(sections);
    expect(meta[0].items).toEqual(items);
  });

  it("セクションのタイトルが保持される", () => {
    const sections: TipsSection[] = [
      { title: "使い方", items: [] },
      { title: "ツールについて", items: [] },
    ];
    const meta = computeSectionMeta(sections);
    expect(meta[0].title).toBe("使い方");
    expect(meta[1].title).toBe("ツールについて");
  });
});
