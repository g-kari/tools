import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { detectZeroWidthChars, removeZeroWidthChars, formatCodePoint } from "../utils/zero-width";
import "../styles/tools/zero-width.css";

export const Route = createFileRoute("/zero-width")({
  head: () => ({
    meta: [
      { title: "ゼロ幅文字検出・除去 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストに含まれるゼロ幅スペース・ZWJ・BOM・方向制御文字などの不可視Unicode文字を検出し、一括除去するツール。コピペテキストに混入した不可視文字の確認・クリーニングに。",
      },
      { property: "og:title", content: "ゼロ幅文字検出・除去 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストに含まれる不可視Unicode文字（ゼロ幅スペース・ZWJ・BOM等）を検出・除去するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/zero-width` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ゼロ幅文字検出・除去 | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストに含まれる不可視Unicode文字を検出・除去するツール。",
      },
    ],
  }),
  component: ZeroWidthTool,
});

const SAMPLE_WITH_ZWSP = "Hello\u200B World\u200C!\u200DTest\uFEFFEnd";

/**
 * ゼロ幅文字検出・除去ツールコンポーネント
 */
function ZeroWidthTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");

  const result = useMemo(() => detectZeroWidthChars(inputText), [inputText]);

  const cleanedText = useMemo(
    () => (result.hasZeroWidthChars ? removeZeroWidthChars(inputText) : inputText),
    [inputText, result.hasZeroWidthChars],
  );

  const handleLoadSample = useCallback(() => {
    setInputText(SAMPLE_WITH_ZWSP);
    announceStatus("サンプルテキストを読み込みました");
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleApplyClean = useCallback(() => {
    setInputText(cleanedText);
    announceStatus(`${result.totalCount}件のゼロ幅文字を除去しました`);
    showToast(`${result.totalCount}件のゼロ幅文字を除去しました`, "success");
  }, [cleanedText, result.totalCount, announceStatus, showToast]);

  const handleCopyClean = useCallback(async () => {
    if (!cleanedText) return;
    const ok = await copy(cleanedText);
    if (ok) {
      showToast("クリーン済みテキストをコピーしました", "success");
      announceStatus("クリーン済みテキストをクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [cleanedText, copy, showToast, announceStatus]);

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container zw-container">
        {/* 入力セクション */}
        <section aria-labelledby="zw-input-heading" className="zw-input-section">
          <h2 id="zw-input-heading" className="section-title">
            テキスト入力
          </h2>
          <textarea
            id="zw-input"
            className="zw-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="検査したいテキストを貼り付けてください…"
            aria-label="検査対象のテキスト"
            spellCheck={false}
            rows={6}
          />

          {/* ステータス表示 */}
          {!isEmpty && (
            <div className="zw-status" aria-live="polite" aria-atomic="true">
              {result.hasZeroWidthChars ? (
                <span className="zw-status-badge zw-status-badge--found">
                  <span className="zw-status-badge--icon" aria-hidden="true">
                    ⚠
                  </span>
                  {result.totalCount}件のゼロ幅文字を検出（{result.detected.length}種類）
                </span>
              ) : (
                <span className="zw-status-badge zw-status-badge--clean">
                  <span className="zw-status-badge--icon" aria-hidden="true">
                    ✓
                  </span>
                  ゼロ幅文字は検出されませんでした
                </span>
              )}
            </div>
          )}

          {/* 操作ボタン */}
          <div className="zw-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadSample}
              aria-label="サンプルテキストを読み込む"
            >
              サンプル
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
            {result.hasZeroWidthChars && (
              <Button
                type="button"
                variant="default"
                onClick={handleApplyClean}
                aria-label="ゼロ幅文字を入力から除去する"
              >
                除去して適用
              </Button>
            )}
          </div>
        </section>

        {/* 検出結果セクション */}
        {!isEmpty && (
          <section aria-labelledby="zw-result-heading" className="zw-result-section">
            <h2 id="zw-result-heading" className="section-title">
              検出結果
            </h2>

            {result.hasZeroWidthChars ? (
              <div className="zw-table-wrapper">
                <table className="zw-table" aria-label="検出されたゼロ幅文字の一覧">
                  <thead>
                    <tr>
                      <th scope="col">コードポイント</th>
                      <th scope="col">文字名</th>
                      <th scope="col">件数</th>
                      <th scope="col" className="zw-col-positions">
                        位置
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.detected.map(({ def, count, positions }) => (
                      <tr key={def.codePoint}>
                        <td>
                          <span className="zw-cp-badge">{formatCodePoint(def.codePoint)}</span>
                        </td>
                        <td>
                          <span className="zw-char-name">{def.name}</span>
                          <span className="zw-char-unicode-name">{def.unicodeName}</span>
                        </td>
                        <td>
                          <span className="zw-count-badge" aria-label={`${count}件`}>
                            {count}
                          </span>
                        </td>
                        <td className="zw-col-positions">
                          <span
                            className="zw-positions"
                            title={positions.join(", ")}
                            aria-label={`位置: ${positions.slice(0, 10).join(", ")}${positions.length > 10 ? " …" : ""}`}
                          >
                            {positions.slice(0, 10).join(", ")}
                            {positions.length > 10 && ` … (+${positions.length - 10})`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zw-empty-message" data-testid="zw-clean-message">
                ゼロ幅文字・不可視文字は見つかりませんでした
              </p>
            )}
          </section>
        )}

        {/* クリーン済みテキスト */}
        {result.hasZeroWidthChars && (
          <section aria-labelledby="zw-clean-heading" className="zw-clean-section">
            <div className="zw-clean-header">
              <h2 id="zw-clean-heading" className="section-title" style={{ margin: 0 }}>
                クリーン済みテキスト
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyClean}
                aria-label="クリーン済みテキストをコピー"
                size="sm"
              >
                コピー
              </Button>
            </div>
            <textarea
              id="zw-clean-output"
              className="zw-clean-textarea"
              value={cleanedText}
              readOnly
              aria-label="ゼロ幅文字除去後のテキスト"
              aria-live="polite"
              rows={6}
            />
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "ゼロ幅文字・不可視文字とは",
              items: [
                "Unicode には画面に表示されない「不可視」の制御文字が多数存在します",
                "代表例: ゼロ幅スペース (U+200B)、BOM (U+FEFF)、ZWJ (U+200D) など",
                "Webページやドキュメントからコピーしたテキストに混入していることがあります",
                "見た目は正常でも、プログラムでの文字列比較やデータ処理に影響する場合があります",
              ],
            },
            {
              title: "主なゼロ幅文字の用途",
              items: [
                "ZERO WIDTH SPACE (U+200B): アジア言語などで折り返し位置を明示するために使用",
                "ZERO WIDTH JOINER (U+200D): 絵文字の結合（例: 家族の絵文字）に使用",
                "BOM (U+FEFF): ファイル先頭に置かれるエンコーディングの識別子",
                "LTR/RTL マーク: アラビア語・ヘブライ語など双方向テキストの制御に使用",
              ],
            },
            {
              title: "使い方",
              items: [
                "検査したいテキストを入力欄に貼り付けると自動的に検出します",
                "「除去して適用」で入力欄からゼロ幅文字を直接取り除けます",
                "「コピー」でクリーン済みテキストをクリップボードに取得できます",
                "「サンプル」でゼロ幅文字を含むサンプルテキストで試せます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
