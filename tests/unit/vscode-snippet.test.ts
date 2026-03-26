import { describe, it, expect } from "vitest";
import {
  bodyToLines,
  generateVscodeSnippetJson,
  createEmptySnippet,
  type SnippetDefinition,
} from "../../app/utils/vscode-snippet";

describe("bodyToLines", () => {
  it("単一行をそのまま返す", () => {
    expect(bodyToLines("console.log($1)")).toEqual(["console.log($1)"]);
  });

  it("複数行を分割する", () => {
    expect(bodyToLines("line1\nline2\nline3")).toEqual([
      "line1",
      "line2",
      "line3",
    ]);
  });

  it("空文字列は配列1要素を返す", () => {
    expect(bodyToLines("")).toEqual([""]);
  });
});

describe("generateVscodeSnippetJson", () => {
  const baseSnippet: SnippetDefinition = {
    name: "console log",
    prefix: "cl",
    body: "console.log($1)",
    description: "console.log shortcut",
    scope: "javascript",
  };

  it("基本的なスニペットを生成する", () => {
    const { json, snippetCount } = generateVscodeSnippetJson([baseSnippet]);
    const parsed = JSON.parse(json);

    expect(snippetCount).toBe(1);
    expect(parsed["console log"]).toBeDefined();
    expect(parsed["console log"].prefix).toBe("cl");
    expect(parsed["console log"].body).toEqual(["console.log($1)"]);
    expect(parsed["console log"].description).toBe("console.log shortcut");
    expect(parsed["console log"].scope).toBe("javascript");
  });

  it("複数スニペットを生成する", () => {
    const snippet2: SnippetDefinition = {
      name: "arrow function",
      prefix: "af",
      body: "const $1 = ($2) => {\n  $3\n};",
      description: "",
      scope: "",
    };

    const { json, snippetCount } = generateVscodeSnippetJson([
      baseSnippet,
      snippet2,
    ]);
    const parsed = JSON.parse(json);

    expect(snippetCount).toBe(2);
    expect(parsed["arrow function"]).toBeDefined();
    expect(parsed["arrow function"].body).toEqual([
      "const $1 = ($2) => {",
      "  $3",
      "};",
    ]);
  });

  it("description が空のとき description フィールドを含まない", () => {
    const snippet: SnippetDefinition = {
      ...baseSnippet,
      description: "",
    };
    const { json } = generateVscodeSnippetJson([snippet]);
    const parsed = JSON.parse(json);
    expect(parsed["console log"].description).toBeUndefined();
  });

  it("scope が空のとき scope フィールドを含まない", () => {
    const snippet: SnippetDefinition = {
      ...baseSnippet,
      scope: "",
    };
    const { json } = generateVscodeSnippetJson([snippet]);
    const parsed = JSON.parse(json);
    expect(parsed["console log"].scope).toBeUndefined();
  });

  it("name が空のスニペットはスキップされる", () => {
    const emptyName: SnippetDefinition = {
      ...baseSnippet,
      name: "  ",
    };
    const { snippetCount } = generateVscodeSnippetJson([emptyName]);
    expect(snippetCount).toBe(0);
  });

  it("空配列を渡すと空のJSONオブジェクトを返す", () => {
    const { json, snippetCount } = generateVscodeSnippetJson([]);
    expect(JSON.parse(json)).toEqual({});
    expect(snippetCount).toBe(0);
  });

  it("prefix が空のとき name を prefix として使う", () => {
    const snippet: SnippetDefinition = {
      ...baseSnippet,
      prefix: "",
    };
    const { json } = generateVscodeSnippetJson([snippet]);
    const parsed = JSON.parse(json);
    expect(parsed["console log"].prefix).toBe("console log");
  });

  it("有効な JSON 文字列を生成する", () => {
    const { json } = generateVscodeSnippetJson([baseSnippet]);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("createEmptySnippet", () => {
  it("デフォルト値を持つスニペットを返す", () => {
    const snippet = createEmptySnippet();
    expect(snippet.name).toBe("");
    expect(snippet.prefix).toBe("");
    expect(snippet.body).toBe("$1");
    expect(snippet.description).toBe("");
    expect(snippet.scope).toBe("");
  });
});
