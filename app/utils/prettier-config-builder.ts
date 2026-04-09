/**
 * @fileoverview .prettierrc ビルダーのオプション定義とジェネレーター
 * Prettier オプションのカテゴリ別定義と設定ファイル生成を管理する
 */

/** オプションの型 */
export type PrettierOptionType = "boolean" | "number" | "enum";

/**
 * Prettier オプションの定義
 */
export interface PrettierOption {
  /** オプション名（.prettierrc のキー） */
  key: string;
  /** オプションの説明 */
  description: string;
  /** 値の型 */
  type: PrettierOptionType;
  /** デフォルト値 */
  defaultValue: boolean | number | string;
  /** enum の選択肢 */
  choices?: string[];
  /** このオプションの推奨ユースケース */
  recommended?: string[];
}

/**
 * Prettier オプションのカテゴリ
 */
export interface PrettierCategory {
  /** カテゴリ識別子 */
  id: string;
  /** カテゴリ表示名 */
  label: string;
  /** カテゴリアイコン */
  icon: string;
  /** カテゴリに含まれるオプション */
  options: PrettierOption[];
}

/**
 * プリセット定義
 */
export interface PrettierPreset {
  /** プリセット識別子 */
  id: string;
  /** プリセット表示名 */
  label: string;
  /** プリセットの説明 */
  description: string;
  /** 設定値 */
  values: Record<string, boolean | number | string>;
}

