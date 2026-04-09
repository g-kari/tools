import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  formatCubicBezier,
  generateTimingFunctionCSS,
  clamp,
  round3,
  BEZIER_PRESETS,
  type BezierPreset,
} from "../utils/css-cubic-bezier";

export const Route = createFileRoute("/css-cubic-bezier")({
  head: () => ({
    meta: [
      { title: "CSS Cubic Bezier ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS cubic-bezier() タイミング関数をビジュアルエディターで作成。制御点をドラッグして調整し、transition・animationに使えるCSSコードを即座に生成。linear/ease/bounce等のプリセット多数。",
      },
      {
        property: "og:title",
        content: "CSS Cubic Bezier ジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS cubic-bezier() タイミング関数をビジュアルエディターで作成。制御点をドラッグして調整し、transition・animationに使えるCSSコードを即座に生成。linear/ease/bounce等のプリセット多数。",
      },
      {
        property: "og:url",
        content: `${SITE_BASE_URL}/css-cubic-bezier`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Cubic Bezier ジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS cubic-bezier() タイミング関数をビジュアルエディターで作成。制御点をドラッグして調整し、transition・animationに使えるCSSコードを即座に生成。linear/ease/bounce等のプリセット多数。",
      },
    ],
  }),
  component: CssCubicBezier,
});

/** SVGキャンバスの定数 */
const SVG_W = 240;
const SVG_H = 240;
const PAD = 20;
const DRAW_W = SVG_W - PAD * 2; // 200
const DRAW_H = SVG_H - PAD * 2; // 200

/**
 * [0,1]空間の(x,y)をSVG座標に変換する
 * x軸: 左→右, y軸: 下→上（SVGのy軸は上→下なので反転）
 */
function toSVG(x: number, y: number): [number, number] {
  return [PAD + x * DRAW_W, PAD + DRAW_H - y * DRAW_H];
}

/**
 * SVG座標を[0,1]空間の(x,y)に変換する
 */
function fromSVG(svgX: number, svgY: number): [number, number] {
  return [(svgX - PAD) / DRAW_W, (PAD + DRAW_H - svgY) / DRAW_H];
}

