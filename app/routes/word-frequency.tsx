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
import "../styles/tools/word-frequency.css";

export const Route = createFileRoute("/word-frequency")({
  head: () => ({
    meta: [
      { title: "単語頻度分析 | Web ツール集" },
      {
        name: "description",
        content:
          "テキスト中の単語の出現頻度を分析するツール。各単語の出現回数・割合をビジュアルバーで表示。大文字小文字・句読点・ストップワードのフィルター対応。CSV出力可能。",
      },
      { property: "og:title", content: "単語頻度分析 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキスト中の単語の出現頻度を分析するツール。各単語の出現回数・割合をビジュアルバーで表示。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/word-frequency` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "単語頻度分析 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "テキスト中の単語の出現頻度を分析するツール。各単語の出現回数・割合をビジュアルバーで表示。",
      },
    ],
  }),
  component: WordFrequencyPage,
});

/** 単語頻度分析のオプション */
export interface WordFrequencyOptions {
  /** 大文字・小文字を区別しない */
  ignoreCase: boolean;
  /** 句読点を除去してから分割する */
  ignorePunctuation: boolean;
  /** ストップワード（頻出機能語）を除外する */
  filterStopWords: boolean;
  /** 最小単語長（これ未満の単語を除外） */
  minLength: number;
}

/** 単語頻度の1エントリ */
export interface WordFrequencyEntry {
  word: string;
  count: number;
  percentage: number;
}

/** 単語頻度分析の結果 */
export interface WordFrequencyResult {
  entries: WordFrequencyEntry[];
  totalWords: number;
  uniqueWords: number;
}

/** 英語・日本語共通ストップワード */
const STOP_WORDS = new Set([
  // 英語
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "it", "its", "i",
  "you", "he", "she", "we", "they", "this", "that", "these", "those",
  "not", "no", "if", "as", "up", "so", "my", "your", "his", "her",
  "our", "their", "me", "him", "us", "them", "what", "which", "who",
  "how", "when", "where", "why", "all", "any", "each", "than", "then",
  "into", "out", "over", "after", "before", "about", "also", "just",
  // 日本語
  "の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ",
  "さ", "ある", "いる", "も", "する", "から", "な", "こと", "として",
  "い", "や", "れる", "など", "なっ", "ない", "この", "ため", "その",
  "あっ", "よう", "また", "もの", "という", "あり", "まし", "ます",
  "です", "へ", "ので", "など",
]);

/**
 * テキストを単語に分割する
 * @param text - 分割対象のテキスト
 * @param ignorePunctuation - 句読点を除去するか
 * @returns 単語の配列
 */
