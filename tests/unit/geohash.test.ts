import { describe, it, expect } from "vitest";
import {
  encode,
  decode,
  getNeighbors,
  isValidGeohash,
  GeohashError,
} from "../../app/utils/geohash";

describe("isValidGeohash", () => {
  it("有効な1文字のGeohashを受け入れる", () => {
    expect(isValidGeohash("u")).toBe(true);
  });

  it("有効な9文字のGeohashを受け入れる", () => {
    expect(isValidGeohash("u4pruydqq")).toBe(true);
  });

  it("12文字（最大精度）を受け入れる", () => {
    expect(isValidGeohash("u4pruydqqvjj")).toBe(true);
  });

  it("空文字列は無効", () => {
    expect(isValidGeohash("")).toBe(false);
  });

  it("13文字以上は無効", () => {
    expect(isValidGeohash("u4pruydqqvjj0")).toBe(false);
  });

  it("使用不可文字 'a' を含む文字列は無効", () => {
    expect(isValidGeohash("u4pruya")).toBe(false);
  });

  it("使用不可文字 'i' を含む文字列は無効", () => {
    expect(isValidGeohash("u4pruyi")).toBe(false);
  });

  it("使用不可文字 'l' を含む文字列は無効", () => {
    expect(isValidGeohash("u4pruyl")).toBe(false);
  });

  it("使用不可文字 'o' を含む文字列は無効", () => {
    expect(isValidGeohash("u4pruyo")).toBe(false);
  });

  it("大文字を含む文字列は無効", () => {
    expect(isValidGeohash("U4PRUYD")).toBe(false);
  });

  it("記号を含む文字列は無効", () => {
    expect(isValidGeohash("u4pru!d")).toBe(false);
  });
});

describe("encode", () => {
  it("東京（35.6895, 139.6917）を精度6でエンコードする", () => {
    const result = encode(35.6895, 139.6917, 6);
    expect(result).toHaveLength(6);
    expect(isValidGeohash(result)).toBe(true);
  });

  it("エンコードした値をデコードすると元の座標に近い値が得られる", () => {
    const lat = 35.6895;
    const lng = 139.6917;
    const hash = encode(lat, lng, 9);
    const { lat: decodedLat, lng: decodedLng } = decode(hash);
    expect(Math.abs(decodedLat - lat)).toBeLessThan(0.001);
    expect(Math.abs(decodedLng - lng)).toBeLessThan(0.001);
  });

  it("パリ（48.8566, 2.3522）を精度7でエンコードする", () => {
    const result = encode(48.8566, 2.3522, 7);
    expect(result).toHaveLength(7);
    // 既知の値: パリ付近のGeohashはuプレフィックスを持つ
    expect(result.startsWith("u")).toBe(true);
  });

  it("精度1でエンコードすると1文字のGeohashが得られる", () => {
    expect(encode(0, 0, 1)).toHaveLength(1);
  });

  it("精度12でエンコードすると12文字のGeohashが得られる", () => {
    expect(encode(0, 0, 12)).toHaveLength(12);
  });

  it("デフォルト精度（9）でエンコードする", () => {
    expect(encode(35.0, 135.0)).toHaveLength(9);
  });

  it("緯度-90（南極点）をエンコードできる", () => {
    const result = encode(-90, 0, 5);
    expect(isValidGeohash(result)).toBe(true);
  });

  it("緯度90（北極点）をエンコードできる", () => {
    const result = encode(90, 0, 5);
    expect(isValidGeohash(result)).toBe(true);
  });

  it("経度-180をエンコードできる", () => {
    const result = encode(0, -180, 5);
    expect(isValidGeohash(result)).toBe(true);
  });

  it("経度180をエンコードできる", () => {
    const result = encode(0, 180, 5);
    expect(isValidGeohash(result)).toBe(true);
  });

  it("緯度90超でGeohashErrorをスローする", () => {
    expect(() => encode(91, 0)).toThrow(GeohashError);
  });

  it("緯度-90未満でGeohashErrorをスローする", () => {
    expect(() => encode(-91, 0)).toThrow(GeohashError);
  });

  it("経度180超でGeohashErrorをスローする", () => {
    expect(() => encode(0, 181)).toThrow(GeohashError);
  });

  it("経度-180未満でGeohashErrorをスローする", () => {
    expect(() => encode(0, -181)).toThrow(GeohashError);
  });

  it("精度0でGeohashErrorをスローする", () => {
    expect(() => encode(0, 0, 0)).toThrow(GeohashError);
  });

  it("精度13でGeohashErrorをスローする", () => {
    expect(() => encode(0, 0, 13)).toThrow(GeohashError);
  });

  it("小数点以下の精度指定でGeohashErrorをスローする", () => {
    expect(() => encode(0, 0, 1.5)).toThrow(GeohashError);
  });

  it("同じ座標・精度で常に同じGeohashが得られる（冪等性）", () => {
    const a = encode(35.6895, 139.6917, 8);
    const b = encode(35.6895, 139.6917, 8);
    expect(a).toBe(b);
  });
});

