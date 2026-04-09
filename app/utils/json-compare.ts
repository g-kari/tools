/**
 * JSON比較ユーティリティ
 * 2つのJSON値を再帰的に比較し、差分情報を生成する
 */

/** 差分の種類 */
export type DiffType = "unchanged" | "added" | "removed" | "changed";

/** 差分ノード */
export interface DiffNode {
  /** キーパス (例: "user.address.city") */
  path: string;
  /** 差分の種類 */
  type: DiffType;
  /** 左側の値 (removed/changed) */
  leftValue?: unknown;
  /** 右側の値 (added/changed) */
  rightValue?: unknown;
  /** 表示用の値の文字列 */
  leftDisplay?: string;
  /** 表示用の値の文字列 */
  rightDisplay?: string;
  /** 子ノード */
  children?: DiffNode[];
}

/** 比較サマリー */
export interface DiffSummary {
  /** 追加されたキー数 */
  added: number;
  /** 削除されたキー数 */
  removed: number;
  /** 変更されたキー数 */
  changed: number;
  /** 変更なしのキー数 */
  unchanged: number;
}

/** 比較結果 */
export interface CompareResult {
  /** 差分ノードのリスト */
  nodes: DiffNode[];
  /** サマリー */
  summary: DiffSummary;
}

/**
 * 値をJSON表示用文字列に変換する
 */
function displayValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[Array (${value.length}件)]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return `{Object (${keys.length}件)}`;
  }
  return String(value);
}

/**
 * 2つの値が等しいか再帰的に比較する
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr !== bArr) return false;

  if (aArr) {
    const aList = a as unknown[];
    const bList = b as unknown[];
    if (aList.length !== bList.length) return false;
    return aList.every((item, i) => deepEqual(item, bList[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();
  if (aKeys.join(",") !== bKeys.join(",")) return false;
  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
}

/**
 * 2つのJSON値を再帰的に比較し、差分ノードを生成する
 */
function compareValues(
  left: unknown,
  right: unknown,
  path: string,
  summary: DiffSummary,
): DiffNode[] {
  const nodes: DiffNode[] = [];

  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

  // 両方オブジェクトの場合は再帰的に比較
  if (isObject(left) && isObject(right)) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key;
      const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
      const hasRight = Object.prototype.hasOwnProperty.call(right, key);

      if (hasLeft && !hasRight) {
        summary.removed++;
        nodes.push({
          path: childPath,
          type: "removed",
          leftValue: left[key],
          leftDisplay: displayValue(left[key]),
        });
      } else if (!hasLeft && hasRight) {
        summary.added++;
        nodes.push({
          path: childPath,
          type: "added",
          rightValue: right[key],
          rightDisplay: displayValue(right[key]),
        });
      } else {
        const childNodes = compareValues(left[key], right[key], childPath, summary);
        nodes.push(...childNodes);
      }
    }
    return nodes;
  }

  // それ以外は値を直接比較
  if (deepEqual(left, right)) {
    summary.unchanged++;
    nodes.push({
      path: path || "(root)",
      type: "unchanged",
      leftValue: left,
      rightValue: right,
      leftDisplay: displayValue(left),
      rightDisplay: displayValue(right),
    });
  } else {
    summary.changed++;
    nodes.push({
      path: path || "(root)",
      type: "changed",
      leftValue: left,
      rightValue: right,
      leftDisplay: displayValue(left),
      rightDisplay: displayValue(right),
    });
  }

  return nodes;
}

/**
 * 2つのJSON文字列を比較する
 * @param leftJson - 左側のJSON文字列
 * @param rightJson - 右側のJSON文字列
 * @returns 比較結果
 * @throws JSON解析エラー
 */
export function compareJson(leftJson: string, rightJson: string): CompareResult {
  if (!leftJson.trim()) {
    throw new Error("左側のJSONが空です");
  }
  if (!rightJson.trim()) {
    throw new Error("右側のJSONが空です");
  }

  let left: unknown;
  let right: unknown;

  try {
    left = JSON.parse(leftJson);
  } catch {
    throw new Error("左側のJSONの形式が正しくありません");
  }

  try {
    right = JSON.parse(rightJson);
  } catch {
    throw new Error("右側のJSONの形式が正しくありません");
  }

  const summary: DiffSummary = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
  };

  const nodes = compareValues(left, right, "", summary);

  return { nodes, summary };
}

/**
 * JSONを整形する
 * @param json - JSON文字列
 * @returns 整形されたJSON文字列
 * @throws JSON解析エラー
 */
export function formatJson(json: string): string {
  if (!json.trim()) return "";
  const parsed = JSON.parse(json);
  return JSON.stringify(parsed, null, 2);
}

/** サンプルJSONのペア */
export interface SamplePair {
  left: string;
  right: string;
}

/**
 * サンプルJSONペアを返す
 */
export function getSampleJsonPair(): SamplePair {
  const left = JSON.stringify(
    {
      name: "Alice",
      age: 30,
      email: "alice@example.com",
      address: {
        city: "Tokyo",
        zip: "100-0001",
      },
      tags: ["admin", "user"],
      active: true,
    },
    null,
    2,
  );

  const right = JSON.stringify(
    {
      name: "Alice",
      age: 31,
      address: {
        city: "Osaka",
        zip: "530-0001",
        country: "Japan",
      },
      tags: ["user"],
      active: true,
      phone: "090-0000-0000",
    },
    null,
    2,
  );

  return { left, right };
}
