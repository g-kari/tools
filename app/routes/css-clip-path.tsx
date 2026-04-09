import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type ClipPathType,
  type InsetState,
  type CircleState,
  type EllipseState,
  type PolygonState,
  type PolygonPoint,
  DEFAULT_INSET,
  DEFAULT_CIRCLE,
  DEFAULT_ELLIPSE,
  DEFAULT_POLYGON,
  POLYGON_PRESETS,
  generateClipPathCSS,
  generateClipPathValue,
} from "~/utils/css-clip-path";

export const Route = createFileRoute("/css-clip-path")({
  head: () => ({
    meta: [
      { title: "CSS Clip-pathジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS clip-pathプロパティをビジュアルエディターで作成。inset・circle・ellipse・polygonを直感的に操作してCSSコードを即座に生成。三角形・星形など多彩なプリセット形状も利用可能。",
      },
      {
        property: "og:title",
        content: "CSS Clip-pathジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS clip-pathプロパティをビジュアルエディターで作成。inset・circle・ellipse・polygonを操作してCSSコードを生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-clip-path` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Clip-pathジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS clip-pathプロパティをビジュアルエディターで作成。inset・circle・ellipse・polygonを操作してCSSコードを生成。",
      },
    ],
  }),
  component: CssClipPathGenerator,
});

/** スライダー定義 */
interface SliderDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const INSET_SLIDERS: SliderDef[] = [
  { key: "top", label: "上 (top)", min: 0, max: 50, step: 1, unit: "%" },
  { key: "right", label: "右 (right)", min: 0, max: 50, step: 1, unit: "%" },
  { key: "bottom", label: "下 (bottom)", min: 0, max: 50, step: 1, unit: "%" },
  { key: "left", label: "左 (left)", min: 0, max: 50, step: 1, unit: "%" },
  { key: "radius", label: "角丸 (round)", min: 0, max: 50, step: 1, unit: "%" },
];

const CIRCLE_SLIDERS: SliderDef[] = [
  { key: "radius", label: "半径 (radius)", min: 1, max: 70, step: 1, unit: "%" },
  { key: "cx", label: "中心X (at X)", min: 0, max: 100, step: 1, unit: "%" },
  { key: "cy", label: "中心Y (at Y)", min: 0, max: 100, step: 1, unit: "%" },
];

const ELLIPSE_SLIDERS: SliderDef[] = [
  { key: "rx", label: "X軸半径 (rx)", min: 1, max: 70, step: 1, unit: "%" },
  { key: "ry", label: "Y軸半径 (ry)", min: 1, max: 70, step: 1, unit: "%" },
  { key: "cx", label: "中心X (at X)", min: 0, max: 100, step: 1, unit: "%" },
  { key: "cy", label: "中心Y (at Y)", min: 0, max: 100, step: 1, unit: "%" },
];

