import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/entropy")({
  head: () => ({
    meta: [
      { title: "シャノンエントロピー計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストのシャノンエントロピーを計算します。文字の出現頻度から情報量（ビット/文字）を算出し、テキストのランダム性・予測可能性を可視化します。",
      },
      {
        property: "og:title",
        content: "シャノンエントロピー計算機 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストのシャノンエントロピーを計算します。文字の出現頻度から情報量（ビット/文字）を算出します。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/entropy` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "シャノンエントロピー計算機 | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストのシャノンエントロピーを計算。文字頻度から情報量を算出します。",
      },
    ],
  }),
  component: EntropyCalculator,
});

/** 文字頻度エントリ */
interface CharFrequency {
  char: string;
  count: number;
  probability: number;
  bits: number;
}

/** エントロピー計算結果 */
export interface EntropyResult {
  entropy: number;
  totalBits: number;
  charCount: number;
  uniqueChars: number;
  maxEntropy: number;
  normalized: number;
  frequencies: CharFrequency[];
}

/**
 * テキストのシャノンエントロピーを計算する
 * @param text - 計算対象のテキスト
 * @returns エントロピー計算結果、空文字列の場合はnull
 */
export function calcEntropy(text: string): EntropyResult | null {
  if (!text) return null;

  const freq = new Map<string, number>();
  for (const ch of text) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  const n = text.length;
  let entropy = 0;

  const frequencies: CharFrequency[] = [];
  for (const [char, count] of freq) {
    const p = count / n;
    const bits = -Math.log2(p);
    entropy += p * bits;
    frequencies.push({ char, count, probability: p, bits });
  }

  frequencies.sort((a, b) => b.count - a.count);

  const uniqueChars = freq.size;
  const maxEntropy = uniqueChars > 1 ? Math.log2(uniqueChars) : 0;
  const normalized = maxEntropy > 0 ? entropy / maxEntropy : 1;

  return {
    entropy,
    totalBits: entropy * n,
    charCount: n,
    uniqueChars,
    maxEntropy,
    normalized,
    frequencies,
  };
}

/**
 * エントロピーレベルのラベルと CSS クラスを返す
 * @param normalized - 正規化エントロピー（0〜1）
 */
export function getEntropyLevel(normalized: number): {
  label: string;
  cls: string;
} {
  if (normalized >= 0.8) return { label: "高（ランダム性が高い）", cls: "entropy-level--high" };
  if (normalized >= 0.5) return { label: "中（適度な多様性）", cls: "entropy-level--medium" };
  return { label: "低（繰り返しが多い）", cls: "entropy-level--low" };
}

