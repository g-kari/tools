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
  TAX_RATES,
  TAX_RATE_LABELS,
  type TaxRate,
  calcTaxIncluded,
  calcTaxAmount,
  calcTaxExcluded,
  calcTaxAmountFromIncluded,
  formatYen,
} from "~/utils/tax-calculator";

export const Route = createFileRoute("/tax-calculator")({
  head: () => ({
    meta: [
      { title: "消費税計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "税抜→税込・税込→税抜の消費税計算ツール。8%（軽減税率）・10%（標準税率）に対応。",
      },
      {
        property: "og:title",
        content: "消費税計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "税抜→税込・税込→税抜の消費税計算ツール。8%（軽減税率）・10%（標準税率）に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tax-calculator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TaxCalculator,
});

/** 計算モード */
type Mode = "exclusive" | "inclusive";

/**
 * 消費税計算機ページコンポーネント
 */
function TaxCalculator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>("exclusive");
  const [price, setPrice] = useState("");
  const [taxRate, setTaxRate] = useState<TaxRate>(10);

  const result = useMemo(() => {
    if (!price) return null;
    const n = parseFloat(price.replace(/,/g, ""));
    if (isNaN(n) || n < 0) return null;

    if (mode === "exclusive") {
      const taxAmount = calcTaxAmount(n, taxRate);
      const included = calcTaxIncluded(n, taxRate);
      return {
        base: n,
        tax: taxAmount,
        total: included,
      };
    } else {
      const excluded = calcTaxExcluded(n, taxRate);
      const taxAmount = calcTaxAmountFromIncluded(n, taxRate);
      return {
        base: excluded,
        tax: taxAmount,
        total: n,
      };
    }
  }, [price, mode, taxRate]);

  const handleCopy = useCallback(
    async (value: number, label: string) => {
      const success = await copy(Math.round(value).toString());
      if (success) {
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  const tabs: { mode: Mode; label: string }[] = [
    { mode: "exclusive", label: "税抜 → 税込" },
    { mode: "inclusive", label: "税込 → 税抜" },
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

        <div className="tax-form">
          <div className="tax-input-group">
            <label htmlFor="tax-price" className="tax-label">
              {mode === "exclusive" ? "税抜価格" : "税込価格"}
            </label>
            <div className="tax-input-wrapper">
              <input
                id="tax-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="例: 1000"
                aria-label={mode === "exclusive" ? "税抜価格を入力" : "税込価格を入力"}
                className="tax-price-input"
                min="0"
              />
              <span className="tax-unit">円</span>
            </div>
          </div>

          <fieldset className="tax-rate-fieldset">
            <legend className="tax-label">税率</legend>
            <div className="tax-rate-options">
              {TAX_RATES.map((rate) => (
                <label key={rate} className="tax-rate-option">
                  <input
                    type="radio"
                    name="tax-rate"
                    value={rate}
                    checked={taxRate === rate}
                    onChange={() => setTaxRate(rate)}
                    aria-label={TAX_RATE_LABELS[rate]}
                  />
                  <span className="tax-rate-badge">{rate}%</span>
                  <span className="tax-rate-desc">{TAX_RATE_LABELS[rate]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {result ? (
            <div className="tax-result-section" aria-live="polite">
              <div className="tax-result-grid">
                <div className="tax-result-card">
                  <span className="tax-result-card-label">税抜価格</span>
                  <div className="tax-result-card-value">
                    {formatYen(Math.round(result.base))}
                    <span className="tax-result-unit">円</span>
                  </div>
                  <button
                    className="tax-result-copy-btn"
                    onClick={() => handleCopy(result.base, "税抜価格")}
                    aria-label="税抜価格をコピー"
                  >
                    コピー
                  </button>
                </div>

                <div className="tax-result-card tax-amount-card">
                  <span className="tax-result-card-label">消費税額（{taxRate}%）</span>
                  <div className="tax-result-card-value">
                    {formatYen(Math.round(result.tax))}
                    <span className="tax-result-unit">円</span>
                  </div>
                  <button
                    className="tax-result-copy-btn"
                    onClick={() => handleCopy(result.tax, "消費税額")}
                    aria-label="消費税額をコピー"
                  >
                    コピー
                  </button>
                </div>

                <div className="tax-result-card tax-total-card">
                  <span className="tax-result-card-label">税込価格</span>
                  <div className="tax-result-card-value">
                    {formatYen(Math.round(result.total))}
                    <span className="tax-result-unit">円</span>
                  </div>
                  <button
                    className="tax-result-copy-btn"
                    onClick={() => handleCopy(result.total, "税込価格")}
                    aria-label="税込価格をコピー"
                  >
                    コピー
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="percentage-empty-state" aria-live="polite">
              価格を入力すると消費税が計算されます
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "消費税について",
              items: [
                "標準税率 10%: 一般的な商品・サービスに適用",
                "軽減税率 8%: 食料品（酒類・外食を除く）・週2回以上発行される定期購読の新聞に適用",
                "税抜価格 × (1 + 税率) = 税込価格",
                "税込価格 ÷ (1 + 税率) = 税抜価格（小数点以下は四捨五入）",
              ],
            },
            {
              title: "計算例",
              items: [
                "スーパーの食料品 1,000円（8%）→ 税額: 80円, 税込: 1,080円",
                "レストランでの食事 2,000円（10%）→ 税額: 200円, 税込: 2,200円",
                "税込1,100円の商品の税抜価格（10%）→ 1,000円",
                "税込2,160円の食料品の税抜価格（8%）→ 2,000円",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
