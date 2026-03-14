import { describe, expect, it } from "vitest";
import {
  base64UrlEncode,
  generateJWT,
  type JwtAlgorithm,
} from "../../app/utils/jwt";

describe("base64UrlEncode", () => {
  it("通常の文字列をBase64URLエンコードする", () => {
    const result = base64UrlEncode('{"alg":"HS256","typ":"JWT"}');
    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("パディング文字(=)が含まれない", () => {
    expect(base64UrlEncode("hello")).not.toContain("=");
    expect(base64UrlEncode("hello world")).not.toContain("=");
  });

  it("+が-に変換される", () => {
    // Base64で+が生成されるデータ
    const result = base64UrlEncode("\xfb"); // バイナリデータ
    expect(result).not.toContain("+");
  });

  it("/が_に変換される", () => {
    const result = base64UrlEncode("\xff"); // バイナリデータ
    expect(result).not.toContain("/");
  });

  it("空文字列をエンコードする", () => {
    expect(base64UrlEncode("")).toBe("");
  });
});

describe("generateJWT", () => {
  it("HS256でJWTを生成する", async () => {
    const result = await generateJWT({
      payload: '{"sub":"1234567890","name":"Test User"}',
      secret: "mysecret",
      algorithm: "HS256",
    });
    expect(result.token).toBeDefined();
    const parts = result.token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("HS384でJWTを生成する", async () => {
    const result = await generateJWT({
      payload: '{"sub":"test"}',
      secret: "mysecret384",
      algorithm: "HS384",
    });
    expect(result.token.split(".")).toHaveLength(3);
  });

  it("HS512でJWTを生成する", async () => {
    const result = await generateJWT({
      payload: '{"sub":"test"}',
      secret: "mysecret512",
      algorithm: "HS512",
    });
    expect(result.token.split(".")).toHaveLength(3);
  });

  it("生成されたトークンのヘッダーにalgとtypが含まれる", async () => {
    const result = await generateJWT({
      payload: '{"sub":"test"}',
      secret: "secret",
      algorithm: "HS256",
    });
    const header = JSON.parse(result.header);
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("ペイロードにiatクレームが自動付与される", async () => {
    const beforeTime = Math.floor(Date.now() / 1000);
    const result = await generateJWT({
      payload: '{"sub":"test"}',
      secret: "secret",
      algorithm: "HS256",
    });
    const afterTime = Math.floor(Date.now() / 1000);
    const payload = JSON.parse(result.payload);
    expect(payload.iat).toBeGreaterThanOrEqual(beforeTime);
    expect(payload.iat).toBeLessThanOrEqual(afterTime);
  });

  it("無効なJSONペイロードでエラーをスローする", async () => {
    await expect(
      generateJWT({
        payload: "not-valid-json",
        secret: "secret",
        algorithm: "HS256",
      })
    ).rejects.toThrow();
  });

  it("空のシークレットはエラーをスローする（Web Crypto APIの制約）", async () => {
    // Web Crypto API は長さ0のキーをサポートしないため、空シークレットはエラーになる
    await expect(
      generateJWT({
        payload: '{"sub":"test"}',
        secret: "",
        algorithm: "HS256",
      })
    ).rejects.toThrow();
  });

  it("生成結果にheaderとpayloadのJSONが含まれる", async () => {
    const result = await generateJWT({
      payload: '{"sub":"1234"}',
      secret: "secret",
      algorithm: "HS256",
    });
    expect(() => JSON.parse(result.header)).not.toThrow();
    expect(() => JSON.parse(result.payload)).not.toThrow();
  });

  it("JWTトークンにBase64URL不正文字が含まれない", async () => {
    const result = await generateJWT({
      payload: '{"sub":"test","data":"some value with spaces"}',
      secret: "secretkey",
      algorithm: "HS256",
    });
    // Base64URLはスペース・+・/・=を含まない
    expect(result.token).not.toMatch(/[\s+/=]/);
  });
});

// JwtAlgorithm型のエクスポート確認
describe("JwtAlgorithm型", () => {
  it("JwtAlgorithmの型が正しく使用できる", async () => {
    const algorithms: JwtAlgorithm[] = ["HS256", "HS384", "HS512"];
    for (const algorithm of algorithms) {
      const result = await generateJWT({
        payload: '{"sub":"test"}',
        secret: "secret",
        algorithm,
      });
      const header = JSON.parse(result.header);
      expect(header.alg).toBe(algorithm);
    }
  });
});
