/**
 * 文字列エスケープ/アンエスケープユーティリティ
 * JavaScript・JSON・Python・正規表現・Shell向けの文字列エスケープ変換を提供する
 */

/** エスケープモードの型定義 */
export type EscapeMode =
  | "js-double"
  | "js-single"
  | "js-template"
  | "json"
  | "python-double"
  | "python-single"
  | "regex"
  | "shell";

/** エスケープモードのメタ情報 */
export interface EscapeModeInfo {
  /** モードID */
  id: EscapeMode;
  /** 表示名 */
  label: string;
  /** 説明 */
  description: string;
  /** 出力の囲み文字（表示用） */
  wrapper?: { open: string; close: string };
  /** アンエスケープをサポートするか */
  supportsUnescape: boolean;
}

/** 利用可能なエスケープモード一覧 */
export const ESCAPE_MODES: EscapeModeInfo[] = [
  {
    id: "js-double",
    label: "JS (ダブルクォート)",
    description: "JavaScriptのダブルクォート文字列リテラル用にエスケープ",
    wrapper: { open: '"', close: '"' },
    supportsUnescape: true,
  },
  {
    id: "js-single",
    label: "JS (シングルクォート)",
    description: "JavaScriptのシングルクォート文字列リテラル用にエスケープ",
    wrapper: { open: "'", close: "'" },
    supportsUnescape: true,
  },
  {
    id: "js-template",
    label: "JS (テンプレートリテラル)",
    description: "JavaScriptのテンプレートリテラル用にエスケープ（バッククォート・${）",
    wrapper: { open: "`", close: "`" },
    supportsUnescape: true,
  },
  {
    id: "json",
    label: "JSON",
    description: "JSON文字列値用にエスケープ（RFC 8259準拠）",
    wrapper: { open: '"', close: '"' },
    supportsUnescape: true,
  },
  {
    id: "python-double",
    label: "Python (ダブルクォート)",
    description: "Pythonのダブルクォート文字列リテラル用にエスケープ",
    wrapper: { open: '"', close: '"' },
    supportsUnescape: true,
  },
  {
    id: "python-single",
    label: "Python (シングルクォート)",
    description: "Pythonのシングルクォート文字列リテラル用にエスケープ",
    wrapper: { open: "'", close: "'" },
    supportsUnescape: true,
  },
  {
    id: "regex",
    label: "正規表現",
    description: "正規表現のメタ文字をエスケープして文字通りにマッチさせる",
    supportsUnescape: false,
  },
  {
    id: "shell",
    label: "Shell (Bash)",
    description: "Bashシェルのシングルクォート方式でエスケープ",
    wrapper: { open: "'", close: "'" },
    supportsUnescape: false,
  },
];

/**
 * JavaScriptダブルクォート文字列リテラル用にエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapeJsDouble(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * JavaScriptシングルクォート文字列リテラル用にエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapeJsSingle(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * JavaScriptテンプレートリテラル用にエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapeJsTemplate(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

/**
 * JSON文字列値用にエスケープする（RFC 8259準拠）
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapeJson(str: string): string {
  // JSON.stringifyで外側のクォートを除いたものを返す
  return JSON.stringify(str).slice(1, -1);
}

/**
 * Pythonダブルクォート文字列リテラル用にエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapePythonDouble(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0");
}

/**
 * Pythonシングルクォート文字列リテラル用にエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapePythonSingle(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0");
}

/**
 * 正規表現のメタ文字をエスケープする
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Bashシェルのシングルクォート方式でエスケープする
 * 文字列全体をシングルクォートで囲み、内部のシングルクォートを
 * '\'' のシーケンスに変換する
 * @param str - エスケープするテキスト
 * @returns エスケープ済み文字列（シングルクォートで囲まれたシェル引数）
 */
export function escapeShell(str: string): string {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * 共通のエスケープシーケンスをアンエスケープする（JS/JSON/Python対応）
 * \\n, \\t, \\r, \\\\, \\", \\', \\`, \\uXXXX などを処理する
 * @param str - アンエスケープするテキスト
 * @returns アンエスケープ済み文字列
 */
export function unescapeCommon(str: string): string {
  let result = "";
  let i = 0;
  while (i < str.length) {
    if (str[i] === "\\" && i + 1 < str.length) {
      const next = str[i + 1];
      switch (next) {
        case "n":
          result += "\n";
          i += 2;
          break;
        case "r":
          result += "\r";
          i += 2;
          break;
        case "t":
          result += "\t";
          i += 2;
          break;
        case "0":
          result += "\0";
          i += 2;
          break;
        case "\\":
          result += "\\";
          i += 2;
          break;
        case '"':
          result += '"';
          i += 2;
          break;
        case "'":
          result += "'";
          i += 2;
          break;
        case "`":
          result += "`";
          i += 2;
          break;
        case "$":
          // \${ のケース
          if (str[i + 2] === "{") {
            result += "${";
            i += 3;
          } else {
            result += "$";
            i += 2;
          }
          break;
        case "u": {
          // \uXXXX または \u{XXXXX}
          if (str[i + 2] === "{") {
            const end = str.indexOf("}", i + 3);
            if (end !== -1) {
              const hex = str.slice(i + 3, end);
              if (/^[0-9a-fA-F]+$/.test(hex)) {
                const codePoint = parseInt(hex, 16);
                result += String.fromCodePoint(codePoint);
                i = end + 1;
              } else {
                result += "\\u";
                i += 2;
              }
            } else {
              result += "\\u";
              i += 2;
            }
          } else if (i + 5 < str.length && /^[0-9a-fA-F]{4}$/.test(str.slice(i + 2, i + 6))) {
            result += String.fromCharCode(parseInt(str.slice(i + 2, i + 6), 16));
            i += 6;
          } else {
            result += "\\u";
            i += 2;
          }
          break;
        }
        case "x": {
          // \xXX
          if (i + 3 < str.length && /^[0-9a-fA-F]{2}$/.test(str.slice(i + 2, i + 4))) {
            result += String.fromCharCode(parseInt(str.slice(i + 2, i + 4), 16));
            i += 4;
          } else {
            result += "\\x";
            i += 2;
          }
          break;
        }
        default:
          result += "\\" + next;
          i += 2;
          break;
      }
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

/**
 * 指定したモードでテキストをエスケープする
 * @param str - エスケープするテキスト
 * @param mode - エスケープモード
 * @returns エスケープ済み文字列
 */
export function escapeString(str: string, mode: EscapeMode): string {
  switch (mode) {
    case "js-double":
      return escapeJsDouble(str);
    case "js-single":
      return escapeJsSingle(str);
    case "js-template":
      return escapeJsTemplate(str);
    case "json":
      return escapeJson(str);
    case "python-double":
      return escapePythonDouble(str);
    case "python-single":
      return escapePythonSingle(str);
    case "regex":
      return escapeRegex(str);
    case "shell":
      return escapeShell(str);
  }
}

/**
 * 指定したモードでテキストをアンエスケープする
 * @param str - アンエスケープするテキスト
 * @param mode - エスケープモード
 * @returns アンエスケープ済み文字列（モードがアンエスケープ非対応の場合はそのまま返す）
 */
export function unescapeString(str: string, mode: EscapeMode): string {
  const modeInfo = ESCAPE_MODES.find((m) => m.id === mode);
  if (!modeInfo?.supportsUnescape) return str;
  return unescapeCommon(str);
}
