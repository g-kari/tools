/**
 * CSS単位変換ユーティリティ
 * px/rem/em/vw/vh/%/pt/pc/cm/mm/in などのCSS単位を相互変換する
 */

/** サポートするCSS単位の識別子 */
export type CssUnitId = "px" | "rem" | "em" | "vw" | "vh" | "%" | "pt" | "pc" | "cm" | "mm" | "in";

/** CSS単位の定義 */
export interface CssUnitDef {
  /** 単位ID */
  id: CssUnitId;
  /** 表示名 */
  name: string;
  /** 説明 */
  description: string;
  /** 変換コンテキストに依存するかどうか */
  contextDependent: boolean;
}

/** 変換コンテキスト（文脈依存単位の基準値） */
export interface CssConversionContext {
  /** ルートフォントサイズ（px） - rem 変換用 */
  rootFontSize: number;
  /** 親フォントサイズ（px） - em 変換用 */
  parentFontSize: number;
  /** ビューポート幅（px） - vw 変換用 */
  viewportWidth: number;
  /** ビューポート高さ（px） - vh 変換用 */
  viewportHeight: number;
  /** 親要素サイズ（px） - % 変換用 */
  parentSize: number;
}

/** デフォルトの変換コンテキスト */
export const DEFAULT_CONTEXT: CssConversionContext = {
  rootFontSize: 16,
  parentFontSize: 16,
  viewportWidth: 1920,
  viewportHeight: 1080,
  parentSize: 1000,
};

/** 1 CSS インチ = 96px（CSS仕様） */
const PX_PER_INCH = 96;

/** サポートするCSS単位一覧 */
export const CSS_UNITS: CssUnitDef[] = [
  {
    id: "px",
    name: "px",
    description: "ピクセル（CSS基準単位）",
    contextDependent: false,
  },
  {
    id: "rem",
    name: "rem",
    description: "ルート要素のフォントサイズ基準",
    contextDependent: true,
  },
  {
    id: "em",
    name: "em",
    description: "親要素のフォントサイズ基準",
    contextDependent: true,
  },
  {
    id: "vw",
    name: "vw",
    description: "ビューポート幅の 1%",
    contextDependent: true,
  },
  {
    id: "vh",
    name: "vh",
    description: "ビューポート高さの 1%",
    contextDependent: true,
  },
  {
    id: "%",
    name: "%",
    description: "親要素サイズの 1%",
    contextDependent: true,
  },
  {
    id: "pt",
    name: "pt",
    description: "ポイント（1pt = 1/72 インチ）",
    contextDependent: false,
  },
  {
    id: "pc",
    name: "pc",
    description: "パイカ（1pc = 12pt = 16px）",
    contextDependent: false,
  },
  {
    id: "cm",
    name: "cm",
    description: "センチメートル",
    contextDependent: false,
  },
  {
    id: "mm",
    name: "mm",
    description: "ミリメートル",
    contextDependent: false,
  },
  {
    id: "in",
    name: "in",
    description: "インチ（1in = 96px）",
    contextDependent: false,
  },
];

/**
 * 指定した単位の値をピクセル値に変換する
 * @param value - 変換する値
 * @param unit - 変換元の単位
 * @param ctx - 変換コンテキスト
 * @returns ピクセル値。変換できない場合は null
 */
export function toPx(value: number, unit: CssUnitId, ctx: CssConversionContext): number | null {
  if (!Number.isFinite(value)) return null;

  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * ctx.rootFontSize;
    case "em":
      return value * ctx.parentFontSize;
    case "vw":
      return (value / 100) * ctx.viewportWidth;
    case "vh":
      return (value / 100) * ctx.viewportHeight;
    case "%":
      return (value / 100) * ctx.parentSize;
    case "pt":
      return value * (PX_PER_INCH / 72);
    case "pc":
      return value * (PX_PER_INCH / 6);
    case "cm":
      return value * (PX_PER_INCH / 2.54);
    case "mm":
      return value * (PX_PER_INCH / 25.4);
    case "in":
      return value * PX_PER_INCH;
  }
}

/**
 * ピクセル値を指定した単位に変換する
 * @param px - ピクセル値
 * @param unit - 変換先の単位
 * @param ctx - 変換コンテキスト
 * @returns 変換後の値。変換できない場合は null
 */
export function fromPx(px: number, unit: CssUnitId, ctx: CssConversionContext): number | null {
  if (!Number.isFinite(px)) return null;

  switch (unit) {
    case "px":
      return px;
    case "rem":
      if (ctx.rootFontSize === 0) return null;
      return px / ctx.rootFontSize;
    case "em":
      if (ctx.parentFontSize === 0) return null;
      return px / ctx.parentFontSize;
    case "vw":
      if (ctx.viewportWidth === 0) return null;
      return (px / ctx.viewportWidth) * 100;
    case "vh":
      if (ctx.viewportHeight === 0) return null;
      return (px / ctx.viewportHeight) * 100;
    case "%":
      if (ctx.parentSize === 0) return null;
      return (px / ctx.parentSize) * 100;
    case "pt":
      return px * (72 / PX_PER_INCH);
    case "pc":
      return px * (6 / PX_PER_INCH);
    case "cm":
      return px * (2.54 / PX_PER_INCH);
    case "mm":
      return px * (25.4 / PX_PER_INCH);
    case "in":
      return px / PX_PER_INCH;
  }
}

/**
 * 指定した単位の値を全単位へ一括変換する
 * @param value - 変換する値
 * @param fromUnit - 変換元の単位
 * @param ctx - 変換コンテキスト
 * @returns 単位 ID をキーとした変換結果マップ
 */
export function convertAllUnits(
  value: number,
  fromUnit: CssUnitId,
  ctx: CssConversionContext,
): Record<CssUnitId, number | null> {
  const pxValue = toPx(value, fromUnit, ctx);
  const result = {} as Record<CssUnitId, number | null>;

  for (const unit of CSS_UNITS) {
    if (pxValue === null) {
      result[unit.id] = null;
    } else {
      result[unit.id] = fromPx(pxValue, unit.id, ctx);
    }
  }

  return result;
}

/**
 * CSS値を適切な精度でフォーマットする
 * @param value - フォーマットする数値
 * @returns フォーマット済みの文字列
 */
export function formatCssValue(value: number): string {
  if (!Number.isFinite(value)) return "—";

  // 表示上意味がないほど小さい値
  if (Math.abs(value) < 1e-9 && value !== 0) return "≈ 0";

  // 非常に大きな値は指数表記
  if (Math.abs(value) >= 1e9) return value.toExponential(3);

  // 小数点以下最大6桁、末尾の不要な 0 を除去
  const rounded = parseFloat(value.toFixed(6));
  return rounded.toString();
}
