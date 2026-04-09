import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { calculateSimilarity, type SimilarityResult } from "../utils/string-similarity";

export const Route = createFileRoute("/string-similarity")({
  head: () => ({
    meta: [
      { title: "文字列類似度計算 | Web ツール集" },
      {
        name: "description",
        content:
          "Levenshtein距離・Jaro-Winkler・コサイン類似度・Hamming距離で2つの文字列の類似度をリアルタイム計算。スペルチェック・ファジー検索・NLP用途に便利。ブラウザ内完結。",
      },
      {
        property: "og:title",
        content: "文字列類似度計算 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Levenshtein距離・Jaro-Winkler・コサイン類似度・Hamming距離で2つの文字列の類似度を計算するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/string-similarity` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "文字列類似度計算 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Levenshtein距離・Jaro-Winkler・コサイン類似度・Hamming距離で2つの文字列の類似度をリアルタイム計算。",
      },
    ],
  }),
  component: StringSimilarityTool,
});

/** スコアバーの色クラスを返す */
function barColorClass(score: number): string {
  if (score >= 0.75) return "high";
  if (score >= 0.4) return "mid";
  return "low";
}

/** パーセント表示（小数第1位まで） */
function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

interface MetricCardProps {
  label: string;
  value: number | null;
  /** 0〜1 の正規化スコア（バー表示用） */
  score: number | null;
  sub?: string;
  isDistance?: boolean;
}

/**
 * 個別指標カード
 */
