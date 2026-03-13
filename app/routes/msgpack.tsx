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
import {
  msgpackEncode,
  msgpackDecode,
  uint8ArrayToHex,
  hexToUint8Array,
} from "../lib/msgpack";

export const Route = createFileRoute("/msgpack")({
  head: () => ({
    meta: [{ title: "MessagePack変換 - Web Tools" }],
  }),
  component: MsgpackConverter,
});

/**
 * MessagePack変換ツールコンポーネント
 * JSONとMessagePackバイナリ（HEX表現）の相互変換を行う
 * @returns MessagePack変換フォームのJSX要素
 */
function MsgpackConverter() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleEncode = useCallback(() => {
    if (!inputText) {
      showToast("入力テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(inputText);
    } catch (e) {
      showToast(
        "無効なJSONです: " + (e instanceof Error ? e.message : String(e)),
        "error"
      );
      announceStatus("エラー: 無効なJSONです");
      inputRef.current?.focus();
      return;
    }
    try {
      const bytes = msgpackEncode(parsed);
      setOutputText(uint8ArrayToHex(bytes));
      showToast("MessagePackエンコードが完了しました", "success");
      announceStatus("MessagePackエンコードが完了しました");
    } catch (e) {
      showToast(
        "エンコードに失敗しました: " +
          (e instanceof Error ? e.message : String(e)),
        "error"
      );
      announceStatus("エラー: エンコードに失敗しました");
    }
  }, [inputText, announceStatus, showToast]);

  const handleDecode = useCallback(() => {
    if (!inputText) {
      showToast("HEX文字列を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = hexToUint8Array(inputText);
    } catch (e) {
      showToast(
        "無効なHEX文字列です: " +
          (e instanceof Error ? e.message : String(e)),
        "error"
      );
      announceStatus("エラー: 無効なHEX文字列です");
      inputRef.current?.focus();
      return;
    }
    try {
      const decoded = msgpackDecode(bytes);
      setOutputText(JSON.stringify(decoded, null, 2));
      showToast("JSONデコードが完了しました", "success");
      announceStatus("JSONデコードが完了しました");
    } catch (e) {
      showToast(
        "デコードに失敗しました: " +
          (e instanceof Error ? e.message : String(e)),
        "error"
      );
      announceStatus("エラー: デコードに失敗しました");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopyOutput = useCallback(() => {
    navigator.clipboard
      .writeText(outputText)
      .then(() => {
        showToast("クリップボードにコピーしました", "success");
      })
      .catch(() => {
        showToast("コピーに失敗しました", "error");
      });
  }, [outputText, showToast]);

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
          aria-label="MessagePack変換フォーム"
        >
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト（JSONまたはHEX）
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='{"key": "value"} または c0 (HEX)'
              aria-label="入力テキスト"
              rows={8}
            />
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              className="btn-primary"
              onClick={handleEncode}
              type="button"
              aria-label="JSONをMessagePackにエンコード"
            >
              → MessagePackエンコード
            </Button>
            <Button
              variant="secondary"
              className="btn-secondary"
              onClick={handleDecode}
              type="button"
              aria-label="HEXをJSONにデコード"
            >
              ← JSONデコード
            </Button>
            <Button
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              type="button"
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <div className="output-section">
            <div className="msgpack-output-header">
              <label htmlFor="outputText" className="section-title">
                出力結果
              </label>
              {outputText && (
                <Button
                  variant="outline"
                  onClick={handleCopyOutput}
                  type="button"
                  size="sm"
                >
                  コピー
                </Button>
              )}
            </div>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              aria-label="変換結果"
              aria-live="polite"
              rows={8}
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "JSONテキストを入力して「エンコード」ボタンでMessagePackバイナリ（HEX）に変換します",
                "HEX文字列を入力して「デコード」ボタンでJSONに変換します",
                "Ctrl+Enter でエンコードを実行できます",
              ],
            },
            {
              title: "MessagePackについて",
              items: [
                "MessagePackはJSONより高速・コンパクトなバイナリシリアライズ形式です",
                "対応型: null, boolean, integer, float, string, array, map",
                "出力はHEX（16進数）文字列で表示されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
