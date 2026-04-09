import { describe, it, expect } from "vite-plus/test";
import { phpSerialize, phpUnserialize } from "../../app/utils/php-serialize";

describe("phpSerialize", () => {
  it("should serialize null", () => {
    expect(phpSerialize(null)).toBe("N;");
  });

  it("should serialize true", () => {
    expect(phpSerialize(true)).toBe("b:1;");
  });

  it("should serialize false", () => {
    expect(phpSerialize(false)).toBe("b:0;");
  });

  it("should serialize integer", () => {
    expect(phpSerialize(42)).toBe("i:42;");
  });

  it("should serialize negative integer", () => {
    expect(phpSerialize(-7)).toBe("i:-7;");
  });

  it("should serialize zero", () => {
    expect(phpSerialize(0)).toBe("i:0;");
  });

  it("should serialize float", () => {
    expect(phpSerialize(3.14)).toBe("d:3.14;");
  });

  it("should serialize ASCII string", () => {
    expect(phpSerialize("hello")).toBe('s:5:"hello";');
  });

  it("should serialize Japanese string with correct byte length", () => {
    // "太郎" は UTF-8 で 6 バイト
    expect(phpSerialize("太郎")).toBe('s:6:"太郎";');
  });

  it("should serialize empty string", () => {
    expect(phpSerialize("")).toBe('s:0:"";');
  });

  it("should serialize indexed array", () => {
    expect(phpSerialize([1, 2, 3])).toBe("a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}");
  });

  it("should serialize associative array (plain object)", () => {
    const result = phpSerialize({ name: "Alice", age: 30 });
    expect(result).toBe('a:2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}');
  });

  it("should serialize empty array", () => {
    expect(phpSerialize([])).toBe("a:0:{}");
  });

  it("should serialize nested object", () => {
    const result = phpSerialize({ user: { id: 1 } });
    expect(result).toContain("a:1:");
    expect(result).toContain('s:4:"user"');
    expect(result).toContain('s:2:"id"');
    expect(result).toContain("i:1;");
  });

  it("should serialize PHP object with __className", () => {
    const result = phpSerialize({
      __className: "User",
      properties: { id: 1, name: "Alice" },
    });
    expect(result).toBe('O:4:"User":2:{s:2:"id";i:1;s:4:"name";s:5:"Alice";}');
  });
});

describe("phpUnserialize", () => {
  it("should unserialize null", () => {
    expect(phpUnserialize("N;")).toBeNull();
  });

  it("should unserialize true", () => {
    expect(phpUnserialize("b:1;")).toBe(true);
  });

  it("should unserialize false", () => {
    expect(phpUnserialize("b:0;")).toBe(false);
  });

  it("should unserialize integer", () => {
    expect(phpUnserialize("i:42;")).toBe(42);
  });

  it("should unserialize negative integer", () => {
    expect(phpUnserialize("i:-7;")).toBe(-7);
  });

  it("should unserialize float", () => {
    expect(phpUnserialize("d:3.14;")).toBeCloseTo(3.14);
  });

  it("should unserialize ASCII string", () => {
    expect(phpUnserialize('s:5:"hello";')).toBe("hello");
  });

  it("should unserialize Japanese string", () => {
    expect(phpUnserialize('s:6:"太郎";')).toBe("太郎");
  });

  it("should unserialize empty string", () => {
    expect(phpUnserialize('s:0:"";')).toBe("");
  });

  it("should unserialize indexed array", () => {
    expect(phpUnserialize("a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}")).toEqual([1, 2, 3]);
  });

  it("should unserialize associative array as object", () => {
    const result = phpUnserialize('a:2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}');
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("should unserialize empty array", () => {
    expect(phpUnserialize("a:0:{}")).toEqual([]);
  });

  it("should unserialize PHP object", () => {
    const result = phpUnserialize('O:4:"User":1:{s:2:"id";i:1;}') as {
      __className: string;
      properties: Record<string, unknown>;
    };
    expect(result.__className).toBe("User");
    expect(result.properties.id).toBe(1);
  });

  it("should throw on empty input", () => {
    expect(() => phpUnserialize("")).toThrow("入力が空です");
  });

  it("should throw on whitespace-only input", () => {
    expect(() => phpUnserialize("   ")).toThrow("入力が空です");
  });

  it("should throw on unknown type token", () => {
    expect(() => phpUnserialize("X:1;")).toThrow();
  });

  it("should throw on malformed array (missing closing brace)", () => {
    expect(() => phpUnserialize("a:2:{i:0;i:1;")).toThrow();
  });
});

describe("Round-trip conversion", () => {
  it("should preserve null", () => {
    expect(phpUnserialize(phpSerialize(null))).toBeNull();
  });

  it("should preserve boolean true", () => {
    expect(phpUnserialize(phpSerialize(true))).toBe(true);
  });

  it("should preserve boolean false", () => {
    expect(phpUnserialize(phpSerialize(false))).toBe(false);
  });

  it("should preserve integer", () => {
    expect(phpUnserialize(phpSerialize(99))).toBe(99);
  });

  it("should preserve float", () => {
    expect(phpUnserialize(phpSerialize(1.5))).toBeCloseTo(1.5);
  });

  it("should preserve ASCII string", () => {
    expect(phpUnserialize(phpSerialize("hello world"))).toBe("hello world");
  });

  it("should preserve Japanese string", () => {
    expect(phpUnserialize(phpSerialize("こんにちは"))).toBe("こんにちは");
  });

  it("should preserve indexed array", () => {
    expect(phpUnserialize(phpSerialize([1, 2, 3]))).toEqual([1, 2, 3]);
  });

  it("should preserve associative array", () => {
    const original = { key: "value", count: 5 };
    expect(phpUnserialize(phpSerialize(original))).toEqual(original);
  });

  it("should preserve nested structures", () => {
    const original = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
    };
    expect(phpUnserialize(phpSerialize(original))).toEqual(original);
  });

  it("should preserve PHP object", () => {
    const original = {
      __className: "Product",
      properties: { price: 99, name: "Widget" },
    };
    expect(phpUnserialize(phpSerialize(original))).toEqual(original);
  });
});