function MetricCard({ label, value, score, sub, isDistance }: MetricCardProps) {
  const displayValue = value === null ? null : isDistance ? String(value) : toPercent(value);

  return (
    <div className="strsim-metric-card">
      <div className="strsim-metric-label">{label}</div>
      {displayValue !== null ? (
        <>
          <div className="strsim-metric-value">{displayValue}</div>
          {sub && <div className="strsim-metric-sub">{sub}</div>}
          {score !== null && !isDistance && (
            <div className="strsim-bar-wrapper">
              <div className="strsim-bar-track" role="presentation">
                <div
                  className={`strsim-bar-fill ${barColorClass(score)}`}
                  style={{ width: `${Math.round(score * 100)}%` }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="strsim-metric-na">—（文字列長が異なるため非対応）</div>
      )}
    </div>
  );
}

/**
 * 文字列類似度計算ツール
 */
function StringSimilarityTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [strA, setStrA] = useState("");
  const [strB, setStrB] = useState("");

  const result = useMemo<SimilarityResult | null>(() => {
    if (!strA && !strB) return null;
    return calculateSimilarity(strA, strB);
  }, [strA, strB]);

  const isIdentical = strA !== "" && strA === strB;
  const hasInput = strA !== "" || strB !== "";

  const handleClear = () => {
    setStrA("");
    setStrB("");
    announceStatus("入力をクリアしました");
  };

  const handleCopyResult = async () => {
    if (!result) return;
    const lines = [
      `文字列A: ${strA}`,
      `文字列B: ${strB}`,
      `Levenshtein距離: ${result.levenshteinDistance}`,
      `Levenshtein類似度: ${toPercent(result.levenshteinSimilarity)}`,
      `Jaro-Winkler類似度: ${toPercent(result.jaroWinkler)}`,
      `コサイン類似度(bigram): ${toPercent(result.cosine)}`,
      result.hammingDistance !== null
        ? `Hamming距離: ${result.hammingDistance}`
        : "Hamming距離: 非対応（長さ異なる）",
    ];
    const success = await copy(lines.join("\n"));
    if (success) {
      showToast("計算結果をコピーしました", "success");
      announceStatus("計算結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  return (
    <>
      <div className="strsim-container">
        {/* 入力セクション */}
        <section className="strsim-input-section" aria-labelledby="strsim-heading">
          <h2 id="strsim-heading" className="section-title">
            文字列類似度計算
          </h2>

          <div className="strsim-inputs">
            <div className="strsim-input-field">
              <label htmlFor="strsim-input-a" className="strsim-input-label">
                文字列 A
              </label>
              <input
                id="strsim-input-a"
                type="text"
                className="strsim-input"
                value={strA}
                onChange={(e) => setStrA(e.target.value)}
                placeholder="例: kitten"
                aria-label="比較元の文字列"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="strsim-input-field">
              <label htmlFor="strsim-input-b" className="strsim-input-label">
                文字列 B
              </label>
              <input
                id="strsim-input-b"
                type="text"
                className="strsim-input"
                value={strB}
                onChange={(e) => setStrB(e.target.value)}
                placeholder="例: sitting"
                aria-label="比較先の文字列"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!hasInput}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
            {result && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopyResult}
                aria-label="計算結果をコピー"
              >
                結果をコピー
              </Button>
            )}
          </div>
        </section>

        {/* 結果セクション */}
        <section
          className="strsim-results-section"
          aria-labelledby="strsim-results-heading"
          aria-live="polite"
        >
          <h3 id="strsim-results-heading" className="section-title">
            類似度指標
          </h3>

          {!hasInput ? (
            <div className="strsim-empty-state" aria-label="入力待ち">
              文字列 A・B を入力すると各指標をリアルタイムで計算します
            </div>
          ) : isIdentical ? (
            <div className="strsim-identical-banner" role="status">
              <span aria-hidden="true">✓</span>
              完全一致 — 2つの文字列は同一です
            </div>
          ) : result ? (
            <div className="strsim-metrics-grid">
              <MetricCard
                label="Levenshtein 類似度"
                value={result.levenshteinSimilarity}
                score={result.levenshteinSimilarity}
                sub={`編集距離: ${result.levenshteinDistance} 操作`}
              />
              <MetricCard
                label="Jaro-Winkler 類似度"
                value={result.jaroWinkler}
                score={result.jaroWinkler}
                sub="プレフィックス補正あり"
              />
              <MetricCard
                label="コサイン類似度（bigram）"
                value={result.cosine}
                score={result.cosine}
                sub="文字 2-gram ベクトル"
              />
              <MetricCard
                label="Levenshtein 編集距離"
                value={result.levenshteinDistance}
                score={result.levenshteinSimilarity}
                isDistance={true}
                sub="挿入・削除・置換の最小回数"
              />
              <MetricCard
                label="Hamming 距離"
                value={result.hammingDistance}
                score={result.hammingSimilarity !== null ? result.hammingSimilarity : null}
                isDistance={true}
                sub={
                  result.hammingDistance !== null
                    ? `類似度: ${toPercent(result.hammingSimilarity!)}`
                    : undefined
                }
              />
            </div>
          ) : null}
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「文字列 A」と「文字列 B」に比較したいテキストを入力してください",
                "入力と同時にすべての類似度指標がリアルタイムで計算されます",
                "「結果をコピー」ボタンで全指標をテキストとしてコピーできます",
              ],
            },
            {
              title: "Levenshtein距離",
              items: [
                "一方の文字列をもう一方に変換するのに必要な最小の編集操作数",
                "編集操作: 1文字の挿入・削除・置換",
                "「kitten」→「sitting」は距離 3（k→s, e→i, n の後 g 挿入）",
                "正規化類似度 = 1 − 距離 ÷ max(長さA, 長さB)",
              ],
            },
            {
              title: "Jaro-Winkler類似度",
              items: [
                "Jaro類似度をベースに、共通プレフィックスが長いほど加点する指標",
                "0〜1 の値で、1が完全一致",
                "人名や短い文字列の照合に特に適している",
                "スペルミス検出や名寄せ（レコードリンケージ）に広く使われる",
              ],
            },
            {
              title: "コサイン類似度（bigram）",
              items: [
                "文字列を 2-gram（2文字の組み合わせ）の出現ベクトルに変換して計算",
                "語順に依存せず、文字の共通パターンを評価する",
                "「abc」の bigram は {ab, bc}、「bcd」は {bc, cd}",
                "自然言語処理・文書類似度検索に活用される手法",
              ],
            },
            {
              title: "Hamming距離",
              items: [
                "同じ長さの文字列で、同じ位置にある異なる文字の数",
                '文字列の長さが異なる場合は計算不可（"—" と表示）',
                "通信のエラー検出・DNAシーケンス比較に使われる",
                '例: "ABCDE" と "ABXYE" の Hamming距離 = 2',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
