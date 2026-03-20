/**
 * @fileoverview Geohashエンコード/デコードユーティリティ
 * 外部ライブラリ不使用の純粋TypeScript実装
 * Gustavo Niemeyer考案のGeohashアルゴリズムに基づく
 */

/** Geohashで使用するBase32文字セット（標準Ngeohash alphabet） */
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Geohashデコード結果
 */
export interface GeohashDecodeResult {
  /** 中心緯度 */
  lat: number;
  /** 中心経度 */
  lng: number;
  /** バウンディングボックス */
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

/**
 * 隣接Geohashセル（8方向 + 中心）
 */
export interface GeohashNeighbors {
  /** 北 */
  n: string;
  /** 北東 */
  ne: string;
  /** 東 */
  e: string;
  /** 南東 */
  se: string;
  /** 南 */
  s: string;
  /** 南西 */
  sw: string;
  /** 西 */
  w: string;
  /** 北西 */
  nw: string;
  /** 中心（入力値） */
  center: string;
}

/**
 * Geohash操作エラー
 */
export class GeohashError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeohashError";
  }
}

/**
 * 指定した文字列が有効なGeohash形式かを検証する
 *
 * @param hash - 検証するGeohash文字列
 * @returns 有効なGeohashであればtrue
 *
 * @example
 * isValidGeohash("u4pruyd") // => true
 * isValidGeohash("invalid!") // => false
 */
export function isValidGeohash(hash: string): boolean {
  if (!hash || hash.length === 0 || hash.length > 12) return false;
  return [...hash].every((c) => BASE32.includes(c));
}

/**
 * 緯度・経度をGeohash文字列にエンコードする
 *
 * アルゴリズム概要:
 * 1. 経度・緯度をそれぞれ[-180,180]・[-90,90]の範囲で二分探索
 * 2. 各ビットをinterleave（経度=偶数ビット、緯度=奇数ビット）
 * 3. 5ビットごとにグループ化してBase32文字に変換
 *
 * @param lat - 緯度（-90〜90）
 * @param lng - 経度（-180〜180）
 * @param precision - 精度（1〜12、デフォルト9）
 * @returns Geohash文字列
 * @throws {GeohashError} 入力値が範囲外の場合
 *
 * @example
 * encode(48.8566, 2.3522, 7) // => "u09tunq" (パリ近傍)
 */
export function encode(lat: number, lng: number, precision = 9): string {
  if (lat < -90 || lat > 90) {
    throw new GeohashError(
      `緯度は-90〜90の範囲で入力してください（入力値: ${lat}）`
    );
  }
  if (lng < -180 || lng > 180) {
    throw new GeohashError(
      `経度は-180〜180の範囲で入力してください（入力値: ${lng}）`
    );
  }
  if (precision < 1 || precision > 12 || !Number.isInteger(precision)) {
    throw new GeohashError(
      `精度は1〜12の整数で入力してください（入力値: ${precision}）`
    );
  }

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latMin = -90,
    latMax = 90;
  let lngMin = -180,
    lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = idx * 2 + 1;
        lngMin = lngMid;
      } else {
        idx = idx * 2;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Geohash文字列を緯度・経度およびバウンディングボックスにデコードする
 *
 * @param hash - デコードするGeohash文字列（1〜12文字）
 * @returns デコード結果（中心座標とバウンディングボックス）
 * @throws {GeohashError} 無効なGeohash文字列の場合
 *
 * @example
 * decode("u4pruyd")
 * // => { lat: 57.648, lng: 10.407, bounds: { minLat: ..., maxLat: ..., minLng: ..., maxLng: ... } }
 */
export function decode(hash: string): GeohashDecodeResult {
  if (!isValidGeohash(hash)) {
    throw new GeohashError(`無効なGeohash文字列です: "${hash}"`);
  }

  let evenBit = true;
  let latMin = -90,
    latMax = 90;
  let lngMin = -180,
    lngMax = 180;

  for (const char of hash) {
    const charIdx = BASE32.indexOf(char);
    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (charIdx >> bits) & 1;
      if (evenBit) {
        const lngMid = (lngMin + lngMax) / 2;
        if (bitN === 1) lngMin = lngMid;
        else lngMax = lngMid;
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) latMin = latMid;
        else latMax = latMid;
      }
      evenBit = !evenBit;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lng = (lngMin + lngMax) / 2;

  return {
    lat: parseFloat(lat.toFixed(7)),
    lng: parseFloat(lng.toFixed(7)),
    bounds: {
      minLat: latMin,
      maxLat: latMax,
      minLng: lngMin,
      maxLng: lngMax,
    },
  };
}

/**
 * 指定したGeohashセルに隣接する8方向のGeohashを取得する
 *
 * @param hash - 基点となるGeohash文字列
 * @returns 8方向の隣接セルと中心セル
 * @throws {GeohashError} 無効なGeohash文字列の場合
 *
 * @example
 * getNeighbors("u4pruyd").n // => 北側のGeohashセル
 */
export function getNeighbors(hash: string): GeohashNeighbors {
  if (!isValidGeohash(hash)) {
    throw new GeohashError(`無効なGeohash文字列です: "${hash}"`);
  }

  const n = _neighbor(hash, [1, 0]);
  const ne = _neighbor(_neighbor(hash, [1, 0]), [0, 1]);
  const e = _neighbor(hash, [0, 1]);
  const se = _neighbor(_neighbor(hash, [-1, 0]), [0, 1]);
  const s = _neighbor(hash, [-1, 0]);
  const sw = _neighbor(_neighbor(hash, [-1, 0]), [0, -1]);
  const w = _neighbor(hash, [0, -1]);
  const nw = _neighbor(_neighbor(hash, [1, 0]), [0, -1]);

  return { n, ne, e, se, s, sw, w, nw, center: hash };
}

/**
 * 指定した方向の隣接Geohashを計算する内部関数
 *
 * @param hash - 基点Geohash
 * @param direction - [latDir, lngDir]（1=正方向、-1=負方向、0=変化なし）
 * @returns 隣接Geohash文字列
 */
function _neighbor(hash: string, direction: [number, number]): string {
  const { lat, lng, bounds } = decode(hash);
  const latErr = (bounds.maxLat - bounds.minLat) / 2;
  const lngErr = (bounds.maxLng - bounds.minLng) / 2;

  const neighborLat = Math.max(
    -90,
    Math.min(90, lat + direction[0] * latErr * 2)
  );
  const neighborLng =
    ((lng + direction[1] * lngErr * 2 + 180) % 360 + 360) % 360 - 180;

  return encode(neighborLat, neighborLng, hash.length);
}
