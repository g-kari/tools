/**
 * INIファイルパーサー/フォーマッターユーティリティ
 * INI形式のテキストをパース・フォーマット・JSON変換するユーティリティ
 */

/** INIパースオプション */
export interface IniParseOptions {
  /** 行コメント文字 (デフォルト: [';', '#']) */
  commentChars?: string[];
  /** インラインコメントを許可するか (デフォルト: true) */
  allowInlineComments?: boolean;
  /** セクションなしのキーをグローバルセクションとして扱う名前 (デフォルト: '') */
  globalSection?: string;
  /** 重複キーを配列として扱うか (デフォルト: false) */
  multiValue?: boolean;
  /** キー・値の前後の空白をトリムするか (デフォルト: true) */
  trimWhitespace?: boolean;
}

/** INIフォーマットオプション */
export interface IniFormatOptions {
  /** セクション間の空行数 (デフォルト: 1) */
  sectionSpacing?: number;
  /** コメントを保持するか (デフォルト: true) */
  preserveComments?: boolean;
  /** キー・値の区切り文字 (デフォルト: ' = ') */
  separator?: string;
  /** コメント文字 (デフォルト: '; ') */
  commentChar?: string;
}

/** INIセクション */
export type IniSection = Record<string, string | string[]>;

/** INIデータ (セクション名 → セクション) */
export type IniData = Record<string, IniSection>;

/** パース結果 */
export interface IniParseResult {
  /** パースされたデータ */
  data: IniData;
  /** パースエラー (行番号とメッセージ) */
  errors: Array<{ line: number; message: string }>;
  /** 元のコメント情報（フォーマット時に利用） */
  comments: Array<{ line: number; text: string; section?: string; key?: string }>;
}

const DEFAULT_PARSE_OPTIONS: Required<IniParseOptions> = {
  commentChars: [";", "#"],
  allowInlineComments: true,
  globalSection: "",
  multiValue: false,
  trimWhitespace: true,
};

const DEFAULT_FORMAT_OPTIONS: Required<IniFormatOptions> = {
  sectionSpacing: 1,
  preserveComments: true,
  separator: " = ",
  commentChar: "; ",
};

/**
 * INIテキストをパースしてデータ構造に変換する
 * @param text - INI形式のテキスト
 * @param options - パースオプション
 * @returns パース結果
 */
export function parseIni(text: string, options: IniParseOptions = {}): IniParseResult {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  const data: IniData = {};
  const errors: Array<{ line: number; message: string }> = [];
  const comments: Array<{ line: number; text: string; section?: string; key?: string }> = [];

  let currentSection = opts.globalSection;
  const lines = text.split(/\r?\n/);

  // グローバルセクションを初期化
  data[currentSection] = {};

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let line = opts.trimWhitespace ? lines[i].trim() : lines[i];

    // 空行をスキップ
    if (line === "") continue;

    // コメント行
    if (opts.commentChars.some((c) => line.startsWith(c))) {
      comments.push({ line: lineNum, text: line, section: currentSection });
      continue;
    }

    // セクション行: [section-name]
    const sectionMatch = line.match(/^\[([^\]]+)\]/);
    if (sectionMatch) {
      const sectionName = opts.trimWhitespace ? sectionMatch[1].trim() : sectionMatch[1];
      if (!sectionName) {
        errors.push({ line: lineNum, message: "セクション名が空です" });
        continue;
      }
      currentSection = sectionName;
      if (!data[currentSection]) {
        data[currentSection] = {};
      }
      continue;
    }

    // キー・値行: key = value または key: value
    const separatorMatch = line.match(/^([^=:]+)[=:](.*)/);
    if (separatorMatch) {
      let key = separatorMatch[1];
      let value = separatorMatch[2];

      if (opts.trimWhitespace) {
        key = key.trim();
        value = value.trim();
      }

      if (!key) {
        errors.push({ line: lineNum, message: "キー名が空です" });
        continue;
      }

      // インラインコメントを除去
      if (opts.allowInlineComments) {
        for (const commentChar of opts.commentChars) {
          const commentIdx = findInlineCommentIndex(value, commentChar);
          if (commentIdx !== -1) {
            const commentText = value.slice(commentIdx);
            value = opts.trimWhitespace
              ? value.slice(0, commentIdx).trim()
              : value.slice(0, commentIdx);
            comments.push({ line: lineNum, text: commentText, section: currentSection, key });
            break;
          }
        }
      }

      // 引用符を除去
      value = unquote(value);

      if (opts.multiValue) {
        const section = data[currentSection];
        const existing = section[key];
        if (existing !== undefined) {
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            section[key] = [existing as string, value];
          }
        } else {
          section[key] = value;
        }
      } else {
        data[currentSection][key] = value;
      }

      continue;
    }

    // 解析できない行
    errors.push({ line: lineNum, message: `解析できない行: ${line}` });
  }

  // グローバルセクションが空の場合は削除
  if (Object.keys(data[opts.globalSection] ?? {}).length === 0) {
    delete data[opts.globalSection];
  }

  return { data, errors, comments };
}

