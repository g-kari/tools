import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { toDaiji, fromDaiji, DAIJI_REFERENCE } from "../utils/daiji";

export const Route = createFileRoute("/daiji")({
  head: () => ({
    meta: [
      { title: "大字変換 | Web ツール集" },
      {
        name: "description",
        content:
          "アラビア数字と大字（壱・弐・参など）を相互変換するツール。小切手・契約書・法的文書などで使用される改ざん防止用の漢数字に対応。",
      },
      { property: "og:title", content: "大字変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "アラビア数字と大字を相互変換するツール。壱・弐・参・肆・伍・陸・漆・捌・玖・拾・佰・仟・萬に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/daiji` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "大字変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "アラビア数字と大字（壱・弐・参など）を相互変換するツール。",
      },
    ],
  }),
  component: DaijiConverter,
});

/**
 * 大字変換コンポーネント
 * アラビア数字 ↔ 大字の双方向変換を提供する
 */
function DaijiConverter() {
  const { showToast } = useToast();
  const [arabicInput, setArabicInput] = useState("");
  const [arabicResult, setArabicResult] = useState("");
  const [daijiInput, setDaijiInput] = useState("");
  const [daijiResult, setDaijiResult] = useState("");

  const arabicInputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleArabicToDaiji = useCallback(() => {
    const trimmed = arabicInput.trim();
    if (!trimmed) {
      announceStatus("エラー: 数値を入力してください");
      showToast("数値を入力してください", "error");
      arabicInputRef.current?.focus();
      return;
    }
    const result = toDaiji(trimmed);
    if (result === null) {
      announceStatus("エラー: 有効な整数を入力してください（最大20桁）");
      showToast("有効な整数を入力してください（最大20桁）", "error");
      arabicInputRef.current?.focus();
      return;
    }
    setArabicResult(result);
    announceStatus(`変換完了: ${result}`);
  }, [arabicInput, announceStatus, showToast]);

  const handleDaijiToArabic = useCallback(() => {
    const trimmed = daijiInput.trim();
    if (!trimmed) {
      announceStatus("エラー: 大字を入力してください");
      showToast("大字を入力してください", "error");
      return;
    }
    const result = fromDaiji(trimmed);
    if (result === null) {
      announceStatus("エラー: 有効な大字を入力してください（例: 壱萬弐千参百）");
      showToast("有効な大字を入力してください", "error");
      return;
    }
    setDaijiResult(result);
    announceStatus(`変換完了: ${result}`);
  }, [daijiInput, announceStatus, showToast]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast, announceStatus],
  );

  const handleClearArabic = useCallback(() => {
    setArabicInput("");
    setArabicResult("");
    arabicInputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleClearDaiji = useCallback(() => {
    setDaijiInput("");
    setDaijiResult("");
    announceStatus("クリアしました");
  }, [announceStatus]);

  // Ctrl+Enter でアラビア→大字変換
  useKeyboardShortcut("Enter", handleArabicToDaiji, { ctrl: true });

  useEffect(() => {
    arabicInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="daiji-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="大字変換フォーム">
          {/* アラビア数字 → 大字 */}
          <section className="daiji-section" aria-labelledby="arabic-to-daiji-heading">
            <h2 id="arabic-to-daiji-heading" className="section-title">
              アラビア数字 → 大字
            </h2>
            <div className="daiji-input-row">
              <label htmlFor="arabic-input" className="sr-only">
                アラビア数字（整数）
              </label>
              <input
                id="arabic-input"
                ref={arabicInputRef}
                type="text"
                inputMode="numeric"
                className="daiji-input"
                value={arabicInput}
                onChange={(e) => setArabicInput(e.target.value.replace(/[^\d-]/g, ""))}
                placeholder="例: 12345"
                aria-label="変換するアラビア数字（整数）"
                aria-describedby="arabic-input-help"
              />
            </div>
            <span id="arabic-input-help" className="sr-only">
              整数を入力してください（最大20桁）
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleArabicToDaiji}
                aria-label="アラビア数字を大字に変換"
              >
                → 大字に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearArabic}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {arabicResult && (
              <div className="daiji-result" aria-live="polite" aria-label="変換結果">
                <span className="daiji-result-value">{arabicResult}</span>
                <button
                  type="button"
                  className="daiji-copy-button"
                  onClick={() => handleCopy(arabicResult, "大字")}
                  aria-label={`大字 ${arabicResult} をコピー`}
                >
                  コピー
                </button>
              </div>
            )}
          </section>

          <div className="daiji-divider" role="separator" aria-hidden="true" />

          {/* 大字 → アラビア数字 */}
          <section className="daiji-section" aria-labelledby="daiji-to-arabic-heading">
            <h2 id="daiji-to-arabic-heading" className="section-title">
              大字 → アラビア数字
            </h2>
            <div className="daiji-input-row">
              <label htmlFor="daiji-input" className="sr-only">
                大字
              </label>
              <input
                id="daiji-input"
                type="text"
                className="daiji-input"
                value={daijiInput}
                onChange={(e) => setDaijiInput(e.target.value)}
                placeholder="例: 壱萬弐仟参佰肆拾伍"
                aria-label="変換する大字（壱・弐・参など）"
                aria-describedby="daiji-input-help"
              />
            </div>
            <span id="daiji-input-help" className="sr-only">
              大字（壱・弐・参・肆・伍・陸・漆・捌・玖・拾・佰・仟・萬など）を入力してください
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleDaijiToArabic}
                aria-label="大字をアラビア数字に変換"
              >
                → アラビア数字に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearDaiji}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {daijiResult && (
              <div className="daiji-result" aria-live="polite" aria-label="変換結果">
                <span className="daiji-result-value">{daijiResult}</span>
                <button
                  type="button"
                  className="daiji-copy-button"
                  onClick={() => handleCopy(daijiResult, "数値")}
                  aria-label={`数値 ${daijiResult} をコピー`}
                >
                  コピー
                </button>
              </div>
            )}
          </section>
        </form>

        {/* 大字対照表 */}
        <section className="daiji-reference-section" aria-labelledby="reference-heading">
          <h2 id="reference-heading" className="section-title">
            大字対照表
          </h2>
          <div className="daiji-table-wrapper">
            <table className="daiji-table" aria-label="大字一覧">
              <thead>
                <tr>
                  <th scope="col">大字</th>
                  <th scope="col">数値</th>
                  <th scope="col">読み</th>
                </tr>
              </thead>
              <tbody>
                {DAIJI_REFERENCE.map((row) => (
                  <tr key={row.daiji}>
                    <td>
                      <span className="daiji-table-daiji">{row.daiji}</span>
                    </td>
                    <td>
                      <span className="daiji-table-arabic">{row.arabic}</span>
                    </td>
                    <td>
                      <span className="daiji-table-reading">{row.reading}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TipsCard
          tips={[
            "大字は小切手・契約書・法的文書などで数字の改ざん防止のために使用されます。",
            "「壱・弐・参」は通常の「一・二・三」の代わりに使用される複雑な漢字です。",
            "「萬」は通常の「万」の代替表記で、金融・法律文書で使用されます。",
            "負の数は「マイナス」を先頭に付けて入力してください（例: マイナス壱仟）。",
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
