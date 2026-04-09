import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { atbash, getAtbashTable } from "../utils/atbash";
import "../styles/tools/atbash.css";

export const Route = createFileRoute("/atbash")({
  head: () => ({
    meta: [
      { title: "アトバシュ暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "アトバシュ暗号（Atbash cipher）のエンコード・デコードツール。ヘブライ語起源の換字式暗号。アルファベットを逆順にマッピング（A↔Z, B↔Y）。自己逆関数のため暗号化と復号化が同じ操作。アルファベット対応表の可視化付き。",
      },
      { property: "og:title", content: "アトバシュ暗号 | Web ツール集" },
      {
        property: "og:description",
        content:
          "アトバシュ暗号のエンコード・デコードツール。A↔Z, B↔Yのアルファベット逆順マッピング。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/atbash` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "アトバシュ暗号 | Web ツール集" },
      {
        name: "twitter:description",
        content: "アトバシュ暗号（Atbash cipher）のエンコード・デコードツール。",
      },
    ],
  }),
  component: AtbashTool,
});

const ATBASH_TABLE = getAtbashTable();

/**
 * アトバシュ暗号ツールコンポーネント
 * テキストのアトバシュ変換（自己逆関数）とアルファベット対応表の可視化を提供する
 */
function AtbashTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");

  const output = useMemo(() => {
    if (!inputText) return "";
    return atbash(inputText);
  }, [inputText]);

  // Get set of uppercase letters present in the input for highlighting
  const activeLetters = useMemo(() => {
    return new Set(
      inputText
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split(""),
    );
  }, [inputText]);

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
    // Since atbash is self-inverse, swap just puts the output back as input
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
        <section aria-labelledby="atbash-input-heading">
          <h2 id="atbash-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="atbash-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="変換するテキストを入力（暗号化・復号化とも同じ操作）"
            rows={4}
            aria-label="アトバシュ暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="atbash-output-heading">
          <h2 id="atbash-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="atbash-output"
            className={`atbash-output${isEmpty ? " atbash-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output}
          </div>

          <div className="atbash-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwap}
              disabled={isEmpty}
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

        <section aria-labelledby="atbash-table-heading">
          <h2 id="atbash-table-heading" className="section-title">
            アルファベット対応表
          </h2>
          <div
            className="atbash-mapping-grid"
            role="list"
            aria-label="アトバシュ暗号のアルファベット対応表"
          >
            {ATBASH_TABLE.map(({ original, mapped }) => (
              <div
                key={original}
                className={`atbash-mapping-cell${activeLetters.has(original) ? " atbash-mapping-cell--active" : ""}`}
                role="listitem"
                aria-label={`${original} は ${mapped} に変換`}
              >
                <span className="atbash-mapping-original">{original}</span>
                <span className="atbash-mapping-arrow">↕</span>
                <span className="atbash-mapping-result">{mapped}</span>
              </div>
            ))}
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テキストを入力すると自動でアトバシュ変換されます",
                "アトバシュ暗号は自己逆関数のため、暗号化と復号化で同じ操作を行います",
                "「結果を入力にセット」ボタンで変換結果を入力に戻し、再変換できます",
                "入力テキストに含まれる英字は対応表でハイライト表示されます",
              ],
            },
            {
              title: "アトバシュ暗号について",
              items: [
                "ヘブライ語アルファベットの最初(Aleph/א)と最後(Taw/ת)、2番目(Beth/ב)と末尾から2番目(Shin/שׁ)を入れ替えることに由来します",
                "アルファベット逆順マッピング：A↔Z, B↔Y, C↔X, ..., M↔N",
                "英字のみが変換され、数字・記号・日本語などはそのまま保持されます",
                "大文字・小文字が保持されます（大文字→大文字、小文字→小文字）",
                "旧約聖書（エレミヤ書）でも使用された最古の暗号手法の一つです",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
