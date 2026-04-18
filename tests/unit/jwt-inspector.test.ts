import { describe, expect, it } from "vite-plus/test";
import {
  analyzeClaims,
  base64UrlToBytes,
  generateJWT,
  pemToSpki,
  verifyJwt,
} from "../../app/utils/jwt";

describe("analyzeClaims", () => {
  const now = 1700000000;

  it("exp/iat/nbf すべて未設定のとき present=false を返す", () => {
    const result = analyzeClaims("{}", now);
    expect(result.exp.present).toBe(false);
    expect(result.iat.present).toBe(false);
    expect(result.nbf.present).toBe(false);
    expect(result.currentTime).toBe(now);
  });

  it("exp が現在時刻より未来なら invalid=false、残り秒を返す", () => {
    const result = analyzeClaims(JSON.stringify({ exp: now + 60 }), now);
    expect(result.exp.present).toBe(true);
    expect(result.exp.invalid).toBe(false);
    expect(result.exp.deltaSeconds).toBe(60);
  });

  it("exp が現在時刻以前なら invalid=true を返す", () => {
    const result = analyzeClaims(JSON.stringify({ exp: now - 1 }), now);
    expect(result.exp.invalid).toBe(true);
    expect(result.exp.deltaSeconds).toBe(-1);
  });

  it("exp が現在時刻と等しい場合は invalid=true（RFC 7519 §4.1.4: current time MUST be before exp）", () => {
    const result = analyzeClaims(JSON.stringify({ exp: now }), now);
    expect(result.exp.invalid).toBe(true);
    expect(result.exp.deltaSeconds).toBe(0);
  });

  it("nbf が現在時刻より未来なら invalid=true（まだ発効していない）", () => {
    const result = analyzeClaims(JSON.stringify({ nbf: now + 30 }), now);
    expect(result.nbf.invalid).toBe(true);
    expect(result.nbf.deltaSeconds).toBe(30);
  });

  it("iat は経過時間（秒）を deltaSeconds に入れる", () => {
    const result = analyzeClaims(JSON.stringify({ iat: now - 120 }), now);
    expect(result.iat.present).toBe(true);
    expect(result.iat.deltaSeconds).toBe(120);
    expect(result.iat.invalid).toBeUndefined();
  });

  it("非数値の exp は無視する", () => {
    const result = analyzeClaims(JSON.stringify({ exp: "not-a-number" }), now);
    expect(result.exp.present).toBe(false);
  });

  it("不正なJSONは全クレーム未設定として返す", () => {
    const result = analyzeClaims("{invalid json", now);
    expect(result.exp.present).toBe(false);
    expect(result.iat.present).toBe(false);
    expect(result.nbf.present).toBe(false);
  });
});

describe("base64UrlToBytes", () => {
  it("Base64URL 文字列をバイト列へ変換する", () => {
    const bytes = base64UrlToBytes("SGVsbG8");
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it("URL安全文字（- _）を正しく扱う", () => {
    // "+/" を URL-safe にすると "-_" に対応する
    const bytes = base64UrlToBytes("-_8");
    expect(Array.from(bytes)).toEqual([0xfb, 0xff]);
  });
});

describe("pemToSpki", () => {
  it("BEGIN/END と改行を除去して Base64 デコードする", () => {
    // "hello" を Base64 エンコードした文字列
    const pem = "-----BEGIN PUBLIC KEY-----\naGVsbG8=\n-----END PUBLIC KEY-----";
    const bytes = pemToSpki(pem);
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });

  it("空の PEM はエラー", () => {
    expect(() => pemToSpki("-----BEGIN PUBLIC KEY-----\n-----END PUBLIC KEY-----")).toThrow();
  });
});

describe("verifyJwt (HS256/384/512)", () => {
  it("正しいシークレットで HS256 署名を検証できる", async () => {
    const generated = await generateJWT({
      payload: '{"sub":"42"}',
      secret: "correct-secret",
      algorithm: "HS256",
    });
    const result = await verifyJwt(generated.token, "correct-secret");
    expect(result.verified).toBe(true);
    expect(result.algorithm).toBe("HS256");
  });

  it("誤ったシークレットでは検証失敗", async () => {
    const generated = await generateJWT({
      payload: '{"sub":"42"}',
      secret: "correct-secret",
      algorithm: "HS256",
    });
    const result = await verifyJwt(generated.token, "wrong-secret");
    expect(result.verified).toBe(false);
    expect(result.algorithm).toBe("HS256");
  });

  it("HS384 の署名を検証できる", async () => {
    const generated = await generateJWT({
      payload: '{"x":1}',
      secret: "sec384",
      algorithm: "HS384",
    });
    const result = await verifyJwt(generated.token, "sec384");
    expect(result.verified).toBe(true);
    expect(result.algorithm).toBe("HS384");
  });

  it("HS512 の署名を検証できる", async () => {
    const generated = await generateJWT({
      payload: '{"x":1}',
      secret: "sec512",
      algorithm: "HS512",
    });
    const result = await verifyJwt(generated.token, "sec512");
    expect(result.verified).toBe(true);
    expect(result.algorithm).toBe("HS512");
  });

  it("改竄されたペイロードは検証失敗", async () => {
    const generated = await generateJWT({
      payload: '{"sub":"42"}',
      secret: "secret",
      algorithm: "HS256",
    });
    const [h, , s] = generated.token.split(".");
    // ペイロード部を別の値に差し替え
    const tampered = `${h}.eyJzdWIiOiI5OSJ9.${s}`;
    const result = await verifyJwt(tampered, "secret");
    expect(result.verified).toBe(false);
  });

  it("3セグメントでないトークンはエラー", async () => {
    const result = await verifyJwt("abc.def", "secret");
    expect(result.verified).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("alg=none は常に verified=false", async () => {
    // { "alg": "none" } ヘッダーを作成
    const header = btoa('{"alg":"none","typ":"JWT"}')
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa('{"sub":"42"}').replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const token = `${header}.${payload}.sig`;
    const result = await verifyJwt(token, "");
    expect(result.verified).toBe(false);
    expect(result.algorithm).toBe("none");
  });

  it("未対応アルゴリズムは verified=false + エラー", async () => {
    const header = btoa('{"alg":"PS256"}')
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa('{"sub":"x"}').replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const token = `${header}.${payload}.sig`;
    const result = await verifyJwt(token, "any");
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/未対応/);
  });
});
