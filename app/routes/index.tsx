import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Unicode エスケープ変換ツール" }],
  }),
  component: UnicodeConverter,
});

function toUnicodeEscape(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i);
    if (cp === undefined) break;

    if (cp > 0xffff) {
      const high = ((cp - 0x10000) >> 10) + 0xd800;
      const low = ((cp - 0x10000) & 0x3ff) + 0xdc00;
      result += "\\u" + high.toString(16).padStart(4, "0");
      result += "\\u" + low.toString(16).padStart(4, "0");
      i += 2;
    } else if (cp > 127) {
      result += "\\u" + cp.toString(16).padStart(4, "0");
      i += 1;
    } else {
      result += text[i];
      i += 1;
    }
  }
  return result;
}

function fromUnicodeEscape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}

function UnicodeConverter() {
  const { showToast } = useToast();
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
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    const result = toUnicodeEscape(inputText);
    setOutputText(result);
    announceStatus("Unicodeエスケープへの変換が完了しました");
  }, [inputText, announceStatus, showToast]);

  const handleDecode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    const result = fromUnicodeEscape(inputText);
    setOutputText(result);
    announceStatus("Unicodeからの復元が完了しました");
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
        <form onSubmit={(e) => e.preventDefault()} aria-label="Unicode変換フォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <Textarea
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
            <Button
              type="button"
              onClick={handleEncode}
              aria-label="入力テキストをUnicodeエスケープに変換"
            >
              Unicode エスケープに変換
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDecode}
              aria-label="Unicodeエスケープを通常のテキストに復元"
            >
              Unicode から復元
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
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

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「入力テキスト」欄にテキストを入力します",
                "「Unicode エスケープに変換」ボタンで日本語などを \\uXXXX 形式に変換",
                "「Unicode から復元」ボタンで \\uXXXX 形式を元の文字に変換",
                "変換結果は「出力結果」欄に表示されます",
                "キーボードショートカット: Ctrl+Enter で変換実行",
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
