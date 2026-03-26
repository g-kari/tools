import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useId } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  TAILWIND_COLORS,
  TAILWIND_SHADES,
  findNearestTailwindColor,
  hexToRgbTuple,
} from "../utils/tailwind-colors";
import "~/styles/tools/tailwind-colors.css";

export const Route = createFileRoute("/tailwind-colors")({
  head: () => ({
    meta: [
      { title: "Tailwind CSS カラーリファレンス | Web ツール集" },
      {
        name: "description",
        content:
          "Tailwind CSS v3の全カラーパレットを一覧表示。カラー名・HEX値でフィルタリング、クリップボードへのコピー、任意のHEXコードに最も近いTailwindカラーを検索する機能を備えたカラーリファレンスツール。",
      },
      {
        property: "og:title",
        content: "Tailwind CSS カラーリファレンス | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Tailwind CSS v3の全カラーパレットを一覧表示。カラー名・HEX値でフィルタリング、クリップボードへのコピー、任意のHEXコードに最も近いTailwindカラーを検索する機能を備えたカラーリファレンスツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tailwind-colors` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TailwindColorsPage,
});

/** Tailwind CSSカラーリファレンスページコンポーネント */
function TailwindColorsPage() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const searchId = useId();
  const nearestInputId = useId();

  const [searchQuery, setSearchQuery] = useState("");
  const [nearestInput, setNearestInput] = useState("");

  /** 検索クエリを正規化する */
  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  /** フィルタリングされたカラー名一覧 */
  const filteredColorNames = useMemo(() => {
    const allNames = Object.keys(TAILWIND_COLORS);
    if (!normalizedQuery) return allNames;

    // HEX検索: クエリが # または 16進数文字で始まる場合
    const hexQuery = normalizedQuery.replace(/^#/, "");
    if (/^[0-9a-f]{1,6}$/.test(hexQuery)) {
      // HEXで一致するシェードを持つカラー名のみ表示
      return allNames.filter((colorName) => {
        const shades = TAILWIND_COLORS[colorName];
        return Object.values(shades).some((hex) =>
          hex.toLowerCase().includes(hexQuery)
        );
      });
    }

    // カラー名検索
    return allNames.filter((name) => name.includes(normalizedQuery));
  }, [normalizedQuery]);

  /** 最近似色の検索結果 */
  const nearestResult = useMemo(() => {
    const trimmed = nearestInput.trim();
    if (!trimmed) return null;
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return findNearestTailwindColor(hex);
  }, [nearestInput]);

  /** 近似色入力のバリデーション */
  const nearestInputError = useMemo(() => {
    const trimmed = nearestInput.trim();
    if (!trimmed) return null;
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (!hexToRgbTuple(hex)) return "有効なHEXカラーコードを入力してください（例: #3b82f6）";
    return null;
  }, [nearestInput]);

  /** クラス名をコピーする */
  const handleCopyClass = useCallback(
    async (colorName: string, shade: number) => {
      const className = `${colorName}-${shade}`;
      const success = await copy(className);
      if (success) {
        showToast(`"${className}" をコピーしました`, "success");
        announceStatus(`${className} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  /** HEX値をコピーする */
  const handleCopyHex = useCallback(
    async (hex: string, colorName: string, shade: number) => {
      const success = await copy(hex);
      if (success) {
        showToast(`"${hex}" をコピーしました（${colorName}-${shade}）`, "success");
        announceStatus(`${hex} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  return (
    <div className="tool-container">
      <div className="twc-container">
        {/* 検索セクション */}
        <section className="twc-search-section" aria-label="カラー検索">
          <label htmlFor={searchId} className="twc-search-label">
            カラーを検索
          </label>
          <input
            id={searchId}
            type="text"
            className="twc-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="例: blue, #3b82f6, f6..."
            aria-label="カラー名またはHEXコードで検索"
            aria-describedby={`${searchId}-hint`}
          />
          <span id={`${searchId}-hint`} className="twc-search-hint">
            カラー名（例: blue, red）またはHEXコード（例: #3b82f6）で検索できます
          </span>
        </section>

        {/* 最近似色セクション */}
        <section className="twc-nearest-section" aria-label="最近似色を探す">
          <h3 className="twc-nearest-title">最近似色を探す</h3>
          <div className="twc-nearest-input-row">
            <div>
              <label htmlFor={nearestInputId} className="twc-search-label">
                HEXカラーコード
              </label>
              <input
                id={nearestInputId}
                type="text"
                className={`twc-nearest-input${nearestInputError ? " twc-nearest-input--error" : ""}`}
                value={nearestInput}
                onChange={(e) => setNearestInput(e.target.value)}
                placeholder="#3b82f6"
                aria-label="最近似色を検索するHEXコード"
                aria-describedby={nearestInputError ? `${nearestInputId}-error` : undefined}
              />
              {nearestInputError && (
                <p id={`${nearestInputId}-error`} className="twc-nearest-error" role="alert">
                  {nearestInputError}
                </p>
              )}
            </div>
          </div>

          <NearestResult
            result={nearestResult}
            showError={!!nearestInput && !nearestInputError && nearestResult === null}
            onCopyClass={handleCopyClass}
            onCopyHex={handleCopyHex}
          />
        </section>

        {/* カラーグリッド */}
        <section aria-label="Tailwind CSS カラーパレット">
          <div className="twc-color-grid" role="list" aria-label="カラーファミリー一覧">
            {filteredColorNames.length === 0 ? (
              <p className="twc-no-results" role="status" aria-live="polite">
                「{searchQuery}」に一致するカラーが見つかりませんでした
              </p>
            ) : (
              filteredColorNames.map((colorName) => (
                <ColorRow
                  key={colorName}
                  colorName={colorName}
                  shades={TAILWIND_COLORS[colorName]}
                  highlightShade={
                    nearestResult?.colorName === colorName
                      ? nearestResult.shade
                      : null
                  }
                  searchQuery={normalizedQuery}
                  onCopyClass={handleCopyClass}
                />
              ))
            )}
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "カラースウォッチをクリックすると、クラス名（例: blue-500）をクリップボードにコピーします",
                "スウォッチにカーソルを合わせるとHEXカラーコードが表示されます",
                "検索バーでカラー名（blue, red など）またはHEXコードを入力してフィルタリングできます",
                "「最近似色を探す」にHEXコードを入力すると、最も近いTailwindカラーを見つけられます",
              ],
            },
            {
              title: "Tailwind CSSでの使い方",
              items: [
                "テキスト色: text-blue-500, text-red-600 など",
                "背景色: bg-green-100, bg-slate-800 など",
                "ボーダー色: border-gray-300, border-purple-400 など",
                "シェード番号が大きいほど暗い色になります（50が最も明るく、950が最も暗い）",
              ],
            },
            {
              title: "シェード番号の目安",
              items: [
                "50〜200: 非常に薄い色。背景・ホバー効果に適しています",
                "300〜400: 薄い色。アクセントやボーダーに適しています",
                "500〜600: 標準的な色。ボタンやリンクに適しています",
                "700〜950: 暗い色。テキストやダークテーマに適しています",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </div>
  );
}

interface NearestResultProps {
  result: { colorName: string; shade: number; hex: string } | null;
  showError: boolean;
  onCopyClass: (colorName: string, shade: number) => void;
  onCopyHex: (hex: string, colorName: string, shade: number) => void;
}

/** 最近似色の結果表示コンポーネント */
function NearestResult({ result, showError, onCopyClass, onCopyHex }: NearestResultProps) {
  if (showError) {
    return (
      <p className="twc-nearest-placeholder" role="status">
        一致するカラーが見つかりませんでした
      </p>
    );
  }

  if (!result) {
    return (
      <p className="twc-nearest-placeholder">
        HEXコードを入力すると最も近いTailwindカラーを表示します
      </p>
    );
  }

  const className = `${result.colorName}-${result.shade}`;

  return (
    <div className="twc-nearest-result" aria-live="polite" aria-label={`最近似色: ${className}`}>
      <div
        className="twc-nearest-swatch-preview"
        style={{ backgroundColor: result.hex }}
        aria-hidden="true"
      />
      <div className="twc-nearest-info">
        <span className="twc-nearest-class">{className}</span>
        <span className="twc-nearest-hex">{result.hex}</span>
      </div>
      <div className="twc-nearest-copy-btn">
        <Button
          variant="outline"
          onClick={() => onCopyClass(result.colorName, result.shade)}
          aria-label={`クラス名 ${className} をコピー`}
        >
          クラス名をコピー
        </Button>
      </div>
    </div>
  );
}

interface ColorRowProps {
  colorName: string;
  shades: Record<number, string>;
  highlightShade: number | null;
  searchQuery: string;
  onCopyClass: (colorName: string, shade: number) => void;
}

/** カラーファミリーの行コンポーネント */
function ColorRow({
  colorName,
  shades,
  highlightShade,
  onCopyClass,
}: ColorRowProps) {
  return (
    <div className="twc-color-row" role="listitem" aria-label={`${colorName} カラーファミリー`}>
      <span className="twc-color-name" title={colorName}>
        {colorName}
      </span>
      <div className="twc-shades" role="list" aria-label={`${colorName} のシェード`}>
        {TAILWIND_SHADES.map((shade) => {
          const hex = shades[shade];
          if (!hex) return null;
          const className = `${colorName}-${shade}`;
          const isHighlight = highlightShade === shade;
          return (
            <SwatchButton
              key={shade}
              colorName={colorName}
              shade={shade}
              hex={hex}
              className={className}
              isHighlight={isHighlight}
              onCopyClass={onCopyClass}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SwatchButtonProps {
  colorName: string;
  shade: number;
  hex: string;
  className: string;
  isHighlight: boolean;
  onCopyClass: (colorName: string, shade: number) => void;
}

/** 個別カラースウォッチのボタンコンポーネント */
function SwatchButton({
  colorName,
  shade,
  hex,
  className,
  isHighlight,
  onCopyClass,
}: SwatchButtonProps) {
  const handleClick = useCallback(() => {
    onCopyClass(colorName, shade);
  }, [colorName, shade, onCopyClass]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCopyClass(colorName, shade);
      }
    },
    [colorName, shade, onCopyClass]
  );

  return (
    <div
      className={`twc-swatch${isHighlight ? " twc-swatch--highlight" : ""}`}
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${className} (${hex}) をコピー`}
    >
      <div
        className="twc-swatch-inner"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <div className="twc-swatch-info" aria-hidden="true">
        {shade}
      </div>
      <div className="twc-swatch-tooltip" aria-hidden="true">
        {className}
        <br />
        {hex}
      </div>
    </div>
  );
}
