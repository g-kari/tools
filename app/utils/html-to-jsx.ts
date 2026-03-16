/**
 * HTML to JSX変換ユーティリティ
 * HTMLマークアップをReact JSX構文に変換する
 */

/** 自己閉じタグにすべきvoid要素 */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * HTML属性名からJSX属性名へのマッピング
 * イベントハンドラは別途処理するため含まない
 */
const ATTR_NAME_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  crossorigin: 'crossOrigin',
  enctype: 'encType',
  hreflang: 'hrefLang',
  accesskey: 'accessKey',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  usemap: 'useMap',
  novalidate: 'noValidate',
  srcdoc: 'srcDoc',
  srcset: 'srcSet',
  inputmode: 'inputMode',
};

/**
 * CSSプロパティ名をkebab-caseからcamelCaseに変換する
 * @param property - 変換するCSSプロパティ名
 * @returns camelCase形式のプロパティ名
 */
export function cssPropertyToCamelCase(property: string): string {
  const trimmed = property.trim();
  // ベンダープレフィックス: -webkit-xxx → WebkitXxx
  if (trimmed.startsWith('-')) {
    const parts = trimmed.slice(1).split('-');
    if (parts.length === 0 || !parts[0]) return trimmed;
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[0].slice(1) +
      parts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')
    );
  }
  return trimmed.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * インラインstyle文字列をJSXのオブジェクトリテラル記法に変換する
 * @param styleStr - 変換するstyle属性値（例: "color: red; font-size: 14px"）
 * @returns JSXのstyleオブジェクト記法（例: "{{ color: 'red', fontSize: '14px' }}"）
 */
export function convertStyleValue(styleStr: string): string {
  const declarations = styleStr.split(';').map((d) => d.trim()).filter(Boolean);
  const props = declarations.flatMap((decl) => {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) return [];
    const prop = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    if (!prop || !val) return [];
    const camelProp = cssPropertyToCamelCase(prop);
    // 純粋な数値はクォートなし
    if (/^-?\d+(\.\d+)?$/.test(val)) {
      return [`${camelProp}: ${val}`];
    }
    // シングルクォートをエスケープ
    const escapedVal = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return [`${camelProp}: '${escapedVal}'`];
  });
  return `{{ ${props.join(', ')} }}`;
}

/**
 * イベントハンドラ属性名をHTMLからJSXのcamelCaseに変換する
 * @param name - 変換するイベントハンドラ名（例: "onclick"）
 * @returns camelCase形式のJSXイベントハンドラ名（例: "onClick"）
 */
export function convertEventName(name: string): string {
  if (/^on[a-z]/.test(name)) {
    return 'on' + name.charAt(2).toUpperCase() + name.slice(3);
  }
  return name;
}

/**
 * HTML属性名をJSX属性名に変換する
 * @param name - 変換するHTML属性名
 * @returns JSX形式の属性名
 */
function convertAttrName(name: string): string {
  const lower = name.toLowerCase();
  if (ATTR_NAME_MAP[lower]) return ATTR_NAME_MAP[lower];
  if (/^on[a-z]/.test(lower)) return convertEventName(lower);
  return name;
}

/**
 * HTML属性をJSX属性文字列に変換する
 * @param name - 属性名
 * @param value - 属性値（nullの場合はboolean属性）
 * @returns JSX形式の属性文字列
 */
function convertAttr(name: string, value: string | null): string {
  const lower = name.toLowerCase();
  const jsxName = convertAttrName(name);

  // style属性の特別処理
  if (lower === 'style' && value !== null) {
    return `${jsxName}=${convertStyleValue(value)}`;
  }

  // boolean属性（値なし）
  if (value === null) {
    return jsxName;
  }

  // 空文字
  if (value === '') {
    return `${jsxName}=""`;
  }

  // boolean文字列
  if (value === 'true') return `${jsxName}={true}`;
  if (value === 'false') return `${jsxName}={false}`;

  // 通常の文字列
  return `${jsxName}="${value}"`;
}

/** 変換の種類と件数を表す型 */
export interface ConversionChange {
  /** 変換の種類識別子 */
  type: string;
  /** 変換内容の日本語説明 */
  description: string;
  /** 変換が行われた件数 */
  count: number;
}

/** HTML→JSX変換の結果を表す型 */
export interface HtmlToJsxResult {
  /** 変換後のJSX文字列 */
  output: string;
  /** 行われた変換の一覧（件数0のものは含まない） */
  changes: ConversionChange[];
}