function CssCubicBezier() {
  const [x1, setX1] = useState(0.25);
  const [y1, setY1] = useState(0.1);
  const [x2, setX2] = useState(0.25);
  const [y2, setY2] = useState(1.0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [animKey, setAnimKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const { showToast } = useToast();

  const bezierCSS = useMemo(() => formatCubicBezier(x1, y1, x2, y2), [x1, y1, x2, y2]);
  const fullCSS = useMemo(() => generateTimingFunctionCSS(x1, y1, x2, y2), [x1, y1, x2, y2]);

  /** プリセット適用 */
  const applyPreset = useCallback((preset: BezierPreset, index: number) => {
    setX1(preset.x1);
    setY1(preset.y1);
    setX2(preset.x2);
    setY2(preset.y2);
    setSelectedPreset(index);
    setAnimKey((k) => k + 1);
  }, []);

  /** 制御点のポインターダウン: ポインターキャプチャを設定 */
  const handleControlPointerDown = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    e.preventDefault();
    (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
  }, []);

  /** SVGポインターを[0,1]空間座標に変換するヘルパー */
  const clientToNorm = useCallback((clientX: number, clientY: number): [number, number] => {
    if (!svgRef.current) return [0, 0];
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    return fromSVG(svgX, svgY);
  }, []);

  /** 制御点P1のポインタームーブ */
  const handleP1Move = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!(e.currentTarget as SVGCircleElement).hasPointerCapture(e.pointerId)) return;
      const [nx, ny] = clientToNorm(e.clientX, e.clientY);
      setX1(round3(clamp(nx, 0, 1)));
      setY1(round3(ny));
      setSelectedPreset(null);
    },
    [clientToNorm],
  );

  /** 制御点P2のポインタームーブ */
  const handleP2Move = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (!(e.currentTarget as SVGCircleElement).hasPointerCapture(e.pointerId)) return;
      const [nx, ny] = clientToNorm(e.clientX, e.clientY);
      setX2(round3(clamp(nx, 0, 1)));
      setY2(round3(ny));
      setSelectedPreset(null);
    },
    [clientToNorm],
  );

  /** ポインターアップ: キャプチャを解放 */
  const handleControlPointerUp = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    (e.currentTarget as SVGCircleElement).releasePointerCapture(e.pointerId);
  }, []);

  /** ベジェ曲線のSVGパスを生成 */
  const bezierPath = useMemo(() => {
    const [p0x, p0y] = toSVG(0, 0);
    const [p1x, p1y] = toSVG(x1, y1);
    const [p2x, p2y] = toSVG(x2, y2);
    const [p3x, p3y] = toSVG(1, 1);
    return `M ${p0x} ${p0y} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${p3x} ${p3y}`;
  }, [x1, y1, x2, y2]);

  /** 制御点とアンカーのSVG座標 */
  const [p0x, p0y] = toSVG(0, 0);
  const [p1x, p1y] = toSVG(x1, y1);
  const [p2x, p2y] = toSVG(x2, y2);
  const [p3x, p3y] = toSVG(1, 1);

  /** CSS値をクリップボードにコピー */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bezierCSS);
      showToast("コピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [bezierCSS, showToast]);

  return (
    <main className="tool-container" role="main">
      <div className="cb-container">
        <h1 className="tool-title">CSS Cubic Bezier ジェネレーター</h1>
        <p className="tool-description">
          ビジュアルエディターでCSS cubic-bezier() タイミング関数を作成します。
          グラフ上の制御点をドラッグするか、スライダーで値を調整し、 CSS transition・animation
          に使えるコードを生成してください。
        </p>

        <div className="cb-layout">
          {/* 左: SVGビジュアライザー + スライダー */}
          <div className="cb-editor">
            {/* SVGグラフ */}
            <div className="cb-viz-wrap">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="cb-svg"
                role="img"
                aria-label={`cubic-bezier(${x1}, ${y1}, ${x2}, ${y2}) の曲線グラフ`}
              >
                {/* グリッド線 */}
                {[0, 0.25, 0.5, 0.75, 1].map((v) => {
                  const [gx] = toSVG(v, 0);
                  const [, gy] = toSVG(0, v);
                  return (
                    <g key={v}>
                      <line x1={gx} y1={PAD} x2={gx} y2={PAD + DRAW_H} className="cb-grid-line" />
                      <line x1={PAD} y1={gy} x2={PAD + DRAW_W} y2={gy} className="cb-grid-line" />
                    </g>
                  );
                })}

                {/* 対角線 (linear の参照線) */}
                <line x1={p0x} y1={p0y} x2={p3x} y2={p3y} className="cb-diagonal" />

                {/* ハンドル線（アンカー→制御点） */}
                <line x1={p0x} y1={p0y} x2={p1x} y2={p1y} className="cb-handle-line" />
                <line x1={p3x} y1={p3y} x2={p2x} y2={p2y} className="cb-handle-line" />

                {/* ベジェ曲線本体 */}
                <path d={bezierPath} className="cb-curve" />

                {/* アンカー点 P0, P3 */}
                <circle cx={p0x} cy={p0y} r={5} className="cb-anchor" />
                <circle cx={p3x} cy={p3y} r={5} className="cb-anchor" />

                {/* 制御点 P1 (ドラッグ可能) */}
                <circle
                  cx={p1x}
                  cy={p1y}
                  r={8}
                  className="cb-control cb-control-p1"
                  onPointerDown={handleControlPointerDown}
                  onPointerMove={handleP1Move}
                  onPointerUp={handleControlPointerUp}
                  style={{ cursor: "grab" }}
                  aria-label={`制御点1: x1=${x1}, y1=${y1}`}
                />

                {/* 制御点 P2 (ドラッグ可能) */}
                <circle
                  cx={p2x}
                  cy={p2y}
                  r={8}
                  className="cb-control cb-control-p2"
                  onPointerDown={handleControlPointerDown}
                  onPointerMove={handleP2Move}
                  onPointerUp={handleControlPointerUp}
                  style={{ cursor: "grab" }}
                  aria-label={`制御点2: x2=${x2}, y2=${y2}`}
                />
              </svg>
              <div className="cb-viz-labels">
                <span>0</span>
                <span style={{ marginLeft: "auto" }}>1 (time →)</span>
              </div>
            </div>

            {/* スライダーコントロール */}
            <div className="cb-sliders">
              {/* X1 */}
              <div className="cb-slider-row">
                <label htmlFor="cb-x1" className="cb-slider-label cb-label-x1">
                  X1
                </label>
                <input
                  id="cb-x1"
                  type="range"
                  className="cb-range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={x1}
                  onChange={(e) => {
                    setX1(round3(clamp(parseFloat(e.target.value), 0, 1)));
                    setSelectedPreset(null);
                  }}
                  aria-label="X1 の値"
                />
                <input
                  type="number"
                  className="cb-number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={x1}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) {
                      setX1(round3(clamp(v, 0, 1)));
                      setSelectedPreset(null);
                    }
                  }}
                  aria-label="X1 の数値入力"
                />
              </div>

              {/* Y1 */}
              <div className="cb-slider-row">
                <label htmlFor="cb-y1" className="cb-slider-label cb-label-y1">
                  Y1
                </label>
                <input
                  id="cb-y1"
                  type="range"
                  className="cb-range"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={y1}
                  onChange={(e) => {
                    setY1(round3(parseFloat(e.target.value)));
                    setSelectedPreset(null);
                  }}
                  aria-label="Y1 の値"
                />
                <input
                  type="number"
                  className="cb-number"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={y1}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) {
                      setY1(round3(v));
                      setSelectedPreset(null);
                    }
                  }}
                  aria-label="Y1 の数値入力"
                />
              </div>

              {/* X2 */}
              <div className="cb-slider-row">
                <label htmlFor="cb-x2" className="cb-slider-label cb-label-x2">
                  X2
                </label>
                <input
                  id="cb-x2"
                  type="range"
                  className="cb-range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={x2}
                  onChange={(e) => {
                    setX2(round3(clamp(parseFloat(e.target.value), 0, 1)));
                    setSelectedPreset(null);
                  }}
                  aria-label="X2 の値"
                />
                <input
                  type="number"
                  className="cb-number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={x2}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) {
                      setX2(round3(clamp(v, 0, 1)));
                      setSelectedPreset(null);
                    }
                  }}
                  aria-label="X2 の数値入力"
                />
              </div>

              {/* Y2 */}
              <div className="cb-slider-row">
                <label htmlFor="cb-y2" className="cb-slider-label cb-label-y2">
                  Y2
                </label>
                <input
                  id="cb-y2"
                  type="range"
                  className="cb-range"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={y2}
                  onChange={(e) => {
                    setY2(round3(parseFloat(e.target.value)));
                    setSelectedPreset(null);
                  }}
                  aria-label="Y2 の値"
                />
                <input
                  type="number"
                  className="cb-number"
                  min={-2}
                  max={2}
                  step={0.01}
                  value={y2}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) {
                      setY2(round3(v));
                      setSelectedPreset(null);
                    }
                  }}
                  aria-label="Y2 の数値入力"
                />
              </div>
            </div>
          </div>

          {/* 右: プレビュー + CSS出力 + プリセット */}
          <div className="cb-right">
            {/* アニメーションプレビュー */}
            <div className="cb-preview-section">
              <div className="cb-preview-header">
                <p className="cb-section-title">アニメーションプレビュー</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAnimKey((k) => k + 1)}
                  aria-label="アニメーションを再生"
                >
                  再生
                </Button>
              </div>
              <div
                className="cb-preview-track"
                aria-label="タイミング関数のアニメーションプレビュー"
              >
                <div
                  key={animKey}
                  className="cb-preview-ball"
                  style={{
                    animation: `cb-slide 1.5s ${bezierCSS} infinite alternate`,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* CSS出力 */}
            <div className="cb-output-section">
              <div className="cb-output-header">
                <p className="cb-section-title">生成されたCSS</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  aria-label="CSSをクリップボードにコピー"
                >
                  コピー
                </Button>
              </div>
              <div
                className="cb-code-block"
                role="region"
                aria-label="CSSコード"
                aria-live="polite"
              >
                <span className="cb-bezier-value">{bezierCSS}</span>
                {"\n\n"}
                {fullCSS}
              </div>
            </div>

            {/* プリセット */}
            <div className="cb-presets-section">
              <p className="cb-section-title">プリセット</p>
              <div
                className="cb-presets-grid"
                role="list"
                aria-label="タイミング関数プリセット一覧"
              >
                {BEZIER_PRESETS.map((preset, index) => (
                  <button
                    key={preset.name}
                    type="button"
                    role="listitem"
                    className={`cb-preset-btn ${selectedPreset === index ? "selected" : ""}`}
                    onClick={() => applyPreset(preset, index)}
                    aria-pressed={selectedPreset === index}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <TipsCard>
              <p>
                <strong>制御点X (x1, x2):</strong> 0〜1の範囲で指定。時間軸の制御点位置です。
              </p>
              <p>
                <strong>制御点Y (y1, y2):</strong>{" "}
                0〜1の範囲外も指定可能。バウンスや戻り効果に使えます。
              </p>
              <p>
                <strong>ドラッグ操作:</strong> グラフ上の●をドラッグして制御点を直接調整できます。
              </p>
            </TipsCard>
          </div>
        </div>
      </div>
    </main>
  );
}
