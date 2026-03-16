import { describe, it, expect } from "vitest";
import {
  base64UrlEncode,
  generateCodeVerifier,
  generateCodeChallengeS256,
  generateCodeChallengePlain,
  generatePkce,
  validateCodeVerifier,
} from "../../app/utils/pkce";

describe("base64UrlEncode", () => {
  it("標準の Base64 文字 + / を URL-safe な - _ に変換する", () => {
    // 0xFB (1111 1011) 0xEF (1110 1111) 0xBE (1011 1110) → Base64 "+/++" → URL-safe "-_--"
    const bytes = new Uint8Array([0xfb, 0xef, 0xbe]);
    const result = base64UrlEncode(bytes);
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("パディング = を除去する", () => {
    const bytes = new Uint8Array([0x01]);
    const result = base64UrlEncode(bytes);
    expect(result).not.toContain("=");
  });

  it("空バイト列を空文字列に変換する", () => {
    expect(base64UrlEncode(new Uint8Array([]))).toBe("");
  });
});

describe("generateCodeVerifier", () => {
  it("デフォルト（32バイト）で 43文字の文字列を返す", () => {
    const verifier = generateCodeVerifier(32);
    // 32 バイト → Base64URL で ceil(32 * 4 / 3) = 44 文字、パディング除去で 43 文字
    expect(verifier.length).toBe(43);
  });

  it("48バイトで 64 文字の文字列を返す", () => {
    const verifier = generateCodeVerifier(48);
    expect(verifier.length).toBe(64);
  });

  it("96バイトで 128 文字の文字列を返す", () => {
    const verifier = generateCodeVerifier(96);
    expect(verifier.length).toBe(128);
  });

  it("URL-safe な文字のみを含む", () => {
    const verifier = generateCodeVerifier(32);
    expect(/^[A-Za-z0-9\-._~]+$/.test(verifier)).toBe(true);
  });

  it("2回呼び出すと異なる値を返す（ランダム性）", () => {
    const v1 = generateCodeVerifier(32);
    const v2 = generateCodeVerifier(32);
    // 極めて稀に同一になる可能性はあるが、実用上は常に異なる
    expect(v1).not.toBe(v2);
  });
});

describe("generateCodeChallengeS256", () => {
  it("既知の code_verifier に対して正しい code_challenge を返す", async () => {
    // RFC 7636 Appendix B の例
    const verifier =
      "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallengeS256(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("S256 の結果は常に 43 文字（SHA-256 は 32 バイト → Base64URL で 43 文字）", async () => {
    const verifier = generateCodeVerifier(32);
    const challenge = await generateCodeChallengeS256(verifier);
    expect(challenge.length).toBe(43);
  });

  it("URL-safe な文字のみを含む", async () => {
    const verifier = generateCodeVerifier(32);
    const challenge = await generateCodeChallengeS256(verifier);
    expect(/^[A-Za-z0-9\-._~]+$/.test(challenge)).toBe(true);
  });

  it("同じ verifier からは同じ challenge が生成される（決定的）", async () => {
    const verifier = generateCodeVerifier(32);
    const c1 = await generateCodeChallengeS256(verifier);
    const c2 = await generateCodeChallengeS256(verifier);
    expect(c1).toBe(c2);
  });
});

describe("generateCodeChallengePlain", () => {
  it("plain メソッドは code_verifier をそのまま返す", () => {
    const verifier = "some-test-verifier-value";
    expect(generateCodeChallengePlain(verifier)).toBe(verifier);
  });
});

describe("generatePkce", () => {
  it("S256 メソッドで正しい PKCE ペアを生成する", async () => {
    const result = await generatePkce(32, "S256");
    expect(result.method).toBe("S256");
    expect(result.byteLength).toBe(32);
    expect(result.codeVerifier.length).toBe(43);
    expect(result.codeChallenge.length).toBe(43);
    expect(result.codeVerifier).not.toBe(result.codeChallenge);
  });

  it("plain メソッドでは code_verifier と code_challenge が同一", async () => {
    const result = await generatePkce(32, "plain");
    expect(result.method).toBe("plain");
    expect(result.codeVerifier).toBe(result.codeChallenge);
  });

  it("デフォルトは 32バイト・S256", async () => {
    const result = await generatePkce();
    expect(result.byteLength).toBe(32);
    expect(result.method).toBe("S256");
  });

  it("生成された code_challenge が code_verifier に対して正しい", async () => {
    const result = await generatePkce(32, "S256");
    const expected = await generateCodeChallengeS256(result.codeVerifier);
    expect(result.codeChallenge).toBe(expected);
  });
});

describe("validateCodeVerifier", () => {
  it("有効な code_verifier を受け入れる", () => {
    const verifier = generateCodeVerifier(32); // 43 文字
    const result = validateCodeVerifier(verifier);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(43);
  });

  it("空文字列を拒否する", () => {
    const result = validateCodeVerifier("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("空");
  });

  it("42 文字（短すぎる）を拒否する", () => {
    const short = "a".repeat(42);
    const result = validateCodeVerifier(short);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("43");
  });

  it("43 文字を受け入れる", () => {
    const valid = "a".repeat(43);
    const result = validateCodeVerifier(valid);
    expect(result.valid).toBe(true);
  });

  it("128 文字を受け入れる", () => {
    const valid = "a".repeat(128);
    const result = validateCodeVerifier(valid);
    expect(result.valid).toBe(true);
  });

  it("129 文字（長すぎる）を拒否する", () => {
    const long = "a".repeat(129);
    const result = validateCodeVerifier(long);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("128");
  });

  it("使用禁止文字（スペース）を拒否する", () => {
    const invalid = "a".repeat(42) + " ";
    const result = validateCodeVerifier(invalid);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("使用できない文字");
  });

  it("使用禁止文字（=）を拒否する", () => {
    const invalid = "a".repeat(42) + "=";
    const result = validateCodeVerifier(invalid);
    expect(result.valid).toBe(false);
  });

  it("許可文字 A-Z a-z 0-9 - . _ ~ はすべて受け入れる", () => {
    // 43 文字以上になるよう組み合わせる
    const verifier = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop-._~";
    const result = validateCodeVerifier(verifier);
    expect(result.valid).toBe(true);
  });

  it("length プロパティを正確に返す", () => {
    const verifier = "a".repeat(50);
    const result = validateCodeVerifier(verifier);
    expect(result.length).toBe(50);
  });
});
