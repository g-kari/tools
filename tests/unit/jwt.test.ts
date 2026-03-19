import { describe, expect, it } from "vitest";
import { base64UrlDecode, decodeJWT } from "../../app/utils/jwt";

// テスト用の既知JWTトークン
// Header: {"alg":"HS256","typ":"JWT"}
// Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const KNOWN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("base64UrlDecode", () => {
  it("標準的なBase64URL文字列をデコードする", () => {
    // eyJhbGciOiJIUzI1NiJ9 -> {"alg":"HS256"}
    const result = base64UrlDecode("eyJhbGciOiJIUzI1NiJ9");
    expect(result).toBe('{"alg":"HS256"}');
  });

  it("URLセーフ文字（-と_）を含む文字列をデコードする", () => {
    // Base64URLでは + -> -, / -> _
    const encoded = "eyJzdWIiOiIxMjM0NTY3ODkwIn0";
    const result = base64UrlDecode(encoded);
    expect(result).toBe('{"sub":"1234567890"}');
  });

  it("パディングなしの文字列をデコードする", () => {
    // Base64URLはパディング(=)を省略する
    const result = base64UrlDecode("dGVzdA");
    expect(result).toBe("test");
  });

  it("JWTのヘッダー部分をデコードする", () => {
    const headerEncoded = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const result = base64UrlDecode(headerEncoded);
    const parsed = JSON.parse(result);
    expect(parsed.alg).toBe("HS256");
    expect(parsed.typ).toBe("JWT");
  });

  it("JWTのペイロード部分をデコードする", () => {
    const payloadEncoded =
      "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ";
    const result = base64UrlDecode(payloadEncoded);
    const parsed = JSON.parse(result);
    expect(parsed.sub).toBe("1234567890");
    expect(parsed.name).toBe("John Doe");
    expect(parsed.iat).toBe(1516239022);
  });

  it("無効なBase64URL文字列でエラーをスローする", () => {
    expect(() => base64UrlDecode("!!!invalid!!!")).toThrow();
  });
});

describe("decodeJWT", () => {
  it("正常なJWTトークンをデコードする", () => {
    const result = decodeJWT(KNOWN_JWT);
    expect(result).toBeDefined();
    expect(result.header).toBeDefined();
    expect(result.payload).toBeDefined();
    expect(result.signature).toBeDefined();
  });

  it("ヘッダーにalgとtypが含まれる", () => {
    const result = decodeJWT(KNOWN_JWT);
    const header = JSON.parse(result.header);
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("ペイロードに正しいクレームが含まれる", () => {
    const result = decodeJWT(KNOWN_JWT);
    const payload = JSON.parse(result.payload);
    expect(payload.sub).toBe("1234567890");
    expect(payload.name).toBe("John Doe");
    expect(payload.iat).toBe(1516239022);
  });

  it("署名部分がそのまま返される", () => {
    const result = decodeJWT(KNOWN_JWT);
    expect(result.signature).toBe(
      "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    );
  });

  it("headerRawに生のJSON文字列が含まれる", () => {
    const result = decodeJWT(KNOWN_JWT);
    expect(() => JSON.parse(result.headerRaw)).not.toThrow();
  });

  it("payloadRawに生のJSON文字列が含まれる", () => {
    const result = decodeJWT(KNOWN_JWT);
    expect(() => JSON.parse(result.payloadRaw)).not.toThrow();
  });

  it("headerとpayloadはインデント付きJSONで整形されている", () => {
    const result = decodeJWT(KNOWN_JWT);
    // JSON.stringify(..., null, 2) の形式
    expect(result.header).toContain("\n");
    expect(result.payload).toContain("\n");
  });

  it("前後の空白を含むトークンを正常にデコードする", () => {
    const tokenWithSpaces = `  ${KNOWN_JWT}  `;
    const result = decodeJWT(tokenWithSpaces);
    const header = JSON.parse(result.header);
    expect(header.alg).toBe("HS256");
  });

  it("2パート構成のトークンでエラーをスローする", () => {
    expect(() => decodeJWT("header.payload")).toThrow();
  });

  it("4パート構成のトークンでエラーをスローする", () => {
    expect(() => decodeJWT("a.b.c.d")).toThrow();
  });

  it("空のヘッダーパートでエラーをスローする", () => {
    expect(() => decodeJWT(".payload.signature")).toThrow();
  });

  it("空のペイロードパートでエラーをスローする", () => {
    expect(() => decodeJWT("header..signature")).toThrow();
  });

  it("不正なBase64URLエンコードのヘッダーでエラーをスローする", () => {
    expect(() => decodeJWT("!!!.payload.signature")).toThrow();
  });

  it("JSONではないヘッダーでエラーをスローする", () => {
    // "notjson" をBase64URLエンコードすると "bm90anNvbg"
    expect(() =>
      decodeJWT("bm90anNvbg.eyJzdWIiOiJ0ZXN0In0.signature")
    ).toThrow();
  });

  it("expクレームを含むJWTをデコードする", () => {
    // Header: {"alg":"HS256","typ":"JWT"}
    // Payload: {"sub":"test","exp":9999999999}
    const tokenWithExp =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.dummy_signature";
    const result = decodeJWT(tokenWithExp);
    const payload = JSON.parse(result.payload);
    expect(payload.sub).toBe("test");
    expect(payload.exp).toBe(9999999999);
  });
});
