import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  generateGradientCSS,
  generateFullCSS,
  createDefaultStops,
  redistributeStops,
  GRADIENT_PRESETS,
  type GradientConfig,
  type GradientType,
  type ColorStop,
  type RadialShape,
} from "../utils/css-gradient";

export const Route = createFileRoute("/css-gradient")({
  head: () => ({
    meta: [
      { title: "CSSグラジェント生成 | Web ツール集" },
      {
        name: "description",
        content:
          "linear-gradient/radial-gradient/conic-gradientをビジュアルエディターで作成。カラーストップ・角度・位置を調整してCSSコードを即座に生成。",
      },
      { property: "og:title", content: "CSSグラジェント生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "linear-gradient/radial-gradient/conic-gradientをビジュアルエディターで作成。カラーストップ・角度・位置を調整してCSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-gradient` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSSグラジェント生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "linear-gradient/radial-gradient/conic-gradientをビジュアルエディターで作成。カラーストップ・角度・位置を調整してCSSコードを即座に生成。",
      },
    ],
  }),
  component: CssGradient,
});

const GRADIENT_TYPES: { id: GradientType; label: string }[] = [
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "conic", label: "Conic" },
];

function CssGradient() {
  const [config, setConfig] = useState<GradientConfig>({
    type: "linear",
    stops: createDefaultStops(),
    linear: { angle: 135 },
    radial: { shape: "ellipse", positionX: 50, positionY: 50 },
    conic: { angle: 0, positionX: 50, positionY: 50 },
  });
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const { showToast } = useToast();

  const gradientCSS = useMemo(() => generateGradientCSS(config), [config]);
  const fullCSS = useMemo(() => generateFullCSS(config), [config]);

  // タイプ変更
  const handleTypeChange = useCallback((type: GradientType) => {
    setConfig((prev) => ({ ...prev, type }));
    setSelectedPreset(null);
  }, []);

  // Linearの角度変更
  const handleAngleChange = useCallback((angle: number) => {
    setConfig((prev) => ({
      ...prev,
      linear: { ...prev.linear, angle },
    }));
    setSelectedPreset(null);
  }, []);

  // Radialの形状変更
  const handleRadialShapeChange = useCallback((shape: RadialShape) => {
    setConfig((prev) => ({
      ...prev,
      radial: { ...prev.radial!, shape },
    }));
    setSelectedPreset(null);
  }, []);

  // Radialの中心位置変更
  const handleRadialPositionChange = useCallback((axis: "x" | "y", value: number) => {
    setConfig((prev) => ({
      ...prev,
      radial: {
        ...prev.radial!,
        positionX: axis === "x" ? value : prev.radial!.positionX,
        positionY: axis === "y" ? value : prev.radial!.positionY,
      },
    }));
    setSelectedPreset(null);
  }, []);

  // Conicの開始角度変更
  const handleConicAngleChange = useCallback((angle: number) => {
    setConfig((prev) => ({
      ...prev,
      conic: { ...prev.conic!, angle },
    }));
    setSelectedPreset(null);
  }, []);

  // Conicの中心位置変更
  const handleConicPositionChange = useCallback((axis: "x" | "y", value: number) => {
    setConfig((prev) => ({
      ...prev,
      conic: {
        ...prev.conic!,
        positionX: axis === "x" ? value : prev.conic!.positionX,
        positionY: axis === "y" ? value : prev.conic!.positionY,
      },
    }));
    setSelectedPreset(null);
  }, []);

  // カラーストップの色変更
  const handleStopColorChange = useCallback((index: number, color: string) => {
    setConfig((prev) => {
      const stops = [...prev.stops];
      stops[index] = { ...stops[index], color };
      return { ...prev, stops };
    });
    setSelectedPreset(null);
  }, []);

  // カラーストップの位置変更
  const handleStopPositionChange = useCallback((index: number, position: number) => {
    const clamped = Math.max(0, Math.min(100, position));
    setConfig((prev) => {
      const stops = [...prev.stops];
      stops[index] = { ...stops[index], position: clamped };
      return { ...prev, stops };
    });
    setSelectedPreset(null);
  }, []);

  // カラーストップ追加
  const handleAddStop = useCallback(() => {
    setConfig((prev) => {
      const newStop: ColorStop = {
        id: crypto.randomUUID(),
        color: "#ffffff",
        position: 50,
      };
      const stops = redistributeStops([...prev.stops, newStop]);
      return { ...prev, stops };
    });
    setSelectedPreset(null);
  }, []);

  // カラーストップ削除
  const handleRemoveStop = useCallback((index: number) => {
    setConfig((prev) => {
      if (prev.stops.length <= 2) return prev;
      const stops = prev.stops.filter((_, i) => i !== index);
      return { ...prev, stops };
    });
    setSelectedPreset(null);
  }, []);

  // プリセット適用
  const handlePresetSelect = useCallback((index: number) => {
    const preset = GRADIENT_PRESETS[index];
    setConfig(preset.config);
    setSelectedPreset(index);
  }, []);

  // CSSコピー
  const handleCopyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullCSS);
      showToast("CSSをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [fullCSS, showToast]);

  return (
    <main className="tool-container" role="main">
      <div className="cg-container">
        <h1 className="tool-title">CSSグラジェント生成</h1>
        <p className="tool-description">
          ビジュアルエディターでCSSグラジェントを作成します。 linear / radial / conic
          の3タイプに対応。
        </p>

        <div className="cg-layout">
          {/* コントロールパネル */}
          <div className="cg-controls">
            {/* グラジェントタイプ */}
            <div className="cg-section">
              <p className="cg-section-title">タイプ</p>
              <div className="cg-type-tabs" role="tablist" aria-label="グラジェントタイプ選択">
                {GRADIENT_TYPES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`cg-tab-${id}`}
                    aria-selected={config.type === id}
                    aria-controls={`cg-panel-${id}`}
                    className={`cg-type-tab ${config.type === id ? "active" : ""}`}
                    onClick={() => handleTypeChange(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Linear オプション */}
            {config.type === "linear" && (
              <div
                className="cg-section"
                role="tabpanel"
                id="cg-panel-linear"
                aria-labelledby="cg-tab-linear"
              >
                <p className="cg-section-title">角度</p>
                <div className="cg-option-row">
                  <span className="cg-option-label">角度</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={360}
                    value={config.linear?.angle ?? 90}
                    onChange={(e) => handleAngleChange(Number(e.target.value))}
                    aria-label="グラジェント角度"
                  />
                  <span className="cg-range-value">{config.linear?.angle ?? 90}°</span>
                </div>
              </div>
            )}

            {/* Radial オプション */}
            {config.type === "radial" && (
              <div
                className="cg-section"
                role="tabpanel"
                id="cg-panel-radial"
                aria-labelledby="cg-tab-radial"
              >
                <p className="cg-section-title">設定</p>
                <div className="cg-option-row">
                  <span className="cg-option-label">形状</span>
                  <select
                    className="cg-select"
                    value={config.radial?.shape ?? "ellipse"}
                    onChange={(e) => handleRadialShapeChange(e.target.value as RadialShape)}
                    aria-label="ラジアル形状"
                  >
                    <option value="ellipse">Ellipse</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>
                <div className="cg-option-row">
                  <span className="cg-option-label">中心 X</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={100}
                    value={config.radial?.positionX ?? 50}
                    onChange={(e) => handleRadialPositionChange("x", Number(e.target.value))}
                    aria-label="中心X位置"
                  />
                  <span className="cg-range-value">{config.radial?.positionX ?? 50}%</span>
                </div>
                <div className="cg-option-row">
                  <span className="cg-option-label">中心 Y</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={100}
                    value={config.radial?.positionY ?? 50}
                    onChange={(e) => handleRadialPositionChange("y", Number(e.target.value))}
                    aria-label="中心Y位置"
                  />
                  <span className="cg-range-value">{config.radial?.positionY ?? 50}%</span>
                </div>
              </div>
            )}

            {/* Conic オプション */}
            {config.type === "conic" && (
              <div
                className="cg-section"
                role="tabpanel"
                id="cg-panel-conic"
                aria-labelledby="cg-tab-conic"
              >
                <p className="cg-section-title">設定</p>
                <div className="cg-option-row">
                  <span className="cg-option-label">開始角</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={360}
                    value={config.conic?.angle ?? 0}
                    onChange={(e) => handleConicAngleChange(Number(e.target.value))}
                    aria-label="開始角度"
                  />
                  <span className="cg-range-value">{config.conic?.angle ?? 0}°</span>
                </div>
                <div className="cg-option-row">
                  <span className="cg-option-label">中心 X</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={100}
                    value={config.conic?.positionX ?? 50}
                    onChange={(e) => handleConicPositionChange("x", Number(e.target.value))}
                    aria-label="コニック中心X位置"
                  />
                  <span className="cg-range-value">{config.conic?.positionX ?? 50}%</span>
                </div>
                <div className="cg-option-row">
                  <span className="cg-option-label">中心 Y</span>
                  <input
                    type="range"
                    className="cg-range"
                    min={0}
                    max={100}
                    value={config.conic?.positionY ?? 50}
                    onChange={(e) => handleConicPositionChange("y", Number(e.target.value))}
                    aria-label="コニック中心Y位置"
                  />
                  <span className="cg-range-value">{config.conic?.positionY ?? 50}%</span>
                </div>
              </div>
            )}

            {/* カラーストップ */}
            <div className="cg-section">
              <p className="cg-section-title">カラーストップ</p>
              <div className="cg-stops-list" aria-label="カラーストップ一覧" aria-live="polite">
                {config.stops.map((stop, index) => (
                  <div key={stop.id} className="cg-stop-item">
                    <input
                      type="color"
                      className="cg-stop-color"
                      value={stop.color}
                      onChange={(e) => handleStopColorChange(index, e.target.value)}
                      aria-label={`カラーストップ ${index + 1} の色`}
                    />
                    <input
                      type="text"
                      className="cg-stop-hex"
                      value={stop.color}
                      onChange={(e) => {
                        const val = e.target.value;
                        const normalized = val.startsWith("#") ? val : `#${val}`;
                        if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
                          handleStopColorChange(index, normalized);
                        } else {
                          handleStopColorChange(index, val);
                        }
                      }}
                      aria-label={`カラーストップ ${index + 1} のHEX値`}
                    />
                    <input
                      type="number"
                      className="cg-stop-position"
                      value={stop.position}
                      min={0}
                      max={100}
                      onChange={(e) => handleStopPositionChange(index, Number(e.target.value))}
                      aria-label={`カラーストップ ${index + 1} の位置 (%)`}
                    />
                    <span className="cg-option-label cg-option-label--auto">%</span>
                    <button
                      type="button"
                      className="cg-stop-remove"
                      onClick={() => handleRemoveStop(index)}
                      disabled={config.stops.length <= 2}
                      aria-label={`カラーストップ ${index + 1} を削除`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="cg-add-stop"
                onClick={handleAddStop}
                disabled={config.stops.length >= 8}
                aria-label="カラーストップを追加"
              >
                ＋ カラーストップを追加
              </button>
            </div>

            {/* プリセット */}
            <div className="cg-section">
              <p className="cg-section-title">プリセット</p>
              <div className="cg-presets-grid" role="list" aria-label="グラジェントプリセット一覧">
                {GRADIENT_PRESETS.map((preset, index) => {
                  const bg = generateGradientCSS(preset.config);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      role="listitem"
                      className={`cg-preset-btn ${selectedPreset === index ? "selected" : ""}`}
                      style={{ background: bg }}
                      onClick={() => handlePresetSelect(index)}
                      aria-label={`プリセット: ${preset.name}`}
                      aria-pressed={selectedPreset === index}
                    >
                      <span className="cg-preset-label">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* プレビュー + 出力 */}
          <div className="cg-preview-section">
            {/* プレビュー */}
            <div
              className="cg-preview"
              style={{ background: gradientCSS }}
              role="img"
              aria-label={`グラジェントプレビュー: ${gradientCSS}`}
            />

            {/* CSS出力 */}
            <div className="cg-output-section">
              <div className="cg-output-header">
                <p className="cg-section-title">生成されたCSS</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCSS}
                  aria-label="CSSをクリップボードにコピー"
                >
                  コピー
                </Button>
              </div>
              <div
                className="cg-code-block"
                role="region"
                aria-label="CSSコード"
                aria-live="polite"
              >
                {fullCSS}
              </div>
            </div>

            <TipsCard
              sections={[
                {
                  title: "Tips",
                  items: [
                    "Linear: 角度を指定した直線グラジェント。0degは下から上、90degは左から右。",
                    "Radial: 中心から放射状に広がるグラジェント。CircleとEllipseを選択可能。",
                    "Conic: 中心点を軸に回転するグラジェント。円グラフのような表現に使用。",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
