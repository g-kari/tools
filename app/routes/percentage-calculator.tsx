import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  calcWhatPercent,
  calcPercentOf,
  calcPercentChange,
  calcPercentIncrease,
  formatResult,
} from "~/utils/percentage";

export const Route = createFileRoute("/percentage-calculator")({
  head: () => ({
    meta: [
      { title: "パーセンテージ計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "「XはYの何%か」「XのY%はいくら」「変化率」「増加・減少後の値」など、よく使うパーセンテージ計算をまとめたツール。",
      },
      {
        property: "og:title",
        content: "パーセンテージ計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "「XはYの何%か」「XのY%はいくら」「変化率」「増加・減少後の値」など、パーセンテージ計算ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/percentage-calculator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: PercentageCalculator,
});

/** 計算モード */
type Mode = "what-percent" | "percent-of" | "percent-change" | "increase-decrease";

/**
 * パーセンテージ計算機ページコンポーネント
 */
function PercentageCalculator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>("what-percent");

  // 各モードの入力値
  const [wpX, setWpX] = useState("");
  const [wpY, setWpY] = useState("");

  const [poX, setPoX] = useState("");
  const [poY, setPoY] = useState("");

  const [pcFrom, setPcFrom] = useState("");
  const [pcTo, setPcTo] = useState("");

  const [idBase, setIdBase] = useState("");
  const [idPercent, setIdPercent] = useState("");

  // 「XはYの何%か」の計算結果
  const whatPercentResult = useMemo<{
    value: string;
    error: string | null;
  }>(() => {
    if (!wpX || !wpY) return { value: "", error: null };
    const x = parseFloat(wpX);
    const y = parseFloat(wpY);
    if (isNaN(x) || isNaN(y)) return { value: "", error: "有効な数値を入力してください" };
    const result = calcWhatPercent(x, y);
    if (result === null) return { value: "", error: "Yに0は指定できません" };
    return { value: formatResult(result), error: null };
  }, [wpX, wpY]);

  // 「XのY%はいくら」の計算結果
  const percentOfResult = useMemo<{
    value: string;
    error: string | null;
  }>(() => {
    if (!poX || !poY) return { value: "", error: null };
    const x = parseFloat(poX);
    const y = parseFloat(poY);
    if (isNaN(x) || isNaN(y)) return { value: "", error: "有効な数値を入力してください" };
    const result = calcPercentOf(x, y);
    return { value: formatResult(result), error: null };
  }, [poX, poY]);

  // 「変化率」の計算結果
  const percentChangeResult = useMemo<{
    value: string;
    isPositive: boolean;
    error: string | null;
  }>(() => {
    if (!pcFrom || !pcTo) return { value: "", isPositive: true, error: null };
    const from = parseFloat(pcFrom);
    const to = parseFloat(pcTo);
    if (isNaN(from) || isNaN(to)) return { value: "", isPositive: true, error: "有効な数値を入力してください" };
    const result = calcPercentChange(from, to);
    if (result === null) return { value: "", isPositive: true, error: "変化前の値に0は指定できません" };
    return {
      value: formatResult(result),
      isPositive: result >= 0,
      error: null,
    };
  }, [pcFrom, pcTo]);

  // 「増加・減少後の値」の計算結果
  const increaseDecreaseResult = useMemo<{
    value: string;
    error: string | null;
  }>(() => {
    if (!idBase || !idPercent) return { value: "", error: null };
    const base = parseFloat(idBase);
    const percent = parseFloat(idPercent);
    if (isNaN(base) || isNaN(percent)) return { value: "", error: "有効な数値を入力してください" };
    const result = calcPercentIncrease(base, percent);
    return { value: formatResult(result), error: null };
  }, [idBase, idPercent]);

  const currentResult = useMemo(() => {
    switch (mode) {
      case "what-percent": return whatPercentResult.value;
      case "percent-of": return percentOfResult.value;
      case "percent-change": return percentChangeResult.value;
      case "increase-decrease": return increaseDecreaseResult.value;
    }
  }, [mode, whatPercentResult, percentOfResult, percentChangeResult, increaseDecreaseResult]);

  const handleCopy = useCallback(async () => {
    if (!currentResult) return;
    const success = await copy(currentResult);
    if (success) {
      showToast("結果をコピーしました", "success");
      announceStatus("結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [currentResult, copy, showToast, announceStatus]);

  const tabs: { mode: Mode; label: string }[] = [
    { mode: "what-percent", label: "XはYの何%?" },
    { mode: "percent-of", label: "XのY%は?" },
    { mode: "percent-change", label: "変化率" },
    { mode: "increase-decrease", label: "増加・減少" },
  ];

  return (
    <>
      <div className="tool-container">
        <div
          className="percentage-tabs"
          role="tablist"
          aria-label="計算モード選択"
        >
          {tabs.map((tab) => (
            <button
              key={tab.mode}
              role="tab"
              aria-selected={mode === tab.mode}
              className={`percentage-tab-btn ${mode === tab.mode ? "active" : ""}`}
              onClick={() => setMode(tab.mode)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* XはYの何%? */}
        {mode === "what-percent" && (
          <section aria-label="XはYの何%か計算">
            <p className="percentage-formula">( X ÷ Y ) × 100 = ?%</p>
            <div className="percentage-form">
              <div className="percentage-input-row">
                <label htmlFor="wp-x">X =</label>
                <input
                  id="wp-x"
                  type="number"
                  value={wpX}
                  onChange={(e) => setWpX(e.target.value)}
                  placeholder="例: 25"
                  aria-label="対象の数値 X"
                />
              </div>
              <div className="percentage-input-row">
                <label htmlFor="wp-y">Y =</label>
                <input
                  id="wp-y"
                  type="number"
                  value={wpY}
                  onChange={(e) => setWpY(e.target.value)}
                  placeholder="例: 200"
                  aria-label="基準の数値 Y"
                />
              </div>
              {whatPercentResult.error && (
                <div className="percentage-error" role="alert">{whatPercentResult.error}</div>
              )}
              {whatPercentResult.value ? (
                <div className="percentage-result-block" aria-live="polite">
                  <span className="percentage-result-label">X は Y の</span>
                  <div className="percentage-result-value">
                    {whatPercentResult.value}
                    <span className="percentage-result-unit">%</span>
                  </div>
                  <button className="percentage-copy-btn" onClick={handleCopy} aria-label="結果をコピー">
                    コピー
                  </button>
                </div>
              ) : (
                !whatPercentResult.error && (
                  <div className="percentage-empty-state" aria-live="polite">
                    X と Y を入力すると結果が表示されます
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* XのY%は? */}
        {mode === "percent-of" && (
          <section aria-label="XのY%の値を計算">
            <p className="percentage-formula">X × ( Y ÷ 100 ) = ?</p>
            <div className="percentage-form">
              <div className="percentage-input-row">
                <label htmlFor="po-x">X =</label>
                <input
                  id="po-x"
                  type="number"
                  value={poX}
                  onChange={(e) => setPoX(e.target.value)}
                  placeholder="例: 1000"
                  aria-label="基準の数値 X"
                />
              </div>
              <div className="percentage-input-row">
                <label htmlFor="po-y">Y =</label>
                <input
                  id="po-y"
                  type="number"
                  value={poY}
                  onChange={(e) => setPoY(e.target.value)}
                  placeholder="例: 15"
                  aria-label="パーセンテージ Y"
                />
                <span className="percentage-unit">%</span>
              </div>
              {percentOfResult.error && (
                <div className="percentage-error" role="alert">{percentOfResult.error}</div>
              )}
              {percentOfResult.value ? (
                <div className="percentage-result-block" aria-live="polite">
                  <span className="percentage-result-label">X の Y% は</span>
                  <div className="percentage-result-value">
                    {percentOfResult.value}
                  </div>
                  <button className="percentage-copy-btn" onClick={handleCopy} aria-label="結果をコピー">
                    コピー
                  </button>
                </div>
              ) : (
                !percentOfResult.error && (
                  <div className="percentage-empty-state" aria-live="polite">
                    X と Y を入力すると結果が表示されます
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* 変化率 */}
        {mode === "percent-change" && (
          <section aria-label="変化率の計算">
            <p className="percentage-formula">( ( To - From ) ÷ |From| ) × 100 = ?%</p>
            <div className="percentage-form">
              <div className="percentage-input-row">
                <label htmlFor="pc-from">変化前 =</label>
                <input
                  id="pc-from"
                  type="number"
                  value={pcFrom}
                  onChange={(e) => setPcFrom(e.target.value)}
                  placeholder="例: 100"
                  aria-label="変化前の値"
                />
              </div>
              <div className="percentage-input-row">
                <label htmlFor="pc-to">変化後 =</label>
                <input
                  id="pc-to"
                  type="number"
                  value={pcTo}
                  onChange={(e) => setPcTo(e.target.value)}
                  placeholder="例: 125"
                  aria-label="変化後の値"
                />
              </div>
              {percentChangeResult.error && (
                <div className="percentage-error" role="alert">{percentChangeResult.error}</div>
              )}
              {percentChangeResult.value ? (
                <div className="percentage-result-block" aria-live="polite">
                  <span className="percentage-result-label">
                    変化率は {percentChangeResult.isPositive ? "▲ 増加" : "▼ 減少"}
                  </span>
                  <div className="percentage-result-value">
                    {percentChangeResult.isPositive ? "+" : ""}{percentChangeResult.value}
                    <span className="percentage-result-unit">%</span>
                  </div>
                  <button className="percentage-copy-btn" onClick={handleCopy} aria-label="結果をコピー">
                    コピー
                  </button>
                </div>
              ) : (
                !percentChangeResult.error && (
                  <div className="percentage-empty-state" aria-live="polite">
                    変化前・変化後の値を入力すると変化率が表示されます
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* 増加・減少 */}
        {mode === "increase-decrease" && (
          <section aria-label="増加・減少後の値を計算">
            <p className="percentage-formula">X × ( 1 + Y ÷ 100 ) = ? &nbsp;（減少はYにマイナス値を入力）</p>
            <div className="percentage-form">
              <div className="percentage-input-row">
                <label htmlFor="id-base">X =</label>
                <input
                  id="id-base"
                  type="number"
                  value={idBase}
                  onChange={(e) => setIdBase(e.target.value)}
                  placeholder="例: 5000"
                  aria-label="元の数値 X"
                />
              </div>
              <div className="percentage-input-row">
                <label htmlFor="id-percent">Y =</label>
                <input
                  id="id-percent"
                  type="number"
                  value={idPercent}
                  onChange={(e) => setIdPercent(e.target.value)}
                  placeholder="例: 10 または -10"
                  aria-label="変化させるパーセンテージ Y"
                />
                <span className="percentage-unit">%（増加は正、減少は負）</span>
              </div>
              {increaseDecreaseResult.error && (
                <div className="percentage-error" role="alert">{increaseDecreaseResult.error}</div>
              )}
              {increaseDecreaseResult.value ? (
                <div className="percentage-result-block" aria-live="polite">
                  <span className="percentage-result-label">
                    {parseFloat(idPercent) >= 0 ? "増加" : "減少"}後の値
                  </span>
                  <div className="percentage-result-value">
                    {increaseDecreaseResult.value}
                  </div>
                  <button className="percentage-copy-btn" onClick={handleCopy} aria-label="結果をコピー">
                    コピー
                  </button>
                </div>
              ) : (
                !increaseDecreaseResult.error && (
                  <div className="percentage-empty-state" aria-live="polite">
                    X と Y を入力すると結果が表示されます
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "計算モードの説明",
              items: [
                "XはYの何%? → (X ÷ Y) × 100 = 結果(%) 例: 25は200の12.5%",
                "XのY%は? → X × (Y ÷ 100) = 結果 例: 1000の15%は150",
                "変化率 → ((変化後 - 変化前) ÷ |変化前|) × 100 = 変化率(%) 例: 100から125へは+25%",
                "増加・減少 → X × (1 + Y ÷ 100) = 結果 減少させる場合はYにマイナス値を入力",
              ],
            },
            {
              title: "活用例",
              items: [
                "割引計算: 定価5000円の20%引きは? → 増加・減少モードで X=5000, Y=-20",
                "税込価格: 1000円に消費税10%を加えると? → 増加・減少モードで X=1000, Y=10",
                "達成率: 目標100に対して75達成した場合は? → XはYの何%?モードで X=75, Y=100",
                "値上がり率: 100円が130円になった変化率は? → 変化率モードで 変化前=100, 変化後=130",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
