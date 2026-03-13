/**
 * Pure JS による MessagePack エンコード/デコードライブラリ
 * 外部依存なし、ブラウザ + Cloudflare Workers 対応
 */

/**
 * エンコード用バイト配列バッファ
 */
interface EncodeBuffer {
  bytes: number[];
}

/**
 * デコード用カーソル
 */
interface Cursor {
  offset: number;
}

/**
 * 整数をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param n - エンコード対象の整数
 */
function encodeInteger(buf: EncodeBuffer, n: number): void {
  if (n >= 0 && n <= 127) {
    // positive fixint（1バイト）
    buf.bytes.push(n);
  } else if (n >= -32 && n <= -1) {
    // negative fixint（1バイト）
    buf.bytes.push(n & 0xff);
  } else if (n >= 128 && n <= 255) {
    // uint8
    buf.bytes.push(0xcc, n);
  } else if (n >= 256 && n <= 65535) {
    // uint16
    buf.bytes.push(0xcd, (n >> 8) & 0xff, n & 0xff);
  } else if (n >= 65536 && n <= 4294967295) {
    // uint32
    buf.bytes.push(
      0xce,
      (n >>> 24) & 0xff,
      (n >>> 16) & 0xff,
      (n >>> 8) & 0xff,
      n & 0xff
    );
  } else if (n >= -128 && n <= -33) {
    // int8
    buf.bytes.push(0xd0, n & 0xff);
  } else if (n >= -32768 && n <= -129) {
    // int16
    buf.bytes.push(0xd1, (n >> 8) & 0xff, n & 0xff);
  } else if (n >= -2147483648 && n <= -32769) {
    // int32
    buf.bytes.push(
      0xd2,
      (n >> 24) & 0xff,
      (n >> 16) & 0xff,
      (n >> 8) & 0xff,
      n & 0xff
    );
  } else {
    // float64
    encodeFloat64(buf, n);
  }
}

/**
 * float64をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param n - エンコード対象の浮動小数点数
 */
function encodeFloat64(buf: EncodeBuffer, n: number): void {
  buf.bytes.push(0xcb);
  const ab = new ArrayBuffer(8);
  const dv = new DataView(ab);
  dv.setFloat64(0, n, false); // ビッグエンディアン
  for (let i = 0; i < 8; i++) {
    buf.bytes.push(dv.getUint8(i));
  }
}

/**
 * 文字列をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param s - エンコード対象の文字列
 */
function encodeString(buf: EncodeBuffer, s: string): void {
  const encoded = new TextEncoder().encode(s);
  const len = encoded.length;

  if (len <= 31) {
    // fixstr
    buf.bytes.push(0xa0 | len);
  } else if (len <= 255) {
    // str8
    buf.bytes.push(0xd9, len);
  } else if (len <= 65535) {
    // str16
    buf.bytes.push(0xda, (len >> 8) & 0xff, len & 0xff);
  } else if (len <= 4294967295) {
    // str32
    buf.bytes.push(
      0xdb,
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >> 8) & 0xff,
      len & 0xff
    );
  } else {
    throw new Error("文字列が長すぎます");
  }

  for (let i = 0; i < encoded.length; i++) {
    buf.bytes.push(encoded[i]);
  }
}

/**
 * 配列をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param arr - エンコード対象の配列
 */
function encodeArray(buf: EncodeBuffer, arr: unknown[]): void {
  const len = arr.length;

  if (len <= 15) {
    // fixarray
    buf.bytes.push(0x90 | len);
  } else if (len <= 65535) {
    // array16
    buf.bytes.push(0xdc, (len >> 8) & 0xff, len & 0xff);
  } else {
    // array32
    buf.bytes.push(
      0xdd,
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >> 8) & 0xff,
      len & 0xff
    );
  }

  for (const item of arr) {
    encodeValue(buf, item);
  }
}

/**
 * オブジェクト（マップ）をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param obj - エンコード対象のオブジェクト
 */
function encodeMap(buf: EncodeBuffer, obj: Record<string, unknown>): void {
  const keys = Object.keys(obj);
  const len = keys.length;

  if (len <= 15) {
    // fixmap
    buf.bytes.push(0x80 | len);
  } else if (len <= 65535) {
    // map16
    buf.bytes.push(0xde, (len >> 8) & 0xff, len & 0xff);
  } else {
    // map32
    buf.bytes.push(
      0xdf,
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >> 8) & 0xff,
      len & 0xff
    );
  }

  for (const key of keys) {
    encodeString(buf, key);
    encodeValue(buf, obj[key]);
  }
}

