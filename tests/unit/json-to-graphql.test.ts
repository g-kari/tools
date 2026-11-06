import { describe, test, expect } from "vite-plus/test";
import { generateGraphQLSchema, getSampleJson } from "../../app/utils/json-to-graphql";

const defaultOptions = {
  rootTypeName: "Root",
  nonNull: false,
  useInterface: false,
};

describe("generateGraphQLSchema", () => {
  test("別階層の同じ子名でも各オブジェクトの項目を保持する", () => {
    const result = generateGraphQLSchema(
      JSON.stringify({
        billing: { address: { city: "Tokyo" } },
        shipping: { address: { zip: "100" } },
      }),
      defaultOptions,
    );
    expect(result).toContain("type Address {\n  city: String\n}");
    expect(result).toContain("type Address2 {\n  zip: String\n}");
    expect(result).toContain("type Shipping {\n  address: Address2\n}");
  });

  test("ルートと同じ子名を別型にして両方の項目を保持する", () => {
    const result = generateGraphQLSchema('{"root":{"nested":true},"outer":1}', defaultOptions);
    expect(result).toContain("type Root2 {\n  nested: Boolean\n}");
    expect(result).toContain("type Root {\n  root: Root2\n  outer: Int\n}");
  });

  test("収集中の親型と同じ子名を再利用しない", () => {
    const result = generateGraphQLSchema(
      '{"item":{"item":{"leaf":1},"middle":true}}',
      defaultOptions,
    );
    expect(result).toContain("type Item2 {\n  leaf: Int\n}");
    expect(result).toContain("type Item {\n  item: Item2\n  middle: Boolean\n}");
  });

  test("連番候補が既存の型名と衝突しても新しい名前を選ぶ", () => {
    const result = generateGraphQLSchema(
      '{"address2":{"a":1},"left":{"address":{"b":true}},"right":{"address":{"c":"x"}}}',
      defaultOptions,
    );
    expect(result).toContain("type Address3 {\n  c: String\n}");
    expect(result).toContain("type Right {\n  address: Address3\n}");
  });

  test("組込みscalar名を子オブジェクトで上書きしない", () => {
    const result = generateGraphQLSchema(
      '{"string":{"value":1},"id":{"label":"x"},"name":"Alice"}',
      defaultOptions,
    );
    expect(result).toContain("type String2 {\n  value: Int\n}");
    expect(result).toContain("type Id {\n  label: String\n}");
    expect(result).toContain("name: String");
  });

  test("配列とinterface/nonNullでも衝突した型の参照を保持する", () => {
    const result = generateGraphQLSchema(
      '{"left":{"items":[{"one":1}]},"right":{"items":[{"two":true}]}}',
      { ...defaultOptions, nonNull: true, useInterface: true },
    );
    expect(result).toContain("interface Items2 {\n  two: Boolean!\n}");
    expect(result).toContain("interface Right {\n  items: [Items2!]!\n}");
  });

  test("文字列プロパティが String を生成する", () => {
    const result = generateGraphQLSchema('{"name": "Alice"}', defaultOptions);
    expect(result).toContain("String");
    expect(result).toContain("name:");
  });

  test("整数プロパティが Int を生成する", () => {
    const result = generateGraphQLSchema('{"age": 30}', defaultOptions);
    expect(result).toContain("Int");
    expect(result).toContain("age:");
  });

  test("小数プロパティが Float を生成する", () => {
    const result = generateGraphQLSchema('{"score": 3.14}', defaultOptions);
    expect(result).toContain("Float");
    expect(result).toContain("score:");
  });

  test("真偽値プロパティが Boolean を生成する", () => {
    const result = generateGraphQLSchema('{"active": true}', defaultOptions);
    expect(result).toContain("Boolean");
    expect(result).toContain("active:");
  });

  test("nullプロパティが String を生成する", () => {
    const result = generateGraphQLSchema('{"nickname": null}', defaultOptions);
    expect(result).toContain("String");
    expect(result).toContain("nickname:");
  });

  test("文字列配列が [String] を生成する", () => {
    const result = generateGraphQLSchema('{"tags": ["a", "b"]}', defaultOptions);
    expect(result).toContain("[String]");
    expect(result).toContain("tags:");
  });

  test("整数配列が [Int] を生成する", () => {
    const result = generateGraphQLSchema('{"scores": [1, 2, 3]}', defaultOptions);
    expect(result).toContain("[Int]");
    expect(result).toContain("scores:");
  });

  test("ネストされたオブジェクトが別の type を生成する", () => {
    const result = generateGraphQLSchema('{"address": {"city": "Tokyo"}}', defaultOptions);
    expect(result).toContain("type Address");
    expect(result).toContain("city: String");
    expect(result).toContain("type Root");
    expect(result).toContain("address: Address");
  });

  test("ルート型名がカスタマイズできる", () => {
    const result = generateGraphQLSchema('{"id": 1}', {
      ...defaultOptions,
      rootTypeName: "User",
    });
    expect(result).toContain("type User");
    expect(result).not.toContain("type Root");
  });

  test("nonNull=true のとき ! が付与される", () => {
    const result = generateGraphQLSchema('{"name": "Alice"}', {
      ...defaultOptions,
      nonNull: true,
    });
    expect(result).toContain("String!");
  });

  test("nonNull=false のとき ! が付与されない", () => {
    const result = generateGraphQLSchema('{"name": "Alice"}', {
      ...defaultOptions,
      nonNull: false,
    });
    expect(result).not.toContain("String!");
  });

  test("null値は nonNull=true でも ! が付与されない", () => {
    const result = generateGraphQLSchema('{"nickname": null}', {
      ...defaultOptions,
      nonNull: true,
    });
    // null値のフィールドは ! なし
    expect(result).toMatch(/nickname: String(?!!)/);
  });

  test("useInterface=true のとき interface キーワードを使用する", () => {
    const result = generateGraphQLSchema('{"id": 1}', {
      ...defaultOptions,
      useInterface: true,
    });
    expect(result).toContain("interface Root");
    expect(result).not.toContain("type Root");
  });

  test("useInterface=false のとき type キーワードを使用する", () => {
    const result = generateGraphQLSchema('{"id": 1}', {
      ...defaultOptions,
      useInterface: false,
    });
    expect(result).toContain("type Root");
    expect(result).not.toContain("interface Root");
  });

  test("ルートが配列の場合は最初の要素を使用する", () => {
    const result = generateGraphQLSchema('[{"name": "Alice"}]', defaultOptions);
    expect(result).toContain("type Root");
    expect(result).toContain("name: String");
  });

  test("無効なJSONでエラーをスローする", () => {
    expect(() => generateGraphQLSchema("invalid json", defaultOptions)).toThrow(
      "無効なJSON形式です",
    );
  });

  test("空文字列でエラーをスローする", () => {
    expect(() => generateGraphQLSchema("", defaultOptions)).toThrow("JSONを入力してください");
  });

  test("空白のみの文字列でエラーをスローする", () => {
    expect(() => generateGraphQLSchema("   ", defaultOptions)).toThrow("JSONを入力してください");
  });

  test("複合的なネストオブジェクトを正しく処理する", () => {
    const json = JSON.stringify({
      name: "Alice",
      age: 30,
      active: true,
      tags: ["a", "b"],
      address: { city: "Tokyo" },
    });
    const result = generateGraphQLSchema(json, defaultOptions);
    expect(result).toContain("String");
    expect(result).toContain("Int");
    expect(result).toContain("Boolean");
    expect(result).toContain("[String]");
    expect(result).toContain("type Address");
    expect(result).toContain("type Root");
  });

  test("依存する型はルート型より前に出力される", () => {
    const result = generateGraphQLSchema('{"address": {"city": "Tokyo"}}', defaultOptions);
    const addressPos = result.indexOf("type Address");
    const rootPos = result.indexOf("type Root");
    expect(addressPos).toBeLessThan(rootPos);
  });
});

describe("getSampleJson", () => {
  test("有効なJSONを返す", () => {
    const sample = getSampleJson();
    expect(() => JSON.parse(sample)).not.toThrow();
  });

  test("null値を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasNull = Object.values(parsed).some((v) => v === null);
    expect(hasNull).toBe(true);
  });

  test("配列を含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasArray = Object.values(parsed).some((v) => Array.isArray(v));
    expect(hasArray).toBe(true);
  });

  test("ネストされたオブジェクトを含む", () => {
    const sample = getSampleJson();
    const parsed = JSON.parse(sample) as Record<string, unknown>;
    const hasObject = Object.values(parsed).some(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v),
    );
    expect(hasObject).toBe(true);
  });
});
