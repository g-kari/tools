import { describe, it, expect } from "vitest";

/**
 * CSSセレクターのユーティリティ関数（コンポーネントのロジックと同等）
 */

/** 要素情報のビルドセレクター文字列を生成する */
function buildElementSelectorString(
  tagName: string,
  id: string,
  classes: string[]
): string {
  let selector = tagName;
  if (id) selector += `#${id}`;
  if (classes.length > 0) selector += `.${classes.join(".")}`;
  return selector;
}

/** テキストを指定長で切り詰める */
function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength);
}

/** HTML文字列を指定長で切り詰める */
function truncateHtml(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html;
  return html.slice(0, maxLength) + "...";
}

/** マッチ数のラベル文字列を生成する */
function formatMatchCountLabel(count: number): string {
  if (count === 0) return "マッチする要素が見つかりませんでした";
  return `${count}件の要素が見つかりました`;
}

/** CSSセレクターの空チェック */
function isSelectorEmpty(selector: string): boolean {
  return !selector || selector.trim() === "";
}

/** クラス名文字列からクラス配列を生成する */
function parseClassNames(className: string): string[] {
  if (!className || !className.trim()) return [];
  return className.trim().split(/\s+/);
}

describe("CSS Selector - buildElementSelectorString", () => {
  it("タグ名のみのセレクター", () => {
    expect(buildElementSelectorString("div", "", [])).toBe("div");
  });

  it("IDを含むセレクター", () => {
    expect(buildElementSelectorString("div", "main", [])).toBe("div#main");
  });

  it("クラスを含むセレクター", () => {
    expect(buildElementSelectorString("span", "", ["foo", "bar"])).toBe(
      "span.foo.bar"
    );
  });

  it("ID・クラス両方含むセレクター", () => {
    expect(
      buildElementSelectorString("a", "link1", ["active", "primary"])
    ).toBe("a#link1.active.primary");
  });

  it("クラスが1つの場合", () => {
    expect(buildElementSelectorString("p", "", ["text"])).toBe("p.text");
  });
});

describe("CSS Selector - truncateText", () => {
  it("短いテキストはそのまま返す", () => {
    expect(truncateText("Hello", 100)).toBe("Hello");
  });

  it("maxLength以内のテキストはそのまま返す", () => {
    expect(truncateText("a".repeat(100), 100)).toBe("a".repeat(100));
  });

  it("maxLengthを超えるテキストは切り詰める", () => {
    const result = truncateText("a".repeat(200), 120);
    expect(result).toBe("a".repeat(120));
  });

  it("前後の空白をトリムする", () => {
    expect(truncateText("  hello  ", 100)).toBe("hello");
  });
});

describe("CSS Selector - truncateHtml", () => {
  it("短いHTMLはそのまま返す", () => {
    const html = "<div>test</div>";
    expect(truncateHtml(html, 200)).toBe(html);
  });

  it("maxLengthを超えるHTMLは切り詰めて...を付ける", () => {
    const long = "a".repeat(400);
    const result = truncateHtml(long, 300);
    expect(result).toHaveLength(303); // 300 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  it("ちょうどmaxLengthのHTMLはそのまま返す", () => {
    const html = "a".repeat(300);
    expect(truncateHtml(html, 300)).toBe(html);
  });
});

describe("CSS Selector - formatMatchCountLabel", () => {
  it("0件の場合はマッチなしメッセージ", () => {
    expect(formatMatchCountLabel(0)).toBe("マッチする要素が見つかりませんでした");
  });

  it("1件の場合", () => {
    expect(formatMatchCountLabel(1)).toBe("1件の要素が見つかりました");
  });

  it("複数件の場合", () => {
    expect(formatMatchCountLabel(5)).toBe("5件の要素が見つかりました");
  });
});

describe("CSS Selector - isSelectorEmpty", () => {
  it("空文字列はtrue", () => {
    expect(isSelectorEmpty("")).toBe(true);
  });

  it("空白のみはtrue", () => {
    expect(isSelectorEmpty("   ")).toBe(true);
  });

  it("有効なセレクターはfalse", () => {
    expect(isSelectorEmpty(".foo")).toBe(false);
  });

  it("#idセレクターはfalse", () => {
    expect(isSelectorEmpty("#main")).toBe(false);
  });
});

describe("CSS Selector - parseClassNames", () => {
  it("単一クラス名を配列に変換", () => {
    expect(parseClassNames("foo")).toEqual(["foo"]);
  });

  it("スペース区切りの複数クラスを配列に変換", () => {
    expect(parseClassNames("foo bar baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("空文字列は空配列", () => {
    expect(parseClassNames("")).toEqual([]);
  });

  it("前後の余分な空白を無視", () => {
    expect(parseClassNames("  foo   bar  ")).toEqual(["foo", "bar"]);
  });

  it("クラスが1つで余白あり", () => {
    expect(parseClassNames("  active  ")).toEqual(["active"]);
  });
});
