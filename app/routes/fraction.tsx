import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/fraction")({
  head: () => ({
    meta: [
      { title: "分数変換 | Web ツール集" },
      {
        name: "description",
        content:
          "小数と分数を相互変換するオンラインツール。0.75→3/4、0.333…→1/3のような変換に対応。最大公約数による自動約分、帯分数表示も可能。",
      },
      { property: "og:title", content: "分数変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "小数と分数を相互変換するオンラインツール。0.75→3/4、0.333…→1/3のような変換に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/fraction` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "分数変換 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "小数と分数を相互変換するオンラインツール。0.75→3/4、0.333…→1/3のような変換に対応。",
      },
    ],
  }),
  component: FractionConverter,
});

/** よく使う分数の一覧 */
const COMMON_FRACTIONS = [
  { num: 1, den: 2 },
  { num: 1, den: 3 },
  { num: 2, den: 3 },
  { num: 1, den: 4 },
  { num: 3, den: 4 },
  { num: 1, den: 5 },
  { num: 2, den: 5 },
  { num: 3, den: 5 },
  { num: 4, den: 5 },
  { num: 1, den: 6 },
  { num: 5, den: 6 },
  { num: 1, den: 8 },
  { num: 3, den: 8 },
  { num: 5, den: 8 },
  { num: 7, den: 8 },
  { num: 1, den: 10 },
  { num: 3, den: 10 },
  { num: 7, den: 10 },
  { num: 9, den: 10 },
];

/**
 * 最大公約数を求める（ユークリッドの互除法）
 * @param a 整数
 * @param b 整数
 * @returns 最大公約数
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * 分数を約分する
 * @param numerator 分子
 * @param denominator 分母（0以外）
 * @returns 約分後の { numerator, denominator }
 */
export function simplifyFraction(
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } {
  if (denominator === 0) throw new Error("分母は0にできません");
  const sign = numerator < 0 !== denominator < 0 ? -1 : 1;
  const absNum = Math.abs(numerator);
  const absDen = Math.abs(denominator);
  const g = gcd(absNum, absDen);
  return { numerator: sign * (absNum / g), denominator: absDen / g };
}

/**
 * 仮分数を帯分数に変換する
 * @param numerator 分子
 * @param denominator 分母
 * @returns 帯分数 { whole, numerator, denominator } または null（真分数の場合）
 */
export function toMixedNumber(
  numerator: number,
  denominator: number,
): { whole: number; numerator: number; denominator: number } | null {
  if (denominator === 0) return null;
  const simplified = simplifyFraction(numerator, denominator);
  const absNum = Math.abs(simplified.numerator);
  const absDen = simplified.denominator;
  if (absNum < absDen) return null;
  const whole = Math.floor(absNum / absDen);
  const remainder = absNum % absDen;
  const sign = simplified.numerator < 0 ? -1 : 1;
  return {
    whole: sign * whole,
    numerator: remainder,
    denominator: absDen,
  };
}

/**
 * 小数を分数に変換する（連分数近似）
 * @param decimal 変換する小数
 * @param maxDenominator 分母の最大値（デフォルト: 10000）
 * @returns { numerator, denominator }
 */
export function decimalToFraction(
  decimal: number,
  maxDenominator: number = 10000,
): { numerator: number; denominator: number } {
  if (!isFinite(decimal)) throw new Error("有効な数値を入力してください");
  const sign = decimal < 0 ? -1 : 1;
  const abs = Math.abs(decimal);

  if (Number.isInteger(abs)) {
    return { numerator: sign * abs, denominator: 1 };
  }

  // 連分数展開による近似
  let h1 = 1,
    h2 = 0,
    k1 = 0,
    k2 = 1;
  let b = abs;

  for (let i = 0; i < 64; i++) {
    const a = Math.floor(b);
    const newH = a * h1 + h2;
    const newK = a * k1 + k2;
    h2 = h1;
    h1 = newH;
    k2 = k1;
    k1 = newK;

    if (k1 > maxDenominator) {
      return { numerator: sign * h2, denominator: k2 };
    }

    if (Math.abs(abs - h1 / k1) < 1e-10) break;

    const remainder = b - a;
    if (remainder < 1e-15) break;
    b = 1 / remainder;
  }

  return { numerator: sign * h1, denominator: k1 };
}

/**
 * 分数を小数に変換する
 * @param numerator 分子
 * @param denominator 分母（0以外）
 * @param precision 小数点以下の桁数（デフォルト: 10）
 * @returns 小数の文字列表現
 */
export function fractionToDecimal(
  numerator: number,
  denominator: number,
  precision: number = 10,
): string {
  if (denominator === 0) throw new Error("分母は0にできません");
  const result = numerator / denominator;
  if (Number.isInteger(result)) return result.toString();
  return parseFloat(result.toFixed(precision)).toString();
}

/** 分数変換コンポーネント */
function FractionConverter() {
  const [decimalInput, setDecimalInput] = useState("");
  const [fractionResult, setFractionResult] = useState<{
    numerator: number;
    denominator: number;
  } | null>(null);

  const [numInput, setNumInput] = useState("");
  const [denInput, setDenInput] = useState("");
  const [decimalResult, setDecimalResult] = useState<string | null>(null);

  const decimalRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleDecimalToFraction = useCallback(() => {
    const val = decimalInput.trim();
    if (!val) {
      showToast("数値を入力してください", "error");
      announceStatus("エラー: 数値を入力してください");
      decimalRef.current?.focus();
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      showToast("有効な数値を入力してください", "error");
      announceStatus("エラー: 有効な数値を入力してください");
      return;
    }
    try {
      const raw = decimalToFraction(num);
      const result = simplifyFraction(raw.numerator, raw.denominator);
      setFractionResult(result);
      announceStatus(`変換完了: ${result.numerator}/${result.denominator}`);
    } catch {
      showToast("変換に失敗しました", "error");
      announceStatus("エラー: 変換に失敗しました");
    }
  }, [decimalInput, showToast, announceStatus]);

  const handleFractionToDecimal = useCallback(() => {
    const num = parseInt(numInput, 10);
    const den = parseInt(denInput, 10);
    if (numInput.trim() === "" || isNaN(num)) {
      showToast("分子を入力してください", "error");
      announceStatus("エラー: 分子を入力してください");
      return;
    }
    if (denInput.trim() === "" || isNaN(den)) {
      showToast("分母を入力してください", "error");
      announceStatus("エラー: 分母を入力してください");
      return;
    }
    if (den === 0) {
      showToast("分母は0にできません", "error");
      announceStatus("エラー: 分母は0にできません");
      return;
    }
    try {
      const result = fractionToDecimal(num, den);
      setDecimalResult(result);
      announceStatus(`変換完了: ${result}`);
    } catch {
      showToast("変換に失敗しました", "error");
      announceStatus("エラー: 変換に失敗しました");
    }
  }, [numInput, denInput, showToast, announceStatus]);

  const handleClearDecimal = useCallback(() => {
    setDecimalInput("");
    setFractionResult(null);
    announceStatus("入力と結果をクリアしました");
    decimalRef.current?.focus();
  }, [announceStatus]);

  const handleClearFraction = useCallback(() => {
    setNumInput("");
    setDenInput("");
    setDecimalResult(null);
    announceStatus("入力と結果をクリアしました");
  }, [announceStatus]);

  useKeyboardShortcut("Enter", handleDecimalToFraction, { ctrl: true });

  useEffect(() => {
    decimalRef.current?.focus();
  }, []);

  const mixed = fractionResult
    ? toMixedNumber(fractionResult.numerator, fractionResult.denominator)
    : null;

  return (
    <>
      <div className="fraction-container">
        {/* 小数 → 分数 */}
        <section className="fraction-section" aria-labelledby="decimal-to-fraction-heading">
          <h2 id="decimal-to-fraction-heading" className="fraction-section-title">
            小数 → 分数
          </h2>
          <form onSubmit={(e) => e.preventDefault()} aria-label="小数から分数への変換フォーム">
            <div className="fraction-input-row">
              <input
                id="decimal-input"
                ref={decimalRef}
                type="text"
                className="fraction-input"
                value={decimalInput}
                onChange={(e) => setDecimalInput(e.target.value)}
                placeholder="例: 0.75, 0.333, 1.5"
                aria-label="小数値の入力欄"
                inputMode="decimal"
              />
              <Button
                type="button"
                className="btn-primary"
                onClick={handleDecimalToFraction}
                aria-label="小数を分数に変換"
              >
                変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearDecimal}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>

            {fractionResult && (
              <div className="fraction-result" aria-live="polite" aria-label="変換結果">
                <div className="fraction-result-main">
                  <span className="fraction-result-label">分数:</span>
                  <span
                    className="fraction-visual"
                    aria-label={`${fractionResult.numerator} 分の ${fractionResult.denominator}`}
                  >
                    <span className="fraction-visual-numerator">{fractionResult.numerator}</span>
                    <span className="fraction-visual-denominator">
                      {fractionResult.denominator}
                    </span>
                  </span>
                </div>
                {mixed && mixed.numerator !== 0 && (
                  <div className="fraction-result-mixed">
                    <span className="fraction-result-label">帯分数:</span>
                    <span className="fraction-mixed-display">
                      {mixed.whole} と {mixed.numerator}/{mixed.denominator}
                    </span>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        {/* 分数 → 小数 */}
        <section className="fraction-section" aria-labelledby="fraction-to-decimal-heading">
          <h2 id="fraction-to-decimal-heading" className="fraction-section-title">
            分数 → 小数
          </h2>
          <form onSubmit={(e) => e.preventDefault()} aria-label="分数から小数への変換フォーム">
            <div className="fraction-input-row">
              <input
                id="numerator-input"
                type="number"
                className="fraction-input fraction-input-narrow"
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                placeholder="分子"
                aria-label="分子の入力欄"
              />
              <span className="fraction-slash" aria-hidden="true">
                /
              </span>
              <input
                id="denominator-input"
                type="number"
                className="fraction-input fraction-input-narrow"
                value={denInput}
                onChange={(e) => setDenInput(e.target.value)}
                placeholder="分母"
                aria-label="分母の入力欄"
              />
              <Button
                type="button"
                className="btn-primary"
                onClick={handleFractionToDecimal}
                aria-label="分数を小数に変換"
              >
                変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearFraction}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>

            {decimalResult !== null && (
              <div className="fraction-result" aria-live="polite" aria-label="変換結果">
                <div className="fraction-result-main">
                  <span className="fraction-result-label">小数:</span>
                  <span className="fraction-result-value">{decimalResult}</span>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* よく使う分数 */}
        <section className="fraction-reference-section" aria-labelledby="common-fractions-heading">
          <h2 id="common-fractions-heading" className="fraction-section-title">
            よく使う分数
          </h2>
          <div className="fraction-table-wrapper">
            <table className="fraction-table" aria-label="よく使う分数と小数の対応表">
              <thead>
                <tr>
                  <th scope="col">分数</th>
                  <th scope="col">小数</th>
                  <th scope="col">パーセント</th>
                </tr>
              </thead>
              <tbody>
                {COMMON_FRACTIONS.map(({ num, den }) => (
                  <tr key={`${num}/${den}`}>
                    <td className="fraction-table-frac">
                      {num}/{den}
                    </td>
                    <td className="fraction-table-decimal">
                      {parseFloat((num / den).toFixed(10)).toString()}
                    </td>
                    <td className="fraction-table-percent">
                      {parseFloat(((num / den) * 100).toFixed(6)).toString()}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「小数 → 分数」: 小数値を入力して「変換」ボタンをクリック",
                "「分数 → 小数」: 分子・分母を入力して「変換」ボタンをクリック",
                "Ctrl+Enter でも小数→分数の変換を実行できます",
              ],
            },
            {
              title: "変換例",
              items: [
                "0.5 → 1/2",
                "0.75 → 3/4",
                "0.333... → 1/3（近似値）",
                "1.5 → 3/2（帯分数: 1 と 1/2）",
                "3/4 → 0.75",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