/** 表示する文字エスケープ（制御文字など） */
function displayChar(ch: string): string {
  if (ch === " ") return "␣";
  if (ch === "\n") return "↵";
  if (ch === "\t") return "⇥";
  if (ch === "\r") return "CR";
  const code = ch.charCodeAt(0);
  if (code < 32 || code === 127) return `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  return ch;
}

const SAMPLE_TEXTS = [
  { label: "ランダム文字列", text: "aX3#kQ9!mZ2@pL7$nR4%vW8^bY1&cS6*tU5(jH0)" },
  { label: "繰り返し文字列", text: "aaabbbaaabbbaaabbbaaabbbaaabbb" },
  { label: "英文（低エントロピー）", text: "the quick brown fox jumps over the lazy dog" },
  { label: "日本語テキスト", text: "吾輩は猫である。名前はまだない。" },
];

/**
 * シャノンエントロピー計算機コンポーネント
 */
function EntropyCalculator() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const [input, setInput] = useState("");
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(() => calcEntropy(input), [input]);

  const level = useMemo(() => (result ? getEntropyLevel(result.normalized) : null), [result]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast, announceStatus],
  );

  const handleSample = useCallback(
    (text: string) => {
      setInput(text);
      setShowAll(false);
      announceStatus("サンプルテキストを設定しました");
    },
    [announceStatus],
  );

  const displayFreqs = showAll ? result?.frequencies : result?.frequencies.slice(0, 10);

  return (
    <>
      <div className="tool-container">
        {/* サンプルボタン */}
        <div className="entropy-samples" role="group" aria-label="サンプルテキスト選択">
          <span className="entropy-samples-label">サンプル：</span>
          {SAMPLE_TEXTS.map(({ label, text }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              className="entropy-sample-btn"
              onClick={() => handleSample(text)}
              aria-label={`サンプル「${label}」を入力`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* テキスト入力 */}
        <div className="entropy-input-section">
          <label htmlFor="entropy-input" className="entropy-input-label">
            テキストを入力
          </label>
          <textarea
            id="entropy-input"
            className="entropy-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="エントロピーを計算したいテキストを入力してください..."
            rows={6}
            aria-label="エントロピー計算対象のテキスト"
            aria-describedby="entropy-input-help"
          />
          <span id="entropy-input-help" className="sr-only">
            テキストを入力すると自動的にシャノンエントロピーを計算します
          </span>
        </div>

        {/* 結果 */}
        {result && level && (
          <div aria-live="polite" aria-label="エントロピー計算結果">
            {/* 主要指標カード */}
            <div className="entropy-stats-grid">
              <div className="entropy-stat-card entropy-stat-card--primary">
                <span className="entropy-stat-label">エントロピー</span>
                <span className="entropy-stat-value">{result.entropy.toFixed(4)}</span>
                <span className="entropy-stat-unit">bits/文字</span>
              </div>
              <div className="entropy-stat-card">
                <span className="entropy-stat-label">合計情報量</span>
                <span className="entropy-stat-value">{result.totalBits.toFixed(2)}</span>
                <span className="entropy-stat-unit">bits</span>
              </div>
              <div className="entropy-stat-card">
                <span className="entropy-stat-label">文字数</span>
                <span className="entropy-stat-value">{result.charCount.toLocaleString()}</span>
                <span className="entropy-stat-unit">文字</span>
              </div>
              <div className="entropy-stat-card">
                <span className="entropy-stat-label">ユニーク文字数</span>
                <span className="entropy-stat-value">{result.uniqueChars}</span>
                <span className="entropy-stat-unit">種類</span>
              </div>
              <div className="entropy-stat-card">
                <span className="entropy-stat-label">最大エントロピー</span>
                <span className="entropy-stat-value">{result.maxEntropy.toFixed(4)}</span>
                <span className="entropy-stat-unit">bits/文字</span>
              </div>
              <div className="entropy-stat-card">
                <span className="entropy-stat-label">正規化エントロピー</span>
                <span className="entropy-stat-value">{(result.normalized * 100).toFixed(1)}%</span>
                <span className="entropy-stat-unit">（0〜100%）</span>
              </div>
            </div>

            {/* エントロピーレベルゲージ */}
            <div className="entropy-level-section" aria-label="エントロピーレベル">
              <div className="entropy-level-header">
                <span className="entropy-level-title">ランダム性レベル</span>
                <span className={`entropy-level-badge ${level.cls}`}>{level.label}</span>
              </div>
              <div
                className="entropy-gauge"
                role="progressbar"
                aria-valuenow={Math.round(result.normalized * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`正規化エントロピー ${Math.round(result.normalized * 100)}%`}
              >
                <div
                  className={`entropy-gauge-fill ${level.cls}`}
                  style={{ width: `${result.normalized * 100}%` } as React.CSSProperties}
                />
              </div>
              <div className="entropy-gauge-labels" aria-hidden="true">
                <span>低（規則的）</span>
                <span>高（ランダム）</span>
              </div>
            </div>

            {/* コピーボタン */}
            <div className="entropy-copy-row">
              <Button
                type="button"
                variant="outline"
                className="entropy-copy-btn"
                onClick={() =>
                  handleCopy(
                    `エントロピー: ${result.entropy.toFixed(4)} bits/文字\n合計情報量: ${result.totalBits.toFixed(2)} bits\n文字数: ${result.charCount}\nユニーク文字数: ${result.uniqueChars}\n最大エントロピー: ${result.maxEntropy.toFixed(4)} bits/文字\n正規化: ${(result.normalized * 100).toFixed(1)}%`,
                    "計算結果",
                  )
                }
                aria-label="計算結果をコピー"
              >
                結果をコピー
              </Button>
            </div>

            {/* 文字頻度テーブル */}
            <section className="entropy-freq-section" aria-labelledby="entropy-freq-heading">
              <h2 id="entropy-freq-heading" className="section-title">
                文字出現頻度
              </h2>
              <div className="entropy-table-wrapper">
                <table className="entropy-table" aria-label="文字出現頻度テーブル">
                  <thead>
                    <tr>
                      <th scope="col">文字</th>
                      <th scope="col">出現回数</th>
                      <th scope="col">確率</th>
                      <th scope="col">情報量（bits）</th>
                      <th scope="col">頻度バー</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFreqs?.map(({ char, count, probability, bits }) => (
                      <tr key={char}>
                        <td className="entropy-table-char">{displayChar(char)}</td>
                        <td className="entropy-table-num">{count}</td>
                        <td className="entropy-table-num">{(probability * 100).toFixed(2)}%</td>
                        <td className="entropy-table-num">{bits.toFixed(4)}</td>
                        <td className="entropy-table-bar-cell">
                          <div
                            className="entropy-freq-bar"
                            style={
                              { "--bar-width": `${probability * 100}%` } as React.CSSProperties
                            }
                            aria-hidden="true"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.frequencies.length > 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="entropy-show-more-btn"
                  onClick={() => setShowAll((v) => !v)}
                  aria-expanded={showAll}
                  aria-controls="entropy-freq-table"
                >
                  {showAll ? "折りたたむ" : `さらに ${result.frequencies.length - 10} 文字を表示`}
                </Button>
              )}
            </section>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "シャノンエントロピーとは",
              items: [
                "情報理論で定義された、データのランダム性・情報量の指標です",
                "H = -Σ p(x) × log₂(p(x)) で計算されます（p(x) は各文字の出現確率）",
                "単位は「bits/文字」で、1文字あたり平均何ビットの情報を持つかを示します",
                "すべての文字が均等に出現するとき最大値（log₂(ユニーク文字数)）になります",
                "同じ文字ばかりのテキストはエントロピー 0（情報量なし）になります",
              ],
            },
            {
              title: "活用例",
              items: [
                "パスワード強度の評価：エントロピーが高いほど解読が困難",
                "暗号化の品質確認：良い暗号文はランダムに見え、高エントロピーになります",
                "テキストの圧縮効率の見積もり：低エントロピーほど圧縮しやすい",
                "自然言語の特性分析：英語は約 4.5〜5 bits/文字 が目安です",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