describe("decode", () => {
  it("精度9のGeohashをデコードすると緯度・経度が得られる", () => {
    const hash = encode(35.6895, 139.6917, 9);
    const result = decode(hash);
    expect(result).toHaveProperty("lat");
    expect(result).toHaveProperty("lng");
    expect(result).toHaveProperty("bounds");
  });

  it("デコード結果のバウンディングボックスに中心座標が含まれる", () => {
    const hash = encode(35.0, 135.0, 7);
    const { lat, lng, bounds } = decode(hash);
    expect(lat).toBeGreaterThanOrEqual(bounds.minLat);
    expect(lat).toBeLessThanOrEqual(bounds.maxLat);
    expect(lng).toBeGreaterThanOrEqual(bounds.minLng);
    expect(lng).toBeLessThanOrEqual(bounds.maxLng);
  });

  it("精度が高いほどバウンディングボックスが小さくなる", () => {
    const hash5 = encode(35.0, 135.0, 5);
    const hash9 = encode(35.0, 135.0, 9);
    const bounds5 = decode(hash5).bounds;
    const bounds9 = decode(hash9).bounds;
    const area5 =
      (bounds5.maxLat - bounds5.minLat) * (bounds5.maxLng - bounds5.minLng);
    const area9 =
      (bounds9.maxLat - bounds9.minLat) * (bounds9.maxLng - bounds9.minLng);
    expect(area9).toBeLessThan(area5);
  });

  it("バウンディングボックスのminLat < maxLat が常に成立する", () => {
    const { bounds } = decode("u4pruyd");
    expect(bounds.minLat).toBeLessThan(bounds.maxLat);
  });

  it("バウンディングボックスのminLng < maxLng が常に成立する", () => {
    const { bounds } = decode("u4pruyd");
    expect(bounds.minLng).toBeLessThan(bounds.maxLng);
  });

  it("1文字のGeohashをデコードできる", () => {
    const result = decode("u");
    expect(result.lat).toBeDefined();
    expect(result.lng).toBeDefined();
  });

  it("12文字のGeohashをデコードできる", () => {
    const hash = encode(0, 0, 12);
    const result = decode(hash);
    expect(Math.abs(result.lat)).toBeLessThan(0.00001);
    expect(Math.abs(result.lng)).toBeLessThan(0.00001);
  });

  it("無効なGeohash（使用不可文字含む）でGeohashErrorをスローする", () => {
    expect(() => decode("invalid!")).toThrow(GeohashError);
  });

  it("空文字列でGeohashErrorをスローする", () => {
    expect(() => decode("")).toThrow(GeohashError);
  });

  it("13文字以上でGeohashErrorをスローする", () => {
    expect(() => decode("u4pruydqqvjj0")).toThrow(GeohashError);
  });
});

describe("getNeighbors", () => {
  it("8方向の隣接セルと中心セルを返す", () => {
    const result = getNeighbors("u4pruyd");
    expect(result).toHaveProperty("n");
    expect(result).toHaveProperty("ne");
    expect(result).toHaveProperty("e");
    expect(result).toHaveProperty("se");
    expect(result).toHaveProperty("s");
    expect(result).toHaveProperty("sw");
    expect(result).toHaveProperty("w");
    expect(result).toHaveProperty("nw");
    expect(result).toHaveProperty("center");
  });

  it("中心セルは入力Geohashと一致する", () => {
    expect(getNeighbors("u4pruyd").center).toBe("u4pruyd");
  });

  it("全ての隣接セルは有効なGeohash形式", () => {
    const neighbors = getNeighbors("u4pruyd");
    for (const hash of Object.values(neighbors)) {
      expect(isValidGeohash(hash)).toBe(true);
    }
  });

  it("全ての隣接セルは入力と同じ文字数", () => {
    const input = "u4pruyd";
    const neighbors = getNeighbors(input);
    for (const hash of Object.values(neighbors)) {
      expect(hash).toHaveLength(input.length);
    }
  });

  it("北の隣接セルの緯度中心は元のセルより大きい", () => {
    const input = "u4pruyd";
    const { lat: centerLat } = decode(input);
    const { lat: northLat } = decode(getNeighbors(input).n);
    expect(northLat).toBeGreaterThan(centerLat);
  });

  it("南の隣接セルの緯度中心は元のセルより小さい", () => {
    const input = "u4pruyd";
    const { lat: centerLat } = decode(input);
    const { lat: southLat } = decode(getNeighbors(input).s);
    expect(southLat).toBeLessThan(centerLat);
  });

  it("東の隣接セルの経度中心は元のセルより大きい", () => {
    const input = "u4pruyd";
    const { lng: centerLng } = decode(input);
    const { lng: eastLng } = decode(getNeighbors(input).e);
    expect(eastLng).toBeGreaterThan(centerLng);
  });

  it("西の隣接セルの経度中心は元のセルより小さい", () => {
    const input = "u4pruyd";
    const { lng: centerLng } = decode(input);
    const { lng: westLng } = decode(getNeighbors(input).w);
    expect(westLng).toBeLessThan(centerLng);
  });

  it("無効なGeohashでGeohashErrorをスローする", () => {
    expect(() => getNeighbors("invalid!")).toThrow(GeohashError);
  });

  it("空文字列でGeohashErrorをスローする", () => {
    expect(() => getNeighbors("")).toThrow(GeohashError);
  });

  it("精度1でも隣接セルが計算できる", () => {
    const result = getNeighbors("u");
    expect(isValidGeohash(result.n)).toBe(true);
  });
});
