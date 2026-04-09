import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  fileSizeToBytes,
  speedToBps,
  calcTransferTime,
  calcRequiredSpeed,
  formatTransferTime,
  formatSpeed,
  formatFileSize,
  SPEED_PRESETS,
  type SizeUnit,
  type SpeedUnit,
  type CalcMode,
} from "~/utils/transfer-speed";

export const Route = createFileRoute("/transfer-speed")({
  head: () => ({
    meta: [
      { title: "転送速度・転送時間計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "ファイルサイズと通信速度から転送時間を計算、または目標時間から必要な転送速度を算出します。4G/5G/Wi-Fi/有線LANのプリセット付き。",
      },
      {
        property: "og:title",
        content: "転送速度・転送時間計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ファイルサイズと回線速度から転送時間を計算。4G・5G・Wi-Fi・有線LANなどのプリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/transfer-speed` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "転送速度・転送時間計算機 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "ファイルサイズと回線速度から転送時間を計算します。各種プリセット付き。",
      },
    ],
  }),
  component: TransferSpeedCalculator,
});

const SIZE_UNITS: SizeUnit[] = ["B", "KB", "MB", "GB", "TB"];
const SPEED_UNITS: SpeedUnit[] = ["bps", "Kbps", "Mbps", "Gbps", "KBps", "MBps", "GBps"];

/**
 * 転送速度・転送時間計算機コンポーネント
 */
