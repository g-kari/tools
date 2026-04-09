import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { formatToml, minifyToml, validateToml } from "~/utils/toml-formatter";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/toml-formatter")({
  head: () => ({
    meta: [
      { title: "TOMLフォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "TOMLデータの整形・圧縮・構文検証ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイルの確認・整形に。",
      },
      { property: "og:title", content: "TOMLフォーマッター | Web ツール集" },
      {
        property: "og:description",
        content:
          "TOMLデータの整形・圧縮・構文検証ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイルの確認・整形に。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/toml-formatter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "TOMLフォーマッター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "TOMLデータの整形・圧縮・構文検証ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイルの確認・整形に。",
      },
    ],
  }),
  component: TomlFormatter,
});

/** 操作モードの型定義 */
type Mode = "format" | "minify" | "validate";

const tomlPlaceholder = `[package]
name = "my-app"
version = "1.0.0"

[dependencies]
tokio = "1.0"
serde = { version = "1.0", features = ["derive"] }

[profile.release]
opt-level = 3`;

/**
 * TOMLフォーマッター/バリデーターコンポーネント
 */
function TomlFormatter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("format");
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
        const result = formatToml(inputText);
        setOutputText(result);
        announceStatus("TOMLの整形が完了しました");
      } else if (mode === "minify") {
        const result = minifyToml(inputText);
        setOutputText(result);
        announceStatus("TOMLの圧縮が完了しました");
      } else {
        const result = validateToml(inputText);
        if (result.valid) {
          setOutputText("✓ 有効なTOMLです");
          announceStatus("TOMLは有効です");
        } else {
          setOutputText(`✗ エラー: ${result.error}`);
          announceStatus(`TOMLが無効です: ${result.error}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "処理に失敗しました";
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
          aria-label="TOMLフォーマットフォーム"
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
                    aria-label="TOMLを整形する"
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
                    aria-label="TOMLを圧縮する"
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
                    aria-label="TOMLを検証する"
                  />
                  <span className="format-label">検証</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              TOML 入力
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={tomlPlaceholder}
              aria-describedby="input-help"
              aria-label="変換元のTOMLテキスト入力欄"
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              TOMLデータを入力して操作ボタンを押してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="TOML操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleProcess}
              aria-label={`TOML ${processLabel}`}
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
              aria-label={mode === "validate" ? "TOML検証結果の出力欄" : "TOML処理結果の出力欄"}
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
                "入力欄にTOMLデータを貼り付けてボタンを押します",
                "整形モードでは標準的なTOML形式に正規化します",
                "圧縮モードでは空白行を除去してコンパクトな形式で出力します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "TOMLについて",
              items: [
                "TOMLはTom's Obvious, Minimal Languageの略で、設定ファイル向けのデータフォーマットです",
                "Cargo.toml（Rust）、pyproject.toml（Python）、wrangler.toml（Cloudflare）などで広く使われています",
                "セクション（[section]）で階層構造を表現し、キーと値はイコール（=）で区切ります",
                "文字列・整数・浮動小数点・真偽値・日付時刻・配列・インラインテーブルをサポートします",
                "コメントは#で始まり、整形後は除去されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
