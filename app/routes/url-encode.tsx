import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/url-encode")({
  head: () => ({
    meta: [{ title: "URL エンコード/デコード ツール" }],
  }),
  component: UrlEncoder,
});

function UrlEncoder() {
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

  const handleEncode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      const result = encodeURIComponent(inputText);
      setOutputText(result);
      announceStatus("URLエンコードが完了しました");
    } catch {
      announceStatus("エラー: エンコードに失敗しました");
      showToast("エンコードに失敗しました", "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleDecode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      const result = decodeURIComponent(inputText);
      setOutputText(result);
      announceStatus("URLデコードが完了しました");
    } catch {
      announceStatus("エラー: 無効なURLエンコード文字列です");
      showToast("無効なURLエンコード文字列です", "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleEncode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleEncode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="URLエンコードフォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="変換したいテキストを入力してください...&#10;例: こんにちは 世界"
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにテキストを入力して、URLエンコード/デコードができます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="入力テキストをURLエンコード"
            >
              URL エンコード
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="URLエンコードされた文字列をデコード"
            >
              URL デコード
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
            <li>「入力テキスト」欄にテキストを入力します</li>
            <li>「URL エンコード」ボタンで日本語やスペースなどを %XX 形式に変換</li>
            <li>「URL デコード」ボタンで %XX 形式を元の文字に変換</li>
            <li>変換結果は「出力結果」欄に表示されます</li>
            <li>キーボードショートカット: Ctrl+Enter でエンコード実行</li>
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
