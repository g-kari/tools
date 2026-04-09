import { describe, test, expect } from "vite-plus/test";
import { generateGraphQLSchema, getSampleJson } from "../../app/utils/json-to-graphql";

const defaultOptions = {
  rootTypeName: "Root",
  nonNull: false,
  useInterface: false,
};

describe("generateGraphQLSchema", () => {
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
