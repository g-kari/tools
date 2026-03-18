import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/roman-numerals")({
  head: () => ({
    meta: [
      { title: "ローマ数字変換 | Web ツール集" },
      {
        name: "description",
        content:
          "アラビア数字とローマ数字を相互変換するツール。1〜3999の整数に対応。IV・IX・XL・XC・CD・CMなどの減算記法も正しく処理します。",
      },
      { property: "og:title", content: "ローマ数字変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "アラビア数字とローマ数字を相互変換するツール。1〜3999の整数に対応。IV・IX・XL・XC・CD・CMなどの減算記法も正しく処理します。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/roman-numerals` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ローマ数字変換 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "アラビア数字とローマ数字を相互変換するツール。1〜3999の整数に対応。",
      },
    ],
  }),
  component: RomanNumeralsConverter,
});

/** ローマ数字変換テーブル（大きい順） */
const ROMAN_TABLE = [
  { value: 1000, symbol: "M" },
  { value: 900, symbol: "CM" },
  { value: 500, symbol: "D" },
  { value: 400, symbol: "CD" },
  { value: 100, symbol: "C" },
  { value: 90, symbol: "XC" },
  { value: 50, symbol: "L" },
  { value: 40, symbol: "XL" },
  { value: 10, symbol: "X" },
  { value: 9, symbol: "IX" },
  { value: 5, symbol: "V" },
  { value: 4, symbol: "IV" },
  { value: 1, symbol: "I" },
] as const;

/** ローマ数字の基本文字と数値のマッピング */
const ROMAN_CHAR_VALUES: Readonly<Record<string, number>> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

/** 基本記号対照表 */
const REFERENCE_TABLE = [
  { arabic: 1, roman: "I" },
  { arabic: 4, roman: "IV" },
  { arabic: 5, roman: "V" },
  { arabic: 9, roman: "IX" },
  { arabic: 10, roman: "X" },
  { arabic: 40, roman: "XL" },
  { arabic: 50, roman: "L" },
  { arabic: 90, roman: "XC" },
  { arabic: 100, roman: "C" },
  { arabic: 400, roman: "CD" },
  { arabic: 500, roman: "D" },
  { arabic: 900, roman: "CM" },
  { arabic: 1000, roman: "M" },
];

/**
 * アラビア数字をローマ数字に変換する
 * @param num - 変換する整数（1〜3999）
 * @returns ローマ数字文字列、範囲外の場合はnull
 */
export function toRoman(num: number): string | null {
  if (!Number.isInteger(num) || num < 1 || num > 3999) return null;

  let result = "";
  let remaining = num;

  for (const { value, symbol } of ROMAN_TABLE) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
}

/**
 * ローマ数字をアラビア数字に変換する
 * 減算記法（IV・IX・XL・XC・CD・CM）に対応。
 * 変換後に再度ローマ数字に変換して検証する（無効な表記を除外）。
 * @param roman - ローマ数字文字列（大文字・小文字どちらも可）
 * @returns アラビア数字、無効な入力の場合はnull
 */
export function fromRoman(roman: string): number | null {
  if (!roman) return null;
  const upper = roman.trim().toUpperCase();
  if (!upper) return null;
  if (!/^[IVXLCDM]+$/.test(upper)) return null;

  let result = 0;
  for (let i = 0; i < upper.length; i++) {
    const current = ROMAN_CHAR_VALUES[upper[i]];
    const next = ROMAN_CHAR_VALUES[upper[i + 1]];
    if (current === undefined) return null;
    if (next !== undefined && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }

  if (result < 1 || result > 3999) return null;
  // 正規形か検証（例: "IIII" は無効）
  if (toRoman(result) !== upper) return null;

  return result;
}

/**
 * アラビア数字 ↔ ローマ数字変換コンポーネント
 */
function RomanNumeralsConverter() {
  const { showToast } = useToast();
  const [arabicInput, setArabicInput] = useState("");
  const [arabicResult, setArabicResult] = useState("");
  const [romanInput, setRomanInput] = useState("");
  const [romanResult, setRomanResult] = useState("");

  const arabicInputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleArabicToRoman = useCallback(() => {
    const trimmed = arabicInput.trim();
    if (!trimmed) {
      announceStatus("エラー: 数値を入力してください");
      showToast("数値を入力してください", "error");
      arabicInputRef.current?.focus();
      return;
    }
    const num = parseInt(trimmed, 10);
    if (isNaN(num)) {
      announceStatus("エラー: 有効な数値を入力してください");
      showToast("有効な数値を入力してください", "error");
      arabicInputRef.current?.focus();
      return;
    }
    const result = toRoman(num);
    if (result === null) {
      announceStatus("エラー: 1〜3999の整数を入力してください");
      showToast("1〜3999の整数を入力してください", "error");
      arabicInputRef.current?.focus();
      return;
    }
    setArabicResult(result);
    announceStatus(`変換完了: ${result}`);
  }, [arabicInput, announceStatus, showToast]);

  const handleRomanToArabic = useCallback(() => {
    if (!romanInput.trim()) {
      announceStatus("エラー: ローマ数字を入力してください");
      showToast("ローマ数字を入力してください", "error");
      return;
    }
    const result = fromRoman(romanInput);
    if (result === null) {
      announceStatus("エラー: 有効なローマ数字を入力してください（I, V, X, L, C, D, M）");
      showToast("有効なローマ数字を入力してください", "error");
      return;
    }
    setRomanResult(String(result));
    announceStatus(`変換完了: ${result}`);
  }, [romanInput, announceStatus, showToast]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast, announceStatus]
  );

  const handleClearArabic = useCallback(() => {
    setArabicInput("");
    setArabicResult("");
    arabicInputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleClearRoman = useCallback(() => {
    setRomanInput("");
    setRomanResult("");
    announceStatus("クリアしました");
  }, [announceStatus]);

  // Ctrl+Enter でアラビア→ローマ変換
  useKeyboardShortcut("Enter", handleArabicToRoman, { ctrl: true });

  useEffect(() => {
    arabicInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="roman-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="ローマ数字変換フォーム"
        >
          {/* アラビア数字 → ローマ数字 */}
          <section
            className="roman-section"
            aria-labelledby="arabic-to-roman-heading"
          >
            <h2 id="arabic-to-roman-heading" className="section-title">
              アラビア数字 → ローマ数字
            </h2>
            <div className="roman-input-row">
              <label htmlFor="arabic-input" className="sr-only">
                アラビア数字（1〜3999）
              </label>
              <input
                id="arabic-input"
                ref={arabicInputRef}
                type="number"
                className="roman-input"
                value={arabicInput}
                onChange={(e) => setArabicInput(e.target.value)}
                placeholder="例: 2024"
                min="1"
                max="3999"
                aria-label="変換するアラビア数字（1〜3999）"
                aria-describedby="arabic-input-help"
              />
            </div>
            <span id="arabic-input-help" className="sr-only">
              1〜3999の整数を入力してください
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleArabicToRoman}
                aria-label="アラビア数字をローマ数字に変換"
              >
                → ローマ数字に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearArabic}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {arabicResult && (
              <div
                className="roman-result"
                aria-live="polite"
                aria-label="変換結果"
              >
                <span className="roman-result-value">{arabicResult}</span>
                <button
                  type="button"
                  className="roman-copy-button"
                  onClick={() => handleCopy(arabicResult, "ローマ数字")}
                  aria-label={`ローマ数字 ${arabicResult} をコピー`}
                >
                  コピー
                </button>
              </div>
            )}
          </section>

          <div
            className="roman-divider"
            role="separator"
            aria-hidden="true"
          />

          {/* ローマ数字 → アラビア数字 */}
          <section
            className="roman-section"
            aria-labelledby="roman-to-arabic-heading"
          >
            <h2 id="roman-to-arabic-heading" className="section-title">
              ローマ数字 → アラビア数字
            </h2>
            <div className="roman-input-row">
              <label htmlFor="roman-input" className="sr-only">
                ローマ数字
              </label>
              <input
                id="roman-input"
                type="text"
                className="roman-input"
                value={romanInput}
                onChange={(e) =>
                  setRomanInput(e.target.value.toUpperCase())
                }
                placeholder="例: MMXXIV"
                aria-label="変換するローマ数字（I, V, X, L, C, D, M）"
                aria-describedby="roman-input-help"
              />
            </div>
            <span id="roman-input-help" className="sr-only">
              I, V, X, L, C, D, M を使用したローマ数字を入力してください
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleRomanToArabic}
                aria-label="ローマ数字をアラビア数字に変換"
              >
                → アラビア数字に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearRoman}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {romanResult && (
              <div
                className="roman-result"
                aria-live="polite"
                aria-label="変換結果"
              >
                <span className="roman-result-value">{romanResult}</span>
                <button
                  type="button"
                  className="roman-copy-button"
                  onClick={() => handleCopy(romanResult, "数値")}
                  aria-label={`数値 ${romanResult} をコピー`}
                >
                  コピー
                </button>
              </div>
            )}
          </section>
        </form>

        {/* 基本記号対照表 */}
        <section
          className="roman-reference-section"
          aria-labelledby="reference-heading"
        >
          <h2 id="reference-heading" className="section-title">
            基本記号対照表
          </h2>
          <div className="roman-table-wrapper">
            <table className="roman-table" aria-label="ローマ数字基本記号一覧">
              <thead>
                <tr>
                  <th scope="col">記号</th>
                  <th scope="col">数値</th>
                  <th scope="col">備考</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_TABLE.map(({ arabic, roman }) => {
                  const isSubtractive = roman.length === 2;
                  return (
                    <tr key={roman} className={isSubtractive ? "roman-table-row-subtractive" : ""}>
                      <td className="roman-table-symbol">{roman}</td>
                      <td className="roman-table-value">{arabic.toLocaleString()}</td>
                      <td className="roman-table-note">
                        {isSubtractive ? "減算記法" : "基本記号"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「アラビア数字」欄に 1〜3999 の整数を入力して「→ ローマ数字に変換」をクリック",
                "「ローマ数字」欄に I, V, X, L, C, D, M を使った文字列を入力して「→ アラビア数字に変換」をクリック",
                "入力は大文字・小文字どちらでも対応しています",
                "変換結果は「コピー」ボタンでクリップボードにコピーできます",
                "キーボードショートカット: Ctrl+Enter でアラビア→ローマ変換",
              ],
            },
            {
              title: "ローマ数字の規則",
              items: [
                "基本記号: I=1, V=5, X=10, L=50, C=100, D=500, M=1000",
                "減算記法: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900",
                "大きい記号の左に小さい記号を置くと「差」を表します",
                "2024年 = MMXXIV（MM + XX + IV = 2000 + 20 + 4）",
                "ローマ数字は 1〜3999 の範囲のみ表現できます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