/** ポリゴン頂点編集コンポーネント */
function PolygonEditor({
  state,
  onChange,
}: {
  state: PolygonState;
  onChange: (state: PolygonState) => void;
}) {
  const updatePoint = useCallback(
    (index: number, axis: "x" | "y", value: number) => {
      const newPoints = state.points.map((p, i) => (i === index ? { ...p, [axis]: value } : p));
      onChange({ points: newPoints });
    },
    [state.points, onChange],
  );

  const addPoint = useCallback(() => {
    const last = state.points[state.points.length - 1] ?? { x: 50, y: 50 };
    onChange({ points: [...state.points, { x: last.x, y: last.y + 10 }] });
  }, [state.points, onChange]);

  const removePoint = useCallback(
    (index: number) => {
      if (state.points.length <= 3) return;
      onChange({ points: state.points.filter((_, i) => i !== index) });
    },
    [state.points, onChange],
  );

  return (
    <div className="clip-path-polygon-editor">
      <div className="clip-path-polygon-header">
        <span className="clip-path-label">頂点リスト</span>
        <Button onClick={addPoint} size="sm" variant="outline" aria-label="頂点を追加">
          + 追加
        </Button>
      </div>
      <div className="clip-path-polygon-points">
        {state.points.map((point, index) => (
          <div key={index} className="clip-path-polygon-point">
            <span className="clip-path-point-label">P{index + 1}</span>
            <label className="clip-path-point-axis">
              <span>X</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={point.x}
                onChange={(e) => updatePoint(index, "x", Number(e.target.value))}
                className="clip-path-point-input"
                aria-label={`頂点${index + 1} X座標`}
              />
              <span>%</span>
            </label>
            <label className="clip-path-point-axis">
              <span>Y</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={point.y}
                onChange={(e) => updatePoint(index, "y", Number(e.target.value))}
                className="clip-path-point-input"
                aria-label={`頂点${index + 1} Y座標`}
              />
              <span>%</span>
            </label>
            <button
              onClick={() => removePoint(index)}
              disabled={state.points.length <= 3}
              className="clip-path-point-remove"
              aria-label={`頂点${index + 1}を削除`}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** インタラクティブ SVG プレビューコンポーネント */
function ClipPathPreview({
  type,
  inset,
  circle,
  ellipse,
  polygon,
  onPolygonChange,
}: {
  type: ClipPathType;
  inset: InsetState;
  circle: CircleState;
  ellipse: EllipseState;
  polygon: PolygonState;
  onPolygonChange: (state: PolygonState) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const clipValue = useMemo(
    () => generateClipPathValue(type, inset, circle, ellipse, polygon),
    [type, inset, circle, ellipse, polygon],
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (draggingIndex === null || type !== "polygon") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10;
      const clamped: PolygonPoint = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
      const newPoints = polygon.points.map((p, i) => (i === draggingIndex ? clamped : p));
      onPolygonChange({ points: newPoints });
    },
    [draggingIndex, type, polygon.points, onPolygonChange],
  );

  const handleSvgMouseUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  return (
    <div className="clip-path-preview-wrapper">
      {/* CSS clip-path を適用した実際のプレビューボックス */}
      <div className="clip-path-preview-box-container">
        <div className="clip-path-preview-box" style={{ clipPath: clipValue }} aria-hidden="true" />
      </div>

      {/* polygon 編集用 SVG オーバーレイ */}
      {type === "polygon" && (
        <div className="clip-path-svg-overlay-container">
          <svg
            className="clip-path-svg-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            aria-label="ポリゴン頂点を編集（ドラッグで移動）"
            role="img"
          >
            {/* polygon の輪郭線 */}
            <polygon
              points={polygon.points.map((p) => `${p.x},${p.y}`).join(" ")}
              className="clip-path-svg-polygon"
            />
            {/* 各頂点ハンドル */}
            {polygon.points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={3}
                className={`clip-path-svg-handle ${draggingIndex === index ? "active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDraggingIndex(index);
                }}
                aria-label={`頂点${index + 1} (${point.x}%, ${point.y}%)`}
                role="button"
                tabIndex={0}
              />
            ))}
          </svg>
          <p className="clip-path-svg-hint">ドラッグで頂点を移動できます</p>
        </div>
      )}
    </div>
  );
}

/** メインコンポーネント */
function CssClipPathGenerator() {
  const [type, setType] = useState<ClipPathType>("polygon");
  const [inset, setInset] = useState<InsetState>(DEFAULT_INSET);
  const [circle, setCircle] = useState<CircleState>(DEFAULT_CIRCLE);
  const [ellipse, setEllipse] = useState<EllipseState>(DEFAULT_ELLIPSE);
  const [polygon, setPolygon] = useState<PolygonState>(DEFAULT_POLYGON);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  const cssCode = useMemo(
    () => generateClipPathCSS(type, inset, circle, ellipse, polygon),
    [type, inset, circle, ellipse, polygon],
  );

  const handleCopy = useCallback(async () => {
    await copy(cssCode);
    announceStatus("CSSコードをコピーしました");
  }, [copy, cssCode, announceStatus]);

  const handleReset = useCallback(() => {
    setInset(DEFAULT_INSET);
    setCircle(DEFAULT_CIRCLE);
    setEllipse(DEFAULT_ELLIPSE);
    setPolygon(DEFAULT_POLYGON);
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  const applyPreset = useCallback(
    (preset: (typeof POLYGON_PRESETS)[0]) => {
      setType("polygon");
      setPolygon({ points: preset.points });
      announceStatus(`プリセット「${preset.name}」を適用しました`);
    },
    [announceStatus],
  );

  /** inset スライダー変更ハンドラ */
  const handleInsetChange = useCallback((key: keyof InsetState, value: number) => {
    setInset((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** circle スライダー変更ハンドラ */
  const handleCircleChange = useCallback((key: keyof CircleState, value: number) => {
    setCircle((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** ellipse スライダー変更ハンドラ */
  const handleEllipseChange = useCallback((key: keyof EllipseState, value: number) => {
    setEllipse((prev) => ({ ...prev, [key]: value }));
  }, []);

  const TAB_TYPES: { value: ClipPathType; label: string }[] = [
    { value: "polygon", label: "polygon()" },
    { value: "inset", label: "inset()" },
    { value: "circle", label: "circle()" },
    { value: "ellipse", label: "ellipse()" },
  ];

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">CSS Clip-path ジェネレーター</h2>
        <p className="tool-description">
          CSS <code>clip-path</code> プロパティをビジュアルエディターで作成します。
          inset・circle・ellipse・polygon に対応し、プリセット形状も利用できます。
        </p>
      </div>

      {/* タブ切り替え */}
      <div className="clip-path-tabs" role="tablist" aria-label="clip-pathの種類">
        {TAB_TYPES.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={type === tab.value}
            className={`clip-path-tab ${type === tab.value ? "active" : ""}`}
            onClick={() => setType(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="clip-path-layout">
        {/* 左カラム: コントロール */}
        <div className="clip-path-controls">
          {/* inset コントロール */}
          {type === "inset" && (
            <section className="clip-path-section" aria-labelledby="inset-heading">
              <h3 id="inset-heading" className="clip-path-section-title">
                inset() 設定
              </h3>
              {INSET_SLIDERS.map((slider) => (
                <div key={slider.key} className="clip-path-slider-row">
                  <label htmlFor={`inset-${slider.key}`} className="clip-path-slider-label">
                    {slider.label}
                  </label>
                  <input
                    id={`inset-${slider.key}`}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={inset[slider.key as keyof InsetState]}
                    onChange={(e) =>
                      handleInsetChange(slider.key as keyof InsetState, Number(e.target.value))
                    }
                    className="clip-path-slider"
                  />
                  <span className="clip-path-slider-value">
                    {inset[slider.key as keyof InsetState]}
                    {slider.unit}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* circle コントロール */}
          {type === "circle" && (
            <section className="clip-path-section" aria-labelledby="circle-heading">
              <h3 id="circle-heading" className="clip-path-section-title">
                circle() 設定
              </h3>
              {CIRCLE_SLIDERS.map((slider) => (
                <div key={slider.key} className="clip-path-slider-row">
                  <label htmlFor={`circle-${slider.key}`} className="clip-path-slider-label">
                    {slider.label}
                  </label>
                  <input
                    id={`circle-${slider.key}`}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={circle[slider.key as keyof CircleState]}
                    onChange={(e) =>
                      handleCircleChange(slider.key as keyof CircleState, Number(e.target.value))
                    }
                    className="clip-path-slider"
                  />
                  <span className="clip-path-slider-value">
                    {circle[slider.key as keyof CircleState]}
                    {slider.unit}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* ellipse コントロール */}
          {type === "ellipse" && (
            <section className="clip-path-section" aria-labelledby="ellipse-heading">
              <h3 id="ellipse-heading" className="clip-path-section-title">
                ellipse() 設定
              </h3>
              {ELLIPSE_SLIDERS.map((slider) => (
                <div key={slider.key} className="clip-path-slider-row">
                  <label htmlFor={`ellipse-${slider.key}`} className="clip-path-slider-label">
                    {slider.label}
                  </label>
                  <input
                    id={`ellipse-${slider.key}`}
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={ellipse[slider.key as keyof EllipseState]}
                    onChange={(e) =>
                      handleEllipseChange(slider.key as keyof EllipseState, Number(e.target.value))
                    }
                    className="clip-path-slider"
                  />
                  <span className="clip-path-slider-value">
                    {ellipse[slider.key as keyof EllipseState]}
                    {slider.unit}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* polygon コントロール */}
          {type === "polygon" && (
            <section className="clip-path-section" aria-labelledby="polygon-heading">
              <h3 id="polygon-heading" className="clip-path-section-title">
                polygon() 設定
              </h3>
              <PolygonEditor state={polygon} onChange={setPolygon} />
            </section>
          )}

          {/* polygon プリセット */}
          <section className="clip-path-section" aria-labelledby="presets-heading">
            <h3 id="presets-heading" className="clip-path-section-title">
              プリセット形状
            </h3>
            <div className="clip-path-presets" role="list">
              {POLYGON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  role="listitem"
                  onClick={() => applyPreset(preset)}
                  className="clip-path-preset-btn"
                  type="button"
                  aria-label={`${preset.name}を適用`}
                >
                  <svg viewBox="0 0 100 100" className="clip-path-preset-icon" aria-hidden="true">
                    <polygon
                      points={preset.points.map((p) => `${p.x},${p.y}`).join(" ")}
                      className="clip-path-preset-polygon"
                    />
                  </svg>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* 右カラム: プレビュー + 出力 */}
        <div className="clip-path-output-col">
          {/* プレビュー */}
          <section aria-labelledby="preview-heading">
            <h3 id="preview-heading" className="clip-path-section-title">
              プレビュー
            </h3>
            <ClipPathPreview
              type={type}
              inset={inset}
              circle={circle}
              ellipse={ellipse}
              polygon={polygon}
              onPolygonChange={setPolygon}
            />
          </section>

          {/* CSS 出力 */}
          <section className="clip-path-section" aria-labelledby="css-output-heading">
            <h3 id="css-output-heading" className="clip-path-section-title">
              生成された CSS
            </h3>
            <pre className="clip-path-css-output" aria-label="生成されたCSSコード">
              <code>{cssCode}</code>
            </pre>
            <div className="clip-path-actions">
              <Button onClick={handleCopy} aria-label="CSSコードをコピー">
                コピー
              </Button>
              <Button onClick={handleReset} variant="outline" aria-label="設定をリセット">
                リセット
              </Button>
            </div>
          </section>

          {/* ステータスアナウンス */}
          <StatusAnnouncer statusRef={statusRef} />
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "Tips",
            items: [
              "polygon() タブではSVGオーバーレイの頂点ハンドルをドラッグして形状を直接編集できます。",
              "プリセット形状をクリックすると polygon() モードに切り替わり、そのまま頂点を編集できます。",
              "inset() の「角丸 (round)」スライダーで角丸付き矩形クリッピングが作成できます。",
              "生成されたCSSは「コピー」ボタンでクリップボードにコピーできます。",
              "clip-path はWebkitプレフィックスが不要な現代的なCSSプロパティです（-webkit-clip-path は廃止予定）。",
            ],
          },
        ]}
      />
    </div>
  );
}
