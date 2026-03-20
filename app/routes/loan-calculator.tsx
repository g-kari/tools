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
  calcLoan,
  validateLoanParams,
  formatYen,
  type RepaymentType,
  type PaymentSchedule,
} from "~/utils/loan";

export const Route = createFileRoute("/loan-calculator")({
  head: () => ({
    meta: [
      { title: "ローン計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "住宅ローン・カーローン・教育ローンなどの月々返済額・総返済額・総利息を計算。元利均等返済・元金均等返済に対応した返済シミュレーター。",
      },
      {
        property: "og:title",
        content: "ローン計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "月々返済額・総返済額・総利息を計算。元利均等・元金均等返済に対応したローンシミュレーター。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/loan-calculator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: LoanCalculator,
});

/** 返済表示行の最大数（省略表示用） */
const MAX_VISIBLE_ROWS = 24;

/**
 * ローン計算機ページコンポーネント
 */
function LoanCalculator() {
  const [repaymentType, setRepaymentType] =
    useState<RepaymentType>("equal-payment");
  const [principalStr, setPrincipalStr] = useState("3000");
  const [rateStr, setRateStr] = useState("1.5");
  const [termStr, setTermStr] = useState("35");
  const [showSchedule, setShowSchedule] = useState(false);

  const { showToast } = useToast();
  const { statusRef } = useStatusAnnouncement();

  const params = useMemo(() => {
    const principal = parseFloat(principalStr) * 10000;
    const annualRate = parseFloat(rateStr);
    const termYears = parseInt(termStr, 10);
    return { principal, annualRate, termYears, type: repaymentType };
  }, [principalStr, rateStr, termStr, repaymentType]);

  const validationError = useMemo(
    () => validateLoanParams(params),
    [params]
  );

  const result = useMemo(() => {
    if (validationError) return null;
    return calcLoan(params);
  }, [params, validationError]);

  const principalRatio = useMemo(() => {
    if (!result) return 0;
    return (params.principal / result.totalPayment) * 100;
  }, [result, params.principal]);

  const handleCopy = useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label}をコピーしました`, "success");
      });
    },
    [showToast]
  );

  /** 返済スケジュールの表示行（長い場合は省略） */
  const visibleSchedule = useMemo((): (PaymentSchedule | "omit")[] => {
    if (!result) return [];
    const { schedule } = result;
    if (schedule.length <= MAX_VISIBLE_ROWS) return schedule;
    const head = schedule.slice(0, 12);
    const tail = schedule.slice(-12);
    return [...head, "omit", ...tail];
  }, [result]);

  const isInputReady =
    principalStr !== "" && rateStr !== "" && termStr !== "";

  return (
    <>
      <h1 className="page-title">ローン計算機</h1>
      <p className="page-description">
        住宅・車・教育などのローン返済額をシミュレーション。月々の返済額・総返済額・総利息を計算します。
      </p>

      <div className="tool-container">
        {/* 返済方式タブ */}
        <div
          className="loan-type-tabs"
          role="tablist"
          aria-label="返済方式選択"
        >
          <button
            className={`loan-type-btn${repaymentType === "equal-payment" ? " active" : ""}`}
            role="tab"
            aria-selected={repaymentType === "equal-payment"}
            onClick={() => setRepaymentType("equal-payment")}
          >
            元利均等返済
          </button>
          <button
            className={`loan-type-btn${repaymentType === "equal-principal" ? " active" : ""}`}
            role="tab"
            aria-selected={repaymentType === "equal-principal"}
            onClick={() => setRepaymentType("equal-principal")}
          >
            元金均等返済
          </button>
        </div>

        {/* 入力フォーム */}
        <div className="loan-form">
          <div className="loan-input-group">
            <label htmlFor="loan-principal">借入金額</label>
            <div className="loan-input-row">
              <input
                id="loan-principal"
                type="number"
                min="1"
                step="100"
                value={principalStr}
                onChange={(e) => setPrincipalStr(e.target.value)}
                placeholder="例: 3000"
                aria-label="借入金額（万円）"
              />
              <span className="loan-input-unit">万円</span>
            </div>
          </div>

          <div className="loan-input-group">
            <label htmlFor="loan-rate">年利率</label>
            <div className="loan-input-row">
              <input
                id="loan-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                placeholder="例: 1.5"
                aria-label="年利率（%）"
              />
              <span className="loan-input-unit">%</span>
            </div>
          </div>

          <div className="loan-input-group">
            <label htmlFor="loan-term">返済期間</label>
            <div className="loan-input-row">
              <input
                id="loan-term"
                type="number"
                min="1"
                max="50"
                step="1"
                value={termStr}
                onChange={(e) => setTermStr(e.target.value)}
                placeholder="例: 35"
                aria-label="返済期間（年）"
              />
              <span className="loan-input-unit">
                年（{isNaN(parseInt(termStr)) ? 0 : parseInt(termStr) * 12} ヶ月）
              </span>
            </div>
          </div>

          {validationError && isInputReady && (
            <div className="loan-error" role="alert">
              {validationError}
            </div>
          )}
        </div>

        {/* 計算結果 */}
        {result ? (
          <>
            <div
              className="loan-summary"
              aria-live="polite"
              aria-label="計算結果"
            >
              <div className="loan-summary-card primary">
                <span className="loan-summary-label">
                  {repaymentType === "equal-payment"
                    ? "月々の返済額"
                    : "初回月々返済額"}
                </span>
                <span
                  className="loan-summary-value"
                  aria-label={`月々の返済額 ${formatYen(result.monthlyPayment)}`}
                >
                  {result.monthlyPayment.toLocaleString("ja-JP")}
                </span>
                <span className="loan-summary-sub">円 / 月</span>
              </div>

              <div className="loan-summary-card">
                <span className="loan-summary-label">総返済額</span>
                <span
                  className="loan-summary-value"
                  aria-label={`総返済額 ${formatYen(result.totalPayment)}`}
                >
                  {Math.round(result.totalPayment / 10000).toLocaleString(
                    "ja-JP"
                  )}
                </span>
                <span className="loan-summary-sub">
                  万円（{formatYen(result.totalPayment)}）
                </span>
              </div>

              <div className="loan-summary-card">
                <span className="loan-summary-label">総利息</span>
                <span
                  className="loan-summary-value"
                  aria-label={`総利息 ${formatYen(result.totalInterest)}`}
                >
                  {Math.round(result.totalInterest / 10000).toLocaleString(
                    "ja-JP"
                  )}
                </span>
                <span className="loan-summary-sub">
                  万円（{formatYen(result.totalInterest)}）
                </span>
              </div>
            </div>

            {/* 元金/利息比率バー */}
            <div className="loan-ratio-bar" aria-label="元金・利息の割合">
              <div className="loan-ratio-bar-label">
                <span>
                  元金 {principalRatio.toFixed(1)}%（
                  {Math.round(params.principal / 10000).toLocaleString("ja-JP")}{" "}
                  万円）
                </span>
                <span>
                  利息 {(100 - principalRatio).toFixed(1)}%（
                  {Math.round(result.totalInterest / 10000).toLocaleString(
                    "ja-JP"
                  )}{" "}
                  万円）
                </span>
              </div>
              <div
                className="loan-ratio-track"
                role="img"
                aria-label={`元金 ${principalRatio.toFixed(1)}%、利息 ${(100 - principalRatio).toFixed(1)}%`}
                style={
                  {
                    "--loan-principal-ratio": `${principalRatio}%`,
                    "--loan-interest-ratio": `${100 - principalRatio}%`,
                  } as React.CSSProperties
                }
              >
                <span className="loan-ratio-fill-principal" />
                <span className="loan-ratio-fill-interest" />
              </div>
            </div>

            {/* コピーボタン */}
            <div className="loan-copy-actions">
              <button
                className="loan-schedule-toggle"
                onClick={() =>
                  handleCopy(
                    `月々返済額: ${formatYen(result.monthlyPayment)}\n総返済額: ${formatYen(result.totalPayment)}\n総利息: ${formatYen(result.totalInterest)}`,
                    "計算結果"
                  )
                }
                aria-label="計算結果をクリップボードにコピー"
              >
                📋 結果をコピー
              </button>
            </div>

            {/* 返済スケジュール表 */}
            <div className="loan-schedule-section">
              <button
                className="loan-schedule-toggle"
                onClick={() => setShowSchedule((v) => !v)}
                aria-expanded={showSchedule}
                aria-controls="loan-schedule-table"
              >
                {showSchedule ? "▲" : "▼"} 返済スケジュール（
                {params.termYears * 12} ヶ月分）
              </button>

              {showSchedule && (
                <div
                  id="loan-schedule-table"
                  className="loan-schedule-table-wrapper"
                  role="region"
                  aria-label="月次返済スケジュール"
                >
                  <table className="loan-schedule-table">
                    <thead>
                      <tr>
                        <th scope="col">月</th>
                        <th scope="col">返済額</th>
                        <th scope="col">うち元金</th>
                        <th scope="col">うち利息</th>
                        <th scope="col">残高</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSchedule.map((row, idx) =>
                        row === "omit" ? (
                          <tr key="omit">
                            <td colSpan={5} className="loan-schedule-omit">
                              …（中略）…
                            </td>
                          </tr>
                        ) : (
                          <tr key={idx}>
                            <td>{row.month}</td>
                            <td>
                              {row.payment.toLocaleString("ja-JP")}
                            </td>
                            <td>
                              {row.principalPart.toLocaleString("ja-JP")}
                            </td>
                            <td>
                              {row.interestPart.toLocaleString("ja-JP")}
                            </td>
                            <td>
                              {row.balance.toLocaleString("ja-JP")}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          isInputReady &&
          !validationError && (
            <div className="loan-empty-state" aria-live="polite">
              借入条件を入力すると計算結果が表示されます
            </div>
          )
        )}

        <TipsCard
          sections={[
            {
              title: "返済方式の違い",
              items: [
                "元利均等返済：毎月の返済額が一定。住宅ローンで最も一般的な方式。計算が分かりやすく資金計画が立てやすい。",
                "元金均等返済：毎月の元金返済額が一定。返済初期は負担が大きいが、総利息は元利均等より少なくなる。",
              ],
            },
            {
              title: "活用例",
              items: [
                "住宅ローン: 借入 3,000 万円、年利 1.5%、35 年返済 → 月々約 9.1 万円",
                "カーローン: 借入 200 万円、年利 3%、5 年返済 → 月々約 3.6 万円",
                "教育ローン: 借入 100 万円、年利 2%、10 年返済 → 月々約 9,200 円",
                "年利 0% の場合: 元本のみを均等分割した返済額を算出します",
              ],
            },
            {
              title: "注意事項",
              items: [
                "計算は概算です。実際のローンでは保証料・手数料・団体信用生命保険料などが加算されます。",
                "変動金利ローンは将来の金利変動によって返済額が変わります。固定金利でシミュレーションすることをお勧めします。",
                "繰り上げ返済（期間短縮型・返済額軽減型）の効果は本ツールでは計算していません。",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