function TransferSpeedCalculator() {
  const [mode, setMode] = useState<CalcMode>("time");

  // ファイルサイズ
  const [sizeStr, setSizeStr] = useState("1");
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("GB");

  // 転送速度（転送時間計算モード）
  const [speedStr, setSpeedStr] = useState("100");
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("Mbps");
  const [presetKey, setPresetKey] = useState<string>("");

  // 目標時間（必要速度計算モード）
  const [targetHours, setTargetHours] = useState("0");
  const [targetMinutes, setTargetMinutes] = useState("1");
  const [targetSeconds, setTargetSeconds] = useState("0");

  const { showToast } = useToast();
  const { statusRef } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /** ファイルサイズ（バイト） */
  const bytes = useMemo(() => {
    const n = parseFloat(sizeStr);
    if (isNaN(n) || n <= 0) return null;
    return fileSizeToBytes(n, sizeUnit);
  }, [sizeStr, sizeUnit]);

  /** 転送速度（bps） */
  const bps = useMemo(() => {
    const n = parseFloat(speedStr);
    if (isNaN(n) || n <= 0) return null;
    return speedToBps(n, speedUnit);
  }, [speedStr, speedUnit]);

  /** 目標時間（秒） */
  const targetTotalSeconds = useMemo(() => {
    const h = parseInt(targetHours, 10) || 0;
    const m = parseInt(targetMinutes, 10) || 0;
    const s = parseInt(targetSeconds, 10) || 0;
    const total = h * 3600 + m * 60 + s;
    return total > 0 ? total : null;
  }, [targetHours, targetMinutes, targetSeconds]);

  /** 転送時間計算結果 */
  const timeResult = useMemo(() => {
    if (mode !== "time") return null;
    if (bytes === null || bps === null) return null;
    return calcTransferTime(bytes, bps);
  }, [mode, bytes, bps]);

  /** 必要速度計算結果 */
  const speedResult = useMemo(() => {
    if (mode !== "speed") return null;
    if (bytes === null || targetTotalSeconds === null) return null;
    return calcRequiredSpeed(bytes, targetTotalSeconds);
  }, [mode, bytes, targetTotalSeconds]);

  /** プリセット選択時の処理 */
  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setPresetKey(key);
    if (!key) return;
    const preset = SPEED_PRESETS.find((p) => p.name === key);
    if (!preset) return;
    const mbps = preset.bps / 1_000_000;
    if (preset.bps >= 1_000_000_000) {
      const gbps = preset.bps / 1_000_000_000;
      setSpeedStr(gbps % 1 === 0 ? String(gbps) : gbps.toFixed(2));
      setSpeedUnit("Gbps");
    } else if (mbps >= 1) {
      setSpeedStr(mbps % 1 === 0 ? String(mbps) : mbps.toFixed(1));
      setSpeedUnit("Mbps");
    } else {
      const kbps = preset.bps / 1_000;
      setSpeedStr(kbps % 1 === 0 ? String(kbps) : kbps.toFixed(1));
      setSpeedUnit("Kbps");
    }
  }, []);

  /** 結果コピー */
  const handleCopy = useCallback(async () => {
    let text = "";
    if (mode === "time" && timeResult && bytes !== null && bps !== null) {
      text = [
        `ファイルサイズ: ${formatFileSize(bytes)}`,
        `転送速度: ${formatSpeed(bps)}`,
        `転送時間: ${timeResult.formatted}`,
      ].join("\n");
    } else if (mode === "speed" && speedResult && bytes !== null) {
      text = [
        `ファイルサイズ: ${formatFileSize(bytes)}`,
        `必要な転送速度: ${formatSpeed(speedResult.bps)}`,
        `  = ${speedResult.mbps.toFixed(2)} Mbps`,
        `  = ${speedResult.mBps.toFixed(2)} MB/s`,
      ].join("\n");
    }
    if (!text) return;
    const ok = await copy(text);
    showToast(ok ? "計算結果をコピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [mode, timeResult, speedResult, bytes, bps, copy, showToast]);

  // プリセットをカテゴリ別にグルーピング
  const presetGroups = useMemo(() => {
    const groups = new Map<string, typeof SPEED_PRESETS>();
    for (const p of SPEED_PRESETS) {
      const existing = groups.get(p.category) ?? [];
      groups.set(p.category, [...existing, p]);
    }
    return groups;
  }, []);

  return (
    <>
      <h1 className="page-title">転送速度・転送時間計算機</h1>
      <p className="page-description">
        ファイルサイズと回線速度から転送時間を計算、または目標時間から必要な転送速度を算出します。
      </p>

      <div className="tool-container">
        {/* モード切り替え */}
        <div className="ts-mode-tabs" role="tablist" aria-label="計算モード選択">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "time"}
            className={`ts-mode-tab${mode === "time" ? " active" : ""}`}
            onClick={() => setMode("time")}
          >
            転送時間を計算
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "speed"}
            className={`ts-mode-tab${mode === "speed" ? " active" : ""}`}
            onClick={() => setMode("speed")}
          >
            必要速度を計算
          </button>
        </div>

        <form
          className="ts-form"
          onSubmit={(e) => e.preventDefault()}
          aria-label="転送計算フォーム"
        >
          {/* ファイルサイズ */}
          <fieldset className="ts-fieldset">
            <legend>ファイルサイズ</legend>
            <div className="ts-input-row">
              <input
                id="ts-size"
                type="number"
                min="0"
                step="any"
                value={sizeStr}
                onChange={(e) => setSizeStr(e.target.value)}
                placeholder="例: 1"
                aria-label="ファイルサイズの数値"
                className="ts-number-input"
              />
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                aria-label="ファイルサイズ単位"
                className="ts-unit-select"
              >
                {SIZE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            {bytes !== null && (
              <p className="ts-sub-info">
                {formatFileSize(bytes)} ({bytes.toLocaleString()} バイト)
              </p>
            )}
          </fieldset>

          {/* 転送時間計算モード: 転送速度入力 */}
          {mode === "time" && (
            <fieldset className="ts-fieldset">
              <legend>転送速度</legend>
              <div className="ts-input-row">
                <input
                  id="ts-speed"
                  type="number"
                  min="0"
                  step="any"
                  value={speedStr}
                  onChange={(e) => {
                    setSpeedStr(e.target.value);
                    setPresetKey("");
                  }}
                  placeholder="例: 100"
                  aria-label="転送速度の数値"
                  className="ts-number-input"
                />
                <select
                  value={speedUnit}
                  onChange={(e) => {
                    setSpeedUnit(e.target.value as SpeedUnit);
                    setPresetKey("");
                  }}
                  aria-label="転送速度単位"
                  className="ts-unit-select"
                >
                  {SPEED_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ts-preset-row">
                <label htmlFor="ts-preset" className="ts-preset-label">
                  プリセット
                </label>
                <select
                  id="ts-preset"
                  value={presetKey}
                  onChange={handlePresetChange}
                  aria-label="回線速度プリセット"
                  className="ts-preset-select"
                >
                  <option value="">— プリセットから選択 —</option>
                  {Array.from(presetGroups.entries()).map(([category, presets]) => (
                    <optgroup key={category} label={category}>
                      {presets.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </fieldset>
          )}

          {/* 必要速度計算モード: 目標時間入力 */}
          {mode === "speed" && (
            <fieldset className="ts-fieldset">
              <legend>目標転送時間</legend>
              <div className="ts-time-row">
                <div className="ts-time-unit">
                  <input
                    id="ts-hours"
                    type="number"
                    min="0"
                    step="1"
                    value={targetHours}
                    onChange={(e) => setTargetHours(e.target.value)}
                    aria-label="目標時間（時）"
                    className="ts-time-input"
                  />
                  <span className="ts-time-label">時間</span>
                </div>
                <div className="ts-time-unit">
                  <input
                    id="ts-minutes"
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    aria-label="目標時間（分）"
                    className="ts-time-input"
                  />
                  <span className="ts-time-label">分</span>
                </div>
                <div className="ts-time-unit">
                  <input
                    id="ts-seconds"
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={targetSeconds}
                    onChange={(e) => setTargetSeconds(e.target.value)}
                    aria-label="目標時間（秒）"
                    className="ts-time-input"
                  />
                  <span className="ts-time-label">秒</span>
                </div>
              </div>
            </fieldset>
          )}

          {/* 結果表示: 転送時間 */}
          {mode === "time" && (
            <div className={`ts-result${timeResult ? " visible" : ""}`} aria-live="polite">
              {timeResult ? (
                <>
                  <div className="ts-result-main">
                    <span className="ts-result-label">転送時間</span>
                    <span className="ts-result-value">{timeResult.formatted}</span>
                  </div>
                  <div className="ts-result-details">
                    <div className="ts-detail-item">
                      <span className="ts-detail-label">合計秒数</span>
                      <span className="ts-detail-value">
                        {timeResult.seconds < 1
                          ? `${(timeResult.seconds * 1000).toFixed(1)} ms`
                          : `${Math.round(timeResult.seconds).toLocaleString()} 秒`}
                      </span>
                    </div>
                    {bytes !== null && (
                      <div className="ts-detail-item">
                        <span className="ts-detail-label">ファイルサイズ</span>
                        <span className="ts-detail-value">{formatFileSize(bytes)}</span>
                      </div>
                    )}
                    {bps !== null && (
                      <div className="ts-detail-item">
                        <span className="ts-detail-label">転送速度</span>
                        <span className="ts-detail-value">{formatSpeed(bps)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ts-copy-btn"
                    onClick={handleCopy}
                    aria-label="計算結果をコピー"
                  >
                    コピー
                  </button>
                </>
              ) : (
                <p className="ts-result-placeholder">ファイルサイズと転送速度を入力してください</p>
              )}
            </div>
          )}

          {/* 結果表示: 必要速度 */}
          {mode === "speed" && (
            <div className={`ts-result${speedResult ? " visible" : ""}`} aria-live="polite">
              {speedResult ? (
                <>
                  <div className="ts-result-main">
                    <span className="ts-result-label">必要な転送速度</span>
                    <span className="ts-result-value">{formatSpeed(speedResult.bps)}</span>
                  </div>
                  <div className="ts-result-details">
                    <div className="ts-detail-item">
                      <span className="ts-detail-label">bps 表記</span>
                      <span className="ts-detail-value">
                        {speedResult.bps >= 1
                          ? `${Math.round(speedResult.bps).toLocaleString()} bps`
                          : `${speedResult.bps.toExponential(2)} bps`}
                      </span>
                    </div>
                    <div className="ts-detail-item">
                      <span className="ts-detail-label">Mbps</span>
                      <span className="ts-detail-value">{speedResult.mbps.toFixed(4)} Mbps</span>
                    </div>
                    <div className="ts-detail-item">
                      <span className="ts-detail-label">MB/s</span>
                      <span className="ts-detail-value">{speedResult.mBps.toFixed(4)} MB/s</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ts-copy-btn"
                    onClick={handleCopy}
                    aria-label="計算結果をコピー"
                  >
                    コピー
                  </button>
                </>
              ) : (
                <p className="ts-result-placeholder">
                  ファイルサイズと目標転送時間を入力してください
                </p>
              )}
            </div>
          )}
        </form>

        <TipsCard
          title="転送速度の基礎知識"
          items={[
            "回線速度は通常 bps (ビット/秒) で表記されますが、ファイルサイズはバイト (B) なので、転送時間 = ファイルサイズ (bits) ÷ 回線速度 (bps) で計算できます",
            "1 バイト = 8 ビット のため、例えば 100Mbps の回線では理論上 12.5MB/s の転送速度になります",
            "実際の転送速度はプロトコルのオーバーヘッド・電波状況・サーバー負荷などにより理論値の 60〜80% 程度になる場合があります",
            "5G の最大速度は規格上 20Gbps ですが、実際のサービスでは 1〜4Gbps 程度が多いです",
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