/** Prettier オプションのカテゴリ一覧 */
export const PRETTIER_CATEGORIES: PrettierCategory[] = [
  {
    id: "basic",
    label: "基本設定",
    icon: "⚙️",
    options: [
      {
        key: "printWidth",
        description: "1行の最大文字数。この値を超えると折り返される（目安であり強制ではない）",
        type: "number",
        defaultValue: 80,
        recommended: ["推奨: 80〜120"],
      },
      {
        key: "tabWidth",
        description: "インデントのスペース数",
        type: "number",
        defaultValue: 2,
        recommended: ["推奨: 2 または 4"],
      },
      {
        key: "useTabs",
        description: "スペースの代わりにタブでインデントする",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "semi",
        description: "文末にセミコロンを付ける",
        type: "boolean",
        defaultValue: true,
        recommended: ["JavaScript", "TypeScript"],
      },
    ],
  },
  {
    id: "quotes",
    label: "引用符",
    icon: "💬",
    options: [
      {
        key: "singleQuote",
        description: "ダブルクォートの代わりにシングルクォートを使う",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "jsxSingleQuote",
        description: "JSX 属性値にシングルクォートを使う",
        type: "boolean",
        defaultValue: false,
        recommended: ["React", "JSX"],
      },
      {
        key: "quoteProps",
        description: "オブジェクトのプロパティ名を引用符で囲む方針",
        type: "enum",
        defaultValue: "as-needed",
        choices: ["as-needed", "consistent", "preserve"],
      },
    ],
  },
  {
    id: "trailing",
    label: "カンマ・ブラケット",
    icon: "🔤",
    options: [
      {
        key: "trailingComma",
        description: "末尾カンマの付け方。all は関数引数にも付け、es5 はオブジェクト・配列のみ",
        type: "enum",
        defaultValue: "all",
        choices: ["all", "es5", "none"],
        recommended: ["推奨: all（Prettier v3 デフォルト）"],
      },
      {
        key: "bracketSpacing",
        description: "オブジェクトリテラルのブラケット内にスペースを入れる（{ foo: bar }）",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "bracketSameLine",
        description: "JSX の閉じブラケット `>` を最終属性と同じ行に置く",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  {
    id: "functions",
    label: "関数",
    icon: "🔧",
    options: [
      {
        key: "arrowParens",
        description: "アロー関数の引数を丸括弧で囲む（always: 常に, avoid: 1引数なら省略）",
        type: "enum",
        defaultValue: "always",
        choices: ["always", "avoid"],
      },
    ],
  },
  {
    id: "lineEnding",
    label: "改行・折り返し",
    icon: "↩️",
    options: [
      {
        key: "endOfLine",
        description: "改行コードの種類。lf（Unix/Mac）, crlf（Windows）, auto（既存に合わせる）",
        type: "enum",
        defaultValue: "lf",
        choices: ["lf", "crlf", "cr", "auto"],
        recommended: ["推奨: lf（クロスプラットフォーム）"],
      },
      {
        key: "proseWrap",
        description: "Markdown のテキスト折り返し。always: 常に折り返す, never: 折り返さない",
        type: "enum",
        defaultValue: "preserve",
        choices: ["always", "never", "preserve"],
      },
    ],
  },
  {
    id: "html",
    label: "HTML",
    icon: "🌐",
    options: [
      {
        key: "htmlWhitespaceSensitivity",
        description: "HTML の空白感度。css: CSSのdisplay値に従う, strict: すべて重要, ignore: 無視",
        type: "enum",
        defaultValue: "css",
        choices: ["css", "strict", "ignore"],
      },
      {
        key: "singleAttributePerLine",
        description: "HTML/JSX/Vue の属性を1行1属性で記述する",
        type: "boolean",
        defaultValue: false,
        recommended: ["Vue", "HTML"],
      },
      {
        key: "embeddedLanguageFormatting",
        description:
          "HTML/Markdown 内に埋め込まれたコード（script, style等）を自動フォーマットするか",
        type: "enum",
        defaultValue: "auto",
        choices: ["auto", "off"],
      },
    ],
  },
];

/** プリセット一覧 */
export const PRETTIER_PRESETS: PrettierPreset[] = [
  {
    id: "default",
    label: "Prettier デフォルト",
    description: "Prettier v3 のデフォルト設定",
    values: {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      jsxSingleQuote: false,
      quoteProps: "as-needed",
      trailingComma: "all",
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: "always",
      endOfLine: "lf",
      proseWrap: "preserve",
      htmlWhitespaceSensitivity: "css",
      singleAttributePerLine: false,
      embeddedLanguageFormatting: "auto",
    },
  },
  {
    id: "typescript",
    label: "TypeScript",
    description: "TypeScript プロジェクト向けのシンプルな設定",
    values: {
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      jsxSingleQuote: false,
      quoteProps: "as-needed",
      trailingComma: "es5",
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: "always",
      endOfLine: "lf",
      proseWrap: "preserve",
      htmlWhitespaceSensitivity: "css",
      singleAttributePerLine: false,
      embeddedLanguageFormatting: "auto",
    },
  },
  {
    id: "react",
    label: "React",
    description: "React + TypeScript プロジェクト向け",
    values: {
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      jsxSingleQuote: false,
      quoteProps: "as-needed",
      trailingComma: "all",
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: "always",
      endOfLine: "lf",
      proseWrap: "preserve",
      htmlWhitespaceSensitivity: "css",
      singleAttributePerLine: false,
      embeddedLanguageFormatting: "auto",
    },
  },
  {
    id: "vue",
    label: "Vue",
    description: "Vue 3 プロジェクト向け",
    values: {
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      jsxSingleQuote: false,
      quoteProps: "as-needed",
      trailingComma: "es5",
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: "always",
      endOfLine: "lf",
      proseWrap: "preserve",
      htmlWhitespaceSensitivity: "css",
      singleAttributePerLine: true,
      embeddedLanguageFormatting: "auto",
    },
  },
  {
    id: "no-semi",
    label: "セミコロンなし",
    description: "セミコロンを省略するスタイル（一部の Vue/Nuxt プロジェクトで採用）",
    values: {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: false,
      singleQuote: true,
      jsxSingleQuote: false,
      quoteProps: "as-needed",
      trailingComma: "es5",
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: "avoid",
      endOfLine: "lf",
      proseWrap: "preserve",
      htmlWhitespaceSensitivity: "css",
      singleAttributePerLine: false,
      embeddedLanguageFormatting: "auto",
    },
  },
];

/**
 * .prettierrc の JSON 文字列を生成する
 * デフォルト値と同じ値はスキップして最小構成を出力する
 * @param values - 設定値のマップ
 * @returns .prettierrc の JSON 文字列
 */
export function generatePrettierConfig(values: Record<string, boolean | number | string>): string {
  const config: Record<string, boolean | number | string> = {};

  // デフォルト値のマップを作成
  const defaults = getDefaultValues();

  for (const [key, value] of Object.entries(values)) {
    // デフォルト値と同じ値はスキップ（最小構成のため）
    if (value === defaults[key]) continue;
    config[key] = value;
  }

  return JSON.stringify(config, null, 2);
}

/**
 * 全カテゴリのデフォルト値を収集して初期状態を返す
 * @returns 初期値マップ
 */
export function getDefaultValues(): Record<string, boolean | number | string> {
  const defaults: Record<string, boolean | number | string> = {};
  for (const category of PRETTIER_CATEGORIES) {
    for (const option of category.options) {
      defaults[option.key] = option.defaultValue;
    }
  }
  return defaults;
}
