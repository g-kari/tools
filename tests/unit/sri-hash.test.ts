import { describe, it, expect } from "vitest";
import {
  bytesToBase64,
  computeSriHash,
  computeAllSriHashes,
  computeAllSriHashesFromBytes,
  generateScriptSnippet,
  generateLinkSnippet,
  generateHtmlSnippet,
  formatFileSize,
} from "../../app/utils/sri-hash";

describe("bytesToBase64", () => {
  it("空のバイト配列を空文字列に変換する", () => {
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });

  it("バイト配列を正しく Base64 に変換する", () => {
    // "Man" → "TWFu"
    const bytes = new Uint8Array([77, 97, 110]);
    expect(bytesToBase64(bytes)).toBe("TWFu");
  });

  it("単一バイトを Base64 に変換する", () => {
    expect(bytesToBase64(new Uint8Array([0]))).toBe("AA==");
    expect(bytesToBase64(new Uint8Array([255]))).toBe("/w==");
  });
});

describe("computeSriHash", () => {
  it("SHA-256 の integrity 値を正しいフォーマットで生成する", async () => {
    const data = new TextEncoder().encode("hello");
    const result = await computeSriHash("sha256", data);
    expect(result.algorithm).toBe("sha256");
    expect(result.integrity).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/);
    expect(result.hash).toBeTruthy();
  });

  it("SHA-384 の integrity 値を正しいフォーマットで生成する", async () => {
    const data = new TextEncoder().encode("hello");
    const result = await computeSriHash("sha384", data);
    expect(result.algorithm).toBe("sha384");
    expect(result.integrity).toMatch(/^sha384-[A-Za-z0-9+/]+=*$/);
    expect(result.hash).toBeTruthy();
  });

  it("SHA-512 の integrity 値を正しいフォーマットで生成する", async () => {
    const data = new TextEncoder().encode("hello");
    const result = await computeSriHash("sha512", data);
    expect(result.algorithm).toBe("sha512");
    expect(result.integrity).toMatch(/^sha512-[A-Za-z0-9+/]+=*$/);
    expect(result.hash).toBeTruthy();
  });

  it("integrity 値は 'algorithm-base64hash' フォーマットになる", async () => {
    const data = new TextEncoder().encode("test");
    const result = await computeSriHash("sha384", data);
    expect(result.integrity).toBe(`sha384-${result.hash}`);
  });

  it("同じ入力から同じハッシュが生成される（冪等性）", async () => {
    const data = new TextEncoder().encode("hello world");
    const result1 = await computeSriHash("sha256", data);
    const result2 = await computeSriHash("sha256", data);
    expect(result1.integrity).toBe(result2.integrity);
  });

  it("異なる入力から異なるハッシュが生成される", async () => {
    const data1 = new TextEncoder().encode("hello");
    const data2 = new TextEncoder().encode("world");
    const result1 = await computeSriHash("sha256", data1);
    const result2 = await computeSriHash("sha256", data2);
    expect(result1.integrity).not.toBe(result2.integrity);
  });

  it("既知のハッシュ値を検証する（SHA-256 of empty string）", async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    // Base64: 47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=
    const data = new Uint8Array(0);
    const result = await computeSriHash("sha256", data);
    expect(result.hash).toBe("47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");
    expect(result.integrity).toBe(
      "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    );
  });
});

describe("computeAllSriHashes", () => {
  it("3 つのアルゴリズム (sha256, sha384, sha512) の結果を返す", async () => {
    const results = await computeAllSriHashes("hello");
    expect(results).toHaveLength(3);
    expect(results[0].algorithm).toBe("sha256");
    expect(results[1].algorithm).toBe("sha384");
    expect(results[2].algorithm).toBe("sha512");
  });

  it("各結果に正しい integrity 値が含まれる", async () => {
    const results = await computeAllSriHashes("test content");
    for (const result of results) {
      expect(result.integrity).toMatch(
        /^(sha256|sha384|sha512)-[A-Za-z0-9+/]+=*$/,
      );
    }
  });

  it("空文字列でもエラーなく動作する", async () => {
    const results = await computeAllSriHashes("");
    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.integrity).toBeTruthy();
    }
  });
});

describe("computeAllSriHashesFromBytes", () => {
  it("バイト配列から 3 つのアルゴリズムの結果を返す", async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const results = await computeAllSriHashesFromBytes(data);
    expect(results).toHaveLength(3);
  });

  it("テキストと同一バイト列から同じハッシュが生成される", async () => {
    const text = "consistency check";
    const textResults = await computeAllSriHashes(text);
    const byteResults = await computeAllSriHashesFromBytes(
      new TextEncoder().encode(text),
    );
    for (let i = 0; i < 3; i++) {
      expect(textResults[i].integrity).toBe(byteResults[i].integrity);
    }
  });
});

describe("generateScriptSnippet", () => {
  it("script タグを正しく生成する", () => {
    const snippet = generateScriptSnippet({
      url: "https://example.com/app.js",
      integrity: "sha384-abc123",
      crossorigin: "anonymous",
      resourceType: "script",
    });
    expect(snippet).toBe(
      '<script src="https://example.com/app.js" integrity="sha384-abc123" crossorigin="anonymous"></script>',
    );
  });

  it("URL が空の場合は例示 URL を使用する", () => {
    const snippet = generateScriptSnippet({
      url: "",
      integrity: "sha384-abc123",
      crossorigin: "anonymous",
      resourceType: "script",
    });
    expect(snippet).toContain("https://example.com/script.js");
  });

  it("use-credentials crossorigin を反映する", () => {
    const snippet = generateScriptSnippet({
      url: "https://cdn.example.com/lib.js",
      integrity: "sha256-xyz",
      crossorigin: "use-credentials",
      resourceType: "script",
    });
    expect(snippet).toContain('crossorigin="use-credentials"');
  });
});

describe("generateLinkSnippet", () => {
  it("link タグを正しく生成する", () => {
    const snippet = generateLinkSnippet({
      url: "https://example.com/style.css",
      integrity: "sha384-def456",
      crossorigin: "anonymous",
      resourceType: "stylesheet",
    });
    expect(snippet).toBe(
      '<link rel="stylesheet" href="https://example.com/style.css" integrity="sha384-def456" crossorigin="anonymous">',
    );
  });

  it("URL が空の場合は例示 URL を使用する", () => {
    const snippet = generateLinkSnippet({
      url: "",
      integrity: "sha384-def456",
      crossorigin: "anonymous",
      resourceType: "stylesheet",
    });
    expect(snippet).toContain("https://example.com/style.css");
  });
});

describe("generateHtmlSnippet", () => {
  it("script 種別で script タグを生成する", () => {
    const snippet = generateHtmlSnippet({
      url: "https://example.com/app.js",
      integrity: "sha384-abc",
      crossorigin: "anonymous",
      resourceType: "script",
    });
    expect(snippet).toMatch(/^<script /);
    expect(snippet).toMatch(/<\/script>$/);
  });

  it("stylesheet 種別で link タグを生成する", () => {
    const snippet = generateHtmlSnippet({
      url: "https://example.com/style.css",
      integrity: "sha384-def",
      crossorigin: "anonymous",
      resourceType: "stylesheet",
    });
    expect(snippet).toMatch(/^<link /);
    expect(snippet).toContain('rel="stylesheet"');
  });
});

describe("formatFileSize", () => {
  it("1024 バイト未満をバイト表示する", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("1024 バイト以上を KB 表示する", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("1MB 以上を MB 表示する", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });
});
