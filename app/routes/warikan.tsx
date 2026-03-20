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
  calcWarikan,
  formatYenWarikan,
} from "~/utils/warikan";

export const Route = createFileRoute("/warikan")({
  head: () => ({
    meta: [
      { title: "割り勘計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "飲み会・食事の割り勘を簡単に計算。人数・合計金額・チップ率を入力するだけで一人あたりの金額を算出。",
      },
      {
        property: "og:title",
        content: "割り勘計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "飲み会・食事の割り勘を簡単に計算。人数・合計金額・チップ率を入力するだけで一人あたりの金額を算出。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/warikan` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: WarikanCalculator,
});

/**
 * 割り勘計算機ページコンポーネント
 */
function WarikanCalculator() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [totalAmount, setTotalAmount] = useState("");
  const [people, setPeople] = useState("2");
  const [tipRate, setTipRate] = useState("0");

  const result = useMemo(() => {
    const total = parseFloat(totalAmount.replace(/,/g, ""));
    const n = parseInt(people, 10);
    const tip = parseFloat(tipRate);

    if (
      isNaN(total) ||
      total < 0 ||
      isNaN(n) ||
      n < 2 ||
      isNaN(tip) ||
      tip < 0
    ) {
      return null;
    }

    return calcWarikan({ totalAmount: total, people: n, tipRate: tip });
  }, [totalAmount, people, tipRate]);

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

  const peopleCount = parseInt(people, 10);

  return (
    <>
      <div className="tool-container">
        <div className="warikan-form">
          <div className="warikan-fields">
            <div className="warikan-field">
              <label htmlFor="warikan-total" className="warikan-label">
                合計金額
              </label>
              <div className="warikan-input-wrapper">
                <input
                  id="warikan-total"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="例: 15000"
                  aria-label="合計金額を入力"
                  className="warikan-input"
                  min="0"
                />
                <span className="warikan-unit">円</span>
              </div>
            </div>

            <div className="warikan-field">
              <label htmlFor="warikan-people" className="warikan-label">
                人数
              </label>
              <div className="warikan-input-wrapper">
                <input
                  id="warikan-people"
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  placeholder="例: 4"
                  aria-label="人数を入力"
                  className="warikan-input"
                  min="2"
                  max="100"
                />
                <span className="warikan-unit">人</span>
              </div>
            </div>

            <div className="warikan-field">
              <label htmlFor="warikan-tip" className="warikan-label">
                チップ率（省略可）
              </label>
              <div className="warikan-input-wrapper">
                <input
                  id="warikan-tip"
                  type="number"
                  value={tipRate}
                  onChange={(e) => setTipRate(e.target.value)}
                  placeholder="例: 10"
                  aria-label="チップ率を入力"
                  className="warikan-input"
                  min="0"
                  max="100"
                />
                <span className="warikan-unit">%</span>
              </div>
            </div>
          </div>

          {result ? (
            <div className="warikan-result-section" aria-live="polite">
              <div className="warikan-result-main">
                <span className="warikan-result-main-label">
                  一人あたり（切り上げ）
                </span>
                <div className="warikan-result-main-value">
                  {formatYenWarikan(result.perPersonCeil)}
                  <span className="warikan-result-main-unit">円</span>
                </div>
                {result.remainder > 0 && (
                  <span className="warikan-result-sub-note">
                    ※ {peopleCount - 1}人が {formatYenWarikan(result.perPersonCeil)}円、
                    1人が {formatYenWarikan(result.perPersonCeil - result.remainder)}円
                  </span>
                )}
                <button
                  className="warikan-main-copy-btn"
                  onClick={() =>
                    handleCopy(result.perPersonCeil, "一人あたり金額（切り上げ）")
                  }
                  aria-label="一人あたり金額をコピー"
                >
                  コピー
                </button>
              </div>

              <div className="warikan-result-grid">
                <div className="warikan-result-card">
                  <span className="warikan-result-card-label">
                    一人あたり（切り捨て）
                  </span>
                  <div className="warikan-result-card-value">
                    {formatYenWarikan(result.perPersonFloor)}
                    <span className="warikan-result-card-unit">円</span>
                  </div>
                  <button
                    className="warikan-result-copy-btn"
                    onClick={() =>
                      handleCopy(result.perPersonFloor, "一人あたり金額（切り捨て）")
                    }
                    aria-label="一人あたり金額（切り捨て）をコピー"
                  >
                    コピー
                  </button>
                </div>

                <div className="warikan-result-card">
                  <span className="warikan-result-card-label">合計金額</span>
                  <div className="warikan-result-card-value">
                    {formatYenWarikan(result.grandTotal)}
                    <span className="warikan-result-card-unit">円</span>
                  </div>
                  <button
                    className="warikan-result-copy-btn"
                    onClick={() => handleCopy(result.grandTotal, "合計金額")}
                    aria-label="合計金額をコピー"
                  >
                    コピー
                  </button>
                </div>

                {result.tipAmount > 0 && (
                  <div className="warikan-result-card">
                    <span className="warikan-result-card-label">
                      チップ額（{tipRate}%）
                    </span>
                    <div className="warikan-result-card-value">
                      {formatYenWarikan(result.tipAmount)}
                      <span className="warikan-result-card-unit">円</span>
                    </div>
                    <button
                      className="warikan-result-copy-btn"
                      onClick={() =>
                        handleCopy(result.tipAmount, "チップ額")
                      }
                      aria-label="チップ額をコピー"
                    >
                      コピー
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="percentage-empty-state" aria-live="polite">
              合計金額と人数を入力すると割り勘が計算されます
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "割り勘の計算方法",
              items: [
                "一人あたり（切り上げ）: 小数点以下を切り上げて全員に公平に割り振り",
                "一人あたり（切り捨て）: 小数点以下を切り捨て。端数は幹事が払うケースに",
                "チップ率: 海外での食事など、チップが必要な場合に入力",
                "計算式: 合計 × (1 + チップ率) ÷ 人数",
              ],
            },
            {
              title: "使用例",
              items: [
                "4人で15,000円の食事 → 一人あたり3,750円",
                "5人で13,000円の飲み会 → 一人あたり2,600円（切り上げ）",
                "3人で10,000円・チップ10% → 合計11,000円、一人あたり3,667円",
                "6人で20,000円 → 一人あたり3,334円（切り上げ）・端数1円は1人が3,333円",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
