import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/char-frequency")({
  head: () => ({
    meta: [
      { title: "文字頻度分析 | Web ツール集" },
      {
        name: "description",
        content:
          "テキスト中の文字の出現頻度を分析するツール。各文字の出現回数・割合をビジュアルバーで表示。大文字小文字・スペース・英数字のみなどフィルター対応。CSV出力可能。",
      },
      { property: "og:title", content: "文字頻度分析 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキスト中の文字の出現頻度を分析するツール。各文字の出現回数・割合をビジュアルバーで表示。大文字小文字・スペース・英数字のみなどフィルター対応。CSV出力可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/char-frequency` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "文字頻度分析 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "テキスト中の文字の出現頻度を分析するツール。各文字の出現回数・割合をビジュアルバーで表示。",
      },
    ],
  }),
  component: CharFrequencyPage,
});

/** 文字頻度分析のオプション */
export interface CharFrequencyOptions {
  /** 大文字・小文字を区別しない */
  ignoreCase: boolean;
  /** スペース・タブ・改行を除外する */
  ignoreSpaces: boolean;
  /** 英字・数字・かなのみを対象にする */
  lettersAndNumbersOnly: boolean;
}

/** 文字頻度の1エントリ */
export interface CharFrequencyEntry {
  char: string;
  count: number;
  percentage: number;
}

/** 文字頻度分析の結果 */
export interface CharFrequencyResult {
  entries: CharFrequencyEntry[];
  totalChars: number;
  uniqueChars: number;
}

/**
 * テキストの文字頻度を分析する
 * @param text - 分析対象のテキスト
 * @param options - 分析オプション
 * @returns 文字頻度の分析結果
 */
