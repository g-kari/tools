/**
 * @fileoverview スラッグ生成ユーティリティ
 * URLフレンドリーなスラッグ文字列を生成する関数群
 */

/**
 * スラッグ変換オプション
 */
export interface SlugOptions {
  /** 区切り文字の種類（hyphen: ハイフン、underscore: アンダースコア） */
  separator: "hyphen" | "underscore";
  /** 小文字に変換するか */
  lowercase: boolean;
  /** 最大文字数（nullで制限なし） */
  maxLength: number | null;
}

/**
 * スラッグ変換オプションのデフォルト値
 */
export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: "hyphen",
  lowercase: true,
  maxLength: null,
};

/**
 * 入力テキストをURLフレンドリーなスラッグに変換する
 *
 * 処理の順序:
 * 1. 空文字列ガード: 入力が空なら空文字列を返す
 * 2. Unicode正規化（NFD）: アクセント付き文字を基底文字+結合文字に分解
 * 3. アクセント記号（結合文字）の除去
 * 4. CJK文字の除去（ひらがな、カタカナ、漢字など）
 * 5. 英数字以外の記号除去（スペース・ハイフン・アンダースコア以外）
 * 6. 区切り文字の統一
 * 7. 先頭・末尾のトリム
 * 8. 大文字小文字変換
 * 9. 最大文字数の適用と末尾セパレーター除去
 *
 * @param input - 変換する入力文字列
 * @param options - スラッグ生成オプション
 * @returns 生成されたスラッグ文字列
 *
 * @example
 * generateSlug("Hello World") // => "hello-world"
 * generateSlug("café") // => "cafe"
 * generateSlug("こんにちは World") // => "world"
 */
export function generateSlug(
  input: string,
  options: SlugOptions = DEFAULT_SLUG_OPTIONS
): string {
  // 1. 空文字列ガード
  if (!input) return "";

  const sep = options.separator === "underscore" ? "_" : "-";
  const escapedSep = sep === "-" ? "\\-" : "_";

  // 2. Unicode正規化（NFD）: アクセント付き文字を基底文字+結合文字に分解
  let result = input.normalize("NFD");

  // 3. アクセント記号（Unicode結合文字クラスMn）の除去
  result = result.replace(/\p{Mn}/gu, "");

  // 4. CJK文字の除去（ひらがな、カタカナ、漢字、全角記号など）をスペースに変換
  result = result.replace(
    /[\u3000-\u9fff\uff00-\uffef\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}]/gu,
    " "
  );

  // 5. 英数字以外の記号除去（スペース・ハイフン・アンダースコア以外）
  result = result.replace(/[^a-zA-Z0-9\s\-_]/g, "");

  // 6. 区切り文字の統一（スペース、ハイフン、アンダースコアの連続を1つのセパレーターに）
  result = result.replace(/[\s\-_]+/g, sep);

  // 7. 先頭・末尾のトリム（セパレーター文字を含む）
  result = result.replace(
    new RegExp(`^[${escapedSep}]+|[${escapedSep}]+$`, "g"),
    ""
  );

  // 8. 大文字小文字変換
  if (options.lowercase) {
    result = result.toLowerCase();
  }

  // 9. 最大文字数の適用（0以下や無効値は無視）
  if (options.maxLength !== null && options.maxLength > 0) {
    result = result.slice(0, options.maxLength);
    // 切り詰め後の末尾セパレーターを除去
    result = result.replace(new RegExp(`[${escapedSep}]+$`, "g"), "");
  }

  return result;
}

/**
 * 文字列が有効なスラッグ形式かどうかを検証する
 *
 * 有効なスラッグの条件:
 * - 英数字のみ、またはハイフン・アンダースコアを含む英数字
 * - 先頭と末尾は必ず英数字
 * - 空文字列は無効
 *
 * @param slug - 検証するスラッグ文字列
 * @returns 有効なスラッグであれば true、それ以外は false
 *
 * @example
 * isValidSlug("hello-world") // => true
 * isValidSlug("-hello") // => false
 * isValidSlug("") // => false
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-zA-Z0-9]+([a-zA-Z0-9\-_]*[a-zA-Z0-9])?$/.test(slug);
}
