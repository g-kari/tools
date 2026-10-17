import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  seirekiToWareki,
  warekiToSeireki,
  getEraNames,
  formatWareki,
  getEraPeriod,
  ERAS,
  type WarekiResult,
} from "../utils/wareki";
import "~/styles/tools/wareki.css";

export const Route = createFileRoute("/wareki")({
  head: () => ({
    meta: [
      { title: "和暦・西暦変換 | Web ツール集" },
      {
        name: "description",
        content:
          "西暦と和暦（元号）を相互変換するツール。令和・平成・昭和・大正・明治に対応。次回実行時刻も表示。",
      },
      { property: "og:title", content: "和暦・西暦変換 | Web ツール集" },
      {
        property: "og:description",
        content: "西暦と和暦（元号）を相互変換するツール。令和・平成・昭和・大正・明治に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/wareki` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "和暦・西暦変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "西暦と和暦（元号）を相互変換するツール。令和・平成・昭和・大正・明治に対応。",
      },
    ],
  }),
  component: WarekiConverter,
});

/** 元号一覧 */
const ERA_NAMES = getEraNames();

/**
 * 和暦・西暦変換コンポーネント
 */
function WarekiConverter() {
  const { showToast } = useToast();
  const [westernInput, setWesternInput] = useState("");
  const [westernResults, setWesternResults] = useState<WarekiResult[]>([]);
  const [selectedEra, setSelectedEra] = useState(ERA_NAMES[0]);
  const [eraYearInput, setEraYearInput] = useState("");
  const [eraResult, setEraResult] = useState<number | null>(null);

  const westernInputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleWesternConvert = useCallback(() => {
    const trimmed = westernInput.trim();
    if (!trimmed) {
      announceStatus("エラー: 西暦年を入力してください");
      showToast("西暦年を入力してください", "error");
      westernInputRef.current?.focus();
      return;
    }
    const year = parseInt(trimmed, 10);
    if (isNaN(year)) {
      announceStatus("エラー: 有効な西暦年を入力してください");
      showToast("有効な西暦年を入力してください", "error");
      westernInputRef.current?.focus();
      return;
    }
    const results = seirekiToWareki(year);
    if (results.length === 0) {
      announceStatus("エラー: 1868年以降の西暦年を入力してください");
      showToast("1868年以降の西暦年を入力してください（明治以降）", "error");
      westernInputRef.current?.focus();
      return;
    }
    setWesternResults(results);
    const label = results.map(formatWareki).join(" / ");
    announceStatus(`変換完了: ${label}`);
  }, [westernInput, announceStatus, showToast]);

  const handleEraConvert = useCallback(() => {
    const trimmed = eraYearInput.trim();
    if (!trimmed) {
      announceStatus("エラー: 元号年を入力してください");
      showToast("元号年を入力してください", "error");
      return;
    }
    const year = parseInt(trimmed, 10);
    if (isNaN(year) || year < 1) {
      announceStatus("エラー: 1以上の正の整数を入力してください");
      showToast("1以上の正の整数を入力してください", "error");
      return;
    }
    const result = warekiToSeireki(selectedEra, year);
    if (result === null) {
      announceStatus(`エラー: ${selectedEra}${year}年は存在しません`);
      showToast(`${selectedEra}${year}年は存在しません`, "error");
      return;
    }
    setEraResult(result);
    announceStatus(`変換完了: ${result}年`);
  }, [selectedEra, eraYearInput, announceStatus, showToast]);

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

  const handleClearWestern = useCallback(() => {
    setWesternInput("");
    setWesternResults([]);
    westernInputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleClearEra = useCallback(() => {
    setEraYearInput("");
    setEraResult(null);
    announceStatus("クリアしました");
  }, [announceStatus]);

  // Ctrl+Enter で西暦→和暦変換
  useKeyboardShortcut("Enter", handleWesternConvert, { ctrl: true });

  useEffect(() => {
    westernInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="wareki-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="和暦・西暦変換フォーム">
          {/* 西暦 → 和暦 */}
          <section className="wareki-section" aria-labelledby="western-to-wareki-heading">
            <h2 id="western-to-wareki-heading" className="section-title">
              西暦 → 和暦（元号）
            </h2>
            <div className="wareki-input-row">
              <label htmlFor="western-input" className="sr-only">
                西暦年（1868年以降）
              </label>
              <input
                id="western-input"
                ref={westernInputRef}
                type="number"
                className="wareki-input"
                value={westernInput}
                onChange={(e) => setWesternInput(e.target.value)}
                placeholder="例: 2024"
                min="1868"
                aria-label="変換する西暦年（1868年以降）"
                aria-describedby="western-input-help"
              />
            </div>
            <span id="western-input-help" className="sr-only">
              1868年（明治元年）以降の西暦年を入力してください
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleWesternConvert}
                aria-label="西暦を和暦に変換"
              >
                → 和暦に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearWestern}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {westernResults.length > 0 && (
              <div className="wareki-results" aria-live="polite" aria-label="変換結果">
                {westernResults.map((result) => (
                  <div
                    key={`${result.eraName}-${result.year}`}
                    className={`wareki-result-item${result.isTransitionYear ? " transition" : ""}`}
                  >
                    <div>
                      <div className="wareki-result-value">
                        {result.eraName}
                        {result.year}年
                      </div>
                      {result.isTransitionYear && (
                        <div className="wareki-result-note">
                          ※ {result.westernYear}年は元号の遷移年です
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="wareki-copy-button"
                      onClick={() => handleCopy(`${result.eraName}${result.year}年`, "和暦")}
                      aria-label={`${result.eraName}${result.year}年 をコピー`}
                    >
                      コピー
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="wareki-divider" role="separator" aria-hidden="true" />

          {/* 和暦 → 西暦 */}
          <section className="wareki-section" aria-labelledby="wareki-to-western-heading">
            <h2 id="wareki-to-western-heading" className="section-title">
              和暦（元号） → 西暦
            </h2>
            <div className="wareki-input-row">
              <label htmlFor="era-select" className="sr-only">
                元号を選択
              </label>
              <select
                id="era-select"
                className="wareki-era-select"
                value={selectedEra}
                onChange={(e) => {
                  setSelectedEra(e.target.value);
                  setEraResult(null);
                }}
                aria-label="元号を選択"
              >
                {ERA_NAMES.map((era) => (
                  <option key={era} value={era}>
                    {era}
                  </option>
                ))}
              </select>
              <label htmlFor="era-year-input" className="sr-only">
                元号年数
              </label>
              <input
                id="era-year-input"
                type="number"
                className="wareki-input"
                value={eraYearInput}
                onChange={(e) => setEraYearInput(e.target.value)}
                placeholder="例: 6"
                min="1"
                aria-label="元号年数"
                aria-describedby="era-year-input-help"
              />
              <span className="sr-only">年</span>
            </div>
            <span id="era-year-input-help" className="sr-only">
              元号の年数を入力してください（1以上の整数）
            </span>
            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleEraConvert}
                aria-label="和暦を西暦に変換"
              >
                → 西暦に変換
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearEra}
                aria-label="入力と結果をクリア"
              >
                クリア
              </Button>
            </div>
            {eraResult !== null && (
              <div className="wareki-results" aria-live="polite" aria-label="変換結果">
                <div className="wareki-result-item">
                  <div className="wareki-result-value">{eraResult}年</div>
                  <button
                    type="button"
                    className="wareki-copy-button"
                    onClick={() => handleCopy(String(eraResult), "西暦")}
                    aria-label={`${eraResult}年 をコピー`}
                  >
                    コピー
                  </button>
                </div>
              </div>
            )}
          </section>
        </form>

        {/* 元号一覧表 */}
        <section className="wareki-reference-section" aria-labelledby="era-reference-heading">
          <h2 id="era-reference-heading" className="section-title">
            元号一覧
          </h2>
          <div className="wareki-table-wrapper">
            <table className="wareki-table" aria-label="元号一覧">
              <thead>
                <tr>
                  <th scope="col">元号</th>
                  <th scope="col">ローマ字</th>
                  <th scope="col">西暦換算式</th>
                  <th scope="col">期間</th>
                </tr>
              </thead>
              <tbody>
                {ERAS.map((era) => (
                  <tr key={era.name}>
                    <td className="wareki-table-era">
                      {era.name}
                      {era.endYear === null && (
                        <span className="wareki-table-current" aria-label="現在の元号">
                          現在
                        </span>
                      )}
                    </td>
                    <td className="wareki-table-romaji">{era.romaji}</td>
                    <td>西暦 = {era.startYear - 1} + 元号年</td>
                    <td className="wareki-table-period">{getEraPeriod(era)}</td>
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
                "「西暦 → 和暦」欄に西暦年を入力して「→ 和暦に変換」をクリック",
                "「和暦 → 西暦」欄で元号を選択し年数を入力して「→ 西暦に変換」をクリック",
                "元号の遷移年（1912・1926・1989・2019）は複数の結果を表示します",
                "変換結果は「コピー」ボタンでクリップボードにコピーできます",
                "キーボードショートカット: Ctrl+Enter で西暦→和暦変換",
              ],
            },
            {
              title: "元号の換算式",
              items: [
                "令和Y年 = 2018 + Y 年（例: 令和6年 = 2024年）",
                "平成Y年 = 1988 + Y 年（例: 平成31年 = 2019年）",
                "昭和Y年 = 1925 + Y 年（例: 昭和64年 = 1989年）",
                "大正Y年 = 1911 + Y 年（例: 大正15年 = 1926年）",
                "明治Y年 = 1867 + Y 年（例: 明治45年 = 1912年）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
