import { describe, it, expect } from "vite-plus/test";
import {
  generateSlug,
  isValidSlug,
  DEFAULT_SLUG_OPTIONS,
} from "../../app/utils/slug";

describe("generateSlug", () => {
  it("空文字列を返す（入力が空の場合）", () => {
    expect(generateSlug("")).toBe("");
  });

  it('"Hello World" を "hello-world" に変換する', () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it('"hello-world" は変化しない', () => {
    expect(generateSlug("hello-world")).toBe("hello-world");
  });

  it('"Hello World Foo" を "hello-world-foo" に変換する（大文字変換）', () => {
    expect(generateSlug("Hello World Foo")).toBe("hello-world-foo");
  });

  it('"hello   world" を "hello-world" に変換する（複数スペース縮約）', () => {
    expect(generateSlug("hello   world")).toBe("hello-world");
  });

  it('"hello_world-foo bar" を "hello-world-foo-bar" に変換する（混在区切り文字）', () => {
    expect(generateSlug("hello_world-foo bar")).toBe("hello-world-foo-bar");
  });

  it('separator: "underscore" で "Hello World" を "hello_world" に変換する', () => {
    expect(
      generateSlug("Hello World", {
        ...DEFAULT_SLUG_OPTIONS,
        separator: "underscore",
      })
    ).toBe("hello_world");
  });

  it('lowercase: false で "Hello World" を "Hello-World" に変換する', () => {
    expect(
      generateSlug("Hello World", { ...DEFAULT_SLUG_OPTIONS, lowercase: false })
    ).toBe("Hello-World");
  });

  it("maxLength: 10 で文字列を切り詰める", () => {
    const result = generateSlug("hello-world-foo", {
      ...DEFAULT_SLUG_OPTIONS,
      maxLength: 10,
    });
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("maxLength: null で制限なし", () => {
    const input = "hello world foo bar baz";
    const result = generateSlug(input, {
      ...DEFAULT_SLUG_OPTIONS,
      maxLength: null,
    });
    expect(result).toBe("hello-world-foo-bar-baz");
  });

  it('"café" を "cafe" に変換する（アクセント変換）', () => {
    expect(generateSlug("café")).toBe("cafe");
  });

  it('"naïve" を "naive" に変換する', () => {
    expect(generateSlug("naïve")).toBe("naive");
  });

  it('"über" を "uber" に変換する', () => {
    expect(generateSlug("über")).toBe("uber");
  });

  it('"こんにちは World" を "world" に変換する（日本語除去）', () => {
    expect(generateSlug("こんにちは World")).toBe("world");
  });

  it('"Hello　World"（全角スペース）を "hello-world" に変換する', () => {
    expect(generateSlug("Hello\u3000World")).toBe("hello-world");
  });

  it('先頭・末尾セパレーターを除去する（"-hello-" → "hello"）', () => {
    expect(generateSlug("-hello-")).toBe("hello");
  });

  it('maxLength後のセパレーターを除去する（"hello-world" maxLength:6 → "hello"）', () => {
    expect(
      generateSlug("hello-world", { ...DEFAULT_SLUG_OPTIONS, maxLength: 6 })
    ).toBe("hello");
  });
});

describe("isValidSlug", () => {
  it('"hello-world" は有効', () => {
    expect(isValidSlug("hello-world")).toBe(true);
  });

  it('"hello_world" は有効', () => {
    expect(isValidSlug("hello_world")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it('"こんにちは" は無効', () => {
    expect(isValidSlug("こんにちは")).toBe(false);
  });

  it('"hello!" は無効', () => {
    expect(isValidSlug("hello!")).toBe(false);
  });

  it('"-hello" は無効（先頭がセパレーター）', () => {
    expect(isValidSlug("-hello")).toBe(false);
  });

  it('"hello-" は無効（末尾がセパレーター）', () => {
    expect(isValidSlug("hello-")).toBe(false);
  });

  it('"helloworld123" は有効', () => {
    expect(isValidSlug("helloworld123")).toBe(true);
  });
});
