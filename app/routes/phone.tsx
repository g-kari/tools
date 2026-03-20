import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  parsePhone,
  SAMPLE_PHONE_NUMBERS,
  type PhoneResult,
} from "../utils/phone";

export const Route = createFileRoute("/phone")({
  head: () => ({
    meta: [
      { title: "日本電話番号フォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "日本の電話番号を入力するとリアルタイムで種別判定・フォーマット変換を行います。ハイフン区切り・国際表記（+81）・E.164形式に対応。携帯・固定・フリーダイヤル・IP電話など全種別対応。",
      },
      {
        property: "og:title",
        content: "日本電話番号フォーマッター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "日本の電話番号をリアルタイムで種別判定・フォーマット変換。ハイフン・国際表記・E.164形式に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/phone` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "日本電話番号フォーマッター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "日本の電話番号をリアルタイムで種別判定・フォーマット変換。ハイフン・国際表記・E.164形式に対応。",
      },
    ],
  }),
  component: PhoneFormatter,
});

/**
 * 日本電話番号フォーマッターコンポーネント
 * 電話番号の種別判定・ハイフン/国際/E.164フォーマット変換・コピー機能を提供する
 */
function PhoneFormatter() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<PhoneResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (value.trim().length === 0) {
      setResult(null);
      return;
    }
    setResult(parsePhone(value));
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setResult(null);
    inputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleUseSample = useCallback(
    (number: string) => {
      setInput(number);
      setResult(parsePhone(number));
      inputRef.current?.focus();
      announceStatus(`サンプル番号を入力しました: ${number}`);
    },
    [announceStatus]
  );

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const success = await copy(text);
      if (success) {
        showToast(`${label}をコピーしました`, "success");
        announceStatus("クリップボードにコピーしました");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showResult = result !== null && result.normalized.length > 0;
  const showFormats = showResult && result.isValid && result.international !== null;

  return (
    <>
      <div className="phone-container">
        {/* 入力セクション */}
        <section
          className="phone-input-section"
          aria-labelledby="phone-heading"
        >
          <h2 id="phone-heading" className="section-title">
            日本電話番号フォーマッター
          </h2>

          <div className="phone-input-row">
            <label htmlFor="phone-input" className="sr-only">
              電話番号
            </label>
            <input
              id="phone-input"
              ref={inputRef}
              type="text"
              className="phone-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例: 090-1234-5678 または ０９０１２３４５６７８"
              aria-label="電話番号"
              aria-describedby="phone-input-help"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              inputMode="tel"
            />
          </div>
          <span id="phone-input-help" className="sr-only">
            電話番号を入力するとリアルタイムで種別判定とフォーマット変換が行われます。全角数字・ハイフン・スペースは自動的に正規化されます。
          </span>

          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!input}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>

          {/* 結果バナー */}
          {showResult && (
            <div
              className={`phone-result-banner ${result.isValid ? "valid" : "invalid"}`}
              role="status"
              aria-live="polite"
              aria-label="電話番号検証結果"
            >
              <span className="phone-result-icon">
                {result.isValid ? "✓" : "✗"}
              </span>
              <div className="phone-result-text">
                <div className="phone-result-title">
                  {result.errorMessage
                    ? `エラー: ${result.errorMessage}`
                    : `${result.typeLabel} — 有効な番号`}
                </div>
                <div className="phone-result-subtitle">
                  {result.isValid
                    ? `正規化: ${result.normalized}`
                    : `入力: ${result.normalized || "（空）"}`}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* フォーマット結果 */}
        {showFormats && (
          <section
            className="phone-formats-section"
            aria-labelledby="phone-formats-heading"
          >
            <h3 id="phone-formats-heading" className="section-title">
              フォーマット結果
            </h3>
            <div className="phone-formats-grid">
              {result.hyphenated && (
                <div className="phone-format-card">
                  <div className="phone-format-label">ハイフン区切り</div>
                  <div className="phone-format-value">{result.hyphenated}</div>
                  <button
                    type="button"
                    className="phone-copy-btn"
                    onClick={() => handleCopy(result.hyphenated!, "ハイフン区切り")}
                    aria-label={`ハイフン区切り ${result.hyphenated} をコピー`}
                  >
                    コピー
                  </button>
                </div>
              )}
              {result.international && (
                <div className="phone-format-card">
                  <div className="phone-format-label">国際表記</div>
                  <div className="phone-format-value">{result.international}</div>
                  <button
                    type="button"
                    className="phone-copy-btn"
                    onClick={() => handleCopy(result.international!, "国際表記")}
                    aria-label={`国際表記 ${result.international} をコピー`}
                  >
                    コピー
                  </button>
                </div>
              )}
              {result.e164 && (
                <div className="phone-format-card">
                  <div className="phone-format-label">E.164形式</div>
                  <div className="phone-format-value">{result.e164}</div>
                  <button
                    type="button"
                    className="phone-copy-btn"
                    onClick={() => handleCopy(result.e164!, "E.164形式")}
                    aria-label={`E.164形式 ${result.e164} をコピー`}
                  >
                    コピー
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* サンプル番号 */}
        <section
          className="phone-sample-section"
          aria-labelledby="phone-sample-heading"
        >
          <h3 id="phone-sample-heading" className="section-title">
            サンプル番号
          </h3>
          <p className="phone-sample-note">
            これらはテスト・デモ用のサンプル番号です。実際の電話番号ではありません。
          </p>
          <div className="phone-sample-table-wrapper">
            <table
              className="phone-sample-table"
              aria-label="サンプル電話番号一覧"
            >
              <thead>
                <tr>
                  <th scope="col">種別</th>
                  <th scope="col">番号</th>
                  <th scope="col">備考</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_PHONE_NUMBERS.map((item) => (
                  <tr key={item.number}>
                    <td>{item.label}</td>
                    <td>
                      <code className="phone-sample-number">{item.number}</code>
                    </td>
                    <td>{item.note}</td>
                    <td>
                      <button
                        type="button"
                        className="phone-use-btn"
                        onClick={() => handleUseSample(item.number)}
                        aria-label={`${item.label} ${item.number} を入力欄に設定`}
                      >
                        使用
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "電話番号を入力すると種別判定とフォーマット変換がリアルタイムで行われます",
                "全角数字（０９０…）・ハイフン・スペースは自動的に正規化されます",
                "サンプル番号の「使用」ボタンで各種フォーマットを試せます",
                "各フォーマットの「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "対応する番号種別",
              items: [
                "携帯電話: 070/080/090 で始まる11桁",
                "IP電話: 050 で始まる11桁",
                "フリーダイヤル: 0120（10桁）・0800（11桁）",
                "ナビダイヤル: 0570 で始まる10桁",
                "固定電話: 市外局番により10〜11桁",
                "緊急電話: 110（警察）・119（救急消防）・118（海上保安庁）",
              ],
            },
            {
              title: "フォーマットの説明",
              items: [
                "ハイフン区切り: 国内向け標準表記（例: 090-1234-5678）",
                "国際表記: 国際電話用（例: +81 90-1234-5678）",
                "E.164形式: ITU-T勧告に準拠したプログラム向け形式（例: +819012345678）",
              ],
            },
            {
              title: "注意事項",
              items: [
                "入力データはブラウザ内で完結し、外部サーバーには送信されません",
                "市外局番のマッピングは主要な局番のみ対応しています",
                "実際の電話番号は第三者と共有しないよう注意してください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
