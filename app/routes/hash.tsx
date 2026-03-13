import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback, type DragEvent } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/hash")({
  head: () => ({
    meta: [
      { title: "ハッシュ生成 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストまたはファイルからMD5、SHA-1、SHA-256、SHA-384、SHA-512のハッシュ値を生成するツール。HEX/Base64出力対応。",
      },
      { property: "og:title", content: "ハッシュ生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストまたはファイルからMD5、SHA-1、SHA-256、SHA-384、SHA-512のハッシュ値を生成するツール。HEX/Base64出力対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/hash` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ハッシュ生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "テキストまたはファイルからMD5、SHA-1、SHA-256、SHA-384、SHA-512のハッシュ値を生成するツール。",
      },
    ],
  }),
  component: HashGenerator,
});

// ===== MD5 実装（純粋なTypeScript、外部ライブラリ不使用） =====

/**
 * 32ビット整数の安全な加算（オーバーフロー対応）
 * @param x 加算値1
 * @param y 加算値2
 * @returns 32ビット整数での加算結果
 */
export function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}

/**
 * 32ビット整数を左ローテーションする
 * @param num ローテーションする整数
 * @param cnt ビット数
 * @returns ローテーション結果
 */
export function bitRotateLeft(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

/** MD5の共通関数 */
function md5Cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

/** MD5のFF関数 */
export function md5Ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn((b & c) | (~b & d), a, b, x, s, t);
}

/** MD5のGG関数 */
export function md5Gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn((b & d) | (c & ~d), a, b, x, s, t);
}

/** MD5のHH関数 */
export function md5Hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn(b ^ c ^ d, a, b, x, s, t);
}

/** MD5のII関数 */
export function md5Ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn(c ^ (b | ~d), a, b, x, s, t);
}

/**
 * Uint8Array から MD5 ハッシュを計算する（純粋なTypeScript実装）
 * @param data 入力バイト配列
 * @returns MD5 ハッシュのバイト列（16バイト）
 */
