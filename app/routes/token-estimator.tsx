import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  analyzeTokens,
  formatCost,
  getContextUsageClass,
  type TokenAnalysisResult,
} from "../utils/token-estimator";
import "../styles/tools/token-estimator.css";

export const Route = createFileRoute("/token-estimator")({
  head: () => ({
    meta: [
      { title: "LLMトークン推定 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストのLLMトークン数をリアルタイム推定するツール。GPT-4o・Claude 3.5 Sonnet・Gemini 1.5 Proなど主要モデルのトークン数とAPIコストを比較表示。日本語・英語・コード対応。",
      },
      { property: "og:title", content: "LLMトークン推定 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストのLLMトークン数をリアルタイム推定。GPT-4o・Claude 3.5 Sonnet・Gemini 1.5 Pro等の主要モデルのトークン数とAPIコストを比較。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/token-estimator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "LLMトークン推定 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "テキストのLLMトークン数をリアルタイム推定。GPT-4o・Claude 3.5 Sonnet・Gemini 1.5 Pro等の主要モデルのトークン数とAPIコストを比較。",
      },
    ],
  }),
  component: TokenEstimatorPage,
});

/** プロバイダー名からバッジクラスを返す */
function providerBadgeClass(provider: string): string {
  switch (provider.toLowerCase()) {
    case "openai":
      return "te-provider-badge te-provider-badge--openai";
    case "anthropic":
      return "te-provider-badge te-provider-badge--anthropic";
    case "google":
      return "te-provider-badge te-provider-badge--google";
    default:
      return "te-provider-badge";
  }
}

/** 文字種内訳バーコンポーネント */
function BreakdownBar({
  label,
  count,
  total,
  barClass,
}: {
  label: string;
  count: number;
  total: number;
  barClass: string;
}) {
  const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  return (
    <div className="te-breakdown-row">
      <span className="te-breakdown-label">{label}</span>
      <div className="te-breakdown-bar-track" role="presentation" aria-hidden="true">
        <div
          className={`te-breakdown-bar-fill ${barClass}`}
          style={{ "--bar-width": `${pct}%` } as React.CSSProperties}
        />
      </div>
      <span className="te-breakdown-count" aria-label={`${label}: ${count}文字`}>
        {count.toLocaleString()}
      </span>
    </div>
  );
}

/** サマリーセクション */
function SummarySection({ result }: { result: TokenAnalysisResult }) {
  return (
    <div className="converter-section">
      <h2 className="section-title">推定トークン数</h2>
      <div className="te-summary-grid">
        <div className="te-summary-card te-summary-card--primary">
          <span className="te-summary-label">推定トークン数</span>
          <span
            className="te-summary-value"
            data-testid="estimated-tokens"
            aria-label={`推定トークン数: ${result.estimatedTokens.toLocaleString()}`}
          >
            {result.estimatedTokens.toLocaleString()}
          </span>
          <span className="te-summary-sub">ヒューリスティック推定値</span>
        </div>
        <div className="te-summary-card">
          <span className="te-summary-label">総文字数</span>
          <span className="te-summary-value" data-testid="total-chars">
            {result.totalChars.toLocaleString()}
          </span>
        </div>
        <div className="te-summary-card">
          <span className="te-summary-label">単語数</span>
          <span className="te-summary-value" data-testid="word-count">
            {result.wordCount.toLocaleString()}
          </span>
          <span className="te-summary-sub">半角スペース区切り</span>
        </div>
      </div>
    </div>
  );
}

/** 文字種内訳セクション */
function BreakdownSection({ result }: { result: TokenAnalysisResult }) {
  const total = result.totalChars;
  return (
    <div className="converter-section">
      <h2 className="section-title">文字種内訳</h2>
      <div className="te-breakdown" aria-label="文字種別の内訳">
        <BreakdownBar
          label="Latin/ASCII"
          count={result.latinChars}
          total={total}
          barClass="te-breakdown-bar-fill--latin"
        />
        <BreakdownBar
          label="CJK（日中韓）"
          count={result.cjkChars}
          total={total}
          barClass="te-breakdown-bar-fill--cjk"
        />
        <BreakdownBar
          label="コード/記号"
          count={result.codeChars}
          total={total}
          barClass="te-breakdown-bar-fill--code"
        />
        <BreakdownBar
          label="その他"
          count={result.otherChars}
          total={total}
          barClass="te-breakdown-bar-fill--other"
        />
      </div>
    </div>
  );
}

