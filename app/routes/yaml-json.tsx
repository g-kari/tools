import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useOutputCopy } from "~/hooks/useOutputCopy";
import * as yaml from "js-yaml";

export const Route = createFileRoute("/yaml-json")({
  head: () => ({
    meta: [
      { title: "YAML↔JSON変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "YAMLとJSONの相互変換ツール。Kubernetes、Docker Compose、GitHub Actionsなどの設定ファイル変換に便利です。",
      },
      {
        property: "og:title",
        content: "YAML↔JSON変換ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "YAMLとJSONの相互変換ツール。Kubernetes、Docker Compose、GitHub Actionsなどの設定ファイル変換に便利です。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/yaml-json` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "YAML↔JSON変換ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "YAMLとJSONの相互変換ツール。Kubernetes、Docker Compose、GitHub Actionsなどの設定ファイル変換に便利です。",
      },
    ],
  }),
  component: YamlJsonConverter,
});

type ConversionMode = "yaml-to-json" | "json-to-yaml";

/**
 * YAMLをJSONに変換する
 * @param yamlStr 変換元のYAML文字列
 * @param indent JSONのインデント幅（デフォルト: 2）
 * @returns JSON文字列
 * @throws {Error} YAML文字列が空またはnullの場合
 */
export function yamlToJson(yamlStr: string, indent: number = 2): string {
  if (!yamlStr.trim()) {
    throw new Error("YAMLデータが空です");
  }
  const parsed = yaml.load(yamlStr);
  if (parsed === null || parsed === undefined) {
    throw new Error("YAMLデータが空です");
  }
  return JSON.stringify(parsed, null, indent);
}

/**
 * JSONをYAMLに変換する
 * @param jsonStr 変換元のJSON文字列
 * @returns YAML文字列
 */
export function jsonToYaml(jsonStr: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("無効なJSON形式です");
  }
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
}

/**
 * YAML↔JSON相互変換コンポーネント
 */
function YamlJsonConverter() {
  const { statusRef, announceStatus, showToast, isCopied, handleCopy } = useOutputCopy();
  const [mode, setMode] = useState<ConversionMode>("yaml-to-json");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      let result: string;
      if (mode === "yaml-to-json") {
        result = yamlToJson(inputText, indent);
        announceStatus("YAMLからJSONへの変換が完了しました");
      } else {
        result = jsonToYaml(inputText);
        announceStatus("JSONからYAMLへの変換が完了しました");
      }
      setOutputText(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "変換に失敗しました";
      announceStatus(`エラー: ${message}`);
      showToast(message, "error");
    }
  }, [inputText, mode, indent, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleModeChange = useCallback((newMode: ConversionMode) => {
    setMode(newMode);
    setInputText("");
    setOutputText("");
  }, []);

  const convertLabel = mode === "yaml-to-json" ? "YAML → JSON 変換" : "JSON → YAML 変換";

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="YAML/JSON変換フォーム">
          <div className="converter-section">
            <fieldset className="csv-json-mode-fieldset">
              <legend className="section-title">変換モード</legend>
              <div className="csv-json-mode-group" role="group" aria-label="変換モード選択">
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="yaml-to-json"
                    checked={mode === "yaml-to-json"}
                    onChange={() => handleModeChange("yaml-to-json")}
                    aria-label="YAML から JSON へ変換"
                  />
                  <span className="format-label">YAML → JSON</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="json-to-yaml"
                    checked={mode === "json-to-yaml"}
                    onChange={() => handleModeChange("json-to-yaml")}
                    aria-label="JSON から YAML へ変換"
                  />
                  <span className="format-label">JSON → YAML</span>
                </label>
              </div>
            </fieldset>
          </div>

          {mode === "yaml-to-json" && (
            <div className="converter-section">
              <div className="csv-json-options">
                <div className="option-group">
                  <span className="section-title" id="indent-option-label">
                    インデント幅
                  </span>
                  <div
                    className="csv-json-mode-group"
                    role="group"
                    aria-labelledby="indent-option-label"
                  >
                    <label className="format-option">
                      <input
                        type="radio"
                        name="indent"
                        value="2"
                        checked={indent === 2}
                        onChange={() => setIndent(2)}
                        aria-label="インデント2スペース"
                      />
                      <span className="format-label">2スペース</span>
                    </label>
                    <label className="format-option">
                      <input
                        type="radio"
                        name="indent"
                        value="4"
                        checked={indent === 4}
                        onChange={() => setIndent(4)}
                        aria-label="インデント4スペース"
                      />
                      <span className="format-label">4スペース</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              {mode === "yaml-to-json" ? "YAML 入力" : "JSON 入力"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "yaml-to-json"
                  ? "name: 田中\nage: 30\ncity: 東京"
                  : '{"name":"田中","age":30,"city":"東京"}'
              }
              aria-describedby="input-help"
              aria-label={
                mode === "yaml-to-json"
                  ? "変換元のYAMLテキスト入力欄"
                  : "変換元のJSONテキスト入力欄"
              }
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              {mode === "yaml-to-json"
                ? "YAMLデータを入力して変換ボタンを押してください"
                : "JSONデータを入力して変換ボタンを押してください"}
            </span>
          </div>

          <div className="button-group" role="group" aria-label="変換操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleConvert}
              aria-label={convertLabel}
            >
              {convertLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          <div className="output-section">
            <div className="csv-json-output-header">
              <label htmlFor="outputText" className="section-title">
                {mode === "yaml-to-json" ? "JSON 出力" : "YAML 出力"}
              </label>
              <button
                type="button"
                className={`number-base-copy-btn${isCopied ? " copied" : ""}`}
                onClick={() => handleCopy(outputText)}
                disabled={!outputText}
                aria-label="出力結果をクリップボードにコピー"
              >
                {isCopied ? "コピー済" : "コピー"}
              </button>
            </div>
            <Textarea
              id="outputText"
              value={outputText}
              readOnly
              placeholder="変換結果がここに表示されます..."
              aria-label={mode === "yaml-to-json" ? "JSON変換結果の出力欄" : "YAML変換結果の出力欄"}
              aria-live="polite"
              className="csv-json-textarea"
            />
          </div>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "変換モードを「YAML → JSON」または「JSON → YAML」から選択します",
                "YAML → JSON変換では出力のインデント幅を選択できます",
                "入力欄にデータを貼り付けて「変換」ボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "YAMLについて",
              items: [
                "YAMLはインデントでデータの階層を表現するデータフォーマットです",
                "Kubernetes、Docker Compose、GitHub Actionsなどの設定ファイルで広く使用されています",
                "コメント（#）を含む場合、JSON変換時に除去されます",
                "マルチドキュメントYAML（---区切り）は最初のドキュメントのみ変換されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
