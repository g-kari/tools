import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  type CipherType,
  encryptText,
  decryptText,
  getCipherLabel,
  getCipherDescription,
} from "../utils/text-encrypt";

export const Route = createFileRoute("/text-encrypt")({
  head: () => ({
    meta: [
      { title: "テキスト暗号化 | Web ツール集" },
      {
        name: "description",
        content: "ROT13・Caesar暗号・Vigenère暗号・Atbash暗号でテキストを暗号化・復号化するツール",
      },
      {
        property: "og:title",
        content: "テキスト暗号化 | Web ツール集",
      },
      {
        property: "og:description",
        content: "ROT13・Caesar暗号・Vigenère暗号・Atbash暗号でテキストを暗号化・復号化するツール",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/text-encrypt` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TextEncryptTool,
});

/** 操作モードの型定義 */
type OperationMode = "encrypt" | "decrypt";

/** 利用可能な暗号方式のリスト */
const CIPHER_TYPES: CipherType[] = ["rot13", "caesar", "vigenere", "atbash"];

/**
 * テキスト暗号化・復号化コンポーネント
 * 古典暗号（ROT13、Caesar、Vigenère、Atbash）によるテキスト変換を提供する
 */
function TextEncryptTool() {
  const [inputText, setInputText] = useState("");
  const [cipher, setCipher] = useState<CipherType>("rot13");
  const [mode, setMode] = useState<OperationMode>("encrypt");
  const [shift, setShift] = useState(3);
  const [vigenereKey, setVigenereKey] = useState("");
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** リアルタイム変換結果 */
  const outputText = useMemo(() => {
    if (!inputText.trim()) return "";
    const options = { shift, key: vigenereKey };
    if (mode === "encrypt") {
      return encryptText(inputText, cipher, options);
    } else {
      return decryptText(inputText, cipher, options);
    }
  }, [inputText, cipher, mode, shift, vigenereKey]);

  /** ROT13/Atbashは暗号化と復号化が同じか */
  const isSelfInverse = cipher === "rot13" || cipher === "atbash";

  const handleCopy = async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleClear = () => {
    setInputText("");
    announceStatus("入力内容をクリアしました");
  };

  const handleSwap = () => {
    if (!outputText) return;
    setInputText(outputText);
    setMode(mode === "encrypt" ? "decrypt" : "encrypt");
    announceStatus("入力と出力を入れ替えました");
  };

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">テキスト暗号化</h2>

        {/* 暗号方式選択 */}
        <div className="text-encrypt-cipher-selector" role="group" aria-label="暗号方式選択">
          {CIPHER_TYPES.map((c) => (
            <button
              key={c}
              className={`text-encrypt-cipher-btn ${cipher === c ? "active" : ""}`}
              onClick={() => {
                setCipher(c);
                announceStatus(`${getCipherLabel(c)}を選択しました`);
              }}
              aria-pressed={cipher === c}
              title={getCipherDescription(c)}
            >
              {getCipherLabel(c)}
            </button>
          ))}
        </div>

        {/* 暗号方式の説明 */}
        <p className="text-encrypt-cipher-desc">{getCipherDescription(cipher)}</p>

        {/* Caesar暗号のシフト数設定 */}
        {cipher === "caesar" && (
          <div className="text-encrypt-param-row">
            <label htmlFor="text-encrypt-shift" className="text-encrypt-param-label">
              シフト数:
            </label>
            <input
              id="text-encrypt-shift"
              type="number"
              min={1}
              max={25}
              value={shift}
              onChange={(e) => {
                const val = Math.min(25, Math.max(1, parseInt(e.target.value, 10) || 1));
                setShift(val);
              }}
              className="text-encrypt-shift-input"
              aria-label="Caesar暗号のシフト数（1〜25）"
            />
            <span className="text-encrypt-param-hint">1〜25</span>
          </div>
        )}

        {/* Vigenère暗号のキーワード設定 */}
        {cipher === "vigenere" && (
          <div className="text-encrypt-param-row">
            <label htmlFor="text-encrypt-key" className="text-encrypt-param-label">
              キーワード:
            </label>
            <input
              id="text-encrypt-key"
              type="text"
              value={vigenereKey}
              onChange={(e) => setVigenereKey(e.target.value)}
              placeholder="例: SECRET"
              className="text-encrypt-key-input"
              aria-label="Vigenère暗号のキーワード（アルファベットのみ有効）"
            />
          </div>
        )}

        {/* 操作モード選択（ROT13/Atbash以外） */}
        {!isSelfInverse && (
          <div className="text-encrypt-mode-buttons" role="group" aria-label="操作モード選択">
            <Button
              variant={mode === "encrypt" ? "default" : "outline"}
              onClick={() => {
                setMode("encrypt");
                announceStatus("暗号化モードに切り替えました");
              }}
              aria-pressed={mode === "encrypt"}
            >
              暗号化
            </Button>
            <Button
              variant={mode === "decrypt" ? "default" : "outline"}
              onClick={() => {
                setMode("decrypt");
                announceStatus("復号化モードに切り替えました");
              }}
              aria-pressed={mode === "decrypt"}
            >
              復号化
            </Button>
          </div>
        )}

        {/* 入力エリア */}
        <div className="text-encrypt-input-area">
          <label htmlFor="text-encrypt-input" className="section-title">
            {isSelfInverse
              ? "入力テキスト"
              : mode === "encrypt"
                ? "暗号化するテキスト"
                : "復号化するテキスト"}
          </label>
          <Textarea
            id="text-encrypt-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isSelfInverse
                ? "変換するテキストを入力..."
                : mode === "encrypt"
                  ? "暗号化したいテキストを入力..."
                  : "復号化したいテキストを入力..."
            }
            rows={5}
            aria-label="入力テキスト"
          />
        </div>

        {/* 出力エリア */}
        <div className="text-encrypt-output-area">
          <label htmlFor="text-encrypt-output" className="section-title">
            {isSelfInverse ? "変換結果" : mode === "encrypt" ? "暗号文" : "復号化されたテキスト"}
          </label>
          <Textarea
            id="text-encrypt-output"
            value={outputText}
            readOnly
            rows={5}
            placeholder="変換結果がここに表示されます"
            aria-live="polite"
            aria-label={`変換結果: ${outputText || "（変換結果なし）"}`}
          />
        </div>

        {/* アクションボタン */}
        <div className="text-encrypt-actions">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!outputText}
            aria-label="変換結果をクリップボードにコピー"
          >
            コピー
          </Button>
          {!isSelfInverse && (
            <Button
              variant="outline"
              onClick={handleSwap}
              disabled={!outputText}
              aria-label="入力と出力を入れ替えて逆変換"
            >
              入れ替え
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!inputText}
            aria-label="入力内容をクリア"
          >
            クリア
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "上部のボタンで暗号方式を選択します",
                "入力欄にテキストを入力すると自動的に変換されます",
                "Caesar暗号はシフト数（1〜25）を設定できます（デフォルト: 3）",
                "Vigenère暗号はキーワードを設定してください（例: SECRET）",
                "「コピー」ボタンで変換結果をコピーできます",
                "「入れ替え」ボタンで暗号文⇔平文の変換を行えます",
              ],
            },
            {
              title: "暗号方式の説明",
              items: [
                "ROT13: アルファベットを13文字シフト。同じ操作で暗号化/復号化できます",
                "Caesar暗号: Julius Caesarが使用した古典的な換字式暗号",
                "Vigenère暗号: キーワードに基づく多表式換字暗号。Caesar暗号より解読困難",
                "Atbash暗号: ヘブライ語アルファベットを基にした換字式暗号（A↔Z）",
              ],
            },
            {
              title: "注意事項",
              items: [
                "これらは教育目的の古典暗号です。実際のセキュリティ用途には使用しないでください",
                "アルファベット以外の文字（日本語、数字、記号）はそのまま出力されます",
                "Vigenère暗号のキーに含まれる非アルファベット文字は無視されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
