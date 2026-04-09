import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  applyAnsiStyle,
  generateShellCode,
  hexToRgb,
  rgbToHex,
  DEFAULT_STYLE,
  STANDARD_COLORS,
  type AnsiStyle,
  type AnsiColor,
  type EscapeFormat,
} from "../utils/ansi-color";

export const Route = createFileRoute("/ansi-color")({
  head: () => ({
    meta: [
      { title: "ANSIターミナルカラーコードビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "ターミナルのテキスト色・背景色・スタイル（太字・下線・斜体等）をGUIで設定し、ANSIエスケープコードを生成するツール。bash/Python/Node.js用コードを即座にコピー可能。",
      },
      {
        property: "og:title",
        content: "ANSIターミナルカラーコードビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ターミナルのテキスト色・背景色・スタイル（太字・下線・斜体等）をGUIで設定し、ANSIエスケープコードを生成するツール。bash/Python/Node.js用コードを即座にコピー可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ansi-color` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: AnsiColorBuilder,
});

/**
 * 色選択のモード
 * - none: 色なし（デフォルト）
 * - standard: 標準16色
 * - custom: カスタムRGB
 */
type ColorMode = "none" | "standard" | "custom";

/** RGB値の状態 */
interface RgbState {
  r: number;
  g: number;
  b: number;
}

/** 出力形式ラベルの定義 */
const FORMAT_LABELS: Record<EscapeFormat, string> = {
  bash: "bash (\\e)",
  "bash-octal": "bash (\\033)",
  python: "Python",
  unicode: "Node.js",
  raw: "Raw",
};

/**
 * カスタムRGB色からAnsiColorオブジェクトを生成する
 * @param rgb RGB値
 * @returns AnsiColor（rgb型）
 */
function rgbToAnsiColor(rgb: RgbState): AnsiColor {
  return { type: "rgb", r: rgb.r, g: rgb.g, b: rgb.b };
}

/**
 * 標準色インデックスからAnsiColorオブジェクトを生成する（前景色用）
 * @param fgCode 前景色コード番号
 * @returns AnsiColor（standard型）
 */
function standardFgToAnsiColor(fgCode: number): AnsiColor {
  return { type: "standard", code: fgCode };
}

/**
 * 標準色インデックスからAnsiColorオブジェクトを生成する（背景色用）
 * @param bgCode 背景色コード番号（前景色コード+10相当）
 * @returns AnsiColor（standard型）
 */
function standardBgToAnsiColor(bgCode: number): AnsiColor {
  // 背景色コードは fg コードに合わせて渡し、colorToCodes 側で +10 する
  // standard型のcodeはfgベースのコードを渡す（内部で背景時+10される）
  return { type: "standard", code: bgCode - 10 };
}

/**
 * CSSスタイルプロパティとして使えるスタイルオブジェクトをAnsiStyleから生成する
 * ANSIカラーをCSSに変換してブラウザ上でプレビュー表示する
 * @param style ANSIスタイル設定
 * @returns React CSSProperties
 */
function ansiStyleToCss(style: AnsiStyle): React.CSSProperties {
  const css: React.CSSProperties = {};

  if (style.bold) css.fontWeight = "bold";
  if (style.dim) css.opacity = 0.5;
  if (style.italic) css.fontStyle = "italic";
  if (style.underline) {
    css.textDecoration = style.strikethrough ? "underline line-through" : "underline";
  } else if (style.strikethrough) {
    css.textDecoration = "line-through";
  }
  if (style.blink) css.animation = "ansi-blink 1s step-end infinite";
  if (style.inverse) {
    // inverse は fg/bg を入れ替える（CSSで表現するため簡易的にフィルター使用）
    css.filter = "invert(1)";
  }

  if (style.fgColor) {
    css.color = ansiColorToCssColor(style.fgColor, false);
  }

  if (style.bgColor) {
    css.backgroundColor = ansiColorToCssColor(style.bgColor, true);
  }

  return css;
}

/**
 * AnsiColorをCSS color値文字列に変換する
 * @param color ANSIカラー設定
 * @param _isBackground 背景色フラグ（標準色のHEX参照用）
 * @returns CSS color文字列
 */
function ansiColorToCssColor(color: AnsiColor, _isBackground: boolean): string {
  switch (color.type) {
    case "standard": {
      const entry = STANDARD_COLORS.find((c) => c.fg === color.code);
      return entry ? entry.hex : "inherit";
    }
    case "256": {
      // 256色テーブルの簡易変換（0-15は標準色、16-231はカラーキューブ、232-255はグレースケール）
      if (color.code < 16) {
        const entry = STANDARD_COLORS[color.code];
        return entry ? entry.hex : "inherit";
      } else if (color.code < 232) {
        const idx = color.code - 16;
        const b = idx % 6;
        const g = Math.floor(idx / 6) % 6;
        const r = Math.floor(idx / 36);
        const toVal = (v: number) => (v === 0 ? 0 : 55 + v * 40);
        return rgbToHex(toVal(r), toVal(g), toVal(b));
      } else {
        const v = 8 + (color.code - 232) * 10;
        return rgbToHex(v, v, v);
      }
    }
    case "rgb":
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
}

/**
 * ANSIターミナルカラーコードビルダーコンポーネント
 * スタイル・前景色・背景色をGUIで設定し、各言語向けのANSIエスケープコードを生成する
 */
function AnsiColorBuilder() {
  const [previewText, setPreviewText] = useState("Hello, World!");
  const [style, setStyle] = useState<AnsiStyle>({ ...DEFAULT_STYLE });
  const [fgMode, setFgMode] = useState<ColorMode>("none");
  const [bgMode, setBgMode] = useState<ColorMode>("none");
  const [fgStandardIndex, setFgStandardIndex] = useState<number | null>(null);
  const [bgStandardIndex, setBgStandardIndex] = useState<number | null>(null);
  const [fgRgb, setFgRgb] = useState<RgbState>({ r: 255, g: 100, b: 50 });
  const [bgRgb, setBgRgb] = useState<RgbState>({ r: 0, g: 0, b: 128 });
  const [selectedFormat, setSelectedFormat] = useState<EscapeFormat>("bash");

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** 前景色AnsiColorオブジェクトを算出する */
  const fgColor = useMemo((): AnsiColor | null => {
    if (fgMode === "none") return null;
    if (fgMode === "standard" && fgStandardIndex !== null) {
      return standardFgToAnsiColor(STANDARD_COLORS[fgStandardIndex].fg);
    }
    if (fgMode === "custom") return rgbToAnsiColor(fgRgb);
    return null;
  }, [fgMode, fgStandardIndex, fgRgb]);

  /** 背景色AnsiColorオブジェクトを算出する */
  const bgColor = useMemo((): AnsiColor | null => {
    if (bgMode === "none") return null;
    if (bgMode === "standard" && bgStandardIndex !== null) {
      return standardBgToAnsiColor(STANDARD_COLORS[bgStandardIndex].bg);
    }
    if (bgMode === "custom") return rgbToAnsiColor(bgRgb);
    return null;
  }, [bgMode, bgStandardIndex, bgRgb]);

  /** 現在のスタイル（fgColor/bgColorを含む）を算出する */
  const currentStyle = useMemo(
    (): AnsiStyle => ({ ...style, fgColor, bgColor }),
    [style, fgColor, bgColor],
  );

  /** プレビュー用CSSスタイル */
  const previewCss = useMemo(() => ansiStyleToCss(currentStyle), [currentStyle]);

  /** 生成コード文字列 */
  const generatedCode = useMemo(
    () => generateShellCode(currentStyle, previewText, selectedFormat),
    [currentStyle, previewText, selectedFormat],
  );

  /** スタイルチェックボックスのトグル */
  const toggleStyle = (key: keyof Omit<AnsiStyle, "fgColor" | "bgColor">) => {
    setStyle((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /** コードコピー処理 */
  const handleCopy = async () => {
    const success = await copy(generatedCode);
    if (success) {
      showToast("コードをコピーしました", "success");
      announceStatus("コードをクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  /** Ctrl+Enter でコピー */
  useKeyboardShortcut("Enter", handleCopy, { ctrl: true });

  /** リセット処理 */
  const handleReset = () => {
    setStyle({ ...DEFAULT_STYLE });
    setFgMode("none");
    setBgMode("none");
    setFgStandardIndex(null);
    setBgStandardIndex(null);
    setFgRgb({ r: 255, g: 100, b: 50 });
    setBgRgb({ r: 0, g: 0, b: 128 });
    setPreviewText("Hello, World!");
    announceStatus("設定をリセットしました");
  };

  /** カラーピッカーのHEX変更をRGBに変換して反映する */
  const handleFgColorPickerChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) setFgRgb(rgb);
  };

  const handleBgColorPickerChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (rgb) setBgRgb(rgb);
  };

  /** RGB入力値のバリデーション（0-255に丸める） */
  const clampRgb = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

  const styleCheckboxes: Array<{
    key: keyof Omit<AnsiStyle, "fgColor" | "bgColor">;
    label: string;
  }> = [
    { key: "bold", label: "太字 (Bold)" },
    { key: "dim", label: "暗く (Dim)" },
    { key: "italic", label: "斜体 (Italic)" },
    { key: "underline", label: "下線 (Underline)" },
    { key: "strikethrough", label: "打ち消し線" },
    { key: "blink", label: "点滅 (Blink)" },
    { key: "inverse", label: "反転 (Inverse)" },
  ];

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">ANSIターミナルカラーコードビルダー</h2>

        <div className="ansi-color-container">
          {/* プレビューテキスト入力 */}
          <div className="ansi-color-preview-input-group">
            <label htmlFor="ansi-preview-text" className="ansi-color-section-label">
              プレビューテキスト
            </label>
            <input
              id="ansi-preview-text"
              type="text"
              className="ansi-color-preview-input"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Hello, World!"
              aria-label="プレビューテキスト入力"
            />
          </div>

          {/* ターミナルプレビュー */}
          <section aria-label="プレビュー">
            <p className="ansi-color-section-label">プレビュー</p>
            <div
              className="ansi-color-preview-area"
              role="img"
              aria-label={`プレビュー: ${previewText}`}
            >
              <span className="ansi-color-preview-text" style={previewCss}>
                {previewText || "Hello, World!"}
              </span>
            </div>
          </section>

          {/* テキストスタイル */}
          <section aria-labelledby="ansi-style-heading">
            <p id="ansi-style-heading" className="ansi-color-section-label">
              テキストスタイル
            </p>
            <div
              className="ansi-color-style-checkboxes"
              role="group"
              aria-label="テキストスタイル選択"
            >
              {styleCheckboxes.map(({ key, label }) => (
                <label key={key} className="ansi-color-style-checkbox-item">
                  <input
                    type="checkbox"
                    checked={style[key]}
                    onChange={() => toggleStyle(key)}
                    aria-label={label}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* 前景色 */}
          <ColorSection
            title="前景色（テキストの色）"
            mode={fgMode}
            onModeChange={(m) => {
              setFgMode(m);
              if (m !== "standard") setFgStandardIndex(null);
            }}
            standardIndex={fgStandardIndex}
            onStandardSelect={setFgStandardIndex}
            rgb={fgRgb}
            onRgbChange={setFgRgb}
            onColorPickerChange={handleFgColorPickerChange}
            clampRgb={clampRgb}
            idPrefix="fg"
          />

          {/* 背景色 */}
          <ColorSection
            title="背景色"
            mode={bgMode}
            onModeChange={(m) => {
              setBgMode(m);
              if (m !== "standard") setBgStandardIndex(null);
            }}
            standardIndex={bgStandardIndex}
            onStandardSelect={setBgStandardIndex}
            rgb={bgRgb}
            onRgbChange={setBgRgb}
            onColorPickerChange={handleBgColorPickerChange}
            clampRgb={clampRgb}
            idPrefix="bg"
          />

          {/* コード出力 */}
          <section aria-labelledby="ansi-code-heading">
            <p id="ansi-code-heading" className="ansi-color-section-label">
              生成コード
            </p>
            <div className="ansi-color-code-output">
              {/* 出力形式タブ */}
              <div className="ansi-color-format-tabs" role="tablist" aria-label="出力形式選択">
                {(Object.entries(FORMAT_LABELS) as [EscapeFormat, string][]).map(([fmt, label]) => (
                  <button
                    key={fmt}
                    role="tab"
                    aria-selected={selectedFormat === fmt}
                    className={`ansi-color-format-tab${selectedFormat === fmt ? " active" : ""}`}
                    onClick={() => setSelectedFormat(fmt)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* コードブロック */}
              <div
                className="ansi-color-code-block"
                role="tabpanel"
                aria-label={`${FORMAT_LABELS[selectedFormat]} 形式のコード`}
              >
                <code aria-live="polite">{generatedCode}</code>
                <Button
                  variant="outline"
                  className="ansi-color-copy-btn"
                  onClick={handleCopy}
                  aria-label="コードをクリップボードにコピー (Ctrl+Enter)"
                >
                  コピー
                </Button>
              </div>
            </div>
          </section>

          {/* アクションボタン */}
          <div className="morse-code-actions">
            <Button variant="outline" onClick={handleReset} aria-label="設定をリセット">
              リセット
            </Button>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "プレビューテキストに色を付けたいテキストを入力します",
                "テキストスタイル（太字・下線など）をチェックボックスで選択します",
                "前景色（文字色）・背景色をモードから選択して設定します",
                "出力形式（bash / Python / Node.js など）を選んでコードをコピーします",
                "Ctrl+Enter でもコードをコピーできます",
              ],
            },
            {
              title: "ANSIエスケープコードとは",
              items: [
                "ターミナル（CLI）上でテキストの色やスタイルを制御するための特殊なコード列です",
                "ESC文字（\\x1b, \\e, \\033）に続く [ と数値コード、m で構成されます",
                "例: \\e[1;31m → 太字・赤色テキストを開始",
                "\\e[0m でスタイルをリセットします（末尾に必須）",
                "標準16色・256色・RGB（Truecolor）の3種類の色指定に対応",
              ],
            },
            {
              title: "色指定の種類",
              items: [
                "標準16色: 多くのターミナルで対応。0〜7の8色 + 明るい8色 (bright variant)",
                "256色: xterm-256color対応ターミナルで使用可能",
                "RGB (Truecolor): 16進カラーピッカーで任意色を指定。iTerm2, Windowsターミナルなどで対応",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

/** 色選択セクションのプロパティ */
interface ColorSectionProps {
  /** セクションのタイトル */
  title: string;
  /** 現在の色モード */
  mode: ColorMode;
  /** 色モード変更ハンドラ */
  onModeChange: (mode: ColorMode) => void;
  /** 標準色の選択インデックス */
  standardIndex: number | null;
  /** 標準色選択ハンドラ */
  onStandardSelect: (index: number) => void;
  /** カスタムRGB値 */
  rgb: RgbState;
  /** RGB値変更ハンドラ */
  onRgbChange: (rgb: RgbState) => void;
  /** カラーピッカー変更ハンドラ */
  onColorPickerChange: (hex: string) => void;
  /** RGB値を0-255にクランプする関数 */
  clampRgb: (v: number) => number;
  /** 入力IDのプレフィックス（fg / bg） */
  idPrefix: string;
}

/**
 * 色選択セクションコンポーネント
 * 色なし / 標準16色 / カスタムRGB の3モードを提供する
 */
function ColorSection({
  title,
  mode,
  onModeChange,
  standardIndex,
  onStandardSelect,
  rgb,
  onRgbChange,
  onColorPickerChange,
  clampRgb,
  idPrefix,
}: ColorSectionProps) {
  const pickerHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const headingId = `ansi-color-${idPrefix}-heading`;

  return (
    <section className="ansi-color-color-section" aria-labelledby={headingId}>
      <p id={headingId} className="ansi-color-color-section-title">
        {title}
      </p>

      {/* モードタブ */}
      <div className="ansi-color-mode-tabs" role="tablist" aria-label={`${title}のモード選択`}>
        {(["none", "standard", "custom"] as ColorMode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={`ansi-color-mode-tab${mode === m ? " active" : ""}`}
            onClick={() => onModeChange(m)}
          >
            {m === "none" ? "色なし" : m === "standard" ? "標準16色" : "カスタム"}
          </button>
        ))}
      </div>

      {/* 標準16色スウォッチ */}
      {mode === "standard" && (
        <div className="ansi-color-swatches-grid" role="listbox" aria-label="標準16色から選択">
          {STANDARD_COLORS.map((color, index) => (
            <div key={color.fg} className="ansi-color-swatch-item">
              <button
                role="option"
                aria-selected={standardIndex === index}
                aria-label={`${color.name}を選択`}
                className={`ansi-color-swatch${standardIndex === index ? " selected" : ""}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => onStandardSelect(index)}
                title={color.name}
              />
              <span className="ansi-color-swatch-label">{color.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* カスタムRGB入力 */}
      {mode === "custom" && (
        <div className="ansi-color-rgb-inputs">
          <div className="ansi-color-rgb-input-group">
            <label htmlFor={`${idPrefix}-r`}>R</label>
            <input
              id={`${idPrefix}-r`}
              type="number"
              min={0}
              max={255}
              value={rgb.r}
              onChange={(e) => onRgbChange({ ...rgb, r: clampRgb(Number(e.target.value)) })}
              aria-label="赤チャンネル (0-255)"
            />
          </div>
          <div className="ansi-color-rgb-input-group">
            <label htmlFor={`${idPrefix}-g`}>G</label>
            <input
              id={`${idPrefix}-g`}
              type="number"
              min={0}
              max={255}
              value={rgb.g}
              onChange={(e) => onRgbChange({ ...rgb, g: clampRgb(Number(e.target.value)) })}
              aria-label="緑チャンネル (0-255)"
            />
          </div>
          <div className="ansi-color-rgb-input-group">
            <label htmlFor={`${idPrefix}-b`}>B</label>
            <input
              id={`${idPrefix}-b`}
              type="number"
              min={0}
              max={255}
              value={rgb.b}
              onChange={(e) => onRgbChange({ ...rgb, b: clampRgb(Number(e.target.value)) })}
              aria-label="青チャンネル (0-255)"
            />
          </div>

          <div className="ansi-color-color-picker-group">
            <label htmlFor={`${idPrefix}-picker`}>カラーピッカー</label>
            <input
              id={`${idPrefix}-picker`}
              type="color"
              className="ansi-color-color-picker"
              value={pickerHex}
              onChange={(e) => onColorPickerChange(e.target.value)}
              aria-label="カラーピッカーで色を選択"
            />
          </div>

          <div
            className="ansi-color-rgb-preview"
            style={{ backgroundColor: pickerHex }}
            aria-label={`選択中の色: ${pickerHex}`}
            role="img"
          />
        </div>
      )}
    </section>
  );
}
