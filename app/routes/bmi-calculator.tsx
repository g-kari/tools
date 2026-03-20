import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  calcBmi,
  calcIdealWeight,
  calcWeightDiff,
  getBmiCategory,
  BMI_CATEGORY_LABELS,
} from "~/utils/bmi";

export const Route = createFileRoute("/bmi-calculator")({
  head: () => ({
    meta: [
      { title: "BMI計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "身長と体重からBMI（体格指数）を計算。WHO基準による肥満度判定・標準体重との差分を表示。",
      },
      {
        property: "og:title",
        content: "BMI計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "身長と体重からBMI（体格指数）を計算。WHO基準による肥満度判定・標準体重との差分を表示。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/bmi-calculator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: BmiCalculator,
});

/**
 * BMI計算機ページコンポーネント
 */
function BmiCalculator() {
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const result = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;

    const bmi = calcBmi(w, h);
    if (!isFinite(bmi)) return null;

    const category = getBmiCategory(bmi);
    const idealWeight = calcIdealWeight(h);
    const weightDiff = calcWeightDiff(w, h);

    return { bmi, category, idealWeight, weightDiff };
  }, [height, weight]);

  const categoryBadgeClass = (category: string) => {
    if (category === "underweight") return "bmi-category-badge--underweight";
    if (category === "normal") return "bmi-category-badge--normal";
    if (category === "overweight") return "bmi-category-badge--overweight";
    return "bmi-category-badge--obese";
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(e.target.value);
    if (result) announceStatus("BMIを再計算しました");
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeight(e.target.value);
    if (result) announceStatus("BMIを再計算しました");
  };

  return (
    <>
      <div className="tool-container">
        <div className="bmi-form">
          <div className="bmi-input-group">
            <label htmlFor="bmi-height" className="bmi-label">
              身長
            </label>
            <div className="bmi-input-wrapper">
              <input
                id="bmi-height"
                type="number"
                value={height}
                onChange={handleHeightChange}
                placeholder="例: 170"
                aria-label="身長をcm単位で入力"
                className="bmi-number-input"
                min="0"
                max="300"
                step="0.1"
              />
              <span className="bmi-unit">cm</span>
            </div>
          </div>

          <div className="bmi-input-group">
            <label htmlFor="bmi-weight" className="bmi-label">
              体重
            </label>
            <div className="bmi-input-wrapper">
              <input
                id="bmi-weight"
                type="number"
                value={weight}
                onChange={handleWeightChange}
                placeholder="例: 65"
                aria-label="体重をkg単位で入力"
                className="bmi-number-input"
                min="0"
                max="500"
                step="0.1"
              />
              <span className="bmi-unit">kg</span>
            </div>
          </div>

          {result ? (
            <div className="bmi-result-section" aria-live="polite">
              <div className="bmi-result-grid">
                <div className="bmi-result-card bmi-result-card--primary">
                  <span className="bmi-result-label">BMI</span>
                  <div className="bmi-result-value">
                    {result.bmi.toFixed(1)}
                  </div>
                  <span
                    className={`bmi-category-badge ${categoryBadgeClass(result.category)}`}
                  >
                    {BMI_CATEGORY_LABELS[result.category]}
                  </span>
                </div>

                <div className="bmi-result-card bmi-result-card--secondary">
                  <span className="bmi-result-label">標準体重（BMI=22）</span>
                  <div className="bmi-result-value">
                    {result.idealWeight.toFixed(1)}
                    <span className="bmi-result-unit-text"> kg</span>
                  </div>
                </div>

                <div className="bmi-result-card">
                  <span className="bmi-result-label">標準体重との差</span>
                  <div
                    className={`bmi-result-value ${result.weightDiff > 0 ? "bmi-weight-diff--positive" : result.weightDiff < 0 ? "bmi-weight-diff--negative" : ""}`}
                  >
                    {result.weightDiff > 0 ? "+" : ""}
                    {result.weightDiff.toFixed(1)}
                    <span className="bmi-result-unit-text"> kg</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="percentage-empty-state" aria-live="polite">
              身長と体重を入力するとBMIが計算されます
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "BMI（体格指数）とは",
              items: [
                "BMI = 体重(kg) ÷ 身長(m)²",
                "WHO（世界保健機関）が定めた国際的な体格指数",
                "18.5未満: 低体重（痩せ型）",
                "18.5〜25未満: 普通体重",
                "25〜30未満: 前肥満",
                "30以上: 肥満（1〜3度）",
              ],
            },
            {
              title: "標準体重について",
              items: [
                "標準体重 = BMI 22 × 身長(m)²",
                "BMI 22が最も生活習慣病のリスクが低いとされる",
                "個人差があるため、あくまでも参考値です",
                "医療診断には医師にご相談ください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
