import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "~/constants/site";

export const Route = createFileRoute("/random-picker")({
  head: () => ({
    meta: [
      { title: "ランダムピッカー / 抽選ツール | Web ツール集" },
      {
        name: "description",
        content:
          "テキストリストからランダムに項目を抽選するツール。抽選済みを除外する非復元抽出にも対応。",
      },
      {
        property: "og:title",
        content: "ランダムピッカー / 抽選ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストリストからランダムに項目を抽選するツール。抽選済みを除外する非復元抽出にも対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/random-picker` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ランダムピッカー / 抽選ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "テキストリストからランダムに項目を抽選するツール。抽選済みを除外する非復元抽出にも対応。",
      },
    ],
  }),
  component: RandomPickerPage,
});

/** 抽選結果の履歴エントリ */
interface PickHistory {
  /** 選ばれた項目一覧 */
  items: string[];
  /** タイムスタンプ */
  timestamp: number;
}

/**
 * テキストを改行で分割して空行・重複空白を除去した項目リストを返す
 * @param text - 改行区切りの入力テキスト
 * @returns トリミング済みの項目配列（空文字除外）
 */
export function parseItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 配列からランダムにn個の項目を非復元抽出する（Fisher-Yates シャッフル利用）
 * @param items - 抽出元の配列
 * @param count - 抽出する個数
 * @returns 抽出された項目の配列
 */
export function pickRandom(items: string[], count: number): string[] {
  if (items.length === 0 || count <= 0) return [];
  const pool = [...items];
  const picked: string[] = [];
  const pickCount = Math.min(count, pool.length);
  for (let i = 0; i < pickCount; i++) {
    const idx = Math.floor(Math.random() * (pool.length - i));
    picked.push(pool[idx]);
    // swap to end and shrink effective range
    [pool[idx], pool[pool.length - 1 - i]] = [
      pool[pool.length - 1 - i],
      pool[idx],
    ];
  }
  return picked;
}

/**
 * ランダムピッカー / 抽選ツール コンポーネント
 *
 * 主な機能:
 * - 改行区切りのテキストリストから任意個数をランダム抽選
 * - 非復元抽出モード（抽選済み項目をリストから除外）
 * - 復元抽出モード（毎回全リストから選ぶ）
 * - 抽選履歴の表示と一括クリア
 * - サンプルデータの挿入
 * - リストのシャッフル
 *
 * @returns ランダムピッカーページのReactコンポーネント
 */
