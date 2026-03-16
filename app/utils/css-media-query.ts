/**
 * CSS メディアクエリ ビルダーのユーティリティ
 */

/** メディアタイプ */
export type MediaType = 'all' | 'screen' | 'print';

/** CSS 単位 */
export type MediaUnit = 'px' | 'em' | 'rem';

/** 出力フォーマット */
export type OutputType = 'css' | 'scss' | 'json';

/** フィーチャーの値タイプ */
export type FeatureValueType = 'length' | 'ratio' | 'keyword' | 'number';

/** メディアフィーチャー名 */
export type MediaFeatureName =
  | 'min-width'
  | 'max-width'
  | 'width'
  | 'min-height'
  | 'max-height'
  | 'height'
  | 'orientation'
  | 'aspect-ratio'
  | 'min-aspect-ratio'
  | 'max-aspect-ratio'
  | 'hover'
  | 'pointer'
  | 'prefers-color-scheme'
  | 'prefers-reduced-motion'
  | 'color'
  | 'resolution';

/**
 * フィーチャー定義（メタ情報）
 */
export interface MediaFeatureDef {
  /** フィーチャー名 */
  name: MediaFeatureName;
  /** 日本語ラベル */
  label: string;
  /** 値タイプ */
  valueType: FeatureValueType;
  /** キーワード選択肢（valueType が keyword の場合） */
  keywords?: string[];
}

/**
 * 単一メディア条件
 */
export interface MediaCondition {
  /** 一意 ID */
  id: string;
  /** フィーチャー名 */
  feature: MediaFeatureName;
  /** 数値（length / number 用） */
  value: number;
  /** CSS 単位（length 用） */
  unit: MediaUnit;
  /** アスペクト比 幅（ratio 用） */
  ratioW: number;
  /** アスペクト比 高さ（ratio 用） */
  ratioH: number;
  /** キーワード値（keyword 用） */
  keyword: string;
}

/**
 * メディアクエリルール全体
 */
export interface MediaQueryRule {
  /** メディアタイプ */
  mediaType: MediaType;
  /** 条件一覧 */
  conditions: MediaCondition[];
  /** クエリ適用先 CSS セレクタ */
  targetSelector: string;
  /** クエリ内スタイル */
  innerCSS: string;
}

/** よく使われるメディアフィーチャーの定義一覧 */
export const MEDIA_FEATURES: MediaFeatureDef[] = [
  { name: 'min-width',  label: 'min-width（最小幅）',   valueType: 'length' },
  { name: 'max-width',  label: 'max-width（最大幅）',   valueType: 'length' },
  { name: 'width',      label: 'width（正確な幅）',      valueType: 'length' },
  { name: 'min-height', label: 'min-height（最小高さ）', valueType: 'length' },
  { name: 'max-height', label: 'max-height（最大高さ）', valueType: 'length' },
  { name: 'height',     label: 'height（正確な高さ）',   valueType: 'length' },
  {
    name: 'orientation',
    label: 'orientation（向き）',
    valueType: 'keyword',
    keywords: ['portrait', 'landscape'],
  },
  { name: 'aspect-ratio',     label: 'aspect-ratio',     valueType: 'ratio' },
  { name: 'min-aspect-ratio', label: 'min-aspect-ratio', valueType: 'ratio' },
  { name: 'max-aspect-ratio', label: 'max-aspect-ratio', valueType: 'ratio' },
  {
    name: 'hover',
    label: 'hover（ホバー対応）',
    valueType: 'keyword',
    keywords: ['hover', 'none'],
  },
  {
    name: 'pointer',
    label: 'pointer（ポインター）',
    valueType: 'keyword',
    keywords: ['fine', 'coarse', 'none'],
  },
  {
    name: 'prefers-color-scheme',
    label: 'prefers-color-scheme（カラースキーム）',
    valueType: 'keyword',
    keywords: ['light', 'dark'],
  },
  {
    name: 'prefers-reduced-motion',
    label: 'prefers-reduced-motion（モーション低減）',
    valueType: 'keyword',
    keywords: ['no-preference', 'reduce'],
  },
  { name: 'color',      label: 'color（色深度）',  valueType: 'number' },
  { name: 'resolution', label: 'resolution（解像度）', valueType: 'number' },
];

/** 一般的なブレイクポイント定義 */
export const COMMON_BREAKPOINTS: { label: string; value: number; unit: MediaUnit }[] = [
  { label: 'xs (480px)',  value: 480,  unit: 'px' },
  { label: 'sm (640px)',  value: 640,  unit: 'px' },
  { label: 'md (768px)',  value: 768,  unit: 'px' },
  { label: 'lg (1024px)', value: 1024, unit: 'px' },
  { label: 'xl (1280px)', value: 1280, unit: 'px' },
  { label: '2xl (1536px)',value: 1536, unit: 'px' },
  { label: 'sm / em (40em)', value: 40, unit: 'em' },
  { label: 'md / em (48em)', value: 48, unit: 'em' },
  { label: 'lg / em (64em)', value: 64, unit: 'em' },
];

/**
 * デフォルト条件を生成する
 * @returns 新しいデフォルト条件（min-width: 768px）
 */
