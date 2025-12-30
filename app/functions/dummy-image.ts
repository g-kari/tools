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
}

const MIN_SIZE = 1;
const MAX_SIZE = 4096;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;
const DEFAULT_BG_COLOR = "6750A4";
const DEFAULT_TEXT_COLOR = "FFFFFF";

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
  textColor: string
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
