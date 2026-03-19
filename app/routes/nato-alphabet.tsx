import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  NATO_ALPHABET_MAP,
  textToNato,
  textToNatoString,
} from "../utils/nato-alphabet";

export const Route = createFileRoute("/nato-alphabet")({
  head: () => ({
    meta: [
      { title: "NATOフォネティックアルファベット | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをNATO/ICAO標準のフォネティックアルファベット（Alpha, Bravo, Charlie...）に変換するツール。パスワードや識別子を電話で正確に伝えるのに便利。",
      },
      {
        property: "og:title",
        content: "NATOフォネティックアルファベット | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "テキストをNATO/ICAO標準のフォネティックアルファベット（Alpha, Bravo, Charlie...）に変換するツール。パスワードや識別子を電話で正確に伝えるのに便利。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/nato-alphabet` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: NatoAlphabetConverter,
});

/** NATOリファレンス用のエントリ */
const REFERENCE_ENTRIES = Object.entries(NATO_ALPHABET_MAP);

/**
 * NATOフォネティックアルファベット変換コンポーネント
 */
function NatoAlphabetConverter() {
  const [inputText, setInputText] = useState("");
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** 各文字のフォネティック変換結果 */
  const natoResults = useMemo(() => textToNato(inputText), [inputText]);

  /** テキスト形式の変換結果 */
  const natoString = useMemo(
    () => textToNatoString(inputText),
    [inputText]
  );

  const handleCopy = async () => {
    if (!natoString) return;
    const success = await copy(natoString);
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

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">NATOフォネティックアルファベット</h2>

        {/* 入力エリア */}
        <div className="nato-input-area">
          <label htmlFor="nato-input" className="section-title">
            変換するテキスト
          </label>
          <Textarea
            id="nato-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="例: HELLO WORLD"
            rows={3}
            aria-describedby="nato-input-hint"
          />
          <p id="nato-input-hint" className="nato-input-hint">
            入力するとNATOフォネティックアルファベットに自動変換されます（大文字・小文字どちらでも可）
          </p>
        </div>

        {/* アクションボタン */}
        <div className="nato-actions">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!natoString}
            aria-label="変換結果をクリップボードにコピー"
          >
            コピー
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!inputText}
            aria-label="入力内容をクリア"
          >
            クリア
          </Button>
        </div>

        {/* カード形式の変換結果 */}
        <div className="nato-result-area">
          <p className="section-title" aria-hidden="true">
            変換結果（カード表示）
          </p>
          <div
            className="nato-result-grid"
            aria-label="フォネティックアルファベット変換結果"
            aria-live="polite"
          >
            {natoResults.length === 0 ? (
              <span className="nato-result-empty">
                テキストを入力すると変換結果が表示されます
              </span>
            ) : (
              natoResults.map((result, index) => (
                <div
                  key={index}
                  className={[
                    "nato-char-card",
                    result.isSpace ? "nato-char-card--space" : "",
                    !result.isSpace && result.phonetic === null
                      ? "nato-char-card--unknown"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={
                    result.isSpace
                      ? "スペース"
                      : (result.phonetic ?? `未対応: ${result.char}`)
                  }
                >
                  <span className="nato-char-original">
                    {result.isSpace ? "␣" : result.char}
                  </span>
                  <span className="nato-char-phonetic">
                    {result.isSpace
                      ? "(space)"
                      : (result.phonetic ?? "—")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* テキスト形式の出力 */}
        {natoString && (
          <div className="nato-text-output-area">
            <label htmlFor="nato-text-output" className="section-title">
              変換結果（テキスト形式）
            </label>
            <Textarea
              id="nato-text-output"
              value={natoString}
              readOnly
              rows={3}
              aria-label={`テキスト形式の変換結果: ${natoString}`}
            />
          </div>
        )}

        {/* リファレンステーブル */}
        <div className="nato-reference-section">
          <p className="nato-reference-title">
            NATOフォネティックアルファベット一覧
          </p>
          <div
            className="nato-reference-grid"
            aria-label="NATOフォネティックアルファベット対応表"
          >
            {REFERENCE_ENTRIES.map(([letter, phonetic]) => (
              <div key={letter} className="nato-reference-item">
                <span className="nato-reference-letter">{letter}</span>
                <span className="nato-reference-word">{phonetic}</span>
              </div>
            ))}
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "テキスト入力欄に変換したい文字列を入力します",
                "各文字がNATOフォネティックアルファベットのカードに変換されます",
                "「コピー」ボタンでテキスト形式の変換結果をコピーできます",
              ],
            },
            {
              title: "NATOフォネティックアルファベットとは",
              items: [
                "NATO/ICAO（国際民間航空機関）が標準化した音声通信用アルファベット体系です",
                "電話・無線通信で文字を明確に伝えるために使われます（例: A → Alpha）",
                "航空管制・軍・警察・緊急サービスで世界標準として使用されています",
                "パスワードや識別子を口頭で正確に伝える際にも活用できます",
              ],
            },
            {
              title: "対応文字",
              items: [
                "アルファベット: A-Z（大文字・小文字どちらでも可）",
                "数字: 0-9（Zero, One, Two ... Nine）",
                "スペース: (space) として表示されます",
                "その他の記号: 未対応として「—」で表示されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
