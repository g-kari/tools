import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatJson, minifyJson } from "../utils/json";
import { useToast } from "../components/Toast";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/json")({
  head: () => ({
    meta: [{ title: "JSON フォーマッター" }],
  }),
  component: JsonFormatter,
});

function JsonFormatter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const handleFormat = useCallback(() => {
    if (!inputText) {
      setError("JSONを入力してください");
      announceStatus("エラー: JSONを入力してください");
      showToast("JSONを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    try {
      const result = formatJson(inputText);
      setOutputText(result);
      announceStatus("JSONのフォーマットが完了しました");
      showToast("JSONをフォーマットしました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効なJSONです";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleMinify = useCallback(() => {
    if (!inputText) {
      setError("JSONを入力してください");
      announceStatus("エラー: JSONを入力してください");
      showToast("JSONを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    try {
      const result = minifyJson(inputText);
      setOutputText(result);
      announceStatus("JSONの圧縮が完了しました");
      showToast("JSONを圧縮しました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効なJSONです";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setError(null);
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleFormat();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleFormat]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JSONフォーマットフォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力JSON
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='JSONを入力してください...&#10;例: {"name": "太郎", "age": 30}'
              aria-describedby="input-help"
              aria-label="JSON入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにJSONを入力して、フォーマットまたは圧縮できます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="JSON操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleFormat}
              aria-label="JSONを整形（フォーマット）"
            >
              フォーマット
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleMinify}
              aria-label="JSONを圧縮（ミニファイ）"
            >
              圧縮
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </button>
          </div>

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div style={{ marginBottom: "30px" }}>
            <label htmlFor="outputText" className="section-title">
              出力結果
            </label>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder="変換結果がここに表示されます..."
              aria-label="変換結果の出力欄"
              aria-live="polite"
            />
          </div>
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>「入力JSON」欄にJSONを入力します</li>
            <li>「フォーマット」ボタンでJSONを見やすく整形</li>
            <li>「圧縮」ボタンでJSONを1行に圧縮（ミニファイ）</li>
            <li>変換結果は「出力結果」欄に表示されます</li>
            <li>キーボードショートカット: Ctrl+Enter でフォーマット実行</li>
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
    </>
  );
}
