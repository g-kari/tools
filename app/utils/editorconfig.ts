/**
 * EditorConfig ジェネレーター ユーティリティ
 * https://editorconfig.org/
 */

/** インデントスタイル */
export type IndentStyle = "space" | "tab";

/** 改行コード */
export type EndOfLine = "lf" | "crlf" | "cr";

/** 文字エンコーディング */
export type Charset =
  | "utf-8"
  | "utf-8-bom"
  | "utf-16be"
  | "utf-16le"
  | "latin1";

/** ファイルタイプ設定 */
export interface FileTypeConfig {
  /** ファイルパターン（例: *.js） */
  pattern: string;
  /** 表示名 */
  label: string;
  /** デフォルトのインデントサイズ */
  defaultIndentSize: number;
  /** デフォルトのインデントスタイル */
  defaultIndentStyle: IndentStyle;
}

/** EditorConfig グローバル設定 */
export interface EditorConfigGlobal {
  /** ルート設定（trueの場合、上位ディレクトリを検索しない） */
  root: boolean;
  /** インデントスタイル */
  indentStyle: IndentStyle;
  /** インデントサイズ */
  indentSize: number;
  /** 改行コード */
  endOfLine: EndOfLine;
  /** 文字エンコーディング */
  charset: Charset;
  /** 末尾の空白をトリム */
  trimTrailingWhitespace: boolean;
  /** 最終行に改行を挿入 */
  insertFinalNewline: boolean;
}

/** ファイルタイプ別のオーバーライド設定 */
export interface FileTypeOverride {
  /** 設定を有効にするか */
  enabled: boolean;
  /** インデントスタイルをオーバーライドするか */
  overrideIndentStyle: boolean;
  /** インデントスタイル */
  indentStyle: IndentStyle;
  /** インデントサイズをオーバーライドするか */
  overrideIndentSize: boolean;
  /** インデントサイズ */
  indentSize: number;
}

