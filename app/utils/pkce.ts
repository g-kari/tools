/**
 * PKCE（Proof Key for Code Exchange）ユーティリティ
 * RFC 7636 に準拠した実装
 * @see https://www.rfc-editor.org/rfc/rfc7636
 */

/**
 * PKCE code_verifier の生成結果
 */
export interface PkceResult {
  /** code_verifier 文字列（43〜128文字の URL-safe Base64） */
  codeVerifier: string;
  /** code_challenge 文字列（S256: SHA-256 → Base64URL） */
  codeChallenge: string;
  /** code_challenge_method */
  method: "S256" | "plain";
  /** code_verifier のバイト長 */
  byteLength: number;
}

/**
 * code_verifier の検証結果
 */
export interface VerifierValidation {
  /** 検証が通ったかどうか */
  valid: boolean;
  /** エラーメッセージ（valid が false の場合） */
  error?: string;
  /** 文字数 */
  length: number;
}

/**
 * Uint8Array を Base64URL エンコードする
 * Base64 の `+` を `-`、`/` を `_` に変換し、パディング `=` を除去する
 * @param bytes - 変換するバイト列
 * @returns Base64URL エンコード文字列
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * ランダムな code_verifier を生成する
 * RFC 7636 Section 4.1 に従い、43〜128 文字の URL-safe な乱数文字列を生成する
 * @param byteLength - ランダムバイト数（デフォルト 32 → 約 43 文字）
 * @returns code_verifier 文字列
 */
export function generateCodeVerifier(byteLength: number = 32): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * code_verifier から S256 方式の code_challenge を生成する
 * code_challenge = BASE64URL(SHA-256(ASCII(code_verifier)))
 * @param verifier - code_verifier 文字列
 * @returns code_challenge 文字列（非同期）
 */
export async function generateCodeChallengeS256(
  verifier: string
): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * code_verifier の plain 方式の code_challenge を返す
 * plain 方式は code_verifier をそのまま返す（セキュリティ上非推奨）
 * @param verifier - code_verifier 文字列
 * @returns code_challenge 文字列（= code_verifier）
 */
export function generateCodeChallengePlain(verifier: string): string {
  return verifier;
}

/**
 * PKCE ペア（code_verifier と code_challenge）を一括生成する
 * @param byteLength - code_verifier のランダムバイト数（デフォルト 32）
 * @param method - code_challenge の計算方式（デフォルト "S256"）
 * @returns PKCE ペア（非同期）
 */
export async function generatePkce(
  byteLength: number = 32,
  method: "S256" | "plain" = "S256"
): Promise<PkceResult> {
  const codeVerifier = generateCodeVerifier(byteLength);
  const codeChallenge =
    method === "S256"
      ? await generateCodeChallengeS256(codeVerifier)
      : generateCodeChallengePlain(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
    method,
    byteLength,
  };
}

/**
 * code_verifier が RFC 7636 Section 4.1 仕様に準拠しているか検証する
 * 許可文字: A-Z a-z 0-9 - . _ ~（UNRESERVED）
 * 長さ: 43〜128 文字
 * @param verifier - 検証する code_verifier 文字列
 * @returns 検証結果
 */
export function validateCodeVerifier(verifier: string): VerifierValidation {
  const length = verifier.length;

  if (length === 0) {
    return { valid: false, error: "code_verifier が空です。", length };
  }
  if (length < 43) {
    return {
      valid: false,
      error: `長さが不足しています（${length}文字）。RFC 7636 では 43 文字以上が必要です。`,
      length,
    };
  }
  if (length > 128) {
    return {
      valid: false,
      error: `長さが超過しています（${length}文字）。RFC 7636 では 128 文字以下が必要です。`,
      length,
    };
  }

  const validPattern = /^[A-Za-z0-9\-._~]+$/;
  if (!validPattern.test(verifier)) {
    return {
      valid: false,
      error:
        "使用できない文字が含まれています。A-Z a-z 0-9 - . _ ~ のみ使用可能です。",
      length,
    };
  }

  return { valid: true, length };
}
