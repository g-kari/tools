import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { generateUuidV7 } from "../../app/utils/uuid-generator";
import { parseUUID } from "../../app/utils/uuid-inspector";

afterEach(() => vi.restoreAllMocks());

function random(bytes: number[]) {
  return vi.spyOn(crypto, "getRandomValues").mockImplementation((target) => {
    (target as Uint8Array).set(bytes);
    return target;
  });
}

describe("RFC 9562 UUID v7 generation", () => {
  it("matches the RFC A.6 test vector", () => {
    random([0, 0, 0, 0, 0, 0, 0xcc, 0xc3, 0x98, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f]);
    expect(generateUuidV7(1645557742000)).toBe("017f22e2-79b0-7cc3-98c4-dc0c0c07398f");
  });

  it.each([
    0, 1, 255, 256, 65535, 65536, 0xffffffff, 0x100000000, 0xffffffffff, 0x10000000000,
    0xffffffffffff,
  ])("preserves all 48 timestamp bits at %s", (timestamp) => {
    random(Array<number>(16).fill(0));
    const uuid = generateUuidV7(timestamp);
    expect(uuid.replaceAll("-", "").slice(0, 12)).toBe(timestamp.toString(16).padStart(12, "0"));
    const inspected = parseUUID(uuid);
    expect(inspected.valid).toBe(true);
    expect(inspected.version).toBe(7);
    expect(inspected.variant).toBe("rfc4122");
    expect(inspected.unixMs).toBe(BigInt(timestamp));
  });

  it.each([-1, 0.5, 0x1000000000000, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER])(
    "rejects invalid time %s before drawing randomness",
    (timestamp) => {
      const entropy = vi.spyOn(crypto, "getRandomValues");
      expect(() => generateUuidV7(timestamp)).toThrow(RangeError);
      expect(entropy).not.toHaveBeenCalled();
    },
  );

  it.each([0x00, 0x3f, 0x40, 0x7f, 0x80, 0xbf, 0xc0, 0xff])(
    "sets version/variant while preserving random bits for 0x%s",
    (byte) => {
      const source = Array<number>(16).fill(byte);
      random(source);
      const actual = generateUuidV7(0).replaceAll("-", "");
      const decoded = actual.match(/../g)!.map((hex) => parseInt(hex, 16));
      expect(decoded.slice(0, 6)).toEqual(Array<number>(6).fill(0));
      expect(decoded[6]).toBe((byte & 0x0f) | 0x70);
      expect(decoded[7]).toBe(byte);
      expect(decoded[8]).toBe((byte & 0x3f) | 0x80);
      expect(decoded.slice(9)).toEqual(source.slice(9));
    },
  );

  it("reads the current time by default", () => {
    vi.spyOn(Date, "now").mockReturnValue(0x123456789abc);
    random(Array<number>(16).fill(0));
    expect(generateUuidV7()).toBe("12345678-9abc-7000-8000-000000000000");
  });

  it("requests new cryptographic bytes for every value, including the same millisecond", () => {
    const entropy = vi.spyOn(crypto, "getRandomValues").mockImplementation((target) => {
      (target as Uint8Array).fill(entropy.mock.calls.length);
      return target;
    });
    const first = generateUuidV7(100);
    const second = generateUuidV7(100);
    expect(first).not.toBe(second);
    expect(entropy).toHaveBeenCalledTimes(2);
    expect(entropy.mock.calls[0][0]).not.toBe(entropy.mock.calls[1][0]);
    expect(entropy.mock.calls.every(([target]) => (target as Uint8Array).length === 16)).toBe(true);
  });

  it("sorts distinct increasing timestamps without promising order within a millisecond", () => {
    random(Array<number>(16).fill(0xff));
    const first = generateUuidV7(0x123456789abc);
    random(Array<number>(16).fill(0));
    const second = generateUuidV7(0x123456789abd);
    expect(first < second).toBe(true);
  });

  it("uses the actual timestamp after clock rollback without shared generator state", () => {
    random(Array<number>(16).fill(0));
    generateUuidV7(100);
    expect(generateUuidV7(99).startsWith("00000000-0063-")).toBe(true);
  });

  it("propagates entropy errors without falling back to weak randomness", () => {
    vi.spyOn(crypto, "getRandomValues").mockImplementation(() => {
      throw new Error("unavailable");
    });
    const weak = vi.spyOn(Math, "random");
    expect(() => generateUuidV7(1)).toThrow("unavailable");
    expect(weak).not.toHaveBeenCalled();
  });
});
