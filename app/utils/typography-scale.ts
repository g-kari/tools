/**
 * タイポグラフィスケール生成ユーティリティ
 *
 * モジュラースケール理論に基づき、基準フォントサイズと比率から
 * 一貫性のあるタイポグラフィスケールを生成します。
 */

/** スケール比のプリセット定義 */
export interface ScaleRatio {
  /** スケール名（表示用） */
  name: string;
  /** スケールの比率値 */
  value: number;
}

/** スケールの各ステップ */
export interface ScaleStep {
  /** ステップ番号（基準は0、上が正、下が負） */
  step: number;
  /** フォントサイズ（px） */
  sizePx: number;
  /** フォントサイズ（rem） */
  sizeRem: number;
  /** CSS変数名（例: --type-base） */
  varName: string;
  /** ステップのラベル（例: base, lg, xl） */
  label: string;
}

/** スケール生成オプション */
export interface GenerateScaleOptions {
  /** 基準フォントサイズ（px）。デフォルト: 16 */
  baseSizePx: number;
  /** ルートフォントサイズ（px）。rem 計算の基準。デフォルト: 16 */
  rootFontSizePx: number;
  /** スケール比率 */
  ratio: number;
  /** 基準から上方向のステップ数 */
  stepsUp: number;
  /** 基準から下方向のステップ数 */
  stepsDown: number;
}

/** 出力フォーマット */
export type OutputFormat = "css" | "scss" | "json" | "tailwind";

/** よく使われるモジュラースケール比率のプリセット */
export const SCALE_RATIOS: ScaleRatio[] = [
  { name: "Minor Second (1.067)", value: 1.067 },
  { name: "Major Second (1.125)", value: 1.125 },
  { name: "Minor Third (1.200)", value: 1.2 },
  { name: "Major Third (1.250)", value: 1.25 },
  { name: "Perfect Fourth (1.333)", value: 1.333 },
  { name: "Augmented Fourth (1.414)", value: 1.414 },
  { name: "Perfect Fifth (1.500)", value: 1.5 },
  { name: "Golden Ratio (1.618)", value: 1.618 },
];

/**
 * ステップ番号に対応するラベルを返す
 * @param step - ステップ番号
 * @returns ラベル文字列
 */
export function getStepLabel(step: number): string {
  const labels: Record<number, string> = {
    0: "base",
    1: "lg",
    2: "xl",
    3: "2xl",
    4: "3xl",
    5: "4xl",
    6: "5xl",
    7: "6xl",
    "-1": "sm",
    "-2": "xs",
    "-3": "2xs",
    "-4": "3xs",
  };
  return labels[step] ?? (step > 0 ? `${step}xl` : `${Math.abs(step)}xs`);
}

/**
 * タイポグラフィスケールを生成する
 * @param options - スケール生成オプション
 * @returns スケールステップの配列（下から上の順）
 */
export function generateScale(options: GenerateScaleOptions): ScaleStep[] {
  const { baseSizePx, rootFontSizePx, ratio, stepsUp, stepsDown } = options;
  const steps: ScaleStep[] = [];

  for (let i = -stepsDown; i <= stepsUp; i++) {
    const sizePx = baseSizePx * Math.pow(ratio, i);
    const sizeRem = sizePx / rootFontSizePx;
    const label = getStepLabel(i);
    const varName = `--type-${label}`;

    steps.push({
      step: i,
      sizePx: Math.round(sizePx * 100) / 100,
      sizeRem: Math.round(sizeRem * 10000) / 10000,
      varName,
      label,
    });
  }

  return steps;
}

/**
 * CSS カスタムプロパティ（:root）形式で出力する
 * @param steps - スケールステップの配列
 * @returns CSS文字列
 */
export function generateCssOutput(steps: ScaleStep[]): string {
  const vars = steps
    .map(
      (s) =>
        `  ${s.varName}: ${s.sizeRem.toFixed(4)}rem; /* ${s.sizePx.toFixed(2)}px */`
    )
    .join("\n");
  return `:root {\n${vars}\n}`;
}

/**
 * SCSS 変数形式で出力する
 * @param steps - スケールステップの配列
 * @returns SCSS文字列
 */
export function generateScssOutput(steps: ScaleStep[]): string {
  return steps
    .map(
      (s) =>
        `$type-${s.label}: ${s.sizeRem.toFixed(4)}rem; // ${s.sizePx.toFixed(2)}px`
    )
    .join("\n");
}

/**
 * JSON 形式で出力する
 * @param steps - スケールステップの配列
 * @returns JSON文字列
 */
export function generateJsonOutput(steps: ScaleStep[]): string {
  const obj: Record<string, { px: number; rem: number }> = {};
  steps.forEach((s) => {
    obj[s.label] = {
      px: s.sizePx,
      rem: parseFloat(s.sizeRem.toFixed(4)),
    };
  });
  return JSON.stringify({ typography: obj }, null, 2);
}

/**
 * Tailwind CSS 設定形式で出力する
 * @param steps - スケールステップの配列
 * @returns Tailwind config文字列
 */
export function generateTailwindOutput(steps: ScaleStep[]): string {
  const entries = steps
    .map(
      (s) =>
        `      "${s.label}": "${s.sizeRem.toFixed(4)}rem", // ${s.sizePx.toFixed(2)}px`
    )
    .join("\n");
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      fontSize: {\n${entries}\n      },\n    },\n  },\n};`;
}

/**
 * 出力フォーマットに応じたコードを生成する
 * @param steps - スケールステップの配列
 * @param format - 出力フォーマット
 * @returns コード文字列
 */
export function generateOutput(steps: ScaleStep[], format: OutputFormat): string {
  switch (format) {
    case "css":
      return generateCssOutput(steps);
    case "scss":
      return generateScssOutput(steps);
    case "json":
      return generateJsonOutput(steps);
    case "tailwind":
      return generateTailwindOutput(steps);
    default:
      return generateCssOutput(steps);
  }
}
