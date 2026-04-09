import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { validateIban, TEST_IBAN_NUMBERS, type IbanResult } from "../utils/iban";

export const Route = createFileRoute("/iban")({
  head: () => ({
    meta: [
      { title: "IBAN バリデーター | Web ツール集" },
      {
        name: "description",
        content:
          "MOD-97アルゴリズムでIBAN（国際銀行口座番号）を検証するツール。ドイツ・イギリス・フランス・スペインなど80カ国以上に対応。ブラウザ内完結で入力データは外部送信されません。",
      },
      {
        property: "og:title",
        content: "IBAN バリデーター | Web ツール集",
      },
      {
        property: "og:description",
        content: "MOD-97アルゴリズムでIBAN国際銀行口座番号を検証。80カ国以上に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/iban` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "IBAN バリデーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "MOD-97アルゴリズムでIBAN国際銀行口座番号を検証。80カ国以上に対応。",
      },
    ],
  }),
  component: IbanValidator,
});

/**
 * IBANバリデーターコンポーネント
 * MOD-97アルゴリズムによるIBAN検証・フォーマット・詳細情報表示を提供する
 */
function IbanValidator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<IbanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((value: string) => {
    // 英数字・スペース・ハイフンのみ許可
    const sanitized = value.replace(/[^A-Za-z0-9\s-]/g, "");
    setInput(sanitized);

    const stripped = sanitized.replace(/[\s-]/g, "");
    if (stripped.length === 0) {
      setResult(null);
      return;
    }
    setResult(validateIban(sanitized));
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setResult(null);
    inputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleUseTestNumber = useCallback(
    (iban: string) => {
      setInput(iban);
      setResult(validateIban(iban));
      inputRef.current?.focus();
      announceStatus(`テスト番号を入力しました: ${iban}`);
    },
    [announceStatus],
  );

  const handleCopyFormatted = useCallback(async () => {
    if (!result?.formatted) {
      showToast("コピーするデータがありません", "error");
      return;
    }
    const success = await copy(result.formatted);
    if (success) {
      showToast("IBANをコピーしました", "success");
      announceStatus("クリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, copy, showToast, announceStatus]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showDetails = result !== null && result.normalized.length >= 4;
  const isOverallValid = result?.isValid === true && result?.isValidLength === true;

  return (
    <>
      <div className="iban-container">
        {/* 入力セクション */}
        <section className="iban-input-section" aria-labelledby="iban-heading">
          <h2 id="iban-heading" className="section-title">
            IBAN バリデーター
          </h2>

          <div className="iban-input-row">
            <label htmlFor="iban-input" className="sr-only">
              IBAN番号
            </label>
            <input
              id="iban-input"
              ref={inputRef}
              type="text"
              className="iban-input"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例: DE89 3704 0044 0532 0130 00"
              aria-label="IBAN番号"
              aria-describedby="iban-input-help"
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <span id="iban-input-help" className="sr-only">
            IBAN番号を入力するとリアルタイムで検証されます。スペース・ハイフンは自動的に除去されます。
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
            {result && result.normalized.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopyFormatted}
                aria-label="フォーマット済みIBANをコピー"
              >
                コピー
              </Button>
            )}
          </div>

          {/* 検証結果バナー */}
          {showDetails && (
            <div
              className={`iban-result-banner ${isOverallValid ? "valid" : "invalid"}`}
              role="status"
              aria-live="polite"
              aria-label="IBAN検証結果"
            >
              <span className="iban-result-icon">{isOverallValid ? "✓" : "✗"}</span>
              <div className="iban-result-text">
                <div className="iban-result-title">
                  {result.errorMessage
                    ? `エラー: ${result.errorMessage}`
                    : result.isValid && result.isValidLength
                      ? "IBAN検証: 有効"
                      : result.isValid && !result.isValidLength
                        ? "MOD-97: 通過 (桁数不一致)"
                        : "IBAN検証: 無効"}
                </div>
                <div className="iban-result-subtitle">
                  {result.country
                    ? `${result.country.name} (${result.country.length}桁)`
                    : result.countryCode
                      ? `国コード: ${result.countryCode} (未登録/非対応)`
                      : "国コード不明"}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 詳細情報 */}
        {showDetails && (
          <section className="iban-details-section" aria-labelledby="iban-details-heading">
            <h3 id="iban-details-heading" className="section-title">
              詳細情報
            </h3>
            <div className="iban-details-grid">
              <div className="iban-detail-card span-2">
                <div className="iban-detail-label">フォーマット済み IBAN</div>
                <div className="iban-formatted-display">{result.formatted}</div>
              </div>

              <div className="iban-detail-card">
                <div className="iban-detail-label">MOD-97 チェック</div>
                <div className={`iban-detail-value ${result.isValid ? "valid" : "invalid"}`}>
                  {result.isValid ? "✓ 通過" : "✗ 失敗"}
                </div>
              </div>

              <div className="iban-detail-card">
                <div className="iban-detail-label">桁数</div>
                <div className={`iban-detail-value ${result.isValidLength ? "valid" : "invalid"}`}>
                  {result.normalized.length}桁{result.isValidLength ? " ✓" : " ✗"}
                </div>
              </div>

              <div className="iban-detail-card">
                <div className="iban-detail-label">国コード</div>
                <div className="iban-detail-value">
                  {result.countryCode || "—"}
                  {result.country ? ` (${result.country.name})` : ""}
                </div>
              </div>

              <div className="iban-detail-card">
                <div className="iban-detail-label">チェックディジット</div>
                <div className="iban-detail-value">{result.checkDigits || "—"}</div>
              </div>

              <div className="iban-detail-card span-2">
                <div className="iban-detail-label">BBAN（基本銀行口座番号）</div>
                <div className="iban-detail-value">{result.bban || "—"}</div>
              </div>
            </div>
          </section>
        )}

        {/* テスト番号セクション */}
        <section className="iban-test-section" aria-labelledby="iban-test-heading">
          <h3 id="iban-test-heading" className="section-title">
            テスト用 IBAN 番号
          </h3>
          <p className="iban-test-note">
            これらは ISO 13616-1:2020 / Wikipedia に記載のサンプル IBAN
            です。実際の銀行口座ではありません。
          </p>
          <div className="iban-test-table-wrapper">
            <table className="iban-test-table" aria-label="テスト用IBAN番号一覧">
              <thead>
                <tr>
                  <th scope="col">国</th>
                  <th scope="col">IBAN</th>
                  <th scope="col">備考</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {TEST_IBAN_NUMBERS.map((item) => (
                  <tr key={item.iban}>
                    <td>{item.country}</td>
                    <td>
                      <code className="iban-test-number">{item.iban}</code>
                    </td>
                    <td>{item.note}</td>
                    <td>
                      <button
                        type="button"
                        className="iban-use-btn"
                        onClick={() => handleUseTestNumber(item.iban)}
                        aria-label={`${item.country} ${item.iban} を入力欄に設定`}
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
                "入力欄にIBAN番号を入力するとリアルタイムで検証されます",
                "スペース（例: DE89 3704 0044）やハイフン区切りでも入力可能",
                "「テスト用IBAN番号」の「使用」ボタンで検証を試せます",
                "「コピー」ボタンでフォーマット済みIBANをクリップボードにコピー",
              ],
            },
            {
              title: "IBANとは",
              items: [
                "IBAN（International Bank Account Number）は国際標準ISO 13616に基づく銀行口座番号",
                "2桁の国コード + 2桁のチェックディジット + 国固有のBBAN（最大30桁）で構成",
                "ドイツ（DE）22桁、イギリス（GB）22桁など、国によって桁数が異なります",
                "日本・アメリカ・中国など一部の国ではIBANシステムを採用していません",
              ],
            },
            {
              title: "MOD-97アルゴリズム",
              items: [
                "最初の4文字（国コード+チェックディジット）を末尾に移動",
                "A=10, B=11, ..., Z=35 に変換して全体を数値文字列化",
                "この数値をMOD 97で割った余りが1になれば有効",
                "ISO 7064標準に基づく数学的チェックサムアルゴリズムです",
              ],
            },
            {
              title: "セキュリティ上の注意",
              items: [
                "入力データはブラウザ内で完結し、外部サーバーには送信されません",
                "実際の銀行口座番号は第三者と共有しないでください",
                "このツールはテスト・開発・教育目的にのみ使用してください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
