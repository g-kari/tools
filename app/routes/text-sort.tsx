import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/text-sort")({
  head: () => ({
    meta: [{ title: "テキストソート/重複削除 ツール" }],
  }),
  component: TextSortTool,
});

/**
 * テキストソート/重複削除ツールコンポーネント
 *
 * テキスト行の昇順・降順ソート、重複削除、および両方の組み合わせ処理を提供します。
 * 日本語ロケールに対応したソートを行い、アクセシビリティにも配慮しています。
 *
 * @returns テキストソート/重複削除ツールのReactコンポーネント
 */
function TextSortTool() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      // Clear previous timeout
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

  const validateInput = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return false;
    }
    return true;
  }, [inputText, announceStatus, showToast]);

  const handleSortAsc = useCallback(() => {
    if (!validateInput()) return;
    const lines = inputText.split("\n");
    const sorted = lines.sort((a, b) => a.localeCompare(b, "ja"));
    setOutputText(sorted.join("\n"));
    announceStatus("昇順ソートが完了しました");
  }, [inputText, validateInput, announceStatus]);

  const handleSortDesc = useCallback(() => {
    if (!validateInput()) return;
    const lines = inputText.split("\n");
    const sorted = lines.sort((a, b) => b.localeCompare(a, "ja"));
    setOutputText(sorted.join("\n"));
    announceStatus("降順ソートが完了しました");
  }, [inputText, validateInput, announceStatus]);

  const handleRemoveDuplicates = useCallback(() => {
    if (!validateInput()) return;
    const lines = inputText.split("\n");
    const unique = Array.from(new Set(lines));
    setOutputText(unique.join("\n"));
    announceStatus("重複削除が完了しました");
  }, [inputText, validateInput, announceStatus]);

  const handleSortAndRemoveDuplicates = useCallback(() => {
    if (!validateInput()) return;
    const lines = inputText.split("\n");
    const unique = Array.from(new Set(lines));
    const sorted = unique.sort((a, b) => a.localeCompare(b, "ja"));
    setOutputText(sorted.join("\n"));
    announceStatus("ソートと重複削除が完了しました");
  }, [inputText, validateInput, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="テキストソートフォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="1行に1つずつテキストを入力してください...&#10;例:&#10;りんご&#10;バナナ&#10;りんご&#10;みかん"
              aria-describedby="input-help"
              aria-label="ソート・重複削除するテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドに1行に1つずつテキストを入力して、ソートや重複削除ができます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="ソート操作">
            <Button
              type="button"
              onClick={handleSortAsc}
              aria-label="入力テキストを昇順ソート"
            >
              昇順ソート
            </Button>
            <Button
              type="button"
              onClick={handleSortDesc}
              aria-label="入力テキストを降順ソート"
            >
              降順ソート
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRemoveDuplicates}
              aria-label="重複行を削除"
            >
              重複削除
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSortAndRemoveDuplicates}
              aria-label="昇順ソートと重複削除を同時実行"
            >
              ソート + 重複削除
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <div className="output-section">
            <label htmlFor="outputText" className="section-title">
              出力結果
            </label>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder="処理結果がここに表示されます..."
              aria-label="処理結果の出力欄"
              aria-live="polite"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「入力テキスト」欄に1行に1つずつテキストを入力します",
                "「昇順ソート」ボタンで行を昇順（A→Z、あ→ん）に並び替え",
                "「降順ソート」ボタンで行を降順（Z→A、ん→あ）に並び替え",
                "「重複削除」ボタンで重複する行を削除",
                "「ソート + 重複削除」ボタンで昇順ソートと重複削除を同時実行",
                "処理結果は「出力結果」欄に表示されます",
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
