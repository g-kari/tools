import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { formatYaml, minifyYaml, validateYaml } from "~/utils/yaml";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/yaml-formatter")({
  head: () => ({
    meta: [
      { title: "YAMLフォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "YAMLデータの整形・圧縮・構文検証ツール。インデント幅・キーソートを選択してYAMLを整形。Kubernetes、Docker Compose、GitHub Actions設定ファイルの確認に。",
      },
      { property: "og:title", content: "YAMLフォーマッター | Web ツール集" },
      {
        property: "og:description",
        content:
          "YAMLデータの整形・圧縮・構文検証ツール。インデント幅・キーソートを選択してYAMLを整形。Kubernetes、Docker Compose、GitHub Actions設定ファイルの確認に。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/yaml-formatter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "YAMLフォーマッター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "YAMLデータの整形・圧縮・構文検証ツール。インデント幅・キーソートを選択してYAMLを整形。Kubernetes、Docker Compose、GitHub Actions設定ファイルの確認に。",
      },
    ],
  }),
  component: YamlFormatter,
});

/** 操作モードの型定義 */
type Mode = "format" | "minify" | "validate";

const yamlPlaceholder = `name: my-app
version: 1.0.0
dependencies:
  react: "^18.0.0"
  typescript: "^5.0.0"
config:
  port: 3000
  debug: true
  features:
    - auth
    - logging`;

/**
 * YAMLフォーマッター/バリデーターコンポーネント
 */
function YamlFormatter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleProcess = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    try {
      if (mode === "format") {
        const result = formatYaml(inputText, indent, sortKeys);
        setOutputText(result);
        announceStatus("YAMLの整形が完了しました");
      } else if (mode === "minify") {
        const result = minifyYaml(inputText);
        setOutputText(result);
        announceStatus("YAMLの圧縮が完了しました");
      } else {
        const result = validateYaml(inputText);
        if (result.valid) {
          setOutputText("✓ 有効なYAMLです");
          announceStatus("YAMLは有効です");
        } else {
          setOutputText(`✗ エラー: ${result.error}`);
          announceStatus(`YAMLが無効です: ${result.error}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "処理に失敗しました";
      announceStatus(`エラー: ${message}`);
      showToast(message, "error");
    }
  }, [inputText, mode, indent, sortKeys, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      setIsCopied(true);
      announceStatus("出力結果をコピーしました");
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, copy, announceStatus, showToast]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setInputText("");
    setOutputText("");
  }, []);

  const processLabel = mode === "format" ? "整形" : mode === "minify" ? "圧縮" : "検証";

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}
          aria-label="YAMLフォーマットフォーム"
        >
          <div className="converter-section">
            <fieldset className="csv-json-mode-fieldset">
              <legend className="section-title">操作モード</legend>
              <div className="csv-json-mode-group" role="group" aria-label="操作モード選択">
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="format"
                    checked={mode === "format"}
                    onChange={() => handleModeChange("format")}
                    aria-label="YAMLを整形する"
                  />
                  <span className="format-label">整形</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="minify"
                    checked={mode === "minify"}
                    onChange={() => handleModeChange("minify")}
                    aria-label="YAMLを圧縮する"
                  />
                  <span className="format-label">圧縮</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="validate"
                    checked={mode === "validate"}
                    onChange={() => handleModeChange("validate")}
                    aria-label="YAMLを検証する"
                  />
                  <span className="format-label">検証</span>
                </label>
              </div>
            </fieldset>
          </div>

          {mode === "format" && (
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
                <div className="option-group">
                  <span className="section-title" id="sort-option-label">
                    オプション
                  </span>
                  <label className="format-option" aria-labelledby="sort-option-label">
                    <input
                      type="checkbox"
                      checked={sortKeys}
                      onChange={(e) => setSortKeys(e.target.checked)}
                      aria-label="キーをアルファベット順にソート"
                    />
                    <span className="format-label">キーをソート</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              YAML 入力
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={yamlPlaceholder}
              aria-describedby="input-help"
              aria-label="変換元のYAMLテキスト入力欄"
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              YAMLデータを入力して操作ボタンを押してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="YAML操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleProcess}
              aria-label={`YAML ${processLabel}`}
            >
              {processLabel}
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
                {mode === "validate" ? "検証結果" : "出力"}
              </label>
              <button
                type="button"
                className={`number-base-copy-btn${isCopied ? " copied" : ""}`}
                onClick={handleCopy}
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
              placeholder={
                mode === "validate"
                  ? "検証結果がここに表示されます..."
                  : "処理結果がここに表示されます..."
              }
              aria-label={mode === "validate" ? "YAML検証結果の出力欄" : "YAML処理結果の出力欄"}
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
                "操作モードを「整形」「圧縮」「検証」から選択します",
                "整形モードではインデント幅（2または4スペース）とキーソートを設定できます",
                "入力欄にYAMLデータを貼り付けてボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "YAMLについて",
              items: [
                "YAMLはYAML Ain't Markup Languageの略で、人間が読みやすい設定ファイル形式として広く使われています",
                "Kubernetes、Docker Compose、GitHub Actions、Ansible など多くのツールで採用されています",
                "インデントで階層構造を表現し、スペースとタブを混在させることはできません",
                "圧縮モードではフロースタイル（{key: value}形式）で出力します",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
