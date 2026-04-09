import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodePolybius, decodePolybius, getSquareGrid } from "../utils/polybius";
import "../styles/tools/polybius.css";

export const Route = createFileRoute("/polybius")({
  head: () => ({
    meta: [
      { title: "ポリュビオス暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "ポリュビオス暗号（Polybius Square）のエンコード・デコードツール。5×5グリッドで各文字を座標ペア（数字2桁）に変換。カスタムキーワードによる方陣の並び替えにも対応。",
      },
      {
        property: "og:title",
        content: "ポリュビオス暗号 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "ポリュビオス暗号のエンコード・デコードツール。5×5グリッドで各文字を座標ペアに変換。カスタムキーワード対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/polybius` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ポリュビオス暗号 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "ポリュビオス暗号のエンコード・デコードツール。",
      },
    ],
  }),
  component: PolybiusSquare,
});

type Mode = "encode" | "decode";

/**
 * ポリュビオス暗号ツールコンポーネント
 * テキストのポリュビオス暗号エンコード・デコードと方陣の可視化を提供する
 */
function PolybiusSquare() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [keyWord, setKeyWord] = useState("");
  const [mode, setMode] = useState<Mode>("encode");

  const grid = useMemo(() => getSquareGrid(keyWord), [keyWord]);

  const output = useMemo(() => {
    if (!inputText) return "";
    return mode === "encode"
      ? encodePolybius(inputText, keyWord)
      : decodePolybius(inputText, keyWord);
  }, [inputText, keyWord, mode]);

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

  const isEmpty = inputText.length === 0;

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="polybius-mode-heading">
          <h2 id="polybius-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="polybius-mode-group" role="group" aria-label="変換モード">
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

        <section aria-labelledby="polybius-key-heading">
          <h2 id="polybius-key-heading" className="section-title">
            キーワード（任意）
          </h2>
          <div className="polybius-key-row">
            <label className="polybius-key-label" htmlFor="polybius-key">
              キー:
            </label>
            <input
              id="polybius-key"
              type="text"
              className="polybius-key-input"
              value={keyWord}
              onChange={(e) => setKeyWord(e.target.value)}
              placeholder="例: SECRET（省略可）"
              aria-label="方陣のキーワード（省略時は標準配置）"
              maxLength={25}
            />
          </div>
        </section>

        <section aria-labelledby="polybius-grid-heading">
          <h2 id="polybius-grid-heading" className="section-title">
            ポリュビオス方陣
          </h2>
          <div className="polybius-grid-wrapper">
            <table className="polybius-grid" aria-label="ポリュビオス方陣（5×5）">
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
                    <td className="polybius-grid-cell--header" aria-label={`行${rowIdx + 1}`}>
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} aria-label={`${rowIdx + 1}${colIdx + 1}: ${cell}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="polybius-input-heading">
          <h2 id="polybius-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="polybius-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "encode"
                ? "暗号化するテキストを入力（英字のみ変換）"
                : "数字ペアの暗号文を入力（例: 11 12 13）"
            }
            rows={4}
            aria-label="ポリュビオス暗号の入力テキスト"
          />
        </section>

        <section aria-labelledby="polybius-output-heading">
          <h2 id="polybius-output-heading" className="section-title">
            変換結果
          </h2>
          <div
            id="polybius-output"
            className={`polybius-output${isEmpty ? " polybius-output--empty" : ""}`}
            aria-live="polite"
            aria-label={`変換結果: ${output || "（変換結果なし）"}`}
            role="region"
          >
            {isEmpty ? "変換結果がここに表示されます" : output}
          </div>

          <div className="polybius-actions" role="group" aria-label="操作">
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
                "エンコード: テキストの各英字を行・列番号のペア（例: A→11, B→12）に変換します",
                "デコード: 数字ペアの連続から元のテキストに戻します",
                "キーワード: 方陣の並び順を変えるキーワードを設定すると暗号強度が上がります",
              ],
            },
            {
              title: "ポリュビオス暗号について",
              items: [
                "英字（A-Z）のみが座標ペアに変換され、数字・記号・日本語はそのまま保持されます",
                "I と J は同一のセルに割り当てます（標準的な実装）",
                "キーワード未設定の場合、ABCDEFGHIKLMNOPQRSTUVWXYZ の順で方陣を構成します",
                "キーワードを設定すると、キーワードの文字が方陣の先頭に並べられます",
                "CTF や歴史的暗号の学習・テキストパズルなどに活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
