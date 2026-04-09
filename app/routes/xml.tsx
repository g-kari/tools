import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { formatXml, minifyXml, validateXml } from "~/utils/xml";

export const Route = createFileRoute("/xml")({
  head: () => ({
    meta: [
      { title: "XMLフォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "XMLデータの整形・圧縮・構文検証ツール。XMLのインデント整形、圧縮、バリデーションをブラウザ上で簡単に実行できます。",
      },
      {
        property: "og:title",
        content: "XMLフォーマッター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "XMLデータの整形・圧縮・構文検証ツール。XMLのインデント整形、圧縮、バリデーションをブラウザ上で簡単に実行できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/xml` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "XMLフォーマッター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "XMLデータの整形・圧縮・構文検証ツール。XMLのインデント整形、圧縮、バリデーションをブラウザ上で簡単に実行できます。",
      },
    ],
  }),
  component: XmlFormatter,
});

/** 操作モードの型定義 */
type Mode = "format" | "minify" | "validate";

const xmlPlaceholder = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <person>
    <name>山田太郎</name>
    <age>30</age>
  </person>
</root>`;

/**
 * XMLフォーマッター/バリデーターコンポーネント
 */
function XmlFormatter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>("format");
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

  const handleProcess = useCallback(() => {
    if (!inputText.trim()) {
      announceStatus("エラー: テキストを入力してください");
      showToast("テキストを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    try {
      if (mode === "format") {
        const result = formatXml(inputText, indent);
        setOutputText(result);
        announceStatus("XMLの整形が完了しました");
      } else if (mode === "minify") {
        const result = minifyXml(inputText);
        setOutputText(result);
        announceStatus("XMLの圧縮が完了しました");
      } else {
        const result = validateXml(inputText);
        if (result.valid) {
          setOutputText("✓ 有効なXMLです");
          announceStatus("XMLは有効です");
        } else {
          setOutputText(`✗ エラー: ${result.error}`);
          announceStatus(`XMLが無効です: ${result.error}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "処理に失敗しました";
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
          aria-label="XMLフォーマットフォーム"
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
                    aria-label="XMLを整形する"
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
                    aria-label="XMLを圧縮する"
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
                    aria-label="XMLを検証する"
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
              </div>
            </div>
          )}

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              XML 入力
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={xmlPlaceholder}
              aria-describedby="input-help"
              aria-label="変換元のXMLテキスト入力欄"
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              XMLデータを入力して操作ボタンを押してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="XML操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleProcess}
              aria-label={`XML ${processLabel}`}
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
              aria-label={mode === "validate" ? "XML検証結果の出力欄" : "XML処理結果の出力欄"}
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
                "整形モードではインデント幅（2または4スペース）を選択できます",
                "入力欄にXMLデータを貼り付けてボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "XMLについて",
              items: [
                "XMLはeXtensible Markup Languageの略で、データの構造化・交換に広く使われるフォーマットです",
                '<?xml version="1.0" encoding="UTF-8"?> のような宣言から始めることが推奨されます',
                "タグは必ず開きタグと閉じタグを対応させるか、<br/> のようにセルフクロージング形式で記述します",
                "検証モードではタグの対応関係とルート要素の唯一性をチェックします",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
