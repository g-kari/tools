/**
 * CSSフォーマットオプション
 */
export interface CssFormatOptions {
  /** インデント幅（デフォルト: 2） */
  indent?: 2 | 4;
  /** プロパティをアルファベット順にソート（デフォルト: false） */
  sortProperties?: boolean;
}

/**
 * CSSを整形する。
 * セレクター・プロパティ・値を適切なインデントで整形し、
 * ネストしたルール（@media等）にも対応する。
 * @param css - 整形対象のCSS文字列
 * @param options - フォーマットオプション
 * @returns 整形されたCSS文字列
 * @throws {Error} CSS文字列が空または不正な場合
 */
export function formatCss(css: string, options: CssFormatOptions = {}): string {
  if (!css.trim()) {
    throw new Error("CSSデータが空です");
  }

  const validation = validateCss(css);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const indentSize = options.indent ?? 2;
  const indentStr = " ".repeat(indentSize);

  const lines: string[] = [];
  let depth = 0;
  let i = 0;
  const len = css.length;
  let buffer = "";
  let inString = false;
  let stringChar = "";

  const pushLine = (content: string) => {
    const trimmed = content.trim();
    if (trimmed) {
      lines.push(indentStr.repeat(depth) + trimmed);
    }
  };

  const flushBuffer = () => {
    const trimmed = buffer.trim();
    if (trimmed) {
      pushLine(trimmed);
    }
    buffer = "";
  };

  while (i < len) {
    const ch = css[i];

    // 文字列リテラル内
    if (inString) {
      buffer += ch;
      if (ch === stringChar && css[i - 1] !== "\\") {
        inString = false;
      }
      i++;
      continue;
    }

    // 文字列リテラル開始
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      buffer += ch;
      i++;
      continue;
    }

    // コメント
    if (ch === "/" && i + 1 < len && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end === -1) {
        throw new Error("コメントが閉じられていません");
      }
      flushBuffer();
      const comment = css.slice(i, end + 2).trim();
      // 複数行コメントの行頭にインデントを追加
      const indentedComment = comment
        .split("\n")
        .map((line, idx) =>
          idx === 0
            ? indentStr.repeat(depth) + line.trim()
            : indentStr.repeat(depth) + " " + line.trim(),
        )
        .join("\n");
      lines.push(indentedComment);
      i = end + 2;
      // コメント後の空白をスキップ
      while (i < len && (css[i] === " " || css[i] === "\t" || css[i] === "\n" || css[i] === "\r")) {
        i++;
      }
      continue;
    }

    // 開き波括弧
    if (ch === "{") {
      const selector = buffer.trim();
      buffer = "";
      lines.push(indentStr.repeat(depth) + selector + " {");
      depth++;
      i++;
      // 直後の空白をスキップ
      while (i < len && (css[i] === " " || css[i] === "\t" || css[i] === "\n" || css[i] === "\r")) {
        i++;
      }
      continue;
    }

    // 閉じ波括弧
    if (ch === "}") {
      // バッファに残っているデータを出力（通常はないが念のため）
      const remaining = buffer.trim();
      if (remaining) {
        pushLine(remaining);
      }
      buffer = "";
      depth = Math.max(0, depth - 1);

      // プロパティソートが有効な場合、直前のブロック内の宣言をソート
      if (options.sortProperties) {
        sortPropertiesInLastBlock(lines, depth, indentStr);
      }

      lines.push(indentStr.repeat(depth) + "}");
      // トップレベルのルール間に空行を挿入
      if (depth === 0) {
        lines.push("");
      }
      i++;
      // 直後の空白をスキップ
      while (i < len && (css[i] === " " || css[i] === "\t" || css[i] === "\n" || css[i] === "\r")) {
        i++;
      }
      continue;
    }

    // セミコロン（宣言の終わり）
    if (ch === ";") {
      const decl = buffer.trim();
      buffer = "";
      if (decl) {
        // 宣言を正規化（プロパティ: 値 の形式に）
        pushLine(normalizeDeclaration(decl) + ";");
      }
      i++;
      // 直後の空白をスキップ
      while (i < len && (css[i] === " " || css[i] === "\t" || css[i] === "\n" || css[i] === "\r")) {
        i++;
      }
      continue;
    }

    // 改行・タブ -> 単一スペースに正規化
    if (ch === "\n" || ch === "\r" || ch === "\t") {
      if (buffer.length > 0 && !buffer.endsWith(" ")) {
        buffer += " ";
      }
      i++;
      while (i < len && (css[i] === " " || css[i] === "\t" || css[i] === "\n" || css[i] === "\r")) {
        i++;
      }
      continue;
    }

    // 連続スペースの正規化
    if (ch === " ") {
      if (buffer.length > 0 && !buffer.endsWith(" ")) {
        buffer += " ";
      }
      i++;
      continue;
    }

    buffer += ch;
    i++;
  }

  // バッファに残っているデータを出力（@import等のセミコロンなし宣言）
  const remaining = buffer.trim();
  if (remaining) {
    lines.push(remaining);
  }

  // 末尾の空行を除去して結合
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  return lines.join("\n");
}

