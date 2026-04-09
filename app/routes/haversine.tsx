import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  calcHaversine,
  isValidLatLng,
  formatDistance,
  LOCATION_PRESETS,
  type LatLng,
  type LocationPreset,
} from "~/utils/haversine";

export const Route = createFileRoute("/haversine")({
  head: () => ({
    meta: [
      { title: "Haversine距離計算 | Web ツール集" },
      {
        name: "description",
        content:
          "緯度・経度から2地点間の大円距離と方位角をHaversine公式で計算するツール。km・マイル・m対応。ブラウザ内完結でデータは外部に送信されません。",
      },
      {
        property: "og:title",
        content: "Haversine距離計算 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "緯度・経度から2地点間の大円距離と方位角をHaversine公式で計算するツール。km・マイル・m対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/haversine` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Haversine距離計算 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "緯度・経度から2地点間の大円距離と方位角をHaversine公式で計算するツール。",
      },
    ],
  }),
  component: HaversineTool,
});

/** 座標入力フィールドの値 */
interface CoordInput {
  lat: string;
  lng: string;
}

/** 入力値を LatLng に変換する（無効な場合は null） */
function parseLatLng(input: CoordInput): LatLng | null {
  const lat = parseFloat(input.lat);
  const lng = parseFloat(input.lng);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

/**
 * Haversine距離計算ツールコンポーネント
 */
function HaversineTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [from, setFrom] = useState<CoordInput>({ lat: "", lng: "" });
  const [to, setTo] = useState<CoordInput>({ lat: "", lng: "" });

  const fromLatRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fromLatRef.current?.focus();
  }, []);

  const fromLatLng = useMemo(() => parseLatLng(from), [from]);
  const toLatLng = useMemo(() => parseLatLng(to), [to]);

  const result = useMemo(() => {
    if (!fromLatLng || !toLatLng) return null;
    return calcHaversine(fromLatLng, toLatLng);
  }, [fromLatLng, toLatLng]);

  const handlePresetFrom = useCallback((preset: LocationPreset) => {
    setFrom({
      lat: String(preset.lat),
      lng: String(preset.lng),
    });
  }, []);

  const handlePresetTo = useCallback((preset: LocationPreset) => {
    setTo({
      lat: String(preset.lat),
      lng: String(preset.lng),
    });
  }, []);

  const handleSwap = useCallback(() => {
    setFrom(to);
    setTo(from);
    announceStatus("出発地と目的地を入れ替えました");
  }, [from, to, announceStatus]);

  const handleClear = useCallback(() => {
    setFrom({ lat: "", lng: "" });
    setTo({ lat: "", lng: "" });
    announceStatus("入力をクリアしました");
    fromLatRef.current?.focus();
  }, [announceStatus]);

  const handleCopyResult = useCallback(async () => {
    if (!result) return;
    const text = [
      `距離: ${result.distanceKm.toFixed(3)} km`,
      `距離: ${result.distanceMiles.toFixed(3)} マイル`,
      `距離: ${result.distanceMeters.toFixed(1)} m`,
      `初期方位角: ${result.bearingDeg.toFixed(2)}° (${result.bearingAbbr} / ${result.bearingLabel})`,
      `終着方位角: ${result.finalBearingDeg.toFixed(2)}°`,
    ].join("\n");
    const success = await copy(text);
    if (success) {
      announceStatus("計算結果をコピーしました");
      showToast("計算結果をコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, copy, announceStatus, showToast]);

  const isFromValid = fromLatLng !== null;
  const isToValid = toLatLng !== null;
  const hasAnyInput = from.lat !== "" || from.lng !== "" || to.lat !== "" || to.lng !== "";

  return (
    <>
      <div className="tool-container">
        {/* 出発地入力 */}
        <section className="converter-section" aria-labelledby="from-heading">
          <h2 id="from-heading" className="section-title">
            出発地
          </h2>
          <div className="haversine-coord-row">
            <div className="haversine-coord-field">
              <label htmlFor="from-lat" className="haversine-coord-label">
                緯度 (Latitude)
              </label>
              <input
                id="from-lat"
                ref={fromLatRef}
                type="number"
                value={from.lat}
                onChange={(e) => setFrom((v) => ({ ...v, lat: e.target.value }))}
                placeholder="例: 35.6895"
                min="-90"
                max="90"
                step="any"
                aria-label="出発地の緯度"
                aria-invalid={from.lat !== "" && !isFromValid}
              />
            </div>
            <div className="haversine-coord-field">
              <label htmlFor="from-lng" className="haversine-coord-label">
                経度 (Longitude)
              </label>
              <input
                id="from-lng"
                type="number"
                value={from.lng}
                onChange={(e) => setFrom((v) => ({ ...v, lng: e.target.value }))}
                placeholder="例: 139.6917"
                min="-180"
                max="180"
                step="any"
                aria-label="出発地の経度"
                aria-invalid={from.lng !== "" && !isFromValid}
              />
            </div>
          </div>
          <div className="haversine-preset-row">
            <span className="haversine-preset-label">プリセット:</span>
            <div className="haversine-preset-buttons" role="group" aria-label="出発地プリセット">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="haversine-preset-btn"
                  onClick={() => handlePresetFrom(preset)}
                  aria-label={`出発地を${preset.name}に設定`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 入れ替えボタン */}
        <div className="haversine-swap-row">
          <Button
            type="button"
            variant="outline"
            className="haversine-swap-btn"
            onClick={handleSwap}
            aria-label="出発地と目的地を入れ替え"
          >
            ⇅ 入れ替え
          </Button>
        </div>

        {/* 目的地入力 */}
        <section className="converter-section" aria-labelledby="to-heading">
          <h2 id="to-heading" className="section-title">
            目的地
          </h2>
          <div className="haversine-coord-row">
            <div className="haversine-coord-field">
              <label htmlFor="to-lat" className="haversine-coord-label">
                緯度 (Latitude)
              </label>
              <input
                id="to-lat"
                type="number"
                value={to.lat}
                onChange={(e) => setTo((v) => ({ ...v, lat: e.target.value }))}
                placeholder="例: 34.6873"
                min="-90"
                max="90"
                step="any"
                aria-label="目的地の緯度"
                aria-invalid={to.lat !== "" && !isToValid}
              />
            </div>
            <div className="haversine-coord-field">
              <label htmlFor="to-lng" className="haversine-coord-label">
                経度 (Longitude)
              </label>
              <input
                id="to-lng"
                type="number"
                value={to.lng}
                onChange={(e) => setTo((v) => ({ ...v, lng: e.target.value }))}
                placeholder="例: 135.5260"
                min="-180"
                max="180"
                step="any"
                aria-label="目的地の経度"
                aria-invalid={to.lng !== "" && !isToValid}
              />
            </div>
          </div>
          <div className="haversine-preset-row">
            <span className="haversine-preset-label">プリセット:</span>
            <div className="haversine-preset-buttons" role="group" aria-label="目的地プリセット">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className="haversine-preset-btn"
                  onClick={() => handlePresetTo(preset)}
                  aria-label={`目的地を${preset.name}に設定`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 操作ボタン */}
        <div className="button-group" role="group" aria-label="操作">
          <Button
            type="button"
            className="btn-primary"
            onClick={handleCopyResult}
            disabled={!result}
            aria-label="計算結果をコピー"
          >
            結果をコピー
          </Button>
          <Button
            type="button"
            variant="outline"
            className="btn-clear"
            onClick={handleClear}
            disabled={!hasAnyInput}
            aria-label="入力をクリア"
          >
            クリア
          </Button>
        </div>

        {/* 結果表示 */}
        {result ? (
          <div className="haversine-results" role="region" aria-label="計算結果" aria-live="polite">
            <div className="haversine-result-primary">
              <span className="haversine-result-distance-label">距離</span>
              <span className="haversine-result-distance-main">
                {result.distanceKm.toFixed(3)} km
              </span>
              <span className="haversine-result-distance-sub">
                {formatDistance(result.distanceKm)}
              </span>
            </div>

            <div className="haversine-result-grid">
              <div className="haversine-result-item">
                <span className="haversine-result-label">km</span>
                <code className="haversine-result-value">{result.distanceKm.toFixed(6)}</code>
              </div>
              <div className="haversine-result-item">
                <span className="haversine-result-label">マイル</span>
                <code className="haversine-result-value">{result.distanceMiles.toFixed(6)}</code>
              </div>
              <div className="haversine-result-item">
                <span className="haversine-result-label">m</span>
                <code className="haversine-result-value">{result.distanceMeters.toFixed(3)}</code>
              </div>
              <div className="haversine-result-item">
                <span className="haversine-result-label">初期方位角</span>
                <code className="haversine-result-value">
                  {result.bearingDeg.toFixed(2)}°{" "}
                  <span className="haversine-bearing-label">
                    ({result.bearingAbbr} / {result.bearingLabel})
                  </span>
                </code>
              </div>
              <div className="haversine-result-item">
                <span className="haversine-result-label">終着方位角</span>
                <code className="haversine-result-value">{result.finalBearingDeg.toFixed(2)}°</code>
              </div>
            </div>
          </div>
        ) : (
          hasAnyInput &&
          (!isFromValid || !isToValid) && (
            <div className="haversine-input-hint" role="status" aria-live="polite">
              {!isFromValid
                ? "出発地の緯度・経度を正しく入力してください（緯度: -90〜90、経度: -180〜180）"
                : "目的地の緯度・経度を正しく入力してください（緯度: -90〜90、経度: -180〜180）"}
            </div>
          )
        )}

        {!hasAnyInput && (
          <div className="haversine-empty-state" aria-live="polite">
            出発地と目的地の緯度・経度を入力すると距離と方位角を計算します
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "出発地と目的地の緯度・経度を入力すると自動で計算します",
                "プリセットから主要都市を素早く選択できます",
                "「⇅ 入れ替え」で出発地と目的地を入れ替えられます",
                "「結果をコピー」で全結果をテキストとしてコピーできます",
                "Google マップなどで右クリック→「この場所について」で緯度経度を確認できます",
              ],
            },
            {
              title: "Haversine公式とは",
              items: [
                "地球を球体と見なして2点間の最短距離（大円距離）を計算する公式",
                "実際の地球は扁球体のため、正確な計算にはVincenty公式等が使われる",
                "このツールは地球半径 6371.0088 km を使用",
                "初期方位角: 出発地から見た目的地の方向（北=0°、東=90°、南=180°、西=270°）",
                "終着方位角: 目的地に到着した時の進行方向",
              ],
            },
            {
              title: "入力形式",
              items: [
                "緯度: -90〜90（北緯がプラス、南緯がマイナス）",
                "経度: -180〜180（東経がプラス、西経がマイナス）",
                "小数点以下は任意の桁数を入力可能",
                "例: 東京 緯度 35.6895 / 経度 139.6917",
                "例: ニューヨーク 緯度 40.7128 / 経度 -74.0060",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