export function analyzeCharFrequency(
  text: string,
  options: CharFrequencyOptions
): CharFrequencyResult {
  if (!text) {
    return { entries: [], totalChars: 0, uniqueChars: 0 };
  }

  const processedText = options.ignoreCase ? text.toLowerCase() : text;
  const frequencyMap = new Map<string, number>();

  for (const char of processedText) {
    if (options.ignoreSpaces && /\s/.test(char)) {
      continue;
    }
    if (
      options.lettersAndNumbersOnly &&
      !/[a-zA-Z0-9\u3041-\u9FFF]/.test(char)
    ) {
      continue;
    }
    frequencyMap.set(char, (frequencyMap.get(char) ?? 0) + 1);
  }

  const totalChars = Array.from(frequencyMap.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const entries: CharFrequencyEntry[] = Array.from(
    frequencyMap.entries()
  ).map(([char, count]) => ({
    char,
    count,
    percentage: totalChars > 0 ? (count / totalChars) * 100 : 0,
  }));

  return {
    entries,
    totalChars,
    uniqueChars: frequencyMap.size,
  };
}

/**
 * 文字頻度のエントリを指定の順序でソートする
 * @param entries - ソート対象のエントリ配列
 * @param sortBy - ソート基準: "frequency"（頻度降順）または "char"（文字コード昇順）
 * @returns ソート済みエントリ配列（元の配列は変更しない）
 */
export function sortEntries(
  entries: CharFrequencyEntry[],
  sortBy: "frequency" | "char"
): CharFrequencyEntry[] {
  const copy = [...entries];
  if (sortBy === "frequency") {
    return copy.sort(
      (a, b) => b.count - a.count || a.char.localeCompare(b.char)
    );
  }
  return copy.sort((a, b) => a.char.localeCompare(b.char));
}

/**
 * 文字頻度の分析結果をCSV文字列に変換する
 * @param entries - CSV化するエントリ配列
 * @returns BOM付きCSV形式の文字列
 */
export function entriesToCsv(entries: CharFrequencyEntry[]): string {
  const header = "文字,出現回数,割合(%)";
  const rows = entries.map(
    (e) =>
      `"${e.char === '"' ? '""' : e.char}",${e.count},${e.percentage.toFixed(2)}`
  );
  return "\uFEFF" + [header, ...rows].join("\n");
}

/** ソート方向の型 */
type SortBy = "frequency" | "char";

/**
 * 文字頻度分析ページコンポーネント
 */
function CharFrequencyPage() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [options, setOptions] = useState<CharFrequencyOptions>({
    ignoreCase: false,
    ignoreSpaces: false,
    lettersAndNumbersOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortBy>("frequency");

  const result = useMemo(
    () => analyzeCharFrequency(text, options),
    [text, options]
  );

  const sortedEntries = useMemo(
    () => sortEntries(result.entries, sortBy),
    [result.entries, sortBy]
  );

  const maxCount = sortedEntries[0]?.count ?? 1;

  const handleClear = useCallback(() => {
    setText("");
    textareaRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleOptionChange = useCallback(
    (key: keyof CharFrequencyOptions) => {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const handleSortToggle = useCallback(() => {
    setSortBy((prev) => (prev === "frequency" ? "char" : "frequency"));
  }, []);

  const handleCopyAsCsv = useCallback(async () => {
    if (sortedEntries.length === 0) {
      showToast("コピーするデータがありません", "error");
      return;
    }
    try {
      const csv = entriesToCsv(sortedEntries);
      await navigator.clipboard.writeText(csv);
      showToast("CSVをコピーしました", "success");
      announceStatus("CSVをクリップボードにコピーしました");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [sortedEntries, showToast, announceStatus]);

  const isEmpty = text.length === 0;
  const hasResults = sortedEntries.length > 0;

  return (
    <>
      <div className="cf-container">
        {/* 入力エリア */}
        <section className="cf-section" aria-labelledby="cf-input-heading">
          <h2 id="cf-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            ref={textareaRef}
            className="input-area cf-textarea"
            placeholder="分析したいテキストを入力またはペーストしてください..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="分析対象のテキスト"
            aria-describedby="cf-input-help"
            rows={10}
          />
          <span id="cf-input-help" className="sr-only">
            テキストを入力すると文字の出現頻度が自動的に分析されます
          </span>
          <div className="button-group" role="group" aria-label="テキスト操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="入力テキストをクリア"
            >
              クリア
            </Button>
          </div>
        </section>

        {/* オプション */}
        <section className="cf-section" aria-labelledby="cf-options-heading">
          <h2 id="cf-options-heading" className="section-title">
            オプション
          </h2>
          <div className="cf-options" role="group" aria-label="分析オプション">
            <label className="cf-checkbox-label">
              <input
                type="checkbox"
                className="cf-checkbox"
                checked={options.ignoreCase}
                onChange={() => handleOptionChange("ignoreCase")}
                aria-label="大文字・小文字を区別しない"
              />
              <span>大文字・小文字を区別しない</span>
            </label>
            <label className="cf-checkbox-label">
              <input
                type="checkbox"
                className="cf-checkbox"
                checked={options.ignoreSpaces}
                onChange={() => handleOptionChange("ignoreSpaces")}
                aria-label="スペース・改行を除外"
              />
              <span>スペース・改行を除外</span>
            </label>
            <label className="cf-checkbox-label">
              <input
                type="checkbox"
                className="cf-checkbox"
                checked={options.lettersAndNumbersOnly}
                onChange={() => handleOptionChange("lettersAndNumbersOnly")}
                aria-label="英字・数字・かなのみ対象"
              />
              <span>英字・数字・かなのみ対象</span>
            </label>
          </div>
        </section>

        {/* サマリー統計 */}
        <section
          className="cf-section"
          aria-labelledby="cf-summary-heading"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2 id="cf-summary-heading" className="section-title">
            サマリー
          </h2>
          <div className="cf-summary-grid" role="region" aria-label="統計サマリー">
            <div className="cf-summary-card">
              <span className="cf-summary-label">総文字数（対象）</span>
              <span className="cf-summary-value" data-testid="total-chars">
                {result.totalChars.toLocaleString()}
              </span>
            </div>
            <div className="cf-summary-card">
              <span className="cf-summary-label">ユニーク文字数</span>
              <span className="cf-summary-value" data-testid="unique-chars">
                {result.uniqueChars.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* 結果テーブル */}
        <section className="cf-section" aria-labelledby="cf-results-heading">
          <div className="cf-results-header">
            <h2 id="cf-results-heading" className="section-title">
              頻度分析結果
            </h2>
            <div
              className="cf-results-actions"
              role="group"
              aria-label="結果の操作"
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleSortToggle}
                aria-label={
                  sortBy === "frequency"
                    ? "文字コード順に切り替え"
                    : "頻度順に切り替え"
                }
                aria-pressed={sortBy === "char"}
                data-testid="sort-toggle"
              >
                {sortBy === "frequency" ? "頻度順" : "文字順"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAsCsv}
                disabled={!hasResults}
                aria-label="結果をCSVとしてクリップボードにコピー"
                data-testid="copy-csv-button"
              >
                CSV コピー
              </Button>
            </div>
          </div>

          {!hasResults ? (
            <p
              className="cf-empty-message"
              role="status"
              data-testid="empty-message"
            >
              {isEmpty
                ? "テキストを入力すると文字の頻度が表示されます"
                : "オプションの条件に一致する文字がありません"}
            </p>
          ) : (
            <div className="cf-table-wrapper">
              <table
                className="cf-table"
                aria-label="文字頻度一覧"
                aria-rowcount={sortedEntries.length}
              >
                <thead>
                  <tr>
                    <th scope="col" className="cf-th-char">
                      文字
                    </th>
                    <th scope="col" className="cf-th-count">
                      出現回数
                    </th>
                    <th scope="col" className="cf-th-percent">
                      割合
                    </th>
                    <th scope="col" className="cf-th-bar" aria-label="頻度バー">
                      頻度バー
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => {
                    const barWidthPercent = Math.round(
                      (entry.count / maxCount) * 100
                    );
                    return (
                      <tr key={entry.char} className="cf-tr">
                        <td className="cf-td-char">
                          <span
                            className="cf-char-display"
                            aria-label={
                              entry.char === " "
                                ? "スペース"
                                : entry.char === "\n"
                                  ? "改行"
                                  : entry.char === "\t"
                                    ? "タブ"
                                    : entry.char
                            }
                          >
                            {entry.char === " "
                              ? "␣"
                              : entry.char === "\n"
                                ? "↵"
                                : entry.char === "\t"
                                  ? "→"
                                  : entry.char}
                          </span>
                        </td>
                        <td className="cf-td-count">
                          {entry.count.toLocaleString()}
                        </td>
                        <td className="cf-td-percent">
                          {entry.percentage.toFixed(2)}%
                        </td>
                        <td className="cf-td-bar" aria-hidden="true">
                          <div className="cf-bar-wrap">
                            <div
                              className="cf-bar"
                              ref={(el) => {
                                if (el)
                                  el.style.setProperty(
                                    "--cf-bar-width",
                                    `${barWidthPercent}%`
                                  );
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テキストエリアにテキストを入力またはペーストすると、自動的に文字の出現頻度が分析されます",
                "「大文字・小文字を区別しない」オプションを有効にすると、A と a を同じ文字として集計します",
                "「スペース・改行を除外」オプションで空白文字を分析対象から除きます",
                "「英字・数字・かなのみ対象」オプションで記号などを除外できます",
                "「頻度順」/「文字順」ボタンで結果の並び順を切り替えられます",
                "「CSV コピー」ボタンで分析結果をCSV形式でクリップボードにコピーできます",
              ],
            },
            {
              title: "頻度バーについて",
              items: [
                "頻度バーは最も出現回数が多い文字を100%として相対的な長さで表示します",
                "割合（%）は対象文字全体に占めるその文字の比率です",
                "スペースは「␣」、改行は「↵」、タブは「→」と表示されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
