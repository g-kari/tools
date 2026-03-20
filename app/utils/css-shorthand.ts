/**
 * CSS ショートハンドプロパティ展開ユーティリティ
 *
 * CSS のショートハンドプロパティ（margin・padding・border-radius・flex など）を
 * 個別のロングハンドプロパティに展開、またはロングハンドからショートハンドに圧縮します。
 */

/** ロングハンドプロパティ（プロパティ名と値のペア） */
export type LonghandProperty = {
  /** プロパティ名 */
  property: string;
  /** 値 */
  value: string;
};

/** ショートハンドプロパティの定義 */
export type ShorthandDefinition = {
  /** プロパティ名 */
  name: string;
  /** 説明 */
  description: string;
  /** ロングハンドプロパティ名一覧 */
  longhands: readonly string[];
  /** シンタックス */
  syntax: string;
  /** サンプル値（プロパティ名: 値の形式） */
  example: string;
  /** ショートハンド値をロングハンドに展開する */
  expand: (values: string[]) => LonghandProperty[] | null;
  /** ロングハンドのプロパティ名→値マップからショートハンドに圧縮する */
  collapse: (props: Record<string, string>) => string | null;
};

/**
 * CSS 値文字列を個々のトークンに分割する
 * 括弧内（calc()・rgb() など）のスペースは区切りとして扱わない
 *
 * @param value - CSS 値文字列（例: 'calc(100% - 20px) auto'）
 * @returns 値トークンの配列
 */
export function splitCssValues(value: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of value.trim()) {
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ' ' && depth === 0) {
      const token = current.trim();
      if (token) tokens.push(token);
      current = '';
    } else {
      current += char;
    }
  }

  const last = current.trim();
  if (last) tokens.push(last);
  return tokens;
}

/**
 * ボックスモデルの 1〜4 値を 4 つのサイドに展開する
 * CSS の margin/padding/border-radius/inset と同じ展開ルールを適用する
 *
 * @param sides - 4 つのサイドのプロパティ名 [top, right, bottom, left]
 * @param values - ショートハンドの値トークン（1〜4 個）
 * @returns ロングハンドプロパティの配列、またはエラー時は null
 */
function expandBoxModel(
  sides: readonly [string, string, string, string],
  values: string[]
): LonghandProperty[] | null {
  if (values.length === 0 || values.length > 4) return null;

  let top: string, right: string, bottom: string, left: string;

  switch (values.length) {
    case 1:
      top = right = bottom = left = values[0];
      break;
    case 2:
      top = bottom = values[0];
      right = left = values[1];
      break;
    case 3:
      top = values[0];
      right = left = values[1];
      bottom = values[2];
      break;
    default:
      [top, right, bottom, left] = values;
  }

  return [
    { property: sides[0], value: top },
    { property: sides[1], value: right },
    { property: sides[2], value: bottom },
    { property: sides[3], value: left },
  ];
}

/**
 * 4 つのサイドのロングハンドからボックスモデルのショートハンドに圧縮する
 *
 * @param sides - 4 つのサイドのプロパティ名 [top, right, bottom, left]
 * @param props - ロングハンドのプロパティ名→値マップ
 * @returns 圧縮されたショートハンド値、またはエラー時は null
 */