/**
 * HTML文字列をReact JSX構文に変換する
 *
 * 変換内容:
 * - `class` → `className`
 * - `for` → `htmlFor`
 * - イベントハンドラのcamelCase変換（onclick → onClick等）
 * - tabindex, readonly, maxlength等の属性名変換
 * - void要素の自己閉じタグ化（`<br>` → `<br />`）
 * - `style="..."` → `style={{ ... }}`（CSSプロパティのcamelCase変換付き）
 * - HTMLコメント `<!-- -->` → JSXコメント形式に変換
 *
 * @param html - 変換するHTML文字列
 * @returns 変換結果（output: JSX文字列, changes: 変換内容一覧）
 */
export function convertHtmlToJsx(html: string): HtmlToJsxResult {
  const counts: Record<string, number> = {};

  const inc = (key: string) => {
    counts[key] = (counts[key] ?? 0) + 1;
  };

  let result = html;

  // 1. HTMLコメントをJSXコメントに変換
  result = result.replace(/<!--([\s\S]*?)-->/g, (_, content: string) => {
    inc('comment');
    return `{/*${content}*/}`;
  });

  // 2. タグを処理（属性変換 + void要素の自己閉じ）
  // タグにマッチ: <tagName attrs...> (自己閉じでないもの)
  result = result.replace(
    /<([a-zA-Z][a-zA-Z0-9-]*)(\s(?:[^>'"]*|"[^"]*"|'[^']*')*)?(\s*\/)?\s*>/g,
    (
      _match: string,
      tagName: string,
      attrsStr: string | undefined,
      selfClose: string | undefined
    ) => {
      const isSelfClosed = !!selfClose;
      const isVoid = VOID_ELEMENTS.has(tagName.toLowerCase());

      let convertedAttrs = '';

      if (attrsStr) {
        // 属性をパース（クォート内を考慮）
        const attrRegex =
          /\s+([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>'"]+)))?/g;
        let attrMatch: RegExpExecArray | null;

        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const [, name, dqVal, sqVal, unquotedVal] = attrMatch;
          const value =
            dqVal !== undefined
              ? dqVal
              : sqVal !== undefined
                ? sqVal
                : unquotedVal !== undefined
                  ? unquotedVal
                  : null;

          const lower = name.toLowerCase();

          // 変更カウント
          if (lower === 'class') {
            inc('class');
          } else if (lower === 'for') {
            inc('for');
          } else if (lower === 'style' && value) {
            inc('style');
          } else if (/^on[a-z]/.test(lower)) {
            const jsxName = convertEventName(lower);
            if (jsxName !== lower) inc('event');
          } else if (ATTR_NAME_MAP[lower] && ATTR_NAME_MAP[lower] !== name) {
            inc('attr');
          }

          convertedAttrs += ' ' + convertAttr(name, value);
        }
      }

      if (isVoid) {
        if (!isSelfClosed) inc('void');
        return `<${tagName}${convertedAttrs} />`;
      }

      if (isSelfClosed) {
        return `<${tagName}${convertedAttrs} />`;
      }

      return `<${tagName}${convertedAttrs}>`;
    }
  );

  // 変更点リストを構築
  const changes: ConversionChange[] = [];

  if (counts['class']) {
    changes.push({
      type: 'class',
      description: `class → className`,
      count: counts['class'],
    });
  }
  if (counts['for']) {
    changes.push({
      type: 'for',
      description: `for → htmlFor`,
      count: counts['for'],
    });
  }
  if (counts['event']) {
    changes.push({
      type: 'event',
      description: `イベントハンドラ camelCase変換（onclick → onClick 等）`,
      count: counts['event'],
    });
  }
  if (counts['attr']) {
    changes.push({
      type: 'attr',
      description: `属性名の変換（tabindex → tabIndex、readonly → readOnly 等）`,
      count: counts['attr'],
    });
  }
  if (counts['style']) {
    changes.push({
      type: 'style',
      description: `style 文字列 → オブジェクト記法（style="..." → style={{...}}）`,
      count: counts['style'],
    });
  }
  if (counts['void']) {
    changes.push({
      type: 'void',
      description: `void要素の自己閉じ（<br> → <br /> 等）`,
      count: counts['void'],
    });
  }
  if (counts['comment']) {
    changes.push({
      type: 'comment',
      description: `HTMLコメント → JSXコメント（<!-- --> → {/* */}）`,
      count: counts['comment'],
    });
  }

  return { output: result, changes };
}
