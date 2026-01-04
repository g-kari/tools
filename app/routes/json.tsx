import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatJson, minifyJson } from "../utils/json";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

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
  const { showToast } = useToast();

  const { statusRef, announceStatus } = useStatusAnnouncement();

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

  // Ctrl+Enter でフォーマット
  useKeyboardShortcut("Enter", handleFormat, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JSONフォーマットフォーム"
        >
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
            <Button
              type="button"
              className="btn-primary"
              onClick={handleFormat}
              aria-label="JSONを整形（フォーマット）"
            >
              フォーマット
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleMinify}
              aria-label="JSONを圧縮（ミニファイ）"
            >
              圧縮
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

          <ErrorMessage message={error} />

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
                "「入力JSON」欄にJSONを入力します",
                "「フォーマット」ボタンでJSONを見やすく整形",
                "「圧縮」ボタンでJSONを1行に圧縮（ミニファイ）",
                "変換結果は「出力結果」欄に表示されます",
                "キーボードショートカット: Ctrl+Enter でフォーマット実行",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
