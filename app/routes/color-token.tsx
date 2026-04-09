import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generateShades,
  formatShades,
  type ShadeEntry,
  type TokenOutputFormat,
} from "~/utils/color-token";

export const Route = createFileRoute("/color-token")({
  head: () => ({
    meta: [
      { title: "カラートークン生成 | Web ツール集" },
      {
        name: "description",
        content:
          "ベースカラーからデザインシステム用のシェードスケール（50〜950）を自動生成するツール。CSS変数・SCSS・Tailwind設定・JSON形式で出力。Figma・Material Design・Tailwind CSS のカラーシステム構築に対応。",
      },
      { property: "og:title", content: "カラートークン生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ベースカラーからデザインシステム用のシェードスケール（50〜950）を自動生成するツール。CSS変数・SCSS・Tailwind設定・JSON形式で出力。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-token` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "カラートークン生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ベースカラーからシェードスケール（50〜950）を生成。CSS変数・SCSS・Tailwind・JSON形式で出力。",
      },
    ],
  }),
  component: ColorTokenGenerator,
});

/** 出力フォーマット選択肢 */
const FORMAT_OPTIONS: { value: TokenOutputFormat; label: string }[] = [
  { value: "css", label: "CSS変数" },
  { value: "scss", label: "SCSS" },
  { value: "tailwind", label: "Tailwind" },
  { value: "json", label: "JSON" },
];

/**
 * 3桁または6桁の HEX 文字列を6桁に正規化する
 * @param raw - 入力文字列（# あり/なし問わず）
 * @returns 正規化後の #RRGGBB 形式、または null（無効な場合）
 */
function normalizeHex(raw: string): string | null {
  const clean = raw.replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) return `#${clean.toLowerCase()}`;
  // 3桁の場合は各桁を2回繰り返して6桁に展開
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    const expanded = clean
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}

/** シェードスウォッチコンポーネント */
function ShadeSwatchRow({
  shade,
  onCopy,
}: {
  shade: ShadeEntry;
  onCopy: (hex: string, key: number) => void;
}) {
  return (
    <div className="ct-swatch-row" role="listitem">
      {/*
       * 動的に生成したカラーコードを背景色として適用するため、
       * CSS カスタムプロパティ（--ct-swatch-bg）を ref 経由で設定する。
       * CSS の .ct-swatch-color { background-color: var(--ct-swatch-bg); } と連携。
       */}
      <div
        className="ct-swatch-color"
        ref={(el) => {
          if (el) el.style.setProperty("--ct-swatch-bg", shade.hex);
        }}
        aria-label={`シェード ${shade.key}: ${shade.hex}`}
      />
      <span className="ct-swatch-key">{shade.key}</span>
      <span className="ct-swatch-hex">{shade.hex}</span>
      <span className="ct-swatch-rgb">{shade.rgb}</span>
      <button
        type="button"
        className="ct-swatch-copy"
        onClick={() => onCopy(shade.hex, shade.key)}
        aria-label={`${shade.key} (${shade.hex}) をコピー`}
      >
        コピー
      </button>
    </div>
  );
}

