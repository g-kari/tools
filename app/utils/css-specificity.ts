/**
 * CSS詳細度計算機のユーティリティ関数
 *
 * CSS詳細度は (a, b, c) の形式で表現される:
 *   a = IDセレクターの数
 *   b = クラス・属性・擬似クラスの数
 *   c = タイプ・擬似要素の数
 *
 * 参考: https://www.w3.org/TR/selectors-4/#specificity-rules
 */

/**
 * CSS詳細度の値
 */
export interface SpecificityValue {
  /** IDセレクターの数 (a) */
  ids: number;
  /** クラス・属性・擬似クラスの数 (b) */
  classes: number;
  /** タイプ・擬似要素の数 (c) */
  types: number;
}

/**
 * 詳細度を比較用の数値に変換する
 * @param spec - 詳細度の値
 * @returns 比較用の数値
 */
export function specificityToNumber(spec: SpecificityValue): number {
  return spec.ids * 10000 + spec.classes * 100 + spec.types;
}

/**
 * 詳細度を "(a, b, c)" 形式の文字列に変換する
 * @param spec - 詳細度の値
 * @returns "(a, b, c)" 形式の文字列
 */
export function specificityToString(spec: SpecificityValue): string {
  return `(${spec.ids}, ${spec.classes}, ${spec.types})`;
}

/**
 * 2つの詳細度を比較する
 * @returns 正の数: a が高い, 0: 同じ, 負の数: b が高い
 */
export function compareSpecificity(
  a: SpecificityValue,
  b: SpecificityValue
): number {
  return specificityToNumber(a) - specificityToNumber(b);
}

/**
 * CSSセレクターの詳細度を計算する
 *
 * 処理規則:
 * - `:where()` は詳細度0
 * - `:is()`, `:not()`, `:has()` は括弧内で最も高い詳細度を使用
 * - ユニバーサルセレクター `*` とコンビネーター は詳細度0
 * - `::before`, `::after` などの擬似要素 → c++
 * - `:hover`, `:focus` などの擬似クラス → b++
 * - `.class`, `[attr]` → b++
 * - `#id` → a++
 * - `div`, `span` などのタイプ → c++
 *
 * @param selector - CSSセレクター文字列（単一セレクター）
 * @returns 詳細度の値
 */
