/**
 * TOTP (Time-based One-Time Password) ジェネレーターユーティリティ
 * RFC 6238 (TOTP) / RFC 4226 (HOTP) 準拠
 */

/**
 * TOTP生成のオプション
 */
export interface TotpOptions {
  /** Base32エンコードされた秘密鍵 */
  secret: string;
  /** タイムステップ（秒）（デフォルト: 30） */
  period: number;
  /** OTPの桁数（デフォルト: 6） */
  digits: number;
  /** ハッシュアルゴリズム（デフォルト: "SHA-1"） */
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
}

/**
 * TOTP生成の結果
 */
export interface TotpResult {
  /** 生成されたOTPコード */
  code: string;
  /** 現在のタイムステップのカウンター値 */
  counter: number;
  /** 残り秒数 */
  remaining: number;
  /** タイムステップ（秒） */
  period: number;
}

/**
 * Base32アルファベット
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Base32文字列をUint8Arrayにデコードする
 * @param base32 - Base32エンコードされた文字列
 * @returns デコードされたバイト配列
 * @throws {Error} 無効なBase32文字が含まれる場合
 */
export function base32Decode(base32: string): Uint8Array {
  // パディングと空白を除去し大文字に変換
  const cleaned = base32.replace(/[\s=-]+/g, "").toUpperCase();

  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  // 無効な文字チェック
  for (const char of cleaned) {
    if (!BASE32_ALPHABET.includes(char)) {
      throw new Error(`無効なBase32文字: '${char}'`);
    }
  }

  let bits = "";
  for (const char of cleaned) {
    const val = BASE32_ALPHABET.indexOf(char);
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

/**
 * HMAC-SHA1を計算する（純粋なJavaScript実装）
 * @param key - HMACキー
 * @param message - メッセージ
 * @returns HMAC-SHA1ダイジェスト
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * HMAC-SHA256を計算する
 * @param key - HMACキー
 * @param message - メッセージ
 * @returns HMAC-SHA256ダイジェスト
 */
async function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * HMAC-SHA512を計算する
 * @param key - HMACキー
 * @param message - メッセージ
 * @returns HMAC-SHA512ダイジェスト
 */
async function hmacSha512(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(signature);
}

/**
 * カウンター値を8バイトのビッグエンディアンバイト配列に変換する
 * @param counter - カウンター値
 * @returns 8バイトのUint8Array
 */
export function counterToBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8);
  let value = counter;
  for (let i = 7; i >= 0; i--) {
    bytes[i] = value & 0xff;
    value = Math.floor(value / 256);
  }
  return bytes;
}

/**
 * HOTP (HMAC-based One-Time Password) を生成する（RFC 4226）
 * @param key - 秘密鍵のバイト配列
 * @param counter - カウンター値
 * @param digits - OTPの桁数
 * @param algorithm - ハッシュアルゴリズム
 * @returns OTPコード文字列
 */
export async function generateHotp(
  key: Uint8Array,
  counter: number,
  digits: number,
  algorithm: "SHA-1" | "SHA-256" | "SHA-512" = "SHA-1"
): Promise<string> {
  const counterBytes = counterToBytes(counter);

  let hmacResult: Uint8Array;
  switch (algorithm) {
    case "SHA-256":
      hmacResult = await hmacSha256(key, counterBytes);
      break;
    case "SHA-512":
      hmacResult = await hmacSha512(key, counterBytes);
      break;
    default:
      hmacResult = await hmacSha1(key, counterBytes);
      break;
  }

  // Dynamic Truncation (RFC 4226 Section 5.3)
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binary =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * TOTP (Time-based One-Time Password) を生成する（RFC 6238）
 * @param options - TOTP生成オプション
 * @param timestamp - タイムスタンプ（ミリ秒）。省略時は現在時刻
 * @returns TOTP生成結果
 * @throws {Error} 秘密鍵が空または無効な場合
 */
export async function generateTotp(
  options: TotpOptions,
  timestamp?: number
): Promise<TotpResult> {
  if (!options.secret.trim()) {
    throw new Error("秘密鍵を入力してください");
  }

  let key: Uint8Array;
  try {
    key = base32Decode(options.secret);
  } catch (e) {
    throw new Error(
      `秘密鍵のデコードに失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`
    );
  }

  if (key.length === 0) {
    throw new Error("秘密鍵が空です");
  }

  const now = timestamp ?? Date.now();
  const epochSeconds = Math.floor(now / 1000);
  const counter = Math.floor(epochSeconds / options.period);
  const remaining = options.period - (epochSeconds % options.period);

  const code = await generateHotp(key, counter, options.digits, options.algorithm);

  return {
    code,
    counter,
    remaining,
    period: options.period,
  };
}

/**
 * デフォルトのTOTPオプションを返す
 * @returns デフォルトオプション
 */
export function getDefaultTotpOptions(): TotpOptions {
  return {
    secret: "",
    period: 30,
    digits: 6,
    algorithm: "SHA-1",
  };
}

/**
 * テスト用のサンプル秘密鍵を返す（Base32）
 * RFC 6238のテストベクターで使用される "12345678901234567890" のBase32表現
 * @returns サンプル秘密鍵
 */
export function getSampleSecret(): string {
  return "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
}

/**
 * ランダムなBase32秘密鍵を生成する
 * @param length - 生成するバイト数（デフォルト: 20）
 * @returns Base32エンコードされた秘密鍵
 */
export function generateRandomSecret(length: number = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  let result = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const index = parseInt(bits.substring(i, i + 5), 2);
    result += BASE32_ALPHABET[index];
  }

  return result;
}

