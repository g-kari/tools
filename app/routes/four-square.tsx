import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  fourSquareEncrypt,
  fourSquareDecrypt,
  buildFourSquareGrid,
  buildStandardGrid,
  getFourSquareDigraphs,
} from "../utils/four-square";
import "../styles/tools/four-square.css";

export const Route = createFileRoute("/four-square")({
  head: () => ({
    meta: [
      { title: "四方格子暗号（Four-Square Cipher） | Web ツール集" },
      {
        name: "description",
        content:
          "四方格子暗号（Four-Square Cipher）の暗号化・復号化ツール。4つの5×5ポリュビオス方陣を使ったダイグラフ換字式暗号。2つのキーワードを指定してテキストを暗号化・復号化。方陣の可視化付き。",
      },
      {
        property: "og:title",
        content: "四方格子暗号（Four-Square Cipher） | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "四方格子暗号の暗号化・復号化ツール。4つの5×5ポリュビオス方陣でダイグラフ（2文字）単位に暗号化。2つのキーワードで強度を向上。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/four-square` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "四方格子暗号（Four-Square Cipher） | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "四方格子暗号（Four-Square Cipher）の暗号化・復号化ツール。",
      },
    ],
  }),
  component: FourSquareTool,
});

type Mode = "encrypt" | "decrypt";

/**
 * 四方格子暗号ツールコンポーネント
 * 4つの5×5ポリュビオス方陣を使ったダイグラフ換字式暗号の暗号化・復号化と方陣の可視化を提供する
 */
function FourSquareTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>("encrypt");
  const [inputText, setInputText] = useState("");
  const [key1, setKey1] = useState("EXAMPLE");
  const [key2, setKey2] = useState("KEYWORD");
  const [showGrids, setShowGrids] = useState(false);

  const validKey1 = useMemo(() => key1.replace(/[^A-Za-z]/g, "").toUpperCase() || "A", [key1]);
  const validKey2 = useMemo(() => key2.replace(/[^A-Za-z]/g, "").toUpperCase() || "A", [key2]);

  const output = useMemo(() => {
    if (!inputText.trim()) return "";
    if (mode === "encrypt") return fourSquareEncrypt(inputText, validKey1, validKey2);
    return fourSquareDecrypt(inputText, validKey1, validKey2);
  }, [inputText, validKey1, validKey2, mode]);

  const digraphs = useMemo(
    () => getFourSquareDigraphs(inputText, validKey1, validKey2, mode),
    [inputText, validKey1, validKey2, mode],
  );

  const grids = useMemo(
    () => ({
      standard: buildStandardGrid(),
      key1Grid: buildFourSquareGrid(validKey1),
      key2Grid: buildFourSquareGrid(validKey2),
    }),
    [validKey1, validKey2],
  );

  const key1Set = useMemo(() => {
    const seen = new Set<string>();
    for (const ch of validKey1.replace(/J/g, "I")) {
      if (!seen.has(ch)) seen.add(ch);
    }
    return seen;
  }, [validKey1]);

  const key2Set = useMemo(() => {
    const seen = new Set<string>();
    for (const ch of validKey2.replace(/J/g, "I")) {
      if (!seen.has(ch)) seen.add(ch);
    }
    return seen;
  }, [validKey2]);

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
    setInputText(output.replace(/ /g, ""));
    setMode((m) => (m === "encrypt" ? "decrypt" : "encrypt"));
    announceStatus("変換結果を入力にセットし、モードを切り替えました");
  }, [output, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleToggleGrids = useCallback(() => {
    setShowGrids((prev) => {
      const next = !prev;
      announceStatus(next ? "方陣可視化を表示しました" : "方陣可視化を非表示にしました");
      return next;
    });
  }, [announceStatus]);

  const isEmpty = inputText.trim().length === 0;

  return (
    <>
      <div className="tool-container">
        {/* モード選択 */}
        <div className="four-square-mode-row" role="group" aria-label="変換モード">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`four-square-mode-btn${mode === m ? " four-square-mode-btn--active" : ""}`}
              onClick={() => {
                setMode(m);
                announceStatus(
                  m === "encrypt" ? "暗号化モードに切り替えました" : "復号化モードに切り替えました",
                );
              }}
              aria-pressed={mode === m}
            >
              {m === "encrypt" ? "暗号化" : "復号化"}
            </button>
          ))}
        </div>

        {/* キーワード入力 */}
        <section aria-labelledby="four-square-keys-heading">
          <h2 id="four-square-keys-heading" className="section-title">
            キーワード設定
          </h2>
          <div className="four-square-keys">
            <div className="four-square-key-group">
              <label className="four-square-key-label" htmlFor="four-square-key1">
                キーワード 1（右上方陣）
              </label>
              <input
                id="four-square-key1"
                type="text"
                className="four-square-key-input"
                value={key1}
                onChange={(e) => setKey1(e.target.value)}
                placeholder="例: EXAMPLE"
                aria-label="四方格子暗号のキーワード1（右上方陣に使用）"
                spellCheck={false}
                maxLength={25}
              />
            </div>
            <div className="four-square-key-group">
              <label className="four-square-key-label" htmlFor="four-square-key2">
                キーワード 2（左下方陣）
              </label>
              <input
                id="four-square-key2"
                type="text"
                className="four-square-key-input"
                value={key2}
                onChange={(e) => setKey2(e.target.value)}
                placeholder="例: KEYWORD"
                aria-label="四方格子暗号のキーワード2（左下方陣に使用）"
                spellCheck={false}
                maxLength={25}
              />
            </div>
          </div>
        </section>

        {/* テキスト入力 */}
        <section aria-labelledby="four-square-input-heading">
          <h2 id="four-square-input-heading" className="section-title">
            {mode === "encrypt" ? "平文（暗号化するテキスト）" : "暗号文（復号化するテキスト）"}
          </h2>
          <Textarea
            id="four-square-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "暗号化するテキストを入力（英字のみ処理されます、J は I に変換）"
                : "暗号文を入力（スペース区切りの2文字ペアも可）"
            }
            rows={4}
            aria-label={mode === "encrypt" ? "平文入力" : "暗号文入力"}
          />
        </section>

        {/* 変換結果 */}
        <section aria-labelledby="four-square-output-heading">
          <h2 id="four-square-output-heading" className="section-title">
            {mode === "encrypt" ? "暗号文" : "復号文"}
          </h2>
          <div
            id="four-square-output"
            className={`four-square-output${isEmpty ? " four-square-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output || "（変換できません）"}
          </div>

          <div className="four-square-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty || !output}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwap}
              disabled={isEmpty || !output}
              aria-label="変換結果を入力にセットしてモードを切り替え"
            >
              結果を入力にセット
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleToggleGrids}
              aria-label={showGrids ? "方陣可視化を非表示" : "方陣可視化を表示"}
            >
              {showGrids ? "方陣を非表示" : "方陣可視化"}
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

        {/* ダイグラフ分割表示 */}
        {digraphs.length > 0 && (
          <section aria-labelledby="four-square-digraphs-heading">
            <h2 id="four-square-digraphs-heading" className="section-title">
              ダイグラフ変換
            </h2>
            <div
              className="four-square-digraphs"
              role="list"
              aria-label="ダイグラフ（2文字ペア）の変換結果"
            >
              {digraphs.map((pair, i) => (
                <span
                  key={i}
                  className="four-square-digraph-badge"
                  role="listitem"
                  aria-label={`${pair.input} → ${pair.output}`}
                >
                  <span>{pair.input}</span>
                  <span className="four-square-digraph-arrow">→</span>
                  <span className="four-square-digraph-result">{pair.output}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 四方陣可視化 */}
        {showGrids && (
          <section aria-labelledby="four-square-grids-heading">
            <h2 id="four-square-grids-heading" className="section-title">
              四方格子可視化
            </h2>
            <div
              className="four-square-grid-layout"
              aria-label="四方格子暗号の4つのポリュビオス方陣"
            >
              {/* 左上：標準方陣（平文用） */}
              <div className="four-square-grid-item">
                <div className="four-square-grid-title four-square-grid-title--plain">
                  左上: 標準（平文）
                </div>
                <div
                  className="four-square-mini-grid"
                  role="grid"
                  aria-label="左上: 標準アルファベット方陣（平文用）"
                >
                  {grids.standard.flat().map((ch, i) => (
                    <div
                      key={i}
                      className="four-square-mini-cell four-square-mini-cell--plain"
                      role="gridcell"
                      aria-label={ch}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>

              {/* 右上：キー1方陣 */}
              <div className="four-square-grid-item">
                <div className="four-square-grid-title four-square-grid-title--key1">
                  右上: キー1（暗号文）
                </div>
                <div
                  className="four-square-mini-grid"
                  role="grid"
                  aria-label="右上: キーワード1による方陣（暗号文用）"
                >
                  {grids.key1Grid.flat().map((ch, i) => (
                    <div
                      key={i}
                      className={`four-square-mini-cell${key1Set.has(ch) ? " four-square-mini-cell--key" : ""}`}
                      role="gridcell"
                      aria-label={`${ch}${key1Set.has(ch) ? "（キー文字）" : ""}`}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>

              {/* 左下：キー2方陣 */}
              <div className="four-square-grid-item">
                <div className="four-square-grid-title four-square-grid-title--key2">
                  左下: キー2（暗号文）
                </div>
                <div
                  className="four-square-mini-grid"
                  role="grid"
                  aria-label="左下: キーワード2による方陣（暗号文用）"
                >
                  {grids.key2Grid.flat().map((ch, i) => (
                    <div
                      key={i}
                      className={`four-square-mini-cell${key2Set.has(ch) ? " four-square-mini-cell--key2" : ""}`}
                      role="gridcell"
                      aria-label={`${ch}${key2Set.has(ch) ? "（キー文字）" : ""}`}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>

              {/* 右下：標準方陣（平文用） */}
              <div className="four-square-grid-item">
                <div className="four-square-grid-title four-square-grid-title--plain">
                  右下: 標準（平文）
                </div>
                <div
                  className="four-square-mini-grid"
                  role="grid"
                  aria-label="右下: 標準アルファベット方陣（平文用）"
                >
                  {grids.standard.flat().map((ch, i) => (
                    <div
                      key={i}
                      className="four-square-mini-cell four-square-mini-cell--plain"
                      role="gridcell"
                      aria-label={ch}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "キーワード1（右上方陣）とキーワード2（左下方陣）を入力してください",
                "平文を入力すると自動で暗号化されます（英字のみ処理、J は I に変換）",
                "「復号化」モードに切り替えて暗号文を入力すると復号化できます",
                "「方陣可視化」ボタンで4つの方陣の配置を確認できます（青=キー1文字、緑=キー2文字）",
                "「結果を入力にセット」ボタンで変換結果を入力に移してモードを反転します",
              ],
            },
            {
              title: "四方格子暗号について",
              items: [
                "フェリックス・デラステルが1902年に考案した換字式暗号です",
                "左上・右下に標準アルファベット方陣、右上・左下にキーワード方陣を配置します",
                "プレイフェア暗号と同様に平文を2文字単位（ダイグラフ）で処理します",
                "平文1文字目の左上方陣での位置(行r1,列c1)と平文2文字目の右下方陣での位置(行r2,列c2)を求めます",
                "暗号文は右上方陣の(r1,c2)と左下方陣の(r2,c1)から取得します",
                "2つの独立したキーを使うため、プレイフェア暗号より解読が困難です",
                "奇数文字の場合は末尾に X が補填されます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
