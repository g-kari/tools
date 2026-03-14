import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/diff")({
  head: () => ({
    meta: [
    { title: "テキスト差分比較 | Web ツール集" },
    { name: "description", content: "2つのテキストの差分を視覚的に比較するDiff表示ツール。" },
    { property: "og:title", content: "テキスト差分比較 | Web ツール集" },
    { property: "og:description", content: "2つのテキストの差分を視覚的に比較するDiff表示ツール。" },
    { property: "og:url", content: `${SITE_BASE_URL}/diff` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: SITE_OGP_IMAGE },
    { name: "twitter:title", content: "テキスト差分比較 | Web ツール集" },
    { name: "twitter:description", content: "2つのテキストの差分を視覚的に比較するDiff表示ツール。" },
  ],
  }),
  component: DiffChecker,
});

/**
 * 差分行の型定義
 * @property type - 行の種類（追加・削除・変更なし）
 * @property value - 行の内容
 */
export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  value: string;
}

/**
 * LCS（最長共通部分列）ベースの差分アルゴリズム
 * 2つのテキストを行単位で比較し、差分を計算する
 * @param oldText - 元のテキスト
 * @param newText - 新しいテキスト
 * @returns 差分行の配列
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
  // 両方空の場合は空配列を返す
  if (oldText === "" && newText === "") {
    return [];
  }

  const oldLines = oldText === "" ? [] : oldText.split("\n");
  const newLines = newText === "" ? [] : newText.split("\n");
  const m = oldLines.length;
  const n = newLines.length;

  // LCSテーブルを構築
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // LCSテーブルからバックトラックして差分を生成
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: "unchanged", value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", value: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", value: oldLines[i - 1] });
      i--;
    }
  }

  return result;
}

/** サンプルテキストの定義 */
const SAMPLE_OLD_TEXT =
  'function hello(name) {\n  console.log("Hello, " + name);\n  return name;\n}';
const SAMPLE_NEW_TEXT =
  'function hello(name, greeting = "Hello") {\n  console.log(greeting + ", " + name + "!");\n  return { name, greeting };\n}';

/**
 * テキスト差分チェッカーコンポーネント
 * 2つのテキストを比較して差分を表示する
 * @returns テキスト差分チェッカーのJSX要素
 */
function DiffChecker() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
  const oldTextRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /**
   * 差分を比較する処理
   */
  const handleCompare = useCallback(() => {
    if (!oldText && !newText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      oldTextRef.current?.focus();
      return;
    }

    const result = computeDiff(oldText, newText);
    setDiffResult(result);

    const added = result.filter((l) => l.type === "added").length;
    const removed = result.filter((l) => l.type === "removed").length;

    if (added === 0 && removed === 0) {
      announceStatus("差分はありません");
    } else {
      announceStatus(
        `差分比較が完了しました: 追加${added}行、削除${removed}行`
      );
    }
  }, [oldText, newText, announceStatus, showToast]);

  /**
   * 入力と結果をクリアする処理
   */
  const handleClear = useCallback(() => {
    setOldText("");
    setNewText("");
    setDiffResult(null);
    announceStatus("入力と結果をクリアしました");
    oldTextRef.current?.focus();
  }, [announceStatus]);

  /**
   * サンプルデータを読み込む処理
   */
  const handleLoadSample = useCallback(() => {
    setOldText(SAMPLE_OLD_TEXT);
    setNewText(SAMPLE_NEW_TEXT);
    setDiffResult(null);
    announceStatus("サンプルデータを読み込みました");
  }, [announceStatus]);

  /**
   * 差分結果をテキスト形式でクリップボードにコピーする処理
   */
  const handleCopyResult = useCallback(async () => {
    if (!diffResult) return;
    const text = diffResult
      .map((line) => {
        const prefix =
          line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        return `${prefix} ${line.value}`;
      })
      .join("\n");
    const success = await copy(text);
    if (success) {
      showToast("差分結果をコピーしました", "success");
      announceStatus("差分結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [diffResult, copy, showToast, announceStatus]);

  // Ctrl+Enter で差分比較
  useKeyboardShortcut("Enter", handleCompare, { ctrl: true });

  useEffect(() => {
    oldTextRef.current?.focus();
  }, []);

  /**
   * 差分統計を計算する
   * @returns 追加行数と削除行数
   */
  const stats = diffResult
    ? {
        added: diffResult.filter((l) => l.type === "added").length,
        removed: diffResult.filter((l) => l.type === "removed").length,
      }
    : null;

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="テキスト差分比較フォーム"
        >
          <div className="diff-input-grid">
            <div className="converter-section">
              <label htmlFor="oldText" className="section-title">
                元のテキスト
              </label>
              <Textarea
                id="oldText"
                ref={oldTextRef}
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                placeholder="元のテキストを入力してください..."
                aria-label="元のテキスト"
              />
            </div>

            <div className="converter-section">
              <label htmlFor="newText" className="section-title">
                新しいテキスト
              </label>
              <Textarea
                id="newText"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="新しいテキストを入力してください..."
                aria-label="新しいテキスト"
              />
            </div>
          </div>

          <div className="button-group" role="group" aria-label="差分操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleCompare}
              aria-label="差分を比較"
            >
              差分を比較
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と結果をクリア"
            >
              クリア
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadSample}
              aria-label="サンプルデータを読み込む"
            >
              サンプル読み込み
            </Button>
          </div>

          {diffResult !== null && (
            <div className="converter-section">
              <div className="diff-result-header">
                <h2 className="section-title">差分結果</h2>
                {stats && (stats.added > 0 || stats.removed > 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyResult}
                    aria-label="差分結果をクリップボードにコピー"
                  >
                    コピー
                  </Button>
                )}
              </div>

              {stats && (stats.added > 0 || stats.removed > 0) && (
                <div className="diff-stats" aria-label="差分統計">
                  <span className="diff-stats-added">
                    +{stats.added}行 追加
                  </span>
                  <span className="diff-stats-removed">
                    -{stats.removed}行 削除
                  </span>
                </div>
              )}

              {stats && stats.added === 0 && stats.removed === 0 ? (
                <div className="diff-no-changes" role="status">
                  差分はありません
                </div>
              ) : (
                <div
                  className="diff-result"
                  role="region"
                  aria-label="差分表示"
                >
                  {diffResult.map((line, index) => (
                    <div
                      key={`${line.type}-${index}-${line.value}`}
                      className={`diff-line diff-line-${line.type}`}
                    >
                      <span className="diff-line-prefix" aria-hidden="true">
                        {line.type === "added"
                          ? "+"
                          : line.type === "removed"
                            ? "-"
                            : " "}
                      </span>
                      <span>{line.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「元のテキスト」欄に比較元のテキストを入力します",
                "「新しいテキスト」欄に比較先のテキストを入力します",
                "「差分を比較」ボタンで差分を表示します",
                "追加された行は緑色、削除された行は赤色で表示されます",
                "キーボードショートカット: Ctrl+Enter で差分比較実行",
              ],
            },
            {
              title: "機能について",
              items: [
                "LCS（最長共通部分列）アルゴリズムによる正確な差分検出",
                "行単位での差分比較（追加・削除・変更なし）",
                "差分統計サマリー（追加行数・削除行数）の表示",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
