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
        .join("")
    );
  } catch (error) {
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