/** モデル比較テーブル */
function ModelCompareTable({ result }: { result: TokenAnalysisResult }) {
  return (
    <div className="converter-section">
      <h2 className="section-title">モデル別コスト推定</h2>
      <p className="te-disclaimer">
        ※ 価格は2025年初頭時点の概算値です。実際の料金は各プロバイダーの公式サイトでご確認ください。
        トークン数はヒューリスティック推定のため実際の値と異なる場合があります。
      </p>
      <div className="te-table-wrap" role="region" aria-label="モデル別コスト比較">
        <table className="te-table" aria-label="LLMモデル別トークン・コスト比較">
          <thead>
            <tr>
              <th scope="col">モデル</th>
              <th scope="col">トークン数</th>
              <th scope="col">入力コスト</th>
              <th scope="col">コンテキスト使用率</th>
            </tr>
          </thead>
          <tbody>
            {result.modelEstimates.map(({ model, estimatedTokens, inputCost, contextUsage }) => (
              <tr key={model.name}>
                <td>
                  <span>{model.name}</span>
                  <span
                    className={providerBadgeClass(model.provider)}
                    aria-label={`プロバイダー: ${model.provider}`}
                  >
                    {model.provider}
                  </span>
                </td>
                <td data-testid={`tokens-${model.name.replace(/\s/g, "-")}`}>
                  {estimatedTokens.toLocaleString()}
                </td>
                <td className="te-cost-value">{formatCost(inputCost)}</td>
                <td>
                  <span
                    className={getContextUsageClass(contextUsage)}
                    data-testid={`ctx-${model.name.replace(/\s/g, "-")}`}
                    aria-label={`コンテキスト使用率: ${(contextUsage * 100).toFixed(1)}%`}
                  >
                    {(contextUsage * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** LLMトークン推定ページ */
function TokenEstimatorPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const [text, setText] = useState("");

  const result = useMemo<TokenAnalysisResult | null>(
    () => (text.length > 0 ? analyzeTokens(text) : null),
    [text],
  );

  const handleClear = useCallback(() => setText(""), []);

  const handleCopyResult = useCallback(async () => {
    if (!result) return;
    const lines = [
      `推定トークン数: ${result.estimatedTokens.toLocaleString()}`,
      `総文字数: ${result.totalChars.toLocaleString()}`,
      `単語数: ${result.wordCount.toLocaleString()}`,
      "",
      "モデル別コスト（入力トークン）:",
      ...result.modelEstimates.map(
        ({ model, estimatedTokens, inputCost }) =>
          `  ${model.name} (${model.provider}): ${estimatedTokens.toLocaleString()} tokens, ${formatCost(inputCost)}`,
      ),
    ];
    const success = await copy(lines.join("\n"));
    if (success) {
      showToast("結果をコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, copy, showToast]);

  return (
    <div className="te-container">
      {/* 入力 */}
      <div className="converter-section te-input-section">
        <h2 className="section-title">テキスト入力</h2>
        <Textarea
          className="input-area"
          placeholder={
            "英語例: The quick brown fox jumps over the lazy dog.\n\n日本語例: このツールはLLM APIのトークン数とコストをリアルタイムで推定します。\n\nコード例: function hello(name) { return `Hello, ${name}!`; }"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="トークン推定対象テキスト"
          rows={8}
        />
        <div className="te-char-hint" aria-live="polite" aria-atomic="true">
          {text.length.toLocaleString()} 文字
        </div>
        <div className="button-group">
          <Button
            type="button"
            variant="outline"
            className="btn-clear"
            onClick={handleClear}
            disabled={text.length === 0}
          >
            クリア
          </Button>
          {result && (
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopyResult}
            >
              結果をコピー
            </Button>
          )}
        </div>
      </div>

      {/* 結果 */}
      {!result ? (
        <div className="te-empty" aria-live="polite">
          テキストを入力するとトークン数とコスト推定が表示されます
        </div>
      ) : (
        <>
          <SummarySection result={result} />
          <BreakdownSection result={result} />
          <ModelCompareTable result={result} />
        </>
      )}

      <TipsCard
        sections={[
          {
            title: "LLMトークンとは",
            items: [
              "LLM（大規模言語モデル）はテキストをトークンという単位に分割して処理します",
              "英語では約4文字が1トークン、日本語（CJK）では約1.5文字が1トークンが目安です",
              "APIの利用料金はトークン数に基づいて計算されます（入力・出力で料金が異なります）",
              "このツールはヒューリスティック（文字種別統計）による近似推定値を表示します",
            ],
          },
          {
            title: "文字種別の特徴",
            items: [
              "Latin/ASCII: 英数字・スペース（約4文字/トークン）",
              "CJK: 漢字・ひらがな・カタカナ・ハングル（約1.5文字/トークン）",
              "コード/記号: {}()[]<>=など（約3.5文字/トークン）",
              "日本語テキストは英語テキストより多くのトークンを消費します",
            ],
          },
          {
            title: "活用例",
            items: [
              "APIコスト見積もり: プロジェクトで使用するプロンプトのコストを事前計算",
              "コンテキスト管理: モデルのコンテキストウィンドウに収まるか確認",
              "モデル比較: 同じテキストに対して各モデルのコストを比較",
              "バッチ処理計画: 大量データ処理時の総コスト概算",
            ],
          },
          {
            title: "注意事項",
            items: [
              "表示値はヒューリスティックによる推定値です。実際のトークン数と異なる場合があります",
              "正確なトークン数を得るにはtiktoken（OpenAI）等の公式トークナイザーをご利用ください",
              "価格情報は変動するため、最新情報は各プロバイダーの公式サイトをご確認ください",
              "コンテキスト使用率が90%以上になると赤色で警告表示されます",
            ],
          },
        ]}
      />
    </div>
  );
}
