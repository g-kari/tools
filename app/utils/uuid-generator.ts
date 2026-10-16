/** UUID v7 with a 48-bit Unix millisecond timestamp and 74 fresh random bits.
 * RFC 9562 §5.7. Same-millisecond values and clock rollback are not monotonic.
 */
export function generateUuidV7(unixMs: number = Date.now()): string {
  if (!Number.isInteger(unixMs) || unixMs < 0 || unixMs > 0xffffffffffff) {
    throw new RangeError("UUID v7 requires an unsigned 48-bit millisecond timestamp");
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = unixMs;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
