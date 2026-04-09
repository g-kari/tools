import { describe, expect, it } from "vite-plus/test";
import {
  convertAllCases,
  splitIntoWords,
  toCamelCase,
  toCobolCase,
  toDotCase,
  toFlatCase,
  toKebabCase,
  toLowerCaseWords,
  toPascalCase,
  toScreamingSnakeCase,
  toSnakeCase,
  toTrainCase,
  toUpperCaseWords,
} from "../../app/routes/text-case";

describe("splitIntoWords", () => {
  it("camelCaseを単語配列に分解する", () => {
    expect(splitIntoWords("helloWorldFoo")).toEqual(["hello", "world", "foo"]);
  });

  it("PascalCaseを単語配列に分解する", () => {
    expect(splitIntoWords("HelloWorldFoo")).toEqual(["hello", "world", "foo"]);
  });

  it("snake_caseを単語配列に分解する", () => {
    expect(splitIntoWords("hello_world_foo")).toEqual(["hello", "world", "foo"]);
  });

  it("SCREAMING_SNAKE_CASEを単語配列に分解する", () => {
    expect(splitIntoWords("HELLO_WORLD_FOO")).toEqual(["hello", "world", "foo"]);
  });

  it("kebab-caseを単語配列に分解する", () => {
    expect(splitIntoWords("hello-world-foo")).toEqual(["hello", "world", "foo"]);
  });

  it("dot.caseを単語配列に分解する", () => {
    expect(splitIntoWords("hello.world.foo")).toEqual(["hello", "world", "foo"]);
  });

  it("スペース区切りを単語配列に分解する", () => {
    expect(splitIntoWords("hello world foo")).toEqual(["hello", "world", "foo"]);
  });

  it("空文字列は空配列を返す", () => {
    expect(splitIntoWords("")).toEqual([]);
  });

  it("単一単語はそのまま返す", () => {
    expect(splitIntoWords("hello")).toEqual(["hello"]);
  });
});

describe("toCamelCase", () => {
  it("基本変換", () => {
    expect(toCamelCase(["hello", "world", "foo"])).toBe("helloWorldFoo");
  });

  it("単一単語", () => {
    expect(toCamelCase(["hello"])).toBe("hello");
  });

  it("空配列は空文字列", () => {
    expect(toCamelCase([])).toBe("");
  });
});

describe("toPascalCase", () => {
  it("基本変換", () => {
    expect(toPascalCase(["hello", "world", "foo"])).toBe("HelloWorldFoo");
  });

  it("単一単語", () => {
    expect(toPascalCase(["hello"])).toBe("Hello");
  });

  it("空配列は空文字列", () => {
    expect(toPascalCase([])).toBe("");
  });
});

describe("toSnakeCase", () => {
  it("基本変換", () => {
    expect(toSnakeCase(["hello", "world", "foo"])).toBe("hello_world_foo");
  });

  it("単一単語", () => {
    expect(toSnakeCase(["hello"])).toBe("hello");
  });

  it("空配列は空文字列", () => {
    expect(toSnakeCase([])).toBe("");
  });
});

describe("toScreamingSnakeCase", () => {
  it("基本変換", () => {
    expect(toScreamingSnakeCase(["hello", "world", "foo"])).toBe("HELLO_WORLD_FOO");
  });

  it("空配列は空文字列", () => {
    expect(toScreamingSnakeCase([])).toBe("");
  });
});

describe("toKebabCase", () => {
  it("基本変換", () => {
    expect(toKebabCase(["hello", "world", "foo"])).toBe("hello-world-foo");
  });

  it("空配列は空文字列", () => {
    expect(toKebabCase([])).toBe("");
  });
});

describe("toCobolCase", () => {
  it("基本変換", () => {
    expect(toCobolCase(["hello", "world", "foo"])).toBe("HELLO-WORLD-FOO");
  });

  it("空配列は空文字列", () => {
    expect(toCobolCase([])).toBe("");
  });
});

describe("toDotCase", () => {
  it("基本変換", () => {
    expect(toDotCase(["hello", "world", "foo"])).toBe("hello.world.foo");
  });

  it("空配列は空文字列", () => {
    expect(toDotCase([])).toBe("");
  });
});

describe("toTrainCase", () => {
  it("基本変換", () => {
    expect(toTrainCase(["hello", "world", "foo"])).toBe("Hello-World-Foo");
  });

  it("空配列は空文字列", () => {
    expect(toTrainCase([])).toBe("");
  });
});

describe("toFlatCase", () => {
  it("基本変換", () => {
    expect(toFlatCase(["hello", "world", "foo"])).toBe("helloworldfoo");
  });

  it("空配列は空文字列", () => {
    expect(toFlatCase([])).toBe("");
  });
});

describe("toUpperCaseWords", () => {
  it("基本変換", () => {
    expect(toUpperCaseWords(["hello", "world", "foo"])).toBe("HELLO WORLD FOO");
  });

  it("空配列は空文字列", () => {
    expect(toUpperCaseWords([])).toBe("");
  });
});

describe("toLowerCaseWords", () => {
  it("基本変換", () => {
    expect(toLowerCaseWords(["hello", "world", "foo"])).toBe("hello world foo");
  });

  it("空配列は空文字列", () => {
    expect(toLowerCaseWords([])).toBe("");
  });
});

describe("convertAllCases", () => {
  it("11種類の変換結果を返す", () => {
    const results = convertAllCases("helloWorld");
    expect(results).toHaveLength(11);
  });

  it("各結果にlabel, key, value, exampleが含まれる", () => {
    const results = convertAllCases("helloWorld");
    for (const result of results) {
      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("value");
      expect(result).toHaveProperty("example");
    }
  });

  it("空文字列の場合は全て空文字列の値を返す", () => {
    const results = convertAllCases("");
    for (const result of results) {
      expect(result.value).toBe("");
    }
  });

  it("camelCaseの変換が正しい", () => {
    const results = convertAllCases("hello_world");
    const camel = results.find((r) => r.key === "camel");
    expect(camel?.value).toBe("helloWorld");
  });

  it("snake_caseの変換が正しい", () => {
    const results = convertAllCases("helloWorld");
    const snake = results.find((r) => r.key === "snake");
    expect(snake?.value).toBe("hello_world");
  });
});

describe("エッジケース", () => {
  it("連続する区切り文字を正しく処理する", () => {
    expect(splitIntoWords("hello__world")).toEqual(["hello", "world"]);
    expect(splitIntoWords("hello--world")).toEqual(["hello", "world"]);
  });

  it("数字を含む入力を処理する", () => {
    const words = splitIntoWords("hello2World");
    expect(words.length).toBeGreaterThan(0);
  });

  it("Train-Caseを正しく分解する", () => {
    expect(splitIntoWords("Hello-World-Foo")).toEqual(["hello", "world", "foo"]);
  });
});
