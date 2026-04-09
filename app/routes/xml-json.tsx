import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { xmlToJson, jsonToXml, getSampleXml, getSampleJson } from "~/utils/xml-json";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import "../styles/tools/xml-json.css";

export const Route = createFileRoute("/xml-json")({
  head: () => ({
    meta: [
      { title: "XML/JSON変換 | Web ツール集" },
      {
        name: "description",
        content:
          "XML文字列をJSONに変換、またはJSONをXMLに変換するオンラインツール。属性・テキスト・ネスト構造に対応。",
      },
      { property: "og:title", content: "XML/JSON変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "XML文字列をJSONに変換、またはJSONをXMLに変換するオンラインツール。属性・テキスト・ネスト構造に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/xml-json` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: XmlJsonConverter,
});

type Mode = "xml-to-json" | "json-to-xml";

/**
 * XML/JSON相互変換ページコンポーネント
 */
function XmlJsonConverter() {
  const [mode, setMode] = useState<Mode>("xml-to-json");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState(2);

  const { copy } = useClipboard();
  const { showToast } = useToast();

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      setError(mode === "xml-to-json" ? "XMLを入力してください" : "JSONを入力してください");
      setOutputText("");
      return;
    }

    const result =
      mode === "xml-to-json" ? xmlToJson(inputText, indent) : jsonToXml(inputText, indent);

    if (result.success) {
      setOutputText(result.output);
      setError(null);
    } else {
      setError(result.error ?? "変換エラーが発生しました");
      setOutputText("");
    }
  }, [inputText, mode, indent]);

  const handleLoadSample = useCallback(() => {
    const sample = mode === "xml-to-json" ? getSampleXml() : getSampleJson();
    setInputText(sample);
    setOutputText("");
    setError(null);
  }, [mode]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setError(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    const success = await copy(outputText);
    if (success) {
      showToast("コピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, copy, showToast]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setInputText("");
    setOutputText("");
    setError(null);
  }, []);

  const inputLabel = mode === "xml-to-json" ? "XML入力" : "JSON入力";
  const outputLabel = mode === "xml-to-json" ? "JSON出力" : "XML出力";
  const inputPlaceholder =
    mode === "xml-to-json"
      ? '<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>'
      : '{\n  "root": {\n    "item": "value"\n  }\n}';

  return (
    <div className="tool-container">
      {/* モード切り替えタブ */}
      <div className="xml-json-mode-tabs" role="tablist" aria-label="変換モード">
        <button
          role="tab"
          aria-selected={mode === "xml-to-json"}
          className={`xml-json-mode-tab${mode === "xml-to-json" ? " xml-json-mode-tab--active" : ""}`}
          onClick={() => handleModeChange("xml-to-json")}
        >
          XML → JSON
        </button>
        <button
          role="tab"
          aria-selected={mode === "json-to-xml"}
          className={`xml-json-mode-tab${mode === "json-to-xml" ? " xml-json-mode-tab--active" : ""}`}
          onClick={() => handleModeChange("json-to-xml")}
        >
          JSON → XML
        </button>
      </div>

      {/* アクションボタン */}
      <div className="xml-json-actions">
        <button
          type="button"
          id="convert-btn"
          className="xml-json-btn xml-json-btn--primary"
          onClick={handleConvert}
          aria-label="変換を実行"
        >
          変換
        </button>
        <button
          type="button"
          className="xml-json-btn"
          onClick={handleLoadSample}
          aria-label="サンプルデータを読み込む"
        >
          サンプル
        </button>
        <button
          type="button"
          className="xml-json-btn"
          onClick={handleClear}
          aria-label="すべてクリア"
        >
          クリア
        </button>
        <label className="xml-json-indent-label">
          インデント
          <select
            className="xml-json-indent-select"
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
            aria-label="インデント幅"
          >
            <option value={2}>2スペース</option>
            <option value={4}>4スペース</option>
          </select>
        </label>
      </div>

      <ErrorMessage message={error} />

      {/* 入出力エリア */}
      <div className="xml-json-io-grid">
        <div className="xml-json-io-panel">
          <div className="xml-json-io-label" id="input-label">
            {inputLabel}
          </div>
          <textarea
            id="input-text"
            className="xml-json-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={inputPlaceholder}
            aria-label={inputLabel}
            aria-labelledby="input-label"
            spellCheck={false}
          />
        </div>
        <div className="xml-json-io-panel">
          <div className="xml-json-io-label" id="output-label">
            {outputLabel}
          </div>
          <textarea
            id="output-text"
            className="xml-json-textarea"
            value={outputText}
            readOnly
            placeholder="変換結果がここに表示されます"
            aria-label={outputLabel}
            aria-labelledby="output-label"
            aria-readonly="true"
            spellCheck={false}
          />
          {outputText && (
            <button
              type="button"
              className="xml-json-btn"
              onClick={handleCopy}
              aria-label="出力をコピー"
            >
              コピー
            </button>
          )}
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "モードタブで「XML → JSON」または「JSON → XML」を選択",
              "入力欄にテキストを貼り付けて「変換」ボタンをクリック",
              "「サンプル」ボタンでサンプルデータを読み込めます",
              "出力結果は「コピー」ボタンでクリップボードにコピー可能",
            ],
          },
          {
            title: "XML → JSON の変換規則",
            items: [
              "要素のテキスト内容は文字列値として変換",
              '属性は "@attributes" オブジェクトにまとめて格納',
              "同名の子要素が複数ある場合は配列に変換",
              'テキストと子要素が混在する場合は "#text" キーでテキストを保持',
            ],
          },
          {
            title: "JSON → XML の変換規則",
            items: [
              "JSONのルートオブジェクトの最初のキーがルート要素名になります",
              '"@attributes" オブジェクトは属性として変換',
              "配列は同名の要素を繰り返して変換",
              '"#text" キーの値はテキストコンテンツとして変換',
            ],
          },
        ]}
      />
    </div>
  );
}
