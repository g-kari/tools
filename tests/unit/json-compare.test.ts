import { describe, it, expect } from "vite-plus/test";
import {
  compareJson,
  formatJson,
  getSampleJsonPair,
  type DiffNode,
} from "../../app/utils/json-compare";

describe("compareJson", () => {
  it("両方のJSONが同一の場合、差分なし", () => {
    const json = '{"name": "Alice", "age": 30}';
    const result = compareJson(json, json);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.changed).toBe(0);
    expect(result.summary.unchanged).toBeGreaterThan(0);
  });

  it("右側に追加されたキーを検出する", () => {
    const left = '{"name": "Alice"}';
    const right = '{"name": "Alice", "age": 30}';
    const result = compareJson(left, right);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(0);
    const addedNode = result.nodes.find((n) => n.type === "added");
    expect(addedNode).toBeDefined();
    expect(addedNode?.path).toBe("age");
  });

  it("右側から削除されたキーを検出する", () => {
    const left = '{"name": "Alice", "age": 30}';
    const right = '{"name": "Alice"}';
    const result = compareJson(left, right);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.added).toBe(0);
    const removedNode = result.nodes.find((n) => n.type === "removed");
    expect(removedNode).toBeDefined();
    expect(removedNode?.path).toBe("age");
  });

  it("値が変更されたキーを検出する", () => {
    const left = '{"age": 30}';
    const right = '{"age": 31}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
    const changedNode = result.nodes.find((n) => n.type === "changed");
    expect(changedNode).toBeDefined();
    expect(changedNode?.leftDisplay).toBe("30");
    expect(changedNode?.rightDisplay).toBe("31");
  });

  it("ネストしたオブジェクトの差分を検出する", () => {
    const left = '{"user": {"name": "Alice", "city": "Tokyo"}}';
    const right = '{"user": {"name": "Alice", "city": "Osaka"}}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
    const changedNode = result.nodes.find((n) => n.type === "changed");
    expect(changedNode?.path).toBe("user.city");
  });

  it("ネストしたオブジェクトへのキー追加を検出する", () => {
    const left = '{"user": {"name": "Alice"}}';
    const right = '{"user": {"name": "Alice", "age": 30}}';
    const result = compareJson(left, right);
    expect(result.summary.added).toBe(1);
    const addedNode = result.nodes.find((n) => n.type === "added");
    expect(addedNode?.path).toBe("user.age");
  });

  it("文字列値が変更なしと判定される", () => {
    const json = '{"name": "Alice"}';
    const result = compareJson(json, json);
    expect(result.summary.unchanged).toBe(1);
    expect(result.summary.changed).toBe(0);
  });

  it("boolean値の変更を検出する", () => {
    const left = '{"active": true}';
    const right = '{"active": false}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
  });

  it("null値の追加を検出する", () => {
    const left = '{"value": null}';
    const right = '{"value": "something"}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
  });

  it("配列の変更を検出する", () => {
    const left = '{"tags": ["a", "b"]}';
    const right = '{"tags": ["a", "c"]}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
  });

  it("同一配列が変更なしと判定される", () => {
    const json = '{"tags": ["a", "b"]}';
    const result = compareJson(json, json);
    expect(result.summary.unchanged).toBe(1);
    expect(result.summary.changed).toBe(0);
  });

  it("複数の差分を同時に検出する", () => {
    const left = '{"a": 1, "b": 2, "c": 3}';
    const right = '{"a": 1, "b": 99, "d": 4}';
    const result = compareJson(left, right);
    expect(result.summary.unchanged).toBe(1); // a
    expect(result.summary.changed).toBe(1); // b
    expect(result.summary.removed).toBe(1); // c
    expect(result.summary.added).toBe(1); // d
  });

  it("左側が空文字列の場合にエラーを投げる", () => {
    expect(() => compareJson("", '{"a": 1}')).toThrow("左側のJSONが空です");
  });

  it("右側が空文字列の場合にエラーを投げる", () => {
    expect(() => compareJson('{"a": 1}', "")).toThrow("右側のJSONが空です");
  });

  it("左側のJSONが不正な場合にエラーを投げる", () => {
    expect(() => compareJson("{invalid}", '{"a": 1}')).toThrow(
      "左側のJSONの形式が正しくありません"
    );
  });

  it("右側のJSONが不正な場合にエラーを投げる", () => {
    expect(() => compareJson('{"a": 1}', "{invalid}")).toThrow(
      "右側のJSONの形式が正しくありません"
    );
  });

  it("空オブジェクト同士は差分なし", () => {
    const result = compareJson("{}", "{}");
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.changed).toBe(0);
  });

  it("深いネスト構造の差分を検出する", () => {
    const left = '{"a": {"b": {"c": 1}}}';
    const right = '{"a": {"b": {"c": 2}}}';
    const result = compareJson(left, right);
    expect(result.summary.changed).toBe(1);
    const changedNode = result.nodes.find((n) => n.type === "changed");
    expect(changedNode?.path).toBe("a.b.c");
  });

  it("leftDisplayとrightDisplayが設定される", () => {
    const left = '{"x": "hello"}';
    const right = '{"x": "world"}';
    const result = compareJson(left, right);
    const node = result.nodes.find((n) => n.path === "x") as DiffNode;
    expect(node.leftDisplay).toBe('"hello"');
    expect(node.rightDisplay).toBe('"world"');
  });

  it("追加ノードにはleftDisplayがなくrightDisplayがある", () => {
    const result = compareJson('{}', '{"x": 1}');
    const addedNode = result.nodes.find((n) => n.type === "added") as DiffNode;
    expect(addedNode.leftDisplay).toBeUndefined();
    expect(addedNode.rightDisplay).toBe("1");
  });

  it("削除ノードにはleftDisplayがありrightDisplayがない", () => {
    const result = compareJson('{"x": 1}', '{}');
    const removedNode = result.nodes.find(
      (n) => n.type === "removed"
    ) as DiffNode;
    expect(removedNode.leftDisplay).toBe("1");
    expect(removedNode.rightDisplay).toBeUndefined();
  });

  it("ネストしたオブジェクトのdisplayValueが正しい形式", () => {
    const result = compareJson(
      '{"obj": {"a": 1}}',
      '{"obj": {"a": 2}}'
    );
    const node = result.nodes.find((n) => n.path === "obj.a") as DiffNode;
    expect(node.leftDisplay).toBe("1");
    expect(node.rightDisplay).toBe("2");
  });
});

