import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type BorderRadiusState,
  type BorderRadiusCorner,
  BORDER_RADIUS_PRESETS,
  createDefaultState,
  generateBorderRadiusValue,
  generateFullCSS,
} from "~/utils/css-border-radius";

export const Route = createFileRoute("/css-border-radius")({
  head: () => ({
    meta: [
      { title: "CSS Border Radiusジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS border-radiusをビジュアルエディターで作成。4コーナーを独立制御・楕円モード・プリセット対応のオンラインツール。円形・ピル型・リーフなど多彩な形状を直感的に試せます。",
      },
      {
        property: "og:title",
        content: "CSS Border Radiusジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS border-radiusをビジュアルエディターで作成。4コーナー独立制御・楕円モード・プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-border-radius` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Border Radiusジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS border-radiusをビジュアルエディターで作成。4コーナー独立制御・楕円モード・プリセット対応。",
      },
    ],
  }),
  component: CssBorderRadiusGenerator,
});

/** コーナーキーの型 */
type CornerKey = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

/** コーナー定義 */
const CORNER_DEFS: { key: CornerKey; label: string }[] = [
  { key: "topLeft", label: "左上" },
  { key: "topRight", label: "右上" },
  { key: "bottomLeft", label: "左下" },
  { key: "bottomRight", label: "右下" },
];

/**
 * CSS Border Radius ジェネレーター コンポーネント
 * 4コーナーの角丸を独立して設定し、CSS コードを生成する
 */
