/**
 * HTML → Markdown 変換ユーティリティ
 * HTMLマークアップをMarkdown形式に変換する（外部ライブラリ不要・Cloudflare Workers対応）
 */

/** コードブロックの一時的なプレースホルダー */
interface CodeBlock {
  placeholder: string;
  content: string;
  lang: string;
  isBlock: boolean;
}

/**
 * HTMLエンティティをデコードする
 * @param text - デコードするテキスト
 * @returns デコード後のテキスト
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16))
    );
}

/**
 * タグからテキストコンテンツを取得（再帰的にネストされたタグを除去）
 * @param html - 処理するHTML
 * @returns テキストコンテンツ
 */
function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ''));
}

/**
 * インライン要素（strong/em/code/a/img等）をMarkdownに変換する
 * @param html - 変換するHTML文字列
 * @returns Markdown形式の文字列
 */
export function convertInline(html: string): string {
  let result = html;

  // <del>, <s>, <strike> → ~~text~~
  result = result.replace(/<(?:del|s|strike)>([\s\S]*?)<\/(?:del|s|strike)>/gi, (_, content: string) => {
    return `~~${convertInline(content)}~~`;
  });

  // <strong>, <b> → **text**
  result = result.replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, (_, content: string) => {
    return `**${convertInline(content)}**`;
  });

  // <em>, <i> → *text*
  result = result.replace(/<(?:em|i)>([\s\S]*?)<\/(?:em|i)>/gi, (_, content: string) => {
    return `*${convertInline(content)}*`;
  });

  // インラインコード <code> → `text`
  result = result.replace(/<code>([\s\S]*?)<\/code>/gi, (_, content: string) => {
    const text = decodeHtmlEntities(content.replace(/<[^>]+>/g, ''));
    return `\`${text}\``;
  });

  // <a href="..."> → [text](url)
  result = result.replace(
    /<a\s[^>]*?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match: string, href: string, content: string) => {
      const linkText = stripTags(content).trim() || href;
      return `[${linkText}](${href})`;
    }
  );

  // <img src="..." alt="..."> → ![alt](src)
  result = result.replace(
    /<img\s[^>]*?src=["']([^"']*)["'][^>]*\/?>/gi,
    (match: string, src: string) => {
      const altMatch = /alt=["']([^"']*)["']/.exec(match);
      const alt = altMatch ? altMatch[1] : '';
      return `![${alt}](${src})`;
    }
  );

  // <br>, <br/>, <br /> → スペース2つ + 改行
  result = result.replace(/<br\s*\/?>/gi, '  \n');

  // 残りのHTMLタグを除去してエンティティをデコード
  result = decodeHtmlEntities(result.replace(/<[^>]+>/g, ''));

  return result;
}

/**
 * テーブルをMarkdown形式に変換する
 * @param tableHtml - テーブルのHTML
 * @returns Markdown形式のテーブル
 */
function convertTable(tableHtml: string): string {
  const rows: string[][] = [];
  let hasHeader = false;

  // theadの行をヘッダーとして抽出
  const theadMatch = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(tableHtml);
  if (theadMatch) {
    hasHeader = true;
    const headerHtml = theadMatch[1];
    const rowMatch = /<tr[^>]*>([\s\S]*?)<\/tr>/i.exec(headerHtml);
    if (rowMatch) {
      const cells = [...rowMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)];
      rows.push(cells.map((c) => convertInline(c[1]).trim().replace(/\n/g, ' ')));
    }
  }

  // tbody（またはtheadなしの場合はtable全体）から行を抽出
  const tbodySource = tableHtml.replace(/<thead[^>]*>[\s\S]*?<\/thead>/gi, '');
  const trMatches = [...tbodySource.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  for (const trMatch of trMatches) {
    const cells = [...trMatch[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)];
    if (cells.length > 0) {
      rows.push(cells.map((c) => convertInline(c[1]).trim().replace(/\n/g, ' ')));
    }
  }

  if (rows.length === 0) return '';

  const colCount = Math.max(...rows.map((r) => r.length));

  // 列数を揃える
  const normalizedRows = rows.map((row) => {
    while (row.length < colCount) row.push('');
    return row;
  });

  const lines: string[] = [];

  if (hasHeader && normalizedRows.length > 0) {
    lines.push('| ' + normalizedRows[0].join(' | ') + ' |');
    lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
    for (let i = 1; i < normalizedRows.length; i++) {
      lines.push('| ' + normalizedRows[i].join(' | ') + ' |');
    }
  } else {
    // ヘッダーなしの場合は最初の行をヘッダー扱い
    if (normalizedRows.length > 0) {
      lines.push('| ' + normalizedRows[0].join(' | ') + ' |');
      lines.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
      for (let i = 1; i < normalizedRows.length; i++) {
        lines.push('| ' + normalizedRows[i].join(' | ') + ' |');
      }
    }
  }

  return lines.join('\n');
}

/**
 * リスト（ul/ol）をMarkdown形式に変換する
 * @param listHtml - リストのHTML
 * @param ordered - 番号付きリストかどうか
 * @param depth - ネスト深さ
 * @returns Markdown形式のリスト
 */