/** カラートークンジェネレーター メインコンポーネント */
function ColorTokenGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [hexInput, setHexInput] = useState("#3b82f6");
  const [colorName, setColorName] = useState("primary");
  const [outputFormat, setOutputFormat] = useState<TokenOutputFormat>("css");

  // シェードを計算
  const shades = useMemo(() => generateShades(baseColor), [baseColor]);

  // 出力テキストを計算
  const outputText = useMemo(
    () => formatShades(shades, colorName, outputFormat),
    [shades, colorName, outputFormat],
  );

  // カラーピッカー変更
  const handlePickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBaseColor(val);
    setHexInput(val);
  }, []);

  // HEX テキスト入力変更（3桁 / 6桁両対応）
  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    const normalized = normalizeHex(val);
    if (normalized) {
      setBaseColor(normalized);
    }
  }, []);

  // 個別スウォッチのコピー
  const handleSwatchCopy = useCallback(
    async (hex: string, key: number) => {
      const success = await copy(hex);
      if (success) {
        showToast(`${key}: ${hex} をコピーしました`, "success");
        announceStatus(`シェード ${key} の HEX コードをコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  // 出力テキストをコピー
  const handleOutputCopy = useCallback(async () => {
    const success = await copy(outputText);
    if (success) {
      const label = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label ?? "";
      showToast(`${label} 形式でコピーしました`, "success");
      announceStatus(`${label} 形式の出力をコピーしました`);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, outputText, outputFormat, showToast, announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* ── 入力エリア ── */}
        <div className="ct-input-section">
          {/* ベースカラー */}
          <div className="option-group">
            <label htmlFor="ct-hex-input">ベースカラー</label>
            <div className="ct-color-input-row">
              <input
                type="color"
                value={baseColor}
                onChange={handlePickerChange}
                className="ct-color-picker"
                aria-label="カラーピッカーでベースカラーを選択"
              />
              <input
                id="ct-hex-input"
                type="text"
                value={hexInput}
                onChange={handleHexInput}
                placeholder="#3b82f6"
                maxLength={7}
                className="ct-hex-text"
                aria-label="HEX コードを入力"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          {/* カラー名 */}
          <div className="option-group">
            <label htmlFor="ct-name-input">カラー名</label>
            <input
              id="ct-name-input"
              type="text"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="例: primary, brand, blue"
              className="ct-name-input"
              aria-label="カラー名（変数名に使用）"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-case-hint">
              CSS 変数・SCSS 変数名に使用されます（例: --primary-500）
            </p>
          </div>
        </div>

        {/* ── シェードプレビュー ── */}
        <div className="ct-preview-section">
          <p className="section-title">シェードプレビュー</p>
          <div className="ct-swatch-strip" role="list" aria-label="生成されたシェード一覧">
            {shades.map((shade) => (
              /*
               * 動的なカラーコードを CSS カスタムプロパティ（--ct-cell-bg, --ct-label-color）
               * として ref 経由で設定する。インライン style 属性を避けるプロジェクト規約に準拠。
               */
              <button
                key={shade.key}
                type="button"
                className="ct-strip-cell"
                ref={(el) => {
                  if (!el) return;
                  el.style.setProperty("--ct-cell-bg", shade.hex);
                  el.style.setProperty("--ct-label-color", shade.useWhiteText ? "#fff" : "#000");
                }}
                onClick={() => handleSwatchCopy(shade.hex, shade.key)}
                aria-label={`シェード ${shade.key}: ${shade.hex}。クリックでコピー`}
                title={`${shade.key}: ${shade.hex}`}
              >
                <span className="ct-strip-label">{shade.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 詳細テーブル ── */}
        <div className="ct-table-section">
          <p className="section-title">詳細</p>
          <div className="ct-swatch-list" role="list" aria-label="シェード詳細一覧">
            {shades.map((shade) => (
              <ShadeSwatchRow key={shade.key} shade={shade} onCopy={handleSwatchCopy} />
            ))}
          </div>
        </div>

        {/* ── コード出力 ── */}
        <div className="ct-output-section">
          <p className="section-title">コード出力</p>

          {/* フォーマット選択タブ（ARIA tab pattern 準拠） */}
          <div className="ct-format-tabs" role="tablist" aria-label="出力フォーマット">
            {FORMAT_OPTIONS.map((f) => (
              <button
                key={f.value}
                id={`ct-tab-${f.value}`}
                type="button"
                role="tab"
                aria-selected={outputFormat === f.value}
                aria-controls={`ct-panel-${f.value}`}
                className={`ct-format-tab${outputFormat === f.value ? " active" : ""}`}
                onClick={() => setOutputFormat(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 出力テキストエリア（tabpanel） */}
          <div
            id={`ct-panel-${outputFormat}`}
            role="tabpanel"
            aria-labelledby={`ct-tab-${outputFormat}`}
            className="ct-output-wrapper"
          >
            <textarea
              readOnly
              value={outputText}
              className="ct-output-textarea"
              aria-label={`${FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label} 形式の出力`}
              rows={12}
              spellCheck={false}
            />
            <button
              type="button"
              className="btn-primary ct-copy-btn"
              onClick={handleOutputCopy}
              aria-label="出力コードをコピー"
            >
              コピー
            </button>
          </div>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "カラートークンとは",
            items: [
              "デザインシステムで色を再利用するための名前付き定数（トークン）",
              "Tailwind CSS・Material Design・Chakra UI など主要なUIフレームワークは 50〜950 の 11段階シェードを採用",
              "50 が最も明るく（白に近い）、950 が最も暗い（黒に近い）",
              "500 がベースカラーに対応するのが一般的",
            ],
          },
          {
            title: "出力フォーマットの使い分け",
            items: [
              "CSS変数: :root { --primary-500: #3b82f6; } 形式。モダン CSS で直接利用",
              "SCSS: $primary-500: #3b82f6; 形式。Sass/SCSS プロジェクトで利用",
              "Tailwind: tailwind.config.js の theme.extend.colors に貼り付けて利用",
              "JSON: デザインツール（Figma Tokens など）との連携や API 連携に利用",
            ],
          },
          {
            title: "Tips",
            items: [
              "各シェードセルをクリックすると HEX コードがコピーされます",
              "3桁 HEX（例: #fff）も入力可能で自動的に6桁に展開されます",
              "カラー名はハイフン区切り（例: brand-blue）でも利用可能",
              "ブラウザ内で計算されるためデータは外部に送信されません",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
