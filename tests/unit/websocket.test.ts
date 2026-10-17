import { describe, it, expect } from "vite-plus/test";
import { encode as msgpackEncode } from "@msgpack/msgpack";
import {
  formatTimestamp,
  parseJsonSafe,
  isValidWsUrl,
  arrayBufferToHex,
  hexToArrayBuffer,
  decodeMsgpack,
} from "../../app/routes/websocket";

describe("formatTimestamp", () => {
  it("HH:MM:SS.mmm形式にフォーマットする", () => {
    const date = new Date("2024-01-01T12:34:56.789Z");
    // タイムゾーンに依存するため、形式だけ確認
    const result = formatTimestamp(date);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it("1桁の時・分・秒・ミリ秒をゼロパディングする", () => {
    // UTCで0時0分0秒1ミリ秒を作成し、ローカル時刻での各フィールドがパディングされるか確認
    const date = new Date(2024, 0, 1, 1, 2, 3, 5);
    const result = formatTimestamp(date);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    // ミリ秒は005になるはず
    const ms = result.split(".")[1];
    expect(ms).toBe("005");
  });
});

describe("parseJsonSafe", () => {
  it("有効なJSONを整形して返す", () => {
    const input = '{"key":"value","num":42}';
    const result = parseJsonSafe(input);
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
    expect(result).toContain('"num"');
    expect(result).toContain("42");
    // インデントされていること
    expect(result).toContain("\n");
  });

  it("無効なJSONはそのまま返す", () => {
    const input = "Hello, WebSocket!";
    expect(parseJsonSafe(input)).toBe(input);
  });

  it("配列JSONも整形する", () => {
    const input = "[1,2,3]";
    const result = parseJsonSafe(input);
    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("3");
  });

  it("空の文字列はそのまま返す", () => {
    expect(parseJsonSafe("")).toBe("");
  });

  it("ネストされたJSONを整形する", () => {
    const input = '{"a":{"b":{"c":1}}}';
    const result = parseJsonSafe(input);
    const parsed = JSON.parse(result);
    expect(parsed.a.b.c).toBe(1);
  });
});

describe("isValidWsUrl", () => {
  it("ws://URLを有効と判定する", () => {
    expect(isValidWsUrl("ws://localhost:8080")).toBe(true);
  });

  it("wss://URLを有効と判定する", () => {
    expect(isValidWsUrl("wss://echo.websocket.org")).toBe(true);
  });

  it("wss://パスなしURLを有効と判定する", () => {
    expect(isValidWsUrl("wss://example.com/path")).toBe(true);
  });

  it("http://URLを無効と判定する", () => {
    expect(isValidWsUrl("http://example.com")).toBe(false);
  });

  it("https://URLを無効と判定する", () => {
    expect(isValidWsUrl("https://example.com")).toBe(false);
  });

  it("空文字列を無効と判定する", () => {
    expect(isValidWsUrl("")).toBe(false);
  });

  it("不正なURLを無効と判定する", () => {
    expect(isValidWsUrl("not-a-url")).toBe(false);
  });

  it("プロトコルなしのURLを無効と判定する", () => {
    expect(isValidWsUrl("echo.websocket.org")).toBe(false);
  });

  it("ポート付きwss://URLを有効と判定する", () => {
    expect(isValidWsUrl("wss://localhost:9000/ws")).toBe(true);
  });
});

describe("arrayBufferToHex", () => {
  it("バイト列を16進数文字列に変換する", () => {
    const buf = new Uint8Array([0x01, 0x0f, 0xff]).buffer;
    expect(arrayBufferToHex(buf)).toBe("01 0f ff");
  });

  it("空のArrayBufferは空文字列を返す", () => {
    expect(arrayBufferToHex(new ArrayBuffer(0))).toBe("");
  });
});

describe("hexToArrayBuffer", () => {
  it("スペース区切りの16進数文字列をArrayBufferに変換する", () => {
    const buf = hexToArrayBuffer("01 0f ff");
    expect(buf).not.toBeNull();
    const bytes = new Uint8Array(buf!);
    expect(bytes[0]).toBe(0x01);
    expect(bytes[1]).toBe(0x0f);
    expect(bytes[2]).toBe(0xff);
  });

  it("連続した16進数文字列を変換する", () => {
    const buf = hexToArrayBuffer("010fff");
    expect(buf).not.toBeNull();
    expect(new Uint8Array(buf!).length).toBe(3);
  });

  it("無効な文字列はnullを返す", () => {
    expect(hexToArrayBuffer("xyz")).toBeNull();
  });

  it("奇数長の16進数文字列はnullを返す", () => {
    expect(hexToArrayBuffer("abc")).toBeNull();
  });

  it("空文字列はnullを返す", () => {
    expect(hexToArrayBuffer("")).toBeNull();
  });
});

describe("decodeMsgpack", () => {
  it("有効なMessagePackをデコードしてJSON文字列を返す", () => {
    const u8 = msgpackEncode({ key: "val" });
    const encoded = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
    const result = decodeMsgpack(encoded);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.key).toBe("val");
  });

  it("無効なデータはnullを返す", () => {
    const buf = new Uint8Array([0xc1]).buffer; // 未使用のMessagePackバイト
    expect(decodeMsgpack(buf)).toBeNull();
  });
});