function convertList(listHtml: string, ordered: boolean, depth = 0): string {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  let counter = 1;

  // <li>アイテムを1つずつ抽出
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(listHtml)) !== null) {
    let content = liMatch[1];

    // ネストされたリストを先に処理
    const nestedUl = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(content);
    const nestedOl = /<ol[^>]*>([\s\S]*?)<\/ol>/i.exec(content);

    let nestedMarkdown = '';
    if (nestedUl) {
      nestedMarkdown = convertList(nestedUl[0], false, depth + 1);
      content = content.replace(nestedUl[0], '\n__NESTED__');
    } else if (nestedOl) {
      nestedMarkdown = convertList(nestedOl[0], true, depth + 1);
      content = content.replace(nestedOl[0], '\n__NESTED__');
    }

    const itemText = convertInline(content.replace(/<[^>]+>/g, '')).trim();
    const prefix = ordered ? `${indent}${counter}.` : `${indent}-`;

    if (nestedMarkdown) {
      const parts = itemText.split('__NESTED__');
      lines.push(`${prefix} ${parts[0].trim()}`);
      lines.push(nestedMarkdown);
    } else {
      lines.push(`${prefix} ${itemText}`);
    }

    counter++;
  }

  return lines.join('\n');
}

/**
 * blockquoteをMarkdown形式に変換する
 * @param quoteHtml - blockquoteのHTML内容
 * @returns Markdown形式のblockquote
 */
function convertBlockquote(quoteHtml: string): string {
  // 内部のHTMLを再帰変換
  const inner = convertHtmlToMarkdown(quoteHtml);
  return inner
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

/**
 * HTML文字列をMarkdown形式に変換する
 * @param html - 変換するHTML文字列
 * @returns Markdown形式の文字列
 */
export function convertHtmlToMarkdown(html: string): string {
  if (!html.trim()) return '';

  // コメントを除去
  let result = html.replace(/<!--[\s\S]*?-->/g, '');

  // コードブロックを一時保存（内部が変換されないよう保護）
  const codeBlocks: CodeBlock[] = [];

  const saveCodeBlock = (content: string, lang: string, isBlock: boolean): string => {
    const id = codeBlocks.length;
    const placeholder = `__CODEBLOCK_${id}__`;
    codeBlocks.push({ placeholder, content, lang, isBlock });
    return placeholder;
  };

  // <pre><code> ブロックを保護
  result = result.replace(
    /<pre[^>]*>\s*<code(?:\s+class=["'][^"']*["'])?>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_match: string, content: string) => {
      const langMatch = /class=["'][^"']*language-(\w+)[^"']*["']/.exec(_match);
      const lang = langMatch ? langMatch[1] : '';
      const text = decodeHtmlEntities(content.replace(/<[^>]+>/g, ''));
      return saveCodeBlock(text, lang, true);
    }
  );

  // <pre> のみのブロック
  result = result.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_match: string, content: string) => {
    const text = decodeHtmlEntities(content.replace(/<[^>]+>/g, ''));
    return saveCodeBlock(text, '', true);
  });

  // テーブルを変換
  result = result.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match: string) => {
    return '\n\n' + convertTable(_match) + '\n\n';
  });

  // blockquote
  result = result.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_match: string, content: string) => {
    return '\n\n' + convertBlockquote(content.trim()) + '\n\n';
  });

  // 見出し h1-h6
  result = result.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match: string, level: string, content: string) => {
    const text = convertInline(content).trim();
    return '\n\n' + '#'.repeat(Number(level)) + ' ' + text + '\n\n';
  });

  // 番号付きリスト
  result = result.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_match: string) => {
    return '\n\n' + convertList(_match, true) + '\n\n';
  });

  // 番号なしリスト
  result = result.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_match: string) => {
    return '\n\n' + convertList(_match, false) + '\n\n';
  });

  // 水平線 <hr>
  result = result.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  // 段落 <p>
  result = result.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_match: string, content: string) => {
    const text = convertInline(content).trim();
    return text ? '\n\n' + text + '\n\n' : '';
  });

  // div/section/article/header/footer/main/aside/nav → 改行で区切る
  result = result.replace(/<\/(?:div|section|article|header|footer|main|aside|nav)>/gi, '\n\n');
  result = result.replace(/<(?:div|section|article|header|footer|main|aside|nav)[^>]*>/gi, '');

  // インライン要素の変換
  result = convertInline(result);

  // コードブロックを復元
  for (const block of codeBlocks) {
    if (block.isBlock) {
      const fenced = block.lang
        ? `\`\`\`${block.lang}\n${block.content}\n\`\`\``
        : `\`\`\`\n${block.content}\n\`\`\``;
      result = result.replace(block.placeholder, '\n\n' + fenced + '\n\n');
    } else {
      result = result.replace(block.placeholder, `\`${block.content}\``);
    }
  }

  // 余分な空行を整理（3行以上の連続空行を2行に）
  result = result.replace(/\n{3,}/g, '\n\n');

  // 先頭・末尾の余分な空白を除去
  return result.trim();
}
