/**
 * SSH/暗号鍵生成ユーティリティ
 * SubtleCrypto APIを使用してRSA・ECDSAの鍵ペアを生成する
 */

/** サポートする鍵アルゴリズムの識別子 */
export type KeyAlgorithmId = "RSA-2048" | "RSA-4096" | "ECDSA-P256" | "ECDSA-P384";

/** 生成された鍵ペアの情報 */
export interface SshKeyPair {
  /** PKCS#8 PEM形式の秘密鍵 */
  privateKeyPem: string;
  /** SPKI PEM形式の公開鍵 */
  publicKeyPem: string;
  /** OpenSSH公開鍵フォーマット（~/.ssh/authorized_keysで使用） */
  publicKeyOpenSsh: string;
  /** JWK形式の公開鍵 */
  publicKeyJwk: JsonWebKey;
  /** 使用したアルゴリズム識別子 */
  algorithm: KeyAlgorithmId;
}

/**
 * Uint8ArrayをBase64文字列に変換する
 * @param bytes - 変換対象のバイト列
 * @returns Base64エンコードされた文字列
 */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64URLエンコードされた文字列をUint8Arrayに変換する
 * @param base64url - Base64URLエンコードされた文字列
 * @returns デコードされたバイト列
 */
export function base64UrlToUint8(base64url: string): Uint8Array {
  // Base64URL → Base64 に変換
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * バイト列をPEM形式に変換する
 * @param bytes - DER形式のバイト列
 * @param type - PEMヘッダーの型名（例: "PRIVATE KEY", "PUBLIC KEY"）
 * @returns PEM形式の文字列
 */
export function toPem(bytes: Uint8Array, type: string): string {
  const base64 = uint8ToBase64(bytes);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
}

/**
 * 長さプレフィックス付きバイト列を作成する（OpenSSH形式）
 * @param bytes - 対象のバイト列
 * @returns 4バイトのビッグエンディアン長さプレフィックス + バイト列
 */
export function writeLengthPrefixed(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(4 + bytes.length);
  const view = new DataView(result.buffer);
  view.setUint32(0, bytes.length, false);
  result.set(bytes, 4);
  return result;
}

/**
 * 文字列を長さプレフィックス付きバイト列に変換する
 * @param s - 対象の文字列
 * @returns 4バイト長さプレフィックス + UTF-8エンコードされた文字列
 */
export function writeLengthPrefixedString(s: string): Uint8Array {
  const encoded = new TextEncoder().encode(s);
  return writeLengthPrefixed(encoded);
}

/**
 * RSA公開鍵からOpenSSH公開鍵文字列を生成する
 * OpenSSH RSAフォーマット: [len-prefixed "ssh-rsa"][len-prefixed exponent][len-prefixed modulus]
 * @param jwk - JWK形式のRSA公開鍵
 * @returns OpenSSH公開鍵文字列（"ssh-rsa ..."形式）
 */
export function buildRsaOpenSshPublicKey(jwk: JsonWebKey): string {
  if (!jwk.e || !jwk.n) {
    throw new Error("Invalid RSA JWK: missing e or n");
  }

  const exponentBytes = base64UrlToUint8(jwk.e);
  const modulusBytes = base64UrlToUint8(jwk.n);

  // MSBが立っている場合は先頭に0x00を追加（正の多倍長整数）
  const exponent =
    exponentBytes[0] >= 0x80 ? new Uint8Array([0x00, ...exponentBytes]) : exponentBytes;
  const modulus = modulusBytes[0] >= 0x80 ? new Uint8Array([0x00, ...modulusBytes]) : modulusBytes;

  const keyType = writeLengthPrefixedString("ssh-rsa");
  const expPart = writeLengthPrefixed(exponent);
  const modPart = writeLengthPrefixed(modulus);

  const total = new Uint8Array(keyType.length + expPart.length + modPart.length);
  let offset = 0;
  total.set(keyType, offset);
  offset += keyType.length;
  total.set(expPart, offset);
  offset += expPart.length;
  total.set(modPart, offset);

  return `ssh-rsa ${uint8ToBase64(total)}`;
}

/**
 * ECDSA公開鍵からOpenSSH公開鍵文字列を生成する
 * OpenSSH ECDSAフォーマット: [len-prefixed keyType][len-prefixed curveName][len-prefixed uncompressedPoint]
 * @param jwk - JWK形式のECDSA公開鍵
 * @param curve - 楕円曲線の種類
 * @returns OpenSSH公開鍵文字列（"ecdsa-sha2-nistp256 ..."等の形式）
 */
export function buildEcdsaOpenSshPublicKey(jwk: JsonWebKey, curve: "P-256" | "P-384"): string {
  if (!jwk.x || !jwk.y) {
    throw new Error("Invalid ECDSA JWK: missing x or y");
  }

  const keyType = curve === "P-256" ? "ecdsa-sha2-nistp256" : "ecdsa-sha2-nistp384";
  const curveName = curve === "P-256" ? "nistp256" : "nistp384";

  const xBytes = base64UrlToUint8(jwk.x);
  const yBytes = base64UrlToUint8(jwk.y);

  // 非圧縮点: 0x04 + x + y
  const point = new Uint8Array(1 + xBytes.length + yBytes.length);
  point[0] = 0x04;
  point.set(xBytes, 1);
  point.set(yBytes, 1 + xBytes.length);

  const keyTypePart = writeLengthPrefixedString(keyType);
  const curveNamePart = writeLengthPrefixedString(curveName);
  const pointPart = writeLengthPrefixed(point);

  const total = new Uint8Array(keyTypePart.length + curveNamePart.length + pointPart.length);
  let offset = 0;
  total.set(keyTypePart, offset);
  offset += keyTypePart.length;
  total.set(curveNamePart, offset);
  offset += curveNamePart.length;
  total.set(pointPart, offset);

  return `${keyType} ${uint8ToBase64(total)}`;
}

/**
 * RSA/ECDSA鍵ペアを生成する
 * SubtleCrypto APIを使用してブラウザ内で鍵を生成する（外部送信なし）
 * @param algorithmId - 使用するアルゴリズムの識別子
 * @returns 生成された鍵ペア情報
 */
export async function generateKeyPair(algorithmId: KeyAlgorithmId): Promise<SshKeyPair> {
  let algorithm: RsaHashedKeyGenParams | EcKeyGenParams;
  let keyUsages: KeyUsage[];

  switch (algorithmId) {
    case "RSA-2048":
      algorithm = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: "SHA-256",
      };
      keyUsages = ["sign", "verify"];
      break;
    case "RSA-4096":
      algorithm = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 4096,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: "SHA-256",
      };
      keyUsages = ["sign", "verify"];
      break;
    case "ECDSA-P256":
      algorithm = { name: "ECDSA", namedCurve: "P-256" };
      keyUsages = ["sign", "verify"];
      break;
    case "ECDSA-P384":
      algorithm = { name: "ECDSA", namedCurve: "P-384" };
      keyUsages = ["sign", "verify"];
      break;
    default:
      throw new Error(`Unsupported algorithm: ${String(algorithmId)}`);
  }

  const keyPair = await window.crypto.subtle.generateKey(algorithm, true, keyUsages);

  const [privateKeyDer, publicKeyDer, publicKeyJwk] = await Promise.all([
    window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
    window.crypto.subtle.exportKey("spki", keyPair.publicKey),
    window.crypto.subtle.exportKey("jwk", keyPair.publicKey),
  ]);

  const privateKeyPem = toPem(new Uint8Array(privateKeyDer), "PRIVATE KEY");
  const publicKeyPem = toPem(new Uint8Array(publicKeyDer), "PUBLIC KEY");

  let publicKeyOpenSsh: string;
  if (algorithmId === "RSA-2048" || algorithmId === "RSA-4096") {
    publicKeyOpenSsh = buildRsaOpenSshPublicKey(publicKeyJwk);
  } else if (algorithmId === "ECDSA-P256") {
    publicKeyOpenSsh = buildEcdsaOpenSshPublicKey(publicKeyJwk, "P-256");
  } else {
    publicKeyOpenSsh = buildEcdsaOpenSshPublicKey(publicKeyJwk, "P-384");
  }

  return {
    privateKeyPem,
    publicKeyPem,
    publicKeyOpenSsh,
    publicKeyJwk,
    algorithm: algorithmId,
  };
}
