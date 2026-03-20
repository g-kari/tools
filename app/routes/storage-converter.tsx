import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  convertStorage,
  formatStorageValue,
  STORAGE_UNITS,
  STORAGE_UNIT_GROUPS,
  GROUP_LABELS,
  type StorageUnit,
} from "~/utils/storage-converter";

export const Route = createFileRoute("/storage-converter")({
  head: () => ({
    meta: [
      { title: "ストレージ単位変換 | Web ツール集" },
      {
        name: "description",
        content:
          "bit・B・KB・MB・GB・TB・PBとKiB・MiB・GiB・TiB・PiBを相互変換。SI単位（10進法）とIEC単位（2進法）の両方に対応。ブラウザ内完結でデータは外部に送信されません。",
      },
      {
        property: "og:title",
        content: "ストレージ単位変換 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "bit・B・KB・MB・GB・TB・PBとKiB・MiB・GiB・TiB・PiBを相互変換。SI単位（10進法）とIEC単位（2進法）の両方に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/storage-converter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ストレージ単位変換 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "bit・B・KB・MB・GB・TB・PBとKiB・MiB・GiB・TiB・PiBを相互変換するツール。",
      },
    ],
  }),
  component: StorageConverterTool,
});

const GROUP_ORDER: Array<StorageUnit["group"]> = ["bits", "decimal", "binary"];

/**
 * ストレージ単位変換ツールコンポーネント
 */
function StorageConverterTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputValue, setInputValue] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("GB");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const numericValue = useMemo(() => {
    const v = parseFloat(inputValue);
    return isNaN(v) ? null : v;
  }, [inputValue]);

  const conversionResults = useMemo(() => {
    if (numericValue === null) return [];
    return convertStorage(numericValue, selectedUnit);
  }, [numericValue, selectedUnit]);

  const resultMap = useMemo(() => {
    return Object.fromEntries(conversionResults.map((r) => [r.unitId, r.value]));
  }, [conversionResults]);

  const handleClear = useCallback(() => {
    setInputValue("");
    announceStatus("入力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopyRow = useCallback(
    async (unitId: string) => {
      const unit = STORAGE_UNITS.find((u) => u.id === unitId);
      const value = resultMap[unitId];
      if (!unit || value === undefined) return;
      const text = `${formatStorageValue(value)} ${unit.abbr}`;
      const success = await copy(text);
      if (success) {
        announceStatus(`${unit.abbr} の値をコピーしました`);
        showToast(`${unit.abbr} をコピーしました`, "success");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [resultMap, copy, announceStatus, showToast]
  );

  const handleCopyAll = useCallback(async () => {
    if (conversionResults.length === 0) return;
    const lines = conversionResults
      .map((r) => {
        const unit = STORAGE_UNITS.find((u) => u.id === r.unitId);
        if (!unit) return null;
        return `${formatStorageValue(r.value)} ${unit.abbr}`;
      })
      .filter(Boolean)
      .join("\n");
    const success = await copy(lines);
    if (success) {
      announceStatus("全変換結果をコピーしました");
      showToast("全変換結果をコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [conversionResults, copy, announceStatus, showToast]);

  const hasInput = inputValue.trim() !== "";
  const isInvalid =
    hasInput && (numericValue === null || numericValue < 0);

  return (
    <>
      <div className="tool-container">
        {/* 入力エリア */}
        <section className="converter-section" aria-labelledby="sc-input-heading">
          <h2 id="sc-input-heading" className="section-title">
            変換する値を入力
          </h2>
          <div className="sc-input-row">
            <div className="sc-input-field">
              <label htmlFor="sc-value" className="sc-field-label">
                数値
              </label>
              <input
                id="sc-value"
                ref={inputRef}
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="例: 1.5"
                min="0"
                step="any"
                aria-label="変換する数値"
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? "sc-error" : undefined}
              />
              {isInvalid && (
                <span id="sc-error" className="error-message" role="alert">
                  0以上の数値を入力してください
                </span>
              )}
            </div>
            <div className="sc-select-field">
              <label htmlFor="sc-unit" className="sc-field-label">
                単位
              </label>
              <select
                id="sc-unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                aria-label="変換元の単位"
              >
                {GROUP_ORDER.map((group) => (
                  <optgroup key={group} label={GROUP_LABELS[group]}>
                    {STORAGE_UNIT_GROUPS[group].map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.abbr} – {unit.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleCopyAll}
              disabled={conversionResults.length === 0}
              aria-label="全変換結果をコピー"
            >
              全結果をコピー
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!hasInput}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>
        </section>

        {/* 変換結果 */}
        {conversionResults.length > 0 ? (
          <section
            className="sc-results"
            aria-label="変換結果"
            aria-live="polite"
          >
            {GROUP_ORDER.map((group) => {
              const units = STORAGE_UNIT_GROUPS[group];
              return (
                <div key={group} className="sc-group">
                  <div className="sc-group-header">{GROUP_LABELS[group]}</div>
                  {units.map((unit) => {
                    const value = resultMap[unit.id];
                    const formatted =
                      value !== undefined ? formatStorageValue(value) : "—";
                    const isCurrent = unit.id === selectedUnit;
                    return (
                      <div
                        key={unit.id}
                        className={`sc-unit-row${isCurrent ? " sc-current-unit" : ""}`}
                        role="row"
                      >
                        <span className="sc-unit-abbr" title={unit.label}>
                          {unit.abbr}
                        </span>
                        <span className="sc-unit-value">
                          {formatted}
                        </span>
                        <button
                          type="button"
                          className="sc-copy-btn"
                          onClick={() => handleCopyRow(unit.id)}
                          aria-label={`${unit.abbr} の値 ${formatted} をコピー`}
                          title="コピー"
                        >
                          📋
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        ) : (
          hasInput && isInvalid ? null : (
            <div className="sc-empty-state" aria-live="polite">
              数値と単位を入力すると全ての単位への変換結果が表示されます
            </div>
          )
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "数値を入力し、単位を選択すると即座に全単位へ変換します",
                "行の📋ボタンでその単位の値をコピーできます",
                "「全結果をコピー」で全変換結果をまとめてコピーできます",
                "選択中の単位の行はハイライト表示されます",
              ],
            },
            {
              title: "SI単位（10進法）とIEC単位（2進法）の違い",
              items: [
                "SI単位: KB=1,000B / MB=1,000,000B（ストレージ容量の表記に多用）",
                "IEC単位: KiB=1,024B / MiB=1,048,576B（OSやファイルシステムで多用）",
                "例: 1GBのSSDは1,000,000,000Bだが、OSでは約0.931GiBと表示される",
                "Windowsは従来GB表記でIEC単位（GiB）の意味で使用していたため混乱が生じやすい",
              ],
            },
            {
              title: "対応単位一覧",
              items: [
                "bit: ビット（最小単位）",
                "B: バイト（8bit）",
                "KB/KiB: キロバイト（1,000B）/ キビバイト（1,024B）",
                "MB/MiB: メガバイト（10^6B）/ メビバイト（1,024KiB）",
                "GB/GiB: ギガバイト（10^9B）/ ギビバイト（1,024MiB）",
                "TB/TiB: テラバイト（10^12B）/ テビバイト（1,024GiB）",
                "PB/PiB: ペタバイト（10^15B）/ ペビバイト（1,024TiB）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