export function createDefaultMediaCondition(): MediaCondition {
  return {
    id: `mcond-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    feature: 'min-width',
    value: 768,
    unit: 'px',
    ratioW: 16,
    ratioH: 9,
    keyword: 'landscape',
  };
}

/** デフォルトメディアクエリルール */
export const defaultMediaQueryRule: MediaQueryRule = {
  mediaType: 'screen',
  conditions: [
    {
      id: 'mcond-default',
      feature: 'min-width',
      value: 768,
      unit: 'px',
      ratioW: 16,
      ratioH: 9,
      keyword: 'landscape',
    },
  ],
  targetSelector: '.container',
  innerCSS: '  display: flex;\n  flex-direction: row;',
};

/**
 * フィーチャー名からフィーチャー定義を取得する
 * @param name - フィーチャー名
 * @returns フィーチャー定義、見つからない場合は length タイプとして返す
 */
function getFeatureDef(name: MediaFeatureName): MediaFeatureDef {
  return (
    MEDIA_FEATURES.find((f) => f.name === name) ?? {
      name,
      label: name,
      valueType: 'length',
    }
  );
}

/**
 * 単一条件文字列を生成する
 * @param cond - メディア条件
 * @returns CSS 条件式文字列（例: "(min-width: 768px)"）
 */
export function formatMediaCondition(cond: MediaCondition): string {
  const def = getFeatureDef(cond.feature);
  switch (def.valueType) {
    case 'length':
      return `(${cond.feature}: ${cond.value}${cond.unit})`;
    case 'ratio':
      return `(${cond.feature}: ${cond.ratioW}/${cond.ratioH})`;
    case 'keyword':
      return `(${cond.feature}: ${cond.keyword})`;
    case 'number':
      return `(${cond.feature}: ${cond.value})`;
  }
}

/**
 * メディアクエリ文字列（@media 行）を生成する
 * @param rule - メディアクエリルール
 * @returns @media クエリ文字列
 */
export function buildMediaQuery(rule: MediaQueryRule): string {
  const parts: string[] = [`@media ${rule.mediaType}`];
  for (const cond of rule.conditions) {
    parts.push(`and ${formatMediaCondition(cond)}`);
  }
  return parts.join(' ');
}

/**
 * 完全な CSS（@media ブロック）を生成する
 * @param rule - メディアクエリルール
 * @returns インデント付き CSS 文字列
 */
export function generateMediaQueryCSS(rule: MediaQueryRule): string {
  const query = buildMediaQuery(rule);
  const selector = rule.targetSelector.trim() || '.container';
  const innerLines = rule.innerCSS
    .split('\n')
    .map((l) => `    ${l.trimStart()}`)
    .join('\n');
  const inner = rule.innerCSS.trim()
    ? innerLines
    : '    /* ここにスタイルを記述 */';
  return `${query} {\n  ${selector} {\n${inner}\n  }\n}`;
}

/**
 * 出力フォーマットを変換する
 * @param rule - メディアクエリルール
 * @param outputType - 出力形式（css / scss / json）
 * @returns フォーマット済み文字列
 */
export function formatMediaQueryOutput(
  rule: MediaQueryRule,
  outputType: OutputType,
): string {
  if (outputType === 'json') {
    const obj = {
      mediaType: rule.mediaType,
      conditions: rule.conditions.map((c) => {
        const def = getFeatureDef(c.feature);
        if (def.valueType === 'ratio') {
          return { feature: c.feature, ratioW: c.ratioW, ratioH: c.ratioH };
        }
        if (def.valueType === 'keyword') {
          return { feature: c.feature, keyword: c.keyword };
        }
        if (def.valueType === 'number') {
          return { feature: c.feature, value: c.value };
        }
        return { feature: c.feature, value: c.value, unit: c.unit };
      }),
      targetSelector: rule.targetSelector.trim() || '.container',
      innerCSS: rule.innerCSS,
    };
    return JSON.stringify(obj, null, 2);
  }

  if (outputType === 'scss') {
    const css = generateMediaQueryCSS(rule);
    return `// Generated with CSS Media Query Builder\n${css}`;
  }

  return generateMediaQueryCSS(rule);
}

/**
 * 指定幅でメディアクエリが適用されるか簡易判定する（プレビュー用）
 * @param rule - メディアクエリルール
 * @param previewWidthPx - 仮想ビューポート幅（px）
 * @returns クエリが全条件を満たす場合 true
 */
export function checkMediaQueryMatch(
  rule: MediaQueryRule,
  previewWidthPx: number,
): boolean {
  if (rule.conditions.length === 0) return true;

  /** em/rem を px に換算（1em = 16px 基準） */
  const toPx = (v: number, unit: MediaUnit): number => {
    if (unit === 'em' || unit === 'rem') return v * 16;
    return v;
  };

  return rule.conditions.every((cond) => {
    const def = getFeatureDef(cond.feature);
    switch (def.valueType) {
      case 'length': {
        const threshold = toPx(cond.value, cond.unit);
        if (cond.feature === 'min-width' || cond.feature === 'width') {
          return previewWidthPx >= threshold;
        }
        if (cond.feature === 'max-width') {
          return previewWidthPx <= threshold;
        }
        // height 系はプレビューでは常に true（ビューポート高さ不明）
        return true;
      }
      case 'ratio': {
        // ビューポート高さを previewWidthPx * 0.5625 (16:9) で近似
        const approxHeight = previewWidthPx * 0.5625;
        const ratio = previewWidthPx / approxHeight;
        const targetRatio = cond.ratioW / cond.ratioH;
        if (cond.feature === 'min-aspect-ratio') return ratio >= targetRatio;
        if (cond.feature === 'max-aspect-ratio') return ratio <= targetRatio;
        return Math.abs(ratio - targetRatio) < 0.01;
      }
      case 'keyword':
        // プレビューでは portrait=幅が小さい、landscape=幅が大きいで近似
        if (cond.feature === 'orientation') {
          if (cond.keyword === 'landscape') return previewWidthPx >= 600;
          if (cond.keyword === 'portrait') return previewWidthPx < 600;
        }
        // その他のキーワード条件はプレビューでは判定不可 → true として扱う
        return true;
      case 'number':
        // color, resolution などはプレビューでは判定不可 → true として扱う
        return true;
    }
  });
}
