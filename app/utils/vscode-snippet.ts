/**
 * VSCode スニペットジェネレーター ユーティリティ
 * VS Code 用のスニペット JSON を生成する関数群
 */

/** スニペット1件の定義 */
export interface SnippetDefinition {
  /** スニペット名（JSONのキー） */
  name: string;
  /** プレフィックス（補完トリガー文字列） */
  prefix: string;
  /** スニペット本体（複数行は配列） */
  body: string;
  /** スニペットの説明 */
  description: string;
  /** 対象スコープ（空文字はすべての言語） */
  scope: string;
}

/** VSCode スニペットオブジェクトの型（body は string[] が正式） */
interface VscodeSnippetEntry {
  prefix: string | string[];
  body: string[];
  description?: string;
  scope?: string;
}

/** 生成結果 */
export interface GenerateResult {
  json: string;
  snippetCount: number;
}

/**
 * スニペット本文を行配列に変換する
 * タブは \t として保持する
 */
export function bodyToLines(body: string): string[] {
  return body.split("\n");
}

/**
 * SnippetDefinition 配列から VSCode スニペット JSON 文字列を生成する
 * @param snippets スニペット定義の配列
 * @returns 整形済み JSON 文字列
 */
export function generateVscodeSnippetJson(snippets: SnippetDefinition[]): GenerateResult {
  const obj: Record<string, VscodeSnippetEntry> = {};

  for (const snippet of snippets) {
    if (!snippet.name.trim()) continue;

    const entry: VscodeSnippetEntry = {
      prefix: snippet.prefix.trim() || snippet.name.trim(),
      body: bodyToLines(snippet.body),
    };

    if (snippet.description.trim()) {
      entry.description = snippet.description.trim();
    }

    if (snippet.scope.trim()) {
      entry.scope = snippet.scope.trim();
    }

    obj[snippet.name.trim()] = entry;
  }

  return {
    json: JSON.stringify(obj, null, 2),
    snippetCount: Object.keys(obj).length,
  };
}

/** 言語スコープのプリセット */
export const SCOPE_PRESETS: { label: string; value: string }[] = [
  { label: "すべての言語（スコープなし）", value: "" },
  { label: "TypeScript", value: "typescript" },
  { label: "TypeScript React", value: "typescriptreact" },
  { label: "JavaScript", value: "javascript" },
  { label: "JavaScript React", value: "javascriptreact" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Java", value: "java" },
  { label: "C#", value: "csharp" },
  { label: "C / C++", value: "c,cpp" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "SCSS", value: "scss" },
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "Markdown", value: "markdown" },
  { label: "SQL", value: "sql" },
  { label: "Shell Script", value: "shellscript" },
];

/** 空のスニペット定義を生成する */
export function createEmptySnippet(): SnippetDefinition {
  return {
    name: "",
    prefix: "",
    body: "$1",
    description: "",
    scope: "",
  };
}

/**
 * tab stop のガイド文字列を返す
 */
export const TAB_STOP_GUIDE =
  "$1, $2 … でタブストップ、$0 で最終カーソル位置、${1:placeholder} でデフォルト値付きタブストップを指定できます。";