/** サポートするファイルタイプ一覧 */
export const FILE_TYPES: FileTypeConfig[] = [
  {
    pattern: "*.{js,jsx,ts,tsx,mjs,cjs}",
    label: "JavaScript / TypeScript",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{html,htm}",
    label: "HTML",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{css,scss,sass,less}",
    label: "CSS / Sass / Less",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{json,jsonc}",
    label: "JSON",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{yaml,yml}",
    label: "YAML",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.toml",
    label: "TOML",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{py,pyi}",
    label: "Python",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{rb,rake}",
    label: "Ruby",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{java,kt,kts}",
    label: "Java / Kotlin",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{go}",
    label: "Go",
    defaultIndentSize: 4,
    defaultIndentStyle: "tab",
  },
  {
    pattern: "*.{rs}",
    label: "Rust",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{php}",
    label: "PHP",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{c,cpp,h,hpp}",
    label: "C / C++",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{cs}",
    label: "C#",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{swift}",
    label: "Swift",
    defaultIndentSize: 4,
    defaultIndentStyle: "space",
  },
  {
    pattern: "Makefile",
    label: "Makefile",
    defaultIndentSize: 4,
    defaultIndentStyle: "tab",
  },
  {
    pattern: "*.{sh,bash,zsh}",
    label: "Shell Script",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{md,mdx}",
    label: "Markdown",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{xml,svg}",
    label: "XML / SVG",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
  {
    pattern: "*.{sql}",
    label: "SQL",
    defaultIndentSize: 2,
    defaultIndentStyle: "space",
  },
];

/** プリセット定義 */
export interface Preset {
  /** プリセット名 */
  name: string;
  /** 説明 */
  description: string;
  /** グローバル設定 */
  global: Partial<EditorConfigGlobal>;
}

/** よく使われるプリセット */
export const PRESETS: Preset[] = [
  {
    name: "Webフロントエンド標準",
    description: "React / Vue / Angular プロジェクト向けの標準設定",
    global: {
      root: true,
      indentStyle: "space",
      indentSize: 2,
      endOfLine: "lf",
      charset: "utf-8",
      trimTrailingWhitespace: true,
      insertFinalNewline: true,
    },
  },
  {
    name: "Python標準 (PEP 8)",
    description: "Python PEP 8 スタイルガイドに準拠した設定",
    global: {
      root: true,
      indentStyle: "space",
      indentSize: 4,
      endOfLine: "lf",
      charset: "utf-8",
      trimTrailingWhitespace: true,
      insertFinalNewline: true,
    },
  },
  {
    name: "Go標準",
    description: "gofmt に準拠したGo言語標準設定",
    global: {
      root: true,
      indentStyle: "tab",
      indentSize: 4,
      endOfLine: "lf",
      charset: "utf-8",
      trimTrailingWhitespace: true,
      insertFinalNewline: true,
    },
  },
  {
    name: "Windowsフレンドリー",
    description: "Windows 環境での開発に適した設定（CRLF改行）",
    global: {
      root: true,
      indentStyle: "space",
      indentSize: 4,
      endOfLine: "crlf",
      charset: "utf-8",
      trimTrailingWhitespace: true,
      insertFinalNewline: true,
    },
  },
];

/**
 * EditorConfig ファイルの内容を生成する
 * @param global グローバル設定
 * @param overrides ファイルタイプ別オーバーライド設定（パターンをキーとする）
 * @returns 生成された .editorconfig の内容
 */
export function generateEditorConfig(
  global: EditorConfigGlobal,
  overrides: Record<string, FileTypeOverride>
): string {
  const lines: string[] = [];

  if (global.root) {
    lines.push("root = true");
    lines.push("");
  }

  lines.push("[*]");
  lines.push(`indent_style = ${global.indentStyle}`);
  lines.push(`indent_size = ${global.indentSize}`);
  lines.push(`end_of_line = ${global.endOfLine}`);
  lines.push(`charset = ${global.charset}`);
  lines.push(
    `trim_trailing_whitespace = ${global.trimTrailingWhitespace ? "true" : "false"}`
  );
  lines.push(
    `insert_final_newline = ${global.insertFinalNewline ? "true" : "false"}`
  );

  for (const fileType of FILE_TYPES) {
    const override = overrides[fileType.pattern];
    if (!override?.enabled) continue;

    const sectionLines: string[] = [];

    if (
      override.overrideIndentStyle &&
      override.indentStyle !== global.indentStyle
    ) {
      sectionLines.push(`indent_style = ${override.indentStyle}`);
    }
    if (
      override.overrideIndentSize &&
      override.indentSize !== global.indentSize
    ) {
      sectionLines.push(`indent_size = ${override.indentSize}`);
    }

    if (sectionLines.length === 0) continue;

    lines.push("");
    lines.push(`[${fileType.pattern}]`);
    lines.push(...sectionLines);
  }

  return lines.join("\n") + "\n";
}

/**
 * ファイルタイプのデフォルトオーバーライド設定を作成する
 * @param fileType ファイルタイプ設定
 * @returns デフォルトオーバーライド設定
 */
export function createDefaultOverride(
  fileType: FileTypeConfig
): FileTypeOverride {
  return {
    enabled: false,
    overrideIndentStyle: true,
    indentStyle: fileType.defaultIndentStyle,
    overrideIndentSize: true,
    indentSize: fileType.defaultIndentSize,
  };
}

/**
 * プリセットをデフォルトグローバル設定にマージする
 * @param preset 適用するプリセット
 * @returns プリセットを適用したグローバル設定
 */
export function applyPreset(preset: Preset): EditorConfigGlobal {
  return {
    root: preset.global.root ?? true,
    indentStyle: preset.global.indentStyle ?? "space",
    indentSize: preset.global.indentSize ?? 2,
    endOfLine: preset.global.endOfLine ?? "lf",
    charset: preset.global.charset ?? "utf-8",
    trimTrailingWhitespace: preset.global.trimTrailingWhitespace ?? true,
    insertFinalNewline: preset.global.insertFinalNewline ?? true,
  };
}

/** デフォルトのグローバル設定 */
export const DEFAULT_GLOBAL: EditorConfigGlobal = {
  root: true,
  indentStyle: "space",
  indentSize: 2,
  endOfLine: "lf",
  charset: "utf-8",
  trimTrailingWhitespace: true,
  insertFinalNewline: true,
};
