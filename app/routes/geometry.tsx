import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  type Shape2D,
  type Shape3D,
  SHAPE_2D_LABELS,
  SHAPE_3D_LABELS,
  calcCircleArea,
  calcRectangleArea,
  calcTriangleArea,
  calcTrapezoidArea,
  calcParallelogramArea,
  calcEllipseArea,
  calcRegularHexagonArea,
  calcSphere,
  calcCube,
  calcRectangularPrism,
  calcCylinder,
  calcCone,
} from "~/utils/geometry";

export const Route = createFileRoute("/geometry")({
  head: () => ({
    meta: [
      { title: "幾何計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "円・三角形・長方形などの2D図形の面積、球・円柱・直方体などの3D図形の体積・表面積を計算するツール。",
      },
      {
        property: "og:title",
        content: "幾何計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "円・三角形・長方形などの2D図形の面積、球・円柱・直方体などの3D図形の体積・表面積を計算するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/geometry` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: GeometryCalculator,
});

/** アクティブなタブの種類 */
type Tab = "2d" | "3d";

/**
 * 幾何計算機ページコンポーネント
 */
function GeometryCalculator() {
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [activeTab, setActiveTab] = useState<Tab>("2d");

  // 2D 用 state
  const [shape2D, setShape2D] = useState<Shape2D>("circle");
  const [dim2D, setDim2D] = useState<Record<string, string>>({});

  // 3D 用 state
  const [shape3D, setShape3D] = useState<Shape3D>("sphere");
  const [dim3D, setDim3D] = useState<Record<string, string>>({});

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleShape2DChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShape2D(e.target.value as Shape2D);
    setDim2D({});
  };

  const handleShape3DChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setShape3D(e.target.value as Shape3D);
    setDim3D({});
  };

  const handleDim2DChange = (key: string, value: string) => {
    setDim2D((prev) => ({ ...prev, [key]: value }));
    announceStatus("面積を再計算しました");
  };

  const handleDim3DChange = (key: string, value: string) => {
    setDim3D((prev) => ({ ...prev, [key]: value }));
    announceStatus("体積・表面積を再計算しました");
  };

  const p = (key: string, dims: Record<string, string>) =>
    parseFloat(dims[key] ?? "");

  const result2D = useMemo(() => {
    switch (shape2D) {
      case "circle": {
        const r = p("r", dim2D);
        if (isNaN(r)) return null;
        const area = calcCircleArea(r);
        return isNaN(area) ? null : { area };
      }
      case "rectangle": {
        const w = p("w", dim2D);
        const h = p("h", dim2D);
        if (isNaN(w) || isNaN(h)) return null;
        const area = calcRectangleArea(w, h);
        return isNaN(area) ? null : { area };
      }
      case "triangle": {
        const base = p("base", dim2D);
        const height = p("height", dim2D);
        if (isNaN(base) || isNaN(height)) return null;
        const area = calcTriangleArea(base, height);
        return isNaN(area) ? null : { area };
      }
      case "trapezoid": {
        const a = p("a", dim2D);
        const b = p("b", dim2D);
        const h = p("h", dim2D);
        if (isNaN(a) || isNaN(b) || isNaN(h)) return null;
        const area = calcTrapezoidArea(a, b, h);
        return isNaN(area) ? null : { area };
      }
      case "parallelogram": {
        const base = p("base", dim2D);
        const height = p("height", dim2D);
        if (isNaN(base) || isNaN(height)) return null;
        const area = calcParallelogramArea(base, height);
        return isNaN(area) ? null : { area };
      }
      case "ellipse": {
        const a = p("a", dim2D);
        const b = p("b", dim2D);
        if (isNaN(a) || isNaN(b)) return null;
        const area = calcEllipseArea(a, b);
        return isNaN(area) ? null : { area };
      }
      case "regularHexagon": {
        const a = p("a", dim2D);
        if (isNaN(a)) return null;
        const area = calcRegularHexagonArea(a);
        return isNaN(area) ? null : { area };
      }
      default:
        return null;
    }
  }, [shape2D, dim2D]);

  const result3D = useMemo(() => {
    switch (shape3D) {
      case "sphere": {
        const r = p("r", dim3D);
        if (isNaN(r)) return null;
        const res = calcSphere(r);
        return isNaN(res.volume) ? null : res;
      }
      case "cube": {
        const a = p("a", dim3D);
        if (isNaN(a)) return null;
        const res = calcCube(a);
        return isNaN(res.volume) ? null : res;
      }
      case "rectangularPrism": {
        const l = p("l", dim3D);
        const w = p("w", dim3D);
        const h = p("h", dim3D);
        if (isNaN(l) || isNaN(w) || isNaN(h)) return null;
        const res = calcRectangularPrism(l, w, h);
        return isNaN(res.volume) ? null : res;
      }
      case "cylinder": {
        const r = p("r", dim3D);
        const h = p("h", dim3D);
        if (isNaN(r) || isNaN(h)) return null;
        const res = calcCylinder(r, h);
        return isNaN(res.volume) ? null : res;
      }
      case "cone": {
        const r = p("r", dim3D);
        const h = p("h", dim3D);
        if (isNaN(r) || isNaN(h)) return null;
        const res = calcCone(r, h);
        return isNaN(res.volume) ? null : res;
      }
      default:
        return null;
    }
  }, [shape3D, dim3D]);

  const render2DInputs = () => {
    switch (shape2D) {
      case "circle":
        return (
          <div className="geometry-input-group">
            <label htmlFor="geo-r" className="geometry-label">
              半径 (r)
            </label>
            <div className="geometry-input-wrapper">
              <input
                id="geo-r"
                type="number"
                value={dim2D["r"] ?? ""}
                onChange={(e) => handleDim2DChange("r", e.target.value)}
                placeholder="例: 5"
                aria-label="円の半径を入力"
                className="geometry-number-input"
                min="0"
                step="0.1"
              />
              <span className="geometry-unit">単位</span>
            </div>
          </div>
        );
      case "rectangle":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo-w" className="geometry-label">
                幅 (w)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-w"
                  type="number"
                  value={dim2D["w"] ?? ""}
                  onChange={(e) => handleDim2DChange("w", e.target.value)}
                  placeholder="例: 10"
                  aria-label="長方形の幅を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-h" className="geometry-label">
                高さ (h)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-h"
                  type="number"
                  value={dim2D["h"] ?? ""}
                  onChange={(e) => handleDim2DChange("h", e.target.value)}
                  placeholder="例: 5"
                  aria-label="長方形の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "triangle":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo-base" className="geometry-label">
                底辺 (base)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-base"
                  type="number"
                  value={dim2D["base"] ?? ""}
                  onChange={(e) => handleDim2DChange("base", e.target.value)}
                  placeholder="例: 8"
                  aria-label="三角形の底辺を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-height" className="geometry-label">
                高さ (height)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-height"
                  type="number"
                  value={dim2D["height"] ?? ""}
                  onChange={(e) => handleDim2DChange("height", e.target.value)}
                  placeholder="例: 6"
                  aria-label="三角形の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "trapezoid":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo-a" className="geometry-label">
                上底 (a)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-a"
                  type="number"
                  value={dim2D["a"] ?? ""}
                  onChange={(e) => handleDim2DChange("a", e.target.value)}
                  placeholder="例: 4"
                  aria-label="台形の上底を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-b" className="geometry-label">
                下底 (b)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-b"
                  type="number"
                  value={dim2D["b"] ?? ""}
                  onChange={(e) => handleDim2DChange("b", e.target.value)}
                  placeholder="例: 8"
                  aria-label="台形の下底を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-h" className="geometry-label">
                高さ (h)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-h"
                  type="number"
                  value={dim2D["h"] ?? ""}
                  onChange={(e) => handleDim2DChange("h", e.target.value)}
                  placeholder="例: 5"
                  aria-label="台形の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "parallelogram":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo-base" className="geometry-label">
                底辺 (base)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-base"
                  type="number"
                  value={dim2D["base"] ?? ""}
                  onChange={(e) => handleDim2DChange("base", e.target.value)}
                  placeholder="例: 8"
                  aria-label="平行四辺形の底辺を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-height" className="geometry-label">
                高さ (height)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-height"
                  type="number"
                  value={dim2D["height"] ?? ""}
                  onChange={(e) => handleDim2DChange("height", e.target.value)}
                  placeholder="例: 5"
                  aria-label="平行四辺形の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "ellipse":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo-a" className="geometry-label">
                長半径 (a)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-a"
                  type="number"
                  value={dim2D["a"] ?? ""}
                  onChange={(e) => handleDim2DChange("a", e.target.value)}
                  placeholder="例: 6"
                  aria-label="楕円の長半径を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo-b" className="geometry-label">
                短半径 (b)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo-b"
                  type="number"
                  value={dim2D["b"] ?? ""}
                  onChange={(e) => handleDim2DChange("b", e.target.value)}
                  placeholder="例: 4"
                  aria-label="楕円の短半径を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "regularHexagon":
        return (
          <div className="geometry-input-group">
            <label htmlFor="geo-a" className="geometry-label">
              一辺の長さ (a)
            </label>
            <div className="geometry-input-wrapper">
              <input
                id="geo-a"
                type="number"
                value={dim2D["a"] ?? ""}
                onChange={(e) => handleDim2DChange("a", e.target.value)}
                placeholder="例: 5"
                aria-label="正六角形の一辺の長さを入力"
                className="geometry-number-input"
                min="0"
                step="0.1"
              />
              <span className="geometry-unit">単位</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const render3DInputs = () => {
    switch (shape3D) {
      case "sphere":
        return (
          <div className="geometry-input-group">
            <label htmlFor="geo3-r" className="geometry-label">
              半径 (r)
            </label>
            <div className="geometry-input-wrapper">
              <input
                id="geo3-r"
                type="number"
                value={dim3D["r"] ?? ""}
                onChange={(e) => handleDim3DChange("r", e.target.value)}
                placeholder="例: 5"
                aria-label="球の半径を入力"
                className="geometry-number-input"
                min="0"
                step="0.1"
              />
              <span className="geometry-unit">単位</span>
            </div>
          </div>
        );
      case "cube":
        return (
          <div className="geometry-input-group">
            <label htmlFor="geo3-a" className="geometry-label">
              一辺の長さ (a)
            </label>
            <div className="geometry-input-wrapper">
              <input
                id="geo3-a"
                type="number"
                value={dim3D["a"] ?? ""}
                onChange={(e) => handleDim3DChange("a", e.target.value)}
                placeholder="例: 4"
                aria-label="立方体の一辺の長さを入力"
                className="geometry-number-input"
                min="0"
                step="0.1"
              />
              <span className="geometry-unit">単位</span>
            </div>
          </div>
        );
      case "rectangularPrism":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo3-l" className="geometry-label">
                長さ (l)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-l"
                  type="number"
                  value={dim3D["l"] ?? ""}
                  onChange={(e) => handleDim3DChange("l", e.target.value)}
                  placeholder="例: 6"
                  aria-label="直方体の長さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo3-w" className="geometry-label">
                幅 (w)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-w"
                  type="number"
                  value={dim3D["w"] ?? ""}
                  onChange={(e) => handleDim3DChange("w", e.target.value)}
                  placeholder="例: 4"
                  aria-label="直方体の幅を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo3-h" className="geometry-label">
                高さ (h)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-h"
                  type="number"
                  value={dim3D["h"] ?? ""}
                  onChange={(e) => handleDim3DChange("h", e.target.value)}
                  placeholder="例: 3"
                  aria-label="直方体の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "cylinder":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo3-r" className="geometry-label">
                底面半径 (r)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-r"
                  type="number"
                  value={dim3D["r"] ?? ""}
                  onChange={(e) => handleDim3DChange("r", e.target.value)}
                  placeholder="例: 3"
                  aria-label="円柱の底面半径を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo3-h" className="geometry-label">
                高さ (h)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-h"
                  type="number"
                  value={dim3D["h"] ?? ""}
                  onChange={(e) => handleDim3DChange("h", e.target.value)}
                  placeholder="例: 10"
                  aria-label="円柱の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      case "cone":
        return (
          <>
            <div className="geometry-input-group">
              <label htmlFor="geo3-r" className="geometry-label">
                底面半径 (r)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-r"
                  type="number"
                  value={dim3D["r"] ?? ""}
                  onChange={(e) => handleDim3DChange("r", e.target.value)}
                  placeholder="例: 3"
                  aria-label="円錐の底面半径を入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
            <div className="geometry-input-group">
              <label htmlFor="geo3-h" className="geometry-label">
                高さ (h)
              </label>
              <div className="geometry-input-wrapper">
                <input
                  id="geo3-h"
                  type="number"
                  value={dim3D["h"] ?? ""}
                  onChange={(e) => handleDim3DChange("h", e.target.value)}
                  placeholder="例: 8"
                  aria-label="円錐の高さを入力"
                  className="geometry-number-input"
                  min="0"
                  step="0.1"
                />
                <span className="geometry-unit">単位</span>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="tool-container">
        <div className="geometry-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "2d"}
            className={`geometry-tab${activeTab === "2d" ? " geometry-tab--active" : ""}`}
            onClick={() => handleTabChange("2d")}
            type="button"
          >
            2D図形（面積）
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "3d"}
            className={`geometry-tab${activeTab === "3d" ? " geometry-tab--active" : ""}`}
            onClick={() => handleTabChange("3d")}
            type="button"
          >
            3D図形（体積）
          </button>
        </div>

        {activeTab === "2d" && (
          <div className="geometry-form">
            <div className="geometry-input-group">
              <label htmlFor="shape-2d-select" className="geometry-label">
                図形を選択
              </label>
              <select
                id="shape-2d-select"
                value={shape2D}
                onChange={handleShape2DChange}
                aria-label="2D図形を選択"
                className="geometry-select"
              >
                {(Object.keys(SHAPE_2D_LABELS) as Shape2D[]).map((key) => (
                  <option key={key} value={key}>
                    {SHAPE_2D_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            {render2DInputs()}

            {result2D ? (
              <div className="geometry-result-section" aria-live="polite">
                <div className="geometry-result-grid">
                  <div className="geometry-result-card geometry-result-card--primary">
                    <span className="geometry-result-label">面積</span>
                    <div className="geometry-result-value">
                      {result2D.area.toFixed(4)}
                      <span className="geometry-result-unit-text"> 単位²</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="geometry-empty-state" aria-live="polite">
                図形を選択して寸法を入力すると面積が計算されます
              </div>
            )}
          </div>
        )}

        {activeTab === "3d" && (
          <div className="geometry-form">
            <div className="geometry-input-group">
              <label htmlFor="shape-3d-select" className="geometry-label">
                図形を選択
              </label>
              <select
                id="shape-3d-select"
                value={shape3D}
                onChange={handleShape3DChange}
                aria-label="3D図形を選択"
                className="geometry-select"
              >
                {(Object.keys(SHAPE_3D_LABELS) as Shape3D[]).map((key) => (
                  <option key={key} value={key}>
                    {SHAPE_3D_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            {render3DInputs()}

            {result3D ? (
              <div className="geometry-result-section" aria-live="polite">
                <div className="geometry-result-grid">
                  <div className="geometry-result-card geometry-result-card--primary">
                    <span className="geometry-result-label">体積</span>
                    <div className="geometry-result-value">
                      {result3D.volume.toFixed(4)}
                      <span className="geometry-result-unit-text"> 単位³</span>
                    </div>
                  </div>
                  <div className="geometry-result-card geometry-result-card--secondary">
                    <span className="geometry-result-label">表面積</span>
                    <div className="geometry-result-value">
                      {result3D.surfaceArea.toFixed(4)}
                      <span className="geometry-result-unit-text"> 単位²</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="geometry-empty-state" aria-live="polite">
                図形を選択して寸法を入力すると体積・表面積が計算されます
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "2D図形の面積公式",
              items: [
                "円: π × r²",
                "長方形: 幅 × 高さ",
                "三角形: 底辺 × 高さ ÷ 2",
                "台形: (上底 + 下底) × 高さ ÷ 2",
                "平行四辺形: 底辺 × 高さ",
                "楕円: π × 長半径 × 短半径",
                "正六角形: (3√3 ÷ 2) × 一辺²",
              ],
            },
            {
              title: "3D図形の体積・表面積公式",
              items: [
                "球 - 体積: (4/3)πr³、表面積: 4πr²",
                "立方体 - 体積: a³、表面積: 6a²",
                "直方体 - 体積: l×w×h、表面積: 2(lw+lh+wh)",
                "円柱 - 体積: πr²h、表面積: 2πr(r+h)",
                "円錐 - 体積: (1/3)πr²h、表面積: πr(r+母線)",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
