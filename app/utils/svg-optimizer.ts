/**
 * SVGオプティマイザーユーティリティ
 * SVGコードの最適化・圧縮・整形を行う
 */

/**
 * SVG最適化のオプション
 */
export interface SvgOptimizerOptions {
  /** メタデータ（コメント、エディタ情報等）を削除する */
  removeMetadata: boolean;
  /** 不要な属性（id未参照、デフォルト値等）を削除する */
  removeUnusedAttrs: boolean;
  /** 座標の精度（小数点以下の桁数） */
  precision: number;
  /** 出力を整形（prettify）する */
  prettify: boolean;
  /** XML宣言を削除する */
  removeXmlDeclaration: boolean;
  /** 空のグループ要素を削除する */
  removeEmptyGroups: boolean;
}

/**
 * SVG最適化の結果
 */
export interface SvgOptimizeResult {
  /** 最適化後のSVGコード */
  output: string;
  /** 元のサイズ（バイト） */
  originalSize: number;
  /** 最適化後のサイズ（バイト） */
  optimizedSize: number;
  /** 削減率（パーセント） */
  reductionPercent: number;
}

/**
 * デフォルトの最適化オプション
 * @returns デフォルトオプション
 */
export function getDefaultOptions(): SvgOptimizerOptions {
  return {
    removeMetadata: true,
    removeUnusedAttrs: true,
    precision: 2,
    prettify: false,
    removeXmlDeclaration: true,
    removeEmptyGroups: true,
  };
}

/**
 * XML宣言を削除する
 * @param svg - SVG文字列
 * @returns XML宣言を除去したSVG文字列
 */
function removeXmlDeclaration(svg: string): string {
  return svg.replace(/<\?xml[^?]*\?>\s*/gi, "");
}

/**
 * HTMLコメントを削除する
 * @param svg - SVG文字列
 * @returns コメントを除去したSVG文字列
 */
function removeComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * DOCTYPE宣言を削除する
 * @param svg - SVG文字列
 * @returns DOCTYPE宣言を除去したSVG文字列
 */
function removeDoctype(svg: string): string {
  return svg.replace(/<!DOCTYPE[^>]*>/gi, "");
}

/**
 * メタデータ要素を削除する
 * @param svg - SVG文字列
 * @returns メタデータを除去したSVG文字列
 */
function removeMetadataElements(svg: string): string {
  // <metadata>...</metadata> を削除
  let result = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  // エディタ固有の名前空間属性を削除（xmlns:inkscape, xmlns:sodipodi等）
  result = result.replace(
    /\s+xmlns:(inkscape|sodipodi|dc|cc|rdf|sketch|illustrator)="[^"]*"/gi,
    ""
  );
  // inkscape/sodipodi固有の属性を削除
  result = result.replace(
    /\s+(inkscape|sodipodi|sketch|illustrator):[a-z-]+="[^"]*"/gi,
    ""
  );
  // <sodipodi:...>...</sodipodi:...> を削除
  result = result.replace(/<sodipodi:[^>]*\/>/gi, "");
  result = result.replace(/<sodipodi:[^>]*>[\s\S]*?<\/sodipodi:[^>]*>/gi, "");
  // <dc:...>, <cc:...>, <rdf:...> 要素を削除
  result = result.replace(/<(dc|cc|rdf):[^>]*\/>/gi, "");
  result = result.replace(
    /<(dc|cc|rdf):[^>]*>[\s\S]*?<\/(dc|cc|rdf):[^>]*>/gi,
    ""
  );
  return result;
}

/**
 * デフォルト値の属性を削除する
 * @param svg - SVG文字列
 * @returns デフォルト値属性を除去したSVG文字列
 */
function removeDefaultAttrs(svg: string): string {
  let result = svg;
  // fill="none" は意味があるので残す
  // デフォルト値を持つ一般的な属性を削除
  result = result.replace(/\s+stroke-miterlimit="4"/g, "");
  result = result.replace(/\s+stroke-dashoffset="0"/g, "");
  result = result.replace(/\s+fill-rule="nonzero"/g, "");
  result = result.replace(/\s+clip-rule="nonzero"/g, "");
  result = result.replace(/\s+font-style="normal"/g, "");
  result = result.replace(/\s+font-variant="normal"/g, "");
  result = result.replace(/\s+font-weight="normal"/g, "");
  result = result.replace(/\s+font-stretch="normal"/g, "");
  result = result.replace(/\s+text-decoration="none"/g, "");
  result = result.replace(/\s+display="inline"/g, "");
  result = result.replace(/\s+overflow="visible"/g, "");
  result = result.replace(/\s+visibility="visible"/g, "");
  result = result.replace(/\s+opacity="1"/g, "");
  result = result.replace(/\s+stroke-opacity="1"/g, "");
  result = result.replace(/\s+fill-opacity="1"/g, "");
  result = result.replace(/\s+enable-background="[^"]*"/g, "");
  return result;
}

/**
 * 空のグループ要素を削除する
 * @param svg - SVG文字列
 * @returns 空グループを除去したSVG文字列
 */
function removeEmptyGroupElements(svg: string): string {
  let result = svg;
  // 繰り返し処理（ネストされた空グループ対応）
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/<g[^>]*>\s*<\/g>/gi, "");
  }
  return result;
}