describe("formatJson", () => {
  it("JSONを整形する", () => {
    const input = '{"a":1,"b":2}';
    const result = formatJson(input);
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("空文字列を返す（入力が空）", () => {
    expect(formatJson("")).toBe("");
  });

  it("空白のみの入力に空文字列を返す", () => {
    expect(formatJson("   ")).toBe("");
  });

  it("不正なJSONはエラーを投げる", () => {
    expect(() => formatJson("{invalid}")).toThrow();
  });
});

describe("getSampleJsonPair", () => {
  it("left と right プロパティを持つオブジェクトを返す", () => {
    const pair = getSampleJsonPair();
    expect(pair).toHaveProperty("left");
    expect(pair).toHaveProperty("right");
  });

  it("left が有効なJSON文字列である", () => {
    const { left } = getSampleJsonPair();
    expect(() => JSON.parse(left)).not.toThrow();
  });

  it("right が有効なJSON文字列である", () => {
    const { right } = getSampleJsonPair();
    expect(() => JSON.parse(right)).not.toThrow();
  });

  it("left と right を比較すると差分がある", () => {
    const { left, right } = getSampleJsonPair();
    const result = compareJson(left, right);
    const totalDiff =
      result.summary.added + result.summary.removed + result.summary.changed;
    expect(totalDiff).toBeGreaterThan(0);
  });
});
