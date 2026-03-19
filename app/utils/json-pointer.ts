/**
 * JSON Pointer (RFC 6901) ユーティリティ
 * @module json-pointer
 */

/**
 * JSON Pointer評価の結果型
 */
export interface JsonPointerResult {
  /** 評価結果の値 */
  value: unknown;
  /** 結果をJSON文字列にフォーマットしたもの */
  formatted: string;
  /** 値の型名 */
  type: string;
}

/**
 * ドキュメント内のすべてのJSON Pointerを列挙した結果
 */
export interface PointerEntry {
  /** JSON Pointer文字列 */
  pointer: string;
  /** その値のJSON文字列表現 */
  value: string;
  /** 値の型 */
  type: string;
}

/**
 * JSON Pointer トークンをデコードする
 * `~1` → `/`, `~0` → `~` の順で展開する（RFC 6901 Section 3）
 * @param token - デコード対象のトークン
 * @returns デコードされたトークン
 */
export function decodeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * 文字列をJSON Pointerトークンとしてエンコードする
 * `~` → `~0`, `/` → `~1` の順でエスケープする（RFC 6901 Section 3）
 * @param key - エンコード対象のキー文字列
 * @returns エンコードされたトークン
 */
export function encodeToken(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * JSON Pointerを評価してドキュメントから値を取り出す（RFC 6901）
 * @param jsonText - JSON文字列
 * @param pointer - JSON Pointer文字列（例: `/store/book/0/title` または `""` でルート）
 * @returns 評価結果
 * @throws {Error} 無効なJSONまたはポインターが見つからない場合
 */
export function evaluateJsonPointer(jsonText: string, pointer: string): JsonPointerResult {
  if (!jsonText.trim()) {
    throw new Error('JSONを入力してください');
  }

  let doc: unknown;
  try {
    doc = JSON.parse(jsonText);
  } catch {
    throw new Error('無効なJSON形式です');
  }

  // 空文字列はルートドキュメントを指す
  if (pointer === '') {
    const formatted = JSON.stringify(doc, null, 2);
    return { value: doc, formatted, type: getTypeName(doc) };
  }

  if (!pointer.startsWith('/')) {
    throw new Error('JSON Pointerは "/" で始まる必要があります（例: /foo/bar）。ルートを参照するには空文字列を使用してください。');
  }

  // トークンに分割（先頭の "/" の後を "/" で分割）
  const tokens = pointer.slice(1).split('/').map(decodeToken);

  let current: unknown = doc;
  for (const token of tokens) {
    if (current === null || current === undefined) {
      throw new Error(`パス "${pointer}" は解決できません: null/undefined に到達しました`);
    }
    if (Array.isArray(current)) {
      if (token === '-') {
        throw new Error('"−" インデックスは読み取り専用評価では使用できません（RFC 6901）');
      }
      const idx = Number(token);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) {
        throw new Error(`配列インデックス "${token}" が範囲外です（配列長: ${current.length}）`);
      }
      current = current[idx];
    } else if (typeof current === 'object') {
      const obj = current as Record<string, unknown>;
      if (!(token in obj)) {
        throw new Error(`キー "${token}" がオブジェクトに存在しません`);
      }
      current = obj[token];
    } else {
      throw new Error(`プリミティブ値 (${typeof current}) にはアクセスできません（トークン: "${token}"）`);
    }
  }

  const formatted = JSON.stringify(current, null, 2) ?? 'null';
  return { value: current, formatted, type: getTypeName(current) };
}

/**
 * 値の型名を日本語で返す
 * @param value - 型を調べる値
 * @returns 型名の文字列
 */
function getTypeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array (${(value as unknown[]).length}件)`;
  if (typeof value === 'object') return `object (${Object.keys(value as object).length}キー)`;
  return typeof value;
}

/**
 * JSON ドキュメント内のすべての葉ノードのJSON Pointerを列挙する
 * @param jsonText - JSON文字列
 * @param maxEntries - 最大列挙数（デフォルト: 100）
 * @returns PointerEntry の配列
 * @throws {Error} 無効なJSONの場合
 */
export function enumeratePointers(jsonText: string, maxEntries: number = 100): PointerEntry[] {
  if (!jsonText.trim()) {
    throw new Error('JSONを入力してください');
  }

  let doc: unknown;
  try {
    doc = JSON.parse(jsonText);
  } catch {
    throw new Error('無効なJSON形式です');
  }

  const entries: PointerEntry[] = [];

  function traverse(node: unknown, currentPointer: string): void {
    if (entries.length >= maxEntries) return;

    if (node === null || typeof node !== 'object') {
      entries.push({
        pointer: currentPointer || '""',
        value: JSON.stringify(node),
        type: getTypeName(node),
      });
      return;
    }

    if (Array.isArray(node)) {
      if (node.length === 0) {
        entries.push({
          pointer: currentPointer || '""',
          value: '[]',
          type: `array (0件)`,
        });
        return;
      }
      for (let i = 0; i < node.length && entries.length < maxEntries; i++) {
        traverse(node[i], `${currentPointer}/${i}`);
      }
    } else {
      const keys = Object.keys(node as object);
      if (keys.length === 0) {
        entries.push({
          pointer: currentPointer || '""',
          value: '{}',
          type: `object (0キー)`,
        });
        return;
      }
      for (const key of keys) {
        if (entries.length >= maxEntries) break;
        const encodedKey = encodeToken(key);
        traverse((node as Record<string, unknown>)[key], `${currentPointer}/${encodedKey}`);
      }
    }
  }

  traverse(doc, '');
  return entries;
}

/**
 * サンプルJSONを返す
 * @returns JSON文字列
 */
export function getSampleJson(): string {
  return JSON.stringify(
    {
      store: {
        book: [
          { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
          { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
        ],
        bicycle: { color: 'red', price: 19.95 },
      },
      user: { name: 'Alice', active: true, tags: ['admin', 'editor'] },
    },
    null,
    2
  );
}

/**
 * サンプルJSON Pointer の例を返す
 */
export const EXAMPLE_POINTERS = [
  { pointer: '/store/book/0/title', label: '最初の本のタイトル' },
  { pointer: '/store/bicycle/color', label: '自転車の色' },
  { pointer: '/user/tags/1', label: 'ユーザーの2番目のタグ' },
  { pointer: '/store/book/1/price', label: '2番目の本の価格' },
  { pointer: '', label: 'ルート全体' },
];
