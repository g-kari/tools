import { describe, expect, it } from "vite-plus/test";
import { decodeBase32, encodeBase32Bytes, validateBase32 } from "../../app/utils/base32";

const vectors = [
  ["", "", ""],
  ["f", "MY======", "CO======"],
  ["fo", "MZXQ====", "CPNG===="],
  ["foo", "MZXW6===", "CPNMU==="],
  ["foob", "MZXW6YQ=", "CPNMUOG="],
  ["fooba", "MZXW6YTB", "CPNMUOJ1"],
  ["foobar", "MZXW6YTBOI======", "CPNMUOJ1E8======"],
] as const;

describe.each(["standard", "hex"] as const)("Base32 validation: %s", (variant) => {
  const alphabet =
    variant === "standard"
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
      : "0123456789ABCDEFGHIJKLMNOPQRSTUV";

  it.each(vectors)("keeps the RFC vector %s and supported input conveniences", (text, std, hex) => {
    const encoded = variant === "standard" ? std : hex;
    for (const input of [encoded, encoded.replace(/=+$/, ""), ` \n${encoded.toLowerCase()} \t`]) {
      expect(validateBase32(input, variant)).toBeNull();
      expect(decodeBase32(input, variant)).toMatchObject({ success: true, decoded: text });
    }
  });

  it.each([1, 3, 6, 9, 11, 14])(
    "rejects incomplete length %i through both entry points",
    (length) => {
      const input = alphabet[0].repeat(length);
      expect(validateBase32(input, variant)).toContain("文字数");
      expect(decodeBase32(input, variant)).toMatchObject({
        success: false,
        decoded: "",
        bytes: new Uint8Array(0),
      });
    },
  );

  it.each(["=", "======", "AA=", "AA=====", "AA=======", "AAAAA====", "AAAAAAAA=", "AA=AAAAA"])(
    "rejects malformed padding %s without partial output",
    (pattern) => {
      const input = pattern.replaceAll("A", alphabet[0]);
      const error = validateBase32(input, variant);
      expect(error).toContain("パディング");
      expect(decodeBase32(input, variant)).toEqual({
        success: false,
        decoded: "",
        bytes: new Uint8Array(0),
        error,
      });
    },
  );

  it.each([
    [2, 3],
    [4, 15],
    [5, 1],
    [7, 7],
  ] as const)("rejects all nonzero unused bits for remainder %i", (length, mask) => {
    for (let value = 1; value <= mask; value++) {
      const input = alphabet[0].repeat(length - 1) + alphabet[value];
      for (const candidate of [input, input + "=".repeat(8 - length)]) {
        expect(validateBase32(candidate, variant)).toContain("未使用ビット");
        expect(decodeBase32(candidate, variant)).toMatchObject({
          success: false,
          decoded: "",
          bytes: new Uint8Array(0),
        });
      }
    }
  });

  it("preserves every one-byte value and all tail lengths as binary data", () => {
    for (let length = 1; length <= 16; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 73 + length) % 256);
      for (const padding of [false, true]) {
        const encoded = encodeBase32Bytes(bytes, variant, padding).encoded;
        expect(validateBase32(encoded, variant)).toBeNull();
        expect(decodeBase32(encoded, variant).bytes).toEqual(bytes);
      }
    }
    for (let byte = 0; byte < 256; byte++) {
      const bytes = new Uint8Array([byte]);
      const encoded = encodeBase32Bytes(bytes, variant).encoded;
      expect(decodeBase32(encoded, variant).bytes).toEqual(bytes);
    }
  });
});

it.each(["ſA", "ß", "ＭＹ", "MY!=====", "MY\u200b======"])(
  "does not turn a non-alphabet character into accepted data: %s",
  (input) => {
    expect(validateBase32(input)).toContain("無効な文字");
    expect(decodeBase32(input).success).toBe(false);
  },
);
