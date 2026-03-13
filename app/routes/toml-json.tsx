import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import * as TOML from "smol-toml";

export const Route = createFileRoute("/toml-json")({
  head: () => ({
    meta: [
      { title: "TOML↔JSON変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "TOMLとJSONの相互変換ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイル変換に便利です。",
      },
      {
        property: "og:title",
        content: "TOML↔JSON変換ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "TOMLとJSONの相互変換ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイル変換に便利です。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/toml-json` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "TOML↔JSON変換ツール | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "TOMLとJSONの相互変換ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイル変換に便利です。",
      },
    ],
  }),
  component: TomlJsonConverter,
});

type ConversionMode = "toml-to-json" | "json-to-toml";

/**
 * TOMLをJSONに変換する
 * @param tomlStr 変換元のTOML文字列
 * @param indent JSONのインデント幅（デフォルト: 2）
 * @returns JSON文字列
 * @throws {Error} TOML文字列が空またはnullの場合
 */
export function tomlToJson(tomlStr: string, indent: number = 2): string {
  if (!tomlStr.trim()) {
    throw new Error("TOMLデータが空です");
  }
  const parsed = TOML.parse(tomlStr);
  return JSON.stringify(parsed, null, indent);
}

/**
 * JSONをTOMLに変換する
 * @param jsonStr 変換元のJSON文字列
 * @returns TOML文字列
 * @throws {Error} JSON文字列が無効、またはTOMLで表現できない値を含む場合
 */
export function jsonToToml(jsonStr: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("無効なJSON形式です");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      "JSONのルートはオブジェクト（{}）である必要があります。配列やプリミティブ値は変換できません"
    );
  }
  try {
    return TOML.stringify(parsed as Record<string, unknown>);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("null")) {
      throw new Error(
        "TOMLはnull値をサポートしていません。null値を除去してから変換してください"
      );
    }
    throw err;
  }
}

/**
 * TOML↔JSON相互変換コンポーネント
 */
function TomlJsonConverter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<ConversionMode>("toml-to-json");
  const [indent, setIndent] = useState<2 | 4>(2);
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

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }
    try {
      let result: string;
      if (mode === "toml-to-json") {
        result = tomlToJson(inputText, indent);
        announceStatus("TOMLからJSONへの変換が完了しました");
      } else {
        result = jsonToToml(inputText);
        announceStatus("JSONからTOMLへの変換が完了しました");
      }
      setOutputText(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "変換に失敗しました";
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

  const handleModeChange = useCallback((newMode: ConversionMode) => {
    setMode(newMode);
    setInputText("");
    setOutputText("");
  }, []);

  const convertLabel =
    mode === "toml-to-json" ? "TOML → JSON 変換" : "JSON → TOML 変換";

  const tomlPlaceholder =
    '[package]\nname = "my-app"\nversion = "1.0.0"\n\n[dependencies]\ntokio = "1.0"';

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="TOML/JSON変換フォーム"
        >
          <div className="converter-section">
            <fieldset className="csv-json-mode-fieldset">
              <legend className="section-title">変換モード</legend>
              <div
                className="csv-json-mode-group"
                role="group"
                aria-label="変換モード選択"
              >
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="toml-to-json"
                    checked={mode === "toml-to-json"}
                    onChange={() => handleModeChange("toml-to-json")}
                    aria-label="TOML から JSON へ変換"
                  />
                  <span className="format-label">TOML → JSON</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="json-to-toml"
                    checked={mode === "json-to-toml"}
                    onChange={() => handleModeChange("json-to-toml")}
                    aria-label="JSON から TOML へ変換"
                  />
                  <span className="format-label">JSON → TOML</span>
                </label>
              </div>
            </fieldset>
          </div>

          {mode === "toml-to-json" && (
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
              {mode === "toml-to-json" ? "TOML 入力" : "JSON 入力"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "toml-to-json"
                  ? tomlPlaceholder
                  : '{"name":"my-app","version":"1.0.0"}'
              }
              aria-describedby="input-help"
              aria-label={
                mode === "toml-to-json"
                  ? "変換元のTOMLテキスト入力欄"
                  : "変換元のJSONテキスト入力欄"
              }
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              {mode === "toml-to-json"
                ? "TOMLデータを入力して変換ボタンを押してください"
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
                {mode === "toml-to-json" ? "JSON 出力" : "TOML 出力"}
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
              placeholder="変換結果がここに表示されます..."
              aria-label={
                mode === "toml-to-json"
                  ? "JSON変換結果の出力欄"
                  : "TOML変換結果の出力欄"
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
                "変換モードを「TOML → JSON」または「JSON → TOML」から選択します",
                "TOML → JSON変換では出力のインデント幅を選択できます",
                "入力欄にデータを貼り付けて「変換」ボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "TOMLについて",
              items: [
                "TOMLはTom's Obvious, Minimal Languageの略で、設定ファイル向けのデータフォーマットです",
                "Cargo.toml（Rust）、pyproject.toml（Python）、wrangler.toml（Cloudflare）などの設定ファイルで広く使用されています",
                "セクション（[section]）でデータの階層を表現します",
                "コメント（#）はJSON変換時に除去されます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