export function computeMd5Bytes(data: Uint8Array): Uint8Array {
  const msgLen = data.length;
  const wordCount = ((msgLen + 8) >>> 6) + 1;
  const wordArray = new Array<number>(wordCount * 16).fill(0);

  for (let i = 0; i < msgLen; i++) {
    wordArray[i >>> 2] |= data[i] << ((i % 4) * 8);
  }
  wordArray[msgLen >>> 2] |= 0x80 << ((msgLen % 4) * 8);
  wordArray[wordCount * 16 - 2] = msgLen * 8;

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < wordArray.length; i += 16) {
    const k = wordArray.slice(i, i + 16);
    const aa = a, bb = b, cc = c, dd = d;

    // Round 1
    a = md5Ff(a, b, c, d, k[0], 7, -680876936);
    d = md5Ff(d, a, b, c, k[1], 12, -389564586);
    c = md5Ff(c, d, a, b, k[2], 17, 606105819);
    b = md5Ff(b, c, d, a, k[3], 22, -1044525330);
    a = md5Ff(a, b, c, d, k[4], 7, -176418897);
    d = md5Ff(d, a, b, c, k[5], 12, 1200080426);
    c = md5Ff(c, d, a, b, k[6], 17, -1473231341);
    b = md5Ff(b, c, d, a, k[7], 22, -45705983);
    a = md5Ff(a, b, c, d, k[8], 7, 1770035416);
    d = md5Ff(d, a, b, c, k[9], 12, -1958414417);
    c = md5Ff(c, d, a, b, k[10], 17, -42063);
    b = md5Ff(b, c, d, a, k[11], 22, -1990404162);
    a = md5Ff(a, b, c, d, k[12], 7, 1804603682);
    d = md5Ff(d, a, b, c, k[13], 12, -40341101);
    c = md5Ff(c, d, a, b, k[14], 17, -1502002290);
    b = md5Ff(b, c, d, a, k[15], 22, 1236535329);

    // Round 2
    a = md5Gg(a, b, c, d, k[1], 5, -165796510);
    d = md5Gg(d, a, b, c, k[6], 9, -1069501632);
    c = md5Gg(c, d, a, b, k[11], 14, 643717713);
    b = md5Gg(b, c, d, a, k[0], 20, -373897302);
    a = md5Gg(a, b, c, d, k[5], 5, -701558691);
    d = md5Gg(d, a, b, c, k[10], 9, 38016083);
    c = md5Gg(c, d, a, b, k[15], 14, -660478335);
    b = md5Gg(b, c, d, a, k[4], 20, -405537848);
    a = md5Gg(a, b, c, d, k[9], 5, 568446438);
    d = md5Gg(d, a, b, c, k[14], 9, -1019803690);
    c = md5Gg(c, d, a, b, k[3], 14, -187363961);
    b = md5Gg(b, c, d, a, k[8], 20, 1163531501);
    a = md5Gg(a, b, c, d, k[13], 5, -1444681467);
    d = md5Gg(d, a, b, c, k[2], 9, -51403784);
    c = md5Gg(c, d, a, b, k[7], 14, 1735328473);
    b = md5Gg(b, c, d, a, k[12], 20, -1926607734);

    // Round 3
    a = md5Hh(a, b, c, d, k[5], 4, -378558);
    d = md5Hh(d, a, b, c, k[8], 11, -2022574463);
    c = md5Hh(c, d, a, b, k[11], 16, 1839030562);
    b = md5Hh(b, c, d, a, k[14], 23, -35309556);
    a = md5Hh(a, b, c, d, k[1], 4, -1530992060);
    d = md5Hh(d, a, b, c, k[4], 11, 1272893353);
    c = md5Hh(c, d, a, b, k[7], 16, -155497632);
    b = md5Hh(b, c, d, a, k[10], 23, -1094730640);
    a = md5Hh(a, b, c, d, k[13], 4, 681279174);
    d = md5Hh(d, a, b, c, k[0], 11, -358537222);
    c = md5Hh(c, d, a, b, k[3], 16, -722521979);
    b = md5Hh(b, c, d, a, k[6], 23, 76029189);
    a = md5Hh(a, b, c, d, k[9], 4, -640364487);
    d = md5Hh(d, a, b, c, k[12], 11, -421815835);
    c = md5Hh(c, d, a, b, k[15], 16, 530742520);
    b = md5Hh(b, c, d, a, k[2], 23, -995338651);

    // Round 4
    a = md5Ii(a, b, c, d, k[0], 6, -198630844);
    d = md5Ii(d, a, b, c, k[7], 10, 1126891415);
    c = md5Ii(c, d, a, b, k[14], 15, -1416354905);
    b = md5Ii(b, c, d, a, k[5], 21, -57434055);
    a = md5Ii(a, b, c, d, k[12], 6, 1700485571);
    d = md5Ii(d, a, b, c, k[3], 10, -1894986606);
    c = md5Ii(c, d, a, b, k[10], 15, -1051523);
    b = md5Ii(b, c, d, a, k[1], 21, -2054922799);
    a = md5Ii(a, b, c, d, k[8], 6, 1873313359);
    d = md5Ii(d, a, b, c, k[15], 10, -30611744);
    c = md5Ii(c, d, a, b, k[6], 15, -1560198380);
    b = md5Ii(b, c, d, a, k[13], 21, 1309151649);
    a = md5Ii(a, b, c, d, k[4], 6, -145523070);
    d = md5Ii(d, a, b, c, k[11], 10, -1120210379);
    c = md5Ii(c, d, a, b, k[2], 15, 718787259);
    b = md5Ii(b, c, d, a, k[9], 21, -343485551);

    a = safeAdd(a, aa);
    b = safeAdd(b, bb);
    c = safeAdd(c, cc);
    d = safeAdd(d, dd);
  }

  // リトルエンディアンでバイト列に変換
  const result = new Uint8Array(16);
  const state = [a, b, c, d];
  for (let i = 0; i < 4; i++) {
    result[i * 4 + 0] = (state[i] >>> 0) & 0xff;
    result[i * 4 + 1] = (state[i] >>> 8) & 0xff;
    result[i * 4 + 2] = (state[i] >>> 16) & 0xff;
    result[i * 4 + 3] = (state[i] >>> 24) & 0xff;
  }
  return result;
}

