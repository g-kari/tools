import { describe, it, expect } from "vite-plus/test";
import {
  getTemplates,
  getCategoryLabel,
  generateGitignoreContent,
  CATEGORY_ORDER,
  type GitignoreCategory,
} from "~/utils/gitignore";

describe("getTemplates", () => {
  it("テンプレート一覧が空でない", () => {
    const templates = getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("各テンプレートにid・label・category・contentが存在する", () => {
    const templates = getTemplates();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.content).toBeTruthy();
    }
  });

  it("Node.jsテンプレートが存在する", () => {
    const templates = getTemplates();
    const node = templates.find((t) => t.id === "node");
    expect(node).toBeDefined();
    expect(node?.label).toBe("Node.js");
    expect(node?.category).toBe("language");
  });

  it("VSCodeテンプレートが存在する", () => {
    const templates = getTemplates();
    const vscode = templates.find((t) => t.id === "vscode");
    expect(vscode).toBeDefined();
    expect(vscode?.category).toBe("ide");
  });

  it("macOSテンプレートが存在する", () => {
    const templates = getTemplates();
    const macos = templates.find((t) => t.id === "macos");
    expect(macos).toBeDefined();
    expect(macos?.category).toBe("os");
  });

  it("全カテゴリのテンプレートが含まれる", () => {
    const templates = getTemplates();
    const categories = new Set(templates.map((t) => t.category));
    expect(categories.has("language")).toBe(true);
    expect(categories.has("framework")).toBe(true);
    expect(categories.has("ide")).toBe(true);
    expect(categories.has("os")).toBe(true);
  });

  it("IDが一意である", () => {
    const templates = getTemplates();
    const ids = templates.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("getCategoryLabel", () => {
  it("languageカテゴリのラベルが正しい", () => {
    expect(getCategoryLabel("language")).toBe("言語");
  });

  it("frameworkカテゴリのラベルが正しい", () => {
    expect(getCategoryLabel("framework")).toBe("フレームワーク");
  });

  it("ideカテゴリのラベルが正しい", () => {
    expect(getCategoryLabel("ide")).toBe("IDE");
  });

  it("osカテゴリのラベルが正しい", () => {
    expect(getCategoryLabel("os")).toBe("OS");
  });
});

describe("CATEGORY_ORDER", () => {
  it("4つのカテゴリが定義されている", () => {
    expect(CATEGORY_ORDER).toHaveLength(4);
  });

  it("全カテゴリが含まれる", () => {
    const expected: GitignoreCategory[] = ["language", "framework", "ide", "os"];
    for (const cat of expected) {
      expect(CATEGORY_ORDER).toContain(cat);
    }
  });
});

describe("generateGitignoreContent", () => {
  it("空配列を渡すと空文字列を返す", () => {
    expect(generateGitignoreContent([])).toBe("");
  });

  it("単一テンプレートを選択するとそのコンテンツを含む", () => {
    const result = generateGitignoreContent(["node"]);
    expect(result).toContain("node_modules/");
  });

  it("セクションヘッダーが含まれる", () => {
    const result = generateGitignoreContent(["node"]);
    expect(result).toContain("# === Node.js ===");
  });

  it("複数テンプレートを選択すると全てのコンテンツを含む", () => {
    const result = generateGitignoreContent(["node", "python", "vscode"]);
    expect(result).toContain("node_modules/");
    expect(result).toContain("__pycache__/");
    expect(result).toContain(".vscode/*");
  });

  it("複数テンプレートのセクションヘッダーが全て含まれる", () => {
    const result = generateGitignoreContent(["node", "vscode"]);
    expect(result).toContain("# === Node.js ===");
    expect(result).toContain("# === VSCode ===");
  });

  it("存在しないIDは無視される", () => {
    const result = generateGitignoreContent(["node", "nonexistent-id"]);
    expect(result).toContain("node_modules/");
    expect(result).not.toContain("nonexistent-id");
  });

  it("Pythonテンプレートの内容が正しい", () => {
    const result = generateGitignoreContent(["python"]);
    expect(result).toContain("__pycache__/");
    expect(result).toContain("venv/");
  });

  it("macOSテンプレートの内容が正しい", () => {
    const result = generateGitignoreContent(["macos"]);
    expect(result).toContain(".DS_Store");
  });

  it("Windowsテンプレートの内容が正しい", () => {
    const result = generateGitignoreContent(["windows"]);
    expect(result).toContain("Thumbs.db");
  });

  it("JetBrainsテンプレートの内容が正しい", () => {
    const result = generateGitignoreContent(["jetbrains"]);
    expect(result).toContain(".idea/");
  });

  it("Next.jsテンプレートの内容が正しい", () => {
    const result = generateGitignoreContent(["nextjs"]);
    expect(result).toContain(".next/");
  });

  it("セクション間に空行がある（改行で区切られている）", () => {
    const result = generateGitignoreContent(["node", "python"]);
    expect(result).toContain("\n\n");
  });
});
