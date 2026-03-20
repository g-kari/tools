/**
 * Haversine距離計算ユーティリティ
 * 地球上の2点間の大円距離と方位角を計算する
 */

/** 地球の平均半径 (km) */
export const EARTH_RADIUS_KM = 6371.0088;

/** 地球の平均半径 (mile) */
export const EARTH_RADIUS_MILES = 3958.8;

/** 緯度・経度の座標 */
export interface LatLng {
  /** 緯度 (degree, -90〜90) */
  lat: number;
  /** 経度 (degree, -180〜180) */
  lng: number;
}

/** Haversine計算結果 */
export interface HaversineResult {
  /** 距離 (km) */
  distanceKm: number;
  /** 距離 (mile) */
  distanceMiles: number;
  /** 距離 (m) */
  distanceMeters: number;
  /** 出発地から目的地への初期方位角 (degree, 0〜360) */
  bearingDeg: number;
  /** 目的地での終着方位角 (degree, 0〜360) */
  finalBearingDeg: number;
  /** 方位の日本語表現 */
  bearingLabel: string;
  /** 方位の英語略称 */
  bearingAbbr: string;
}

/**
 * 度数法をラジアンに変換する
 * @param deg 度数
 * @returns ラジアン
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * ラジアンを度数法に変換する
 * @param rad ラジアン
 * @returns 度数
 */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 緯度・経度が有効範囲内かを検証する
 * @param lat 緯度
 * @param lng 経度
 * @returns 有効な場合 true
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * 方位角(degree)を方位略称と日本語名に変換する
 * @param bearing 方位角 (0〜360)
 * @returns 方位略称と日本語名
 */
export function bearingToLabel(bearing: number): {
  abbr: string;
  label: string;
} {
  const normalized = ((bearing % 360) + 360) % 360;
  const directions = [
    { abbr: "N", label: "北" },
    { abbr: "NNE", label: "北北東" },
    { abbr: "NE", label: "北東" },
    { abbr: "ENE", label: "東北東" },
    { abbr: "E", label: "東" },
    { abbr: "ESE", label: "東南東" },
    { abbr: "SE", label: "南東" },
    { abbr: "SSE", label: "南南東" },
    { abbr: "S", label: "南" },
    { abbr: "SSW", label: "南南西" },
    { abbr: "SW", label: "南西" },
    { abbr: "WSW", label: "西南西" },
    { abbr: "W", label: "西" },
    { abbr: "WNW", label: "西北西" },
    { abbr: "NW", label: "北西" },
    { abbr: "NNW", label: "北北西" },
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Haversine公式を使って2点間の大円距離と方位角を計算する
 * @param from 出発地の座標
 * @param to 目的地の座標
 * @returns 計算結果
 */
export function calcHaversine(from: LatLng, to: LatLng): HaversineResult {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = EARTH_RADIUS_KM * c;
  const distanceMiles = EARTH_RADIUS_MILES * c;
  const distanceMeters = distanceKm * 1000;

  // 初期方位角
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = ((toDeg(bearingRad) % 360) + 360) % 360;

  // 終着方位角（逆方位を180度反転）
  const yFinal = Math.sin(-dLng) * Math.cos(lat1);
  const xFinal =
    Math.cos(lat2) * Math.sin(lat1) -
    Math.sin(lat2) * Math.cos(lat1) * Math.cos(-dLng);
  const finalBearingRad = Math.atan2(yFinal, xFinal);
  const finalBearingDeg =
    ((toDeg(finalBearingRad) + 180) % 360 + 360) % 360;

  const { abbr, label } = bearingToLabel(bearingDeg);

  return {
    distanceKm,
    distanceMiles,
    distanceMeters,
    bearingDeg,
    finalBearingDeg,
    bearingLabel: label,
    bearingAbbr: abbr,
  };
}

/**
 * 距離を読みやすい文字列にフォーマットする
 * @param km 距離 (km)
 * @returns フォーマット済み文字列
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(1)} m`;
  }
  return `${km.toFixed(3)} km`;
}

/** 有名な場所のプリセット */
export interface LocationPreset {
  name: string;
  lat: number;
  lng: number;
}

/** プリセットの都市一覧 */
export const LOCATION_PRESETS: LocationPreset[] = [
  { name: "東京 (東京都庁)", lat: 35.6895, lng: 139.6917 },
  { name: "大阪 (大阪城)", lat: 34.6873, lng: 135.526 },
  { name: "名古屋 (名古屋城)", lat: 35.185, lng: 136.8993 },
  { name: "札幌 (時計台)", lat: 43.0622, lng: 141.3545 },
  { name: "福岡 (博多駅)", lat: 33.5904, lng: 130.4199 },
  { name: "ニューヨーク", lat: 40.7128, lng: -74.006 },
  { name: "ロンドン", lat: 51.5074, lng: -0.1278 },
  { name: "パリ", lat: 48.8566, lng: 2.3522 },
  { name: "シドニー", lat: -33.8688, lng: 151.2093 },
  { name: "ドバイ", lat: 25.2048, lng: 55.2708 },
];
