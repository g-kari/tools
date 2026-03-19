/**
 * CSS Custom Properties (カスタムプロパティ) 解析ユーティリティ
 */

/**
 * 抽出されたCSS変数の型定義
 */
export interface CssVariable {
  /** 変数名 (例: --color-primary) */
  name: string;
  /** 変数の値 */
  value: string;
  /** 宣言されたセレクター */
  selector: string;
  /** カラー値かどうか */
  isColor: boolean;
  /** CSSカラー値（isColorがtrueの場合） */
  colorValue: string | null;
}

/**
 * パース結果の型定義
 */
export interface ParseResult {
  /** 抽出された変数一覧 */
  variables: CssVariable[];
  /** エラーメッセージ（ある場合） */
  error: string | null;
}

/**
 * 値がCSSカラーかどうかを判定する
 * @param value - チェックする値
 * @returns カラー値かどうか
 */
export function isCssColor(value: string): boolean {
  const trimmed = value.trim();
  // 16進数カラー
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return true;
  }
  // rgb/rgba
  if (/^rgba?\s*\(/.test(trimmed)) return true;
  // hsl/hsla
  if (/^hsla?\s*\(/.test(trimmed)) return true;
  // oklch/oklab/lch/lab
  if (/^(oklch|oklab|lch|lab)\s*\(/.test(trimmed)) return true;
  // color()
  if (/^color\s*\(/.test(trimmed)) return true;
  // CSSカラーキーワード（主要なもの）
  const colorKeywords = new Set([
    'red', 'green', 'blue', 'white', 'black', 'gray', 'grey', 'yellow',
    'orange', 'purple', 'pink', 'brown', 'cyan', 'magenta', 'lime',
    'indigo', 'violet', 'teal', 'coral', 'salmon', 'navy', 'olive',
    'maroon', 'aqua', 'fuchsia', 'silver', 'gold', 'transparent',
    'currentcolor', 'inherit', 'initial', 'unset',
  ]);
  if (colorKeywords.has(trimmed.toLowerCase())) return true;
  return false;
}

/**
 * カラー値をCSS backgroundで使える形式に変換する
 * @param value - カラー値
 * @returns CSS背景色として使える文字列、またはnull
 */
export function resolveColorValue(value: string): string | null {
  const trimmed = value.trim();
  if (!isCssColor(trimmed)) return null;
  // var()参照は解決できないのでnull
  if (trimmed.includes('var(')) return null;
  return trimmed;
}

/**
 * CSSテキストからCSS Custom Propertiesを抽出する
 * @param css - 解析するCSSテキスト
 * @returns パース結果
 */
export function parseCssVariables(css: string): ParseResult {
  if (!css.trim()) {
    return { variables: [], error: null };
  }

  const variables: CssVariable[] = [];
  const seen = new Map<string, number>(); // name+selector -> index

  // コメントを除去
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  // セレクターブロックを解析
  const blockRegex = /([^{]*)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(stripped)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    const block = match[2];

    // --custom-property: value; を抽出
    const varRegex = /(--[\w-]+)\s*:\s*([^;]+);?/g;
    let varMatch: RegExpExecArray | null;

    while ((varMatch = varRegex.exec(block)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();
      const key = `${selector}|${name}`;

      if (seen.has(key)) {
        // 同じセレクター内での重複は上書き
        const idx = seen.get(key)!;
        variables[idx] = {
          name,
          value,
          selector,
          isColor: isCssColor(value),
          colorValue: resolveColorValue(value),
        };
      } else {
        seen.set(key, variables.length);
        variables.push({
          name,
          value,
          selector,
          isColor: isCssColor(value),
          colorValue: resolveColorValue(value),
        });
      }
    }
  }

  return { variables, error: null };
}

/**
 * CSS変数一覧をCSS形式でエクスポートする
 * @param variables - エクスポートする変数一覧
 * @param selector - 出力するセレクター
 * @returns CSS文字列
 */
export function exportAsCss(variables: CssVariable[], selector = ':root'): string {
  if (variables.length === 0) return '';
  const declarations = variables.map((v) => `  ${v.name}: ${v.value};`).join('\n');
  return `${selector} {\n${declarations}\n}`;
}

/**
 * CSS変数一覧をJSON形式でエクスポートする
 * @param variables - エクスポートする変数一覧
 * @returns JSON文字列
 */
export function exportAsJson(variables: CssVariable[]): string {
  const obj: Record<string, string> = {};
  for (const v of variables) {
    obj[v.name] = v.value;
  }
  return JSON.stringify(obj, null, 2);
}

/**
 * CSS変数一覧をJS/TSオブジェクト形式でエクスポートする
 * @param variables - エクスポートする変数一覧
 * @returns JS/TS文字列
 */
export function exportAsJs(variables: CssVariable[]): string {
  if (variables.length === 0) return 'export const cssVariables = {};';
  const entries = variables
    .map((v) => {
      const key = v.name.replace(/^--/, '').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      return `  '${key}': '${v.value.replace(/'/g, "\\'")}'`;
    })
    .join(',\n');
  return `export const cssVariables = {\n${entries},\n} as const;`;
}