/**
 * otpauth:// URI を生成する
 * @param secret - Base32エンコードされた秘密鍵
 * @param issuer - 発行者名
 * @param account - アカウント名
 * @param options - TOTPオプション
 * @returns otpauth URI文字列
 */
export function generateOtpauthUri(
  secret: string,
  issuer: string,
  account: string,
  options: TotpOptions
): string {
  const params = new URLSearchParams({
    secret: secret.replace(/\s/g, ""),
    issuer,
    algorithm: options.algorithm.replace("-", ""),
    digits: options.digits.toString(),
    period: options.period.toString(),
  });

  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ===== RFC 6238 準拠 API（テスト・UIコンポーネント向け） =====

/**
 * HOTPコードを生成する（RFC 4226）- BigInt対応版
 * @param keyBytes - HMACキー（バイト列）
 * @param counter - カウンター値（BigInt）
 * @param digits - コード桁数（6または8）
 * @returns HOTPコード文字列（ゼロ埋め済み）
 */
export async function generateHOTP(
  keyBytes: Uint8Array,
  counter: bigint,
  digits: 6 | 8
): Promise<string> {
  // カウンターを8バイトビッグエンディアンに変換
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(c & 0xffn);
    c >>= 8n;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, counterBytes);
  const hmac = new Uint8Array(signature);

  // Dynamic Truncation
  const offset = hmac[19] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) >>>
    0;

  const modulus = Math.pow(10, digits);
  const otp = code % modulus;
  return String(otp).padStart(digits, "0");
}

/**
 * TOTPコードを生成する（RFC 6238）- シンプル API
 * @param secret - Base32エンコードされたシークレットキー
 * @param options - TOTPオプション
 * @returns TOTPコード文字列
 */
export async function generateTOTP(
  secret: string,
  options?: { digits?: 6 | 8; period?: number; timestamp?: number }
): Promise<string> {
  const digits = options?.digits ?? 6;
  const period = options?.period ?? 30;
  const timestamp = options?.timestamp ?? Math.floor(Date.now() / 1000);

  const keyBytes = base32Decode(secret);
  const counter = BigInt(Math.floor(timestamp / period));

  return generateHOTP(keyBytes, counter, digits);
}

/**
 * 現在のTOTP期間の残り秒数を返す
 * @param period - 有効期間（秒、デフォルト30）
 * @returns 残り秒数（1〜period）
 */
export function getRemainingSeconds(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  const remaining = period - (now % period);
  return remaining === 0 ? period : remaining;
}

/**
 * ランダムなBase32シークレットキーを生成する
 * @param length - バイト長（デフォルト20）
 * @returns Base32エンコードされたシークレット
 */
export function generateSecret(length: number = 20): string {
  return generateRandomSecret(length);
}

/**
 * otpauth:// URIを生成する（シンプル API）
 * @param secret - シークレットキー
 * @param account - アカウント名
 * @param issuer - 発行者名
 * @returns otpauth:// URI
 */
export function generateOtpauthUriSimple(
  secret: string,
  account: string,
  issuer: string
): string {
  const encodedAccount = encodeURIComponent(account);
  const encodedIssuer = encodeURIComponent(issuer);
  const label = issuer
    ? `${encodedIssuer}:${encodedAccount}`
    : encodedAccount;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
