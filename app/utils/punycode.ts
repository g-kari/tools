/**
 * Punycode エンコーダー/デコーダー (RFC 3492 / IDNA 2008)
 *
 * 国際化ドメイン名 (IDN) の変換ユーティリティ。
 * ブラウザ組み込みの URL API でエンコード方向を処理し、
 * RFC 3492 アルゴリズムでデコード方向を処理する。
 */

// ---------------------------------------------------------------------------
// Bootstring パラメータ (RFC 3492 Section 5)
// ---------------------------------------------------------------------------
const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = 0x2d; // '-'

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/** バイアス適応関数 */
function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

/** 数値 → Bootstring 桁文字のコードポイント */
function encodeDigit(d: number): number {
  return d + (d < 26 ? 0x61 : 0x16); // a-z or 0-9
}

/** Bootstring 桁文字のコードポイント → 数値 */
function decodeDigit(cp: number): number {
  if (cp >= 0x30 && cp <= 0x39) return cp - 0x30 + 26; // '0'-'9' → 26-35
  if (cp >= 0x41 && cp <= 0x5a) return cp - 0x41; // 'A'-'Z' → 0-25
  if (cp >= 0x61 && cp <= 0x7a) return cp - 0x61; // 'a'-'z' → 0-25
  return BASE; // 無効
}

// ---------------------------------------------------------------------------
// ラベル単位の変換
// ---------------------------------------------------------------------------

/**
 * Unicode ラベル → Punycode ラベル (RFC 3492)
 * 純粋 ASCII の場合はそのまま返す。
 */
export function encodePunycodeLabel(input: string): string {
  const codePoints = [...input].map((c) => c.codePointAt(0)!);

  // ASCII のみなら変換不要
  if (codePoints.every((cp) => cp < 128)) return input;

  // --- 基本コードポイントをコピー ---
  let output = "";
  for (const cp of codePoints) {
    if (cp < 128) output += String.fromCodePoint(cp);
  }
  const basicLen = output.length;
  if (basicLen > 0) output += "-"; // デリミタ

  // --- 非基本コードポイントをエンコード ---
  let processed = basicLen;
  let delta = 0;
  let bias = INITIAL_BIAS;
  let n = INITIAL_N;

  while (processed < codePoints.length) {
    // 未処理のコードポイントの中から最小値を取得
    let m = Infinity;
    for (const cp of codePoints) {
      if (cp >= n && cp < m) m = cp;
    }

    delta += (m - n) * (processed + 1);
    n = m;

    for (const cp of codePoints) {
      if (cp < n) {
        delta++;
        if (delta === 0) throw new Error("オーバーフロー");
      }
      if (cp === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const t = k <= bias + TMIN ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          const qMinusT = q - t;
          const baseMinusT = BASE - t;
          output += String.fromCodePoint(encodeDigit(t + (qMinusT % baseMinusT)));
          q = Math.floor(qMinusT / baseMinusT);
        }
        output += String.fromCodePoint(encodeDigit(q));
        bias = adaptBias(delta, processed + 1, processed === basicLen);
        delta = 0;
        processed++;
      }
    }
    delta++;
    n++;
  }

  return "xn--" + output;
}

/**
 * Punycode ラベル → Unicode ラベル (RFC 3492)
 * xn-- で始まらない場合はそのまま返す。
 */
export function decodePunycodeLabel(input: string): string {
  const lower = input.toLowerCase();
  if (!lower.startsWith("xn--")) return input;

  const encoded = lower.slice(4); // 'xn--' を除去
  const output: number[] = [];

  // --- 基本コードポイントをコピー ---
  const delimPos = encoded.lastIndexOf(String.fromCodePoint(DELIMITER));
  const basicEnd = delimPos > 0 ? delimPos : 0;

  for (let j = 0; j < basicEnd; j++) {
    const cp = encoded.codePointAt(j)!;
    if (cp >= 128) throw new Error("基本部分に非 ASCII が含まれています");
    output.push(cp);
  }

  // --- 可変長整数を復号 ---
  let pos = delimPos > 0 ? delimPos + 1 : 0;
  let i = 0;
  let bias = INITIAL_BIAS;
  let n = INITIAL_N;

  while (pos < encoded.length) {
    const oldi = i;
    let w = 1;

    for (let k = BASE; ; k += BASE) {
      if (pos >= encoded.length) throw new Error("無効な Punycode 入力です");
      const digit = decodeDigit(encoded.codePointAt(pos)!);
      pos++;
      if (digit >= BASE) throw new Error(`無効な文字: "${encoded[pos - 1]}"`);
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
    }

    bias = adaptBias(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i, 0, n);
    i++;
  }

  return output.map((cp) => String.fromCodePoint(cp)).join("");
}

// ---------------------------------------------------------------------------
// ドメイン全体の変換
// ---------------------------------------------------------------------------

/** ラベル変換情報 */
export interface LabelInfo {
  /** 変換前のラベル */
  original: string;
  /** 変換後のラベル */
  converted: string;
  /** 変換が発生したか */
  changed: boolean;
}

/** 変換結果 */
export interface PunycodeResult {
  /** 入力文字列 */
  input: string;
  /** 出力文字列 */
  output: string;
  /** ラベルごとの変換情報 */
  labels: LabelInfo[];
  /** 変換が発生したか */
  hasConversion: boolean;
}

/**
 * ドメインを Unicode → Punycode に変換する
 */
export function encodeDomain(domain: string): PunycodeResult {
  const trimmed = domain.trim();
  const labels = trimmed.split(".");
  const labelInfos: LabelInfo[] = labels.map((label) => {
    if (!label) return { original: label, converted: label, changed: false };
    const converted = encodePunycodeLabel(label);
    return { original: label, converted, changed: converted !== label };
  });
  const output = labelInfos.map((l) => l.converted).join(".");
  return {
    input: domain,
    output,
    labels: labelInfos,
    hasConversion: labelInfos.some((l) => l.changed),
  };
}

/**
 * ドメインを Punycode → Unicode に変換する
 */
export function decodeDomain(domain: string): PunycodeResult {
  const trimmed = domain.trim().toLowerCase();
  const labels = trimmed.split(".");
  const labelInfos: LabelInfo[] = labels.map((label) => {
    if (!label) return { original: label, converted: label, changed: false };
    const converted = decodePunycodeLabel(label);
    return { original: label, converted, changed: converted !== label };
  });
  const output = labelInfos.map((l) => l.converted).join(".");
  return {
    input: domain,
    output,
    labels: labelInfos,
    hasConversion: labelInfos.some((l) => l.changed),
  };
}

/**
 * 入力を自動判定して変換する
 * - xn-- を含む → Punycode → Unicode (デコード)
 * - それ以外 → Unicode → Punycode (エンコード)
 */
export function autoConvertDomain(domain: string): {
  mode: "encode" | "decode";
  result: PunycodeResult;
} {
  const trimmed = domain.trim().toLowerCase();
  const hasPunycode = trimmed.split(".").some((l) => l.startsWith("xn--"));
  if (hasPunycode) {
    return { mode: "decode", result: decodeDomain(trimmed) };
  }
  return { mode: "encode", result: encodeDomain(domain.trim()) };
}
