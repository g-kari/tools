import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  compareJson,
  formatJson,
  getSampleJsonPair,
  type DiffNode,
  type CompareResult,
} from "../utils/json-compare";

export const Route = createFileRoute("/json-compare")({
  head: () => ({
    meta: [
      { title: "JSON比較 | Web ツール集" },
      {
        name: "description",
        content:
          "2つのJSONを並べて比較し、追加・削除・変更されたキーを差分表示するオンラインツール。",
      },
      { property: "og:title", content: "JSON比較 | Web ツール集" },
      {
        property: "og:description",
        content:
          "2つのJSONを並べて比較し、追加・削除・変更されたキーを差分表示するオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-compare` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JSON比較 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "2つのJSONを並べて比較し、追加・削除・変更されたキーを差分表示するオンラインツール。",
      },
    ],
  }),
  component: JsonCompare,
});

/** 差分タイプの日本語ラベル */
const DIFF_TYPE_LABELS: Record<DiffNode["type"], string> = {
  added: "追加",
  removed: "削除",
  changed: "変更",
  unchanged: "変更なし",
};

/**
 * JSON比較ツールのメインコンポーネント
 * 2つのJSON文字列を比較して差分を表示する
 */
function JsonCompare() {
  const { showToast } = useToast();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const leftRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleCompare = useCallback(() => {
    setError(null);
    setResult(null);

    try {
      const compareResult = compareJson(leftText, rightText);
      setResult(compareResult);
      const { added, removed, changed, unchanged } = compareResult.summary;
      announceStatus(
        `比較完了: 追加${added}件、削除${removed}件、変更${changed}件、変更なし${unchanged}件`,
      );
      showToast("比較が完了しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [leftText, rightText, announceStatus, showToast]);

  const handleFormatLeft = useCallback(() => {
    try {
      setLeftText(formatJson(leftText));
      announceStatus("左側のJSONを整形しました");
      showToast("左側のJSONを整形しました", "success");
    } catch {
      showToast("左側のJSONの形式が正しくありません", "error");
    }
  }, [leftText, announceStatus, showToast]);

  const handleFormatRight = useCallback(() => {
    try {
      setRightText(formatJson(rightText));
      announceStatus("右側のJSONを整形しました");
      showToast("右側のJSONを整形しました", "success");
    } catch {
      showToast("右側のJSONの形式が正しくありません", "error");
    }
  }, [rightText, announceStatus, showToast]);

  const handleLoadSample = useCallback(() => {
    const { left, right } = getSampleJsonPair();
    setLeftText(left);
    setRightText(right);
    setResult(null);
    setError(null);
    announceStatus("サンプルJSONを読み込みました");
    showToast("サンプルJSONを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setLeftText("");
    setRightText("");
    setResult(null);
    setError(null);
    announceStatus("入力と結果をクリアしました");
    leftRef.current?.focus();
  }, [announceStatus]);

  useKeyboardShortcut("Enter", handleCompare, { ctrl: true });

  useEffect(() => {
    leftRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON比較フォーム">
          {/* 入力パネル */}
          <div className="jc-layout">
            {/* 左パネル */}
            <div className="jc-panel">
              <span className="jc-panel-label">JSON (左)</span>
              <textarea
                ref={leftRef}
                id="leftJson"
                className="jc-textarea"
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                placeholder={'比較元のJSONを入力...\n例: {"name": "Alice", "age": 30}'}
                aria-label="比較元JSON入力欄"
                aria-describedby="jc-left-help"
                spellCheck={false}
              />
              <span id="jc-left-help" className="sr-only">
                比較元のJSONデータを入力してください
              </span>
              <div className="jc-actions">
                <button
                  type="button"
                  className="jc-btn"
                  onClick={handleFormatLeft}
                  aria-label="左側のJSONを整形する"
                >
                  整形
                </button>
              </div>
            </div>

            {/* 右パネル */}
            <div className="jc-panel">
              <span className="jc-panel-label">JSON (右)</span>
              <textarea
                id="rightJson"
                className="jc-textarea"
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                placeholder={'比較先のJSONを入力...\n例: {"name": "Alice", "age": 31}'}
                aria-label="比較先JSON入力欄"
                aria-describedby="jc-right-help"
                spellCheck={false}
              />
              <span id="jc-right-help" className="sr-only">
                比較先のJSONデータを入力してください
              </span>
              <div className="jc-actions">
                <button
                  type="button"
                  className="jc-btn"
                  onClick={handleFormatRight}
                  aria-label="右側のJSONを整形する"
                >
                  整形
                </button>
              </div>
            </div>
          </div>

          {/* 操作ボタン行 */}
          <div className="jc-compare-row">
            <div className="jc-actions">
              <button
                type="button"
                className="jc-btn"
                onClick={handleLoadSample}
                aria-label="サンプルJSONを読み込む"
              >
                サンプル読込
              </button>
              <button
                type="button"
                className="jc-btn"
                onClick={handleClear}
                aria-label="入力と結果をクリアする"
              >
                クリア
              </button>
              <button
                type="button"
                className="jc-btn jc-btn--primary"
                onClick={handleCompare}
                aria-label="JSONを比較する（Ctrl+Enter）"
              >
                比較する
              </button>
            </div>
          </div>

          <ErrorMessage message={error} />

          {/* 比較結果 */}
          {result && (
            <div
              className="jc-result-section"
              role="region"
              aria-label="JSON比較結果"
              aria-live="polite"
            >
              <div className="jc-result-label">比較結果</div>

              {/* サマリー */}
              <div className="jc-summary" role="status" aria-label="差分サマリー">
                <div className="jc-summary-item">
                  <span
                    className="jc-summary-badge jc-badge--added"
                    aria-label={`追加 ${result.summary.added}件`}
                  >
                    +{result.summary.added}
                  </span>
                  <span>追加</span>
                </div>
                <div className="jc-summary-item">
                  <span
                    className="jc-summary-badge jc-badge--removed"
                    aria-label={`削除 ${result.summary.removed}件`}
                  >
                    -{result.summary.removed}
                  </span>
                  <span>削除</span>
                </div>
                <div className="jc-summary-item">
                  <span
                    className="jc-summary-badge jc-badge--changed"
                    aria-label={`変更 ${result.summary.changed}件`}
                  >
                    ~{result.summary.changed}
                  </span>
                  <span>変更</span>
                </div>
                <div className="jc-summary-item">
                  <span
                    className="jc-summary-badge jc-badge--unchanged"
                    aria-label={`変更なし ${result.summary.unchanged}件`}
                  >
                    ={result.summary.unchanged}
                  </span>
                  <span>変更なし</span>
                </div>
              </div>

              {/* 差分テーブル */}
              {result.nodes.length > 0 ? (
                <table className="jc-diff-table" aria-label="JSON差分テーブル">
                  <thead>
                    <tr>
                      <th scope="col">パス</th>
                      <th scope="col">種類</th>
                      <th scope="col">左側の値</th>
                      <th scope="col">右側の値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.nodes.map((node) => (
                      <tr key={node.path} className={`jc-row--${node.type}`}>
                        <td className="jc-path">{node.path || "(root)"}</td>
                        <td>
                          <span className={`jc-type-badge jc-type--${node.type}`}>
                            {DIFF_TYPE_LABELS[node.type]}
                          </span>
                        </td>
                        <td>{node.type === "added" ? "—" : (node.leftDisplay ?? "—")}</td>
                        <td>{node.type === "removed" ? "—" : (node.rightDisplay ?? "—")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="jc-result-empty" role="status">
                  差分はありません（両方のJSONは同一です）
                </div>
              )}
            </div>
          )}

          {!result && !error && (
            <div className="jc-result-empty">
              2つのJSONを入力して「比較する」ボタンを押してください（Ctrl+Enter）
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左側と右側にそれぞれ比較したいJSONを入力します",
                "「サンプル読込」ボタンでサンプルデータを読み込めます",
                "「整形」ボタンで入力JSONを整形できます",
                "「比較する」ボタンまたはCtrl+Enterで差分を表示します",
              ],
            },
            {
              title: "差分の見方",
              items: [
                "追加（緑）: 右側にのみ存在するキー",
                "削除（赤）: 左側にのみ存在するキー",
                "変更（黄）: 両側に存在するが値が異なるキー",
                "変更なし（グレー）: 両側で同じ値のキー",
                "ネストしたオブジェクトはキーパスで表示されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
