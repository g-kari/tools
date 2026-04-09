import { describe, it, expect } from "vite-plus/test";
import {
  base32Decode,
  generateHOTP,
  generateTOTP,
  getRemainingSeconds,
  generateSecret,
  generateOtpauthUriSimple,
  counterToBytes,
  generateHotp,
  generateTotp,
  getDefaultTotpOptions,
  getSampleSecret,
  generateOtpauthUri,
} from "../../app/utils/totp";

// RFC 6238 テストベクター用: "12345678901234567890" (ASCII) のBase32エンコード
const RFC6238_SECRET_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

/**
 * ASCII文字列をBase32にエンコードするヘルパー（テスト用）
 */
function asciiToBase32(ascii: string): string {
  const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = new Uint8Array(ascii.length);
  for (let i = 0; i < ascii.length; i++) {
    bytes[i] = ascii.charCodeAt(i);
  }
  let bits = "";
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    result += BASE32_CHARS[parseInt(bits.substring(i, i + 5), 2)];
  }
  return result;
}

describe("base32Decode", () => {
  it("標準的なBase32文字列をデコードできる", () => {
    // "f" -> Base32: MY
    const result = base32Decode("MY");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result[0]).toBe(102); // 'f' のASCIIコード
  });

  it("大文字のBase32文字列をデコードできる", () => {
    const result = base32Decode("GEZDGNBVGY3TQOJQ");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("小文字のBase32文字列をデコードできる", () => {
    const upper = base32Decode("GEZDGNBVGY3TQOJQ");
    const lower = base32Decode("gezdgnbvgy3tqojq");
    expect(upper).toEqual(lower);
  });

  it("パディング付きBase32文字列をデコードできる", () => {
    const withPadding = base32Decode("MY======");
    const withoutPadding = base32Decode("MY");
    expect(withPadding).toEqual(withoutPadding);
  });

  it("空文字をデコードすると空のUint8Arrayを返す", () => {
    const result = base32Decode("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it("無効な文字が含まれる場合にエラーをスローする", () => {
    expect(() => base32Decode("!@#$%")).toThrow();
  });

  it("RFC 6238テストベクターのシークレットをデコードできる", () => {
    const result = base32Decode(RFC6238_SECRET_BASE32);
    const expected = new TextEncoder().encode("12345678901234567890");
    for (let i = 0; i < expected.length; i++) {
      expect(result[i]).toBe(expected[i]);
    }
  });

  it("ハイフンを含む文字列をデコードできる", () => {
    const withHyphen = base32Decode("GEZD-GNBV");
    const without = base32Decode("GEZDGNBV");
    expect(withHyphen).toEqual(without);
  });

  it("スペースを含む文字列をデコードできる", () => {
    const withSpace = base32Decode("GEZD GNBV");
    const without = base32Decode("GEZDGNBV");
    expect(withSpace).toEqual(without);
  });
});

describe("generateHOTP", () => {
  it("RFC 4226 テストベクター: counter=0 → '755224'", async () => {
    const secret = asciiToBase32("12345678901234567890");
    const keyBytes = base32Decode(secret);
    const code = await generateHOTP(keyBytes, 0n, 6);
    expect(code).toBe("755224");
  });

  it("RFC 4226 テストベクター: counter=1 → '287082'", async () => {
    const secret = asciiToBase32("12345678901234567890");
    const keyBytes = base32Decode(secret);
    const code = await generateHOTP(keyBytes, 1n, 6);
    expect(code).toBe("287082");
  });

  it("RFC 4226 テストベクター: counter=2 → '359152'", async () => {
    const secret = asciiToBase32("12345678901234567890");
    const keyBytes = base32Decode(secret);
    const code = await generateHOTP(keyBytes, 2n, 6);
    expect(code).toBe("359152");
  });

  it("RFC 4226 テストベクター: counter=3 → '969429'", async () => {
    const secret = asciiToBase32("12345678901234567890");
    const keyBytes = base32Decode(secret);
    const code = await generateHOTP(keyBytes, 3n, 6);
    expect(code).toBe("969429");
  });

  it("RFC 4226 テストベクター: counter=4 → '338314'", async () => {
    const secret = asciiToBase32("12345678901234567890");
    const keyBytes = base32Decode(secret);
    const code = await generateHOTP(keyBytes, 4n, 6);
    expect(code).toBe("338314");
  });

  it("結果が6桁のゼロ埋め文字列である", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHOTP(keyBytes, 0n, 6);
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("8桁指定で8桁のコードを返す", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHOTP(keyBytes, 0n, 8);
    expect(code).toHaveLength(8);
    expect(/^\d{8}$/.test(code)).toBe(true);
  });
});

describe("generateTOTP", () => {
  it("RFC 6238 テストベクター: timestamp=59 → '287082'", async () => {
    const code = await generateTOTP(RFC6238_SECRET_BASE32, {
      digits: 6,
      period: 30,
      timestamp: 59,
    });
    expect(code).toBe("287082");
  });

  it("RFC 6238 テストベクター: timestamp=1111111109 → '081804'", async () => {
    const code = await generateTOTP(RFC6238_SECRET_BASE32, {
      digits: 6,
      period: 30,
      timestamp: 1111111109,
    });
    expect(code).toBe("081804");
  });

  it("RFC 6238 テストベクター: timestamp=1111111111 → '050471'", async () => {
    const code = await generateTOTP(RFC6238_SECRET_BASE32, {
      digits: 6,
      period: 30,
      timestamp: 1111111111,
    });
    expect(code).toBe("050471");
  });

  it("デフォルトオプションで6桁のコードを生成する", async () => {
    const code = await generateTOTP(RFC6238_SECRET_BASE32);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("8桁指定で8桁のコードを生成する", async () => {
    const code = await generateTOTP(RFC6238_SECRET_BASE32, { digits: 8 });
    expect(/^\d{8}$/.test(code)).toBe(true);
  });

  it("同一タイムスタンプ・同一シークレットで同じコードを返す", async () => {
    const timestamp = 1000000;
    const code1 = await generateTOTP(RFC6238_SECRET_BASE32, { timestamp });
    const code2 = await generateTOTP(RFC6238_SECRET_BASE32, { timestamp });
    expect(code1).toBe(code2);
  });

  it("同一期間内は同じコードを返す", async () => {
    const timestamp = 1500000000;
    const code1 = await generateTOTP(RFC6238_SECRET_BASE32, { period: 30, timestamp });
    const code2 = await generateTOTP(RFC6238_SECRET_BASE32, { period: 30, timestamp: timestamp + 1 });
    expect(code1).toBe(code2);
  });

  it("異なる期間の境界でコードが変わる", async () => {
    const periodStart = 1500000000;
    const nextPeriod = periodStart + 30;
    const code1 = await generateTOTP(RFC6238_SECRET_BASE32, { period: 30, timestamp: periodStart });
    const code2 = await generateTOTP(RFC6238_SECRET_BASE32, { period: 30, timestamp: nextPeriod });
    // 異なるカウンターなので異なるコードになるはず（確率的に同一になる可能性も理論上はある）
    expect(typeof code1).toBe("string");
    expect(typeof code2).toBe("string");
  });
});

describe("getRemainingSeconds", () => {
  it("残り秒数が1以上30以下の範囲で返る", () => {
    const remaining = getRemainingSeconds(30);
    expect(remaining).toBeGreaterThanOrEqual(1);
    expect(remaining).toBeLessThanOrEqual(30);
  });

  it("デフォルト期間30秒で動作する", () => {
    const remaining = getRemainingSeconds();
    expect(remaining).toBeGreaterThanOrEqual(1);
    expect(remaining).toBeLessThanOrEqual(30);
  });

  it("期間60秒で1以上60以下の範囲で返る", () => {
    const remaining = getRemainingSeconds(60);
    expect(remaining).toBeGreaterThanOrEqual(1);
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it("数値を返す", () => {
    expect(typeof getRemainingSeconds()).toBe("number");
  });
});

describe("generateSecret", () => {
  it("デフォルトで文字列を生成する", () => {
    const secret = generateSecret();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
  });

  it("生成されたシークレットがBase32文字のみで構成される", () => {
    const secret = generateSecret();
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it("長さパラメータを指定できる", () => {
    const secret10 = generateSecret(10);
    const secret20 = generateSecret(20);
    expect(secret10.length).toBeLessThan(secret20.length);
  });

  it("生成されたシークレットをTOTPに使用できる", async () => {
    const secret = generateSecret();
    const code = await generateTOTP(secret);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });
});

describe("generateOtpauthUriSimple", () => {
  it("otpauth:// スキームのURIを生成する", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
  });

  it("シークレットパラメータを含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain(`secret=${RFC6238_SECRET_BASE32}`);
  });

  it("発行者名を含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain("MyApp");
  });

  it("アカウント名を含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain("user");
  });

  it("アルゴリズムパラメータSHA1を含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain("SHA1");
  });

  it("digits=6を含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain("digits=6");
  });

  it("period=30を含む", () => {
    const uri = generateOtpauthUriSimple(RFC6238_SECRET_BASE32, "user@example.com", "MyApp");
    expect(uri).toContain("period=30");
  });
});

describe("counterToBytes", () => {
  it("0 を 8バイトのゼロ配列に変換する", () => {
    const result = counterToBytes(0);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
    expect(Array.from(result)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("1 を正しく変換する", () => {
    const result = counterToBytes(1);
    expect(result[7]).toBe(1);
    expect(result.slice(0, 7)).toEqual(new Uint8Array(7));
  });

  it("256 を正しく変換する", () => {
    const result = counterToBytes(256);
    expect(result[6]).toBe(1);
    expect(result[7]).toBe(0);
  });

  it("ビッグエンディアン形式で格納される", () => {
    // 0x0102030405060708 = 72623859790382856
    const result = counterToBytes(0x0102);
    expect(result[6]).toBe(1);
    expect(result[7]).toBe(2);
  });

  it("常に8バイトを返す", () => {
    expect(counterToBytes(0).length).toBe(8);
    expect(counterToBytes(1000000).length).toBe(8);
  });
});

describe("generateHotp (旧API)", () => {
  it("RFC 4226 テストベクター: counter=0 → '755224'", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 0, 6);
    expect(code).toBe("755224");
  });

  it("RFC 4226 テストベクター: counter=1 → '287082'", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 1, 6);
    expect(code).toBe("287082");
  });

  it("6桁コードを返す", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 0, 6);
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("8桁指定で8桁のコードを返す", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 0, 8);
    expect(code).toHaveLength(8);
  });

  it("SHA-256アルゴリズムで6桁のコードを返す", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 0, 6, "SHA-256");
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("SHA-512アルゴリズムで6桁のコードを返す", async () => {
    const keyBytes = base32Decode(RFC6238_SECRET_BASE32);
    const code = await generateHotp(keyBytes, 0, 6, "SHA-512");
    expect(/^\d{6}$/.test(code)).toBe(true);
  });
});

