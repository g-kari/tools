import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  type AnimationConfig,
  type AnimationType,
  type SlideDirection,
  type TimingFunction,
  type AnimationDirection,
  type FillMode,
  generateAnimationCSS,
  getDefaultConfig,
} from "../utils/css-animation";
import "../styles/tools/css-animation.css";

export const Route = createFileRoute("/css-animation")({
  head: () => ({
    meta: [
      { title: "CSSアニメーション生成 | Web ツール集" },
      {
        name: "description",
        content:
          "CSSキーフレームアニメーションをビジュアルエディターで作成。duration・easing・delay・繰り返し設定を調整してCSSコードを即座に生成できるオンラインツール。",
      },
      { property: "og:title", content: "CSSアニメーション生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "CSSキーフレームアニメーションをビジュアルエディターで作成。duration・easing・delay・繰り返し設定を調整してCSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-animation` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSSアニメーション生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSSキーフレームアニメーションをビジュアルエディターで作成。",
      },
    ],
  }),
  component: CssAnimationGenerator,
});

const ANIMATION_TYPES: { id: AnimationType; label: string }[] = [
  { id: "fade", label: "フェード" },
  { id: "slide", label: "スライド" },
  { id: "bounce", label: "バウンス" },
  { id: "rotate", label: "回転" },
  { id: "scale", label: "拡大" },
  { id: "shake", label: "シェイク" },
  { id: "pulse", label: "パルス" },
  { id: "flip", label: "フリップ" },
];

const TIMING_FUNCTIONS: { id: TimingFunction; label: string }[] = [
  { id: "ease", label: "ease" },
  { id: "linear", label: "linear" },
  { id: "ease-in", label: "ease-in" },
  { id: "ease-out", label: "ease-out" },
  { id: "ease-in-out", label: "ease-in-out" },
];

const DIRECTIONS: { id: AnimationDirection; label: string }[] = [
  { id: "normal", label: "normal" },
  { id: "reverse", label: "reverse" },
  { id: "alternate", label: "alternate" },
  { id: "alternate-reverse", label: "alternate-reverse" },
];

const FILL_MODES: { id: FillMode; label: string }[] = [
  { id: "none", label: "none" },
  { id: "forwards", label: "forwards" },
  { id: "backwards", label: "backwards" },
  { id: "both", label: "both" },
];

const SLIDE_DIRECTIONS: { id: SlideDirection; label: string }[] = [
  { id: "up", label: "上から" },
  { id: "down", label: "下から" },
  { id: "left", label: "左から" },
  { id: "right", label: "右から" },
];

const ITERATION_OPTIONS: { value: number | "infinite"; label: string }[] = [
  { value: 1, label: "1回" },
  { value: 2, label: "2回" },
  { value: 3, label: "3回" },
  { value: 5, label: "5回" },
  { value: 10, label: "10回" },
  { value: "infinite", label: "∞ 無限" },
];

/**
 * CSSアニメーション生成コンポーネント
 */
function CssAnimationGenerator() {
  const [config, setConfig] = useState<AnimationConfig>(getDefaultConfig());
  const [animationKey, setAnimationKey] = useState(0);
  const { showToast } = useToast();

  const generatedCSS = useMemo(() => generateAnimationCSS(config), [config]);

  const previewClassName = `ca-preview-box ca-preview-box--key-${animationKey}`;
  const previewCSS = generatedCSS.replace(
    ".my-element",
    `.ca-preview-box--key-${animationKey}`
  );

  // アニメーション種類変更
  const handleTypeChange = useCallback((type: AnimationType) => {
    setConfig((prev) => ({ ...prev, type }));
  }, []);

  // スライド方向変更
  const handleSlideDirectionChange = useCallback(
    (slideDirection: SlideDirection) => {
      setConfig((prev) => ({ ...prev, slideDirection }));
    },
    []
  );

  // duration変更
  const handleDurationChange = useCallback((duration: number) => {
    setConfig((prev) => ({ ...prev, duration }));
  }, []);

  // delay変更
  const handleDelayChange = useCallback((delay: number) => {
    setConfig((prev) => ({ ...prev, delay }));
  }, []);

  // iterationCount変更
  const handleIterationCountChange = useCallback(
    (iterationCount: number | "infinite") => {
      setConfig((prev) => ({ ...prev, iterationCount }));
    },
    []
  );

  // timingFunction変更
  const handleTimingFunctionChange = useCallback(
    (timingFunction: TimingFunction) => {
      setConfig((prev) => ({ ...prev, timingFunction }));
    },
    []
  );

  // direction変更
  const handleDirectionChange = useCallback(
    (direction: AnimationDirection) => {
      setConfig((prev) => ({ ...prev, direction }));
    },
    []
  );

  // fillMode変更
  const handleFillModeChange = useCallback((fillMode: FillMode) => {
    setConfig((prev) => ({ ...prev, fillMode }));
  }, []);

  // 再生ボタン
  const handlePlay = useCallback(() => {
    setAnimationKey((k) => k + 1);
  }, []);

  // CSSコピー
  const handleCopyCSS = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCSS);
      showToast("CSSをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [generatedCSS, showToast]);

  return (
    <main className="tool-container" role="main">
      <div className="ca-container">
        <h1 className="tool-title">CSSアニメーション生成</h1>
        <p className="tool-description">
          ビジュアルエディターでCSSキーフレームアニメーションを作成します。
          duration・easing・delay・繰り返し設定を調整してCSSコードを即座に生成。
        </p>

        <div className="ca-layout">
          {/* コントロールパネル */}
          <div className="ca-controls">
            {/* アニメーション種類 */}
            <div className="ca-section">
              <p className="ca-section-title">アニメーション種類</p>
              <div
                className="ca-type-grid"
                role="group"
                aria-label="アニメーション種類選択"
              >
                {ANIMATION_TYPES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`ca-type-btn${config.type === id ? " ca-type-btn--active" : ""}`}
                    onClick={() => handleTypeChange(id)}
                    aria-pressed={config.type === id}
                    aria-label={`${label}アニメーション`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* スライド方向（slideが選択されているときのみ） */}
            {config.type === "slide" && (
              <div className="ca-section">
                <p className="ca-section-title">スライド方向</p>
                <div className="ca-param-row">
                  <select
                    className="ca-select"
                    value={config.slideDirection}
                    onChange={(e) =>
                      handleSlideDirectionChange(
                        e.target.value as SlideDirection
                      )
                    }
                    aria-label="スライド方向"
                  >
                    {SLIDE_DIRECTIONS.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* パラメータ設定 */}
            <div className="ca-section">
              <p className="ca-section-title">パラメータ</p>

              {/* duration */}
              <div className="ca-param-row">
                <span className="ca-param-label">
                  <span>Duration（秒）</span>
                  <span className="ca-param-value">{config.duration}s</span>
                </span>
                <input
                  type="range"
                  className="ca-range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={config.duration}
                  onChange={(e) => handleDurationChange(Number(e.target.value))}
                  aria-label="アニメーション時間（秒）"
                />
              </div>

              {/* delay */}
              <div className="ca-param-row">
                <span className="ca-param-label">
                  <span>Delay（秒）</span>
                  <span className="ca-param-value">{config.delay}s</span>
                </span>
                <input
                  type="range"
                  className="ca-range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={config.delay}
                  onChange={(e) => handleDelayChange(Number(e.target.value))}
                  aria-label="アニメーション遅延（秒）"
                />
              </div>

              {/* iterationCount */}
              <div className="ca-param-row">
                <label className="ca-param-label" htmlFor="ca-iteration">
                  <span>繰り返し回数</span>
                </label>
                <select
                  id="ca-iteration"
                  className="ca-select"
                  value={config.iterationCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleIterationCountChange(
                      val === "infinite" ? "infinite" : Number(val)
                    );
                  }}
                  aria-label="繰り返し回数"
                >
                  {ITERATION_OPTIONS.map(({ value, label }) => (
                    <option key={String(value)} value={String(value)}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* timingFunction */}
              <div className="ca-param-row">
                <label className="ca-param-label" htmlFor="ca-timing">
                  <span>Timing Function</span>
                </label>
                <select
                  id="ca-timing"
                  className="ca-select"
                  value={config.timingFunction}
                  onChange={(e) =>
                    handleTimingFunctionChange(e.target.value as TimingFunction)
                  }
                  aria-label="タイミング関数"
                >
                  {TIMING_FUNCTIONS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* direction */}
              <div className="ca-param-row">
                <label className="ca-param-label" htmlFor="ca-direction">
                  <span>Direction</span>
                </label>
                <select
                  id="ca-direction"
                  className="ca-select"
                  value={config.direction}
                  onChange={(e) =>
                    handleDirectionChange(e.target.value as AnimationDirection)
                  }
                  aria-label="アニメーション方向"
                >
                  {DIRECTIONS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* fillMode */}
              <div className="ca-param-row">
                <label className="ca-param-label" htmlFor="ca-fill-mode">
                  <span>Fill Mode</span>
                </label>
                <select
                  id="ca-fill-mode"
                  className="ca-select"
                  value={config.fillMode}
                  onChange={(e) =>
                    handleFillModeChange(e.target.value as FillMode)
                  }
                  aria-label="フィルモード"
                >
                  {FILL_MODES.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* プレビュー + 出力 */}
          <div className="ca-right">
            {/* プレビュー */}
            <div className="ca-preview-section">
              <p className="ca-section-title">プレビュー</p>
              <div
                className="ca-preview-area"
                role="img"
                aria-label="アニメーションプレビューエリア"
              >
                <style>{previewCSS}</style>
                <div
                  key={animationKey}
                  className={previewClassName}
                  aria-hidden="true"
                />
              </div>
              <div className="ca-preview-actions">
                <Button
                  variant="default"
                  onClick={handlePlay}
                  aria-label="アニメーションを再生する"
                >
                  再生
                </Button>
              </div>
            </div>

            {/* CSS出力 */}
            <div className="ca-output-section">
              <div className="ca-output-header">
                <p className="ca-section-title">生成されたCSS</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCSS}
                  aria-label="CSSをクリップボードにコピー"
                >
                  コピー
                </Button>
              </div>
              <pre
                className="ca-code-block"
                role="region"
                aria-label="生成されたCSSコード"
                aria-live="polite"
              >
                <code>{generatedCSS}</code>
              </pre>
            </div>

            <TipsCard>
              <p>
                <strong>Duration:</strong>{" "}
                アニメーション1サイクルの再生時間。短いと素早く、長いとゆっくり動きます。
              </p>
              <p>
                <strong>Timing Function:</strong>{" "}
                アニメーションの速度変化。easeは自然な加減速、linearは一定速度で動きます。
              </p>
              <p>
                <strong>Fill Mode:</strong>{" "}
                forwards にすると、アニメーション終了後もその状態を維持します。
              </p>
              <p>
                <strong>Direction:</strong>{" "}
                alternate にすると、アニメーションが交互に順方向・逆方向に再生されます。
              </p>
            </TipsCard>
          </div>
        </div>
      </div>
    </main>
  );
}