function collapseBoxModel(
  sides: readonly [string, string, string, string],
  props: Record<string, string>
): string | null {
  const [topProp, rightProp, bottomProp, leftProp] = sides;
  const top = props[topProp];
  const right = props[rightProp];
  const bottom = props[bottomProp];
  const left = props[leftProp];

  if (!top || !right || !bottom || !left) return null;

  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

/** サポートするショートハンドプロパティの定義一覧 */
export const SHORTHAND_DEFINITIONS: readonly ShorthandDefinition[] = [
  {
    name: 'margin',
    description: '外側の余白（マージン）の一括指定',
    longhands: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
    syntax: 'margin: <top> [<right> [<bottom> [<left>]]]',
    example: 'margin: 16px 24px',
    expand: (values) =>
      expandBoxModel(
        ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
        values
      ),
    collapse: (props) =>
      collapseBoxModel(
        ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
        props
      ),
  },
  {
    name: 'padding',
    description: '内側の余白（パディング）の一括指定',
    longhands: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
    syntax: 'padding: <top> [<right> [<bottom> [<left>]]]',
    example: 'padding: 8px 16px',
    expand: (values) =>
      expandBoxModel(
        ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
        values
      ),
    collapse: (props) =>
      collapseBoxModel(
        ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
        props
      ),
  },
  {
    name: 'border-radius',
    description: '角丸（ボーダー半径）の一括指定',
    longhands: [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius',
    ],
    syntax: 'border-radius: <tl> [<tr> [<br> [<bl>]]]',
    example: 'border-radius: 4px 8px',
    expand: (values) =>
      expandBoxModel(
        [
          'border-top-left-radius',
          'border-top-right-radius',
          'border-bottom-right-radius',
          'border-bottom-left-radius',
        ],
        values
      ),
    collapse: (props) =>
      collapseBoxModel(
        [
          'border-top-left-radius',
          'border-top-right-radius',
          'border-bottom-right-radius',
          'border-bottom-left-radius',
        ],
        props
      ),
  },
  {
    name: 'inset',
    description: '絶対配置の位置（top/right/bottom/left）の一括指定',
    longhands: ['top', 'right', 'bottom', 'left'],
    syntax: 'inset: <top> [<right> [<bottom> [<left>]]]',
    example: 'inset: 0 auto',
    expand: (values) => expandBoxModel(['top', 'right', 'bottom', 'left'], values),
    collapse: (props) => collapseBoxModel(['top', 'right', 'bottom', 'left'], props),
  },
  {
    name: 'overflow',
    description: 'はみ出し処理（X/Y 軸）の一括指定',
    longhands: ['overflow-x', 'overflow-y'],
    syntax: 'overflow: <x> [<y>]',
    example: 'overflow: hidden auto',
    expand: (values) => {
      if (values.length === 0 || values.length > 2) return null;
      return [
        { property: 'overflow-x', value: values[0] },
        { property: 'overflow-y', value: values.length === 2 ? values[1] : values[0] },
      ];
    },
    collapse: (props) => {
      const x = props['overflow-x'];
      const y = props['overflow-y'];
      if (!x || !y) return null;
      return x === y ? x : `${x} ${y}`;
    },
  },
  {
    name: 'gap',
    description: 'Grid/Flexbox のギャップ（行列間隔）の一括指定',
    longhands: ['row-gap', 'column-gap'],
    syntax: 'gap: <row-gap> [<column-gap>]',
    example: 'gap: 16px 24px',
    expand: (values) => {
      if (values.length === 0 || values.length > 2) return null;
      return [
        { property: 'row-gap', value: values[0] },
        { property: 'column-gap', value: values.length === 2 ? values[1] : values[0] },
      ];
    },
    collapse: (props) => {
      const row = props['row-gap'];
      const col = props['column-gap'];
      if (!row || !col) return null;
      return row === col ? row : `${row} ${col}`;
    },
  },
  {
    name: 'flex',
    description: 'フレックスアイテムの伸縮・基準サイズの一括指定',
    longhands: ['flex-grow', 'flex-shrink', 'flex-basis'],
    syntax: 'flex: none | auto | <grow> [<shrink> [<basis>]]',
    example: 'flex: 1 1 auto',
    expand: (values) => {
      if (values.length === 0 || values.length > 3) return null;
      if (values.length === 1) {
        const v = values[0];
        if (v === 'none') {
          return [
            { property: 'flex-grow', value: '0' },
            { property: 'flex-shrink', value: '0' },
            { property: 'flex-basis', value: 'auto' },
          ];
        }
        if (v === 'auto') {
          return [
            { property: 'flex-grow', value: '1' },
            { property: 'flex-shrink', value: '1' },
            { property: 'flex-basis', value: 'auto' },
          ];
        }
        if (/^\d+(\.\d+)?$/.test(v)) {
          return [
            { property: 'flex-grow', value: v },
            { property: 'flex-shrink', value: '1' },
            { property: 'flex-basis', value: '0' },
          ];
        }
        return [
          { property: 'flex-grow', value: '1' },
          { property: 'flex-shrink', value: '1' },
          { property: 'flex-basis', value: v },
        ];
      }
      if (values.length === 2) {
        return [
          { property: 'flex-grow', value: values[0] },
          { property: 'flex-shrink', value: values[1] },
          { property: 'flex-basis', value: '0' },
        ];
      }
      return [
        { property: 'flex-grow', value: values[0] },
        { property: 'flex-shrink', value: values[1] },
        { property: 'flex-basis', value: values[2] },
      ];
    },
    collapse: (props) => {
      const grow = props['flex-grow'];
      const shrink = props['flex-shrink'];
      const basis = props['flex-basis'];
      if (!grow || !shrink || !basis) return null;
      if (grow === '0' && shrink === '0' && basis === 'auto') return 'none';
      if (grow === '1' && shrink === '1' && basis === 'auto') return 'auto';
      return `${grow} ${shrink} ${basis}`;
    },
  },
  {
    name: 'place-content',
    description: 'align-content と justify-content の一括指定',
    longhands: ['align-content', 'justify-content'],
    syntax: 'place-content: <align-content> [<justify-content>]',
    example: 'place-content: center space-between',
    expand: (values) => {
      if (values.length === 0 || values.length > 2) return null;
      return [
        { property: 'align-content', value: values[0] },
        {
          property: 'justify-content',
          value: values.length === 2 ? values[1] : values[0],
        },
      ];
    },
    collapse: (props) => {
      const align = props['align-content'];
      const justify = props['justify-content'];
      if (!align || !justify) return null;
      return align === justify ? align : `${align} ${justify}`;
    },
  },
  {
    name: 'place-items',
    description: 'align-items と justify-items の一括指定',
    longhands: ['align-items', 'justify-items'],
    syntax: 'place-items: <align-items> [<justify-items>]',
    example: 'place-items: center start',
    expand: (values) => {
      if (values.length === 0 || values.length > 2) return null;
      return [
        { property: 'align-items', value: values[0] },
        {
          property: 'justify-items',
          value: values.length === 2 ? values[1] : values[0],
        },
      ];
    },
    collapse: (props) => {
      const align = props['align-items'];
      const justify = props['justify-items'];
      if (!align || !justify) return null;
      return align === justify ? align : `${align} ${justify}`;
    },
  },
  {
    name: 'place-self',
    description: 'align-self と justify-self の一括指定',
    longhands: ['align-self', 'justify-self'],
    syntax: 'place-self: <align-self> [<justify-self>]',
    example: 'place-self: end center',
    expand: (values) => {
      if (values.length === 0 || values.length > 2) return null;
      return [
        { property: 'align-self', value: values[0] },
        {
          property: 'justify-self',
          value: values.length === 2 ? values[1] : values[0],
        },
      ];
    },
    collapse: (props) => {
      const align = props['align-self'];
      const justify = props['justify-self'];
      if (!align || !justify) return null;
      return align === justify ? align : `${align} ${justify}`;
    },
  },
];

/**
 * プロパティ名からショートハンド定義を取得する
 *
 * @param name - ショートハンドプロパティ名
 * @returns ショートハンド定義、見つからない場合は null
 */
export function getShorthandDefinition(name: string): ShorthandDefinition | null {
  return SHORTHAND_DEFINITIONS.find((def) => def.name === name) ?? null;
}

/**
 * ショートハンド値をロングハンドプロパティに展開する
 *
 * @param propertyName - ショートハンドプロパティ名（例: 'margin'）
 * @param value - ショートハンド値（例: '10px 20px'）
 * @returns ロングハンドプロパティの配列、無効な入力の場合は null
 */
export function expandShorthand(
  propertyName: string,
  value: string
): LonghandProperty[] | null {
  const def = getShorthandDefinition(propertyName);
  if (!def) return null;
  const values = splitCssValues(value);
  if (values.length === 0) return null;
  return def.expand(values);
}

/**
 * ロングハンドプロパティをショートハンドに圧縮する
 *
 * @param propertyName - ショートハンドプロパティ名（例: 'margin'）
 * @param longhands - ロングハンドのプロパティ名→値マップ
 * @returns 圧縮されたショートハンド値、無効な入力の場合は null
 */
export function collapseShorthand(
  propertyName: string,
  longhands: Record<string, string>
): string | null {
  const def = getShorthandDefinition(propertyName);
  if (!def) return null;
  return def.collapse(longhands);
}
