import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/color-contrast")({
  head: () => ({
    meta: [
      { title: "カラーコントラストチェッカー | Web ツール集" },
      {
        name: "description",
        content:
          "WCAG 2.1準拠のカラーコントラストチェッカー。前景色と背景色のコントラスト比を計算し、AA・AAAの適合性を判定します。",
      },
      {
        property: "og:title",
        content: "カラーコントラストチェッカー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "WCAG 2.1準拠のカラーコントラストチェッカー。前景色と背景色のコントラスト比を計算し、AA・AAAの適合性を判定します。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-contrast` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "カラーコントラストチェッカー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "WCAG 2.1準拠のカラーコントラストチェッカー。前景色と背景色のコントラスト比を計算し、AA・AAAの適合性を判定します。",
      },
    ],
  }),
  component: ColorContrast,
});

/**
 * HEX形式の色文字列をRGBオブジェクトに変換する
 * @param hex - HEX形式の色文字列（#付き または #なし）
 * @returns RGBオブジェクト、または無効な場合はnull
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace(/^#/, "");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * sRGB値から相対輝度を計算するためにリニア化する
 * @param c - 0から255の範囲の色チャンネル値
 * @returns リニア化されたチャンネル値
 */
function linearize(c: number): number {
  const normalized = c / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * RGB値から相対輝度を計算する（WCAG 2.1準拠）
 * @param r - 赤チャンネル（0から255）
 * @param g - 緑チャンネル（0から255）
 * @param b - 青チャンネル（0から255）
 * @returns 相対輝度（0から1）
 */
export function calculateRelativeLuminance(
  r: number,
  g: number,
  b: number
): number {
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * 2つのHEX色のコントラスト比を計算する（WCAG 2.1準拠）
 * @param hex1 - 1つ目のHEX色文字列
 * @param hex2 - 2つ目のHEX色文字列
 * @returns コントラスト比（1から21）
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const l1 = calculateRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = calculateRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG判定結果の型定義
 */
export interface WcagResult {
  /** AA基準 通常テキスト（4.5:1以上）*/
  normalAA: boolean;
  /** AAA基準 通常テキスト（7:1以上）*/
  normalAAA: boolean;
  /** AA基準 大テキスト（3:1以上）*/
  largeAA: boolean;
  /** AAA基準 大テキスト（4.5:1以上）*/
  largeAAA: boolean;
}

/**
 * コントラスト比からWCAG AA/AAA判定を行う
 * @param ratio - コントラスト比
 * @returns WCAG判定結果オブジェクト
 */
export function getWcagResult(ratio: number): WcagResult {
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  };
}

/**
 * カラーコントラストチェッカーコンポーネント
 * WCAG 2.1準拠のコントラスト比計算とAA/AAA判定
 */
function ColorContrast() {
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fgHexInput, setFgHexInput] = useState("#000000");
  const [bgHexInput, setBgHexInput] = useState("#ffffff");

  const { showToast } = useToast();

  const contrastRatio = calculateContrastRatio(fgColor, bgColor);
  const wcagResult = getWcagResult(contrastRatio);

  /**
   * 前景色のカラーピッカーが変更されたときの処理
   */
  const handleFgColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFgColor(value);
      setFgHexInput(value);
    },
    []
  );

  /**
   * 背景色のカラーピッカーが変更されたときの処理
   */
  const handleBgColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setBgColor(value);
      setBgHexInput(value);
    },
    []
  );

  /**
   * 前景色のHEX入力が変更されたときの処理
   */
  const handleFgHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      setFgHexInput(value);
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        setFgColor(value);
      }
    },
    []
  );

  /**
   * 背景色のHEX入力が変更されたときの処理
   */
  const handleBgHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      setBgHexInput(value);
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        setBgColor(value);
      }
    },
    []
  );

  /**
   * 前景色と背景色を入れ替える処理
   */
  const handleSwapColors = useCallback(() => {
    setFgColor(bgColor);
    setBgColor(fgColor);
    setFgHexInput(bgColor);
    setBgHexInput(fgColor);
  }, [fgColor, bgColor]);

  /**
   * コントラスト比をクリップボードにコピーする処理
   */
  const handleCopyRatio = useCallback(async () => {
    const ratioText = `${contrastRatio.toFixed(2)}:1`;
    try {
      await navigator.clipboard.writeText(ratioText);
      showToast(`コントラスト比 ${ratioText} をコピーしました`, "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [contrastRatio, showToast]);

  return (
    <div className="tool-container color-contrast-page">
      <div className="color-contrast-inputs">
        {/* 左カラム: 色入力 */}
        <div className="color-contrast-left">
          {/* 前景色（テキスト色）入力 */}
          <div className="contrast-color-block">
            <h2 className="contrast-color-block-title">前景色（テキスト色）</h2>
            <div
              className="contrast-color-preview"
              style={{ "--preview-color": fgColor } as React.CSSProperties}
              aria-hidden="true"
            />
            <div className="contrast-color-input">
              <input
                type="color"
                value={fgColor}
                onChange={handleFgColorChange}
                className="contrast-color-picker"
                aria-label="前景色のカラーピッカー"
                title="前景色を選択"
              />
              <input
                type="text"
                value={fgHexInput}
                onChange={handleFgHexInput}
                className="contrast-hex-input"
                placeholder="#000000"
                maxLength={7}
                aria-label="前景色のHEX値"
              />
            </div>
          </div>

          {/* 色の入れ替えボタン */}
          <div className="contrast-swap-container">
            <Button
              type="button"
              className="contrast-swap-btn"
              onClick={handleSwapColors}
              aria-label="前景色と背景色を入れ替える"
              title="色を入れ替える"
            >
              ⇄
            </Button>
          </div>

          {/* 背景色入力 */}
          <div className="contrast-color-block">
            <h2 className="contrast-color-block-title">背景色</h2>
            <div
              className="contrast-color-preview"
              style={{ "--preview-color": bgColor } as React.CSSProperties}
              aria-hidden="true"
            />
            <div className="contrast-color-input">
              <input
                type="color"
                value={bgColor}
                onChange={handleBgColorChange}
                className="contrast-color-picker"
                aria-label="背景色のカラーピッカー"
                title="背景色を選択"
              />
              <input
                type="text"
                value={bgHexInput}
                onChange={handleBgHexInput}
                className="contrast-hex-input"
                placeholder="#ffffff"
                maxLength={7}
                aria-label="背景色のHEX値"
              />
            </div>
          </div>
        </div>

        {/* 右カラム: 結果表示 */}
        <div className="color-contrast-right">
          {/* コントラスト比表示 */}
          <div className="contrast-ratio-display" aria-live="polite">
            <span
              className="contrast-ratio-number"
              aria-label={`コントラスト比 ${contrastRatio.toFixed(2)} 対 1`}
            >
              {contrastRatio.toFixed(2)}:1
            </span>
            <span className="contrast-ratio-label">コントラスト比</span>
            <Button
              type="button"
              className="contrast-copy-btn"
              onClick={handleCopyRatio}
              aria-label="コントラスト比をコピー"
            >
              コピー
            </Button>
          </div>

          {/* WCAG判定テーブル */}
          <div className="wcag-table-container" aria-live="polite">
            <h2 className="wcag-table-title">WCAG 2.1 判定</h2>
            <table
              className="wcag-table"
              role="table"
              aria-label="WCAG 2.1 適合性判定"
            >
              <thead>
                <tr>
                  <th scope="col">基準</th>
                  <th scope="col">対象</th>
                  <th scope="col">必要比率</th>
                  <th scope="col">判定</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AA</td>
                  <td>通常テキスト</td>
                  <td>4.5:1</td>
                  <td>
                    <span
                      className={wcagResult.normalAA ? "wcag-pass" : "wcag-fail"}
                      aria-label={wcagResult.normalAA ? "適合" : "不適合"}
                    >
                      {wcagResult.normalAA ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>AA</td>
                  <td>大テキスト（18pt+）</td>
                  <td>3:1</td>
                  <td>
                    <span
                      className={wcagResult.largeAA ? "wcag-pass" : "wcag-fail"}
                      aria-label={wcagResult.largeAA ? "適合" : "不適合"}
                    >
                      {wcagResult.largeAA ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>AAA</td>
                  <td>通常テキスト</td>
                  <td>7:1</td>
                  <td>
                    <span
                      className={
                        wcagResult.normalAAA ? "wcag-pass" : "wcag-fail"
                      }
                      aria-label={wcagResult.normalAAA ? "適合" : "不適合"}
                    >
                      {wcagResult.normalAAA ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>AAA</td>
                  <td>大テキスト（18pt+）</td>
                  <td>4.5:1</td>
                  <td>
                    <span
                      className={
                        wcagResult.largeAAA ? "wcag-pass" : "wcag-fail"
                      }
                      aria-label={wcagResult.largeAAA ? "適合" : "不適合"}
                    >
                      {wcagResult.largeAAA ? "Pass" : "Fail"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* リアルタイムプレビュー */}
          <div
            className="contrast-preview"
            style={
              {
                "--fg-color": fgColor,
                "--bg-color": bgColor,
              } as React.CSSProperties
            }
            aria-label="カラープレビュー"
          >
            <p className="contrast-preview-text-large">
              大テキストのサンプル（18pt以上）
            </p>
            <p className="contrast-preview-text">
              通常テキストのサンプル。この文章はコントラストチェックのプレビューです。
            </p>
            <p className="contrast-preview-text">
              The quick brown fox jumps over the lazy dog.
            </p>
          </div>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "カラーコントラストチェッカーとは",
            items: [
              "前景色（テキスト色）と背景色のコントラスト比を計算するツールです",
              "WCAG 2.1（Web Content Accessibility Guidelines）に準拠した判定を行います",
              "コントラスト比が高いほど、テキストが読みやすくなります",
              "障害のあるユーザーや視覚的な問題を持つユーザーへのアクセシビリティが向上します",
            ],
          },
          {
            title: "WCAG基準について",
            items: [
              "AA通常テキスト: 4.5:1以上（最低限の基準）",
              "AA大テキスト（18pt+または14pt+太字）: 3:1以上",
              "AAA通常テキスト: 7:1以上（より高いアクセシビリティ）",
              "AAA大テキスト: 4.5:1以上",
              "多くの法規制や標準はレベルAAへの適合を要求しています",
            ],
          },
          {
            title: "Tips",
            items: [
              "カラーピッカーまたはHEX値を直接入力して色を設定できます",
              "⇄ボタンで前景色と背景色を素早く入れ替えられます",
              "コントラスト比をクリップボードにコピーできます",
              "プレビューエリアで実際の見え方を確認できます",
              "白（#ffffff）と黒（#000000）の組み合わせは最大の21:1です",
            ],
          },
        ]}
      />
    </div>
  );
}
