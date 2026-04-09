import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generatePatternCSS,
  createDefaultConfig,
  PATTERN_PRESETS,
  type PatternConfig,
  type PatternType,
} from "~/utils/css-background-pattern";

export const Route = createFileRoute("/css-background-pattern")({
  head: () => ({
    meta: [
      { title: "CSS背景パターン生成 | Web ツール集" },
      {
        name: "description",
        content:
          "CSSの繰り返しグラジェントを使った背景パターン生成ツール。縞模様・水玉・グリッド・市松・斜め縞・ジグザグを色・サイズ・角度で細かく調整できます。",
      },
      {
        property: "og:title",
        content: "CSS背景パターン生成 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSSの繰り返しグラジェントを使った背景パターン生成ツール。縞模様・水玉・グリッド・市松・斜め縞・ジグザグ対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-background-pattern` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS背景パターン生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "CSSの繰り返しグラジェントで背景パターンを生成。6種類のパターンに対応。",
      },
    ],
  }),
  component: CssBackgroundPattern,
});

const PATTERN_TYPES: { id: PatternType; label: string }[] = [
  { id: "stripes", label: "縞模様" },
  { id: "diagonal", label: "斜め縞" },
  { id: "grid", label: "グリッド" },
  { id: "checkerboard", label: "市松" },
  { id: "dots", label: "水玉" },
  { id: "zigzag", label: "ジグザグ" },
];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function CssBackgroundPattern() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<PatternConfig>(createDefaultConfig());
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [color1Hex, setColor1Hex] = useState(createDefaultConfig().color1);
  const [color2Hex, setColor2Hex] = useState(createDefaultConfig().color2);

  const patternResult = useMemo(() => generatePatternCSS(config), [config]);

  const handleTypeChange = useCallback((type: PatternType) => {
    setConfig((prev) => ({ ...prev, type }));
    setSelectedPreset(null);
  }, []);

  const handleColor1Change = useCallback((value: string) => {
    setColor1Hex(value);
    if (HEX_PATTERN.test(value)) {
      setConfig((prev) => ({ ...prev, color1: value }));
      setSelectedPreset(null);
    }
  }, []);

  const handleColor2Change = useCallback((value: string) => {
    setColor2Hex(value);
    if (HEX_PATTERN.test(value)) {
      setConfig((prev) => ({ ...prev, color2: value }));
      setSelectedPreset(null);
    }
  }, []);

  const handleSizeChange = useCallback((size: number) => {
    setConfig((prev) => ({ ...prev, size }));
    setSelectedPreset(null);
  }, []);

  const handleAngleChange = useCallback((angle: number) => {
    setConfig((prev) => ({ ...prev, angle }));
    setSelectedPreset(null);
  }, []);

  const handleLineWidthChange = useCallback((lineWidth: number) => {
    setConfig((prev) => ({ ...prev, lineWidth }));
    setSelectedPreset(null);
  }, []);

  const handleDotRadiusChange = useCallback((dotRadius: number) => {
    setConfig((prev) => ({ ...prev, dotRadius }));
    setSelectedPreset(null);
  }, []);

  const handlePresetSelect = useCallback(
    (index: number) => {
      const preset = PATTERN_PRESETS[index];
      setConfig(preset.config);
      setColor1Hex(preset.config.color1);
      setColor2Hex(preset.config.color2);
      setSelectedPreset(index);
      announceStatus(`プリセット「${preset.name}」を適用しました`);
    },
    [announceStatus],
  );

  const handleCopyCSS = useCallback(async () => {
    const success = await copy(patternResult.fullCSS);
    if (success) {
      announceStatus("CSSをコピーしました");
      showToast("CSSをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [patternResult.fullCSS, copy, announceStatus, showToast]);

  const showAngle = config.type === "stripes" || config.type === "diagonal";
  const showLineWidth =
    config.type === "stripes" || config.type === "diagonal" || config.type === "grid";
  const showDotRadius = config.type === "dots";

  const previewStyle: React.CSSProperties = {
    background: patternResult.background,
    ...(patternResult.backgroundSize ? { backgroundSize: patternResult.backgroundSize } : {}),
  };

  return (
    <>
      <div className="cbp-container">
        <div className="cbp-layout">
          {/* コントロールパネル */}
          <div className="cbp-controls">
            {/* パターンタイプ選択 */}
            <div className="cbp-section">
              <p className="cbp-section-title">パターン種類</p>
              <div className="cbp-type-tabs" role="tablist" aria-label="パターン種類の選択">
                {PATTERN_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    role="tab"
                    aria-selected={config.type === pt.id}
                    className={`cbp-type-tab${config.type === pt.id ? " active" : ""}`}
                    onClick={() => handleTypeChange(pt.id)}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* カラー設定 */}
            <div className="cbp-section">
              <p className="cbp-section-title">カラー</p>
              <div className="cbp-color-row">
                <span className="cbp-color-label">カラー1</span>
                <input
                  type="color"
                  className="cbp-color-swatch"
                  value={HEX_PATTERN.test(color1Hex) ? color1Hex : "#000000"}
                  onChange={(e) => handleColor1Change(e.target.value)}
                  aria-label="カラー1のカラーピッカー"
                />
                <input
                  type="text"
                  className="cbp-color-hex"
                  value={color1Hex}
                  onChange={(e) => handleColor1Change(e.target.value)}
                  maxLength={7}
                  spellCheck={false}
                  aria-label="カラー1のHEX値"
                  placeholder="#000000"
                />
              </div>
              <div className="cbp-color-row">
                <span className="cbp-color-label">カラー2</span>
                <input
                  type="color"
                  className="cbp-color-swatch"
                  value={HEX_PATTERN.test(color2Hex) ? color2Hex : "#ffffff"}
                  onChange={(e) => handleColor2Change(e.target.value)}
                  aria-label="カラー2のカラーピッカー"
                />
                <input
                  type="text"
                  className="cbp-color-hex"
                  value={color2Hex}
                  onChange={(e) => handleColor2Change(e.target.value)}
                  maxLength={7}
                  spellCheck={false}
                  aria-label="カラー2のHEX値"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* パラメーター */}
            <div className="cbp-section">
              <p className="cbp-section-title">パラメーター</p>
              <div className="cbp-option-row">
                <span className="cbp-option-label">サイズ</span>
                <input
                  type="range"
                  className="cbp-range"
                  min={4}
                  max={100}
                  value={config.size}
                  onChange={(e) => handleSizeChange(Number(e.target.value))}
                  aria-label="パターンサイズ"
                  aria-valuetext={`${config.size}px`}
                />
                <span className="cbp-range-value">{config.size}px</span>
              </div>
              {showAngle && (
                <div className="cbp-option-row">
                  <span className="cbp-option-label">角度</span>
                  <input
                    type="range"
                    className="cbp-range"
                    min={0}
                    max={180}
                    value={config.angle}
                    onChange={(e) => handleAngleChange(Number(e.target.value))}
                    aria-label="パターン角度"
                    aria-valuetext={`${config.angle}deg`}
                  />
                  <span className="cbp-range-value">{config.angle}°</span>
                </div>
              )}
              {showLineWidth && (
                <div className="cbp-option-row">
                  <span className="cbp-option-label">線幅</span>
                  <input
                    type="range"
                    className="cbp-range"
                    min={1}
                    max={Math.floor(config.size / 2)}
                    value={Math.min(config.lineWidth, Math.floor(config.size / 2))}
                    onChange={(e) => handleLineWidthChange(Number(e.target.value))}
                    aria-label="線幅"
                    aria-valuetext={`${config.lineWidth}px`}
                  />
                  <span className="cbp-range-value">{config.lineWidth}px</span>
                </div>
              )}
              {showDotRadius && (
                <div className="cbp-option-row">
                  <span className="cbp-option-label">点サイズ</span>
                  <input
                    type="range"
                    className="cbp-range"
                    min={10}
                    max={50}
                    value={config.dotRadius}
                    onChange={(e) => handleDotRadiusChange(Number(e.target.value))}
                    aria-label="点の半径"
                    aria-valuetext={`${config.dotRadius}%`}
                  />
                  <span className="cbp-range-value">{config.dotRadius}%</span>
                </div>
              )}
            </div>

            {/* プリセット */}
            <div className="cbp-section">
              <p className="cbp-section-title">プリセット</p>
              <div className="cbp-presets-grid" role="group" aria-label="パターンプリセット">
                {PATTERN_PRESETS.map((preset, index) => {
                  const presetResult = generatePatternCSS(preset.config);
                  const btnStyle: React.CSSProperties = {
                    background: presetResult.background,
                    ...(presetResult.backgroundSize
                      ? { backgroundSize: presetResult.backgroundSize }
                      : {}),
                  };
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      className={`cbp-preset-btn${selectedPreset === index ? " selected" : ""}`}
                      style={btnStyle}
                      onClick={() => handlePresetSelect(index)}
                      aria-pressed={selectedPreset === index}
                      aria-label={`プリセット: ${preset.name}`}
                    >
                      <span className="cbp-preset-label">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* プレビュー + 出力 */}
          <div className="cbp-preview-section">
            <div
              className="cbp-preview"
              style={previewStyle}
              role="img"
              aria-label={`パターンプレビュー: ${config.type}`}
            />

            <div className="cbp-output-section">
              <div className="cbp-output-header">
                <span className="cbp-output-title">生成されたCSS</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyCSS}
                  aria-label="CSSをクリップボードにコピー"
                >
                  コピー
                </button>
              </div>
              <div
                className="cbp-code-block"
                role="region"
                aria-label="CSSコード"
                aria-live="polite"
              >
                {patternResult.fullCSS}
              </div>
            </div>

            <TipsCard
              sections={[
                {
                  title: "対応するパターン種類",
                  items: [
                    "縞模様 (stripes): repeating-linear-gradient で均等な縞を生成",
                    "斜め縞 (diagonal): 角度を変えた repeating-linear-gradient",
                    "グリッド (grid): 水平と垂直の2重グラジェントで格子状に",
                    "市松 (checkerboard): repeating-conic-gradient でモダンなチェッカー模様",
                    "水玉 (dots): radial-gradient でドット模様",
                    "ジグザグ (zigzag): 4方向の repeating-linear-gradient を重ねて生成",
                  ],
                },
                {
                  title: "使い方のコツ",
                  items: [
                    "サイズを大きくするとパターンが粗くなり、小さくすると細かくなります",
                    "角度スライダーで縞の方向を変えられます（縞模様・斜め縞のみ）",
                    "背景色にはカラー2が使われ、パターンにはカラー1が使われます",
                    "生成されたCSSをそのままスタイルシートに貼り付けて使用できます",
                    "background-size を省略した場合、サイズは自動計算されます",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
