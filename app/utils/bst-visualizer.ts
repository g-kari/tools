/**
 * 二分探索木（Binary Search Tree）ビジュアライザーユーティリティ
 *
 * BST の挿入・削除・探索・走査・SVGレイアウト計算を提供します。
 */

/** BST ノード */
export interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

/** SVG描画用ノード位置情報 */
export interface NodePosition {
  value: number;
  x: number;
  y: number;
  parentX: number | null;
  parentY: number | null;
  state: "normal" | "inserting" | "deleting" | "found" | "searching" | "not-found";
}

/** 走査の種類 */
export type TraversalType = "inorder" | "preorder" | "postorder";

/** 走査ラベル */
export const TRAVERSAL_LABELS: Record<TraversalType, string> = {
  inorder: "中順（昇順）",
  preorder: "前順",
  postorder: "後順",
};

/**
 * ノードを BST に挿入する（イミュータブル）
 * @param root - ルートノード
 * @param value - 挿入する値
 * @returns 新しいルートノード
 */
export function insertNode(root: BSTNode | null, value: number): BSTNode {
  if (root === null) {
    return { value, left: null, right: null };
  }
  if (value < root.value) {
    return { ...root, left: insertNode(root.left, value) };
  }
  if (value > root.value) {
    return { ...root, right: insertNode(root.right, value) };
  }
  // 重複は無視
  return root;
}

/**
 * BST から最小値ノードを取得する
 */
function getMinNode(node: BSTNode): BSTNode {
  let current = node;
  while (current.left !== null) {
    current = current.left;
  }
  return current;
}

/**
 * ノードを BST から削除する（イミュータブル）
 * @param root - ルートノード
 * @param value - 削除する値
 * @returns 新しいルートノード
 */
export function deleteNode(root: BSTNode | null, value: number): BSTNode | null {
  if (root === null) return null;

  if (value < root.value) {
    return { ...root, left: deleteNode(root.left, value) };
  }
  if (value > root.value) {
    return { ...root, right: deleteNode(root.right, value) };
  }

  // 削除対象ノードを発見
  if (root.left === null) return root.right;
  if (root.right === null) return root.left;

  // 右部分木の最小値（後継ノード）で置き換え
  const successor = getMinNode(root.right);
  return {
    value: successor.value,
    left: root.left,
    right: deleteNode(root.right, successor.value),
  };
}

/**
 * 値を BST で探索し、探索パスの値リストを返す
 * @param root - ルートノード
 * @param value - 探索する値
 * @returns [パスの値リスト, 見つかったかどうか]
 */
export function searchNode(root: BSTNode | null, value: number): [number[], boolean] {
  const path: number[] = [];
  let current = root;
  while (current !== null) {
    path.push(current.value);
    if (value === current.value) return [path, true];
    current = value < current.value ? current.left : current.right;
  }
  return [path, false];
}

/**
 * 中順走査（昇順）
 */
export function inorder(root: BSTNode | null): number[] {
  if (root === null) return [];
  return [...inorder(root.left), root.value, ...inorder(root.right)];
}

/**
 * 前順走査
 */
export function preorder(root: BSTNode | null): number[] {
  if (root === null) return [];
  return [root.value, ...preorder(root.left), ...preorder(root.right)];
}

/**
 * 後順走査
 */
export function postorder(root: BSTNode | null): number[] {
  if (root === null) return [];
  return [...postorder(root.left), ...postorder(root.right), root.value];
}

/**
 * 木の高さを返す（空の木は 0）
 */
export function getHeight(root: BSTNode | null): number {
  if (root === null) return 0;
  return 1 + Math.max(getHeight(root.left), getHeight(root.right));
}

/**
 * ノード数を返す
 */
export function getSize(root: BSTNode | null): number {
  if (root === null) return 0;
  return 1 + getSize(root.left) + getSize(root.right);
}

/** SVG 描画の定数 */
const NODE_RADIUS = 22;
const LEVEL_HEIGHT = 70;
const BASE_WIDTH = 800;

/**
 * SVG 描画用にノード位置を計算する
 * @param root - ルートノード
 * @param highlightValues - ハイライト対象の値と状態のマップ
 */
export function calcTreeLayout(
  root: BSTNode | null,
  highlightValues: Map<number, NodePosition["state"]> = new Map(),
): NodePosition[] {
  const positions: NodePosition[] = [];

  function assign(
    node: BSTNode | null,
    depth: number,
    left: number,
    right: number,
    parentX: number | null,
    parentY: number | null,
  ): void {
    if (node === null) return;
    const x = (left + right) / 2;
    const y = NODE_RADIUS + depth * LEVEL_HEIGHT;
    positions.push({
      value: node.value,
      x,
      y,
      parentX,
      parentY,
      state: highlightValues.get(node.value) ?? "normal",
    });
    const mid = (left + right) / 2;
    assign(node.left, depth + 1, left, mid, x, y);
    assign(node.right, depth + 1, mid, right, x, y);
  }

  assign(root, 0, 0, BASE_WIDTH, null, null);
  return positions;
}

export { NODE_RADIUS, LEVEL_HEIGHT, BASE_WIDTH };
