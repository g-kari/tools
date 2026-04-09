/**
 * Glob パターンマッチングユーティリティ
 *
 * サポートする構文:
 * - `*`    : `/` 以外の任意の文字列にマッチ
 * - `**`   : `/` を含む任意の文字列にマッチ（ディレクトリ横断）
 * - `?`    : `/` 以外の任意の1文字にマッチ
 * - `[abc]`: 文字クラス（範囲 `[a-z]` や否定 `[^abc]` も対応）
 * - `{a,b}`: ブレース展開（いずれかにマッチ）
 * - `!`    : 行頭の `!` で否定パターン
 */

/** マッチ結果 */
export interface GlobMatchResult {
  /** テスト対象のパス */
  path: string;
  /** マッチしたかどうか */
  matched: boolean;
  /** マッチしたパターン（否定前） */
  matchedPattern?: string;
  /** 否定パターンによって除外されたか */
  negated: boolean;
}

/**
 * 正規表現の特殊文字をエスケープする
 */
function escapeRegex(str: string): string {
  return str.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

/**
 * ブレース展開を処理し、展開後のパターン配列を返す
 * 例: `{a,b,c}` → `['a', 'b', 'c']`
 * ネストには非対応（シンプルな展開のみ）
 */
export function expandBraces(pattern: string): string[] {
  const braceStart = pattern.indexOf("{");
  if (braceStart === -1) return [pattern];

  const braceEnd = pattern.indexOf("}", braceStart);
  if (braceEnd === -1) return [pattern];

  const prefix = pattern.slice(0, braceStart);
  const suffix = pattern.slice(braceEnd + 1);
  const alts = pattern.slice(braceStart + 1, braceEnd).split(",");

  const results: string[] = [];
  for (const alt of alts) {
    const expanded = expandBraces(prefix + alt + suffix);
    results.push(...expanded);
  }
  return results;
}

/**
 * 単一のglobパターン（ブレースなし）を正規表現に変換する
 */
export function globPatternToRegex(pattern: string): RegExp {
  // 先頭の `./` を除去して正規化
  const normalized = pattern.replace(/^\.\//u, "");

  let source = "";
  let i = 0;

  while (i < normalized.length) {
    const c = normalized[i];

    if (c === "\\" && i + 1 < normalized.length) {
      // エスケープ
      source += escapeRegex(normalized[i + 1]);
      i += 2;
      continue;
    }

    if (c === "*") {
      if (normalized[i + 1] === "*") {
        // `**` はスラッシュを含む任意の文字列
        const prev = normalized[i - 1];
        const next = normalized[i + 2];
        if ((prev === "/" || prev === undefined) && (next === "/" || next === undefined)) {
          // `/**/` や `**/` や `/**` のケース: ゼロ個以上のディレクトリセグメントにマッチ
          if (next === "/") {
            source += "(?:.+/)?";
            i += 3; // `**/` をスキップ
            continue;
          } else {
            source += ".*";
          }
        } else {
          source += ".*";
        }
        i += 2;
      } else {
        // `*` は `/` 以外の任意の文字列
        source += "[^/]*";
        i++;
      }
      continue;
    }

    if (c === "?") {
      source += "[^/]";
      i++;
      continue;
    }

    if (c === "[") {
      // 文字クラス: `[`, `[^`, `[!` をそのまま通す
      const end = normalized.indexOf("]", i + 1);
      if (end === -1) {
        source += "\\[";
      } else {
        let charClass = normalized.slice(i, end + 1);
        // `[!...]` → `[^...]` に変換（globの否定構文）
        if (charClass[1] === "!") {
          charClass = "[^" + charClass.slice(2);
        }
        source += charClass;
        i = end + 1;
        continue;
      }
      i++;
      continue;
    }

    // その他の特殊文字をエスケープ
    source += escapeRegex(c);
    i++;
  }

  return new RegExp(`^${source}$`, "u");
}

/**
 * 単一パスが単一glob パターンにマッチするか判定する
 */
export function matchSinglePattern(pattern: string, path: string): boolean {
  const expanded = expandBraces(pattern);
  return expanded.some((p) => {
    const regex = globPatternToRegex(p);
    // パスの先頭の `./` を除去して比較
    const normalized = path.replace(/^\.\//u, "");
    return regex.test(normalized);
  });
}

/**
 * パターンリストとパスリストを照合する
 *
 * 複数パターンが指定された場合、いずれかにマッチすればマッチと判定する。
 * `!` で始まるパターンは否定パターンとして扱われ、マッチした場合に除外される。
 */
export function matchGlobPatterns(patterns: string[], paths: string[]): GlobMatchResult[] {
  const positivePatterns = patterns.filter((p) => p.trim() && !p.startsWith("!"));
  const negativePatterns = patterns
    .filter((p) => p.trim() && p.startsWith("!"))
    .map((p) => p.slice(1));

  return paths
    .filter((p) => p.trim())
    .map((path) => {
      const trimmedPath = path.trim();

      // 否定パターンにマッチするか確認
      const negatedBy = negativePatterns.find((np) => matchSinglePattern(np, trimmedPath));
      if (negatedBy !== undefined) {
        return { path: trimmedPath, matched: false, negated: true };
      }

      // 肯定パターンにマッチするか確認
      if (positivePatterns.length === 0) {
        return { path: trimmedPath, matched: false, negated: false };
      }

      const matchedPattern = positivePatterns.find((pp) => matchSinglePattern(pp, trimmedPath));
      return {
        path: trimmedPath,
        matched: matchedPattern !== undefined,
        matchedPattern,
        negated: false,
      };
    });
}
