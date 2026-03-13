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

export const Route = createFileRoute("/csv-json")({
  head: () => ({
    meta: [
      { title: "CSV/JSON変換ツール | Web ツール集" },
      {
        name: "description",
        content:
          "CSVとJSONの相互変換ツール。ヘッダー行の有無や区切り文字（カンマ・タブ・セミコロン）を選択して変換できます。",
      },
      { property: "og:title", content: "CSV/JSON変換ツール | Web ツール集" },
      {
        property: "og:description",
        content:
          "CSVとJSONの相互変換ツール。ヘッダー行の有無や区切り文字（カンマ・タブ・セミコロン）を選択して変換できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/csv-json` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "CSV/JSON変換ツール | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "CSVとJSONの相互変換ツール。ヘッダー行の有無や区切り文字（カンマ・タブ・セミコロン）を選択して変換できます。",
      },
    ],
  }),
  component: CsvJsonConverter,
});

type ConversionMode = "csv-to-json" | "json-to-csv";

const DELIMITER_OPTIONS = [
  { value: ",", label: "カンマ (,)" },
  { value: "\t", label: "タブ (\\t)" },
  { value: ";", label: "セミコロン (;)" },
] as const;

/**
 * CSVの1行をフィールドの配列にパースする（RFC 4180準拠）
 */
function parseRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * CSVをJSONに変換する
 * @param csv 変換元のCSV文字列
 * @param delimiter 区切り文字
 * @param hasHeader ヘッダー行の有無
 * @returns JSON文字列
 */
export function csvToJson(
  csv: string,
  delimiter: string,
  hasHeader: boolean
): string {
  const lines = csv
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    throw new Error("CSVデータが空です");
  }

  if (hasHeader) {
    const headers = parseRow(lines[0], delimiter);
    const data = lines.slice(1).map((line) => {
      const values = parseRow(line, delimiter);
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i] !== undefined ? values[i].trim() : "";
      });
      return obj;
    });
    return JSON.stringify(data, null, 2);
  } else {
    const data = lines.map((line) =>
      parseRow(line, delimiter).map((v) => v.trim())
    );
    return JSON.stringify(data, null, 2);
  }
}

/**
 * JSONをCSVに変換する
 * @param json 変換元のJSON文字列
 * @param delimiter 区切り文字
 * @returns CSV文字列
 */
export function jsonToCsv(json: string, delimiter: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("無効なJSON形式です");
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "JSONはオブジェクトの配列または配列の配列である必要があります"
    );
  }
  if (parsed.length === 0) {
    throw new Error("JSONデータが空の配列です");
  }

  const escapeField = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (
      str.includes(delimiter) ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  if (
    typeof parsed[0] === "object" &&
    parsed[0] !== null &&
    !Array.isArray(parsed[0])
  ) {
    const records = parsed as Record<string, unknown>[];
    const headers = Object.keys(records[0]);
    const headerRow = headers.map(escapeField).join(delimiter);
    const rows = records.map((row) =>
      headers.map((h) => escapeField(row[h])).join(delimiter)
    );
    return [headerRow, ...rows].join("\n");
  }

  if (Array.isArray(parsed[0])) {
    const rows = (parsed as unknown[][]).map((row) =>
      row.map(escapeField).join(delimiter)
    );
    return rows.join("\n");
  }

  throw new Error(
    "JSONはオブジェクトの配列または配列の配列である必要があります"
  );
}

/**
 * CSV/JSON相互変換コンポーネント
 */
function CsvJsonConverter() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<ConversionMode>("csv-to-json");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
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
      if (mode === "csv-to-json") {
        result = csvToJson(inputText, delimiter, hasHeader);
        announceStatus("CSVからJSONへの変換が完了しました");
      } else {
        result = jsonToCsv(inputText, delimiter);
        announceStatus("JSONからCSVへの変換が完了しました");
      }
      setOutputText(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "変換に失敗しました";
      announceStatus(`エラー: ${message}`);
      showToast(message, "error");
    }
  }, [inputText, mode, delimiter, hasHeader, announceStatus, showToast]);

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
    mode === "csv-to-json" ? "CSV → JSON 変換" : "JSON → CSV 変換";

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="CSV/JSON変換フォーム"
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
                    value="csv-to-json"
                    checked={mode === "csv-to-json"}
                    onChange={() => handleModeChange("csv-to-json")}
                    aria-label="CSV から JSON へ変換"
                  />
                  <span className="format-label">CSV → JSON</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="mode"
                    value="json-to-csv"
                    checked={mode === "json-to-csv"}
                    onChange={() => handleModeChange("json-to-csv")}
                    aria-label="JSON から CSV へ変換"
                  />
                  <span className="format-label">JSON → CSV</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div className="converter-section">
            <div className="csv-json-options">
              <div className="option-group">
                <label htmlFor="delimiter" className="section-title">
                  区切り文字
                </label>
                <select
                  id="delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  aria-label="区切り文字を選択"
                >
                  {DELIMITER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "csv-to-json" && (
                <div className="option-group">
                  <span className="section-title" id="header-option-label">
                    ヘッダー行
                  </span>
                  <label
                    className="md3-checkbox-wrapper"
                    aria-labelledby="header-option-label"
                  >
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      aria-label="1行目をヘッダー行として扱う"
                    />
                    <span className="md3-checkbox" aria-hidden="true" />
                    <span className="md3-checkbox-label">
                      1行目をヘッダーとして使用
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              {mode === "csv-to-json" ? "CSV 入力" : "JSON 入力"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "csv-to-json"
                  ? "name,age,city\n田中,30,東京\n佐藤,25,大阪"
                  : '[{"name":"田中","age":"30"},{"name":"佐藤","age":"25"}]'
              }
              aria-describedby="input-help"
              aria-label={
                mode === "csv-to-json"
                  ? "変換元のCSVテキスト入力欄"
                  : "変換元のJSONテキスト入力欄"
              }
              className="csv-json-textarea"
            />
            <span id="input-help" className="sr-only">
              {mode === "csv-to-json"
                ? "CSVデータを入力して変換ボタンを押してください"
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
                {mode === "csv-to-json" ? "JSON 出力" : "CSV 出力"}
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
                mode === "csv-to-json"
                  ? "JSON変換結果の出力欄"
                  : "CSV変換結果の出力欄"
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
                "変換モードを「CSV → JSON」または「JSON → CSV」から選択します",
                "区切り文字（カンマ・タブ・セミコロン）を選択します",
                "CSV → JSON 変換では、1行目をヘッダーとして扱うかどうかを選択できます",
                "入力欄にデータを貼り付けて「変換」ボタンを押します",
                "出力結果は「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
            {
              title: "対応フォーマット",
              items: [
                "CSV → JSON（ヘッダーあり）: オブジェクトの配列 [{key: value}, ...]",
                "CSV → JSON（ヘッダーなし）: 配列の配列 [[val1, val2], ...]",
                "JSON → CSV: オブジェクトの配列または配列の配列に対応",
                "フィールドにカンマや改行を含む場合はダブルクォートで囲んでください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
