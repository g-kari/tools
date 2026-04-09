import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  simplifyRatio,
  calcHeightFromWidth,
  calcWidthFromHeight,
  ratioToDecimal,
  ASPECT_RATIO_PRESETS,
  type AspectRatioPreset,
} from "~/utils/aspect-ratio";

export const Route = createFileRoute("/aspect-ratio")({
  head: () => ({
    meta: [
      { title: "アスペクト比計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "幅・高さからアスペクト比を計算。比から幅・高さを導出。16:9・4:3・1:1などプリセット対応のアスペクト比計算ツール。",
      },
      {
        property: "og:title",
        content: "アスペクト比計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content: "幅・高さからアスペクト比を計算。比から幅・高さを導出。プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/aspect-ratio` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "アスペクト比計算機 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "幅・高さからアスペクト比を計算するツール。",
      },
    ],
  }),
  component: AspectRatioCalculator,
});

const PREVIEW_MAX_W = 200;
const PREVIEW_MAX_H = 120;

/** アスペクト比のビジュアルプレビュー */
function AspectRatioPreview({ ratioW, ratioH }: { ratioW: number; ratioH: number }) {
  let displayW = PREVIEW_MAX_W;
  let displayH = PREVIEW_MAX_H;

  if (ratioW > 0 && ratioH > 0) {
    const ratio = ratioW / ratioH;
    if (ratio >= PREVIEW_MAX_W / PREVIEW_MAX_H) {
      displayW = PREVIEW_MAX_W;
      displayH = Math.round(PREVIEW_MAX_W / ratio);
    } else {
      displayH = PREVIEW_MAX_H;
      displayW = Math.round(PREVIEW_MAX_H * ratio);
    }
  }

  return (
    <div className="ar-preview-wrapper" aria-label={`${ratioW}:${ratioH} のアスペクト比プレビュー`}>
      <div
        className="ar-preview-box"
        style={
          {
            "--ar-preview-w": `${displayW}px`,
            "--ar-preview-h": `${displayH}px`,
          } as React.CSSProperties
        }
        role="img"
        aria-label={`${ratioW}:${ratioH}`}
      >
        <span className="ar-preview-label">
          {ratioW}:{ratioH}
        </span>
      </div>
    </div>
  );
}

function parsePositiveInt(s: string): number | null {
  const n = parseInt(s, 10);
  if (isNaN(n) || n <= 0 || !Number.isFinite(n)) return null;
  return n;
}

function AspectRatioCalculator() {
  // セクション1: 幅・高さ → 比
  const [widthInput, setWidthInput] = useState("1920");
  const [heightInput, setHeightInput] = useState("1080");

  // セクション2: 比 → 寸法
  const [customRatioW, setCustomRatioW] = useState("16");
  const [customRatioH, setCustomRatioH] = useState("9");
  const [dimensionInput, setDimensionInput] = useState("1920");
  const [selectedPreset, setSelectedPreset] = useState<string>("16:9");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  // 幅・高さから比を計算
  const parsedWidth = useMemo(() => parsePositiveInt(widthInput), [widthInput]);
  const parsedHeight = useMemo(() => parsePositiveInt(heightInput), [heightInput]);

  const simplifiedRatio = useMemo(() => {
    if (parsedWidth === null || parsedHeight === null) return null;
    return simplifyRatio(parsedWidth, parsedHeight);
  }, [parsedWidth, parsedHeight]);

  const decimalRatio = useMemo(() => {
    if (simplifiedRatio === null) return null;
    return ratioToDecimal(simplifiedRatio[0], simplifiedRatio[1]);
  }, [simplifiedRatio]);

  // セクション2: カスタム比
  const parsedCustomW = useMemo(() => parsePositiveInt(customRatioW), [customRatioW]);
  const parsedCustomH = useMemo(() => parsePositiveInt(customRatioH), [customRatioH]);
  const parsedDimension = useMemo(() => parsePositiveInt(dimensionInput), [dimensionInput]);

  const calcHeight = useMemo(() => {
    if (parsedDimension === null || parsedCustomW === null || parsedCustomH === null) return null;
    return calcHeightFromWidth(parsedDimension, parsedCustomW, parsedCustomH);
  }, [parsedDimension, parsedCustomW, parsedCustomH]);

  const calcWidth = useMemo(() => {
    if (parsedDimension === null || parsedCustomW === null || parsedCustomH === null) return null;
    return calcWidthFromHeight(parsedDimension, parsedCustomW, parsedCustomH);
  }, [parsedDimension, parsedCustomW, parsedCustomH]);

  const handleCopyRatio = useCallback(async () => {
    if (!simplifiedRatio) return;
    const text = `${simplifiedRatio[0]}:${simplifiedRatio[1]}`;
    const success = await copy(text);
    if (success) {
      announceStatus(`${text} をコピーしました`);
      showToast(`${text} をコピーしました`, "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [simplifiedRatio, copy, announceStatus, showToast]);

  const handleCopyDimension = useCallback(
    async (value: number, label: string) => {
      const text = String(value);
      const success = await copy(text);
      if (success) {
        announceStatus(`${label} ${text}px をコピーしました`);
        showToast(`${label}: ${text}px をコピーしました`, "success");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast],
  );

  const handlePresetClick = useCallback((preset: AspectRatioPreset) => {
    setSelectedPreset(preset.label);
    setCustomRatioW(String(preset.ratioW));
    setCustomRatioH(String(preset.ratioH));
  }, []);

  return (
    <>
      <div className="tool-container">
        <div className="ar-layout">
          {/* 左側: 幅・高さ → 比 */}
          <div className="ar-controls">
            <section className="ar-section" aria-labelledby="ar-calc-title">
              <h2 className="ar-section-title" id="ar-calc-title">
                幅・高さからアスペクト比を計算
              </h2>

              <div className="ar-input-grid">
                <div className="ar-field">
                  <label htmlFor="ar-width-input">幅（px）</label>
                  <input
                    id="ar-width-input"
                    type="number"
                    className={`ar-number-input${parsedWidth === null && widthInput !== "" ? " error" : ""}`}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    min={1}
                    placeholder="例: 1920"
                    aria-label="幅（ピクセル）"
                    aria-invalid={parsedWidth === null && widthInput !== ""}
                  />
                </div>
                <div className="ar-input-sep" aria-hidden="true">
                  ×
                </div>
                <div className="ar-field">
                  <label htmlFor="ar-height-input">高さ（px）</label>
                  <input
                    id="ar-height-input"
                    type="number"
                    className={`ar-number-input${parsedHeight === null && heightInput !== "" ? " error" : ""}`}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    min={1}
                    placeholder="例: 1080"
                    aria-label="高さ（ピクセル）"
                    aria-invalid={parsedHeight === null && heightInput !== ""}
                  />
                </div>
              </div>

              {simplifiedRatio !== null ? (
                <div className="ar-result" role="region" aria-label="アスペクト比の計算結果">
                  <div>
                    <div
                      className="ar-result-ratio"
                      aria-label={`アスペクト比: ${simplifiedRatio[0]}対${simplifiedRatio[1]}`}
                    >
                      {simplifiedRatio[0]}:{simplifiedRatio[1]}
                    </div>
                    {decimalRatio !== null && (
                      <div className="ar-result-decimal">≈ {decimalRatio.toFixed(4)}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ar-copy-btn"
                    onClick={handleCopyRatio}
                    aria-label={`アスペクト比 ${simplifiedRatio[0]}:${simplifiedRatio[1]} をコピー`}
                  >
                    コピー
                  </button>
                </div>
              ) : (
                <p className="ar-placeholder">幅と高さに正の整数を入力してください</p>
              )}
            </section>

            {/* プリセット */}
            <section className="ar-section" aria-labelledby="ar-presets-title">
              <h2 className="ar-section-title" id="ar-presets-title">
                よく使われる比率
              </h2>
              <div className="ar-presets-grid" role="list" aria-label="アスペクト比プリセット">
                {ASPECT_RATIO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    role="listitem"
                    className={`ar-preset-btn${selectedPreset === preset.label ? " active" : ""}`}
                    onClick={() => handlePresetClick(preset)}
                    aria-pressed={selectedPreset === preset.label}
                    aria-label={`${preset.label} - ${preset.description}`}
                  >
                    <span className="ar-preset-label">{preset.label}</span>
                    <span className="ar-preset-desc">{preset.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* 右側: 比 → 寸法変換 + プレビュー */}
          <div className="ar-right">
            {/* ビジュアルプレビュー */}
            {simplifiedRatio !== null && (
              <section className="ar-section" aria-labelledby="ar-preview-title">
                <h2 className="ar-section-title" id="ar-preview-title">
                  プレビュー
                </h2>
                <AspectRatioPreview ratioW={simplifiedRatio[0]} ratioH={simplifiedRatio[1]} />
              </section>
            )}

            {/* 比 → 寸法変換 */}
            <section className="ar-section" aria-labelledby="ar-convert-title">
              <h2 className="ar-section-title" id="ar-convert-title">
                アスペクト比から寸法を計算
              </h2>

              <div className="ar-convert-ratio-row" role="group" aria-label="アスペクト比の入力">
                <span className="ar-convert-ratio-sep" aria-hidden="true">
                  比率:
                </span>
                <input
                  type="number"
                  className="ar-convert-ratio-input"
                  value={customRatioW}
                  onChange={(e) => {
                    setCustomRatioW(e.target.value);
                    setSelectedPreset("");
                  }}
                  min={1}
                  aria-label="比率の幅"
                  placeholder="16"
                />
                <span className="ar-convert-ratio-sep" aria-hidden="true">
                  :
                </span>
                <input
                  type="number"
                  className="ar-convert-ratio-input"
                  value={customRatioH}
                  onChange={(e) => {
                    setCustomRatioH(e.target.value);
                    setSelectedPreset("");
                  }}
                  min={1}
                  aria-label="比率の高さ"
                  placeholder="9"
                />
              </div>

              <div className="ar-convert-rows">
                {/* 幅を入力 → 高さを計算 */}
                <div className="ar-convert-row" role="group" aria-label="幅から高さを計算">
                  <label className="ar-convert-row-label" htmlFor="ar-convert-dim">
                    幅:
                  </label>
                  <input
                    id="ar-convert-dim"
                    type="number"
                    className="ar-number-input"
                    value={dimensionInput}
                    onChange={(e) => setDimensionInput(e.target.value)}
                    min={1}
                    aria-label="基準となる幅（ピクセル）"
                    placeholder="1920"
                  />
                  <button
                    type="button"
                    className="ar-copy-btn"
                    onClick={() => calcHeight !== null && handleCopyDimension(calcHeight, "高さ")}
                    disabled={calcHeight === null}
                    aria-label={
                      calcHeight !== null
                        ? `高さ ${calcHeight}px をコピー`
                        : "幅と比率を入力してください"
                    }
                  >
                    コピー
                  </button>
                </div>

                <div
                  className="ar-convert-result highlight"
                  aria-live="polite"
                  aria-label={
                    calcHeight !== null ? `高さ: ${calcHeight}px` : "高さを計算できません"
                  }
                >
                  {calcHeight !== null ? `高さ: ${calcHeight}px` : "—"}
                </div>

                {/* 高さを入力 → 幅を計算 */}
                <div className="ar-convert-row" role="group" aria-label="高さから幅を計算">
                  <label className="ar-convert-row-label" htmlFor="ar-convert-dim-h">
                    高さ:
                  </label>
                  <input
                    id="ar-convert-dim-h"
                    type="number"
                    className="ar-number-input"
                    value={dimensionInput}
                    onChange={(e) => setDimensionInput(e.target.value)}
                    min={1}
                    aria-label="基準となる高さ（ピクセル）"
                    placeholder="1080"
                  />
                  <button
                    type="button"
                    className="ar-copy-btn"
                    onClick={() => calcWidth !== null && handleCopyDimension(calcWidth, "幅")}
                    disabled={calcWidth === null}
                    aria-label={
                      calcWidth !== null
                        ? `幅 ${calcWidth}px をコピー`
                        : "高さと比率を入力してください"
                    }
                  >
                    コピー
                  </button>
                </div>

                <div
                  className="ar-convert-result highlight"
                  aria-live="polite"
                  aria-label={calcWidth !== null ? `幅: ${calcWidth}px` : "幅を計算できません"}
                >
                  {calcWidth !== null ? `幅: ${calcWidth}px` : "—"}
                </div>
              </div>
            </section>

            <TipsCard
              sections={[
                {
                  title: "使い方",
                  items: [
                    "【比を調べる】幅と高さを入力すると、最も簡単な形のアスペクト比を計算します",
                    "【寸法を計算】比率を設定し、幅または高さを入力すると対応する寸法を算出します",
                    "プリセットをクリックすると比率欄に自動入力されます",
                    "結果の「コピー」ボタンで値をクリップボードへコピーできます",
                  ],
                },
                {
                  title: "アスペクト比について",
                  items: [
                    "16:9 — 現在最も一般的な動画・モニター規格（Full HD, 4K）",
                    "4:3 — 昔のテレビ・モニターの規格",
                    "1:1 — 正方形。SNSのアイコンやサムネイルに多い",
                    "9:16 — スマートフォン縦向き動画（TikTok等）",
                    "21:9 — シネマスコープ。ウルトラワイドモニター",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <StatusAnnouncer ref={statusRef} />
    </>
  );
}
