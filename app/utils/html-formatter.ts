/**
 * HTML フォーマッター / ビューティファイアー
 *
 * HTML 文字列をインデント付きで整形する。
 * void 要素・インライン要素・pre/script/style の内容保持に対応。
 */

/** フォーマットオプション */
export interface HtmlFormatOptions {
  /** インデント幅（スペース数、useTabs が false の場合） */
  indentSize: 2 | 4;
  /** タブをインデントに使用するか */
  useTabs: boolean;
}

/** フォーマット結果 */
export interface HtmlFormatResult {
  formatted: string;
  elementCount: number;
  tokenCount: number;
}

/** void 要素（子を持てない要素） */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/** インライン要素（改行を挿入しない） */
const INLINE_TAGS = new Set([
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite',
  'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map',
  'object', 'output', 'q', 's', 'samp', 'select', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var',
]);

/** 内容をそのまま保持する要素 */
const RAW_TAGS = new Set(['pre', 'script', 'style', 'textarea']);

type TokenKind = 'doctype' | 'comment' | 'open' | 'close' | 'void' | 'text';

interface HtmlToken {
  kind: TokenKind;
  raw: string;
  tag?: string;
}

/**
 * HTML 文字列をトークンに分割する
 */
function tokenize(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  let pos = 0;
  const len = html.length;

  while (pos < len) {
    // テキストノード
    if (html[pos] !== '<') {
      const end = html.indexOf('<', pos);
      const raw = end === -1 ? html.slice(pos) : html.slice(pos, end);
      const text = raw.trim();
      if (text) tokens.push({ kind: 'text', raw: text });
      pos += raw.length;
      continue;
    }

    // コメント
    if (html.startsWith('<!--', pos)) {
      const end = html.indexOf('-->', pos + 4);
      const raw = end === -1 ? html.slice(pos) : html.slice(pos, end + 3);
      tokens.push({ kind: 'comment', raw });
      pos += raw.length;
      continue;
    }

    // DOCTYPE
    if (html.slice(pos, pos + 9).toLowerCase() === '<!doctype') {
      const end = html.indexOf('>', pos);
      const raw = end === -1 ? html.slice(pos) : html.slice(pos, end + 1);
      tokens.push({ kind: 'doctype', raw });
      pos += raw.length;
      continue;
    }

    // 終了タグ
    if (html[pos + 1] === '/') {
      const end = html.indexOf('>', pos);
      if (end === -1) { pos++; continue; }
      const raw = html.slice(pos, end + 1);
      const tag = raw.slice(2, -1).trim().split(/[\s>]/)[0].toLowerCase();
      tokens.push({ kind: 'close', raw, tag });
      pos += raw.length;
      continue;
    }

    // 開始タグ（属性中の > に注意）
    {
      let end = pos + 1;
      let inStr: string | null = null;
      while (end < len) {
        const ch = html[end];
        if (inStr) {
          if (ch === inStr) inStr = null;
        } else if (ch === '"' || ch === "'") {
          inStr = ch;
        } else if (ch === '>') {
          break;
        }
        end++;
      }
      if (end >= len) { pos++; continue; }
      const raw = html.slice(pos, end + 1);
      const m = raw.slice(1).match(/^([a-z][a-z0-9:-]*)/i);
      if (!m) { tokens.push({ kind: 'text', raw }); pos += raw.length; continue; }
      const tag = m[1].toLowerCase();
      const isSelfClose = raw.endsWith('/>') || VOID_TAGS.has(tag);
      tokens.push({ kind: isSelfClose ? 'void' : 'open', raw, tag });
      pos += raw.length;
    }
  }

  return tokens;
}

/**
 * HTML を整形して返す
 * @param html - 整形対象の HTML 文字列
 * @param options - フォーマットオプション
 * @returns 整形結果
 */
export function formatHTML(
  html: string,
  options: Partial<HtmlFormatOptions> = {},
): HtmlFormatResult {
  const opts: HtmlFormatOptions = { indentSize: 2, useTabs: false, ...options };
  if (!html.trim()) return { formatted: '', elementCount: 0, tokenCount: 0 };

  const unit = opts.useTabs ? '\t' : ' '.repeat(opts.indentSize);
  const tokens = tokenize(html);
  const lines: string[] = [];
  let level = 0;
  let elementCount = 0;
  const stack: string[] = [];

  const ind = () => unit.repeat(Math.max(0, level));
  const inRaw = () => stack.length > 0 && RAW_TAGS.has(stack[stack.length - 1]);

  for (const t of tokens) {
    if (t.kind === 'doctype') {
      lines.push(t.raw);
    } else if (t.kind === 'comment') {
      lines.push(ind() + t.raw);
    } else if (t.kind === 'open') {
      elementCount++;
      const tag = t.tag!;
      const inline = INLINE_TAGS.has(tag);
      if (inRaw()) {
        lines.push(t.raw);
      } else {
        lines.push(ind() + t.raw);
        if (!inline) level++;
      }
      stack.push(tag);
    } else if (t.kind === 'void') {
      elementCount++;
      lines.push(inRaw() ? t.raw : ind() + t.raw);
    } else if (t.kind === 'close') {
      const tag = t.tag!;
      const inline = INLINE_TAGS.has(tag);
      if (inRaw()) {
        lines.push(t.raw);
        if (stack[stack.length - 1] === tag) stack.pop();
      } else {
        if (!inline) level = Math.max(0, level - 1);
        lines.push(ind() + t.raw);
        if (stack[stack.length - 1] === tag) stack.pop();
      }
    } else {
      // text
      lines.push(inRaw() ? t.raw : ind() + t.raw);
    }
  }

  return { formatted: lines.join('\n'), elementCount, tokenCount: tokens.length };
}

/** サンプル HTML（圧縮状態） */
export const HTML_SAMPLE =
  '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>サンプル</title></head><body><h1>Hello, World!</h1><p>これは<strong>サンプル</strong>HTMLドキュメントです。</p><ul><li>項目1</li><li>項目2</li><li>項目3</li></ul></body></html>';