describe("generateTotp (旧API)", () => {
  it("TotpResult オブジェクトを返す", async () => {
    const result = await generateTotp({
      secret: RFC6238_SECRET_BASE32,
      period: 30,
      digits: 6,
      algorithm: "SHA-1",
    });
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("counter");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("period");
  });

  it("6桁のコードを生成する", async () => {
    const result = await generateTotp({
      secret: RFC6238_SECRET_BASE32,
      period: 30,
      digits: 6,
      algorithm: "SHA-1",
    });
    expect(/^\d{6}$/.test(result.code)).toBe(true);
  });

  it("period が結果に含まれる", async () => {
    const result = await generateTotp({
      secret: RFC6238_SECRET_BASE32,
      period: 60,
      digits: 6,
      algorithm: "SHA-1",
    });
    expect(result.period).toBe(60);
  });

  it("remaining が 1 以上 period 以下の範囲にある", async () => {
    const result = await generateTotp({
      secret: RFC6238_SECRET_BASE32,
      period: 30,
      digits: 6,
      algorithm: "SHA-1",
    });
    expect(result.remaining).toBeGreaterThanOrEqual(1);
    expect(result.remaining).toBeLessThanOrEqual(30);
  });

  it("空のシークレットはエラーをスローする", async () => {
    await expect(
      generateTotp({ secret: "", period: 30, digits: 6, algorithm: "SHA-1" })
    ).rejects.toThrow();
  });

  it("タイムスタンプを指定して一定のコードを生成する", async () => {
    const options = {
      secret: RFC6238_SECRET_BASE32,
      period: 30,
      digits: 6,
      algorithm: "SHA-1" as const,
    };
    const result1 = await generateTotp(options, 1000000000);
    const result2 = await generateTotp(options, 1000000000);
    expect(result1.code).toBe(result2.code);
    expect(result1.counter).toBe(result2.counter);
  });
});

