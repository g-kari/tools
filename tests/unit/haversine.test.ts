import { describe, it, expect } from "vitest";
import {
  toRad,
  toDeg,
  isValidLatLng,
  bearingToLabel,
  calcHaversine,
  formatDistance,
  EARTH_RADIUS_KM,
} from "~/utils/haversine";

describe("toRad", () => {
  it("0度は0ラジアン", () => {
    expect(toRad(0)).toBe(0);
  });

  it("180度はPIラジアン", () => {
    expect(toRad(180)).toBeCloseTo(Math.PI);
  });

  it("90度はPI/2ラジアン", () => {
    expect(toRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it("-90度は-PI/2ラジアン", () => {
    expect(toRad(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

describe("toDeg", () => {
  it("0ラジアンは0度", () => {
    expect(toDeg(0)).toBe(0);
  });

  it("PIラジアンは180度", () => {
    expect(toDeg(Math.PI)).toBeCloseTo(180);
  });

  it("PI/2ラジアンは90度", () => {
    expect(toDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it("toRad と toDeg は逆関数", () => {
    expect(toDeg(toRad(45))).toBeCloseTo(45);
    expect(toDeg(toRad(123.456))).toBeCloseTo(123.456);
  });
});

describe("isValidLatLng", () => {
  it("有効な座標を許可する", () => {
    expect(isValidLatLng(0, 0)).toBe(true);
    expect(isValidLatLng(90, 180)).toBe(true);
    expect(isValidLatLng(-90, -180)).toBe(true);
    expect(isValidLatLng(35.6895, 139.6917)).toBe(true);
  });

  it("緯度が範囲外の場合はfalse", () => {
    expect(isValidLatLng(90.1, 0)).toBe(false);
    expect(isValidLatLng(-90.1, 0)).toBe(false);
    expect(isValidLatLng(91, 0)).toBe(false);
  });

  it("経度が範囲外の場合はfalse", () => {
    expect(isValidLatLng(0, 180.1)).toBe(false);
    expect(isValidLatLng(0, -180.1)).toBe(false);
    expect(isValidLatLng(0, 181)).toBe(false);
  });

  it("NaNの場合はfalse", () => {
    expect(isValidLatLng(NaN, 0)).toBe(false);
    expect(isValidLatLng(0, NaN)).toBe(false);
    expect(isValidLatLng(NaN, NaN)).toBe(false);
  });

  it("Infinityの場合はfalse", () => {
    expect(isValidLatLng(Infinity, 0)).toBe(false);
    expect(isValidLatLng(0, Infinity)).toBe(false);
  });
});

describe("bearingToLabel", () => {
  it("0度は北", () => {
    const { abbr, label } = bearingToLabel(0);
    expect(abbr).toBe("N");
    expect(label).toBe("北");
  });

  it("90度は東", () => {
    const { abbr, label } = bearingToLabel(90);
    expect(abbr).toBe("E");
    expect(label).toBe("東");
  });

  it("180度は南", () => {
    const { abbr, label } = bearingToLabel(180);
    expect(abbr).toBe("S");
    expect(label).toBe("南");
  });

  it("270度は西", () => {
    const { abbr, label } = bearingToLabel(270);
    expect(abbr).toBe("W");
    expect(label).toBe("西");
  });

  it("360度は北として扱う", () => {
    const { abbr } = bearingToLabel(360);
    expect(abbr).toBe("N");
  });

  it("45度は北東", () => {
    const { abbr, label } = bearingToLabel(45);
    expect(abbr).toBe("NE");
    expect(label).toBe("北東");
  });

  it("負の値は正規化される", () => {
    const { abbr } = bearingToLabel(-90);
    expect(abbr).toBe("W");
  });
});

describe("calcHaversine", () => {
  it("同一地点の距離は0", () => {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    const result = calcHaversine(tokyo, tokyo);
    expect(result.distanceKm).toBeCloseTo(0, 5);
    expect(result.distanceMeters).toBeCloseTo(0, 2);
    expect(result.distanceMiles).toBeCloseTo(0, 5);
  });

  it("東京〜大阪の距離が概ね400km前後", () => {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    const osaka = { lat: 34.6873, lng: 135.526 };
    const result = calcHaversine(tokyo, osaka);
    // 実際の距離は約401km
    expect(result.distanceKm).toBeGreaterThan(390);
    expect(result.distanceKm).toBeLessThan(420);
  });

  it("赤道上の対蹠点の距離は地球半径*PIに近い", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 180 };
    const result = calcHaversine(a, b);
    const expected = EARTH_RADIUS_KM * Math.PI;
    expect(result.distanceKm).toBeCloseTo(expected, 0);
  });

  it("北極〜南極の距離は地球半径*PIに近い", () => {
    const np = { lat: 90, lng: 0 };
    const sp = { lat: -90, lng: 0 };
    const result = calcHaversine(np, sp);
    const expected = EARTH_RADIUS_KM * Math.PI;
    expect(result.distanceKm).toBeCloseTo(expected, 0);
  });

  it("km と miles の変換比が正しい", () => {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    const osaka = { lat: 34.6873, lng: 135.526 };
    const result = calcHaversine(tokyo, osaka);
    const ratio = result.distanceKm / result.distanceMiles;
    // 1 マイル ≈ 1.60934 km
    expect(ratio).toBeCloseTo(1.60934, 2);
  });

  it("km と meters の変換比が正しい", () => {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    const osaka = { lat: 34.6873, lng: 135.526 };
    const result = calcHaversine(tokyo, osaka);
    expect(result.distanceMeters).toBeCloseTo(result.distanceKm * 1000, 3);
  });

  it("東方向への移動は方位角約90度", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 10 };
    const result = calcHaversine(a, b);
    expect(result.bearingDeg).toBeCloseTo(90, 0);
    expect(result.bearingAbbr).toBe("E");
  });

  it("北方向への移動は方位角約0度", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 10, lng: 0 };
    const result = calcHaversine(a, b);
    expect(result.bearingDeg).toBeCloseTo(0, 0);
    expect(result.bearingAbbr).toBe("N");
  });

  it("南方向への移動は方位角約180度", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: -10, lng: 0 };
    const result = calcHaversine(a, b);
    expect(result.bearingDeg).toBeCloseTo(180, 0);
    expect(result.bearingAbbr).toBe("S");
  });

  it("距離は対称（A→BとB→Aが同じ）", () => {
    const tokyo = { lat: 35.6895, lng: 139.6917 };
    const ny = { lat: 40.7128, lng: -74.006 };
    const r1 = calcHaversine(tokyo, ny);
    const r2 = calcHaversine(ny, tokyo);
    expect(r1.distanceKm).toBeCloseTo(r2.distanceKm, 3);
  });

  it("方位角は0〜360の範囲", () => {
    const coords = [
      [{ lat: 0, lng: 0 }, { lat: 10, lng: 10 }],
      [{ lat: -30, lng: 100 }, { lat: 50, lng: -50 }],
      [{ lat: 90, lng: 0 }, { lat: 0, lng: 90 }],
    ];
    for (const [from, to] of coords) {
      const result = calcHaversine(from, to);
      expect(result.bearingDeg).toBeGreaterThanOrEqual(0);
      expect(result.bearingDeg).toBeLessThan(360);
      expect(result.finalBearingDeg).toBeGreaterThanOrEqual(0);
      expect(result.finalBearingDeg).toBeLessThan(360);
    }
  });
});

describe("formatDistance", () => {
  it("1km未満はメートル表示", () => {
    expect(formatDistance(0.5)).toBe("500.0 m");
    expect(formatDistance(0.001)).toBe("1.0 m");
  });

  it("1km以上はkm表示", () => {
    expect(formatDistance(1)).toBe("1.000 km");
    expect(formatDistance(401.234)).toBe("401.234 km");
  });

  it("ちょうど0のとき", () => {
    expect(formatDistance(0)).toBe("0.0 m");
  });
});
