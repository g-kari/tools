import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/base64")({
  head: () => ({
    meta: [{ title: "Base64 エンコード/デコード ツール" }],
  }),
  component: Base64Converter,
});

function Base64Converter() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleEncode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      const result = btoa(unescape(encodeURIComponent(inputText)));
      setOutputText(result);
      announceStatus("Base64エンコードが完了しました");
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
      const result = decodeURIComponent(escape(atob(inputText)));
      setOutputText(result);
      announceStatus("Base64デコードが完了しました");
    } catch {
      announceStatus("エラー: 無効なBase64文字列です");
      showToast("無効なBase64文字列です", "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  // Ctrl+Enter でエンコード
  useKeyboardShortcut("Enter", handleEncode, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="Base64変換フォーム"
        >
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
              このフィールドにテキストを入力して、Base64エンコード/デコードができます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="入力テキストをBase64エンコード"
            >
              Base64 エンコード
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="Base64エンコードされた文字列をデコード"
            >
              Base64 デコード
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
                "「Base64 エンコード」ボタンでテキストをBase64形式に変換",
                "「Base64 デコード」ボタンでBase64形式を元のテキストに変換",
                "変換結果は「出力結果」欄に表示されます",
                "キーボードショートカット: Ctrl+Enter でエンコード実行",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
