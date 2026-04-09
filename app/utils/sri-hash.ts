/**
 * SRI (Subresource Integrity) ハッシュ生成ユーティリティ
 *
 * Web ページに埋め込む外部リソース（JS/CSS）の改ざんを検知するための
 * integrity 属性値と HTML スニペットを生成する。
 *
 * @see https://developer.mozilla.org/ja/docs/Web/Security/Subresource_Integrity
 */

/** SRI でサポートされるハッシュアルゴリズム */
export type SriAlgorithm = "sha256" | "sha384" | "sha512";

/** crossorigin 属性の値 */
export type CrossoriginValue = "anonymous" | "use-credentials";

/** SRI ハッシュ生成結果 */
export interface SriResult {
  /** アルゴリズム識別子 */
  algorithm: SriAlgorithm;
  /** Base64 エンコードされたハッシュ値 */
  hash: string;
  /** integrity 属性値（例: "sha384-abc..."） */
  integrity: string;
}

/** HTML スニペット生成オプション */
export interface SnippetOptions {
  /** リソース URL */
  url: string;
  /** integrity 属性値 */
  integrity: string;
  /** crossorigin 属性値 */
  crossorigin: CrossoriginValue;
  /** リソースの種類（script / stylesheet） */
  resourceType: "script" | "stylesheet";
}

/** Web Crypto API のアルゴリズム名への変換マップ */
const ALGO_TO_WEB_CRYPTO: Record<SriAlgorithm, string> = {
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

/**
 * バイト配列を Base64 文字列に変換する
 * @param bytes バイト配列
 * @returns Base64 エンコードされた文字列
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Uint8Array から指定アルゴリズムの SRI ハッシュを計算する
 * @param algorithm ハッシュアルゴリズム
 * @param data 入力バイト配列
 * @returns SRI ハッシュ生成結果
 */
export async function computeSriHash(
  algorithm: SriAlgorithm,
  data: Uint8Array,
): Promise<SriResult> {
  const webCryptoAlgo = ALGO_TO_WEB_CRYPTO[algorithm];
  const hashBuffer = await crypto.subtle.digest(webCryptoAlgo, data as BufferSource);
  const hashBytes = new Uint8Array(hashBuffer);
  const base64Hash = bytesToBase64(hashBytes);
  const integrity = `${algorithm}-${base64Hash}`;

  return {
    algorithm,
    hash: base64Hash,
    integrity,
  };
}

/** 全サポートアルゴリズムのリスト */
const ALL_ALGORITHMS: readonly SriAlgorithm[] = ["sha256", "sha384", "sha512"];

/**
 * テキストコンテンツから全アルゴリズムの SRI ハッシュを一括計算する
 * @param text 入力テキスト
 * @returns 各アルゴリズムの SRI 結果配列
 */
export async function computeAllSriHashes(text: string): Promise<SriResult[]> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return Promise.all(ALL_ALGORITHMS.map((algo) => computeSriHash(algo, data)));
}

/**
 * バイト配列から全アルゴリズムの SRI ハッシュを一括計算する
 * @param data 入力バイト配列
 * @returns 各アルゴリズムの SRI 結果配列
 */
export async function computeAllSriHashesFromBytes(data: Uint8Array): Promise<SriResult[]> {
  return Promise.all(ALL_ALGORITHMS.map((algo) => computeSriHash(algo, data)));
}

/**
 * `<script>` タグの HTML スニペットを生成する
 * @param options スニペット生成オプション
 * @returns HTML スニペット文字列
 */
export function generateScriptSnippet(options: SnippetOptions): string {
  const { url, integrity, crossorigin } = options;
  const urlAttr = url || "https://example.com/script.js";
  return `<script src="${urlAttr}" integrity="${integrity}" crossorigin="${crossorigin}"></script>`;
}

/**
 * `<link rel="stylesheet">` タグの HTML スニペットを生成する
 * @param options スニペット生成オプション
 * @returns HTML スニペット文字列
 */
export function generateLinkSnippet(options: SnippetOptions): string {
  const { url, integrity, crossorigin } = options;
  const urlAttr = url || "https://example.com/style.css";
  return `<link rel="stylesheet" href="${urlAttr}" integrity="${integrity}" crossorigin="${crossorigin}">`;
}

/**
 * リソース種別に応じた HTML スニペットを生成する
 * @param options スニペット生成オプション
 * @returns HTML スニペット文字列
 */
export function generateHtmlSnippet(options: SnippetOptions): string {
  if (options.resourceType === "script") {
    return generateScriptSnippet(options);
  }
  return generateLinkSnippet(options);
}

/**
 * ファイルサイズを人間が読みやすい形式に変換する
 * @param bytes バイト数
 * @returns 人間が読みやすいサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
