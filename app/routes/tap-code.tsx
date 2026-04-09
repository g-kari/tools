import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeTapCode, decodeTapCode, getTapGrid, type TapFormat } from "../utils/tap-code";
import "../styles/tools/tap-code.css";

export const Route = createFileRoute("/tap-code")({
  head: () => ({
    meta: [
      { title: "タップコード | Web ツール集" },
      {
        name: "description",
        content:
          "タップコード（Tap Code）のエンコード・デコードツール。5×5グリッドで各文字を行・列のタップ数で表現。ドット記法・数字記法・コンパクト記法に対応。",
      },
      {
        property: "og:title",
        content: "タップコード | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "タップコードのエンコード・デコードツール。5×5グリッドで各文字を行・列のタップ数で表現。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/tap-code` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "タップコード | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "タップコードのエンコード・デコードツール。",
      },
    ],
  }),
  component: TapCodeTool,
});

type Mode = "encode" | "decode";

const FORMAT_OPTIONS: { value: TapFormat; label: string; example: string }[] = [
  { value: "dots", label: "ドット記法", example: ". . / . .." },
  { value: "numbers", label: "数字記法", example: "1 1 / 1 2" },
  { value: "numbers-compact", label: "コンパクト記法", example: "11 12" },
];

/**
 * タップコードツールコンポーネント
 * テキストのタップコードエンコード・デコードとグリッドの可視化を提供する
 */
function TapCodeTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [format, setFormat] = useState<TapFormat>("dots");

  const grid = useMemo(() => getTapGrid(), []);

  const output = useMemo(() => {
    if (!inputText) return "";
    return mode === "encode" ? encodeTapCode(inputText, format) : decodeTapCode(inputText, format);
  }, [inputText, mode, format]);

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
        newMode === "encode"
          ? "エンコードモードに切り替えました"
          : "デコードモードに切り替えました",
      );
    },
    [announceStatus],
  );

  const handleFormatChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newFormat = e.target.value as TapFormat;
      setFormat(newFormat);
      const label = FORMAT_OPTIONS.find((o) => o.value === newFormat)?.label ?? newFormat;
      announceStatus(`${label}に切り替えました`);
    },
    [announceStatus],
  );

  const isEmpty = inputText.length === 0;
  const currentFormatOption = FORMAT_OPTIONS.find((o) => o.value === format);

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="tap-code-mode-heading">
          <h2 id="tap-code-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="tap-code-mode-group" role="group" aria-label="変換モード">
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

        <section aria-labelledby="tap-code-format-heading">
          <h2 id="tap-code-format-heading" className="section-title">
            出力形式
          </h2>
          <div className="tap-code-format-row">
            <label className="tap-code-format-label" htmlFor="tap-code-format">
              形式:
            </label>
            <select
              id="tap-code-format"
              className="tap-code-format-select"
              value={format}
              onChange={handleFormatChange}
              aria-label="タップコードの出力形式"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}（例: {opt.example}）
                </option>
              ))}
            </select>
          </div>
        </section>

        <section aria-labelledby="tap-code-grid-heading">
          <h2 id="tap-code-grid-heading" className="section-title">
            タップコードグリッド
          </h2>
          <div className="tap-code-grid-wrapper">
            <table className="tap-code-grid" aria-label="タップコードグリッド（5×5）">
              <thead>
                <tr>
                  <th scope="col" aria-label="行/列"></th>
                  {[1, 2, 3, 4, 5].map((col) => (
                    <th key={col} scope="col">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="tap-code-grid-cell--header" aria-label={`行${rowIdx + 1}`}>
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className={cell === "C/K" ? "tap-code-grid-cell--ck" : undefined}
                        aria-label={`${rowIdx + 1}行${colIdx + 1}列: ${cell}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="tap-code-input-heading">
          <h2 id="tap-code-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="tap-code-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encode"
                ? "暗号化するテキストを入力（英字のみ変換）"
                : `タップコードを入力（${currentFormatOption?.example ?? ""}）`
            }
            rows={4}
            aria-label="タップコードの入力テキスト"
          />
        </section>

        <section aria-labelledby="tap-code-output-heading">
          <h2 id="tap-code-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="tap-code-output"
            className={`tap-code-output${isEmpty ? " tap-code-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output}
          </div>

          <div className="tap-code-actions" role="group" aria-label="操作">
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

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "エンコード: テキストの各英字を行・列のタップ数ペアに変換します",
                "デコード: タップコードのパターンから元のテキストに戻します",
                "出力形式: ドット記法（. ..）・数字記法（1 2）・コンパクト記法（12）から選択できます",
              ],
            },
            {
              title: "タップコードについて",
              items: [
                "英字（A-Z）のみが変換され、数字・記号・日本語はそのまま保持されます",
                "C と K は同一のセルに割り当てます（標準的な実装）",
                "第二次世界大戦の捕虜がコミュニケーションに使用したことで知られています",
                "単語間の区切り: ドット記法は3スペース、数字記法は「//」、コンパクト記法は2スペース",
                "ポリュビオス暗号と同じグリッド構造を持ちますが、表現形式が異なります",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
