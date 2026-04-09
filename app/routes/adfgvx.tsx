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
  adfgvxEncrypt,
  adfgvxDecrypt,
  createPolybiusSquare,
  isValidTranspositionKey,
} from "../utils/adfgvx";
import "../styles/tools/adfgvx.css";

export const Route = createFileRoute("/adfgvx")({
  head: () => ({
    meta: [
      { title: "ADFGVX暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "ADFGVX暗号のエンコード・デコードツール。第一次世界大戦でドイツ軍が使用したポリビウス方陣＋縦列転置の2段階暗号。ポリビウスキーと転置キーの2つのキーで暗号化。",
      },
      { property: "og:title", content: "ADFGVX暗号 | Web ツール集" },
      {
        property: "og:description",
        content:
          "ADFGVX暗号のエンコード・デコードツール。第一次世界大戦ドイツ軍の2段階暗号（換字＋転置）の変換ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/adfgvx` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ADFGVX暗号 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ADFGVX暗号のエンコード・デコードツール。第一次世界大戦でドイツ軍が使用した2段階暗号。",
      },
    ],
  }),
  component: AdfgvxCipher,
});

type Mode = "encrypt" | "decrypt";

const HEADERS = ["A", "D", "F", "G", "V", "X"];

/**
 * ADFGVX暗号ツールコンポーネント
 * ポリビウス方陣による換字と縦列転置の2段階暗号化・復号化を提供する
 */
function AdfgvxCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [polybiusKey, setPolybiusKey] = useState("KEYWORD");
  const [transpositionKey, setTranspositionKey] = useState("SECRET");
  const [mode, setMode] = useState<Mode>("encrypt");

  const square = useMemo(() => createPolybiusSquare(polybiusKey), [polybiusKey]);
  const transKeyValid = isValidTranspositionKey(transpositionKey);

  const output = useMemo(() => {
    if (!inputText || !transKeyValid) return "";
    return mode === "encrypt"
      ? adfgvxEncrypt(inputText, polybiusKey, transpositionKey)
      : adfgvxDecrypt(inputText, polybiusKey, transpositionKey);
  }, [inputText, polybiusKey, transpositionKey, transKeyValid, mode]);

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
        {/* モード選択 */}
        <section aria-labelledby="adfgvx-mode-heading">
          <h2 id="adfgvx-mode-heading" className="section-title">
            モード
          </h2>
          <div className="adfgvx-mode-group" role="group" aria-label="暗号化・復号化モード">
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

        {/* キー入力 */}
        <section aria-labelledby="adfgvx-keys-heading">
          <h2 id="adfgvx-keys-heading" className="section-title">
            キー設定
          </h2>
          <div className="adfgvx-keys-section">
            <div className="adfgvx-key-row">
              <label htmlFor="adfgvx-polybius-key" className="adfgvx-key-label">
                ポリビウスキー:
              </label>
              <input
                id="adfgvx-polybius-key"
                type="text"
                className="adfgvx-key-input"
                value={polybiusKey}
                onChange={(e) => setPolybiusKey(e.target.value)}
                placeholder="方陣のキーワード（例: KEYWORD）"
                aria-label="ポリビウス方陣のキーワード"
                aria-describedby="adfgvx-polybius-desc"
              />
            </div>
            <p id="adfgvx-polybius-desc" className="adfgvx-key-desc">
              英数字のみ使用。空欄の場合はデフォルト順（A-Z, 0-9）で方陣を構成します。
            </p>

            <div className="adfgvx-key-row">
              <label htmlFor="adfgvx-transposition-key" className="adfgvx-key-label">
                転置キー:
              </label>
              <input
                id="adfgvx-transposition-key"
                type="text"
                className="adfgvx-key-input"
                value={transpositionKey}
                onChange={(e) => setTranspositionKey(e.target.value)}
                placeholder="縦列転置のキーワード（例: SECRET）"
                aria-label="縦列転置のキーワード"
                aria-describedby="adfgvx-transposition-desc"
              />
            </div>
            {!transKeyValid && transpositionKey.length > 0 && (
              <p
                className="adfgvx-key-desc"
                aria-live="polite"
                style={{ color: "var(--md-sys-color-error)" }}
              >
                英字を1文字以上含む転置キーを入力してください
              </p>
            )}
            <p id="adfgvx-transposition-desc" className="adfgvx-key-desc">
              英字のみ使用。列の読み取り順を決定します。
            </p>
          </div>
        </section>

        {/* ポリビウス方陣の可視化 */}
        <section aria-labelledby="adfgvx-square-heading">
          <h2 id="adfgvx-square-heading" className="section-title">
            ポリビウス方陣
          </h2>
          <div className="adfgvx-square-wrapper">
            <p className="adfgvx-square-title">行・列ヘッダー: A D F G V X</p>
            <div className="adfgvx-square" role="grid" aria-label="ポリビウス方陣">
              {/* ヘッダー行 */}
              <div className="adfgvx-square-cell adfgvx-square-cell--corner" role="gridcell" />
              {HEADERS.map((h) => (
                <div
                  key={h}
                  className="adfgvx-square-cell adfgvx-square-cell--header"
                  role="columnheader"
                >
                  {h}
                </div>
              ))}
              {/* データ行 */}
              {square.map((row, rowIdx) => (
                <>
                  <div
                    key={`row-${rowIdx}`}
                    className="adfgvx-square-cell adfgvx-square-cell--header"
                    role="rowheader"
                  >
                    {HEADERS[rowIdx]}
                  </div>
                  {row.map((cell, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className="adfgvx-square-cell"
                      role="gridcell"
                      aria-label={`行${HEADERS[rowIdx]}列${HEADERS[colIdx]}: ${cell}`}
                    >
                      {cell}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </section>

        {/* テキスト入力 */}
        <section aria-labelledby="adfgvx-input-heading">
          <h2 id="adfgvx-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="adfgvx-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "暗号化するテキストを入力（英数字のみ変換、それ以外は除去）"
                : "復号化するADFGVX暗号文を入力"
            }
            rows={4}
            aria-label="ADFGVX暗号の入力テキスト"
          />
        </section>

        {/* 変換結果 */}
        <section aria-labelledby="adfgvx-output-heading">
          <h2 id="adfgvx-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="adfgvx-output"
            className={`adfgvx-output${isEmpty || !transKeyValid ? " adfgvx-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty
              ? "変換結果がここに表示されます"
              : !transKeyValid
                ? "有効な転置キーを入力してください"
                : output || "（変換できる文字がありません）"}
          </div>

          <div className="adfgvx-actions" role="group" aria-label="操作">
            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              disabled={isEmpty || !transKeyValid || !output}
              aria-label="変換結果をクリップボードにコピー"
            >
              コピー
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwap}
              disabled={isEmpty || !transKeyValid || !output}
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
                "モード（暗号化・復号化）を選択し、2つのキーとテキストを入力してください",
                "ポリビウスキー: 方陣の文字配置を決定するキーワード",
                "転置キー: 縦列転置の列順を決定するキーワード（英字必須）",
                "暗号化は英数字のみ対象。スペース・記号・日本語は除去されます",
                "復号化はADFGVXの6文字のみ処理（偶数文字数が必要）",
                "「結果を入力にセット」で暗号文を貼り付けてモード切り替えができます",
              ],
            },
            {
              title: "ADFGVX暗号について",
              items: [
                "1918年に第一次世界大戦中のドイツ軍が使用した野戦暗号です",
                "フリッツ・ネーベル大佐が考案。暗号文がA・D・F・G・V・Xの6文字のみで構成されることが名前の由来",
                "モールス信号での送受信時に混同しにくい文字として選ばれました",
                "手順1 (換字): 6×6のポリビウス方陣で各文字を2文字ペアに変換（A-Z+0-9の36文字対応）",
                "手順2 (転置): 転置キーに基づく縦列転置でさらに暗号化",
                "フランスの暗号解析者ジョルジュ・パンヴァンが1918年6月に解読しました",
                "CTFのクリプト問題や歴史的な暗号学の学習に活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
