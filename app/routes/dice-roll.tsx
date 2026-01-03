import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/dice-roll")({
  head: () => ({
    meta: [{ title: "ダイスロールツール" }],
  }),
  component: DiceRoll,
});

/**
 * サイコロをロールする関数
 * @param sides - サイコロの面数（2以上の整数）
 * @returns 1からsidesまでのランダムな整数
 * @example
 * // 6面サイコロをロール
 * const result = rollDice(6); // 1-6のいずれかの値
 */
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * ロール履歴の型定義
 */
interface RollHistory {
  /** ロールの設定 (例: "2d6") */
  notation: string;
  /** 各サイコロの出目 */
  results: number[];
  /** 合計値 */
  total: number;
  /** タイムスタンプ */
  timestamp: number;
}

/**
 * ダイスロールページコンポーネント
 * TRPG（テーブルトークRPG）やボードゲームで使用するサイコロをシミュレートする機能を提供します。
 *
 * 主な機能:
 * - サイコロの個数（1-100個）と面数（2-1000面）を自由に設定可能
 * - D4/D6/D8/D10/D12/D20/D100のプリセットボタン
 * - 各サイコロの出目と合計値の表示
 * - ロール結果のコピー機能
 * - 過去10件のロール履歴表示
 * - Material Design 3準拠のUI
 * - WCAGアクセシビリティ対応
 *
 * @returns ダイスロールページのReactコンポーネント
 */
function DiceRoll() {
  const [diceCount, setDiceCount] = useState(1);
  const [diceSides, setDiceSides] = useState(6);
  const [currentRoll, setCurrentRoll] = useState<number[] | null>(null);
  const [rollHistory, setRollHistory] = useState<RollHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleRoll = useCallback(() => {
    const results: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      results.push(rollDice(diceSides));
    }
    setCurrentRoll(results);

    const total = results.reduce((sum, value) => sum + value, 0);
    const notation = `${diceCount}d${diceSides}`;

    setRollHistory((prev) => [
      {
        notation,
        results,
        total,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 9), // 最大10件まで保持
    ]);

    announceStatus(
      `${notation}をロールしました。結果: ${results.join(", ")}。合計: ${total}`
    );
  }, [diceCount, diceSides, announceStatus]);

  const handleCopyResult = useCallback(async () => {
    if (!currentRoll) return;
    const total = currentRoll.reduce((sum, value) => sum + value, 0);
    const notation = `${diceCount}d${diceSides}`;
    const text = `${notation}: ${currentRoll.join(" + ")} = ${total}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      announceStatus("結果をコピーしました");
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
    }
  }, [currentRoll, diceCount, diceSides, copyToClipboard, announceStatus]);

  const handleClearHistory = useCallback(() => {
    setRollHistory([]);
    announceStatus("履歴をクリアしました");
  }, [announceStatus]);

  const presetDice = [
    { sides: 4, label: "D4" },
    { sides: 6, label: "D6" },
    { sides: 8, label: "D8" },
    { sides: 10, label: "D10" },
    { sides: 12, label: "D12" },
    { sides: 20, label: "D20" },
    { sides: 100, label: "D100" },
  ];

  const total = currentRoll
    ? currentRoll.reduce((sum, value) => sum + value, 0)
    : 0;

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRoll();
          }}
          aria-label="ダイスロールフォーム"
        >
          <div className="converter-section">
            <h2 className="section-title">ダイスロール設定</h2>

            <div className="dice-settings">
              <div className="option-group">
                <label htmlFor="dice-count">サイコロの数:</label>
                <input
                  type="number"
                  id="dice-count"
                  min="1"
                  max="100"
                  value={diceCount}
                  onChange={(e) =>
                    setDiceCount(
                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                    )
                  }
                  aria-describedby="count-help"
                />
                <span id="count-help" className="sr-only">
                  1から100の間でサイコロの数を指定できます
                </span>
              </div>

              <div className="option-group">
                <label htmlFor="dice-sides">面数:</label>
                <input
                  type="number"
                  id="dice-sides"
                  min="2"
                  max="1000"
                  value={diceSides}
                  onChange={(e) =>
                    setDiceSides(
                      Math.max(2, Math.min(1000, parseInt(e.target.value) || 6))
                    )
                  }
                  aria-describedby="sides-help"
                />
                <span id="sides-help" className="sr-only">
                  2から1000の間でサイコロの面数を指定できます
                </span>
              </div>

              <div className="dice-notation">
                <span className="notation-label">表記:</span>
                <code className="notation-value">
                  {diceCount}d{diceSides}
                </code>
              </div>
            </div>

            <div className="preset-dice">
              <label>プリセット:</label>
              <div className="preset-buttons" role="group" aria-label="プリセットサイコロ">
                {presetDice.map((preset) => (
                  <button
                    key={preset.sides}
                    type="button"
                    className={`btn-preset ${diceSides === preset.sides ? "active" : ""}`}
                    onClick={() => setDiceSides(preset.sides)}
                    aria-pressed={diceSides === preset.sides}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="button-group" role="group" aria-label="ダイスロール操作">
              <Button type="submit" className="btn-large">
                ロール
              </Button>
            </div>
          </div>

          {currentRoll && (
            <div className="converter-section">
              <div className="result-header">
                <h2 className="section-title">結果</h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-small"
                  onClick={handleCopyResult}
                >
                  {copied ? "コピーしました" : "結果をコピー"}
                </Button>
              </div>

              <div className="dice-result">
                <div className="dice-values" role="list" aria-label="各サイコロの出目">
                  {currentRoll.map((value, index) => (
                    <div key={index} className="dice-value" role="listitem">
                      <span className="dice-number">{value}</span>
                    </div>
                  ))}
                </div>

                {currentRoll.length > 1 && (
                  <div className="dice-total">
                    <span className="total-label">合計:</span>
                    <span className="total-value">{total}</span>
                  </div>
                )}
              </div>

              <div className="dice-expression">
                <code>
                  {currentRoll.join(" + ")}
                  {currentRoll.length > 1 ? ` = ${total}` : ""}
                </code>
              </div>
            </div>
          )}

          {rollHistory.length > 0 && (
            <div className="converter-section">
              <div className="history-header">
                <h2 className="section-title">履歴</h2>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-small btn-clear"
                  onClick={handleClearHistory}
                >
                  履歴をクリア
                </Button>
              </div>

              <div className="roll-history" role="list" aria-label="ロール履歴">
                {rollHistory.map((entry, index) => (
                  <div key={entry.timestamp} className="history-item" role="listitem">
                    <div className="history-notation">{entry.notation}</div>
                    <div className="history-details">
                      <code className="history-results">
                        {entry.results.join(" + ")}
                      </code>
                      <span className="history-total">= {entry.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "ダイスロールとは",
              items: [
                "TRPG（テーブルトークRPG）やボードゲームで使用するサイコロをシミュレートするツールです",
                "「2d6」は「6面サイコロを2個振る」という表記です",
                "D4からD100まで、様々な面数のサイコロに対応しています",
                "カスタム面数のサイコロも作成できます（2〜1000面）",
              ],
            },
            {
              title: "使い方",
              items: [
                "サイコロの数と面数を設定します",
                "プリセットボタンで一般的なサイコロを素早く選択できます",
                "「ロール」ボタンでサイコロを振ります",
                "結果は各サイコロの出目と合計が表示されます",
                "過去10件のロール履歴を確認できます",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

    </>
  );
}
