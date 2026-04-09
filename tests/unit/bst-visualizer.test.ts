import { describe, it, expect } from "vite-plus/test";
import {
  insertNode,
  deleteNode,
  searchNode,
  inorder,
  preorder,
  postorder,
  getHeight,
  getSize,
  calcTreeLayout,
  TRAVERSAL_LABELS,
} from "../../app/utils/bst-visualizer";

describe("insertNode", () => {
  it("空の木にノードを挿入する", () => {
    const root = insertNode(null, 10);
    expect(root.value).toBe(10);
    expect(root.left).toBeNull();
    expect(root.right).toBeNull();
  });

  it("小さい値は左に挿入される", () => {
    const root = insertNode(insertNode(null, 10), 5);
    expect(root.left?.value).toBe(5);
    expect(root.right).toBeNull();
  });

  it("大きい値は右に挿入される", () => {
    const root = insertNode(insertNode(null, 10), 15);
    expect(root.right?.value).toBe(15);
    expect(root.left).toBeNull();
  });

  it("重複値は無視される", () => {
    const root = insertNode(insertNode(null, 10), 10);
    expect(root.left).toBeNull();
    expect(root.right).toBeNull();
    expect(root.value).toBe(10);
  });

  it("複数ノードを挿入しても BST 性質が保たれる", () => {
    let root = null;
    for (const v of [50, 30, 70, 20, 40, 60, 80]) {
      root = insertNode(root, v);
    }
    expect(inorder(root)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });
});

describe("deleteNode", () => {
  it("存在しない値の削除は変化なし", () => {
    const root = insertNode(null, 10);
    const result = deleteNode(root, 99);
    expect(result?.value).toBe(10);
  });

  it("葉ノードを削除できる", () => {
    let root = null;
    root = insertNode(root, 10);
    root = insertNode(root, 5);
    root = deleteNode(root, 5);
    expect(root?.left).toBeNull();
  });

  it("片方の子を持つノードを削除できる", () => {
    let root = null;
    root = insertNode(root, 10);
    root = insertNode(root, 5);
    root = insertNode(root, 3);
    root = deleteNode(root, 5);
    expect(root?.left?.value).toBe(3);
  });

  it("両方の子を持つノードを削除できる", () => {
    let root = null;
    for (const v of [50, 30, 70, 20, 40]) {
      root = insertNode(root, v);
    }
    root = deleteNode(root, 30);
    // 30 が削除され BST 性質が維持される
    expect(inorder(root)).toEqual([20, 40, 50, 70]);
  });

  it("ルートノードを削除できる", () => {
    let root = null;
    root = insertNode(root, 10);
    root = deleteNode(root, 10);
    expect(root).toBeNull();
  });

  it("空の木の削除は null を返す", () => {
    expect(deleteNode(null, 10)).toBeNull();
  });
});

describe("searchNode", () => {
  it("存在する値を見つける", () => {
    let root = null;
    for (const v of [50, 30, 70]) root = insertNode(root, v);
    const [path, found] = searchNode(root, 30);
    expect(found).toBe(true);
    expect(path).toContain(30);
    expect(path[0]).toBe(50); // ルートから探索
  });

  it("存在しない値は見つからない", () => {
    let root = null;
    for (const v of [50, 30, 70]) root = insertNode(root, v);
    const [_path, found] = searchNode(root, 99);
    expect(found).toBe(false);
  });

  it("空の木での探索", () => {
    const [path, found] = searchNode(null, 10);
    expect(path).toHaveLength(0);
    expect(found).toBe(false);
  });

  it("探索パスは BST に従う", () => {
    let root = null;
    for (const v of [50, 30, 70, 20, 40]) root = insertNode(root, v);
    const [path, found] = searchNode(root, 20);
    expect(found).toBe(true);
    expect(path).toEqual([50, 30, 20]);
  });
});

describe("inorder", () => {
  it("昇順ソートされた配列を返す", () => {
    let root = null;
    for (const v of [50, 30, 70, 20, 40]) root = insertNode(root, v);
    expect(inorder(root)).toEqual([20, 30, 40, 50, 70]);
  });

  it("空の木では空配列", () => {
    expect(inorder(null)).toEqual([]);
  });

  it("単一ノードでは値を含む配列", () => {
    expect(inorder(insertNode(null, 42))).toEqual([42]);
  });
});

describe("preorder", () => {
  it("ルートが先頭に来る", () => {
    let root = null;
    for (const v of [50, 30, 70]) root = insertNode(root, v);
    const result = preorder(root);
    expect(result[0]).toBe(50);
  });

  it("空の木では空配列", () => {
    expect(preorder(null)).toEqual([]);
  });
});

describe("postorder", () => {
  it("ルートが末尾に来る", () => {
    let root = null;
    for (const v of [50, 30, 70]) root = insertNode(root, v);
    const result = postorder(root);
    expect(result[result.length - 1]).toBe(50);
  });

  it("空の木では空配列", () => {
    expect(postorder(null)).toEqual([]);
  });
});

describe("getHeight", () => {
  it("空の木の高さは 0", () => {
    expect(getHeight(null)).toBe(0);
  });

  it("単一ノードの高さは 1", () => {
    expect(getHeight(insertNode(null, 10))).toBe(1);
  });

  it("完全二分木の高さが正しい", () => {
    let root = null;
    for (const v of [50, 30, 70, 20, 40, 60, 80]) root = insertNode(root, v);
    expect(getHeight(root)).toBe(3);
  });

  it("線形（偏り）木の高さが正しい", () => {
    let root = null;
    for (const v of [10, 20, 30, 40, 50]) root = insertNode(root, v);
    expect(getHeight(root)).toBe(5);
  });
});

describe("getSize", () => {
  it("空の木のサイズは 0", () => {
    expect(getSize(null)).toBe(0);
  });

  it("挿入した数だけノードが増える", () => {
    let root = null;
    for (const v of [50, 30, 70, 20]) root = insertNode(root, v);
    expect(getSize(root)).toBe(4);
  });

  it("重複を挿入してもサイズは増えない", () => {
    let root = null;
    root = insertNode(root, 10);
    root = insertNode(root, 10);
    expect(getSize(root)).toBe(1);
  });
});

describe("calcTreeLayout", () => {
  it("空の木では空配列", () => {
    expect(calcTreeLayout(null)).toHaveLength(0);
  });

  it("ノード数と同じ数の位置情報を返す", () => {
    let root = null;
    for (const v of [50, 30, 70]) root = insertNode(root, v);
    expect(calcTreeLayout(root)).toHaveLength(3);
  });

  it("ルートノードの parentX・parentY は null", () => {
    const root = insertNode(null, 50);
    const layout = calcTreeLayout(root);
    const rootPos = layout.find((p) => p.value === 50);
    expect(rootPos?.parentX).toBeNull();
    expect(rootPos?.parentY).toBeNull();
  });

  it("子ノードの parentX・parentY は非 null", () => {
    let root = null;
    root = insertNode(root, 50);
    root = insertNode(root, 30);
    const layout = calcTreeLayout(root);
    const childPos = layout.find((p) => p.value === 30);
    expect(childPos?.parentX).not.toBeNull();
    expect(childPos?.parentY).not.toBeNull();
  });

  it("ハイライトマップが state に反映される", () => {
    let root = null;
    root = insertNode(root, 50);
    root = insertNode(root, 30);
    const m = new Map<number, "found">([[30, "found"]]);
    const layout = calcTreeLayout(root, m);
    const found = layout.find((p) => p.value === 30);
    expect(found?.state).toBe("found");
    const normal = layout.find((p) => p.value === 50);
    expect(normal?.state).toBe("normal");
  });
});

describe("TRAVERSAL_LABELS", () => {
  it("3 種類の走査ラベルが定義されている", () => {
    expect(Object.keys(TRAVERSAL_LABELS)).toHaveLength(3);
    expect(TRAVERSAL_LABELS.inorder).toBeTruthy();
    expect(TRAVERSAL_LABELS.preorder).toBeTruthy();
    expect(TRAVERSAL_LABELS.postorder).toBeTruthy();
  });
});
