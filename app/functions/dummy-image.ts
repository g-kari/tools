/**
 * ダミー画像生成のパラメータ
 */
export interface DummyImageParams {
  /** 幅 (1-4096, デフォルト: 300) */
  w?: number;
  /** 高さ (1-4096, デフォルト: 150) */
  h?: number;
  /** 背景色 (HEX, デフォルト: 6750A4) */
  bg?: string;
  /** テキスト色 (HEX, デフォルト: FFFFFF) */
  text?: string;
  /** 目標ファイル容量 (MB, 最大500) */
  size?: number;
}

const MIN_SIZE = 1;
const MAX_SIZE = 4096;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;
const DEFAULT_BG_COLOR = "6750A4";
const DEFAULT_TEXT_COLOR = "FFFFFF";
export const MAX_TARGET_FILE_SIZE_MB = 500;
const BYTES_PER_MB = 1024 * 1024;
const STREAM_CHUNK_SIZE = BYTES_PER_MB;

/**
 * 数値をクランプする
 * @param value - 値
 * @param min - 最小値
 * @param max - 最大値
 * @returns クランプされた値
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * HEXカラーコードを検証する
 * @param color - カラーコード
 * @returns 有効かどうか
 */
function isValidHexColor(color: string): boolean {
  return /^[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * HEXカラーコードをサニタイズする
 * @param color - カラーコード
 * @param defaultColor - デフォルトカラー
 * @returns サニタイズされたカラーコード
 */
function sanitizeHexColor(color: string, defaultColor: string): string {
  // #を削除
  const cleaned = color.replace(/^#/, "");
  return isValidHexColor(cleaned) ? cleaned : defaultColor;
}

/**
 * SVG画像を生成する
 * @param width - 画像の幅
 * @param height - 画像の高さ
 * @param bgColor - 背景色 (HEX, #なし)
 * @param textColor - テキスト色 (HEX, #なし)
 * @returns SVG文字列
 */
export function generateSvgImage(
  width: number,
  height: number,
  bgColor: string,
  textColor: string,
): string {
  const text = `${width} × ${height}`;
  const fontSize = Math.max(12, Math.min(width, height) / 8);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="'Roboto', 'Helvetica Neue', Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="#${textColor}">${text}</text>
</svg>`;
}

/**
 * URLパラメータからダミー画像パラメータをパースする
 * @param searchParams - URLSearchParams オブジェクト
 * @returns パースされたパラメータ
 */
export function parseImageParams(searchParams: URLSearchParams): {
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
} {
  const w = parseInt(searchParams.get("w") || "", 10);
  const h = parseInt(searchParams.get("h") || "", 10);
  const bg = searchParams.get("bg") || DEFAULT_BG_COLOR;
  const text = searchParams.get("text") || DEFAULT_TEXT_COLOR;

  return {
    width: clamp(isNaN(w) ? DEFAULT_WIDTH : w, MIN_SIZE, MAX_SIZE),
    height: clamp(isNaN(h) ? DEFAULT_HEIGHT : h, MIN_SIZE, MAX_SIZE),
    bgColor: sanitizeHexColor(bg, DEFAULT_BG_COLOR),
    textColor: sanitizeHexColor(text, DEFAULT_TEXT_COLOR),
  };
}

/**
 * URLパラメータから目標ファイル容量を取得する
 * @param searchParams - URLSearchParams オブジェクト
 * @returns 目標容量（バイト）。未指定または無効な場合は0
 */
export function parseTargetFileSize(searchParams: URLSearchParams): number {
  const sizeMb = Number.parseFloat(searchParams.get("size") || "");
  if (!Number.isFinite(sizeMb) || sizeMb <= 0) return 0;

  return Math.round(Math.min(sizeMb, MAX_TARGET_FILE_SIZE_MB) * BYTES_PER_MB);
}

/**
 * 元データにパディングを追加し、指定容量以上のレスポンスをストリームする
 * @param content - 元の画像データ
 * @param targetSizeBytes - 目標容量（バイト）
 * @param paddingByte - パディングに使用するバイト
 * @returns レスポンス本文のストリームと実際の容量
 */
export function createPaddedImageStream(
  content: ArrayBuffer | string,
  targetSizeBytes: number,
  paddingByte: number = 0,
): { stream: ReadableStream<Uint8Array>; contentLength: number } {
  const contentBytes =
    typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
  const contentLength = Math.max(contentBytes.byteLength, Math.floor(targetSizeBytes));
  let remaining = contentLength - contentBytes.byteLength;
  const paddingChunk = new Uint8Array(Math.min(STREAM_CHUNK_SIZE, remaining));
  paddingChunk.fill(paddingByte);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(contentBytes);
      if (remaining === 0) controller.close();
    },
    pull(controller) {
      const chunkSize = Math.min(paddingChunk.byteLength, remaining);
      controller.enqueue(
        chunkSize === paddingChunk.byteLength ? paddingChunk : paddingChunk.slice(0, chunkSize),
      );
      remaining -= chunkSize;
      if (remaining === 0) controller.close();
    },
  });

  return { stream, contentLength };
}

// WASMの初期化状態を追跡
let wasmInitialized = false;

/**
 * フォントバッファのキャッシュ
 */
let fontBuffer: Uint8Array | null = null;

/**
 * フォントバッファを取得する
 * @returns フォントデータのUint8Array
 */
async function getFontBuffer(): Promise<Uint8Array | null> {
  if (fontBuffer) {
    return fontBuffer;
  }

  try {
    // Cloudflare Workers環境: フォントファイルをfetch
    const response = await fetch(
      "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2",
    );
    const arrayBuffer = await response.arrayBuffer();
    fontBuffer = new Uint8Array(arrayBuffer);
    return fontBuffer;
  } catch (error) {
    console.error("Font loading error:", error);
    // フォントが読み込めない場合はnullを返す
    return null;
  }
}

/**
 * SVGをPNGに変換する
 * @param svg - SVG文字列
 * @returns PNG画像のArrayBuffer
 */
export async function convertSvgToPng(svg: string): Promise<ArrayBuffer> {
  const { Resvg, initWasm } = await import("@resvg/resvg-wasm");

  if (!wasmInitialized) {
    // 環境に応じて異なる初期化方法を使用
    try {
      // Cloudflare Workers環境: WASMファイルを直接インポート
      const wasmModule = await import("@resvg/resvg-wasm/index_bg.wasm");
      await initWasm(wasmModule.default);
    } catch {
      // テスト環境やNode.js環境: unpkgからfetch
      await initWasm(fetch("https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm"));
    }
    wasmInitialized = true;
  }

  // フォントバッファを取得
  const font = await getFontBuffer();

  // フォントオプションを設定
  const opts = font
    ? {
        font: {
          fontBuffers: [font], // フォントが取得できた場合のみ設定
          defaultFontFamily: "Roboto",
          sansSerifFamily: "Roboto",
        },
      }
    : undefined;

  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const pngBytes = pngData.asPng();
  return pngBytes.buffer as ArrayBuffer;
}

/**
 * PNGをJPEGに変換する
 * @param pngBuffer - PNG画像のArrayBuffer
 * @param quality - 画質 (1-100, デフォルト: 85)
 * @returns JPEG画像のArrayBuffer
 */
export async function convertPngToJpeg(
  pngBuffer: ArrayBuffer,
  quality: number = 85,
): Promise<ArrayBuffer> {
  const { PhotonImage } = await import("@cf-wasm/photon");
  const photonImage = PhotonImage.new_from_byteslice(new Uint8Array(pngBuffer));
  const jpegBytes = photonImage.get_bytes_jpeg(quality);
  return jpegBytes.buffer as ArrayBuffer;
}

/**
 * PNGをWebPに変換する
 * @param pngBuffer - PNG画像のArrayBuffer
 * @returns WebP画像のArrayBuffer
 */
export async function convertPngToWebp(pngBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const { PhotonImage } = await import("@cf-wasm/photon");
  const photonImage = PhotonImage.new_from_byteslice(new Uint8Array(pngBuffer));
  const webpBytes = photonImage.get_bytes_webp();
  return webpBytes.buffer as ArrayBuffer;
}
