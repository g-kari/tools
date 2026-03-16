/**
 * 色覚シミュレーションユーティリティ
 * Machado 2009年の色変換行列を使用した色覚異常シミュレーション
 */

/** 色覚異常の種別 */
export type CvdType =
  | "deuteranopia"
  | "protanopia"
  | "tritanopia"
  | "deuteranomaly"
  | "protanomaly"
  | "achromatopsia";

/** 色覚異常の情報 */
export interface CvdInfo {
  id: CvdType;
  /** 日本語ラベル */
  label: string;
  /** 英語名 */
  english: string;
  /** 説明 */
  description: string;
  /** SVG feColorMatrix 用の行列文字列 (4×5) */
  svgMatrix: string;
  /** Canvas 用の 3×3 行列 (行優先、R/G/B への係数) */
  matrix3x3: readonly number[];
}

/**
 * 値を [0, 255] にクランプして整数化する
 * @param v - クランプする値
 * @returns クランプ後の整数値
 */
export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/**
 * 3×3 行列を RGB 値に適用する
 * @param r - 赤チャンネル (0-255)
 * @param g - 緑チャンネル (0-255)
 * @param b - 青チャンネル (0-255)
 * @param m - 3×3 行列 (行優先、9要素)
 * @returns 変換後の [r, g, b]
 */
export function applyMatrix3x3(
  r: number,
  g: number,
  b: number,
  m: readonly number[]
): [number, number, number] {
  return [
    clampByte(m[0] * r + m[1] * g + m[2] * b),
    clampByte(m[3] * r + m[4] * g + m[5] * b),
    clampByte(m[6] * r + m[7] * g + m[8] * b),
  ];
}

/**
 * 2つの行列を線形補間する
 * @param a - 行列 A
 * @param b - 行列 B
 * @param t - A の重み (0〜1)
 * @returns 補間結果の行列
 */
function blendMatrices(
  a: readonly number[],
  b: readonly number[],
  t: number
): number[] {
  return a.map((v, i) => v * t + b[i] * (1 - t));
}

/**
 * 3×3 行列を SVG feColorMatrix の 4×5 行列文字列に変換する
 * @param m - 3×3 行列
 * @returns feColorMatrix の values 文字列
 */
function toSvgMatrix(m: readonly number[]): string {
  return (
    `${m[0]} ${m[1]} ${m[2]} 0 0 ` +
    `${m[3]} ${m[4]} ${m[5]} 0 0 ` +
    `${m[6]} ${m[7]} ${m[8]} 0 0 ` +
    `0 0 0 1 0`
  );
}

// 単位行列
const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1] as const;

// Machado 2009 による完全二色覚の変換行列
const DEUT_FULL = [
  0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
  0.04294, 0.968881,
] as const;
const PROT_FULL = [
  0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
  -0.048116, 1.051998,
] as const;
const TRIT_FULL = [
  1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
  0.691367, 0.3039,
] as const;

// 部分的な色覚異常（完全二色覚を 60% 適用）
const DEUT_PARTIAL = blendMatrices(DEUT_FULL, IDENTITY, 0.6);
const PROT_PARTIAL = blendMatrices(PROT_FULL, IDENTITY, 0.6);

// 全色盲（輝度のみ）
const ACHRO = [
  0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722,
] as const;

/** 色覚異常シミュレーション一覧 */
export const CVD_INFOS: readonly CvdInfo[] = [
  {
    id: "deuteranopia",
    label: "第二色覚異常（緑）",
    english: "Deuteranopia",
    description:
      "緑色の感受性が欠如。赤と緑の区別が困難。男性の約6%が該当する最も一般的な色覚異常。",
    matrix3x3: DEUT_FULL,
    svgMatrix: toSvgMatrix(DEUT_FULL),
  },
  {
    id: "protanopia",
    label: "第一色覚異常（赤）",
    english: "Protanopia",
    description:
      "赤色の感受性が欠如。赤と緑の区別が困難で、赤が暗く見える。男性の約2%が該当。",
    matrix3x3: PROT_FULL,
    svgMatrix: toSvgMatrix(PROT_FULL),
  },
  {
    id: "tritanopia",
    label: "第三色覚異常（青）",
    english: "Tritanopia",
    description:
      "青色の感受性が欠如。青と黄色の区別が困難。非常に稀な色覚異常（約0.01%）。",
    matrix3x3: TRIT_FULL,
    svgMatrix: toSvgMatrix(TRIT_FULL),
  },
  {
    id: "deuteranomaly",
    label: "第二色覚弱（緑）",
    english: "Deuteranomaly",
    description:
      "緑色の感受性が弱い（部分的）。男性の約5%が該当する最も多い色覚異常の形態。",
    matrix3x3: DEUT_PARTIAL,
    svgMatrix: toSvgMatrix(DEUT_PARTIAL),
  },
  {
    id: "protanomaly",
    label: "第一色覚弱（赤）",
    english: "Protanomaly",
    description: "赤色の感受性が弱い（部分的）。男性の約1%が該当。",
    matrix3x3: PROT_PARTIAL,
    svgMatrix: toSvgMatrix(PROT_PARTIAL),
  },
  {
    id: "achromatopsia",
    label: "全色盲",
    english: "Achromatopsia",
    description:
      "色の識別が全くできない。世界人口の約0.003%が該当する極めて稀な状態。",
    matrix3x3: ACHRO,
    svgMatrix: toSvgMatrix(ACHRO),
  },
];

/**
 * 画像データに色覚シミュレーション行列を適用する
 * 元の ImageData は変更せず、新しい ImageData を返す
 * @param imageData - 元の ImageData
 * @param matrix - 3×3 変換行列（行優先、9要素）
 * @returns 変換後の ImageData
 */
export function applySimulation(
  imageData: ImageData,
  matrix: readonly number[]
): ImageData {
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const [nr, ng, nb] = applyMatrix3x3(r, g, b, matrix);
    dst[i] = nr;
    dst[i + 1] = ng;
    dst[i + 2] = nb;
    dst[i + 3] = src[i + 3]; // アルファ値は変更しない
  }
  return new ImageData(dst, imageData.width, imageData.height);
}

/**
 * File から ImageData を取得する（Canvas 経由）
 * @param file - 画像ファイル
 * @returns ImageData と画像のサイズ
 */
export async function fileToImageData(
  file: File
): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ imageData, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * ImageData から PNG Blob を生成する
 * @param imageData - ImageData
 * @returns PNG の Blob
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
