import { describe, expect, it } from "vite-plus/test";
import { decodeBase58, encodeBase58Bytes } from "../../app/utils/base58";
import { decodeBase62, encodeBase62Bytes } from "../../app/utils/base62";

const codecs = [
  {
    name: "Bitcoin Base58",
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    encode: (bytes: Uint8Array) => encodeBase58Bytes(bytes, "bitcoin"),
    decode: (text: string) => decodeBase58(text, "bitcoin"),
  },
  {
    name: "Flickr Base58",
    alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
    encode: (bytes: Uint8Array) => encodeBase58Bytes(bytes, "flickr"),
    decode: (text: string) => decodeBase58(text, "flickr"),
  },
  {
    name: "Standard Base62 bytes",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    encode: (bytes: Uint8Array) => encodeBase62Bytes(bytes, "standard"),
    decode: (text: string) => decodeBase62(text, "standard"),
  },
  {
    name: "Lower-first Base62 bytes",
    alphabet: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    encode: (bytes: Uint8Array) => encodeBase62Bytes(bytes, "lower-first"),
    decode: (text: string) => decodeBase62(text, "lower-first"),
  },
];

/** Independent BigInt oracle; zero bytes are represented only by the prefix. */
function referenceEncode(bytes: Uint8Array, alphabet: string): string {
  let prefix = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    prefix += alphabet[0];
  }
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let encoded = "";
  const base = BigInt(alphabet.length);
  while (value > 0n) {
    encoded = alphabet[Number(value % base)] + encoded;
    value /= base;
  }
  return prefix + encoded;
}

for (const codec of codecs) {
  describe(`${codec.name}: exact zero-byte preservation`, () => {
    it.each([0, 1, 2, 3, 8, 32])("encodes exactly %i zero bytes", (length) => {
      const bytes = new Uint8Array(length);
      const result = codec.encode(bytes);
      expect(result).toEqual({
        encoded: codec.alphabet[0].repeat(length),
        inputBytes: length,
        outputLength: length,
      });
    });

    it.each([0, 1, 2, 3, 8, 32])("decodes exactly %i zero symbols", (length) => {
      const result = codec.decode(codec.alphabet[0].repeat(length));
      expect(result.success).toBe(true);
      expect(result.bytes).toEqual(new Uint8Array(length));
      expect(result.decoded).toBe("\0".repeat(length));
    });

    it("retains whitespace normalization for zero symbols", () => {
      const zero = codec.alphabet[0];
      const result = codec.decode(` \t${zero}\n${zero}\r\n`);
      expect(result.success).toBe(true);
      expect(result.bytes).toEqual(new Uint8Array([0, 0]));
    });

    it("matches an independent oracle and roundtrips every single byte", () => {
      for (let byte = 0; byte <= 255; byte++) {
        for (const prefixLength of [0, 1, 2]) {
          const bytes = new Uint8Array(prefixLength + 1);
          bytes[prefixLength] = byte;
          const expected = referenceEncode(bytes, codec.alphabet);
          expect(codec.encode(bytes).encoded).toBe(expected);
          const decoded = codec.decode(expected);
          expect(decoded.success).toBe(true);
          expect(decoded.bytes).toEqual(bytes);
        }
      }
    });

    it("preserves mixed binary and UTF-8 data with a zero prefix", () => {
      for (const bytes of [
        new Uint8Array([0, 0, 1, 0, 255, 0]),
        new Uint8Array([0, 255, 128, 0, 255]),
        new TextEncoder().encode("\0日本語\0"),
      ]) {
        const expected = referenceEncode(bytes, codec.alphabet);
        expect(codec.encode(bytes).encoded).toBe(expected);
        expect(codec.decode(expected).bytes).toEqual(bytes);
      }
    });
  });
}