/**
 * インラインコメントの開始位置を返す（引用符の外側のみ）
 */
function findInlineCommentIndex(value: string, commentChar: string): number {
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (inQuote) {
      if (ch === quoteChar && value[i - 1] !== "\\") {
        inQuote = false;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (value.startsWith(commentChar, i)) {
        // コメントの前に空白が必要（キーワードの一部でないことを確認）
        if (i > 0 && (value[i - 1] === " " || value[i - 1] === "\t")) {
          return i;
        }
      }
    }
  }
  return -1;
}

/**
 * 文字列の引用符を除去する
 */
function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\(.)/g, "$1");
  }
  return value;
}

/**
 * INIデータをテキスト形式にフォーマットする
 * @param data - INIデータ
 * @param options - フォーマットオプション
 * @returns INI形式のテキスト
 */
export function formatIni(data: IniData, options: IniFormatOptions = {}): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const lines: string[] = [];
  const spacer = "\n".repeat(opts.sectionSpacing);

  let isFirst = true;
  for (const [section, sectionData] of Object.entries(data)) {
    if (!isFirst) {
      lines.push(...spacer.split("\n").map(() => ""));
    }
    isFirst = false;

    // グローバルセクション（空文字）はセクションヘッダーを出力しない
    if (section !== "") {
      lines.push(`[${section}]`);
    }

    for (const [key, value] of Object.entries(sectionData)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          lines.push(`${key}${opts.separator}${v}`);
        }
      } else {
        lines.push(`${key}${opts.separator}${value}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * INIデータをJSONに変換する
 * @param data - INIデータ
 * @param includeGlobal - グローバルセクションを含めるか
 * @returns JSON互換オブジェクト
 */
export function iniToJson(data: IniData, includeGlobal = true): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [section, sectionData] of Object.entries(data)) {
    if (section === "" && !includeGlobal) continue;

    if (section === "") {
      // グローバルキーをトップレベルに
      for (const [key, value] of Object.entries(sectionData)) {
        result[key] = value;
      }
    } else {
      result[section] = { ...sectionData };
    }
  }

  return result;
}

/**
 * JSONオブジェクトをINIデータに変換する
 * @param json - JSON互換オブジェクト
 * @returns INIデータ
 */
export function jsonToIni(json: Record<string, unknown>): IniData {
  const data: IniData = {};
  const globalSection: IniSection = {};
  let hasGlobal = false;

  for (const [key, value] of Object.entries(json)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // セクション
      const section: IniSection = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          section[k] = v.map(String);
        } else {
          section[k] = String(v ?? "");
        }
      }
      data[key] = section;
    } else if (Array.isArray(value)) {
      // 配列はグローバルセクションのマルチバリューとして
      globalSection[key] = value.map(String);
      hasGlobal = true;
    } else {
      // プリミティブはグローバルセクションに
      globalSection[key] = String(value ?? "");
      hasGlobal = true;
    }
  }

  if (hasGlobal) {
    return { "": globalSection, ...data };
  }

  return data;
}

/**
 * INIパース結果の統計情報を取得する
 */
export interface IniStats {
  /** セクション数（グローバルセクション含む） */
  sectionCount: number;
  /** 総キー数 */
  totalKeys: number;
  /** コメント数 */
  commentCount: number;
  /** セクション別キー数 */
  sectionKeyCounts: Record<string, number>;
}

/**
 * INIデータの統計情報を計算する
 */
export function calcIniStats(result: IniParseResult): IniStats {
  const sectionKeyCounts: Record<string, number> = {};
  let totalKeys = 0;

  for (const [section, data] of Object.entries(result.data)) {
    const count = Object.keys(data).length;
    sectionKeyCounts[section === "" ? "(グローバル)" : section] = count;
    totalKeys += count;
  }

  return {
    sectionCount: Object.keys(result.data).length,
    totalKeys,
    commentCount: result.comments.length,
    sectionKeyCounts,
  };
}
