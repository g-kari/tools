import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { encodeToMsgpack, decodeFromMsgpack } from "../utils/msgpack";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/msgpack")({
  head: () => ({
    meta: [
      { title: "MessagePack変換 | Web ツール集" },
      { name: "description", content: "JSON ↔ MessagePackバイナリ（HEX表現）の相互変換ツール。" },
      { property: "og:title", content: "MessagePack変換 | Web ツール集" },
      {
        property: "og:description",
        content: "JSON ↔ MessagePackバイナリ（HEX表現）の相互変換ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/msgpack` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "MessagePack変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "JSON ↔ MessagePackバイナリ（HEX表現）の相互変換ツール。",
      },
    ],
  }),
  component: MsgpackConverter,
});

function MsgpackConverter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [byteCount, setByteCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleEncode = useCallback(() => {
    if (!inputText) {
      setError("JSONを入力してください");
      announceStatus("エラー: JSONを入力してください");
      showToast("JSONを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setByteCount(null);
    try {
      const result = encodeToMsgpack(inputText);
      setOutputText(result.hex);
      setByteCount(result.bytes);
      announceStatus(`MessagePackエンコードが完了しました。${result.bytes}バイト`);
      showToast("MessagePackにエンコードしました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効なJSONです";
      setError(message);
      setOutputText("");
      setByteCount(null);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleDecode = useCallback(() => {
    if (!inputText) {
      setError("MessagePackの16進数を入力してください");
      announceStatus("エラー: MessagePackの16進数を入力してください");
      showToast("MessagePackの16進数を入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setByteCount(null);
    try {
      const result = decodeFromMsgpack(inputText);
      setOutputText(result);
      announceStatus("MessagePackデコードが完了しました");
      showToast("JSONにデコードしました", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効なMessagePackデータです";
      setError(message);
      setOutputText("");
      setByteCount(null);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setError(null);
    setByteCount(null);
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
          aria-label="MessagePackエンコード/デコードフォーム"
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
                'JSONまたはMessagePack 16進数を入力してください...\n例 (JSON): {"name": "太郎", "age": 30}'
              }
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄（JSONまたはMessagePack 16進数）"
            />
            <span id="input-help" className="sr-only">
              JSONを入力してMessagePackにエンコード、またはMessagePackの16進数を入力してJSONにデコードできます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="JSONをMessagePackにエンコード（Ctrl+Enter）"
            >
              JSON → MessagePack
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="MessagePack 16進数をJSONにデコード"
            >
              MessagePack → JSON
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

          {byteCount !== null && (
            <p id="byteCount" className="info-text">
              {byteCount} バイト
            </p>
          )}

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
              title: "MessagePackとは",
              items: [
                "MessagePackはJSONと互換性のある高効率なバイナリシリアライゼーション形式です",
                "JSONより小さいサイズでデータを表現でき、シリアライズ/デシリアライズも高速です",
                "ゲーム、IoT、マイクロサービスなど高パフォーマンスが求められる場面で活用されます",
              ],
            },
            {
              title: "使い方",
              items: [
                "「入力テキスト」欄にJSONを入力します",
                "「JSON → MessagePack」ボタンでMessagePackの16進数に変換",
                "エンコード後、バイト数が表示されます",
                "「MessagePack → JSON」ボタンで16進数をJSONに戻すことができます",
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
