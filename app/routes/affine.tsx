import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "../hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "../hooks/useStatusAnnouncement";
import { TipsCard } from "../components/TipsCard";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeAffine, decodeAffine, bruteForceAffine, VALID_A_VALUES } from "../utils/affine";
import "../styles/tools/affine.css";

export const Route = createFileRoute("/affine")({
  head: () => ({
    meta: [
      { title: "アフィン暗号 | Web ツール集" },
      {
        name: "description",
        content:
          "アフィン暗号（Affine cipher）のエンコード・デコードツール。乗数 a と加数 b を自由に設定でき、ブルートフォース解析にも対応。シーザー暗号の一般化版。",
      },
      {
        property: "og:title",
        content: "アフィン暗号 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "アフィン暗号のエンコード・デコードツール。乗数 a と加数 b を設定でき、ブルートフォース解析にも対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/affine` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "アフィン暗号 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "アフィン暗号のエンコード・デコードツール。",
      },
    ],
  }),
  component: AffineCipher,
});

type Mode = "encode" | "decode" | "brute";

/**
 * アフィン暗号ツールコンポーネント
 * テキストのアフィン暗号エンコード・デコード・ブルートフォース解析を提供する
 */
function AffineCipher() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [inputText, setInputText] = useState("");
  const [paramA, setParamA] = useState(5);
  const [paramB, setParamB] = useState(8);
  const [mode, setMode] = useState<Mode>("encode");

  const output = useMemo(() => {
    if (!inputText) return "";
    if (mode === "encode") return encodeAffine(inputText, paramA, paramB);
    if (mode === "decode") return decodeAffine(inputText, paramA, paramB);
    return "";
  }, [inputText, paramA, paramB, mode]);

  const bruteForceResults = useMemo(() => {
    if (mode !== "brute" || !inputText) return [];
    return bruteForceAffine(inputText);
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
          : newMode === "decode"
            ? "デコードモードに切り替えました"
            : "ブルートフォース解析モードに切り替えました"
      );
    },
    [announceStatus]
  );

  const handleParamBChange = useCallback((value: number) => {
    setParamB(Math.max(0, Math.min(25, value)));
  }, []);

  const isEmpty = inputText.length === 0;
  const isBrute = mode === "brute";

  return (
    <>
      <div className="tool-container">
        <section aria-labelledby="affine-mode-heading">
          <h2 id="affine-mode-heading" className="section-title">
            モード選択
          </h2>
          <div className="affine-mode-group" role="group" aria-label="変換モード">
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
          <section aria-labelledby="affine-params-heading">
            <h2 id="affine-params-heading" className="section-title">
              パラメータ設定
            </h2>
            <div className="affine-formula-box" aria-label="暗号化式">
              {mode === "encode" ? (
                <>
                  暗号化: <strong>E(x) = ({paramA}x + {paramB}) mod 26</strong>
                </>
              ) : (
                <>
                  復号: <strong>D(x) = {VALID_A_VALUES.includes(paramA) ? getModInverse(paramA) : "?"} × (x − {paramB}) mod 26</strong>
                </>
              )}
            </div>
            <div className="affine-params-row">
              <div className="affine-param-group">
                <label htmlFor="affine-param-a" className="affine-param-label">
                  乗数 a（26と互いに素な値）
                </label>
                <select
                  id="affine-param-a"
                  className="affine-param-select"
                  value={paramA}
                  onChange={(e) => setParamA(Number(e.target.value))}
                  aria-label="乗数 a の値"
                >
                  {VALID_A_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <span className="affine-param-hint">有効値: {VALID_A_VALUES.join(", ")}</span>
              </div>
              <div className="affine-param-group">
                <label htmlFor="affine-param-b" className="affine-param-label">
                  加数 b（0〜25）
                </label>
                <input
                  id="affine-param-b"
                  type="number"
                  className="affine-param-number"
                  min={0}
                  max={25}
                  value={paramB}
                  onChange={(e) => handleParamBChange(Number(e.target.value))}
                  aria-label="加数 b の値（0〜25）"
                />
              </div>
            </div>
          </section>
        )}

        <section aria-labelledby="affine-input-heading">
          <h2 id="affine-input-heading" className="section-title">
            テキスト入力
          </h2>
          <Textarea
            id="affine-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isBrute ? "解読したい暗号文を入力" : "変換するテキストを入力"}
            rows={4}
            aria-label="アフィン暗号の入力テキスト"
          />
        </section>

        {!isBrute && (
          <section aria-labelledby="affine-output-heading">
            <h2 id="affine-output-heading" className="section-title">
              変換結果
            </h2>
            <div
              id="affine-output"
              className={`affine-output${isEmpty ? " affine-output--empty" : ""}`}
              aria-live="polite"
              aria-label={`変換結果: ${output || "（変換結果なし）"}`}
              role="region"
            >
              {isEmpty ? "変換結果がここに表示されます" : output}
            </div>

            <div className="affine-actions" role="group" aria-label="操作">
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
          <section aria-labelledby="affine-brute-heading">
            <h2 id="affine-brute-heading" className="section-title">
              解析結果（{bruteForceResults.length}パターン）
            </h2>
            <div role="region" aria-label="ブルートフォース解析結果">
              <table className="affine-brute-table" aria-label="パラメータごとのデコード結果">
                <thead>
                  <tr>
                    <th scope="col">a</th>
                    <th scope="col">b</th>
                    <th scope="col">デコード結果</th>
                  </tr>
                </thead>
                <tbody>
                  {bruteForceResults.map(({ a, b, result }) => (
                    <tr
                      key={`${a}-${b}`}
                      onClick={async () => {
                        const ok = await copy(result);
                        if (ok) {
                          showToast(`a=${a}, b=${b} の結果をコピーしました`, "success");
                        }
                      }}
                      title={`クリックで a=${a}, b=${b} の結果をコピー`}
                    >
                      <td className="affine-brute-params">{a}</td>
                      <td className="affine-brute-params">{b}</td>
                      <td>{result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="affine-actions" role="group" aria-label="操作">
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
            className="affine-output affine-output--empty"
            role="status"
            aria-live="polite"
          >
            入力すると全312パターンのデコード結果が表示されます
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "エンコード: 乗数 a と加数 b を設定してテキストを暗号化します",
                "デコード: エンコード時と同じ a, b を指定して元のテキストに戻します",
                "ブルートフォース解析: 有効な a(12種) × b(26種) = 312通りを一覧表示します",
              ],
            },
            {
              title: "アフィン暗号について",
              items: [
                "英字（A-Z / a-z）のみが変換され、数字・記号・日本語はそのまま保持されます",
                "暗号化式: E(x) = (a×x + b) mod 26 （x は文字のアルファベット順位 0-25）",
                "乗数 a は 26 と互いに素な値のみ有効（1,3,5,7,9,11,15,17,19,21,23,25）",
                "a=1 の場合はシーザー暗号（ROT-b）と同等になります",
                "アフィン暗号は暗号強度が低く、セキュリティ目的での使用には適しません",
                "CTFやパズル・古典暗号の学習などに活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

/**
 * mod 26 における a の逆元を返すヘルパー（表示用）
 */
function getModInverse(a: number): number {
  const inverses: Record<number, number> = {
    1: 1, 3: 9, 5: 21, 7: 15, 9: 3, 11: 19,
    15: 7, 17: 23, 19: 11, 21: 5, 23: 17, 25: 25,
  };
  return inverses[a] ?? 1;
}
