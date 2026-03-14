/**
 * .envファイルのエントリ（キーと値のペア）
 */
export interface EnvEntry {
  /** 環境変数のキー */
  key: string;
  /** 環境変数の値 */
  value: string;
}

/**
 * .envパース結果
 */
export interface ParseResult {
  /** パースされたエントリ一覧 */
  entries: EnvEntry[];
  /** 重複しているキーの一覧 */
  duplicates: string[];
  /** パースエラーの一覧 */
  errors: Array<{ line: number; content: string }>;
}

/**
 * .envファイル形式のテキストをパースする
 * @param content - パース対象の文字列
 * @returns パース結果（エントリ、重複キー、エラー）
 */
export function parseEnv(content: string): ParseResult {
  const entries: EnvEntry[] = [];
  const keys = new Map<string, number>();
  const duplicates: string[] = [];
  const errors: Array<{ line: number; content: string }> = [];

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 空行・コメント行はスキップ
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      errors.push({ line: i + 1, content: line });
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    // 有効な変数名かチェック（アルファベット・アンダースコアで始まり、英数字・アンダースコアのみ）
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push({ line: i + 1, content: line });
      continue;
    }

    let value = line.slice(eqIndex + 1);
    // クォート付き値の処理（シングル・ダブルクォートを除去）
    const quote = value[0];
    if (
      value.length >= 2 &&
      (quote === '"' || quote === "'") &&
      value[value.length - 1] === quote
    ) {
      value = value.slice(1, -1);
    }

    if (keys.has(key)) {
      if (!duplicates.includes(key)) duplicates.push(key);
    }
    keys.set(key, i + 1);
    entries.push({ key, value });
  }

  return { entries, duplicates, errors };
}

/**
 * エントリをJSON形式に変換する
 * @param entries - 変換するエントリ一覧
 * @returns JSON形式の文字列
 */
export function toJSON(entries: EnvEntry[]): string {
  const obj: Record<string, string> = {};
  for (const { key, value } of entries) {
    obj[key] = value;
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * エントリをYAML形式に変換する
 * @param entries - 変換するエントリ一覧
 * @returns YAML形式の文字列
 */
export function toYAML(entries: EnvEntry[]): string {
  return entries
    .map(({ key, value }) => {
      const needsQuote =
        /[:#{}\[\],&*?|<>=!%@`]/.test(value) ||
        value === "" ||
        /^\s|\s$/.test(value) ||
        value.includes("\n") ||
        value.includes("\r");
      const escaped = needsQuote
        ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`
        : value;
      return `${key}: ${escaped}`;
    })
    .join("\n");
}

/**
 * エントリをShell export形式に変換する
 * @param entries - 変換するエントリ一覧
 * @returns Shell export形式の文字列
 */
export function toExports(entries: EnvEntry[]): string {
  return entries
    .map(
      ({ key, value }) =>
        `export ${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
    )
    .join("\n");
}
