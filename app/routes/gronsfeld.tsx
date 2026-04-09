import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { gronsfeldEncrypt, gronsfeldDecrypt, normalizeKey, isValidKey } from "../utils/gronsfeld";
import "../styles/tools/gronsfeld.css";

export const Route = createFileRoute("/gronsfeld")({
  head: () => ({
    meta: [
      { title: "グロンスフェルト暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "グロンスフェルト暗号（Gronsfeld cipher）のエンコード・デコードツール。数字（0-9）をキーとして使用するヴィジュネル暗号の変形。17世紀に考案されたポリアルファベット換字式暗号。",
      },
      { property: "og:title", content: "グロンスフェルト暗号 | Web ツール集" },
      {
        property: "og:description",
        content:
          "グロンスフェルト暗号のエンコード・デコードツール。数字キーを使用したポリアルファベット換字式暗号の変換ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/gronsfeld` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "グロンスフェルト暗号 | Web ツール集" },
      {
        name: "twitter:description",
        content: "グロンスフェルト暗号（Gronsfeld cipher）のエンコード・デコードツール。",
      },
    ],
  }),
  component: GronsfeldCipher,
});

type Mode = "encrypt" | "decrypt";

/**
 * グロンスフェルト暗号ツールコンポーネント
 * 数字キーを使ったポリアルファベット換字式暗号の暗号化・復号化を提供する
 */
function GronsfeldCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [key, setKey] = useState("1234");
  const [mode, setMode] = useState<Mode>("encrypt");

  const normalizedKey = useMemo(() => normalizeKey(key), [key]);
  const keyValid = isValidKey(key);

  const output = useMemo(() => {
    if (!inputText || !keyValid) return "";
    return mode === "encrypt" ? gronsfeldEncrypt(inputText, key) : gronsfeldDecrypt(inputText, key);
  }, [inputText, key, keyValid, mode]);

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
    setMode((prev) => (prev === "encrypt" ? "decrypt" : "encrypt"));
    announceStatus("変換結果を入力にセットし、モードを切り替えました");
  }, [output, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="gronsfeld-mode-heading">
          <h2 id="gronsfeld-mode-heading" className="section-title">
            モード
          </h2>
          <div className="gronsfeld-mode-group" role="group" aria-label="暗号化・復号化モード">
            <Button
              type="button"
              variant={mode === "encrypt" ? "default" : "outline"}
              onClick={() => setMode("encrypt")}
              aria-pressed={mode === "encrypt"}
            >
              暗号化
            </Button>
            <Button
              type="button"
              variant={mode === "decrypt" ? "default" : "outline"}
              onClick={() => setMode("decrypt")}
              aria-pressed={mode === "decrypt"}
            >
              復号化
            </Button>
          </div>
        </section>

        <section aria-labelledby="gronsfeld-key-heading">
          <h2 id="gronsfeld-key-heading" className="section-title">
            数字キー
          </h2>
          <div className="gronsfeld-key-row">
            <label htmlFor="gronsfeld-key-input" className="gronsfeld-key-label">
              キー:
            </label>
            <input
              id="gronsfeld-key-input"
              type="text"
              inputMode="numeric"
              className="gronsfeld-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="数字キーを入力（例: 1234）"
              aria-label="グロンスフェルト暗号の数字キー"
              aria-describedby="gronsfeld-key-desc"
            />
            {normalizedKey && (
              <span className="gronsfeld-key-badge gronsfeld-key-badge--valid" aria-live="polite">
                有効なキー: {normalizedKey}
              </span>
            )}
            {!keyValid && key.length > 0 && (
              <span className="gronsfeld-key-badge" aria-live="polite">
                数字を含むキーを入力してください
              </span>
            )}
          </div>
          <p id="gronsfeld-key-desc" className="gronsfeld-key-visual-title">
            数字（0-9）のみ有効。英字・記号は無視されます。
          </p>

          {normalizedKey.length > 0 && (
            <div className="gronsfeld-key-visual" aria-label="キー数字とシフト量">
              <p className="gronsfeld-key-visual-title">キー数字（シフト量）:</p>
              <div className="gronsfeld-key-digits" role="list">
                {normalizedKey.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="gronsfeld-key-digit"
                    role="listitem"
                    aria-label={`${digit}: シフト量${digit}`}
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="gronsfeld-input-heading">
          <h2 id="gronsfeld-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="gronsfeld-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encrypt" ? "暗号化するテキストを入力" : "復号化するテキストを入力"
            }
            rows={4}
            aria-label="グロンスフェルト暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="gronsfeld-output-heading">
          <h2 id="gronsfeld-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="gronsfeld-output"
            className={`gronsfeld-output${isEmpty || !keyValid ? " gronsfeld-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty
              ? "変換結果がここに表示されます"
              : !keyValid
                ? "有効な数字キーを入力してください"
                : output}
          </div>

          <div className="gronsfeld-actions" role="group" aria-label="操作">
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
              aria-label="変換結果を入力にセットしてモードを切り替え"
            >
              結果を入力にセット
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
                "モード（暗号化・復号化）を選択し、数字キーと変換するテキストを入力してください",
                "「結果を入力にセット」ボタンで変換結果を入力に戻し、モードも自動で切り替わります",
                "暗号化→復号化で元のテキストに戻ります",
              ],
            },
            {
              title: "グロンスフェルト暗号について",
              items: [
                "17世紀にグロンスフェルト伯爵（Count of Gronsfeld）が考案したポリアルファベット換字式暗号です",
                "ヴィジュネル暗号の変形で、英字の代わりに数字（0-9）をキーとして使用します",
                "暗号化式: C = (P + K) mod 26（K: キー数字, P: 平文文字の値, C: 暗号文字の値）",
                "復号化式: P = (C - K + 26) mod 26",
                "英字のみが変換され、数字・記号・日本語はそのまま保持されます",
                "大文字・小文字が保持されます（大文字→大文字、小文字→小文字）",
                "数字キー（0-9のみ）のため、ヴィジュネル暗号（26文字）より鍵空間が小さく安全性は低めです",
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
