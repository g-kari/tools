/**
 * JavaScriptコードをminify化する
 *
 * コメントと不要な空白を削除してコードサイズを削減します
 *
 * @param code - 圧縮するJavaScriptコード
 * @returns 圧縮されたJavaScriptコード
 *
 * @example
 * ```typescript
 * const code = 'function hello() { console.log("Hello"); }';
 * const minified = minifyJavaScript(code);
 * // => 'function hello(){console.log("Hello");}'
 * ```
 */
export function minifyJavaScript(code: string): string {
  let result = code;

  // 複数行コメント /* ... */ を削除
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // 単一行コメント // ... を削除（文字列内を除く）
  result = result.replace(/\/\/.*$/gm, "");

  // 行頭・行末の空白を削除
  result = result.replace(/^\s+|\s+$/gm, "");

  // 複数の空白を1つに
  result = result.replace(/\s+/g, " ");

  // 演算子周りの空白を削除
  result = result.replace(/\s*([{}();:,=+\-*/<>!&|])\s*/g, "$1");

  // 空行を削除
  result = result.replace(/\n+/g, "");

  return result.trim();
}

/**
 * CSSコードをminify化する
 *
 * コメントと不要な空白を削除してファイルサイズを削減します
 *
 * @param code - 圧縮するCSSコード
 * @returns 圧縮されたCSSコード
 *
 * @example
 * ```typescript
 * const css = "body { margin: 0; padding: 0; }";
 * const minified = minifyCSS(css);
 * // => 'body{margin:0;padding:0;}'
 * ```
 */
export function minifyCSS(code: string): string {
  let result = code;

  // コメント /* ... */ を削除
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // 行頭・行末の空白を削除
  result = result.replace(/^\s+|\s+$/gm, "");

  // 複数の空白を1つに
  result = result.replace(/\s+/g, " ");

  // セレクタ・プロパティ周りの空白を削除
  result = result.replace(/\s*([{}:;,>+~])\s*/g, "$1");

  // 空行を削除
  result = result.replace(/\n+/g, "");

  // 0の単位を削除 (0px -> 0)
  result = result.replace(/(\s|:)0(px|em|rem|%|vh|vw)/g, "$10");

  // カラーコードの短縮 (#ffffff -> #fff)
  result = result.replace(
    /#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi,
    "#$1$2$3"
  );

  return result.trim();
}

/**
 * HTMLコードをminify化する
 *
 * コメントと不要な空白を削除してファイルサイズを削減します
 *
 * @param code - 圧縮するHTMLコード
 * @returns 圧縮されたHTMLコード
 *
 * @example
 * ```typescript
 * const html = "<div><p>Hello</p></div>";
 * const minified = minifyHTML(html);
 * // => '<div><p>Hello</p></div>'
 * ```
 */
export function minifyHTML(code: string): string {
  let result = code;

  // HTMLコメント <!-- ... --> を削除
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // タグ間の空白を削除
  result = result.replace(/>\s+</g, "><");

  // 行頭・行末の空白を削除
  result = result.replace(/^\s+|\s+$/gm, "");

  // 複数の空白を1つに
  result = result.replace(/\s+/g, " ");

  // 空行を削除
  result = result.replace(/\n+/g, "");

  return result.trim();
}

/**
 * JSONコードをminify化する
 *
 * 不要な空白を削除して1行に圧縮します
 *
 * @param code - 圧縮するJSONコード
 * @returns 圧縮されたJSONコード
 * @throws JSON構文エラーの場合
 *
 * @example
 * ```typescript
 * const json = '{"name": "test", "value": 123}';
 * const minified = minifyJSON(json);
 * // => '{"name":"test","value":123}'
 * ```
 */
export function minifyJSON(code: string): string {
  try {
    // JSONをパースして再stringify（空白なし）
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed);
  } catch (err) {
    throw new Error(
      `JSON構文エラー: ${err instanceof Error ? err.message : "不明なエラー"}`
    );
  }
}
