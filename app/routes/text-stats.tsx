import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  analyzeText,
  formatReadingTime,
} from "../utils/text-stats";

export const Route = createFileRoute("/text-stats")({
  head: () => ({
    meta: [
      { title: "テキスト統計・分析 | Web ツール集" },
      { name: "description", content: "テキストの詳細な統計情報（単語数・文章数・段落数・読書時間・頻出単語など）をリアルタイムで分析するツール。" },
      { property: "og:title", content: "テキスト統計・分析 | Web ツール集" },
      { property: "og:description", content: "テキストの詳細な統計情報（単語数・文章数・段落数・読書時間・頻出単語など）をリアルタイムで分析するツール。" },
      { property: "og:url", content: `${SITE_BASE_URL}/text-stats` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "テキスト統計・分析 | Web ツール集" },
      { name: "twitter:description", content: "テキストの詳細な統計情報（単語数・文章数・段落数・読書時間・頻出単語など）をリアルタイムで分析するツール。" },
    ],
  }),
  component: TextStatsPage,
});

/** 統計カードのデータ型 */
interface StatCard {
  label: string;
  value: string;
  testId: string;
  description?: string;
}

function TextStatsPage() {
  const [text, setText] = useState("");

  const stats = useMemo(() => analyzeText(text), [text]);

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  const isEmpty = text.length === 0;

  const basicStats: StatCard[] = [
    {
      label: "文字数",
      value: stats.charCount.toLocaleString(),
      testId: "char-count",
      description: "スペース含む",
    },
    {
      label: "文字数",
      value: stats.charCountNoSpaces.toLocaleString(),
      testId: "char-count-no-spaces",
      description: "スペース除く",
    },
    {
      label: "単語数",
      value: stats.wordCount.toLocaleString(),
      testId: "word-count",
    },
    {
      label: "文章数",
      value: stats.sentenceCount.toLocaleString(),
      testId: "sentence-count",
    },
    {
      label: "段落数",
      value: stats.paragraphCount.toLocaleString(),
      testId: "paragraph-count",
    },
    {
      label: "行数",
      value: stats.lineCount.toLocaleString(),
      testId: "line-count",
    },
  ];

  const advancedStats: StatCard[] = [
    {
      label: "読書時間",
      value: formatReadingTime(stats.readingTimeSeconds),
      testId: "reading-time",
      description: "200 WPM 基準",
    },
    {
      label: "ユニーク単語",
      value: stats.uniqueWordCount.toLocaleString(),
      testId: "unique-word-count",
    },
    {
      label: "平均単語長",
      value: stats.averageWordLength > 0 ? `${stats.averageWordLength} 文字` : "—",
      testId: "avg-word-length",
    },
    {
      label: "平均文長",
      value: stats.averageSentenceLength > 0 ? `${stats.averageSentenceLength} 語` : "—",
      testId: "avg-sentence-length",
    },
  ];

  const maxTopWordCount = stats.topWords[0]?.count ?? 1;

  return (
    <>
      <div className="tool-container">
        {/* 入力エリア */}
        <div className="converter-section ts-input-section">
          <h2 className="section-title">テキスト入力</h2>
          <Textarea
            className="input-area ts-textarea"
            placeholder="分析したいテキストを入力してください..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="分析対象のテキスト"
            rows={10}
          />
          <div className="button-group" role="group" aria-label="テキスト操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={isEmpty}
            >
              クリア
            </Button>
          </div>
        </div>

        {/* 基本統計 */}
        <div className="converter-section">
          <h2 className="section-title">基本統計</h2>
          <div
            className="ts-stats-grid"
            role="region"
            aria-label="基本統計"
            aria-live="polite"
            aria-atomic="true"
          >
            {basicStats.map((stat) => (
              <div key={stat.testId} className="ts-stat-card">
                <span className="ts-stat-label">{stat.label}</span>
                <span
                  className="ts-stat-value"
                  data-testid={stat.testId}
                >
                  {stat.value}
                </span>
                {stat.description && (
                  <span className="ts-stat-desc">{stat.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 詳細分析 */}
        <div className="converter-section">
          <h2 className="section-title">詳細分析</h2>
          <div
            className="ts-stats-grid ts-stats-grid--advanced"
            role="region"
            aria-label="詳細分析"
            aria-live="polite"
            aria-atomic="true"
          >
            {advancedStats.map((stat) => (
              <div key={stat.testId} className="ts-stat-card ts-stat-card--primary">
                <span className="ts-stat-label">{stat.label}</span>
                <span
                  className="ts-stat-value ts-stat-value--large"
                  data-testid={stat.testId}
                >
                  {stat.value}
                </span>
                {stat.description && (
                  <span className="ts-stat-desc">{stat.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 頻出単語 */}
        <div className="converter-section">
          <h2 className="section-title">
            頻出単語
            <span className="ts-badge">Top 10</span>
          </h2>
          {stats.topWords.length === 0 ? (
            <p className="ts-empty-message" data-testid="top-words-empty">
              テキストを入力すると頻出単語が表示されます
            </p>
          ) : (
            <ol
              className="ts-word-list"
              aria-label="頻出単語ランキング"
              data-testid="top-words-list"
            >
              {stats.topWords.map(({ word, count }, index) => {
                const widthPercent = Math.round((count / maxTopWordCount) * 100);
                return (
                  <li key={word} className="ts-word-item">
                    <span className="ts-word-rank" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="ts-word-text">{word}</span>
                    <div className="ts-word-bar-wrap" aria-hidden="true">
                      <div
                        className="ts-word-bar"
                        style={{ '--ts-bar-width': `${widthPercent}%` } as React.CSSProperties}
                      />
                    </div>
                    <span className="ts-word-count" aria-label={`${count}回`}>
                      {count}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "テキスト統計・分析とは",
              items: [
                "テキストの文字数・単語数・文章数・段落数をリアルタイムで分析します",
                "読書時間は平均読書速度（200 WPM）を基に推定します",
                "頻出単語は英語のストップワード（a, the, is など）を除外してランキング表示します",
              ],
            },
            {
              title: "使い方",
              items: [
                "テキストエリアにテキストを入力すると、自動的に分析されます",
                "日本語・英語・混在テキストに対応しています",
                "「クリア」ボタンで入力内容をリセットできます",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
