import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeCaesar, decodeCaesar, rot13, bruteForce } from "../utils/caesar";
import "../styles/tools/caesar.css";

export const Route = createFileRoute("/caesar")({
  head: () => ({
    meta: [
      { title: "シーザー暗号・ROT13 | Web ツール集" },
      {
        name: "description",
        content:
          "シーザー暗号（Caesar cipher）とROT13のエンコード・デコードツール。シフト量を自由に設定でき、全26パターンのブルートフォース解析にも対応。",
      },
      {
        property: "og:title",
        content: "シーザー暗号・ROT13 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "シーザー暗号とROT13のエンコード・デコードツール。シフト量を自由に設定、全パターンのブルートフォース解析にも対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/caesar` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "シーザー暗号・ROT13 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "シーザー暗号とROT13のエンコード・デコードツール。",
      },
    ],
  }),
  component: CaesarCipher,
});

type Mode = "encode" | "decode" | "brute";

/**
 * シーザー暗号・ROT13ツールコンポーネント
 * テキストのシーザー暗号エンコード・デコード・ブルートフォース解析を提供する
 */
function CaesarCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [shift, setShift] = useState(13);
  const [mode, setMode] = useState<Mode>("encode");

  const output = useMemo(() => {
    if (!inputText) return "";
    if (mode === "encode") return encodeCaesar(inputText, shift);
    if (mode === "decode") return decodeCaesar(inputText, shift);
    return "";
  }, [inputText, shift, mode]);

  const bruteForceResults = useMemo(() => {
    if (mode !== "brute" || !inputText) return [];
    return bruteForce(inputText);
  }, [inputText, mode]);

  const handleCopy = useCallback(async () => {
    const target = mode === "brute" ? "" : output;
    if (!target) return;
    const ok = await copy(target);
    if (ok) {
      showToast("変換結果をコピーしました", "success");
      announceStatus("変換結果をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [output, mode, copy, showToast, announceStatus]);

  const handleRot13 = useCallback(() => {
    setShift(13);
    setMode("encode");
    announceStatus("ROT13モードに設定しました（シフト: 13）");
  }, [announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleShiftChange = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(25, value));
    setShift(clamped);
  }, []);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      announceStatus(
        newMode === "encode"
          ? "エンコードモードに切り替えました"
          : newMode === "decode"
            ? "デコードモードに切り替えました"
            : "ブルートフォース解析モードに切り替えました"
      );
    },
    [announceStatus]
  );

  const isEmpty = inputText.length === 0;
  const isBrute = mode === "brute";

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="caesar-mode-heading">
          <h2 id="caesar-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="caesar-mode-group" role="group" aria-label="変換モード">
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
            <Button
              type="button"
              variant={mode === "brute" ? "default" : "outline"}
              onClick={() => handleModeChange("brute")}
              aria-pressed={mode === "brute"}
            >
              ブルートフォース解析
            </Button>
          </div>
        </section>

        {!isBrute && (
          <section aria-labelledby="caesar-shift-heading">
            <h2 id="caesar-shift-heading" className="section-title">
              シフト量
            </h2>
            <div className="caesar-shift-row">
              <span className="caesar-shift-label" aria-hidden="true">
                0
              </span>
              <input
                type="range"
                className="caesar-shift-slider"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => handleShiftChange(Number(e.target.value))}
                aria-label={`シフト量: ${shift}`}
                aria-valuemin={0}
                aria-valuemax={25}
                aria-valuenow={shift}
              />
              <span className="caesar-shift-label" aria-hidden="true">
                25
              </span>
              <input
                type="number"
                className="caesar-shift-number"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => handleShiftChange(Number(e.target.value))}
                aria-label="シフト量（数値入力）"
              />
              <Button
                type="button"
                variant="outline"
                className="caesar-rot13-btn"
                onClick={handleRot13}
                aria-label="ROT13（シフト13）に設定"
              >
                ROT13
              </Button>
            </div>
          </section>
        )}

        <section aria-labelledby="caesar-input-heading">
          <h2 id="caesar-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="caesar-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isBrute ? "解読したい暗号文を入力" : "変換するテキストを入力"}
            rows={4}
            aria-label="シーザー暗号の入力テキスト"
          />
        </section>

        {!isBrute && (
          <section aria-labelledby="caesar-output-heading">
            <h2 id="caesar-output-heading" className="section-title">
              変換結果
            </h2>
            <div
              id="caesar-output"
              className={`caesar-output${isEmpty ? " caesar-output--empty" : ""}`}
              aria-live="polite"
              aria-label={`変換結果: ${output || "（変換結果なし）"}`}
              role="region"
            >
              {isEmpty ? "変換結果がここに表示されます" : output}
            </div>

            <div className="caesar-actions" role="group" aria-label="操作">
              <Button
                type="button"
                variant="default"
                onClick={handleCopy}
                disabled={isEmpty}
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
        )}

        {isBrute && bruteForceResults.length > 0 && (
          <section aria-labelledby="caesar-brute-heading">
            <h2 id="caesar-brute-heading" className="section-title">
              解析結果（全26パターン）
            </h2>
            <div role="region" aria-label="ブルートフォース解析結果">
              <table className="caesar-brute-table" aria-label="シフト量ごとのデコード結果">
                <thead>
                  <tr>
                    <th scope="col">シフト</th>
                    <th scope="col">デコード結果</th>
                  </tr>
                </thead>
                <tbody>
                  {bruteForceResults.map(({ shift: s, result }) => (
                    <tr
                      key={s}
                      onClick={async () => {
                        const ok = await copy(result);
                        if (ok) {
                          showToast(`シフト${s}の結果をコピーしました`, "success");
                        }
                      }}
                      title={`クリックでシフト${s}の結果をコピー`}
                    >
                      <td className="caesar-brute-shift">ROT-{s}</td>
                      <td>{result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="caesar-actions" role="group" aria-label="操作">
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
        )}

        {isBrute && isEmpty && (
          <div
            className="caesar-output caesar-output--empty"
            role="status"
            aria-live="polite"
          >
            入力すると全26パターンのデコード結果が表示されます
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "エンコード: テキストをシフト量分ずらして暗号化します",
                "デコード: 同じシフト量を指定して元のテキストに戻します",
                "ROT13ボタン: シフト量13（最もよく使われる設定）に素早く切り替えます",
                "ブルートフォース解析: シフト量が不明な場合に全26通りを一覧表示します",
              ],
            },
            {
              title: "シーザー暗号について",
              items: [
                "英字（A-Z / a-z）のみがシフトされ、数字・記号・日本語はそのまま保持されます",
                "ROT13はシフト量13の特殊ケースで、2回適用すると元のテキストに戻ります",
                "シーザー暗号は暗号強度が低く、セキュリティ目的での使用には適しません",
                "CTFやパズル・なぞなぞ・テキストの軽い難読化などに活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

export { rot13 };
