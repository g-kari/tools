/** ディザリングモードの型定義 */
export type DitherMode = "bayer" | "floyd_steinberg" | "sierra2_4a" | "none";

/**
 * ディザリングモードに応じたpaletteuse部分のフィルター文字列を生成する
 * @param ditherMode - ディザリングモード
 * @param quality - Bayer専用の調整値（1-100。他の方式では使用しない）
 * @returns paletteuseフィルター文字列
 */
export function buildPaletteUseFilter(ditherMode: DitherMode, quality: number): string {
  if (ditherMode === "bayer") {
    // quality 1-100 → bayer_scale 5-0（Bayerの強さを6段階で調整）
    const bayerScale = Math.round((1 - (quality - 1) / 99) * 5);
    return `paletteuse=dither=bayer:bayer_scale=${bayerScale}`;
  }
  if (ditherMode === "none") {
    return "paletteuse=dither=none";
  }
  return `paletteuse=dither=${ditherMode}`;
}
