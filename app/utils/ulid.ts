/**
 * ULID (Universally Unique Lexicographically Sortable Identifier) ユーティリティ
 *
 * ULID 仕様: https://github.com/ulid/spec
 * - 26 文字の Crockford Base32 文字列
 * - 先頭 10 文字: 48 ビット Unix タイムスタンプ（ms）
 * - 後続 16 文字: 80 ビット暗号論的乱数
 * - 辞書順ソート可能・大文字小文字非区別
 */

/** Crockford Base32 アルファベット（I/L/O/U を除外） */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** ULID の文字数 */
export const ULID_LENGTH = 26;

/** タイムスタンプ部分の文字数 */
const TS_CHARS = 10;

/** ランダム部分の文字数 */
const RND_CHARS = 16;

/**
 * bigint を Crockford Base32 にエンコードする
 * @param value - エンコードする値
 * @param length - 出力文字数
 * @returns エンコード済み文字列（固定長）
 */
function encodeBase32(value: bigint, length: number): string {
  let result = "";
  let n = value;
  for (let i = length - 1; i >= 0; i--) {
    result = CROCKFORD[Number(n & 31n)] + result;
    n >>= 5n;
  }
  return result;
}

/**
 * Crockford Base32 文字列を bigint にデコードする
 * @param str - デコードする文字列
 * @returns デコード済みの bigint
 * @throws 不正な文字が含まれる場合
 */
function decodeBase32(str: string): bigint {
  let result = 0n;
  for (const char of str.toUpperCase()) {
    const idx = CROCKFORD.indexOf(char);
    if (idx < 0) {
      throw new Error(`不正な文字: "${char}"`);
    }
    result = (result << 5n) | BigInt(idx);
  }
  return result;
}

/**
 * ULID を生成する
 * @returns 26 文字の ULID 文字列（大文字）
 */
export function generateULID(): string {
  const ts = BigInt(Date.now());
  const tsPart = encodeBase32(ts, TS_CHARS);

  // 80 ビット = 10 バイトの乱数
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  let randomBig = 0n;
  for (const byte of randomBytes) {
    randomBig = (randomBig << 8n) | BigInt(byte);
  }
  // 80 ビット分のみ使用（16 chars × 5 bits）
  randomBig &= (1n << 80n) - 1n;
  const rndPart = encodeBase32(randomBig, RND_CHARS);

  return tsPart + rndPart;
}

/**
 * ULID が正しい形式かどうかを検証する
 * @param ulid - 検証する文字列
 * @returns 有効な場合 true
 */
export function isValidULID(ulid: string): boolean {
  if (ulid.length !== ULID_LENGTH) return false;
  const upper = ulid.toUpperCase();
  for (const char of upper) {
    if (!CROCKFORD.includes(char)) return false;
  }
  // タイムスタンプ部分が最大値を超えていないか確認（48ビット上限）
  try {
    const ts = decodeBase32(upper.slice(0, TS_CHARS));
    // 48ビット = 281474976710655
    if (ts > 281474976710655n) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * ULID 解析結果の型
 */
export interface ULIDParsed {
  /** 元の ULID 文字列 */
  raw: string;
  /** 正規化済み（大文字） */
  normalized: string;
  /** タイムスタンプ文字列（先頭 10 文字） */
  timestampPart: string;
  /** ランダム文字列（後続 16 文字） */
  randomnessPart: string;
  /** タイムスタンプの Date オブジェクト */
  timestamp: Date;
  /** Unix タイムスタンプ（ms） */
  unixMs: number;
  /** 有効かどうか */
  valid: boolean;
  /** エラーメッセージ（無効の場合） */
  error?: string;
}

/**
 * ULID をパースして詳細情報を返す
 * @param ulid - パースする ULID 文字列
 * @returns パース結果
 */
export function parseULID(ulid: string): ULIDParsed {
  const normalized = ulid.trim().toUpperCase();

  if (normalized.length !== ULID_LENGTH) {
    return {
      raw: ulid,
      normalized,
      timestampPart: "",
      randomnessPart: "",
      timestamp: new Date(0),
      unixMs: 0,
      valid: false,
      error: `ULID は ${ULID_LENGTH} 文字である必要があります（現在: ${normalized.length} 文字）`,
    };
  }

  for (const char of normalized) {
    if (!CROCKFORD.includes(char)) {
      return {
        raw: ulid,
        normalized,
        timestampPart: normalized.slice(0, TS_CHARS),
        randomnessPart: normalized.slice(TS_CHARS),
        timestamp: new Date(0),
        unixMs: 0,
        valid: false,
        error: `不正な文字が含まれています: "${char}"（Crockford Base32 は I/L/O/U を含みません）`,
      };
    }
  }

  try {
    const tsBig = decodeBase32(normalized.slice(0, TS_CHARS));
    if (tsBig > 281474976710655n) {
      return {
        raw: ulid,
        normalized,
        timestampPart: normalized.slice(0, TS_CHARS),
        randomnessPart: normalized.slice(TS_CHARS),
        timestamp: new Date(0),
        unixMs: 0,
        valid: false,
        error: "タイムスタンプ部分が有効範囲（48 ビット）を超えています",
      };
    }
    const unixMs = Number(tsBig);
    return {
      raw: ulid,
      normalized,
      timestampPart: normalized.slice(0, TS_CHARS),
      randomnessPart: normalized.slice(TS_CHARS),
      timestamp: new Date(unixMs),
      unixMs,
      valid: true,
    };
  } catch (e) {
    return {
      raw: ulid,
      normalized,
      timestampPart: normalized.slice(0, TS_CHARS),
      randomnessPart: normalized.slice(TS_CHARS),
      timestamp: new Date(0),
      unixMs: 0,
      valid: false,
      error: `パースエラー: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
