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

export const Route = createFileRoute("/html-encode")({
  head: () => ({
    meta: [{ title: "HTML エンコード/デコード - Web Tools" }],
  }),
  component: HtmlEncoder,
});

/**
 * HTML文字列をエンティティエンコードする
 * &, <, >, ", ' の5文字を対応するHTMLエンティティに変換する
 * @param text - エンコード対象の文字列
 * @returns HTMLエンティティにエンコードされた文字列
 */
function htmlEncode(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * HTMLエンティティ文字列をデコードして元のテキストに戻す
 * 数値参照（16進数・10進数）および名前付きエンティティに対応する
 * @param text - デコード対象のHTMLエンティティ文字列
 * @returns デコードされた文字列
 */
function htmlDecode(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * HTMLエンコード/デコードツールコンポーネント
 * HTML特殊文字をエンティティ表現に変換、またはその逆を行う
 * @returns HTMLエンコード/デコードフォームのJSX要素
 */
function HtmlEncoder() {
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
      const result = htmlEncode(inputText);
      setOutputText(result);
      announceStatus("HTMLエンコードが完了しました");
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
      const result = htmlDecode(inputText);
      setOutputText(result);
      announceStatus("HTMLデコードが完了しました");
    } catch {
      announceStatus("エラー: 無効なHTMLエンティティ文字列です");
      showToast("無効なHTMLエンティティ文字列です", "error");
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
          aria-label="HTMLエンコードフォーム"
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
              placeholder="変換したいテキストを入力してください...&#10;例: &lt;h1&gt;Hello, World!&lt;/h1&gt;"
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにテキストを入力して、HTMLエンコード/デコードができます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="入力テキストをHTMLエンコード"
            >
              HTML エンコード
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="HTMLエンティティをデコード"
            >
              HTML デコード
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
                "「HTML エンコード」ボタンで < > & \" ' などの文字を &lt; &gt; &amp; &quot; &#39; などのHTMLエンティティに変換",
                "「HTML デコード」ボタンでHTMLエンティティを元の文字に変換",
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
