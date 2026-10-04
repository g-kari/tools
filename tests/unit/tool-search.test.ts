import { describe, expect, it } from "vite-plus/test";
import { createToolSearchMatcher } from "../../app/utils/tool-search";
import { filterCatalog, toolCatalog } from "../../app/routes/top";
import { flattenCatalog, searchTools } from "../../app/components/SearchModal";

describe("shared local tool search", () => {
  const tool = { label: "ＪＳＯＮ整形", description: "データの圧縮・検証", path: "/json" };

  it.each(["", " ", "\t\n　\u00a0"])("blank query %j retains caller defaults", (query) => {
    expect(createToolSearchMatcher(query)).toBeNull();
    expect(filterCatalog(toolCatalog, query)).toBe(toolCatalog);
    expect(searchTools(flattenCatalog(toolCatalog), query)).toHaveLength(8);
  });

  it.each(["JSON 圧縮", "圧縮 json", "ＪＳＯＮ　圧縮", "/json 検証 変換"])(
    "all terms match one tool across existing fields: %s",
    (query) => {
      expect(createToolSearchMatcher(query)?.(tool, "変換")).toBe(true);
    },
  );

  it("normalizes half-width kana and decomposed characters on both sides", () => {
    const source = { ...tool, label: "ﾊﾟｽﾜｰﾄﾞ生成", description: "カ\u3099イド" };
    expect(createToolSearchMatcher("パスワード ガイド")?.(source, "生成")).toBe(true);
  });

  it("does not match terms spanning field boundaries", () => {
    expect(createToolSearchMatcher("整形データ")?.(tool, "変換")).toBe(false);
  });

  it("treats punctuation as literal text", () => {
    const source = { ...tool, description: "C++ と [JSON] の変換" };
    expect(createToolSearchMatcher("c++ [json]")?.(source, "変換")).toBe(true);
    expect(createToolSearchMatcher(".*")?.(source, "変換")).toBe(false);
  });

  it.each(["JSON 圧縮", "変換 /url-encode", "ﾊﾟｽﾜｰﾄﾞ", "生成", "uuid", "xxx-absent"])(
    "the real catalog and modal return the same ordered matches: %s",
    (query) => {
      const catalogPaths = filterCatalog(toolCatalog, query).flatMap((category) =>
        category.items.map((item) => item.path),
      );
      expect(searchTools(flattenCatalog(toolCatalog), query).map((item) => item.path)).toEqual(
        catalogPaths.slice(0, 12),
      );
    },
  );
});
