import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { toUnicodeEscape, fromUnicodeEscape } from "../utils/unicode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Unicode エスケープ変換ツール" }],
  }),
  component: UnicodeConverter,
});

function UnicodeConverter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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

  const handleEncode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      alert("テキストを入力してください");
      inputRef.current?.focus();
      return;
    }
    const result = toUnicodeEscape(inputText);
    setOutputText(result);
    announceStatus("Unicodeエスケープへの変換が完了しました");
  }, [inputText, announceStatus]);

  const handleDecode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      alert("テキストを入力してください");
      inputRef.current?.focus();
      return;
    }
    const result = fromUnicodeEscape(inputText);
    setOutputText(result);
    announceStatus("Unicodeからの復元が完了しました");
  }, [inputText, announceStatus]);

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
        <form onSubmit={(e) => e.preventDefault()} aria-label="Unicode変換フォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="変換したいテキストを入力してください...&#10;例: こんにちは"
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにテキストを入力して、Unicodeエスケープシーケンスに変換できます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="入力テキストをUnicodeエスケープに変換"
            >
              Unicode エスケープに変換
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="Unicodeエスケープを通常のテキストに復元"
            >
              Unicode から復元
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
            <textarea
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
            <li>「Unicode エスケープに変換」ボタンで日本語などを \uXXXX 形式に変換</li>
            <li>「Unicode から復元」ボタンで \uXXXX 形式を元の文字に変換</li>
            <li>変換結果は「出力結果」欄に表示されます</li>
            <li>キーボードショートカット: Ctrl+Enter で変換実行</li>
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