/**
 * 任意の値をエンコードしてバッファに追加する
 * @param buf - 出力バッファ
 * @param value - エンコード対象の値
 */
function encodeValue(buf: EncodeBuffer, value: unknown): void {
  if (value === null) {
    buf.bytes.push(0xc0);
  } else if (value === false) {
    buf.bytes.push(0xc2);
  } else if (value === true) {
    buf.bytes.push(0xc3);
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) {
      encodeInteger(buf, value);
    } else {
      encodeFloat64(buf, value);
    }
  } else if (typeof value === "string") {
    encodeString(buf, value);
  } else if (Array.isArray(value)) {
    encodeArray(buf, value);
  } else if (typeof value === "object") {
    encodeMap(buf, value as Record<string, unknown>);
  } else if (typeof value === "undefined") {
    throw new Error(`エンコード不可能な型です: undefined`);
  } else if (typeof value === "function") {
    throw new Error(`エンコード不可能な型です: function`);
  } else {
    throw new Error(`エンコード不可能な型です: ${typeof value}`);
  }
}

/**
 * デコード：単一の値を読み取る
 * @param data - デコード対象のUint8Array
 * @param cursor - 現在の読み取り位置
 * @returns デコードされた値
 */
function decodeValue(data: Uint8Array, cursor: Cursor): unknown {
  if (cursor.offset >= data.length) {
    throw new Error("予期しないデータ終端です");
  }

  const byte = data[cursor.offset++];

  // positive fixint (0x00 - 0x7f)
  if (byte <= 0x7f) {
    return byte;
  }

  // fixmap (0x80 - 0x8f)
  if (byte >= 0x80 && byte <= 0x8f) {
    return decodeMap(data, cursor, byte & 0x0f);
  }

  // fixarray (0x90 - 0x9f)
  if (byte >= 0x90 && byte <= 0x9f) {
    return decodeArray(data, cursor, byte & 0x0f);
  }

  // fixstr (0xa0 - 0xbf)
  if (byte >= 0xa0 && byte <= 0xbf) {
    return decodeString(data, cursor, byte & 0x1f);
  }

  // negative fixint (0xe0 - 0xff)
  if (byte >= 0xe0) {
    return byte - 256;
  }

  switch (byte) {
    case 0xc0:
      return null;
    case 0xc2:
      return false;
    case 0xc3:
      return true;

    // float32
    case 0xca: {
      const ab = new ArrayBuffer(4);
      const dv = new DataView(ab);
      for (let i = 0; i < 4; i++) {
        dv.setUint8(i, readByte(data, cursor));
      }
      return dv.getFloat32(0, false);
    }

    // float64
    case 0xcb: {
      const ab = new ArrayBuffer(8);
      const dv = new DataView(ab);
      for (let i = 0; i < 8; i++) {
        dv.setUint8(i, readByte(data, cursor));
      }
      return dv.getFloat64(0, false);
    }

    // uint8
    case 0xcc:
      return readByte(data, cursor);

    // uint16
    case 0xcd: {
      const hi = readByte(data, cursor);
      const lo = readByte(data, cursor);
      return (hi << 8) | lo;
    }

    // uint32
    case 0xce: {
      const b0 = readByte(data, cursor);
      const b1 = readByte(data, cursor);
      const b2 = readByte(data, cursor);
      const b3 = readByte(data, cursor);
      return ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    }

    // uint64
    case 0xcf:
      throw new Error("64ビット整数はサポートされていません");

    // int8
    case 0xd0: {
      const v = readByte(data, cursor);
      return v >= 0x80 ? v - 256 : v;
    }

    // int16
    case 0xd1: {
      const hi = readByte(data, cursor);
      const lo = readByte(data, cursor);
      const v = (hi << 8) | lo;
      return v >= 0x8000 ? v - 65536 : v;
    }

    // int32
    case 0xd2: {
      const b0 = readByte(data, cursor);
      const b1 = readByte(data, cursor);
      const b2 = readByte(data, cursor);
      const b3 = readByte(data, cursor);
      return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
    }

    // int64
    case 0xd3:
      throw new Error("64ビット整数はサポートされていません");

    // str8
    case 0xd9: {
      const len = readByte(data, cursor);
      return decodeString(data, cursor, len);
    }

    // str16
    case 0xda: {
      const hi = readByte(data, cursor);
      const lo = readByte(data, cursor);
      return decodeString(data, cursor, (hi << 8) | lo);
    }

    // str32
    case 0xdb: {
      const b0 = readByte(data, cursor);
      const b1 = readByte(data, cursor);
      const b2 = readByte(data, cursor);
      const b3 = readByte(data, cursor);
      return decodeString(data, cursor, ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0);
    }

    // array16
    case 0xdc: {
      const hi = readByte(data, cursor);
      const lo = readByte(data, cursor);
      return decodeArray(data, cursor, (hi << 8) | lo);
    }

    // array32
    case 0xdd: {
      const b0 = readByte(data, cursor);
      const b1 = readByte(data, cursor);
      const b2 = readByte(data, cursor);
      const b3 = readByte(data, cursor);
      return decodeArray(data, cursor, ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0);
    }

    // map16
    case 0xde: {
      const hi = readByte(data, cursor);
      const lo = readByte(data, cursor);
      return decodeMap(data, cursor, (hi << 8) | lo);
    }

    // map32
    case 0xdf: {
      const b0 = readByte(data, cursor);
      const b1 = readByte(data, cursor);
      const b2 = readByte(data, cursor);
      const b3 = readByte(data, cursor);
      return decodeMap(data, cursor, ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0);
    }

    default:
      throw new Error(`不正なMessagePackバイトです: 0x${byte.toString(16)}`);
  }
}