function CssBorderRadiusGenerator() {
  const [state, setState] = useState<BorderRadiusState>(createDefaultState);
  const [previewWidth, setPreviewWidth] = useState(160);
  const [previewHeight, setPreviewHeight] = useState(120);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成された CSS プロパティ値 */
  const borderRadiusValue = useMemo(
    () => generateBorderRadiusValue(state),
    [state]
  );

  /** 生成された CSS コード全体 */
  const generatedCSS = useMemo(() => generateFullCSS(state), [state]);

  /** コーナーの値を更新する */
  const updateCorner = useCallback(
    (key: CornerKey, axis: "h" | "v", value: number) => {
      setState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [axis]: value,
          // 非楕円モードでは h/v を同期
          ...(axis === "h" && !prev.elliptic ? { v: value } : {}),
        },
      }));
    },
    []
  );

  /** 単位を変更する */
  const setUnit = useCallback((unit: "px" | "%") => {
    setState((prev) => ({ ...prev, unit }));
  }, []);

  /** 楕円モードを切り替える */
  const toggleElliptic = useCallback(() => {
    setState((prev) => {
      const next = !prev.elliptic;
      if (!next) {
        // 楕円モードをオフにする際、h に v を揃える
        const syncCorner = (c: BorderRadiusCorner): BorderRadiusCorner => ({
          h: c.h,
          v: c.h,
        });
        return {
          ...prev,
          elliptic: next,
          topLeft: syncCorner(prev.topLeft),
          topRight: syncCorner(prev.topRight),
          bottomRight: syncCorner(prev.bottomRight),
          bottomLeft: syncCorner(prev.bottomLeft),
        };
      }
      return { ...prev, elliptic: next };
    });
  }, []);

  /** プリセットを適用する */
  const applyPreset = useCallback(
    (index: number) => {
      const preset = BORDER_RADIUS_PRESETS[index];
      if (!preset) return;
      setState((prev) => ({
        ...preset.state,
        elliptic: prev.elliptic,
      }));
      announceStatus(`「${preset.label}」プリセットを適用しました`);
    },
    [announceStatus]
  );

  /** リセットする */
  const handleReset = useCallback(() => {
    setState(createDefaultState());
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  /** CSS をクリップボードにコピーする */
  const handleCopyCSS = useCallback(async () => {
    const success = await copy(generatedCSS);
    if (success) {
      announceStatus("CSSをクリップボードにコピーしました");
      showToast("CSSをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, generatedCSS, announceStatus, showToast]);

  /** スライダーの最大値 */
  const maxValue = state.unit === "%" ? 50 : 200;

  return (
    <>
      <div className="tool-container">
        <div className="cbr-layout">
          {/* 左側: コントロールパネル */}
          <div className="cbr-controls" aria-label="角丸設定パネル">
            {/* プリセット */}
            <section
              className="cbr-section"
              aria-labelledby="cbr-presets-title"
            >
              <h2 className="cbr-section-title" id="cbr-presets-title">
                プリセット
              </h2>
              <div className="cbr-presets">
                {BORDER_RADIUS_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="cbr-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.label}」プリセットを適用`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 単位・モード設定 */}
            <section
              className="cbr-section"
              aria-labelledby="cbr-options-title"
            >
              <h2 className="cbr-section-title" id="cbr-options-title">
                オプション
              </h2>
              <div className="cbr-toggle-row">
                <span className="cbr-toggle-label">単位:</span>
                <div
                  className="cbr-toggle-group"
                  role="group"
                  aria-label="単位の選択"
                >
                  {(["px", "%"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`cbr-toggle-btn${state.unit === u ? " cbr-toggle-btn--active" : ""}`}
                      onClick={() => setUnit(u)}
                      aria-pressed={state.unit === u}
                      aria-label={`単位: ${u}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={`cbr-toggle-btn${state.elliptic ? " cbr-toggle-btn--active" : ""}`}
                  onClick={toggleElliptic}
                  aria-pressed={state.elliptic}
                  aria-label="楕円モード（水平・垂直を独立制御）"
                >
                  楕円モード
                </button>
              </div>
            </section>

            {/* コーナー設定 */}
            <section
              className="cbr-section"
              aria-labelledby="cbr-corners-title"
            >
              <div className="cbr-section-header">
                <h2 className="cbr-section-title" id="cbr-corners-title">
                  コーナー設定
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-clear"
                  onClick={handleReset}
                  aria-label="すべての設定をリセット"
                >
                  リセット
                </Button>
              </div>

              <div
                className="cbr-corners-grid"
                role="group"
                aria-label="各コーナーの角丸設定"
              >
                {CORNER_DEFS.map(({ key, label }) => {
                  const corner = state[key];
                  return (
                    <div key={key} className="cbr-corner-item">
                      <span className="cbr-corner-label">{label}</span>
                      <div className="cbr-corner-inputs">
                        {/* 水平 */}
                        <div className="cbr-input-row">
                          {state.elliptic && (
                            <span
                              className="cbr-input-axis-label"
                              aria-hidden="true"
                            >
                              H
                            </span>
                          )}
                          <input
                            type="range"
                            min={0}
                            max={maxValue}
                            step={1}
                            value={corner.h}
                            className="cbr-range"
                            onChange={(e) =>
                              updateCorner(key, "h", Number(e.target.value))
                            }
                            aria-label={`${label}${state.elliptic ? " 水平" : ""}の角丸`}
                          />
                          <input
                            type="number"
                            min={0}
                            max={maxValue}
                            value={corner.h}
                            className="cbr-number-input"
                            onChange={(e) => {
                              const v = Math.max(
                                0,
                                Math.min(maxValue, Number(e.target.value))
                              );
                              updateCorner(key, "h", v);
                            }}
                            aria-label={`${label}${state.elliptic ? " 水平" : ""}の角丸の数値入力`}
                          />
                          <span className="cbr-range-value" aria-hidden="true">
                            {corner.h}{state.unit}
                          </span>
                        </div>

                        {/* 垂直（楕円モード時のみ） */}
                        {state.elliptic && (
                          <div className="cbr-input-row">
                            <span
                              className="cbr-input-axis-label"
                              aria-hidden="true"
                            >
                              V
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={maxValue}
                              step={1}
                              value={corner.v}
                              className="cbr-range"
                              onChange={(e) =>
                                updateCorner(key, "v", Number(e.target.value))
                              }
                              aria-label={`${label} 垂直の角丸`}
                            />
                            <input
                              type="number"
                              min={0}
                              max={maxValue}
                              value={corner.v}
                              className="cbr-number-input"
                              onChange={(e) => {
                                const v = Math.max(
                                  0,
                                  Math.min(maxValue, Number(e.target.value))
                                );
                                updateCorner(key, "v", v);
                              }}
                              aria-label={`${label} 垂直の角丸の数値入力`}
                            />
                            <span
                              className="cbr-range-value"
                              aria-hidden="true"
                            >
                              {corner.v}{state.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 右側: プレビュー + CSS 出力 */}
          <div className="cbr-right">
            {/* ライブプレビュー */}
            <section
              className="cbr-preview-section"
              aria-labelledby="cbr-preview-title"
            >
              <h2 className="cbr-section-title" id="cbr-preview-title">
                ライブプレビュー
              </h2>
              <div className="cbr-preview-canvas">
                <div
                  className="cbr-preview-box"
                  style={{
                    borderRadius: borderRadiusValue,
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                  }}
                  aria-label="角丸のプレビュー"
                >
                  <span className="cbr-preview-box-label">
                    {previewWidth}×{previewHeight}
                  </span>
                </div>
              </div>

              {/* プレビューサイズ調整 */}
              <div className="cbr-size-row">
                <div className="cbr-size-item">
                  <span className="cbr-size-label">
                    幅: {previewWidth}px
                  </span>
                  <input
                    type="range"
                    min={40}
                    max={300}
                    value={previewWidth}
                    className="cbr-range"
                    onChange={(e) => setPreviewWidth(Number(e.target.value))}
                    aria-label="プレビューの幅"
                  />
                </div>
                <div className="cbr-size-item">
                  <span className="cbr-size-label">
                    高さ: {previewHeight}px
                  </span>
                  <input
                    type="range"
                    min={40}
                    max={300}
                    value={previewHeight}
                    className="cbr-range"
                    onChange={(e) => setPreviewHeight(Number(e.target.value))}
                    aria-label="プレビューの高さ"
                  />
                </div>
              </div>
            </section>

            {/* CSS 出力 */}
            <section
              className="cbr-css-section"
              aria-labelledby="cbr-css-output-title"
            >
              <div className="cbr-css-header">
                <h2 className="cbr-section-title" id="cbr-css-output-title">
                  生成 CSS
                </h2>
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopyCSS}
                  aria-label="生成されたCSSをクリップボードにコピー"
                >
                  コピー
                </Button>
              </div>
              <pre
                className="cbr-css-output"
                aria-label="生成されたCSSコード"
                aria-live="polite"
              >
                {generatedCSS}
              </pre>
            </section>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "プリセットから素早くよく使う形状を適用できます",
                "「コーナー設定」でスライダーまたは数値入力で各コーナーを調整",
                "「楕円モード」をONにすると水平・垂直を独立して制御できます",
                "「単位」を切り替えてpx（絶対値）と%（相対値）を使い分けられます",
                "プレビューの幅・高さを変えて異なるサイズでの見た目を確認できます",
                "「生成 CSS」のコピーボタンでCSSをクリップボードにコピー",
              ],
            },
            {
              title: "border-radius の構文",
              items: [
                "border-radius: TL TR BR BL（時計回りに各コーナー）",
                "値が全て等しい場合: border-radius: 8px",
                "TL=BR かつ TR=BL の場合: border-radius: TL TR（2値 shorthand）",
                "楕円: border-radius: 水平値 / 垂直値（スラッシュで区切る）",
                "% の場合: 50% で正円・ピル型になります",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "カード: border-radius: 8px〜16px（全コーナー均一）",
                "正円: border-radius: 50%（正方形要素に適用）",
                "ピル型: border-radius: 9999px（大きめの値で完全な丸み）",
                "チャットバブル: 1コーナーだけ0pxにして吹き出し風に",
                "リーフ: 対角コーナーを50%、残りを0%にして葉の形に",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
