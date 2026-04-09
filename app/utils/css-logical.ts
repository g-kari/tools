/**
 * CSS 論理プロパティ変換ユーティリティ
 *
 * 物理的な CSS プロパティ（margin-left, padding-top など）を
 * 論理プロパティ（margin-inline-start, padding-block-start など）に変換する。
 * RTL（右から左）レイアウト対応のコードベース移行に役立つ。
 */

/**
 * 物理プロパティ → 論理プロパティのマッピングテーブル
 */
export const PROPERTY_MAP: Record<string, string> = {
  // margin
  "margin-top": "margin-block-start",
  "margin-bottom": "margin-block-end",
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  // padding
  "padding-top": "padding-block-start",
  "padding-bottom": "padding-block-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  // border shorthand
  "border-top": "border-block-start",
  "border-bottom": "border-block-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  // border-width
  "border-top-width": "border-block-start-width",
  "border-bottom-width": "border-block-end-width",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  // border-color
  "border-top-color": "border-block-start-color",
  "border-bottom-color": "border-block-end-color",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  // border-style
  "border-top-style": "border-block-start-style",
  "border-bottom-style": "border-block-end-style",
  "border-left-style": "border-inline-start-style",
  "border-right-style": "border-inline-end-style",
  // border-radius
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  // sizing
  width: "inline-size",
  height: "block-size",
  "min-width": "min-inline-size",
  "min-height": "min-block-size",
  "max-width": "max-inline-size",
  "max-height": "max-block-size",
  // position inset
  top: "inset-block-start",
  bottom: "inset-block-end",
  left: "inset-inline-start",
  right: "inset-inline-end",
  // overflow
  "overflow-x": "overflow-inline",
  "overflow-y": "overflow-block",
  // overscroll-behavior
  "overscroll-behavior-x": "overscroll-behavior-inline",
  "overscroll-behavior-y": "overscroll-behavior-block",
};

/**
 * 特定のプロパティの値も変換が必要なマッピング
 */
export const VALUE_MAP: Record<string, Record<string, string>> = {
  float: { left: "inline-start", right: "inline-end" },
  "text-align": { left: "start", right: "end" },
  resize: { horizontal: "inline", vertical: "block" },
  clear: { left: "inline-start", right: "inline-end" },
};

/**
 * 変換結果の各行
 */
export interface ConvertedLine {
  /** 元の行テキスト */
  original: string;
  /** 変換後の行テキスト（変換なしの場合は original と同じ） */
  converted: string;
  /** 変換が行われたか */
  changed: boolean;
}

/**
 * CSS 変換結果
 */
export interface ConvertResult {
  /** 変換後のCSS全文 */
  output: string;
  /** 各行の変換詳細 */
  lines: ConvertedLine[];
  /** 変換された行の数 */
  changedCount: number;
}

/**
 * CSS の1行（プロパティ: 値;）を論理プロパティに変換する
 *
 * @param line - CSS の1行
 * @returns 変換結果
 */
export function convertCssLine(line: string): ConvertedLine {
  // 空行・コメント行・セレクタ行はそのまま返す
  const trimmed = line.trim();
  if (
    !trimmed ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    !trimmed.includes(":")
  ) {
    return { original: line, converted: line, changed: false };
  }

  // プロパティと値を分割（最初の : で分割）
  const colonIdx = trimmed.indexOf(":");
  const prop = trimmed.slice(0, colonIdx).trim();
  const rest = trimmed.slice(colonIdx + 1); // ": value;" の部分

  // プロパティ変換
  const logicalProp = PROPERTY_MAP[prop];
  if (logicalProp) {
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : "";
    const converted = `${indent}${logicalProp}:${rest}`;
    return { original: line, converted, changed: true };
  }

  // 値変換が必要なプロパティ
  const valueMapping = VALUE_MAP[prop];
  if (valueMapping) {
    // 値部分（セミコロン前）を取り出す
    const valueRaw = rest.replace(/;.*$/, "").trim();
    const newValue = valueMapping[valueRaw];
    if (newValue) {
      const hasSemicolon = rest.includes(";");
      const comment = rest.includes("/*") ? rest.slice(rest.indexOf("/*")) : "";
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : "";
      const converted = `${indent}${prop}: ${newValue}${hasSemicolon ? ";" : ""}${comment ? " " + comment : ""}`;
      return { original: line, converted, changed: true };
    }
  }

  return { original: line, converted: line, changed: false };
}

/**
 * CSS テキスト全体を論理プロパティに変換する
 *
 * @param css - 変換対象の CSS テキスト
 * @returns 変換結果
 */
export function convertCss(css: string): ConvertResult {
  const lines = css.split("\n");
  const convertedLines = lines.map(convertCssLine);
  const changedCount = convertedLines.filter((l) => l.changed).length;
  const output = convertedLines.map((l) => l.converted).join("\n");

  return { output, lines: convertedLines, changedCount };
}

/**
 * サンプル CSS のプリセット
 */
export const CSS_SAMPLES: { label: string; css: string }[] = [
  {
    label: "カードコンポーネント",
    css: `.card {
  width: 320px;
  min-height: 200px;
  margin-top: 16px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 24px;
  padding-bottom: 24px;
  padding-left: 16px;
  padding-right: 16px;
  border-left: 4px solid #6750a4;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  text-align: left;
}`,
  },
  {
    label: "フォームレイアウト",
    css: `.form-field {
  max-width: 480px;
  margin-bottom: 16px;
  padding-left: 12px;
  padding-right: 12px;
}

.form-label {
  margin-right: 8px;
  float: left;
}

.form-input {
  width: 100%;
  height: 40px;
  padding-top: 8px;
  padding-bottom: 8px;
  border-right: 1px solid #ccc;
  border-left: 1px solid #ccc;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}`,
  },
  {
    label: "ポジション指定",
    css: `.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.tooltip {
  max-width: 240px;
  min-width: 80px;
  margin-left: 8px;
  padding-left: 10px;
  padding-right: 10px;
  text-align: right;
}`,
  },
];
