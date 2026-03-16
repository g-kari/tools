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
  const rawLines = text.split('\n');
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
        error: err instanceof Error ? err.message : '無効なJSON',
        isValid: false,
      });
      errorCount++;
    }
  });

  return { lines, validCount, errorCount, emptyCount };
}

/**
 * JSON Lines の各行を pretty-print 整形する
 *
 * @param text - 整形対象の JSON Lines テキスト
 * @param indent - インデント数（デフォルト: 2）
 * @returns 整形済みテキスト（各行が複数行に展開される）
 */
export function formatJsonLines(text: string, indent = 2): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
      continue;
    }
    try {
      result.push(JSON.stringify(JSON.parse(trimmed), null, indent));
    } catch {
      result.push(trimmed);
    }
  }

  // 末尾の連続する空行を除去
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  return result.join('\n');
}

/**
 * JSON Lines の各行を1行に圧縮する
 *
 * @param text - 圧縮対象のテキスト（複数行JSONや空行を含む可能性あり）
 * @returns 各行が1つの JSON 値になった JSON Lines テキスト
 */
export function minifyJsonLines(text: string): string {
  // 複数行 JSON（整形済み）を1行ずつに圧縮するため、
  // まず全体を連結して行ごとに分割するのではなく、
  // JSON オブジェクト/配列の境界を検出して分割する
  const lines = text.split('\n');
  const result: string[] = [];

  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // 空行はバッファが空なら無視、バッファがあればフラッシュを試みる
      if (buffer) {
        try {
          result.push(JSON.stringify(JSON.parse(buffer)));
          buffer = '';
        } catch {
          // まだ不完全な JSON の可能性
        }
      }
      continue;
    }

    buffer = buffer ? buffer + ' ' + trimmed : trimmed;

    // バッファが有効な JSON かチェック
    try {
      result.push(JSON.stringify(JSON.parse(buffer)));
      buffer = '';
    } catch {
      // まだ不完全 → バッファを継続
    }
  }

  // 残りのバッファを処理
  if (buffer) {
    try {
      result.push(JSON.stringify(JSON.parse(buffer)));
    } catch {
      result.push(buffer);
    }
  }

  return result.join('\n');
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
  const lines = text.split('\n');
  const items: unknown[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    try {
      items.push(JSON.parse(trimmed));
    } catch (err) {
      throw new Error(
        `行 ${i + 1} の JSON が無効です: ${err instanceof Error ? err.message : '解析エラー'}`
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
      `JSON の解析に失敗しました: ${err instanceof Error ? err.message : '解析エラー'}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error('入力はJSON配列（[ ... ]）である必要があります');
  }

  return (parsed as unknown[]).map((item) => JSON.stringify(item)).join('\n');
}
