/**
 * @fileoverview JSON Lines（NDJSON）フォーマッター ユーティリティ
 *
 * JSON Lines フォーマットの解析・整形・変換機能を提供します。
 * JSON Lines は各行が独立した JSON 値であるテキストフォーマットです。
 */

/** 解析された1行分の情報 */
export interface JsonLine {
  /** 元の行番号（1始まり） */
  lineNumber: number;
  /** 元のテキスト（trim済み） */
  raw: string;
  /** パース済みの値 */
  parsed: unknown;
  /** エラーメッセージ（無効な場合のみ） */
  error?: string;
  /** バリデーション結果 */
  isValid: boolean;
}

/** JSON Lines 解析結果 */
export interface ParseJsonLinesResult {
  /** 有効・無効行を含む全行リスト（空行は除く） */
  lines: JsonLine[];
  /** 有効な行数 */
  validCount: number;
  /** エラーのある行数 */
  errorCount: number;
  /** スキップされた空行数 */
  emptyCount: number;
}

/**
 * JSON Lines テキストを解析して各行をバリデーションする
 *
 * @param text - 解析対象の JSON Lines テキスト
 * @returns 解析結果
 */
export function parseJsonLines(text: string): ParseJsonLinesResult {
  const rawLines = text.split("\n");
  const lines: JsonLine[] = [];
  let validCount = 0;
  let errorCount = 0;
  let emptyCount = 0;

  rawLines.forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      emptyCount++;
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      lines.push({
        lineNumber: index + 1,
        raw: trimmed,
        parsed,
        isValid: true,
      });
      validCount++;
    } catch (err) {
      lines.push({
        lineNumber: index + 1,
        raw: trimmed,
        parsed: null,
        error: err instanceof Error ? err.message : "無効なJSON",
        isValid: false,
      });
      errorCount++;
    }
  });

  return { lines, validCount, errorCount, emptyCount };
}

/**
 * JSON Lines の各行を1レコード1行のまま読みやすく整形する。
 * 文字列の外にあるコロンとカンマの後に空白を加える。
 * 無効な行は元のテキストのまま保持し、隣のレコードと結合しない。
 *
 * @param text - 整形対象の JSON Lines テキスト
 * @returns 整形済みテキスト（レコード内に改行を追加しない）
 */
export function formatJsonLines(text: string): string {
  const result = text.split("\n").map((line) => {
    if (!line.trim()) return "";
    try {
      const compact = JSON.stringify(JSON.parse(line.trim()));
      // 文字列トークン全体を先に一致させ、文字列内の句読点には触れない。
      return compact.replace(/"(?:[^"\\]|\\.)*"|[:,]/g, (token) =>
        token === ":" || token === "," ? `${token} ` : token,
      );
    } catch {
      return line;
    }
  });

  // 末尾の連続する空行を除去する。
  while (result.length > 0 && result[result.length - 1] === "") result.pop();
  return result.join("\n");
}

/**
 * JSON Lines の各レコードを1行のまま圧縮し、空行を除去する。
 * NDJSONとして行ごとに処理し、無効な行はそのまま保持する。
 * 複数行JSONの結合は行わない（JSON配列は専用モードで変換する）。
 *
 * @param text - 圧縮対象の JSON Lines テキスト
 * @returns 圧縮済みテキスト
 */
export function minifyJsonLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.stringify(JSON.parse(line.trim()));
      } catch {
        return line;
      }
    })
    .join("\n");
}

/**
 * JSON Lines テキストを JSON 配列に変換する
 *
 * @param text - 変換元の JSON Lines テキスト
 * @param indent - 出力 JSON のインデント数（デフォルト: 2）
 * @returns JSON 配列文字列
 * @throws 無効な行がある場合にエラーをスロー
 */
export function jsonLinesToJsonArray(text: string, indent = 2): string {
  const lines = text.split("\n");
  const items: unknown[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch (err) {
      throw new Error(
        `行 ${i + 1} の JSON が無効です: ${err instanceof Error ? err.message : "解析エラー"}`,
      );
    }
  }

  return JSON.stringify(items, null, indent);
}

/**
 * JSON 配列を JSON Lines に変換する
 *
 * @param text - 変換元の JSON 配列文字列
 * @returns JSON Lines テキスト（各行が1つの JSON 値）
 * @throws JSON 配列でない場合にエラーをスロー
 */
export function jsonArrayToJsonLines(text: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `JSON の解析に失敗しました: ${err instanceof Error ? err.message : "解析エラー"}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("入力はJSON配列（[ ... ]）である必要があります");
  }

  return (parsed as unknown[]).map((item) => JSON.stringify(item)).join("\n");
}
