/**
 * 改行コード変換ユーティリティ
 *
 * テキストの改行コード（CRLF / LF / CR）を検出・変換する。
 */

/** 改行コードの種類 */
export type LineEnding = "CRLF" | "LF" | "CR";

/** 改行コードの検出結果 */
export interface LineEndingInfo {
  /** 検出された改行コードの種類（混在の場合は "Mixed"） */
  type: LineEnding | "Mixed" | "None";
  /** CRLF (\r\n) の個数 */
  crlfCount: number;
  /** LF のみ (\n) の個数 */
  lfCount: number;
  /** CR のみ (\r) の個数 */
  crCount: number;
  /** 総行数 */
  lineCount: number;
}

/**
 * テキストの改行コードを検出する
 * @param text 検出対象のテキスト
 * @returns 改行コードの検出結果
 */
export function detectLineEnding(text: string): LineEndingInfo {
  if (text.length === 0) {
    return { type: "None", crlfCount: 0, lfCount: 0, crCount: 0, lineCount: 0 };
  }

  // CRLF を先に数えてから LF/CR を数える（順序重要）
  const crlfCount = (text.match(/\r\n/g) ?? []).length;
  // CRLF を除いた残りの \n
  const lfCount = (text.replace(/\r\n/g, "").match(/\n/g) ?? []).length;
  // CRLF を除いた残りの \r
  const crCount = (text.replace(/\r\n/g, "").match(/\r/g) ?? []).length;

  const totalNewlines = crlfCount + lfCount + crCount;
  const lineCount = totalNewlines + 1;

  let type: LineEndingInfo["type"];
  if (totalNewlines === 0) {
    type = "None";
  } else {
    const typesPresent = [crlfCount > 0, lfCount > 0, crCount > 0].filter(Boolean).length;
    if (typesPresent > 1) {
      type = "Mixed";
    } else if (crlfCount > 0) {
      type = "CRLF";
    } else if (lfCount > 0) {
      type = "LF";
    } else {
      type = "CR";
    }
  }

  return { type, crlfCount, lfCount, crCount, lineCount };
}

/**
 * テキストの改行コードを指定した種類に変換する
 * @param text 変換対象のテキスト
 * @param to 変換先の改行コード
 * @returns 変換後のテキスト
 */
export function convertLineEnding(text: string, to: LineEnding): string {
  // まずすべての改行を \n に正規化してから変換
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  switch (to) {
    case "CRLF":
      return normalized.replace(/\n/g, "\r\n");
    case "LF":
      return normalized;
    case "CR":
      return normalized.replace(/\n/g, "\r");
  }
}

/** 改行コードの表示名マップ */
export const LINE_ENDING_LABELS: Record<LineEnding, string> = {
  CRLF: "CRLF (\\r\\n) — Windows",
  LF: "LF (\\n) — Unix / macOS",
  CR: "CR (\\r) — 旧 Mac",
};

/** 改行コードの短縮表示名 */
export const LINE_ENDING_SHORT: Record<LineEnding, string> = {
  CRLF: "CRLF",
  LF: "LF",
  CR: "CR",
};
