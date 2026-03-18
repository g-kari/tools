/**
 * Nano ID ジェネレーター ユーティリティ
 *
 * Nano ID は UUID より短く、URL フレンドリーな一意識別子。
 * - デフォルト 21 文字（UUID 36 文字より短い）
 * - URL セーフなアルファベット（A–Za–z0–9_-）
 * - crypto.getRandomValues による暗号論的乱数使用
 */

/** デフォルトのアルファベット（URL セーフ、64 文字） */
export const DEFAULT_ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

/** デフォルトの ID サイズ */
export const DEFAULT_SIZE = 21;

/** プリセットアルファベット一覧 */
export const PRESET_ALPHABETS = {
  default: {
    label: "デフォルト（URL セーフ）",
    value: DEFAULT_ALPHABET,
  },
  alphanumeric: {
    label: "英数字のみ（A–Za–z0–9）",
    value: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  },
  lowercase: {
    label: "小文字英数字（a–z0–9）",
    value: "abcdefghijklmnopqrstuvwxyz0123456789",
  },
  uppercase: {
    label: "大文字英数字（A–Z0–9）",
    value: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  },
  hex: {
    label: "16 進数（0–9a–f）",
    value: "0123456789abcdef",
  },
  numbers: {
    label: "数字のみ（0–9）",
    value: "0123456789",
  },
  nolookalike: {
    label: "紛らわしい文字を除外",
    value: "346789ABCDEFGHJKLMNPQRTUVWXYabcdefghjkmnpqrtwxyz",
  },
} as const;

export type PresetKey = keyof typeof PRESET_ALPHABETS;

/**
 * 指定されたアルファベットと長さで Nano ID を生成する
 * @param size - 生成する ID の文字数（デフォルト: 21）
 * @param alphabet - 使用するアルファベット（デフォルト: URL セーフ）
 * @returns 生成された Nano ID
 */
export function generateNanoId(
  size: number = DEFAULT_SIZE,
  alphabet: string = DEFAULT_ALPHABET
): string {
  if (alphabet.length === 0) {
    throw new Error("アルファベットを 1 文字以上指定してください");
  }
  if (size < 1) {
    throw new Error("サイズは 1 以上を指定してください");
  }

  const alphabetLength = alphabet.length;
  // ビットマスクの計算（効率的なランダムバイト使用）
  const mask = (2 << (Math.log(alphabetLength - 1) / Math.LN2)) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabetLength);

  let id = "";
  while (id.length < size) {
    const bytes = new Uint8Array(step);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i] & mask;
      if (byte < alphabetLength) {
        id += alphabet[byte];
        if (id.length === size) break;
      }
    }
  }
  return id;
}

/**
 * Nano ID の衝突確率を計算する（目安）
 * @param size - ID のサイズ
 * @param alphabet - 使用するアルファベット
 * @param count - 生成する ID 数（デフォルト: 100万）
 * @returns 衝突確率の文字列表現
 */
export function calculateCollisionProbability(
  size: number,
  alphabet: string,
  count: number = 1_000_000
): string {
  const combinations = Math.pow(alphabet.length, size);
  // Birthday problem approximation: P ≈ n² / (2 * N)
  const probability = (count * count) / (2 * combinations);
  if (probability < 1e-15) {
    return "< 10⁻¹⁵（事実上ゼロ）";
  }
  const exp = Math.floor(Math.log10(probability));
  const mantissa = probability / Math.pow(10, exp);
  return `約 ${mantissa.toFixed(1)} × 10^${exp}`;
}

/**
 * アルファベットのエントロピー（ビット）を計算する
 * @param size - ID のサイズ
 * @param alphabet - 使用するアルファベット
 * @returns エントロピー（ビット）
 */
export function calculateEntropy(size: number, alphabet: string): number {
  return Math.log2(alphabet.length) * size;
}
