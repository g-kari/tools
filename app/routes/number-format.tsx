import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useId, useMemo, useState } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  type CompactDisplay,
  type FormatStyle,
  type NumberFormatOptions,
  formatForAllLocales,
  formatNumber,
  parseNumberInput,
} from "../utils/number-format";

export const Route = createFileRoute("/number-format")({
  head: () => ({
    meta: [
      { title: "数値フォーマット | Web ツール集" },
      {
        name: "description",
        content:
          "Intl.NumberFormat を使用して数値を各言語・通貨・パーセント形式でフォーマット。ロケール別の表示比較も可能。",
      },
      {
        property: "og:title",
        content: "数値フォーマット | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Intl.NumberFormat を使用して数値を各言語・通貨・パーセント形式でフォーマット。ロケール別の表示比較も可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/number-format` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: NumberFormatPage,
});

/**
 * 数値フォーマットコンポーネント
 * Intl.NumberFormat を活用して数値の多言語・多形式フォーマットを提供する
 */
function NumberFormatPage() {
  const [inputValue, setInputValue] = useState("1234567.89");
  const [locale, setLocale] = useState("ja-JP");
  const [style, setStyle] = useState<FormatStyle>("decimal");
  const [currency, setCurrency] = useState("JPY");
  const [compact, setCompact] = useState<CompactDisplay>("none");
  const [minFractionDigits, setMinFractionDigits] = useState("");
  const [maxFractionDigits, setMaxFractionDigits] = useState("");
  const [useGrouping, setUseGrouping] = useState(true);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const inputId = useId();
  const localeId = useId();
  const styleId = useId();
  const currencyId = useId();
  const compactId = useId();
  const minFractionId = useId();
  const maxFractionId = useId();

  const numericValue = useMemo(() => parseNumberInput(inputValue), [inputValue]);

  const formatOptions = useMemo<NumberFormatOptions>(
    () => ({
      locale,
      style,
      currency,
      compact,
      useGrouping,
      minimumFractionDigits: minFractionDigits !== "" ? Number(minFractionDigits) : undefined,
      maximumFractionDigits: maxFractionDigits !== "" ? Number(maxFractionDigits) : undefined,
    }),
    [locale, style, currency, compact, useGrouping, minFractionDigits, maxFractionDigits],
  );

  const result = useMemo(() => {
    if (numericValue === undefined) {
      return { formatted: "", error: "有効な数値を入力してください" };
    }
    return formatNumber(numericValue, formatOptions);
  }, [numericValue, formatOptions]);

  const comparisonEntries = useMemo(() => {
    if (numericValue === undefined) return [];
    return formatForAllLocales(numericValue, formatOptions);
  }, [numericValue, formatOptions]);

  const handleCopy = useCallback(async () => {
    if (!result.formatted) return;
    const success = await copy(result.formatted);
    if (success) {
      showToast("フォーマット結果をコピーしました", "success");
      announceStatus("フォーマット結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result.formatted, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInputValue("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">数値フォーマット</h2>

        {/* 数値入力 */}
        <div className="number-format-input-section">
          <div className="number-format-input-group">
            <label htmlFor={inputId} className="section-title">
              数値を入力
            </label>
            <Input
              id={inputId}
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="例: 1234567.89"
              aria-describedby="number-format-input-hint"
            />
            <p id="number-format-input-hint" className="form-hint">
              整数・小数・負の数に対応しています（例: 1234567.89、-0.05）
            </p>
          </div>
        </div>

        {/* フォーマットオプション */}
        <div className="number-format-options">
          {/* ロケール */}
          <div className="number-format-option-group">
            <label htmlFor={localeId}>ロケール</label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id={localeId} aria-label="ロケールを選択">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map(({ code, name }) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* フォーマット種別 */}
          <div className="number-format-option-group">
            <label htmlFor={styleId}>フォーマット種別</label>
            <Select value={style} onValueChange={(v) => setStyle(v as FormatStyle)}>
              <SelectTrigger id={styleId} aria-label="フォーマット種別を選択">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decimal">数値（小数）</SelectItem>
                <SelectItem value="currency">通貨</SelectItem>
                <SelectItem value="percent">パーセント</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 通貨（currency 選択時のみ） */}
          {style === "currency" && (
            <div className="number-format-option-group">
              <label htmlFor={currencyId}>通貨</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id={currencyId} aria-label="通貨を選択">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map(({ code, name }) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* コンパクト表記 */}
          <div className="number-format-option-group">
            <label htmlFor={compactId}>コンパクト表記</label>
            <Select value={compact} onValueChange={(v) => setCompact(v as CompactDisplay)}>
              <SelectTrigger id={compactId} aria-label="コンパクト表記を選択">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                <SelectItem value="short">短縮（1K / 1万）</SelectItem>
                <SelectItem value="long">長表記（1千 / 1万）</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 小数点桁数 */}
          <div className="number-format-option-group">
            <label>小数点以下の桁数</label>
            <div className="number-format-fraction-row">
              <Input
                id={minFractionId}
                type="number"
                min="0"
                max="20"
                value={minFractionDigits}
                onChange={(e) => setMinFractionDigits(e.target.value)}
                placeholder="最小"
                aria-label="最小桁数"
              />
              <span>〜</span>
              <Input
                id={maxFractionId}
                type="number"
                min="0"
                max="20"
                value={maxFractionDigits}
                onChange={(e) => setMaxFractionDigits(e.target.value)}
                placeholder="最大"
                aria-label="最大桁数"
              />
            </div>
          </div>

          {/* 3桁区切り */}
          <div className="number-format-option-group">
            <label>3桁区切り</label>
            <div className="radio-group" role="group" aria-label="3桁区切りの設定">
              <label className="radio-label">
                <input
                  type="radio"
                  name="useGrouping"
                  checked={useGrouping}
                  onChange={() => setUseGrouping(true)}
                />
                あり
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="useGrouping"
                  checked={!useGrouping}
                  onChange={() => setUseGrouping(false)}
                />
                なし
              </label>
            </div>
          </div>
        </div>

        {/* フォーマット結果 */}
        <div className="number-format-result-section">
          {result.error ? (
            <div className="number-format-result-error" role="alert">
              {result.error}
            </div>
          ) : (
            <div className="number-format-result-card">
              <div className="number-format-result-label">
                {locale} / {style === "currency" ? currency : style}
              </div>
              <div
                className="number-format-result-value"
                aria-live="polite"
                aria-label={`フォーマット結果: ${result.formatted}`}
              >
                {result.formatted || "—"}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="number-format-actions">
            <Button
              variant="default"
              onClick={handleCopy}
              disabled={!result.formatted}
              aria-label="フォーマット結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!inputValue}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>
        </div>

        {/* ロケール比較表 */}
        {comparisonEntries.length > 0 && (
          <div className="number-format-comparison-section">
            <h3 className="number-format-comparison-title">ロケール別フォーマット比較</h3>
            <table
              className="number-format-comparison-table"
              aria-label="ロケール別フォーマット比較"
            >
              <thead>
                <tr>
                  <th scope="col">ロケール</th>
                  <th scope="col">言語</th>
                  <th scope="col">フォーマット結果</th>
                </tr>
              </thead>
              <tbody>
                {comparisonEntries.map(({ locale: loc, name, formatted }) => (
                  <tr key={loc} className={loc === locale ? "number-format-row-highlight" : ""}>
                    <td className="number-format-locale-code">{loc}</td>
                    <td className="number-format-locale-name">{name}</td>
                    <td className="number-format-formatted-value">{formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「数値を入力」欄に数値を入力します（整数・小数・負の数に対応）",
                "ロケール・フォーマット種別・各種オプションを選択して結果を確認します",
                "「コピー」ボタンでフォーマット結果をクリップボードにコピーできます",
                "下部の比較表で全ロケールのフォーマット結果を確認できます",
              ],
            },
            {
              title: "フォーマット種別",
              items: [
                "数値（小数）: 通常の数値フォーマット（例: 1,234,567.89）",
                "通貨: 指定した通貨記号を付与してフォーマット（例: ¥1,234,568）",
                "パーセント: 0.1 → 10% のようにパーセント表記に変換",
              ],
            },
            {
              title: "コンパクト表記",
              items: [
                "「短縮」: 1000 → 1K（英語）/ 1万（日本語）のように短く表示",
                "「長表記」: 1000 → 1 thousand / 1万のように長い形式で表示",
                "パーセント形式ではコンパクト表記は適用されない場合があります",
              ],
            },
            {
              title: "使用例",
              items: [
                "日本円の金額表示: 通貨=JPY、ロケール=ja-JP",
                "米ドルの表示: 通貨=USD、ロケール=en-US",
                "パーセント表示: 0.1234 → 12.34%（maximumFractionDigits: 2）",
                "大きな数値: 1000000 → 100万（コンパクト・短縮）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
