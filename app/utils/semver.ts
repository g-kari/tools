/**
 * セマンティックバージョン (Semver) パース・比較ユーティリティ
 * semver.org v2.0.0 仕様準拠
 */

/**
 * Semver 正規表現（semver.org 公式推奨）
 */
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * パース済み Semver バージョン
 */
export interface SemverParsed {
  /** メジャーバージョン */
  major: number;
  /** マイナーバージョン */
  minor: number;
  /** パッチバージョン */
  patch: number;
  /** プレリリース識別子（例: alpha.1） */
  prerelease: string | null;
  /** ビルドメタデータ（例: 20240101） */
  buildMetadata: string | null;
  /** 元の入力文字列 */
  raw: string;
  /** 有効な Semver かどうか */
  valid: boolean;
}

/**
 * バージョン比較の結果
 */
export type CompareResult = -1 | 0 | 1;

/**
 * バージョン範囲チェックの結果
 */
export interface RangeCheckResult {
  /** バージョンが範囲を満たすか（null = 入力エラー） */
  satisfied: boolean | null;
  /** エラーメッセージ */
  error?: string;
}

/**
 * Semver 文字列をパースする
 * 先頭の 'v' または 'V' プレフィックスは無視する
 * @param version バージョン文字列
 * @returns パース済み Semver オブジェクト
 */
export function parseSemver(version: string): SemverParsed {
  const trimmed = version.trim().replace(/^[vV]/, "");
  const match = SEMVER_REGEX.exec(trimmed);

  if (!match) {
    return {
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: null,
      buildMetadata: null,
      raw: version,
      valid: false,
    };
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ?? null,
    buildMetadata: match[5] ?? null,
    raw: version,
    valid: true,
  };
}

/**
 * 2つのプレリリース文字列を比較する（semver spec §11）
 * @param a プレリリース文字列
 * @param b プレリリース文字列
 * @returns -1/0/1
 */
function comparePrerelease(a: string, b: string): CompareResult {
  const aParts = a.split(".");
  const bParts = b.split(".");
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    if (i >= aParts.length) return -1;
    if (i >= bParts.length) return 1;

    const aIsNum = /^\d+$/.test(aParts[i]);
    const bIsNum = /^\d+$/.test(bParts[i]);

    if (aIsNum && bIsNum) {
      const diff = parseInt(aParts[i], 10) - parseInt(bParts[i], 10);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    } else if (aIsNum) {
      return -1; // 数値識別子 < 英数字識別子（semver spec）
    } else if (bIsNum) {
      return 1;
    } else {
      const cmp = aParts[i].localeCompare(bParts[i]);
      if (cmp !== 0) return cmp > 0 ? 1 : -1;
    }
  }

  return 0;
}

/**
 * 2つの Semver を比較する
 * ビルドメタデータは無視する（semver spec §10）
 * @param a Semver A
 * @param b Semver B
 * @returns -1（A < B）、0（A == B）、1（A > B）
 */
export function compareSemver(a: SemverParsed, b: SemverParsed): CompareResult {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;

  // プレリリース比較：プレリリースなし > プレリリースあり
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;

  return comparePrerelease(a.prerelease, b.prerelease);
}

/**
 * パッチバージョンをインクリメントした文字列を返す
 * @param v パース済み Semver
 * @returns 次のパッチバージョン文字列
 */
export function incrementPatch(v: SemverParsed): string {
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

/**
 * マイナーバージョンをインクリメントした文字列を返す
 * @param v パース済み Semver
 * @returns 次のマイナーバージョン文字列
 */
export function incrementMinor(v: SemverParsed): string {
  return `${v.major}.${v.minor + 1}.0`;
}

/**
 * メジャーバージョンをインクリメントした文字列を返す
 * @param v パース済み Semver
 * @returns 次のメジャーバージョン文字列
 */
export function incrementMajor(v: SemverParsed): string {
  return `${v.major + 1}.0.0`;
}

/**
 * バージョンが範囲を満たすかチェックする
 * 対応演算子: >=, >, <=, <, =, ^（互換性）, ~（パッチ互換）
 * @param version チェック対象のバージョン
 * @param range 範囲文字列（例: ">=1.0.0", "^2.3.0", "~1.2.3"）
 * @returns チェック結果
 */
export function satisfiesRange(version: SemverParsed, range: string): RangeCheckResult {
  if (!version.valid) {
    return { satisfied: null, error: "バージョンが無効です" };
  }

  const trimmed = range.trim();

  const operators: Array<{ prefix: string; fn: (r: SemverParsed) => boolean }> = [
    { prefix: ">=", fn: (r) => compareSemver(version, r) >= 0 },
    { prefix: ">", fn: (r) => compareSemver(version, r) > 0 },
    { prefix: "<=", fn: (r) => compareSemver(version, r) <= 0 },
    { prefix: "<", fn: (r) => compareSemver(version, r) < 0 },
    { prefix: "=", fn: (r) => compareSemver(version, r) === 0 },
    {
      prefix: "^",
      fn: (r) => {
        // ^ 互換性: 左端の非ゼロ部分が同じで、かつ r 以上
        if (compareSemver(version, r) < 0) return false;
        if (r.major !== 0) return version.major === r.major;
        if (r.minor !== 0) return version.major === r.major && version.minor === r.minor;
        return version.major === r.major && version.minor === r.minor && version.patch === r.patch;
      },
    },
    {
      prefix: "~",
      fn: (r) => {
        // ~ パッチ互換: major.minor が同じで r 以上
        if (compareSemver(version, r) < 0) return false;
        return version.major === r.major && version.minor === r.minor;
      },
    },
  ];

  for (const { prefix, fn } of operators) {
    if (trimmed.startsWith(prefix)) {
      const rest = trimmed.slice(prefix.length).trim();
      const rangeVersion = parseSemver(rest);
      if (!rangeVersion.valid) {
        return { satisfied: null, error: `範囲指定のバージョンが無効です: "${rest}"` };
      }
      return { satisfied: fn(rangeVersion) };
    }
  }

  // 演算子なし → 完全一致
  const rangeVersion = parseSemver(trimmed);
  if (!rangeVersion.valid) {
    return { satisfied: null, error: `範囲指定が無効です: "${range}"` };
  }
  return { satisfied: compareSemver(version, rangeVersion) === 0 };
}

/**
 * 正規化されたバージョン文字列を返す（ビルドメタデータなし）
 * @param v パース済み Semver
 * @returns 正規化されたバージョン文字列
 */
export function formatSemver(v: SemverParsed): string {
  let result = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease) result += `-${v.prerelease}`;
  return result;
}
