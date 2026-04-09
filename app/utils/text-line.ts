/**
 * テキスト行操作ユーティリティ
 *
 * テキストの各行に対して様々な操作を行う。
 * トリム、空行削除、行番号付加、プレフィックス/サフィックス追加、
 * 逆順、シャッフル、フィルタリングなどをサポートする。
 */

/** 操作の種類 */
export type LineOp =
  | "trim"
  | "remove-empty"
  | "add-numbers"
  | "add-prefix"
  | "add-suffix"
  | "reverse"
  | "shuffle"
  | "filter-keep"
  | "filter-remove";

/** 操作の定義 */
export interface LineOpDef {
  id: LineOp;
  label: string;
  description: string;
  /** 追加入力が必要か */
  hasInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

/** 操作結果 */
export interface LineOpResult {
  result: string;
  lineCount: {
    before: number;
    after: number;
  };
}

/** 操作の定義一覧 */
export const LINE_OPS: LineOpDef[] = [
  {
    id: "trim",
    label: "各行をトリム",
    description: "各行の先頭・末尾の空白（スペース、タブ）を除去する",
  },
  {
    id: "remove-empty",
    label: "空行を削除",
    description: "空行（空白のみの行も含む）をすべて削除する",
  },
  {
    id: "add-numbers",
    label: "行番号を追加",
    description: "各行の先頭に行番号（1. 2. …）を付加する",
  },
  {
    id: "add-prefix",
    label: "プレフィックスを追加",
    description: "各行の先頭に指定した文字列を付加する",
    hasInput: true,
    inputLabel: "プレフィックス",
    inputPlaceholder: "例: - ",
  },
  {
    id: "add-suffix",
    label: "サフィックスを追加",
    description: "各行の末尾に指定した文字列を付加する",
    hasInput: true,
    inputLabel: "サフィックス",
    inputPlaceholder: "例: ,",
  },
  {
    id: "reverse",
    label: "行を逆順にする",
    description: "行の順序を上下逆転させる",
  },
  {
    id: "shuffle",
    label: "行をシャッフル",
    description: "行の順序をランダムに並び替える",
  },
  {
    id: "filter-keep",
    label: "行をフィルタ（含む）",
    description: "指定したキーワードを含む行のみ残す",
    hasInput: true,
    inputLabel: "フィルタキーワード",
    inputPlaceholder: "例: error",
  },
  {
    id: "filter-remove",
    label: "行をフィルタ（除外）",
    description: "指定したキーワードを含む行を削除する",
    hasInput: true,
    inputLabel: "除外キーワード",
    inputPlaceholder: "例: debug",
  },
];

/**
 * テキストに行操作を適用する
 *
 * @param text - 入力テキスト
 * @param op - 操作の種類
 * @param extra - 追加パラメータ（プレフィックス/サフィックス/フィルタキーワード）
 * @returns 操作結果と行数情報
 */
export function applyLineOp(text: string, op: LineOp, extra?: string): LineOpResult {
  const lines = text.split("\n");
  const before = lines.length;
  let result: string[];

  switch (op) {
    case "trim":
      result = lines.map((line) => line.trim());
      break;

    case "remove-empty":
      result = lines.filter((line) => line.trim().length > 0);
      break;

    case "add-numbers":
      result = lines.map((line, i) => `${i + 1}. ${line}`);
      break;

    case "add-prefix": {
      const prefix = extra ?? "";
      result = lines.map((line) => `${prefix}${line}`);
      break;
    }

    case "add-suffix": {
      const suffix = extra ?? "";
      result = lines.map((line) => `${line}${suffix}`);
      break;
    }

    case "reverse":
      result = [...lines].reverse();
      break;

    case "shuffle":
      result = shuffleArray([...lines]);
      break;

    case "filter-keep": {
      const keyword = extra ?? "";
      if (keyword === "") {
        result = lines;
      } else {
        result = lines.filter((line) => line.includes(keyword));
      }
      break;
    }

    case "filter-remove": {
      const keyword = extra ?? "";
      if (keyword === "") {
        result = lines;
      } else {
        result = lines.filter((line) => !line.includes(keyword));
      }
      break;
    }

    default:
      result = lines;
  }

  return {
    result: result.join("\n"),
    lineCount: {
      before,
      after: result.length,
    },
  };
}

/**
 * Fisher-Yates アルゴリズムで配列をシャッフルする
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
