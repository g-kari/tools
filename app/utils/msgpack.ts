import { encode, decode } from "@msgpack/msgpack";

/**
 * JSONをMessagePackのhex文字列にエンコードする
 * @param jsonStr - 変換元のJSON文字列
 * @returns スペース区切りの16進数文字列とバイト数
 */
export function encodeToMsgpack(jsonStr: string): { hex: string; bytes: number } {
  const obj = JSON.parse(jsonStr);
  const bytes = encode(obj);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  return { hex, bytes: bytes.length };
}

/**
 * MessagePackのhex文字列をJSONにデコードする
 * @param hexStr - スペースや改行区切りの16進数文字列
 * @returns 整形されたJSON文字列
 */
export function decodeFromMsgpack(hexStr: string): string {
  const cleaned = hexStr.trim().replace(/\s+/g, " ");
  if (!cleaned) throw new Error("入力が空です");
  const bytes = Uint8Array.from(
    cleaned.split(" ").map((h) => {
      const n = parseInt(h, 16);
      if (!/^[0-9a-fA-F]{2}$/.test(h)) throw new Error(`無効な16進数: ${h}`);
      return n;
    }),
  );
  const obj = decode(bytes);
  return JSON.stringify(obj, null, 2);
}
