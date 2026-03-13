import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { phpSerialize, phpUnserialize } from "../utils/php-serialize";
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

export const Route = createFileRoute("/php-serialize")({
  head: () => ({
    meta: [{ title: "PHP シリアライズ/アンシリアライズ - Web Tools" }],
  }),
  component: PhpSerializeConverter,
});

/**
 * PHPシリアライズ/アンシリアライズツールコンポーネント
 * JSON形式のデータとPHPシリアライズ文字列の相互変換を行う
 * @returns PHPシリアライズ変換フォームのJSX要素
 */
function PhpSerializeConverter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleSerialize = useCallback(() => {
    if (!inputText) {
      setError("JSONを入力してください");
      announceStatus("エラー: JSONを入力してください");
      showToast("JSONを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    try {
      const parsed = JSON.parse(inputText) as Parameters<typeof phpSerialize>[0];
      const result = phpSerialize(parsed);
      setOutputText(result);
      announceStatus("PHPシリアライズが完了しました");
      showToast("PHPシリアライズしました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "変換に失敗しました";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleUnserialize = useCallback(() => {
    if (!inputText) {
      setError("PHPシリアライズ文字列を入力してください");
      announceStatus("エラー: PHPシリアライズ文字列を入力してください");
      showToast("PHPシリアライズ文字列を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    try {
      const result = phpUnserialize(inputText);
      setOutputText(JSON.stringify(result, null, 2));
      announceStatus("PHPアンシリアライズが完了しました");
      showToast("JSONに変換しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "無効なPHPシリアライズ文字列です";
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

  // Ctrl+Enter でシリアライズ
  useKeyboardShortcut("Enter", handleSerialize, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="PHPシリアライズ/アンシリアライズフォーム"
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
              placeholder={
                'JSONまたはPHPシリアライズ文字列を入力してください...\n例 (JSON): {"name": "太郎", "age": 30}\n例 (PHP): a:2:{s:4:"name";s:6:"太郎";s:3:"age";i:30;}'
              }
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄（JSONまたはPHPシリアライズ文字列）"
            />
            <span id="input-help" className="sr-only">
              JSONを入力してPHPシリアライズに変換、またはPHPシリアライズ文字列を入力してJSONに変換できます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleSerialize}
              aria-label="JSONをPHPシリアライズ形式に変換（Ctrl+Enter）"
            >
              JSON → PHP シリアライズ
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleUnserialize}
              aria-label="PHPシリアライズ文字列をJSONに変換"
            >
              PHP → JSON
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
              title: "PHPシリアライズとは",
              items: [
                "PHPのserialize()関数が出力するデータ形式です",
                "null、bool、int、float、string、array（インデックス・連想）、objectに対応しています",
                "セッションデータや設定値の保存などに広く使われています",
              ],
            },
            {
              title: "使い方",
              items: [
                "「入力テキスト」欄にJSONを入力します",
                "「JSON → PHP シリアライズ」ボタンでPHPシリアライズ形式に変換",
                "「PHP → JSON」ボタンでPHPシリアライズ文字列をJSONに戻すことができます",
                "変換結果は「出力結果」欄に表示されます",
                "キーボードショートカット: Ctrl+Enter でシリアライズ実行",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
