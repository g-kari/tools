import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";

export const Route = createFileRoute("/dice-roll")({
  head: () => ({
    meta: [{ title: "ダイスロールツール" }],
  }),
  component: DiceRoll,
});

/**
 * サイコロをロールする関数
 * @param sides - サイコロの面数
 * @returns 1からsidesまでのランダムな整数
 */
function rollDice(sides: number): number {
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
              <button type="submit" className="btn-primary btn-large">
                ロール
              </button>
            </div>
          </div>

          {currentRoll && (
            <div className="converter-section">
              <div className="result-header">
                <h2 className="section-title">結果</h2>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={handleCopyResult}
                >
                  {copied ? "コピーしました" : "結果をコピー"}
                </button>
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
                <button
                  type="button"
                  className="btn-clear btn-small"
                  onClick={handleClearHistory}
                >
                  履歴をクリア
                </button>
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

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">ダイスロールとは</h3>
          <ul>
            <li>
              TRPG（テーブルトークRPG）やボードゲームで使用するサイコロをシミュレートするツールです
            </li>
            <li>「2d6」は「6面サイコロを2個振る」という表記です</li>
            <li>D4からD100まで、様々な面数のサイコロに対応しています</li>
            <li>カスタム面数のサイコロも作成できます（2〜1000面）</li>
          </ul>
          <h3 id="about-tool-title">使い方</h3>
          <ul>
            <li>サイコロの数と面数を設定します</li>
            <li>プリセットボタンで一般的なサイコロを素早く選択できます</li>
            <li>「ロール」ボタンでサイコロを振ります</li>
            <li>結果は各サイコロの出目と合計が表示されます</li>
            <li>過去10件のロール履歴を確認できます</li>
          </ul>
        </aside>
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <style>{`
        .dice-settings {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .option-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .option-group label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
        }

        .option-group input[type="number"] {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid var(--md-sys-color-outline);
          border-radius: 8px;
          font-size: 1rem;
          background-color: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
        }

        .dice-notation {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
        }

        .notation-label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface-variant);
        }

        .notation-value {
          font-family: 'Roboto Mono', monospace;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--md-sys-color-primary);
        }

        .preset-dice {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .preset-dice > label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
        }

        .preset-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn-preset {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          background-color: var(--md-sys-color-surface-variant);
          color: var(--md-sys-color-on-surface-variant);
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-preset:hover {
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
        }

        .btn-preset.active {
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
          border-color: var(--md-sys-color-primary);
        }

        .btn-large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .result-header,
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .result-header .section-title,
        .history-header .section-title {
          margin-bottom: 0;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .dice-result {
          margin-bottom: 1rem;
        }

        .dice-values {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .dice-value {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background-color: var(--md-sys-color-primary-container);
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dice-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--md-sys-color-on-primary-container);
        }

        .dice-total {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background-color: var(--md-sys-color-tertiary-container);
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .total-label {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--md-sys-color-on-tertiary-container);
        }

        .total-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--md-sys-color-on-tertiary-container);
        }

        .dice-expression {
          padding: 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
        }

        .dice-expression code {
          font-family: 'Roboto Mono', monospace;
          font-size: 1rem;
          color: var(--md-sys-color-on-surface-variant);
        }

        .roll-history {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .history-item {
          padding: 0.75rem 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .history-notation {
          font-weight: 600;
          color: var(--md-sys-color-primary);
          font-family: 'Roboto Mono', monospace;
          min-width: 60px;
        }

        .history-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .history-results {
          font-family: 'Roboto Mono', monospace;
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
        }

        .history-total {
          font-weight: 600;
          color: var(--md-sys-color-on-surface);
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .dice-settings {
            flex-direction: column;
            align-items: flex-start;
          }

          .dice-values {
            justify-content: center;
          }

          .history-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .history-details {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .dice-value {
            width: 50px;
            height: 50px;
          }

          .dice-number {
            font-size: 1.25rem;
          }

          .total-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