// ===== ユーティリティ関数 =====

/**
 * バイト配列を16進数文字列に変換する
 * @param bytes バイト配列
 * @returns 16進数文字列
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * バイト配列をBase64文字列に変換する
 * @param bytes バイト配列
 * @returns Base64エンコード文字列
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Web Crypto API を使用してハッシュを計算する
 * @param algorithm ハッシュアルゴリズム名（"SHA-1", "SHA-256", "SHA-384", "SHA-512"）
 * @param data 入力バイト配列
 * @returns ハッシュのバイト列
 */
export async function computeWebCryptoHash(algorithm: string, data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return new Uint8Array(hashBuffer);
}

/**
 * テキストを UTF-8 バイト配列に変換する
 * @param text 入力テキスト
 * @returns UTF-8 バイト配列
 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// ===== アルゴリズム定義 =====

/** ハッシュアルゴリズム情報 */
export interface HashAlgorithmInfo {
  /** アルゴリズム識別子 */
  key: string;
  /** 表示ラベル */
  label: string;
  /** セキュリティ用途非推奨かどうか */
  deprecated?: boolean;
}

/** サポートするハッシュアルゴリズム一覧 */
export const HASH_ALGORITHMS: HashAlgorithmInfo[] = [
  { key: "md5", label: "MD5", deprecated: true },
  { key: "sha1", label: "SHA-1", deprecated: true },
  { key: "sha256", label: "SHA-256" },
  { key: "sha384", label: "SHA-384" },
  { key: "sha512", label: "SHA-512" },
];

/** ハッシュ結果の型 */
export interface HashResult {
  /** アルゴリズム識別子 */
  key: string;
  /** ハッシュ値（HEX形式） */
  hexValue: string;
  /** ハッシュ値（Base64形式） */
  base64Value: string;
  /** 計算エラー */
  error?: string;
}

/** 出力形式 */
export type OutputFormat = "hex" | "base64";

/**
 * バイト配列から全アルゴリズムのハッシュを計算する
 * @param data 入力バイト配列
 * @returns 各アルゴリズムのハッシュ結果配列
 */
export async function computeAllHashes(data: Uint8Array): Promise<HashResult[]> {
  const results: HashResult[] = [];

  for (const algo of HASH_ALGORITHMS) {
    try {
      let hashBytes: Uint8Array;

      if (algo.key === "md5") {
        hashBytes = computeMd5Bytes(data);
      } else {
        const webCryptoAlgo =
          algo.key === "sha1"
            ? "SHA-1"
            : algo.key === "sha256"
              ? "SHA-256"
              : algo.key === "sha384"
                ? "SHA-384"
                : "SHA-512";
        hashBytes = await computeWebCryptoHash(webCryptoAlgo, data);
      }

      results.push({
        key: algo.key,
        hexValue: bytesToHex(hashBytes),
        base64Value: bytesToBase64(hashBytes),
      });
    } catch (err) {
      results.push({
        key: algo.key,
        hexValue: "",
        base64Value: "",
        error: err instanceof Error ? err.message : "計算エラー",
      });
    }
  }

  return results;
}

/**
 * バイトサイズを人間が読みやすい文字列に変換する
 * @param bytes バイト数
 * @returns 人間が読みやすいサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}




/**
 * ハッシュ生成ツールコンポーネント
 * MD5（自前実装）+ SHA-1/SHA-256/SHA-384/SHA-512（Web Crypto API）を
 * テキスト入力またはファイルから同時計算し、HEX/Base64で出力する
 */
function HashGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("hex");
  const [hashResults, setHashResults] = useState<HashResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const computeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // テキスト入力変更時にハッシュを計算（デバウンス付き）
  useEffect(() => {
    if (inputMode !== "text") return;

    if (computeTimerRef.current) {
      clearTimeout(computeTimerRef.current);
    }

    if (!inputText) {
      setHashResults([]);
      return;
    }

    computeTimerRef.current = setTimeout(async () => {
      setIsComputing(true);
      try {
        const data = textToBytes(inputText);
        const results = await computeAllHashes(data);
        setHashResults(results);
      } finally {
        setIsComputing(false);
      }
    }, 150);

    return () => {
      if (computeTimerRef.current) {
        clearTimeout(computeTimerRef.current);
      }
    };
  }, [inputText, inputMode]);

  // ファイル選択時にハッシュを計算
  useEffect(() => {
    if (inputMode !== "file" || !selectedFile) {
      if (inputMode === "file") setHashResults([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      setIsComputing(true);
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const results = await computeAllHashes(data);
        setHashResults(results);
        announceStatus("ファイルのハッシュ計算が完了しました");
      } finally {
        setIsComputing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile, inputMode, announceStatus]);

  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
    setHashResults([]);
  }, []);

  const handleFileDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleCopy = useCallback(async (value: string, label: string) => {
    if (!value) return;
    const success = await copy(value);
    if (success) {
      showToast(`${label} をコピーしました`, "success");
      announceStatus(`${label} をコピーしました`);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, showToast, announceStatus]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setHashResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleInputModeChange = useCallback((mode: "text" | "file") => {
    setInputMode(mode);
    setHashResults([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const hasInput = inputMode === "text" ? inputText.length > 0 : selectedFile !== null;

  return (
    <>
      <div className="tool-container">
        {/* 入力モード切り替えタブ */}
        <div className="hash-input-tabs" role="tablist" aria-label="入力モード">
          <button
            role="tab"
            aria-selected={inputMode === "text"}
            className={`hash-input-tab ${inputMode === "text" ? "active" : ""}`}
            onClick={() => handleInputModeChange("text")}
          >
            テキスト
          </button>
          <button
            role="tab"
            aria-selected={inputMode === "file"}
            className={`hash-input-tab ${inputMode === "file" ? "active" : ""}`}
            onClick={() => handleInputModeChange("file")}
          >
            ファイル
          </button>
        </div>

        {/* テキスト入力 */}
        {inputMode === "text" && (
          <div className="converter-section">
            <label htmlFor="hash-input" className="section-title">
              入力テキスト
            </label>
            <textarea
              id="hash-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ハッシュ値を計算するテキストを入力してください..."
              rows={5}
              aria-describedby="hash-input-hint"
            />
            <p id="hash-input-hint" className="text-case-hint">
              入力するとリアルタイムで全アルゴリズムのハッシュ値が生成されます
            </p>
          </div>
        )}

        {/* ファイル入力 */}
        {inputMode === "file" && (
          <div className="converter-section">
            <span className="section-title">ファイル選択</span>

            <div
              className={`hash-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="ファイルをドロップするか、クリックして選択"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <span className="hash-dropzone-label" aria-hidden="true">
                <span className="hash-dropzone-icon">📂</span>
                <span>ファイルをドロップ</span>
                <span className="hash-dropzone-hint">またはクリックして選択</span>
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              aria-label="ファイルを選択"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  handleFileSelect(Array.from(files));
                }
              }}
            />

            {selectedFile && (
              <div className="hash-file-info" role="status">
                <span className="hash-file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="hash-file-size">{formatFileSize(selectedFile.size)}</span>
                <button
                  className="hash-file-clear-btn"
                  onClick={handleClearFile}
                  aria-label="ファイルをクリア"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* 出力形式切り替え */}
        {hasInput && (
          <div className="hash-format-tabs" role="group" aria-label="出力形式">
            <button
              className={`hash-format-tab ${outputFormat === "hex" ? "active" : ""}`}
              onClick={() => setOutputFormat("hex")}
              aria-pressed={outputFormat === "hex"}
            >
              HEX
            </button>
            <button
              className={`hash-format-tab ${outputFormat === "base64" ? "active" : ""}`}
              onClick={() => setOutputFormat("base64")}
              aria-pressed={outputFormat === "base64"}
            >
              Base64
            </button>
          </div>
        )}

        {/* ハッシュ結果一覧 */}
        {hasInput ? (
          <div className="hash-results-grid" role="list" aria-label="ハッシュ生成結果">
            {HASH_ALGORITHMS.map((algo) => {
              const result = hashResults.find((r) => r.key === algo.key);
              const value = result
                ? outputFormat === "hex"
                  ? result.hexValue
                  : result.base64Value
                : "";
              const isEmpty = !value;

              return (
                <div
                  key={algo.key}
                  className="hash-result-item"
                  role="listitem"
                  aria-label={`${algo.label} ハッシュ`}
                >
                  <div className="hash-result-header">
                    <span className="hash-result-algorithm">{algo.label}</span>
                    {algo.deprecated && (
                      <span
                        className="hash-result-badge hash-result-badge-deprecated"
                        title="セキュリティ用途には非推奨のアルゴリズムです"
                        aria-label="セキュリティ用途非推奨"
                      >
                        非推奨
                      </span>
                    )}
                  </div>
                  <div className="hash-result-value-wrapper">
                    <code
                      className={`hash-result-value ${isEmpty || isComputing ? "hash-result-value-empty" : ""}`}
                      aria-live="polite"
                    >
                      {isComputing
                        ? "計算中..."
                        : result?.error
                          ? `エラー: ${result.error}`
                          : isEmpty
                            ? "（入力してください）"
                            : value}
                    </code>
                    <button
                      className="hash-copy-btn"
                      onClick={() => handleCopy(value, `${algo.label} (${outputFormat.toUpperCase()})`)}
                      disabled={isEmpty || isComputing}
                      aria-label={`${algo.label} のハッシュ値をコピー`}
                    >
                      コピー
                    </button>
                  </div>
                  {!isEmpty && !isComputing && (
                    <div className="hash-result-meta">
                      {value.length} 文字
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hash-empty-state" aria-live="polite">
            <p>
              {inputMode === "text"
                ? "テキストを入力するとハッシュ値が生成されます"
                : "ファイルを選択するとハッシュ値が計算されます"}
            </p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「テキスト」タブ: 入力欄にテキストを入力するとリアルタイムでハッシュを生成",
                "「ファイル」タブ: ファイルをドロップまたは選択してハッシュを計算",
                "HEX / Base64 ボタンで出力形式を切り替え",
                "各ハッシュ値の「コピー」ボタンでクリップボードにコピー",
              ],
            },
            {
              title: "アルゴリズムの説明",
              items: [
                "MD5 (128bit): 非推奨 - セキュリティ用途には使用しないでください",
                "SHA-1 (160bit): 非推奨 - セキュリティ用途には使用しないでください",
                "SHA-256 (256bit): 一般的なセキュリティ用途に推奨",
                "SHA-384 (384bit): より高いセキュリティが必要な場合に使用",
                "SHA-512 (512bit): 最高レベルのセキュリティが必要な場合に使用",
              ],
            },
            {
              title: "注意事項",
              items: [
                "MD5とSHA-1は衝突攻撃に対して脆弱なため、セキュリティ用途には使用しないでください",
                "ファイル整合性確認など非セキュリティ用途では引き続き使用可能です",
                "計算はブラウザ内で行われ、データはサーバーに送信されません",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
