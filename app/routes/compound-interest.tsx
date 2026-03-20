import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  calcCompoundInterest,
  validateCompoundInterestParams,
  formatYen,
  frequencyLabel,
  type CompoundFrequency,
} from "~/utils/compound-interest";

export const Route = createFileRoute("/compound-interest")({
  head: () => ({
    meta: [
      { title: "複利計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "元本・年利率・運用期間・複利計算頻度・追加積立金を入力して最終残高・総利息を計算。長期投資・資産運用のシミュレーターとして活用できます。",
      },
      {
        property: "og:title",
        content: "複利計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "元本・年利率・運用期間・追加積立に対応した複利計算シミュレーター。最終残高・総利息・年別内訳を表示。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/compound-interest` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: CompoundInterestCalculator,
});

/**
 * 複利計算機ページコンポーネント
 */
function CompoundInterestCalculator() {
  const [principalStr, setPrincipalStr] = useState("1000000");
  const [rateStr, setRateStr] = useState("5");
  const [termStr, setTermStr] = useState("10");
  const [frequency, setFrequency] = useState<CompoundFrequency>("monthly");
  const [contributionStr, setContributionStr] = useState("0");
  const [showSchedule, setShowSchedule] = useState(false);

  const { showToast } = useToast();
  const { statusRef } = useStatusAnnouncement();

  const params = useMemo(() => {
    const principal = parseFloat(principalStr);
    const annualRate = parseFloat(rateStr);
    const termYears = parseInt(termStr, 10);
    const additionalContribution = parseFloat(contributionStr);
    return { principal, annualRate, termYears, frequency, additionalContribution };
  }, [principalStr, rateStr, termStr, frequency, contributionStr]);

  const validationError = useMemo(
    () => validateCompoundInterestParams(params),
    [params]
  );

  const result = useMemo(() => {
    if (validationError) return null;
    return calcCompoundInterest(params);
  }, [params, validationError]);

  const principalRatio = useMemo(() => {
    if (!result || result.finalAmount === 0) return 0;
    return (result.initialPrincipal / result.finalAmount) * 100;
  }, [result]);

  const contributionRatio = useMemo(() => {
    if (!result || result.finalAmount === 0) return 0;
    return (result.totalContribution / result.finalAmount) * 100;
  }, [result]);

  const interestRatio = useMemo(() => {
    if (!result || result.finalAmount === 0) return 0;
    return 100 - principalRatio - contributionRatio;
  }, [result, principalRatio, contributionRatio]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    const text = [
      `最終残高: ${formatYen(result.finalAmount)}`,
      `元本合計: ${formatYen(result.totalPrincipal)}`,
      `総利息: ${formatYen(result.totalInterest)}`,
      ...(result.totalContribution > 0
        ? [`積立金合計: ${formatYen(result.totalContribution)}`]
        : []),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      showToast("計算結果をコピーしました", "success");
    });
  }, [result, showToast]);

  const isInputReady =
    principalStr !== "" &&
    rateStr !== "" &&
    termStr !== "" &&
    contributionStr !== "";

  return (
    <>
      <h1 className="page-title">複利計算機</h1>
      <p className="page-description">
        元本・年利率・運用期間・追加積立金を入力して最終残高・総利息をシミュレーション。長期投資・資産運用の計画にご活用ください。
      </p>

      <div className="tool-container">
        {/* 入力フォーム */}
        <div className="ci-form">
          <div className="ci-input-group">
            <label htmlFor="ci-principal">元本</label>
            <div className="ci-input-row">
              <input
                id="ci-principal"
                type="number"
                min="1"
                step="10000"
                value={principalStr}
                onChange={(e) => setPrincipalStr(e.target.value)}
                placeholder="例: 1000000"
                aria-label="元本（円）"
              />
              <span className="ci-input-unit">円</span>
            </div>
          </div>

          <div className="ci-input-group">
            <label htmlFor="ci-rate">年利率</label>
            <div className="ci-input-row">
              <input
                id="ci-rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                placeholder="例: 5"
                aria-label="年利率（%）"
              />
              <span className="ci-input-unit">%</span>
            </div>
          </div>

          <div className="ci-input-group">
            <label htmlFor="ci-term">運用期間</label>
            <div className="ci-input-row">
              <input
                id="ci-term"
                type="number"
                min="1"
                max="100"
                step="1"
                value={termStr}
                onChange={(e) => setTermStr(e.target.value)}
                placeholder="例: 10"
                aria-label="運用期間（年）"
              />
              <span className="ci-input-unit">年</span>
            </div>
          </div>

          <div className="ci-input-group">
            <label htmlFor="ci-frequency">複利計算頻度</label>
            <div className="ci-input-row">
              <select
                id="ci-frequency"
                className="ci-select"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as CompoundFrequency)
                }
                aria-label="複利計算頻度"
              >
                <option value="monthly">毎月（月複利）</option>
                <option value="quarterly">四半期（四半期複利）</option>
                <option value="semi-annually">半年（半年複利）</option>
                <option value="annually">毎年（年複利）</option>
              </select>
            </div>
          </div>

          <div className="ci-input-group">
            <label htmlFor="ci-contribution">
              追加積立金（{frequencyLabel(frequency)}ごと）
            </label>
            <div className="ci-input-row">
              <input
                id="ci-contribution"
                type="number"
                min="0"
                step="1000"
                value={contributionStr}
                onChange={(e) => setContributionStr(e.target.value)}
                placeholder="例: 10000"
                aria-label={`追加積立金（円/${frequencyLabel(frequency)}）`}
              />
              <span className="ci-input-unit">
                円 / {frequencyLabel(frequency)}
              </span>
            </div>
          </div>

          {validationError && isInputReady && (
            <div className="ci-error" role="alert">
              {validationError}
            </div>
          )}
        </div>

        {/* 計算結果 */}
        {result ? (
          <>
            <div
              className="ci-summary"
              aria-live="polite"
              aria-label="計算結果"
            >
              <div className="ci-summary-card primary">
                <span className="ci-summary-label">最終残高</span>
                <span
                  className="ci-summary-value"
                  aria-label={`最終残高 ${formatYen(result.finalAmount)}`}
                >
                  {Math.round(result.finalAmount / 10000).toLocaleString(
                    "ja-JP"
                  )}
                </span>
                <span className="ci-summary-sub">
                  万円（{formatYen(result.finalAmount)}）
                </span>
              </div>

              <div className="ci-summary-card">
                <span className="ci-summary-label">元本合計</span>
                <span
                  className="ci-summary-value"
                  aria-label={`元本合計 ${formatYen(result.totalPrincipal)}`}
                >
                  {Math.round(result.totalPrincipal / 10000).toLocaleString(
                    "ja-JP"
                  )}
                </span>
                <span className="ci-summary-sub">
                  万円（{formatYen(result.totalPrincipal)}）
                </span>
              </div>

              <div className="ci-summary-card">
                <span className="ci-summary-label">総利息</span>
                <span
                  className="ci-summary-value"
                  aria-label={`総利息 ${formatYen(result.totalInterest)}`}
                >
                  {Math.round(result.totalInterest / 10000).toLocaleString(
                    "ja-JP"
                  )}
                </span>
                <span className="ci-summary-sub">
                  万円（{formatYen(result.totalInterest)}）
                </span>
              </div>
            </div>

            {/* 比率バー */}
            <div className="ci-ratio-bar" aria-label="元本・利息・積立金の割合">
              <div className="ci-ratio-bar-label">
                <span>
                  元本 {principalRatio.toFixed(1)}%（
                  {Math.round(result.initialPrincipal / 10000).toLocaleString(
                    "ja-JP"
                  )}{" "}
                  万円）
                </span>
                {result.totalContribution > 0 && (
                  <span>
                    積立 {contributionRatio.toFixed(1)}%（
                    {Math.round(
                      result.totalContribution / 10000
                    ).toLocaleString("ja-JP")}{" "}
                    万円）
                  </span>
                )}
                <span>
                  利息 {interestRatio.toFixed(1)}%（
                  {Math.round(result.totalInterest / 10000).toLocaleString(
                    "ja-JP"
                  )}{" "}
                  万円）
                </span>
              </div>
              <div
                className="ci-ratio-track"
                role="img"
                aria-label={`元本 ${principalRatio.toFixed(1)}%、積立 ${contributionRatio.toFixed(1)}%、利息 ${interestRatio.toFixed(1)}%`}
                style={
                  {
                    "--ci-principal-ratio": `${principalRatio}%`,
                    "--ci-interest-ratio": `${Math.max(0, interestRatio)}%`,
                    "--ci-contribution-ratio": `${contributionRatio}%`,
                  } as React.CSSProperties
                }
              >
                <span className="ci-ratio-fill-principal" />
                <span className="ci-ratio-fill-contribution" />
                <span className="ci-ratio-fill-interest" />
              </div>
            </div>

            {/* コピーボタン */}
            <div className="ci-copy-actions">
              <button
                className="ci-schedule-toggle"
                onClick={handleCopy}
                aria-label="計算結果をクリップボードにコピー"
              >
                📋 結果をコピー
              </button>
            </div>

            {/* 年別内訳表 */}
            <div className="ci-schedule-section">
              <button
                className="ci-schedule-toggle"
                onClick={() => setShowSchedule((v) => !v)}
                aria-expanded={showSchedule}
                aria-controls="ci-schedule-table"
              >
                {showSchedule ? "▲" : "▼"} 年別内訳（{params.termYears} 年分）
              </button>

              {showSchedule && (
                <div
                  id="ci-schedule-table"
                  className="ci-schedule-table-wrapper"
                  role="region"
                  aria-label="年別運用内訳"
                >
                  <table className="ci-schedule-table">
                    <thead>
                      <tr>
                        <th scope="col">年</th>
                        <th scope="col">残高</th>
                        <th scope="col">元本累計</th>
                        <th scope="col">利息累計</th>
                        <th scope="col">当年利息</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlySnapshots.map((row) => (
                        <tr key={row.year}>
                          <td>{row.year}</td>
                          <td>{row.balance.toLocaleString("ja-JP")}</td>
                          <td>{row.principalTotal.toLocaleString("ja-JP")}</td>
                          <td>{row.interestTotal.toLocaleString("ja-JP")}</td>
                          <td>{row.yearlyInterest.toLocaleString("ja-JP")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          isInputReady &&
          !validationError && (
            <div className="ci-empty-state" aria-live="polite">
              運用条件を入力すると計算結果が表示されます
            </div>
          )
        )}

        <TipsCard
          sections={[
            {
              title: "複利の仕組み",
              items: [
                "複利とは、元本に加えて利息にも利息がつく計算方式です。「利息の利息」が積み重なるため、長期運用ほど効果が大きくなります。",
                "複利計算頻度が高いほど（毎年 → 半年 → 四半期 → 毎月）、わずかに最終残高が増えます。これを「複利の頻度効果」と呼びます。",
                "「72の法則」: 元本が2倍になる年数 ≈ 72 ÷ 年利率（例: 年利6%なら約12年）",
              ],
            },
            {
              title: "活用例",
              items: [
                "元本 100 万円、年利 5%、10 年、追加積立なし → 最終残高 約 163 万円（毎月複利）",
                "元本 100 万円、年利 5%、20 年、追加積立なし → 最終残高 約 271 万円（毎月複利）",
                "元本 0 円、年利 5%、20 年、毎月 3 万円積立 → 最終残高 約 1,233 万円",
                "NISA・iDeCoなどの非課税投資枠を活用すると、複利効果をさらに高められます。",
              ],
            },
            {
              title: "注意事項",
              items: [
                "計算は概算です。税金（20.315%）・手数料・為替変動などは考慮していません。",
                "投資には元本割れのリスクがあります。本ツールは教育・参考目的であり、投資助言ではありません。",
                "追加積立金は複利計算頻度と同じ間隔で一定額を積み立てる前提で計算しています。",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
