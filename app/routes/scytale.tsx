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
  encodeScytale,
  decodeScytale,
  visualizeScytale,
  getScytaleDiameterRange,
} from "../utils/scytale";
import "../styles/tools/scytale.css";

export const Route = createFileRoute("/scytale")({
  head: () => ({
    meta: [
      { title: "スキュタレー暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "スキュタレー暗号（Scytale cipher）のエンコード・デコードツール。古代スパルタの軍事暗号。円柱の直径（列数）を指定してテキストを転置暗号化。平文・暗号文グリッドの可視化付き。",
      },
      {
        property: "og:title",
        content: "スキュタレー暗号 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "スキュタレー暗号（Scytale cipher）のエンコード・デコードツール。古代スパルタの軍事暗号。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/scytale` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "スキュタレー暗号 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "スキュタレー暗号（Scytale cipher）のエンコード・デコードツール。",
      },
    ],
  }),
  component: ScytaleTool,
});

type Mode = "encode" | "decode";

const { min: DIAMETER_MIN, max: DIAMETER_MAX } = getScytaleDiameterRange();

/**
 * スキュタレー暗号ツールコンポーネント
 * テキストのスキュタレー暗号エンコード・デコードとグリッドの可視化を提供する
 */
function ScytaleTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [diameter, setDiameter] = useState(5);

  const output = useMemo(() => {
    if (!inputText) return "";
    return mode === "encode"
      ? encodeScytale(inputText, diameter)
      : decodeScytale(inputText, diameter);
  }, [inputText, mode, diameter]);

  const plainGrid = useMemo(() => {
    if (!inputText) return [];
    return visualizeScytale(inputText, diameter, "plain");
  }, [inputText, diameter]);

  const cipherGrid = useMemo(() => {
    if (!inputText) return [];
    return visualizeScytale(inputText, diameter, "cipher");
  }, [inputText, diameter]);

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

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === "encode" ? "エンコードモードに切り替えました" : "デコードモードに切り替えました"
      );
    },
    [announceStatus]
  );

  const handleDiameterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= DIAMETER_MIN && val <= DIAMETER_MAX) {
        setDiameter(val);
        announceStatus(`直径を ${val} に変更しました`);
      }
    },
    [announceStatus]
  );

  const isEmpty = inputText.length === 0;
  const showGrid = !isEmpty && plainGrid.length > 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="scytale-mode-heading">
          <h2 id="scytale-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="scytale-mode-group" role="group" aria-label="変換モード">
            <Button
              type="button"
              variant={mode === "encode" ? "default" : "outline"}
              onClick={() => handleModeChange("encode")}
              aria-pressed={mode === "encode"}
            >
              エンコード
            </Button>
            <Button
              type="button"
              variant={mode === "decode" ? "default" : "outline"}
              onClick={() => handleModeChange("decode")}
              aria-pressed={mode === "decode"}
            >
              デコード
            </Button>
          </div>
        </section>

        <section aria-labelledby="scytale-diameter-heading">
          <h2 id="scytale-diameter-heading" className="section-title">
            円柱の直径（列数）
          </h2>
          <div className="scytale-diameter-row">
            <label className="scytale-diameter-label" htmlFor="scytale-diameter-range">
              直径:
            </label>
            <input
              id="scytale-diameter-range"
              type="range"
              className="scytale-diameter-range"
              min={DIAMETER_MIN}
              max={DIAMETER_MAX}
              value={diameter}
              onChange={handleDiameterChange}
              aria-label="円柱の直径（列数）"
              aria-valuemin={DIAMETER_MIN}
              aria-valuemax={DIAMETER_MAX}
              aria-valuenow={diameter}
            />
            <span className="scytale-diameter-value" aria-live="polite">
              {diameter}
            </span>
            <input
              type="number"
              className="scytale-diameter-input"
              min={DIAMETER_MIN}
              max={DIAMETER_MAX}
              value={diameter}
              onChange={handleDiameterChange}
              aria-label="直径の数値入力"
            />
          </div>
        </section>

        <section aria-labelledby="scytale-input-heading">
          <h2 id="scytale-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="scytale-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encode"
                ? "暗号化するテキストを入力"
                : "スキュタレー暗号文を入力"
            }
            rows={4}
            aria-label="スキュタレー暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="scytale-output-heading">
          <h2 id="scytale-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="scytale-output"
            className={`scytale-output${isEmpty ? " scytale-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output}
          </div>

          <div className="scytale-actions" role="group" aria-label="操作">
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
              onClick={handleClear}
              disabled={isEmpty}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>
        </section>

        {showGrid && (
          <section aria-labelledby="scytale-grid-heading">
            <h2 id="scytale-grid-heading" className="section-title">
              グリッド可視化
            </h2>
            <div className="scytale-grids">
              <div className="scytale-grid-wrapper">
                <div className="scytale-grid-title">平文グリッド（行方向に書き込み）</div>
                <table
                  className="scytale-grid scytale-grid--plain"
                  aria-label="平文グリッド"
                >
                  <tbody>
                    {plainGrid.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className={cell === "·" ? "scytale-grid-cell--pad" : undefined}
                            aria-label={`行${rowIdx + 1}列${colIdx + 1}: ${cell}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="scytale-grid-wrapper">
                <div className="scytale-grid-title">暗号グリッド（列方向に読み取り）</div>
                <table
                  className="scytale-grid scytale-grid--cipher"
                  aria-label="暗号グリッド"
                >
                  <tbody>
                    {cipherGrid.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className={cell === "·" ? "scytale-grid-cell--pad" : undefined}
                            aria-label={`行${rowIdx + 1}列${colIdx + 1}: ${cell}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "エンコード: テキストを指定した列数のグリッドに行方向で書き込み、列方向に読み取って暗号化します",
                "デコード: 暗号文を逆変換して元のテキストに戻します",
                "直径: 円柱の直径（列数）を変更することで暗号の強度を調整できます",
                "グリッド可視化: 平文グリッドと暗号グリッドの対応を視覚的に確認できます",
              ],
            },
            {
              title: "スキュタレー暗号について",
              items: [
                "古代スパルタで軍事通信に使用された最古の転置暗号のひとつです（紀元前7世紀頃）",
                "羊皮紙の帯を円柱（スキュタレー）に巻き付けて文字を書き、ほどくと文字が並び替わります",
                "受け取った側は同じ直径の円柱に巻き付けることで解読できます",
                "転置暗号（文字の順序を変える）であり、換字暗号（文字を別の文字に変える）ではありません",
                "テキスト長が列数の倍数でない場合、末尾に空白が自動補填されます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