function RandomPickerPage() {
  const [inputText, setInputText] = useState<string>(
    "Alice\nBob\nCharlie\nDiana\nEve\nFrank\nGrace\nHank"
  );
  const [pickCount, setPickCount] = useState<number>(1);
  const [withoutReplacement, setWithoutReplacement] = useState<boolean>(true);
  const [remainingItems, setRemainingItems] = useState<string[]>([]);
  const [lastPick, setLastPick] = useState<string[] | null>(null);
  const [history, setHistory] = useState<PickHistory[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // inputText が変わったら remainingItems をリセット
  useEffect(() => {
    setRemainingItems(parseItems(inputText));
    setLastPick(null);
  }, [inputText]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) statusRef.current.textContent = "";
      }, 3000);
    }
  }, []);

  const allItems = parseItems(inputText);

  const handlePick = useCallback(() => {
    if (isAnimating) return;

    const pool = withoutReplacement ? remainingItems : allItems;
    if (pool.length === 0) {
      announceStatus("抽選できる項目がありません");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      const picked = pickRandom(pool, pickCount);

      if (withoutReplacement) {
        const pickedSet = new Set(picked);
        setRemainingItems((prev) => prev.filter((item) => !pickedSet.has(item)));
      }

      setLastPick(picked);
      setHistory((prev) => [
        { items: picked, timestamp: Date.now() },
        ...prev.slice(0, 19),
      ]);
      announceStatus(`抽選結果: ${picked.join("、")}`);
      setIsAnimating(false);
    }, 300);
  }, [
    isAnimating,
    withoutReplacement,
    remainingItems,
    allItems,
    pickCount,
    announceStatus,
  ]);

  const handleReset = useCallback(() => {
    setRemainingItems(parseItems(inputText));
    setLastPick(null);
    announceStatus("リストをリセットしました");
  }, [inputText, announceStatus]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    announceStatus("履歴をクリアしました");
  }, [announceStatus]);

  const handleShuffle = useCallback(() => {
    const items = parseItems(inputText);
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setInputText(shuffled.join("\n"));
    announceStatus("リストをシャッフルしました");
  }, [inputText, announceStatus]);

  const poolSize = withoutReplacement ? remainingItems.length : allItems.length;
  const isExhausted = withoutReplacement && remainingItems.length === 0 && allItems.length > 0;

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">抽選リスト</h2>

          <div className="picker-input-area">
            <label htmlFor="picker-items" className="picker-label">
              項目を1行ずつ入力してください:
            </label>
            <textarea
              id="picker-items"
              className="picker-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              placeholder="Alice&#10;Bob&#10;Charlie&#10;..."
              aria-describedby="picker-item-count"
            />
            <div id="picker-item-count" className="picker-count-info">
              <span className="picker-total-badge">
                全{allItems.length}件
              </span>
              {withoutReplacement && (
                <span
                  className={`picker-remaining-badge ${isExhausted ? "exhausted" : ""}`}
                >
                  残り{remainingItems.length}件
                </span>
              )}
            </div>
          </div>

          <div className="picker-options">
            <div className="option-group">
              <label htmlFor="pick-count">抽選する個数:</label>
              <input
                type="number"
                id="pick-count"
                min="1"
                max={allItems.length || 1}
                value={pickCount}
                onChange={(e) =>
                  setPickCount(
                    Math.max(1, parseInt(e.target.value) || 1)
                  )
                }
                aria-describedby="pick-count-help"
              />
              <span id="pick-count-help" className="sr-only">
                1以上の整数で抽選する個数を指定してください
              </span>
            </div>

            <div className="picker-mode-group">
              <label className="picker-mode-label">抽選モード:</label>
              <div className="picker-mode-options" role="radiogroup" aria-label="抽選モード選択">
                <label className="picker-mode-option">
                  <input
                    type="radio"
                    name="pick-mode"
                    checked={withoutReplacement}
                    onChange={() => {
                      setWithoutReplacement(true);
                      setRemainingItems(parseItems(inputText));
                      setLastPick(null);
                    }}
                  />
                  <span>非復元抽出（抽選済みを除外）</span>
                </label>
                <label className="picker-mode-option">
                  <input
                    type="radio"
                    name="pick-mode"
                    checked={!withoutReplacement}
                    onChange={() => {
                      setWithoutReplacement(false);
                      setLastPick(null);
                    }}
                  />
                  <span>復元抽出（毎回全リストから）</span>
                </label>
              </div>
            </div>
          </div>

          <div className="picker-actions" role="group" aria-label="抽選操作">
            <Button
              type="button"
              className={`btn-large btn-primary picker-btn${isAnimating ? " animating" : ""}`}
              onClick={handlePick}
              disabled={poolSize === 0 || isAnimating}
              aria-disabled={poolSize === 0 || isAnimating}
            >
              {isAnimating ? "抽選中..." : "抽選する"}
            </Button>
            {withoutReplacement && allItems.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleReset}
              >
                リセット
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="btn-outline"
              onClick={handleShuffle}
              disabled={allItems.length === 0}
            >
              シャッフル
            </Button>
          </div>

          {isExhausted && (
            <div className="picker-exhausted-notice" role="alert">
              全項目が抽選済みです。「リセット」ボタンで再抽選できます。
            </div>
          )}
        </div>

        {lastPick !== null && (
          <div className="converter-section">
            <h2 className="section-title">抽選結果</h2>
            <div
              className={`picker-result${isAnimating ? " animating" : ""}`}
              role="region"
              aria-label="最新の抽選結果"
              aria-live="polite"
            >
              {lastPick.map((item, idx) => (
                <div key={idx} className="picker-result-item">
                  <span className="picker-result-rank">{idx + 1}</span>
                  <span className="picker-result-name">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="converter-section">
            <div className="result-header">
              <h2 className="section-title">抽選履歴</h2>
              <Button
                type="button"
                variant="outline"
                className="btn-small btn-clear"
                onClick={handleClearHistory}
              >
                履歴をクリア
              </Button>
            </div>
            <div className="picker-history" role="list" aria-label="抽選履歴">
              {history.map((entry) => (
                <div
                  key={entry.timestamp}
                  className="picker-history-item"
                  role="listitem"
                >
                  <span className="picker-history-items">
                    {entry.items.join("、")}
                  </span>
                  <span className="picker-history-time">
                    {new Date(entry.timestamp).toLocaleTimeString("ja-JP")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "ランダムピッカーとは",
              items: [
                "テキストリストからランダムに項目を抽選するツールです",
                "チームのタスク割り当て、当番決め、プレゼント抽選などに使えます",
                "非復元抽出では一度選ばれた項目が除外されるため、公平な抽選が可能です",
                "復元抽出では毎回全リストから選ぶため、同じ項目が複数回当選することがあります",
              ],
            },
            {
              title: "使い方",
              items: [
                "テキストエリアに項目を1行ずつ入力します",
                "抽選する個数を指定します（デフォルト1件）",
                "抽選モードを選択します（非復元／復元）",
                "「抽選する」ボタンをクリックします",
                "非復元モードでは「リセット」で再度全項目から抽選できます",
                "「シャッフル」でリストの順序をランダムに並び替えます",
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
