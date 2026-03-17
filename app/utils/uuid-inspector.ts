/**
 * UUID インスペクター / デコーダー (RFC 4122 / RFC 9562)
 *
 * UUID の構造を解析してバージョン・バリアント・埋め込みデータを抽出する。
 */

/** UUID バージョン (1〜8) */
export type UUIDVersion = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** UUID バリアント */
export type UUIDVariant = 'ncs' | 'rfc4122' | 'microsoft' | 'future';

/** UUID フィールド分解 */
export interface UUIDComponents {
  /** time_low (ビット 0-31 / 8 hex chars) */
  timeLow: string;
  /** time_mid (ビット 32-47 / 4 hex chars) */
  timeMid: string;
  /** time_hi_and_version (ビット 48-63 / 4 hex chars) */
  timeHiAndVersion: string;
  /** clock_seq_hi_and_reserved (ビット 64-71 / 2 hex chars) */
  clockSeqHiRes: string;
  /** clock_seq_low (ビット 72-79 / 2 hex chars) */
  clockSeqLow: string;
  /** node (ビット 80-127 / 12 hex chars) */
  node: string;
}

/** UUID 解析結果 */
export interface UUIDInfo {
  /** 入力文字列 */
  raw: string;
  /** 正規化済み（ハイフン付き小文字） */
  normalized: string;
  /** 有効な UUID か */
  valid: boolean;
  /** エラーメッセージ（無効の場合） */
  error?: string;
  /** NIL UUID か */
  isNil?: boolean;
  /** Max UUID (RFC 9562) か */
  isMax?: boolean;
  /** UUID バージョン */
  version?: UUIDVersion;
  /** バージョンの説明ラベル */
  versionLabel?: string;
  /** UUID バリアント */
  variant?: UUIDVariant;
  /** バリアントの説明ラベル */
  variantLabel?: string;
  /** フィールド分解 */
  components?: UUIDComponents;
  /** 16進数バイト配列（16バイト） */
  hexBytes: string[];
  /** 128ビットバイナリ文字列 */
  binaryBits: string;
  // v1 / v6 固有
  /** グレゴリオ暦タイムスタンプ（100ns 刻み） */
  gregorianTicks?: bigint;
  /** 埋め込みタイムスタンプ (v1/v6/v7) */
  timestamp?: Date;
  /** クロックシーケンス (v1/v6) */
  clockSequence?: number;
  /** MAC アドレス (v1/v6) */
  macAddress?: string;
  // v7 固有
  /** Unix エポックタイムスタンプ (ms) */
  unixMs?: bigint;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** NIL UUID */
export const UUID_NIL = '00000000-0000-0000-0000-000000000000';

/** Max UUID (RFC 9562) */
export const UUID_MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const VERSION_LABELS: Record<UUIDVersion, string> = {
  1: 'v1 — 時刻ベース (グレゴリオ暦 + MAC アドレス)',
  2: 'v2 — DCE Security',
  3: 'v3 — MD5 ハッシュ (名前空間ベース)',
  4: 'v4 — 擬似乱数',
  5: 'v5 — SHA-1 ハッシュ (名前空間ベース)',
  6: 'v6 — 並べ替え時刻ベース (RFC 9562)',
  7: 'v7 — Unix エポック時刻 (RFC 9562)',
  8: 'v8 — カスタム (RFC 9562)',
};

const VARIANT_LABELS: Record<UUIDVariant, string> = {
  ncs: 'NCS 後方互換 (0xxx)',
  rfc4122: 'RFC 4122 / RFC 9562 (10xx)',
  microsoft: 'Microsoft COM/DCOM 後方互換 (110x)',
  future: '将来使用のために予約 (111x)',
};

/**
 * 入力文字列を UUID 形式（ハイフン付き小文字）に正規化する
 */
function normalizeUUID(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(/[{}\s-]/g, '');
  if (cleaned.length === 32) {
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}-${cleaned.slice(16, 20)}-${cleaned.slice(20)}`;
  }
  return input.trim().toLowerCase();
}

/**
 * バリアントを検出する（byte 8 = clock_seq_hi_res の上位ビット）
 */
function detectVariant(byte8: number): UUIDVariant {
  if ((byte8 & 0x80) === 0x00) return 'ncs';       // 0xxx
  if ((byte8 & 0xc0) === 0x80) return 'rfc4122';   // 10xx
  if ((byte8 & 0xe0) === 0xc0) return 'microsoft'; // 110x
  return 'future';                                   // 111x
}

/**
 * UUID を解析して詳細情報を返す
 * @param input - UUID 文字列（ハイフンあり/なし、{} 付きも可）
 * @returns 解析結果
 */
export function parseUUID(input: string): UUIDInfo {
  const normalized = normalizeUUID(input);

  if (!UUID_REGEX.test(normalized)) {
    return {
      raw: input,
      normalized,
      valid: false,
      error: '無効な UUID 形式です（xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx 形式が必要です）',
      hexBytes: [],
      binaryBits: '',
    };
  }

  const plain = normalized.replace(/-/g, '');
  const hexBytes: string[] = [];
  for (let i = 0; i < 32; i += 2) hexBytes.push(plain.slice(i, i + 2));
  const binaryBits = hexBytes.map(b => parseInt(b, 16).toString(2).padStart(8, '0')).join('');

  const components: UUIDComponents = {
    timeLow: plain.slice(0, 8),
    timeMid: plain.slice(8, 12),
    timeHiAndVersion: plain.slice(12, 16),
    clockSeqHiRes: plain.slice(16, 18),
    clockSeqLow: plain.slice(18, 20),
    node: plain.slice(20, 32),
  };

  const isNil = normalized === UUID_NIL;
  const isMax = normalized === UUID_MAX;

  if (isNil || isMax) {
    return { raw: input, normalized, valid: true, isNil, isMax, components, hexBytes, binaryBits };
  }

  // バージョン: time_hi_and_version の最上位ニブル（ビット 76-79）
  const versionNibble = parseInt(plain[12], 16);
  const version: UUIDVersion | undefined =
    versionNibble >= 1 && versionNibble <= 8 ? (versionNibble as UUIDVersion) : undefined;

  // バリアント: byte 8 (clock_seq_hi_res)
  const clockSeqByte = parseInt(components.clockSeqHiRes, 16);
  const variant = detectVariant(clockSeqByte);

  const result: UUIDInfo = {
    raw: input,
    normalized,
    valid: true,
    version,
    versionLabel: version ? VERSION_LABELS[version] : '不明',
    variant,
    variantLabel: VARIANT_LABELS[variant],
    components,
    hexBytes,
    binaryBits,
  };

  // v1 / v6 固有情報（グレゴリオ暦タイムスタンプ）
  if (version === 1 || version === 6) {
    try {
      let ticks: bigint;
      if (version === 1) {
        // v1: 60ビットタイムスタンプ = time_hi[0:12] | time_mid | time_low
        const hi = (parseInt(components.timeHiAndVersion, 16) & 0x0fff).toString(16).padStart(3, '0');
        ticks = BigInt('0x' + hi + components.timeMid + components.timeLow);
      } else {
        // v6: 最初の48ビット（MSB優先）+ バージョン後の12ビット
        const hi48 = plain.slice(0, 12);
        const lo12 = (parseInt(plain.slice(13, 16), 16) & 0x0fff).toString(16).padStart(3, '0');
        ticks = BigInt('0x' + hi48 + lo12);
      }
      // グレゴリオ暦エポック (1582-10-15) → Unix エポック (1970-01-01) の補正
      const GREGORIAN_OFFSET = 122192928000000000n; // 100ns 刻み
      const unixMs = (ticks - GREGORIAN_OFFSET) / 10000n;
      result.gregorianTicks = ticks;
      result.timestamp = new Date(Number(unixMs));
      // クロックシーケンス: バリアントビット 2 ビットを除いた 14 ビット
      result.clockSequence = ((clockSeqByte & 0x3f) << 8) | parseInt(components.clockSeqLow, 16);
      result.macAddress = (components.node.match(/.{2}/g) ?? []).join(':');
    } catch { /* タイムスタンプ抽出失敗は無視 */ }
  } else if (version === 7) {
    // v7: 先頭 48 ビット = Unix タイムスタンプ (ms)
    const ms = BigInt('0x' + plain.slice(0, 12));
    result.unixMs = ms;
    result.timestamp = new Date(Number(ms));
  }

  return result;
}

/** UUID サンプルリスト */
export const UUID_SAMPLES: { label: string; value: string }[] = [
  { label: 'v4 (ランダム)', value: '550e8400-e29b-41d4-a716-446655440000' },
  { label: 'v1 (時刻)', value: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
  { label: 'v7 (Unix)', value: '018f5e00-0000-7000-8000-000000000000' },
  { label: 'v3 (MD5)', value: '6fa459ea-ee8a-3ca4-894e-db77e160355e' },
  { label: 'NIL', value: UUID_NIL },
];
