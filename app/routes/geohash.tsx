import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  encode,
  decode,
  getNeighbors,
  isValidGeohash,
  type GeohashDecodeResult,
  type GeohashNeighbors,
} from "~/utils/geohash";

export const Route = createFileRoute("/geohash")({
  head: () => ({
    meta: [
      { title: "Geohashエンコーダー/デコーダー | Web ツール集" },
      {
        name: "description",
        content:
          "緯度・経度をGeohash文字列に変換（エンコード）、またはGeohash文字列から座標を取得（デコード）するツール。精度1〜12、隣接セル表示対応。",
      },
      {
        property: "og:title",
        content: "Geohashエンコーダー/デコーダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "緯度・経度をGeohash文字列に変換、またはGeohashから座標を取得するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/geohash` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: GeohashTool,
});

/** モード: エンコード or デコード */
type Mode = "encode" | "decode";

/**
 * Geohashエンコーダー/デコーダーページコンポーネント
 */
function GeohashTool() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>("encode");

  // エンコードモード入力
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [precision, setPrecision] = useState(9);

  // デコードモード入力
  const [hashInput, setHashInput] = useState("");

  // エンコード入力バリデーション
  const encodeError = useMemo<string | null>(() => {
    if (!latStr || !lngStr) return null;
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat)) return "緯度に有効な数値を入力してください";
    if (isNaN(lng)) return "経度に有効な数値を入力してください";
    if (lat < -90 || lat > 90) return "緯度は-90〜90の範囲で入力してください";
    if (lng < -180 || lng > 180)
      return "経度は-180〜180の範囲で入力してください";
    return null;
  }, [latStr, lngStr]);

  // エンコード結果
  const encodeResult = useMemo<string | null>(() => {
    if (!latStr || !lngStr) return null;
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return null;
    try {
      return encode(lat, lng, precision);
    } catch {
      return null;
    }
  }, [latStr, lngStr, precision]);

  // デコード入力バリデーション
  const decodeError = useMemo<string | null>(() => {
    if (!hashInput) return null;
    if (!isValidGeohash(hashInput))
      return `"${hashInput}" は有効なGeohash文字列ではありません（使用可能文字: 0-9 b-z、a/i/l/o を除く）`;
    return null;
  }, [hashInput]);

  // デコード結果
  const decodeResult = useMemo<GeohashDecodeResult | null>(() => {
    if (!hashInput || !isValidGeohash(hashInput)) return null;
    try {
      return decode(hashInput);
    } catch {
      return null;
    }
  }, [hashInput]);

  // 隣接セル（エンコード/デコード両モードで表示）
  const neighbors = useMemo<GeohashNeighbors | null>(() => {
    const hash = mode === "encode" ? encodeResult : hashInput;
    if (!hash || !isValidGeohash(hash)) return null;
    try {
      return getNeighbors(hash);
    } catch {
      return null;
    }
  }, [mode, encodeResult, hashInput]);

  const currentHash =
    mode === "encode"
      ? encodeResult
      : isValidGeohash(hashInput)
        ? hashInput
        : null;

  const handleCopyHash = useCallback(async () => {
    if (!currentHash) return;
    const success = await copy(currentHash);
    if (success) {
      showToast("Geohashをコピーしました", "success");
      announceStatus("Geohashをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [currentHash, copy, showToast, announceStatus]);

  const handleCopyCoords = useCallback(async () => {
    if (!decodeResult) return;
    const text = `${decodeResult.lat}, ${decodeResult.lng}`;
    const success = await copy(text);
    if (success) {
      showToast("座標をコピーしました", "success");
      announceStatus("座標をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [decodeResult, copy, showToast, announceStatus]);

  const handleNeighborClick = useCallback(
    (hash: string) => {
      setMode("decode");
      setHashInput(hash);
      announceStatus(`${hash} に移動しました`);
    },
    [announceStatus]
  );

  // 3x3グリッドの配列順（左上から右下）
  const neighborGrid = neighbors
    ? [
        { label: "NW", hash: neighbors.nw },
        { label: "N", hash: neighbors.n },
        { label: "NE", hash: neighbors.ne },
        { label: "W", hash: neighbors.w },
        { label: "中心", hash: neighbors.center, isCenter: true },
        { label: "E", hash: neighbors.e },
        { label: "SW", hash: neighbors.sw },
        { label: "S", hash: neighbors.s },
        { label: "SE", hash: neighbors.se },
      ]
    : [];

  return (
    <>
      <div className="tool-container">
        <div
          className="geohash-mode-tabs"
          role="tablist"
          aria-label="操作モード選択"
        >
          <button
            role="tab"
            aria-selected={mode === "encode"}
            className={`geohash-tab-btn ${mode === "encode" ? "active" : ""}`}
            onClick={() => setMode("encode")}
          >
            エンコード（座標 → Geohash）
          </button>
          <button
            role="tab"
            aria-selected={mode === "decode"}
            className={`geohash-tab-btn ${mode === "decode" ? "active" : ""}`}
            onClick={() => setMode("decode")}
          >
            デコード（Geohash → 座標）
          </button>
        </div>

        {mode === "encode" && (
          <section aria-label="エンコード入力">
            <div className="geohash-inputs-grid">
              <div className="geohash-input-group">
                <label htmlFor="geohash-lat" className="geohash-input-label">
                  緯度（Latitude）
                </label>
                <input
                  id="geohash-lat"
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  placeholder="例: 35.6895"
                  aria-describedby="geohash-lat-hint"
                />
                <p id="geohash-lat-hint" className="slug-hint">
                  -90〜90
                </p>
              </div>
              <div className="geohash-input-group">
                <label htmlFor="geohash-lng" className="geohash-input-label">
                  経度（Longitude）
                </label>
                <input
                  id="geohash-lng"
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  placeholder="例: 139.6917"
                  aria-describedby="geohash-lng-hint"
                />
                <p id="geohash-lng-hint" className="slug-hint">
                  -180〜180
                </p>
              </div>
            </div>

            <div className="geohash-precision-row">
              <label
                htmlFor="geohash-precision"
                className="geohash-precision-label"
              >
                精度
              </label>
              <input
                id="geohash-precision"
                type="range"
                min="1"
                max="12"
                value={precision}
                onChange={(e) => setPrecision(parseInt(e.target.value, 10))}
                className="geohash-precision-slider"
                aria-valuemin={1}
                aria-valuemax={12}
                aria-valuenow={precision}
              />
              <span className="geohash-precision-value">{precision}</span>
            </div>

            {encodeError && (
              <div className="geohash-error" role="alert">
                {encodeError}
              </div>
            )}

            {encodeResult ? (
              <div
                className="geohash-result-block"
                aria-label="エンコード結果"
                aria-live="polite"
              >
                <div className="geohash-result-header">
                  <span className="geohash-result-label">Geohash</span>
                  <button
                    className="geohash-copy-btn"
                    onClick={handleCopyHash}
                    aria-label="Geohash文字列をコピー"
                  >
                    コピー
                  </button>
                </div>
                <code className="geohash-result-value">{encodeResult}</code>
              </div>
            ) : (
              !encodeError && (
                <div className="geohash-empty-state" aria-live="polite">
                  <p>緯度と経度を入力するとGeohashが表示されます</p>
                </div>
              )
            )}
          </section>
        )}

        {mode === "decode" && (
          <section aria-label="デコード入力">
            <div className="converter-section">
              <label htmlFor="geohash-input" className="section-title">
                Geohash文字列
              </label>
              <input
                id="geohash-input"
                type="text"
                value={hashInput}
                onChange={(e) =>
                  setHashInput(e.target.value.toLowerCase().trim())
                }
                placeholder="例: xn76urwe9"
                aria-describedby="geohash-input-hint"
                maxLength={12}
              />
              <p id="geohash-input-hint" className="slug-hint">
                1〜12文字（使用可能文字: 0-9 b-z、ただし a・i・l・o を除く）
              </p>
            </div>

            {decodeError && (
              <div className="geohash-error" role="alert">
                {decodeError}
              </div>
            )}

            {decodeResult ? (
              <div
                className="geohash-result-block"
                aria-label="デコード結果"
                aria-live="polite"
              >
                <div className="geohash-result-header">
                  <span className="geohash-result-label">デコード結果</span>
                  <button
                    className="geohash-copy-btn"
                    onClick={handleCopyCoords}
                    aria-label="座標をコピー"
                  >
                    座標をコピー
                  </button>
                </div>
                <div className="geohash-decode-coords">
                  <div className="geohash-coord-item">
                    <span className="geohash-coord-label">緯度（Lat）</span>
                    <span className="geohash-coord-value">
                      {decodeResult.lat}
                    </span>
                  </div>
                  <div className="geohash-coord-item">
                    <span className="geohash-coord-label">経度（Lng）</span>
                    <span className="geohash-coord-value">
                      {decodeResult.lng}
                    </span>
                  </div>
                </div>
                <div className="geohash-bounds-section">
                  <p className="geohash-bounds-title">バウンディングボックス</p>
                  <div className="geohash-bounds-grid">
                    <div className="geohash-bound-item">
                      <span className="geohash-bound-label">最小緯度</span>
                      <span className="geohash-bound-value">
                        {decodeResult.bounds.minLat.toFixed(7)}
                      </span>
                    </div>
                    <div className="geohash-bound-item">
                      <span className="geohash-bound-label">最大緯度</span>
                      <span className="geohash-bound-value">
                        {decodeResult.bounds.maxLat.toFixed(7)}
                      </span>
                    </div>
                    <div className="geohash-bound-item">
                      <span className="geohash-bound-label">最小経度</span>
                      <span className="geohash-bound-value">
                        {decodeResult.bounds.minLng.toFixed(7)}
                      </span>
                    </div>
                    <div className="geohash-bound-item">
                      <span className="geohash-bound-label">最大経度</span>
                      <span className="geohash-bound-value">
                        {decodeResult.bounds.maxLng.toFixed(7)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !decodeError && (
                <div className="geohash-empty-state" aria-live="polite">
                  <p>Geohash文字列を入力すると座標が表示されます</p>
                </div>
              )
            )}
          </section>
        )}

        {neighbors && (
          <section className="geohash-neighbors-section" aria-label="隣接Geohashセル">
            <p className="geohash-neighbors-title">
              隣接セル（クリックでデコード）
            </p>
            <div
              className="geohash-neighbors-grid"
              role="grid"
              aria-label="3x3隣接セルグリッド"
            >
              {neighborGrid.map(({ label, hash, isCenter }) => (
                <div
                  key={label}
                  className={`geohash-neighbor-cell ${isCenter ? "center" : ""}`}
                  role="gridcell"
                  onClick={isCenter ? undefined : () => handleNeighborClick(hash)}
                  tabIndex={isCenter ? undefined : 0}
                  aria-label={`${label}: ${hash}`}
                  onKeyDown={
                    isCenter
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNeighborClick(hash);
                          }
                        }
                  }
                >
                  <span className="geohash-neighbor-direction">{label}</span>
                  <span className="geohash-neighbor-hash">{hash}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "Geohashとは",
              items: [
                "Geohashは緯度・経度を短い英数字文字列に変換する地理座標エンコーディングシステムです",
                "精度（文字数）が増えるほど表す領域が小さくなります。1文字≒5000km × 5000km、9文字≒4.8m × 4.8m",
                "隣接するGeohashセルはプレフィックスを共有する傾向があり、近隣検索の最適化に使われます",
                "データベースの地理空間インデックスやRedis Geosearch、位置情報サービスで広く使用されます",
              ],
            },
            {
              title: "使い方",
              items: [
                "エンコード: 緯度・経度を入力し、精度スライダーで文字数（1〜12）を調整します",
                "デコード: Geohash文字列を入力すると中心座標とバウンディングボックスが表示されます",
                "隣接セル: 計算結果の下に3×3グリッドで8方向の隣接セルが表示されます",
                "隣接セルをクリックするとそのGeohashのデコード結果に切り替わります",
                "使用可能文字は「0-9 b-z」ですが「a・i・l・o」は含みません（混同防止のため）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