/**
 * 数値の精度を調整する
 * @param svg - SVG文字列
 * @param precision - 小数点以下の桁数
 * @returns 精度調整済みのSVG文字列
 */
function adjustPrecision(svg: string, precision: number): string {
  // path の d 属性内の数値精度を調整
  return svg.replace(
    /\b(\d+\.\d{3,})\b/g,
    (match) => {
      const num = parseFloat(match);
      if (isNaN(num)) return match;
      return num.toFixed(precision).replace(/\.?0+$/, "") || "0";
    }
  );
}

/**
 * 連続する空白を圧縮する
 * @param svg - SVG文字列
 * @returns 空白圧縮済みのSVG文字列
 */
function collapseWhitespace(svg: string): string {
  // タグ間の空白を圧縮
  let result = svg.replace(/>\s+</g, "><");
  // 属性間の連続空白を1つに
  result = result.replace(/\s{2,}/g, " ");
  return result.trim();
}

/**
 * SVGを整形する（インデント付き）
 * @param svg - SVG文字列
 * @returns 整形済みのSVG文字列
 */
function prettifySvg(svg: string): string {
  // まず空白を圧縮
  let compressed = svg.replace(/>\s+</g, "><").trim();

  let formatted = "";
  let indent = 0;
  const indentStr = "  ";

  // タグごとに分割
  const tokens = compressed.split(/(<[^>]+>)/);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("</")) {
      // 閉じタグ
      indent = Math.max(0, indent - 1);
      formatted += indentStr.repeat(indent) + trimmed + "\n";
    } else if (trimmed.startsWith("<") && trimmed.endsWith("/>")) {
      // 自己完結タグ
      formatted += indentStr.repeat(indent) + trimmed + "\n";
    } else if (trimmed.startsWith("<")) {
      // 開始タグ
      formatted += indentStr.repeat(indent) + trimmed + "\n";
      indent++;
    } else {
      // テキストコンテンツ
      formatted += indentStr.repeat(indent) + trimmed + "\n";
    }
  }

  return formatted.trimEnd();
}

/**
 * 入力がSVGかどうかを簡易検証する
 * @param input - 入力文字列
 * @returns SVGとして妥当かどうか
 */
function validateSvg(input: string): boolean {
  const trimmed = input.trim();
  return /<svg[\s>]/i.test(trimmed) && /<\/svg>/i.test(trimmed);
}

/**
 * SVGコードを最適化する
 * @param svgInput - 最適化対象のSVG文字列
 * @param options - 最適化オプション
 * @returns 最適化結果
 * @throws {Error} 入力が空またはSVGでない場合にエラーをスローする
 */
export function optimizeSvg(
  svgInput: string,
  options: SvgOptimizerOptions
): SvgOptimizeResult {
  if (!svgInput.trim()) {
    throw new Error("SVGコードを入力してください");
  }

  if (!validateSvg(svgInput)) {
    throw new Error("有効なSVGコードではありません");
  }

  const originalSize = new TextEncoder().encode(svgInput).length;

  let result = svgInput;

  // XML宣言の削除
  if (options.removeXmlDeclaration) {
    result = removeXmlDeclaration(result);
  }

  // DOCTYPE削除
  result = removeDoctype(result);

  // コメント・メタデータ削除
  if (options.removeMetadata) {
    result = removeComments(result);
    result = removeMetadataElements(result);
  }

  // デフォルト属性削除
  if (options.removeUnusedAttrs) {
    result = removeDefaultAttrs(result);
  }

  // 空グループ削除
  if (options.removeEmptyGroups) {
    result = removeEmptyGroupElements(result);
  }

  // 数値精度の調整
  result = adjustPrecision(result, options.precision);

  // 整形 or 圧縮
  if (options.prettify) {
    result = prettifySvg(result);
  } else {
    result = collapseWhitespace(result);
  }

  const optimizedSize = new TextEncoder().encode(result).length;
  const reductionPercent =
    originalSize > 0
      ? Math.round(((originalSize - optimizedSize) / originalSize) * 10000) /
        100
      : 0;

  return {
    output: result,
    originalSize,
    optimizedSize,
    reductionPercent,
  };
}

/**
 * サンプルSVGコードを返す
 * @returns サンプルSVGコード
 */
export function getSampleSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" width="200" height="200" viewBox="0 0 200 200" fill-rule="nonzero" stroke-opacity="1" fill-opacity="1">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <cc:Work xmlns:cc="http://creativecommons.org/ns#">
        <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Sample Icon</dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <g inkscape:label="Layer 1" inkscape:groupmode="layer">
    <circle cx="100.0000" cy="100.0000" r="80.5000" fill="#4A90D9" opacity="1" />
    <rect x="60.12345" y="60.98765" width="80.00000" height="80.00000" rx="10.0000" fill="#FFFFFF" display="inline" visibility="visible" />
    <g>
    </g>
    <path d="M 85.123456 75.987654 L 115.123456 100.987654 L 85.123456 125.987654 Z" fill="#4A90D9" stroke-miterlimit="4" />
  </g>
</svg>`;
}

/**
 * バイト数を人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマット済み文字列
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
