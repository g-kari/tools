import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeVigenere, decodeVigenere, normalizeKey, isValidKey } from "../utils/vigenere";
import "../styles/tools/vigenere.css";

export const Route = createFileRoute("/vigenere")({
  head: () => ({
    meta: [
      { title: "ヴィジュネル暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "ヴィジュネル暗号（Vigenère cipher）のエンコード・デコードツール。キーワードを指定したポリアルファベット換字式暗号の変換に対応。",
      },
      {
        property: "og:title",
        content: "ヴィジュネル暗号 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ヴィジュネル暗号のエンコード・デコードツール。キーワードを指定したポリアルファベット換字式暗号の変換に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/vigenere` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ヴィジュネル暗号 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "ヴィジュネル暗号のエンコード・デコードツール。",
      },
    ],
  }),
  component: VigenereCipher,
});

type Mode = "encode" | "decode";

/**
 * ヴィジュネル暗号ツールコンポーネント
 * キーワードを使ったポリアルファベット換字式暗号のエンコード・デコードを提供する
 */
function VigenereCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [key, setKey] = useState("KEY");
  const [mode, setMode] = useState<Mode>("encode");

  const normalizedKey = useMemo(() => normalizeKey(key), [key]);
  const keyValid = isValidKey(key);

  const output = useMemo(() => {
    if (!inputText || !keyValid) return "";
    if (mode === "encode") return encodeVigenere(inputText, key);
    return decodeVigenere(inputText, key);
  }, [inputText, key, mode, keyValid]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    if (ok) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, copy, showToast, announceStatus]);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setInputText(output);
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
    announceStatus("入力と出力を入れ替えました");
  }, [output, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === "encode" ? "エンコードモードに切り替えました" : "デコードモードに切り替えました"
      );
    },
    [announceStatus]
  );

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="vigenere-mode-heading">
          <h2 id="vigenere-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="vigenere-mode-group" role="group" aria-label="変換モード">
            <Button
              type="button"
              variant={mode === "encode" ? "default" : "outline"}
              onClick={() => handleModeChange("encode")}
              aria-pressed={mode === "encode"}
            >
              エンコード
            </Button>
            <Button
              type="button"
              variant={mode === "decode" ? "default" : "outline"}
              onClick={() => handleModeChange("decode")}
              aria-pressed={mode === "decode"}
            >
              デコード
            </Button>
          </div>
        </section>

        <section aria-labelledby="vigenere-key-heading">
          <h2 id="vigenere-key-heading" className="section-title">
            キーワード
          </h2>
          <div className="vigenere-key-row">
            <label htmlFor="vigenere-key-input" className="vigenere-key-label">
              キー:
            </label>
            <input
              id="vigenere-key-input"
              type="text"
              className="vigenere-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="英字キーワードを入力（例: SECRET）"
              aria-label="ヴィジュネル暗号のキーワード"
              aria-describedby="vigenere-key-desc"
            />
            {normalizedKey && (
              <span className="vigenere-key-badge vigenere-key-badge--valid" aria-live="polite">
                有効なキー: {normalizedKey}
              </span>
            )}
            {!keyValid && key.length > 0 && (
              <span className="vigenere-key-badge" aria-live="polite">
                英字を含むキーを入力してください
              </span>
            )}
          </div>
          <p id="vigenere-key-desc" className="vigenere-key-visual-title">
            英字のみ有効。大文字・小文字は区別せず、数字・記号は無視されます。
          </p>

          {normalizedKey.length > 0 && (
            <div className="vigenere-key-visual" aria-label="キー文字とシフト量">
              <p className="vigenere-key-visual-title">キー文字（シフト量）:</p>
              <div className="vigenere-key-chars" role="list">
                {normalizedKey.split("").map((char, i) => (
                  <div key={i} className="vigenere-key-char" role="listitem" aria-label={`${char}: シフト${char.charCodeAt(0) - 65}`}>
                    <span className="vigenere-key-char-inner">
                      <span>{char}</span>
                      <span className="vigenere-key-char-shift">+{char.charCodeAt(0) - 65}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="vigenere-input-heading">
          <h2 id="vigenere-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="vigenere-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === "encode" ? "暗号化するテキストを入力" : "復号するテキストを入力"}
            rows={4}
            aria-label="ヴィジュネル暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="vigenere-output-heading">
          <h2 id="vigenere-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="vigenere-output"
            className={`vigenere-output${isEmpty || !keyValid ? " vigenere-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty
              ? "変換結果がここに表示されます"
              : !keyValid
                ? "有効なキーワードを入力してください"
                : output}
          </div>

          <div className="vigenere-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty || !keyValid || !output}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwap}
              disabled={isEmpty || !keyValid || !output}
              aria-label="入出力を入れ替えてモードを切り替え"
            >
              入出力を入れ替え
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "キーワード（英字）を入力し、エンコードまたはデコードを選択してください",
                "エンコード: キーワードの各文字に対応するシフト量でテキストを暗号化します",
                "デコード: 同じキーワードを指定して元のテキストに復号します",
                "「入出力を入れ替え」で暗号文→復号の流れに一発で切り替えられます",
              ],
            },
            {
              title: "ヴィジュネル暗号について",
              items: [
                "英字のみがキーワードに基づいてシフトされ、数字・記号・日本語はそのまま保持されます",
                "キーワードの各文字が順番にシフト量（A=0, B=1 … Z=25）として使用されます",
                "例: キー「KEY」でテキスト「ABC」→ A+K(+10)=K, B+E(+4)=F, C+Y(+24)=A(26%26=0) → \"KFA\"",
                "シーザー暗号より解読が難しいですが、現代の暗号としては使用しないでください",
                "CTFやパズル、歴史的な暗号学の学習などに活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
