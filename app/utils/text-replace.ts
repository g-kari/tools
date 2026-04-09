/**
 * @fileoverview テキスト置換ユーティリティ
 * 正規表現・リテラル検索による検索置換機能を提供
 */

/**
 * テキスト置換オプション
 */
export interface ReplaceOptions {
  /** 正規表現モードを使用するか */
  useRegex: boolean;
  /** 大文字小文字を区別するか */
  caseSensitive: boolean;
  /** 全件置換か最初の1件のみか */
  replaceAll: boolean;
  /** 複数行モード（^と$が各行の先頭末尾にマッチ） */
  multiline: boolean;
}

/**
 * 置換結果
 */
export interface ReplaceResult {
  /** 置換後テキスト */
  output: string;
  /** マッチ件数 */
  matchCount: number;
  /** エラーメッセージ（正規表現が無効の場合） */
  error?: string;
}

/**
 * マッチ位置情報
 */
export interface MatchRange {
  /** マッチ開始インデックス */
  start: number;
  /** マッチ終了インデックス */
  end: number;
}

/**
 * テキスト中の検索パターンのマッチ位置を全件取得する
 * @param text - 検索対象テキスト
 * @param find - 検索文字列または正規表現パターン
 * @param options - 検索オプション
 * @returns マッチ位置の配列、またはエラー情報
 */
export function findMatches(
  text: string,
  find: string,
  options: ReplaceOptions,
): { matches: MatchRange[]; error?: string } {
  if (!find) return { matches: [] };

  try {
    const regex = buildRegex(find, options);
    const matches: MatchRange[] = [];

    let match: RegExpExecArray | null;
    // グローバルフラグがある場合は全マッチを収集
    if (regex.global) {
      while ((match = regex.exec(text)) !== null) {
        matches.push({ start: match.index, end: match.index + match[0].length });
        // 空マッチによる無限ループ防止
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      match = regex.exec(text);
      if (match) {
        matches.push({ start: match.index, end: match.index + match[0].length });
      }
    }

    return { matches };
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 検索オプションからRegExpオブジェクトを構築する
 * @param find - 検索文字列または正規表現パターン
 * @param options - 検索オプション
 * @returns RegExpオブジェクト
 */
export function buildRegex(find: string, options: ReplaceOptions): RegExp {
  const pattern = options.useRegex ? find : escapeRegex(find);
  let flags = "";
  if (options.replaceAll) flags += "g";
  if (!options.caseSensitive) flags += "i";
  if (options.multiline) flags += "m";
  return new RegExp(pattern, flags);
}

/**
 * 正規表現の特殊文字をエスケープする
 * @param str - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * テキストを検索・置換する
 * @param text - 置換対象テキスト
 * @param find - 検索文字列または正規表現パターン
 * @param replace - 置換文字列（正規表現モード時は$1等のバックリファレンス使用可）
 * @param options - 置換オプション
 * @returns 置換結果
 */
export function replaceText(
  text: string,
  find: string,
  replace: string,
  options: ReplaceOptions,
): ReplaceResult {
  if (!find) {
    return { output: text, matchCount: 0 };
  }

  try {
    const regex = buildRegex(find, { ...options, replaceAll: true });
    let matchCount = 0;

    // マッチ件数をカウント
    const countRegex = new RegExp(
      options.useRegex ? find : escapeRegex(find),
      "g" + (!options.caseSensitive ? "i" : "") + (options.multiline ? "m" : ""),
    );
    let m: RegExpExecArray | null;
    while ((m = countRegex.exec(text)) !== null) {
      matchCount++;
      if (m[0].length === 0) countRegex.lastIndex++;
    }

    if (matchCount === 0) {
      return { output: text, matchCount: 0 };
    }

    let output: string;
    if (options.replaceAll) {
      output = text.replace(regex, replace);
    } else {
      // 最初の1件のみ置換
      const singleRegex = buildRegex(find, { ...options, replaceAll: false });
      output = text.replace(singleRegex, replace);
      matchCount = Math.min(matchCount, 1);
    }

    return { output, matchCount };
  } catch (e) {
    return {
      output: text,
      matchCount: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
