/** HTML ユーティリティ関数群 */

/**
 * 名前付き HTML エンティティとその対応する文字のマッピング
 * 特殊文字、記号、通貨記号、数学記号などを含む
 */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": "\u00A0",
  "&copy;": "\u00A9",
  "&reg;": "\u00AE",
  "&trade;": "\u2122",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&hellip;": "\u2026",
  "&bull;": "\u2022",
  "&middot;": "\u00B7",
  "&cent;": "\u00A2",
  "&pound;": "\u00A3",
  "&yen;": "\u00A5",
  "&euro;": "\u20AC",
  "&sect;": "\u00A7",
  "&deg;": "\u00B0",
  "&plusmn;": "\u00B1",
  "&times;": "\u00D7",
  "&divide;": "\u00F7",
  "&frac12;": "\u00BD",
  "&frac14;": "\u00BC",
  "&frac34;": "\u00BE",
};

/**
 * すべての名前付きエンティティにマッチするプリコンパイル済み正規表現
 * モジュールロード時に一度だけ生成し、関数呼び出しごとの RegExp 生成コストを排除する
 */
const NAMED_ENTITY_REGEX = new RegExp(
  Object.keys(HTML_ENTITIES)
    .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "gi",
);

/**
 * 小文字化済みエンティティマップ
 * gi フラグによる大文字小文字を問わないマッチングに対応するため小文字キーで参照する
 */
const HTML_ENTITIES_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [k.toLowerCase(), v]),
);

/**
 * 文字列内の HTML エンティティをデコードする
 * 名前付きエンティティ、十進数数値参照、十六進数数値参照をサポートする
 * @param text - デコード対象の文字列
 * @returns デコードされた文字列
 */
export function decodeHtmlEntities(text: string): string {
  // 名前付きエンティティをプリコンパイル済み正規表現で一括置換（ループ内 RegExp 生成を回避）
  let result = text.replace(
    NAMED_ENTITY_REGEX,
    (match) => HTML_ENTITIES_LOWER[match.toLowerCase()] ?? match,
  );

  // レガシー数値エンティティの置換
  result = result
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");

  // 十進数数値参照の置換 (&#123;)
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));

  // 十六進数数値参照の置換 (&#x1A;)
  result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

  return result;
}