/**
 * 直前のブロック内の宣言をアルファベット順にソートする（内部関数）。
 * @param lines - 現在のライン配列（破壊的変更）
 * @param depth - 現在の深さ
 * @param indentStr - インデント文字列
 */
function sortPropertiesInLastBlock(lines: string[], depth: number, indentStr: string): void {
  const blockIndent = indentStr.repeat(depth + 1);
  const closingBrace = indentStr.repeat(depth) + "}";
  // ブロック開始位置を探す
  let blockStart = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].endsWith("{")) {
      blockStart = i + 1;
      break;
    }
    if (lines[i] === closingBrace) {
      break;
    }
  }
  if (blockStart === -1) return;

  // ブロック内の宣言行を抽出してソート
  const blockLines = lines.slice(blockStart);
  const declarations = blockLines.filter(
    (line) => line.startsWith(blockIndent) && line.trimEnd().endsWith(";"),
  );
  const nonDeclarations = blockLines.filter(
    (line) => !line.startsWith(blockIndent) || !line.trimEnd().endsWith(";"),
  );

  if (declarations.length === 0) return;

  declarations.sort((a, b) => a.trim().localeCompare(b.trim()));

  // ソートした結果をlinesに戻す（宣言のみ置き換え）
  let declIdx = 0;
  for (let i = blockStart; i < lines.length; i++) {
    if (lines[i].startsWith(blockIndent) && lines[i].trimEnd().endsWith(";")) {
      lines[i] = declarations[declIdx++];
    }
  }

  void nonDeclarations; // 未使用警告抑制
}

/**
 * CSS宣言（property: value）のコロン周りの空白を正規化する（内部関数）。
 * @param decl - 正規化対象の宣言文字列（セミコロンなし）
 * @returns 正規化された宣言文字列
 */
function normalizeDeclaration(decl: string): string {
  // コロンを含まない（セレクター等）はそのまま返す
  const colonIdx = decl.indexOf(":");
  if (colonIdx === -1) return decl;

  // data URIやurl()の中のコロンは対象外（セミコロンで終わる行のみ対象）
  const property = decl.slice(0, colonIdx).trim();
  const value = decl.slice(colonIdx + 1).trim();

  // プロパティが空（:root等のセレクター）はそのまま返す
  if (!property) return decl;

  return `${property}: ${value}`;
}

/**
 * CSSを圧縮（Minify）する。
 * コメント・余分な空白を除去してファイルサイズを削減する。
 * @param css - 圧縮対象のCSS文字列
 * @returns 圧縮されたCSS文字列
 * @throws {Error} CSS文字列が空の場合
 */
export function minifyCss(css: string): string {
  if (!css.trim()) {
    throw new Error("CSSデータが空です");
  }

  let result = css;

  // コメントを除去
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // 文字列リテラルを保護しながら圧縮
  // まず文字列リテラルをプレースホルダーで置換
  const strings: string[] = [];
  result = result.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1/g, (match) => {
    strings.push(match);
    return `__STRING_${strings.length - 1}__`;
  });

  // 空白の正規化
  result = result
    .replace(/\s+/g, " ") // 複数空白をひとつに
    .replace(/\s*\{\s*/g, "{") // { 周りの空白を除去
    .replace(/\s*\}\s*/g, "}") // } 周りの空白を除去
    .replace(/\s*;\s*/g, ";") // ; 周りの空白を除去
    .replace(/\s*,\s*/g, ",") // , 周りの空白を除去
    .replace(/\s*:\s*/g, ":") // : 周りの空白を除去
    .trim();

  // プレースホルダーを元の文字列に戻す
  result = result.replace(/__STRING_(\d+)__/g, (_, idx) => strings[parseInt(idx, 10)]);

  return result;
}

/**
 * CSS文字列の構文を検証する。
 * 波括弧のバランス・コメントの終端・文字列リテラルの終端を検証する。
 * @param css - 検証対象のCSS文字列
 * @returns 検証結果オブジェクト。validがtrueなら有効、falseならerrorにエラーメッセージを含む
 */
export function validateCss(css: string): { valid: boolean; error?: string } {
  if (!css.trim()) {
    return { valid: false, error: "CSSデータが空です" };
  }

  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inComment = false;
  const len = css.length;

  for (let i = 0; i < len; i++) {
    const ch = css[i];

    if (inComment) {
      if (ch === "*" && i + 1 < len && css[i + 1] === "/") {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (ch === stringChar && css[i - 1] !== "\\") {
        inString = false;
      }
      continue;
    }

    if (ch === "/" && i + 1 < len && css[i + 1] === "*") {
      inComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;
      if (depth < 0) {
        return { valid: false, error: '予期しない "}" が見つかりました' };
      }
      continue;
    }
  }

  if (inComment) {
    return { valid: false, error: 'コメントが閉じられていません（"*/" がありません）' };
  }
  if (inString) {
    return { valid: false, error: `文字列が閉じられていません（"${stringChar}" がありません）` };
  }
  if (depth !== 0) {
    return {
      valid: false,
      error: `波括弧の対応が取れていません（${depth}個の "{" が閉じられていません）`,
    };
  }

  return { valid: true };
}