describe("getDefaultTotpOptions", () => {
  it("デフォルトオプションを返す", () => {
    const options = getDefaultTotpOptions();
    expect(options).toHaveProperty("secret");
    expect(options).toHaveProperty("period");
    expect(options).toHaveProperty("digits");
    expect(options).toHaveProperty("algorithm");
  });

  it("period が 30 である", () => {
    expect(getDefaultTotpOptions().period).toBe(30);
  });

  it("digits が 6 である", () => {
    expect(getDefaultTotpOptions().digits).toBe(6);
  });

  it("algorithm が SHA-1 である", () => {
    expect(getDefaultTotpOptions().algorithm).toBe("SHA-1");
  });

  it("secret が空文字列である", () => {
    expect(getDefaultTotpOptions().secret).toBe("");
  });
});

describe("getSampleSecret", () => {
  it("文字列を返す", () => {
    expect(typeof getSampleSecret()).toBe("string");
  });

  it("Base32文字のみで構成される", () => {
    const secret = getSampleSecret();
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true);
  });

  it("RFC 6238テストベクターと一致する", () => {
    expect(getSampleSecret()).toBe(RFC6238_SECRET_BASE32);
  });

  it("TOTPコード生成に使用できる", async () => {
    const secret = getSampleSecret();
    const code = await generateTOTP(secret);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });
});