export function calculateSpecificity(selector: string): SpecificityValue {
  let ids = 0;
  let classes = 0;
  let types = 0;

  let s = selector.trim();

  // コメントを除去
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");

  // :where() の除去（詳細度0）
  // ネストした括弧には非対応だが一般的なケースをカバー
  s = s.replace(/:where\s*\([^()]*(?:\([^()]*\)[^()]*)*\)/gi, "");

  // :is(), :not(), :has() の処理
  // 括弧内の最も高い詳細度のセレクターを使用する
  s = s.replace(
    /:(?:is|not|has)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi,
    (_, inner: string) => {
      const parts = inner.split(",");
      let maxIds = 0;
      let maxClasses = 0;
      let maxTypes = 0;
      let maxTotal = -1;

      for (const part of parts) {
        const spec = calculateSpecificity(part.trim());
        const total = specificityToNumber(spec);
        if (total > maxTotal) {
          maxTotal = total;
          maxIds = spec.ids;
          maxClasses = spec.classes;
          maxTypes = spec.types;
        }
      }

      ids += maxIds;
      classes += maxClasses;
      types += maxTypes;
      return "";
    }
  );

  // IDセレクターのカウント (#id)
  const idMatches = s.match(/#[-\w]+/g) ?? [];
  ids += idMatches.length;
  s = s.replace(/#[-\w]+/g, "");

  // 属性セレクターのカウント ([attr], [attr=val], etc.)
  const attrMatches = s.match(/\[[^\]]*\]/g) ?? [];
  classes += attrMatches.length;
  s = s.replace(/\[[^\]]*\]/g, "");

  // 擬似要素のカウント (:: プレフィックス)
  const doublePseudoMatches = s.match(/::[a-zA-Z][-\w]*/g) ?? [];
  types += doublePseudoMatches.length;
  s = s.replace(/::[a-zA-Z][-\w]*/g, "");

  // レガシー擬似要素のカウント (単体 : での before/after/first-line/first-letter)
  const legacyPseudoElements = [
    "before",
    "after",
    "first-line",
    "first-letter",
  ];
  const legacyPseudoRegex = new RegExp(
    `:(?:${legacyPseudoElements.join("|")})(?![\\w-])`,
    "gi"
  );
  const legacyMatches = s.match(legacyPseudoRegex) ?? [];
  types += legacyMatches.length;
  s = s.replace(legacyPseudoRegex, "");

  // 関数型擬似クラスのカウント (:nth-child(n), :lang(ja), etc.)
  const funcPseudoMatches = s.match(/:[a-zA-Z][-\w]*\([^)]*\)/g) ?? [];
  classes += funcPseudoMatches.length;
  s = s.replace(/:[a-zA-Z][-\w]*\([^)]*\)/g, "");

  // 単純擬似クラスのカウント (:hover, :focus, :first-child, etc.)
  const simplePseudoMatches = s.match(/:[a-zA-Z][-\w]*/g) ?? [];
  classes += simplePseudoMatches.length;
  s = s.replace(/:[a-zA-Z][-\w]*/g, "");

  // クラスセレクターのカウント (.class)
  const classMatches = s.match(/\.[-\w]+/g) ?? [];
  classes += classMatches.length;
  s = s.replace(/\.[-\w]+/g, "");

  // コンビネーターとユニバーサルセレクターを空白に置換
  s = s.replace(/[*>+~|]/g, " ");

  // タイプセレクターのカウント（残ったアルファベットのトークン）
  const typeTokens = s
    .split(/[\s,]+/)
    .filter((t) => /^[a-zA-Z][-\w]*$/.test(t));
  types += typeTokens.length;

  return { ids, classes, types };
}

/**
 * 詳細度の入力エントリ
 */
export interface SpecificityEntry {
  /** セレクター文字列 */
  selector: string;
  /** 計算された詳細度 */
  specificity: SpecificityValue;
  /** エラーメッセージ（パースに失敗した場合） */
  error?: string;
}

/**
 * セレクターを解析して SpecificityEntry を返す
 * @param selector - CSSセレクター文字列
 * @returns SpecificityEntry
 */
export function parseSpecificityEntry(selector: string): SpecificityEntry {
  const trimmed = selector.trim();
  if (!trimmed) {
    return {
      selector: trimmed,
      specificity: { ids: 0, classes: 0, types: 0 },
      error: "セレクターが空です",
    };
  }
  try {
    const specificity = calculateSpecificity(trimmed);
    return { selector: trimmed, specificity };
  } catch {
    return {
      selector: trimmed,
      specificity: { ids: 0, classes: 0, types: 0 },
      error: "解析に失敗しました",
    };
  }
}

/**
 * よく使われるCSSセレクターのサンプル
 */
export interface SpecicitySample {
  /** セレクター */
  selector: string;
  /** 説明 */
  description: string;
}

export const SPECIFICITY_SAMPLES: SpecicitySample[] = [
  { selector: "*", description: "ユニバーサルセレクター" },
  { selector: "div", description: "タイプセレクター" },
  { selector: "ul li", description: "子孫セレクター" },
  { selector: ".class", description: "クラスセレクター" },
  { selector: "#id", description: "IDセレクター" },
  { selector: "a:hover", description: "擬似クラス付き" },
  { selector: "::before", description: "擬似要素" },
  { selector: "[type=\"text\"]", description: "属性セレクター" },
  { selector: ".nav > li.active", description: "子セレクター＋複合" },
  { selector: "#header .nav li:first-child", description: "複雑なセレクター" },
  { selector: ":not(.disabled)", description: ":not() 擬似クラス" },
  { selector: ":is(h1, h2, h3)", description: ":is() 擬似クラス" },
  { selector: ":where(.wrapper) p", description: ":where()（詳細度0）" },
];
