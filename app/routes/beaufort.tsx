import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { beaufort, normalizeKey, isValidKey } from "../utils/beaufort";
import "../styles/tools/beaufort.css";

export const Route = createFileRoute("/beaufort")({
  head: () => ({
    meta: [
      { title: "ボーフォート暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "ボーフォート暗号（Beaufort cipher）のエンコード・デコードツール。サー・フランシス・ボーフォート考案のポリアルファベット換字式暗号。ヴィジュネル暗号の変形で、暗号化と復号化が同じ操作（自己逆関数）。",
      },
      { property: "og:title", content: "ボーフォート暗号 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ボーフォート暗号のエンコード・デコードツール。暗号化と復号化が同じ操作の自己逆関数型ポリアルファベット換字式暗号。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/beaufort` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ボーフォート暗号 | Web ツール集" },
      {
        name: "twitter:description",
        content: "ボーフォート暗号（Beaufort cipher）のエンコード・デコードツール。",
      },
    ],
  }),
  component: BeaufortCipher,
});

/**
 * ボーフォート暗号ツールコンポーネント
 * キーワードを使ったポリアルファベット換字式暗号の変換を提供する（自己逆関数）
 */
function BeaufortCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [key, setKey] = useState("KEY");

  const normalizedKey = useMemo(() => normalizeKey(key), [key]);
  const keyValid = isValidKey(key);

  const output = useMemo(() => {
    if (!inputText || !keyValid) return "";
    return beaufort(inputText, key);
  }, [inputText, key, keyValid]);

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
    announceStatus("変換結果を入力にセットしました");
  }, [output, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="beaufort-key-heading">
          <h2 id="beaufort-key-heading" className="section-title">
            キーワード
          </h2>
          <div className="beaufort-key-row">
            <label htmlFor="beaufort-key-input" className="beaufort-key-label">
              キー:
            </label>
            <input
              id="beaufort-key-input"
              type="text"
              className="beaufort-key-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="英字キーワードを入力（例: SECRET）"
              aria-label="ボーフォート暗号のキーワード"
              aria-describedby="beaufort-key-desc"
            />
            {normalizedKey && (
              <span className="beaufort-key-badge beaufort-key-badge--valid" aria-live="polite">
                有効なキー: {normalizedKey}
              </span>
            )}
            {!keyValid && key.length > 0 && (
              <span className="beaufort-key-badge" aria-live="polite">
                英字を含むキーを入力してください
              </span>
            )}
          </div>
          <p id="beaufort-key-desc" className="beaufort-key-visual-title">
            英字のみ有効。大文字・小文字は区別せず、数字・記号は無視されます。
          </p>

          {normalizedKey.length > 0 && (
            <div className="beaufort-key-visual" aria-label="キー文字とシフト量">
              <p className="beaufort-key-visual-title">キー文字（値）:</p>
              <div className="beaufort-key-chars" role="list">
                {normalizedKey.split("").map((char, i) => (
                  <div
                    key={i}
                    className="beaufort-key-char"
                    role="listitem"
                    aria-label={`${char}: 値${char.charCodeAt(0) - 65}`}
                  >
                    <span className="beaufort-key-char-inner">
                      <span>{char}</span>
                      <span className="beaufort-key-char-shift">{char.charCodeAt(0) - 65}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="beaufort-input-heading">
          <h2 id="beaufort-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="beaufort-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="変換するテキストを入力（暗号化・復号化とも同じ操作）"
            rows={4}
            aria-label="ボーフォート暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="beaufort-output-heading">
          <h2 id="beaufort-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="beaufort-output"
            className={`beaufort-output${isEmpty || !keyValid ? " beaufort-output--empty" : ""}`}
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

          <div className="beaufort-actions" role="group" aria-label="操作">
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
              aria-label="変換結果を入力にセット（再変換で元に戻る）"
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
                "キーワード（英字）を入力し、変換するテキストを入力してください",
                "ボーフォート暗号は自己逆関数のため、暗号化と復号化で同じ操作を行います",
                "「結果を入力にセット」ボタンで変換結果を入力に戻し、再変換で元のテキストに戻ります",
              ],
            },
            {
              title: "ボーフォート暗号について",
              items: [
                "19世紀にサー・フランシス・ボーフォート（風力階級の考案者）が発明したポリアルファベット換字式暗号です",
                "変換式: C = (K - P + 26) % 26（K: キー文字の値, P: 平文文字の値, C: 暗号文字の値）",
                "ヴィジュネル暗号（C = P + K）の「減算版」で、同じ式で暗号化・復号化が行えます",
                "英字のみが変換され、数字・記号・日本語はそのまま保持されます",
                "大文字・小文字が保持されます（大文字→大文字、小文字→小文字）",
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
