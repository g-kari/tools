/**
 * Interface representing a decoded JWT token.
 */
export interface DecodedJWT {
  /** The formatted JSON header of the JWT */
  header: string;
  /** The formatted JSON payload of the JWT */
  payload: string;
  /** The signature part of the JWT (Base64URL encoded) */
  signature: string;
  /** The raw decoded header string */
  headerRaw: string;
  /** The raw decoded payload string */
  payloadRaw: string;
}

/**
 * Decodes a Base64URL encoded string to UTF-8.
 *
 * Base64URL encoding uses URL-safe characters by replacing '+' with '-' and '/' with '_',
 * and omitting padding '=' characters.
 *
 * @param str - The Base64URL encoded string to decode
 * @returns The decoded UTF-8 string
 * @throws {Error} If the Base64URL decoding fails
 *
 * @example
 * ```ts
 * const decoded = base64UrlDecode('eyJhbGciOiJIUzI1NiJ9');
 * console.log(decoded); // '{"alg":"HS256"}'
 * ```
 */
export function base64UrlDecode(str: string): string {
  // Base64URL to Base64: replace URL-safe characters
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  try {
    // Decode Base64
    const decoded = atob(base64);
    // Decode UTF-8
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
  } catch {
    throw new Error("Base64URLデコードに失敗しました");
  }
}

/**
 * Decodes a JWT (JSON Web Token) into its component parts.
 *
 * A JWT consists of three Base64URL-encoded parts separated by dots:
 * header.payload.signature
 *
 * This function decodes the header and payload into formatted JSON strings,
 * and returns the signature as-is.
 *
 * @param token - The JWT token string to decode
 * @returns An object containing the decoded header, payload, and signature
 * @throws {Error} If the JWT format is invalid or decoding fails
 *
 * @example
 * ```ts
 * const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
 * const decoded = decodeJWT(jwt);
 * console.log(decoded.header); // Formatted JSON header
 * console.log(decoded.payload); // Formatted JSON payload
 * console.log(decoded.signature); // 'abc123'
 * ```
 */
export function decodeJWT(token: string): DecodedJWT {
  const parts = token.trim().split(".");

  if (parts.length !== 3) {
    throw new Error("JWTは3つのパート（ヘッダー.ペイロード.署名）で構成されている必要があります");
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("JWTの各パートが空です");
  }

  try {
    const headerRaw = base64UrlDecode(headerPart);
    const payloadRaw = base64UrlDecode(payloadPart);

    // Parse and format as JSON
    const headerJson = JSON.parse(headerRaw);
    const payloadJson = JSON.parse(payloadRaw);

    return {
      header: JSON.stringify(headerJson, null, 2),
      payload: JSON.stringify(payloadJson, null, 2),
      signature: signaturePart,
      headerRaw,
      payloadRaw,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`デコードエラー: ${error.message}`);
    }
    throw new Error("JWTのデコードに失敗しました");
  }
}

// ===== JWT生成ユーティリティ =====

/** JWT署名アルゴリズム（HMAC） */
export type JwtAlgorithm = "HS256" | "HS384" | "HS512";

/** JWT検証で対応する署名アルゴリズム */
export type JwtVerifyAlgorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "none";

/** JWT生成の入力パラメータ */
export interface JwtGeneratorInput {
  /** JSONペイロード文字列 */
  payload: string;
  /** HMAC署名用シークレット */
  secret: string;
  /** 使用するアルゴリズム */
  algorithm: JwtAlgorithm;
}

/** JWT生成結果 */
export interface JwtGeneratorResult {
  /** 生成されたJWTトークン */
  token: string;
  /** フォーマット済みヘッダーJSON */
  header: string;
  /** フォーマット済みペイロードJSON（iat追加後） */
  payload: string;
}

/**
 * 文字列をBase64URL形式にエンコードする
 * @param str エンコードする文字列
 * @returns Base64URLエンコードされた文字列
 */
export function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * HMAC署名を生成する（Web Crypto API使用）
 * @param algorithm JWTアルゴリズム（HS256/HS384/HS512）
 * @param secretBytes シークレットのバイト列
 * @param dataBytes 署名対象データのバイト列
 * @returns 署名バイト列
 */
async function signHmac(
  algorithm: JwtAlgorithm,
  secretBytes: Uint8Array,
  dataBytes: Uint8Array,
): Promise<Uint8Array> {
  const hashAlgo =
    algorithm === "HS256" ? "SHA-256" : algorithm === "HS384" ? "SHA-384" : "SHA-512";
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: { name: hashAlgo } },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, dataBytes.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * JWTトークンを生成する
 * @param input 生成パラメータ（ペイロード・シークレット・アルゴリズム）
 * @returns 生成結果（トークン・ヘッダーJSON・ペイロードJSON）
 * @throws {Error} ペイロードが無効なJSONの場合
 */
