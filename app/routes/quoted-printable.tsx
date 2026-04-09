import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/quoted-printable")({
  head: () => ({
    meta: [
      { title: "Quoted-Printableエンコード | Web ツール集" },
      {
        name: "description",
        content:
          "Quoted-Printable（RFC 2045）形式のエンコード・デコード変換ツール。メール本文や添付ファイルのMIMEエンコードに利用されるQP形式を処理します。日本語などのマルチバイト文字に対応。",
      },
      {
        property: "og:title",
        content: "Quoted-Printableエンコード | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Quoted-Printable（RFC 2045）形式のエンコード・デコード変換ツール。メール本文のMIMEエンコードに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/quoted-printable` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Quoted-Printableエンコード | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Quoted-Printable（RFC 2045）形式のエンコード・デコード変換ツール。メール本文のMIMEエンコードに対応。",
      },
    ],
  }),
  component: QuotedPrintablePage,
});

/**
 * Quoted-Printable エンコード（RFC 2045）
 *
 * - 印刷可能な ASCII 文字（0x21–0x7E、`=` を除く）はそのまま出力
 * - `=` は `=3D` にエンコード
 * - 行末のスペース（0x20）・タブ（0x09）は `=20` / `=09` にエンコード
 * - その他の非 ASCII・制御文字は `=XX`（大文字 16 進数）にエンコード
 * - 1 行 76 文字を超える場合はソフト改行（`=\n`）を挿入
 *
 * @param text - エンコードするテキスト（UTF-8 として処理）
 * @returns Quoted-Printable エンコード済み文字列
 */
export function encodeQP(text: string): string {
  const bytes = new TextEncoder().encode(text);

  // CR/LF に基づいて行分割
  const lines: number[][] = [];
  let currentLine: number[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0x0d) {
      // CR は無視（CRLF は LF で処理）
      continue;
    } else if (byte === 0x0a) {
      lines.push(currentLine);
      currentLine = [];
    } else {
      currentLine.push(byte);
    }
  }
  lines.push(currentLine);

  const encodedLines: string[] = [];

  for (const lineBytes of lines) {
    let encoded = "";
    let col = 0;

    /**
     * ソフト改行を挟みながら文字列を追記するヘルパー
     */
    const append = (s: string): void => {
      if (col + s.length > 75) {
        encoded += "=\n";
        col = 0;
      }
      encoded += s;
      col += s.length;
    };

    for (let i = 0; i < lineBytes.length; i++) {
      const byte = lineBytes[i];
      const isLast = i === lineBytes.length - 1;

      let repr: string;

      if (byte === 0x09 || byte === 0x20) {
        // スペース・タブ: 行末のみエンコード必須
        repr = isLast
          ? `=${byte.toString(16).toUpperCase().padStart(2, "0")}`
          : String.fromCharCode(byte);
      } else if (byte === 0x3d) {
        // `=` は常にエンコード
        repr = "=3D";
      } else if (byte >= 0x21 && byte <= 0x7e) {
        // 通常の印刷可能 ASCII
        repr = String.fromCharCode(byte);
      } else {
        // 非 ASCII・制御文字
        repr = `=${byte.toString(16).toUpperCase().padStart(2, "0")}`;
      }

      append(repr);
    }

    encodedLines.push(encoded);
  }

  return encodedLines.join("\n");
}

/**
 * Quoted-Printable デコード（RFC 2045）
 *
 * - ソフト改行（`=\r\n` または `=\n`）を除去
 * - `=XX` シーケンスを対応するバイトに変換
 * - 結果バイト列を UTF-8 としてデコード
 *
 * @param encoded - Quoted-Printable エンコード済み文字列
 * @returns デコードされた UTF-8 テキスト
 */
export function decodeQP(encoded: string): string {
  // ソフト改行を除去
  const withoutSoftBreaks = encoded.replace(/=\r?\n/g, "");

  const bytes: number[] = [];
  let i = 0;

  while (i < withoutSoftBreaks.length) {
    const ch = withoutSoftBreaks[i];

    if (ch === "=") {
      const hex = withoutSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 3;
      } else {
        // 不正なシーケンスはそのまま維持
        bytes.push(ch.charCodeAt(0));
        i++;
      }
    } else if (ch === "\r") {
      if (withoutSoftBreaks[i + 1] === "\n") {
        bytes.push(0x0a);
        i += 2;
      } else {
        bytes.push(0x0d);
        i++;
      }
    } else {
      bytes.push(ch.charCodeAt(0));
      i++;
    }
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
}

/**
 * Quoted-Printableエンコード/デコードページコンポーネント
 */
function QuotedPrintablePage() {
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus, copyWithFeedback } = useCopyWithFeedback();

  const handleEncode = useCallback(() => {
    if (!inputText) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      const result = encodeQP(inputText);
      setOutputText(result);
      announceStatus("Quoted-Printableエンコードが完了しました");
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
      const result = decodeQP(inputText);
      setOutputText(result);
      announceStatus("Quoted-Printableデコードが完了しました");
    } catch {
      announceStatus("エラー: デコードに失敗しました");
      showToast("デコードに失敗しました", "error");
    }
  }, [inputText, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    await copyWithFeedback(outputText, "出力結果をコピーしました");
  }, [outputText, copyWithFeedback]);

  // Ctrl+Enter でエンコード
  useKeyboardShortcut("Enter", handleEncode, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="Quoted-Printableフォーム">
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              入力テキスト
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={"変換したいテキストを入力してください...\n例: こんにちは 世界"}
              aria-describedby="input-help"
              aria-label="変換元のテキスト入力欄"
            />
            <span id="input-help" className="sr-only">
              このフィールドにテキストを入力して、Quoted-Printableエンコード/デコードができます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleEncode}
              aria-label="Quoted-Printableエンコードを実行"
            >
              QP エンコード
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleDecode}
              aria-label="Quoted-Printableデコードを実行"
            >
              QP デコード
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
            <div className="output-header">
              <label htmlFor="outputText" className="section-title">
                出力結果
              </label>
              <Button
                type="button"
                variant="outline"
                className="btn-copy"
                onClick={handleCopy}
                disabled={!outputText}
                aria-label="出力結果をクリップボードにコピー"
              >
                コピー
              </Button>
            </div>
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
                "「QP エンコード」ボタンで Quoted-Printable 形式に変換",
                "「QP デコード」ボタンで Quoted-Printable 形式を元のテキストに変換",
                "「コピー」ボタンで出力結果をクリップボードにコピー",
                "キーボードショートカット: Ctrl+Enter でエンコード実行",
              ],
            },
            {
              title: "Quoted-Printable とは",
              items: [
                "RFC 2045 で定義されたメール用の MIME エンコード方式",
                "印刷可能な ASCII 文字（0x21–0x7E、= を除く）はそのまま表現",
                "非 ASCII 文字や制御文字は =XX（大文字 16 進数 2 桁）形式にエンコード",
                "行末のスペース・タブも =20 / =09 にエンコード",
                "1 行 76 文字を超える場合はソフト改行（=）で分割",
                "メール本文で日本語などのマルチバイト文字を送受信する際に利用",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