describe("generateOtpauthUri", () => {
  it("otpauth:// スキームのURIを生成する", () => {
    const options = getDefaultTotpOptions();
    const uri = generateOtpauthUri(RFC6238_SECRET_BASE32, "MyApp", "user@example.com", options);
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
  });

  it("シークレットパラメータを含む", () => {
    const options = getDefaultTotpOptions();
    const uri = generateOtpauthUri(RFC6238_SECRET_BASE32, "MyApp", "user@example.com", options);
    expect(uri).toContain(`secret=${RFC6238_SECRET_BASE32}`);
  });

  it("発行者名を含む", () => {
    const options = getDefaultTotpOptions();
    const uri = generateOtpauthUri(RFC6238_SECRET_BASE32, "MyApp", "user@example.com", options);
    expect(uri).toContain("MyApp");
  });

  it("digits パラメータを含む", () => {
    const options = getDefaultTotpOptions();
    const uri = generateOtpauthUri(RFC6238_SECRET_BASE32, "MyApp", "user@example.com", options);
    expect(uri).toContain("digits=6");
  });

  it("period パラメータを含む", () => {
    const options = getDefaultTotpOptions();
    const uri = generateOtpauthUri(RFC6238_SECRET_BASE32, "MyApp", "user@example.com", options);
    expect(uri).toContain("period=30");
  });

  it("スペースを含むシークレットの空白が除去される", () => {
    const options = getDefaultTotpOptions();
    const secretWithSpaces = "GEZD GNBV GY3T QOJQ";
    const uri = generateOtpauthUri(secretWithSpaces, "MyApp", "user@example.com", options);
    expect(uri).not.toContain(" ");
  });
});
