import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import { yamlToToml, tomlToYaml } from "~/utils/yaml-toml";

export const Route = createFileRoute("/yaml-toml")({
  head: () => ({
    meta: [
      { title: "YAML↔TOML変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "YAML と TOML を直接相互変換するツール。JSON を経由せず精度を確保。Cargo.toml・pyproject.toml・wrangler.toml などの設定ファイル変換に便利。",
      },
      { property: "og:title", content: "YAML↔TOML変換ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "YAML と TOML を直接相互変換。Cargo.toml・pyproject.toml・GitHub Actions 設定ファイルの変換に。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/yaml-toml` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "YAML↔TOML変換ツール | Web ツール集" },
      {
        name: "twitter:description",
        content: "YAML と TOML を直接相互変換。Cargo.toml・pyproject.toml の変換に。",
      },
    ],
  }),
  component: YamlTomlConverter,
});

type ConversionMode = "yaml-to-toml" | "toml-to-yaml";

/**
 * YAML ↔ TOML 相互変換コンポーネント
 */
function YamlTomlConverter() {
  const { statusRef, announceStatus, showToast, isCopied, handleCopy } = useCopyWithFeedback();
  const [mode, setMode] = useState<ConversionMode>("yaml-to-toml");
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
      if (mode === "yaml-to-toml") {
        result = yamlToToml(inputText);
        announceStatus("YAML から TOML への変換が完了しました");
      } else {
        result = tomlToYaml(inputText);
        announceStatus("TOML から YAML への変換が完了しました");
      }
      setOutputText(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "変換に失敗しました";
      announceStatus(`エラー: ${message}`);
      showToast(message, "error");
    }
  }, [inputText, mode, announceStatus, showToast]);

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

  const convertLabel = mode === "yaml-to-toml" ? "YAML → TOML 変換" : "TOML → YAML 変換";

  const yamlPlaceholder =
    'name: my-app\nversion: "1.0.0"\ndependencies:\n  tokio: "1.0"\n  serde: "1.0"';

  const tomlPlaceholder =
    '[package]\nname = "my-app"\nversion = "1.0.0"\n\n[dependencies]\ntokio = "1.0"\nserde = "1.0"';

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="YAML/TOML変換フォーム">
          <div className="converter-section">
            <fieldset className="csv-json-mode-fieldset">
              <legend className="section-title">変換モード</legend>
              <div className="csv-json-mode-group" role="group" aria-label="変換モード選択">
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="yaml-to-toml"
                    checked={mode === "yaml-to-toml"}
                    onChange={() => handleModeChange("yaml-to-toml")}
                    aria-label="YAML から TOML へ変換"
                  />
                  <span className="format-label">YAML → TOML</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="toml-to-yaml"
                    checked={mode === "toml-to-yaml"}
                    onChange={() => handleModeChange("toml-to-yaml")}
                    aria-label="TOML から YAML へ変換"
                  />
                  <span className="format-label">TOML → YAML</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              {mode === "yaml-to-toml" ? "YAML 入力" : "TOML 入力"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === "yaml-to-toml" ? yamlPlaceholder : tomlPlaceholder}
              aria-label={
                mode === "yaml-to-toml"
                  ? "変換元の YAML テキスト入力欄"
                  : "変換元の TOML テキスト入力欄"
              }
              className="csv-json-textarea"
            />
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
                {mode === "yaml-to-toml" ? "TOML 出力" : "YAML 出力"}
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
              aria-label={
                mode === "yaml-to-toml" ? "TOML 変換結果の出力欄" : "YAML 変換結果の出力欄"
              }
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
                "変換モードを「YAML → TOML」または「TOML → YAML」から選択します",
                "入力欄にデータを貼り付けて「変換」ボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
                "JSON を経由しない直接変換のため、型精度が高くなります",
              ],
            },
            {
              title: "YAML → TOML の制限",
              items: [
                "TOML のルートはオブジェクト（{}）のみ対応（配列は不可）",
                "TOML は null 値を未サポートのため null 値を含む YAML は変換できません",
                "YAML のアンカー（&）・エイリアス（*）はマージして変換されます",
                "マルチドキュメント YAML（--- 区切り）は最初のドキュメントのみ変換",
              ],
            },
            {
              title: "YAML / TOML の主な用途",
              items: [
                "YAML: Kubernetes・Docker Compose・GitHub Actions・Ansible 設定",
                "TOML: Cargo.toml（Rust）・pyproject.toml（Python）・wrangler.toml（Cloudflare）",
                "設定ファイルをチーム間で共有する際のフォーマット変換に活用できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