/**
 * バッファから1バイト読み取る
 * @param data - データバッファ
 * @param cursor - カーソル
 * @returns 読み取ったバイト値
 */
function readByte(data: Uint8Array, cursor: Cursor): number {
  if (cursor.offset >= data.length) {
    throw new Error("予期しないデータ終端です");
  }
  return data[cursor.offset++];
}

/**
 * 文字列をデコードする
 * @param data - データバッファ
 * @param cursor - カーソル
 * @param len - バイト長
 * @returns デコードされた文字列
 */
function decodeString(data: Uint8Array, cursor: Cursor, len: number): string {
  const bytes = data.slice(cursor.offset, cursor.offset + len);
  cursor.offset += len;
  return new TextDecoder().decode(bytes);
}

/**
 * 配列をデコードする
 * @param data - データバッファ
 * @param cursor - カーソル
 * @param len - 要素数
 * @returns デコードされた配列
 */
function decodeArray(data: Uint8Array, cursor: Cursor, len: number): unknown[] {
  const arr: unknown[] = [];
  for (let i = 0; i < len; i++) {
    arr.push(decodeValue(data, cursor));
  }
  return arr;
}

/**
 * マップ（オブジェクト）をデコードする
 * @param data - データバッファ
 * @param cursor - カーソル
 * @param len - キー数
 * @returns デコードされたオブジェクト
 */
function decodeMap(data: Uint8Array, cursor: Cursor, len: number): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < len; i++) {
    const key = decodeValue(data, cursor);
    const value = decodeValue(data, cursor);
    obj[String(key)] = value;
  }
  return obj;
}

/**
 * JSON互換値をMessagePackバイナリにエンコードする
 * @param value - エンコード対象の値（null, boolean, number, string, array, objectに対応）
 * @returns エンコードされたMessagePackバイナリ
 * @throws {Error} undefined, functionなどエンコード不可能な型が含まれる場合
 */
export function msgpackEncode(value: unknown): Uint8Array {
  const buf: EncodeBuffer = { bytes: [] };
  encodeValue(buf, value);
  return new Uint8Array(buf.bytes);
}

/**
 * MessagePackバイナリをJSON互換値にデコードする
 * @param buffer - デコード対象のUint8Array
 * @returns デコードされたJSON互換値
 * @throws {Error} 不正なMessagePackバイト列が含まれる場合
 * @throws {Error} int64/uint64が含まれる場合（サポート外）
 */
export function msgpackDecode(buffer: Uint8Array): unknown {
  const cursor: Cursor = { offset: 0 };
  const result = decodeValue(buffer, cursor);
  if (cursor.offset !== buffer.length) {
    throw new Error("MessagePackデータの後に余分なバイトがあります");
  }
  return result;
}

/**
 * Uint8ArrayをHEX文字列に変換する
 * @param bytes - 変換対象のUint8Array
 * @returns スペース区切りのHEX文字列（例: "c0 c3 a5"）
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

/**
 * HEX文字列をUint8Arrayに変換する（スペース・改行・コロンを除去）
 * @param hex - 変換対象のHEX文字列（スペース、改行、コロンは無視される）
 * @returns 変換されたUint8Array
 * @throws {Error} HEX文字列が奇数長の場合、または不正な文字が含まれる場合
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // スペース・改行・コロンを除去
  const cleaned = hex.replace(/[\s:]/g, "");

  if (cleaned.length % 2 !== 0) {
    throw new Error("HEX文字列は偶数長である必要があります");
  }

  if (cleaned.length === 0) {
    return new Uint8Array(0);
  }

  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error("HEX文字列に不正な文字が含まれています");
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}
