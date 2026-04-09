import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type ScrollSnapConfig,
  type ScrollDirection,
  type ScrollSnapStrictness,
  type ScrollSnapAlign,
  type ScrollSnapStop,
  type ScrollOverflow,
  SCROLL_SNAP_PRESETS,
  createDefaultConfig,
  generateFullCSS,
  generateContainerProperties,
  generateItemProperties,
} from "~/utils/css-scroll-snap";

export const Route = createFileRoute("/css-scroll-snap")({
  head: () => ({
    meta: [
      { title: "CSS Scroll Snapジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS Scroll Snap のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。scroll-snap-type・scroll-snap-align・scroll-snap-stop などを直感的に試せるオンラインツール。",
      },
      {
        property: "og:title",
        content: "CSS Scroll Snapジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content: "CSS Scroll Snap のプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-scroll-snap` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Scroll Snapジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "CSS Scroll Snap のプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
    ],
  }),
  component: CssScrollSnapGenerator,
});

const DIRECTION_OPTIONS: { id: ScrollDirection; label: string }[] = [
  { id: "x", label: "x" },
  { id: "y", label: "y" },
  { id: "both", label: "both" },
  { id: "block", label: "block" },
  { id: "inline", label: "inline" },
];

const STRICTNESS_OPTIONS: { id: ScrollSnapStrictness; label: string }[] = [
  { id: "mandatory", label: "mandatory" },
  { id: "proximity", label: "proximity" },
];

const ALIGN_OPTIONS: { id: ScrollSnapAlign; label: string }[] = [
  { id: "none", label: "none" },
  { id: "start", label: "start" },
  { id: "center", label: "center" },
  { id: "end", label: "end" },
];

const STOP_OPTIONS: { id: ScrollSnapStop; label: string }[] = [
  { id: "normal", label: "normal" },
  { id: "always", label: "always" },
];

const OVERFLOW_OPTIONS: { id: ScrollOverflow; label: string }[] = [
  { id: "scroll", label: "scroll" },
  { id: "auto", label: "auto" },
];

const PREVIEW_ITEM_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

/** CSS Scroll Snap ジェネレーター コンポーネント */
function CssScrollSnapGenerator() {
  const [config, setConfig] = useState<ScrollSnapConfig>(createDefaultConfig);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  const generatedCSS = useMemo(() => generateFullCSS(config), [config]);

  const containerProps = useMemo(
    () => generateContainerProperties(config.container),
    [config.container],
  );

  const itemProps = useMemo(() => generateItemProperties(config.item), [config.item]);

  const isHorizontal = useMemo(
    () => config.container.direction === "x" || config.container.direction === "inline",
    [config.container.direction],
  );

  const updateContainer = useCallback(
    <K extends keyof ScrollSnapConfig["container"]>(
      key: K,
      value: ScrollSnapConfig["container"][K],
    ) => {
      setConfig((prev) => ({
        ...prev,
        container: { ...prev.container, [key]: value },
      }));
    },
    [],
  );

  const updateItem = useCallback(
    <K extends keyof ScrollSnapConfig["item"]>(key: K, value: ScrollSnapConfig["item"][K]) => {
      setConfig((prev) => ({
        ...prev,
        item: { ...prev.item, [key]: value },
      }));
    },
    [],
  );

  const applyPreset = useCallback(
    (index: number) => {
      const preset = SCROLL_SNAP_PRESETS[index];
      if (!preset) return;
      setConfig(preset.config);
      announceStatus(`「${preset.name}」プリセットを適用しました`);
    },
    [announceStatus],
  );

  const handleReset = useCallback(() => {
    setConfig(createDefaultConfig());
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  const handleCopyCSS = useCallback(async () => {
    const success = await copy(generatedCSS);
    if (success) {
      announceStatus("CSSをクリップボードにコピーしました");
      showToast("CSSをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, generatedCSS, announceStatus, showToast]);

  /** プレビューのコンテナスタイル（インライン style は必須） */
  const previewContainerStyle = useMemo(() => {
    const base: React.CSSProperties = {
      scrollSnapType: `${config.container.direction} ${config.container.strictness}`,
      scrollPadding:
        config.container.scrollPadding > 0 ? `${config.container.scrollPadding}px` : undefined,
    };
    if (config.container.direction === "x" || config.container.direction === "inline") {
      base.overflowX = config.container.overflow;
    } else if (config.container.direction === "y" || config.container.direction === "block") {
      base.overflowY = config.container.overflow;
    } else {
      base.overflow = config.container.overflow;
    }
    return base;
  }, [config.container]);

  /** プレビューのアイテムスタイル（インライン style は必須） */
  const previewItemStyle = useMemo(() => {
    const base: React.CSSProperties = {};
    if (config.item.align !== "none") {
      base.scrollSnapAlign = config.item.align;
    }
    if (config.item.stop === "always") {
      base.scrollSnapStop = "always";
    }
    if (config.item.scrollMargin > 0) {
      base.scrollMargin = `${config.item.scrollMargin}px`;
    }
    return base;
  }, [config.item]);

  return (
    <>
      <div className="tool-container">
        <div className="css-ss-layout">
          {/* 左側: コントロールパネル */}
          <div className="css-ss-controls" aria-label="Scroll Snap 設定パネル">
            {/* プリセット */}
            <section className="css-ss-section" aria-labelledby="css-ss-presets-title">
              <h2 className="css-ss-section-title" id="css-ss-presets-title">
                プリセット
              </h2>
              <div className="css-ss-presets">
                {SCROLL_SNAP_PRESETS.map((preset, i) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="css-ss-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.name}」プリセットを適用`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </section>

            {/* コンテナ設定 */}
            <section className="css-ss-section" aria-labelledby="css-ss-container-title">
              <div className="css-ss-section-header">
                <h2 className="css-ss-section-title" id="css-ss-container-title">
                  コンテナ設定
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

              <div className="css-ss-field-group">
                {/* scroll-snap-type: direction */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label">scroll-snap-type（方向）</label>
                  <div
                    className="css-ss-toggle-group"
                    role="group"
                    aria-label="スクロール方向の選択"
                  >
                    {DIRECTION_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`css-ss-toggle-btn${config.container.direction === id ? " css-ss-toggle-btn--active" : ""}`}
                        onClick={() => updateContainer("direction", id)}
                        aria-pressed={config.container.direction === id}
                        aria-label={`方向: ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* scroll-snap-type: strictness */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label">scroll-snap-type（厳密さ）</label>
                  <div
                    className="css-ss-toggle-group"
                    role="group"
                    aria-label="スナップの厳密さの選択"
                  >
                    {STRICTNESS_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`css-ss-toggle-btn${config.container.strictness === id ? " css-ss-toggle-btn--active" : ""}`}
                        onClick={() => updateContainer("strictness", id)}
                        aria-pressed={config.container.strictness === id}
                        aria-label={`厳密さ: ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* overflow */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label">overflow</label>
                  <div className="css-ss-toggle-group" role="group" aria-label="overflow の選択">
                    {OVERFLOW_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`css-ss-toggle-btn${config.container.overflow === id ? " css-ss-toggle-btn--active" : ""}`}
                        onClick={() => updateContainer("overflow", id)}
                        aria-pressed={config.container.overflow === id}
                        aria-label={`overflow: ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* scroll-padding */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label" htmlFor="css-ss-scroll-padding">
                    scroll-padding: {config.container.scrollPadding}px
                  </label>
                  <input
                    id="css-ss-scroll-padding"
                    type="range"
                    min={0}
                    max={64}
                    step={4}
                    value={config.container.scrollPadding}
                    className="css-ss-range"
                    onChange={(e) => updateContainer("scrollPadding", Number(e.target.value))}
                    aria-label={`scroll-padding: ${config.container.scrollPadding}px`}
                  />
                </div>
              </div>
            </section>

            {/* アイテム設定 */}
            <section className="css-ss-section" aria-labelledby="css-ss-item-title">
              <h2 className="css-ss-section-title" id="css-ss-item-title">
                アイテム設定
              </h2>

              <div className="css-ss-field-group">
                {/* scroll-snap-align */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label">scroll-snap-align</label>
                  <div className="css-ss-toggle-group" role="group" aria-label="スナップ位置の選択">
                    {ALIGN_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`css-ss-toggle-btn${config.item.align === id ? " css-ss-toggle-btn--active" : ""}`}
                        onClick={() => updateItem("align", id)}
                        aria-pressed={config.item.align === id}
                        aria-label={`align: ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* scroll-snap-stop */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label">scroll-snap-stop</label>
                  <div
                    className="css-ss-toggle-group"
                    role="group"
                    aria-label="スナップストップの選択"
                  >
                    {STOP_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`css-ss-toggle-btn${config.item.stop === id ? " css-ss-toggle-btn--active" : ""}`}
                        onClick={() => updateItem("stop", id)}
                        aria-pressed={config.item.stop === id}
                        aria-label={`stop: ${label}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* scroll-margin */}
                <div className="css-ss-field">
                  <label className="css-ss-field-label" htmlFor="css-ss-scroll-margin">
                    scroll-margin: {config.item.scrollMargin}px
                  </label>
                  <input
                    id="css-ss-scroll-margin"
                    type="range"
                    min={0}
                    max={32}
                    step={4}
                    value={config.item.scrollMargin}
                    className="css-ss-range"
                    onChange={(e) => updateItem("scrollMargin", Number(e.target.value))}
                    aria-label={`scroll-margin: ${config.item.scrollMargin}px`}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* 右側: プレビュー + CSS 出力 */}
          <div className="css-ss-right">
            {/* ライブプレビュー */}
            <section className="css-ss-preview-section" aria-labelledby="css-ss-preview-title">
              <h2 className="css-ss-section-title" id="css-ss-preview-title">
                ライブプレビュー
              </h2>
              <p className="css-ss-preview-hint">
                コンテナをスクロールしてスナップ動作を確認できます
              </p>
              <div
                className={`css-ss-preview-container${isHorizontal ? " css-ss-preview-container--h" : " css-ss-preview-container--v"}`}
                style={previewContainerStyle}
                aria-label="Scroll Snap のプレビュー"
              >
                {PREVIEW_ITEM_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className={`css-ss-preview-item${isHorizontal ? " css-ss-preview-item--h" : " css-ss-preview-item--v"}`}
                    style={{ ...previewItemStyle, backgroundColor: color }}
                    aria-label={`スクロールアイテム ${i + 1}`}
                  >
                    <span className="css-ss-preview-item-label">{i + 1}</span>
                  </div>
                ))}
              </div>

              {/* プロパティ確認 */}
              <div className="css-ss-props-summary">
                <div className="css-ss-props-group">
                  <span className="css-ss-props-title">.scroll-container</span>
                  <ul className="css-ss-props-list">
                    {containerProps.map((prop) => (
                      <li key={prop} className="css-ss-props-item">
                        {prop}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="css-ss-props-group">
                  <span className="css-ss-props-title">.scroll-item</span>
                  <ul className="css-ss-props-list">
                    {itemProps.length > 0 ? (
                      itemProps.map((prop) => (
                        <li key={prop} className="css-ss-props-item">
                          {prop}
                        </li>
                      ))
                    ) : (
                      <li className="css-ss-props-item css-ss-props-item--empty">(設定なし)</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* CSS 出力 */}
            <section className="css-ss-css-section" aria-labelledby="css-ss-css-output-title">
              <div className="css-ss-css-header">
                <h2 className="css-ss-section-title" id="css-ss-css-output-title">
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
                className="css-ss-css-output"
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
                "プリセットから代表的なスナップパターンをすぐに適用できます",
                "「コンテナ設定」でスクロール方向・厳密さ・余白を設定します",
                "「アイテム設定」でスナップ位置（start/center/end）を選択します",
                "プレビューを実際にスクロールしてスナップ動作を確認できます",
                "「生成 CSS」のコピーボタンでコードをクリップボードにコピー",
              ],
            },
            {
              title: "scroll-snap-type",
              items: [
                "x / y: 水平・垂直方向のスナップ",
                "both: 両方向スナップ",
                "mandatory: 必ずスナップポイントで止まる（強制）",
                "proximity: スナップポイントに近い場合のみスナップ（緩やか）",
              ],
            },
            {
              title: "scroll-snap-align",
              items: [
                "start: スクロールポートの先頭にアライン",
                "center: スクロールポートの中央にアライン",
                "end: スクロールポートの末尾にアライン",
                "scroll-snap-stop: always を指定すると1アイテムずつ確実に止まる",
                "scroll-padding / scroll-margin でスナップ位置を微調整できる",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