export function tokenizeText(
  text: string,
  ignorePunctuation: boolean
): string[] {
  if (!text.trim()) return [];

  let processed = text;
  if (ignorePunctuation) {
    // 句読点・記号を空白に変換
    processed = processed.replace(
      /[.,;:!?'"()[\]{}（）「」【】『』、。！？・…\-_/\\@#$%^&*+=|<>~`]+/g,
      " "
    );
  }

  // 空白文字で分割し、空トークンを除去
  return processed
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

/**
 * テキストの単語頻度を分析する
 * @param text - 分析対象のテキスト
 * @param options - 分析オプション
 * @returns 単語頻度の分析結果
 */
export function analyzeWordFrequency(
  text: string,
  options: WordFrequencyOptions
): WordFrequencyResult {
  if (!text.trim()) {
    return { entries: [], totalWords: 0, uniqueWords: 0 };
  }

  const tokens = tokenizeText(text, options.ignorePunctuation);
  const frequencyMap = new Map<string, number>();

  for (const token of tokens) {
    const word = options.ignoreCase ? token.toLowerCase() : token;

    if (word.length < options.minLength) continue;

    if (options.filterStopWords) {
      const lowerWord = word.toLowerCase();
      if (STOP_WORDS.has(lowerWord)) continue;
    }

    frequencyMap.set(word, (frequencyMap.get(word) ?? 0) + 1);
  }

  const totalWords = Array.from(frequencyMap.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const entries: WordFrequencyEntry[] = Array.from(
    frequencyMap.entries()
  ).map(([word, count]) => ({
    word,
    count,
    percentage: totalWords > 0 ? (count / totalWords) * 100 : 0,
  }));

  return {
    entries,
    totalWords,
    uniqueWords: frequencyMap.size,
  };
}

/** ソート方向の型 */
export type WordSortBy = "frequency" | "word";

/**
 * 単語頻度のエントリを指定の順序でソートする
 * @param entries - ソート対象のエントリ配列
 * @param sortBy - ソート基準: "frequency"（頻度降順）または "word"（単語昇順）
 * @returns ソート済みエントリ配列（元の配列は変更しない）
 */
export function sortWordEntries(
  entries: WordFrequencyEntry[],
  sortBy: WordSortBy
): WordFrequencyEntry[] {
  const copy = [...entries];
  if (sortBy === "frequency") {
    return copy.sort(
      (a, b) => b.count - a.count || a.word.localeCompare(b.word)
    );
  }
  return copy.sort((a, b) => a.word.localeCompare(b.word));
}

/**
 * 単語頻度の分析結果をCSV文字列に変換する
 * @param entries - CSV化するエントリ配列
 * @returns BOM付きCSV形式の文字列
 */
export function wordEntriesToCsv(entries: WordFrequencyEntry[]): string {
  const header = "単語,出現回数,割合(%)";
  const rows = entries.map(
    (e) =>
      `"${e.word.replace(/"/g, '""')}",${e.count},${e.percentage.toFixed(2)}`
  );
  return "\uFEFF" + [header, ...rows].join("\n");
}

/**
 * 単語頻度分析ページコンポーネント
 */
function WordFrequencyPage() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [options, setOptions] = useState<WordFrequencyOptions>({
    ignoreCase: true,
    ignorePunctuation: true,
    filterStopWords: false,
    minLength: 1,
  });
  const [sortBy, setSortBy] = useState<WordSortBy>("frequency");
  const [displayLimit, setDisplayLimit] = useState(50);

  const result = useMemo(
    () => analyzeWordFrequency(text, options),
    [text, options]
  );

  const sortedEntries = useMemo(
    () => sortWordEntries(result.entries, sortBy),
    [result.entries, sortBy]
  );

  const displayedEntries = useMemo(
    () => sortedEntries.slice(0, displayLimit),
    [sortedEntries, displayLimit]
  );

  const maxCount = sortedEntries[0]?.count ?? 1;

  const handleClear = useCallback(() => {
    setText("");
    textareaRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleOptionChange = useCallback(
    (key: keyof Omit<WordFrequencyOptions, "minLength">) => {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const handleMinLengthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>): void => {
      setOptions((prev) => ({
        ...prev,
        minLength: parseInt(e.target.value, 10),
      }));
    },
    []
  );

  const handleSortToggle = useCallback(() => {
    setSortBy((prev) => (prev === "frequency" ? "word" : "frequency"));
  }, []);

  const handleCopyAsCsv = useCallback(async () => {
    if (sortedEntries.length === 0) {
      showToast("コピーするデータがありません", "error");
      return;
    }
    try {
      const csv = wordEntriesToCsv(sortedEntries);
      await navigator.clipboard.writeText(csv);
      showToast("CSVをコピーしました", "success");
      announceStatus("CSVをクリップボードにコピーしました");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [sortedEntries, showToast, announceStatus]);

  const isEmpty = text.length === 0;
  const hasResults = sortedEntries.length > 0;
  const hasMore = sortedEntries.length > displayLimit;

  return (
    <>
      <div className="wf-container">
        {/* 入力エリア */}
        <section className="wf-section" aria-labelledby="wf-input-heading">
          <h2 id="wf-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            ref={textareaRef}
            className="input-area wf-textarea"
            placeholder="分析したいテキストを入力またはペーストしてください..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="分析対象のテキスト"
            aria-describedby="wf-input-help"
            rows={10}
          />
          <span id="wf-input-help" className="sr-only">
            テキストを入力すると単語の出現頻度が自動的に分析されます
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
        <section className="wf-section" aria-labelledby="wf-options-heading">
          <h2 id="wf-options-heading" className="section-title">
            オプション
          </h2>
          <div className="wf-options" role="group" aria-label="分析オプション">
            <label className="wf-checkbox-label">
              <input
                type="checkbox"
                className="wf-checkbox"
                checked={options.ignoreCase}
                onChange={() => handleOptionChange("ignoreCase")}
                aria-label="大文字・小文字を区別しない"
              />
              <span>大文字・小文字を区別しない</span>
            </label>
            <label className="wf-checkbox-label">
              <input
                type="checkbox"
                className="wf-checkbox"
                checked={options.ignorePunctuation}
                onChange={() => handleOptionChange("ignorePunctuation")}
                aria-label="句読点・記号を除去してから分割"
              />
              <span>句読点・記号を除去してから分割</span>
            </label>
            <label className="wf-checkbox-label">
              <input
                type="checkbox"
                className="wf-checkbox"
                checked={options.filterStopWords}
                onChange={() => handleOptionChange("filterStopWords")}
                aria-label="ストップワード（頻出機能語）を除外"
              />
              <span>ストップワードを除外（英語・日本語）</span>
            </label>
            <div className="wf-min-length-row">
              <label htmlFor="wf-min-length" className="wf-min-length-label">
                最小単語長:
              </label>
              <select
                id="wf-min-length"
                className="wf-min-length-select"
                value={options.minLength}
                onChange={handleMinLengthChange}
                aria-label="最小単語長を選択"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}文字以上
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* サマリー統計 */}
        <section
          className="wf-section"
          aria-labelledby="wf-summary-heading"
          aria-live="polite"
          aria-atomic="true"
        >
          <h2 id="wf-summary-heading" className="section-title">
            サマリー
          </h2>
          <div className="wf-summary-grid" role="region" aria-label="統計サマリー">
            <div className="wf-summary-card">
              <span className="wf-summary-label">総単語数（対象）</span>
              <span className="wf-summary-value" data-testid="total-words">
                {result.totalWords.toLocaleString()}
              </span>
            </div>
            <div className="wf-summary-card">
              <span className="wf-summary-label">ユニーク単語数</span>
              <span className="wf-summary-value" data-testid="unique-words">
                {result.uniqueWords.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* 結果テーブル */}
        <section className="wf-section" aria-labelledby="wf-results-heading">
          <div className="wf-results-header">
            <h2 id="wf-results-heading" className="section-title">
              頻度分析結果
            </h2>
            <div
              className="wf-results-actions"
              role="group"
              aria-label="結果の操作"
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleSortToggle}
                aria-label={
                  sortBy === "frequency"
                    ? "単語順に切り替え"
                    : "頻度順に切り替え"
                }
                aria-pressed={sortBy === "word"}
                data-testid="sort-toggle"
              >
                {sortBy === "frequency" ? "頻度順" : "単語順"}
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
              className="wf-empty-message"
              role="status"
              data-testid="empty-message"
            >
              {isEmpty
                ? "テキストを入力すると単語の頻度が表示されます"
                : "オプションの条件に一致する単語がありません"}
            </p>
          ) : (
            <>
              <div className="wf-table-wrapper">
                <table
                  className="wf-table"
                  aria-label="単語頻度一覧"
                  aria-rowcount={sortedEntries.length}
                >
                  <thead>
                    <tr>
                      <th scope="col" className="wf-th-rank">
                        #
                      </th>
                      <th scope="col" className="wf-th-word">
                        単語
                      </th>
                      <th scope="col" className="wf-th-count">
                        出現回数
                      </th>
                      <th scope="col" className="wf-th-percent">
                        割合
                      </th>
                      <th
                        scope="col"
                        className="wf-th-bar"
                        aria-label="頻度バー"
                      >
                        頻度バー
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEntries.map((entry, index) => {
                      const barWidthPercent = Math.round(
                        (entry.count / maxCount) * 100
                      );
                      return (
                        <tr key={entry.word} className="wf-tr">
                          <td className="wf-td-rank">
                            {sortBy === "frequency" ? index + 1 : ""}
                          </td>
                          <td className="wf-td-word">
                            <span
                              className="wf-word-display"
                              title={entry.word}
                            >
                              {entry.word}
                            </span>
                          </td>
                          <td className="wf-td-count">
                            {entry.count.toLocaleString()}
                          </td>
                          <td className="wf-td-percent">
                            {entry.percentage.toFixed(2)}%
                          </td>
                          <td className="wf-td-bar" aria-hidden="true">
                            <div className="wf-bar-wrap">
                              <div
                                className="wf-bar"
                                ref={(el) => {
                                  if (el)
                                    el.style.setProperty(
                                      "--wf-bar-width",
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
              {hasMore && (
                <div className="wf-load-more">
                  <p className="wf-showing-count">
                    {displayLimit} / {sortedEntries.length} 件表示中
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDisplayLimit((n) => n + 50)}
                    aria-label="さらに50件表示"
                  >
                    さらに表示
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テキストエリアにテキストを入力またはペーストすると、自動的に単語の出現頻度が分析されます",
                "スペース区切りで単語を認識します（英語のほか、スペース区切りの日本語テキストにも対応）",
                "「大文字・小文字を区別しない」オプションで Hello と hello を同じ単語として集計します",
                "「句読点・記号を除去してから分割」で word. や (word) を word として認識します",
                "「ストップワードを除外」で is・the・の・に などの機能語を除きます",
                "最小単語長で短い単語を除外できます",
                "「頻度順」/「単語順」ボタンで結果の並び順を切り替えられます",
                "「CSV コピー」ボタンで分析結果をCSV形式でクリップボードにコピーできます",
              ],
            },
            {
              title: "頻度バーについて",
              items: [
                "頻度バーは最も出現回数が多い単語を100%として相対的な長さで表示します",
                "割合（%）は対象単語全体に占めるその単語の比率です",
                "50件ずつ表示し、「さらに表示」ボタンで追加表示できます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