export async function generateJWT(input: JwtGeneratorInput): Promise<JwtGeneratorResult> {
  // ペイロードのJSONパース
  let payloadObj: Record<string, unknown>;
  try {
    payloadObj = JSON.parse(input.payload);
  } catch {
    throw new Error("ペイロードが有効なJSONではありません");
  }

  // ヘッダー
  const headerObj = { alg: input.algorithm, typ: "JWT" };

  // iat クレームを自動付与
  const iat = Math.floor(Date.now() / 1000);
  const finalPayload = { ...payloadObj, iat };

  // エンコード
  const headerEncoded = base64UrlEncode(JSON.stringify(headerObj));
  const payloadEncoded = base64UrlEncode(JSON.stringify(finalPayload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // 署名
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(input.secret);
  const dataBytes = encoder.encode(signingInput);
  const signatureBytes = await signHmac(input.algorithm, secretBytes, dataBytes);

  // Base64URLエンコード（バイナリ）
  const signatureBase64 = btoa(String.fromCharCode(...signatureBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const token = `${signingInput}.${signatureBase64}`;

  return {
    token,
    header: JSON.stringify(headerObj, null, 2),
    payload: JSON.stringify(finalPayload, null, 2),
  };
}

// ===== JWT Inspector（検証・解析）ユーティリティ =====

/** exp/iat/nbf クレームの評価結果 */
export interface ClaimStatus {
  /** クレームが存在するか */
  present: boolean;
  /** Unix秒 */
  value?: number;
  /** ISO8601 の日時表示（ローカルタイム） */
  dateString?: string;
  /** exp で期限切れ、nbf でまだ有効でない */
  invalid?: boolean;
  /** 現在時刻との差（秒）。exp は残り、iat は経過、nbf は発効までの秒 */
  deltaSeconds?: number;
}

/** JWT ペイロードの時刻クレーム解析結果 */
export interface JwtClaimAnalysis {
  exp: ClaimStatus;
  iat: ClaimStatus;
  nbf: ClaimStatus;
  /** 評価時点の Unix 秒 */
  currentTime: number;
}

/**
 * ペイロード JSON 文字列から exp/iat/nbf を取り出し、現在時刻基準で状態を判定する。
 *
 * @param payloadRaw JSON 文字列化されたペイロード
 * @param now 現在時刻（Unix 秒、デフォルトは `Math.floor(Date.now() / 1000)`）
 */
export function analyzeClaims(payloadRaw: string, now?: number): JwtClaimAnalysis {
  const currentTime = now ?? Math.floor(Date.now() / 1000);
  const emptyStatus: ClaimStatus = { present: false };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payloadRaw);
  } catch {
    return { exp: emptyStatus, iat: emptyStatus, nbf: emptyStatus, currentTime };
  }

  const toStatus = (raw: unknown, kind: "exp" | "iat" | "nbf"): ClaimStatus => {
    if (typeof raw !== "number" || !Number.isFinite(raw)) return emptyStatus;
    const dateString = new Date(raw * 1000).toISOString();
    if (kind === "exp") {
      return {
        present: true,
        value: raw,
        dateString,
        invalid: currentTime >= raw,
        deltaSeconds: raw - currentTime,
      };
    }
    if (kind === "nbf") {
      return {
        present: true,
        value: raw,
        dateString,
        invalid: currentTime < raw,
        deltaSeconds: raw - currentTime,
      };
    }
    // iat
    return {
      present: true,
      value: raw,
      dateString,
      deltaSeconds: currentTime - raw,
    };
  };

  return {
    exp: toStatus(parsed.exp, "exp"),
    iat: toStatus(parsed.iat, "iat"),
    nbf: toStatus(parsed.nbf, "nbf"),
    currentTime,
  };
}

/** Base64URL 文字列をバイト配列へ変換する */
export function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** PEM 形式の公開鍵文字列から SPKI バイト列を抽出する */
export function pemToSpki(pem: string): Uint8Array {
  const stripped = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  if (!stripped) throw new Error("PEMが空です");
  const binary = atob(stripped);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** 検証結果 */
export interface JwtVerifyResult {
  /** 署名検証に成功したか */
  verified: boolean;
  /** 使用したアルゴリズム（ヘッダー由来。未対応・不明なら string のまま） */
  algorithm: string;
  /** 失敗理由（失敗時のみ） */
  error?: string;
}

/** ハッシュ名対応表 */
const HASH_BY_ALG: Record<string, "SHA-256" | "SHA-384" | "SHA-512"> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
  RS256: "SHA-256",
  RS384: "SHA-384",
  RS512: "SHA-512",
  ES256: "SHA-256",
  ES384: "SHA-384",
};

/**
 * JWT の署名を検証する。
 *
 * - HS256/384/512: `key` を UTF-8 シークレット文字列として扱う
 * - RS256/384/512: `key` を SPKI PEM または JWK（JSON 文字列）として扱う
 * - ES256/384: `key` を SPKI PEM または JWK（JSON 文字列）として扱う
 * - alg が "none" または未知の場合は `verified=false`
 *
 * 秘密情報は呼び出し元に留まる（Web Crypto API のみ使用）。
 *
 * @param token JWT トークン文字列
 * @param key HMAC シークレットまたは公開鍵（PEM / JWK JSON）
 * @returns 検証結果
 */
export async function verifyJwt(token: string, key: string): Promise<JwtVerifyResult> {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { verified: false, algorithm: "unknown", error: "JWTの形式が不正です" };
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  if (!headerPart || !payloadPart || !signaturePart) {
    return { verified: false, algorithm: "unknown", error: "JWTの各パートが空です" };
  }

  let headerJson: { alg?: string };
  try {
    headerJson = JSON.parse(base64UrlDecode(headerPart));
  } catch {
    return { verified: false, algorithm: "unknown", error: "ヘッダーのデコードに失敗しました" };
  }
  const alg = headerJson.alg ?? "unknown";

  if (alg === "none") {
    return {
      verified: false,
      algorithm: alg,
      error: "alg=none は検証不可（セキュリティ上も推奨されません）",
    };
  }

  const hash = HASH_BY_ALG[alg];
  if (!hash) {
    return { verified: false, algorithm: alg, error: `未対応のアルゴリズム: ${alg}` };
  }

  const signingInput = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const signatureBytes = base64UrlToBytes(signaturePart);

  try {
    if (alg.startsWith("HS")) {
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(key),
        { name: "HMAC", hash: { name: hash } },
        false,
        ["verify"],
      );
      const verified = await crypto.subtle.verify(
        "HMAC",
        cryptoKey,
        signatureBytes.buffer as ArrayBuffer,
        signingInput.buffer as ArrayBuffer,
      );
      return { verified, algorithm: alg };
    }

    // 公開鍵アルゴリズム: PEM もしくは JWK（JSON）を受け付ける
    const trimmedKey = key.trim();
    const isJwk = trimmedKey.startsWith("{");

    if (alg.startsWith("RS")) {
      const cryptoKey = isJwk
        ? await crypto.subtle.importKey(
            "jwk",
            JSON.parse(trimmedKey),
            { name: "RSASSA-PKCS1-v1_5", hash: { name: hash } },
            false,
            ["verify"],
          )
        : await crypto.subtle.importKey(
            "spki",
            pemToSpki(trimmedKey).buffer as ArrayBuffer,
            { name: "RSASSA-PKCS1-v1_5", hash: { name: hash } },
            false,
            ["verify"],
          );
      const verified = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signatureBytes.buffer as ArrayBuffer,
        signingInput.buffer as ArrayBuffer,
      );
      return { verified, algorithm: alg };
    }

    if (alg.startsWith("ES")) {
      const namedCurve = alg === "ES256" ? "P-256" : "P-384";
      const cryptoKey = isJwk
        ? await crypto.subtle.importKey(
            "jwk",
            JSON.parse(trimmedKey),
            { name: "ECDSA", namedCurve },
            false,
            ["verify"],
          )
        : await crypto.subtle.importKey(
            "spki",
            pemToSpki(trimmedKey).buffer as ArrayBuffer,
            { name: "ECDSA", namedCurve },
            false,
            ["verify"],
          );
      const verified = await crypto.subtle.verify(
        { name: "ECDSA", hash: { name: hash } },
        cryptoKey,
        signatureBytes.buffer as ArrayBuffer,
        signingInput.buffer as ArrayBuffer,
      );
      return { verified, algorithm: alg };
    }

    return { verified: false, algorithm: alg, error: `未対応のアルゴリズム: ${alg}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "検証中にエラーが発生しました";
    return { verified: false, algorithm: alg, error: message };
  }
}
