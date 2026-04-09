import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  parseJsonLines,
  formatJsonLines,
  minifyJsonLines,
  jsonLinesToJsonArray,
  jsonArrayToJsonLines,
} from "../utils/json-lines";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/json-lines")({
  head: () => ({
    meta: [
      { title: "JSON Lines フォーマッター | Web ツール集" },
      {
        name: "description",
        content:
          "JSON Lines（NDJSON）の解析・整形・バリデーション。JSON配列との相互変換も可能。ログファイルやストリーミングAPIのデバッグに便利。",
      },
      {
        property: "og:title",
        content: "JSON Lines フォーマッター | Web ツール集",
      },
      {
        property: "og:description",
        content: "JSON Lines（NDJSON）の解析・整形・バリデーション。JSON配列との相互変換も可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/json-lines` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON Lines フォーマッター | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "JSON Lines（NDJSON）の解析・整形・バリデーション。JSON配列との相互変換も可能。",
      },
    ],
  }),
  component: JsonLinesPage,
});

const SAMPLE_JSONL = `{"id":1,"name":"田中太郎","age":30,"city":"東京"}
{"id":2,"name":"鈴木花子","age":25,"city":"大阪"}
{"id":3,"name":"佐藤一郎","age":35,"city":"名古屋"}`;

const SAMPLE_JSON_ARRAY = `[
  {"id":1,"name":"田中太郎","age":30,"city":"東京"},
  {"id":2,"name":"鈴木花子","age":25,"city":"大阪"},
  {"id":3,"name":"佐藤一郎","age":35,"city":"名古屋"}
]`;

/** 処理モード */
type Mode = "validate" | "to-array" | "from-array";

function JsonLinesPage() {
  const [mode, setMode] = useState<Mode>("validate");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** バリデーションモードのリアルタイム解析 */
  const parseResult = useMemo(() => {
    if (mode !== "validate" || !inputText.trim()) return null;
    return parseJsonLines(inputText);
  }, [mode, inputText]);

  const handleConvert = useCallback(() => {
    if (!inputText.trim()) {
      const msg =
        mode === "from-array" ? "JSON配列を入力してください" : "JSON Linesを入力してください";
      setError(msg);
      announceStatus("エラー: " + msg);
      showToast(msg, "error");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    try {
      let result: string;
      if (mode === "to-array") {
        result = jsonLinesToJsonArray(inputText);
        announceStatus("JSON配列への変換が完了しました");
        showToast("JSON配列に変換しました", "success");
      } else {
        result = jsonArrayToJsonLines(inputText);
        announceStatus("JSON Linesへの変換が完了しました");
        showToast("JSON Linesに変換しました", "success");
      }
      setOutputText(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "変換に失敗しました";
      setError(message);
      setOutputText("");
      announceStatus("エラー: " + message);
      showToast(message, "error");
    }
  }, [inputText, mode, announceStatus, showToast]);

  const handleFormat = useCallback(() => {
    if (!inputText.trim()) return;
    const formatted = formatJsonLines(inputText);
    setInputText(formatted);
    showToast("整形しました", "success");
    announceStatus("JSON Linesを整形しました");
  }, [inputText, showToast, announceStatus]);

  const handleMinify = useCallback(() => {
    if (!inputText.trim()) return;
    const minified = minifyJsonLines(inputText);
    setInputText(minified);
    showToast("圧縮しました", "success");
    announceStatus("JSON Linesを圧縮しました");
  }, [inputText, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setError(null);
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    const sample = mode === "from-array" ? SAMPLE_JSON_ARRAY : SAMPLE_JSONL;
    setInputText(sample);
    setOutputText("");
    setError(null);
    announceStatus("サンプルデータを読み込みました");
  }, [mode, announceStatus]);

  const handleCopyOutput = useCallback(async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      showToast("クリップボードにコピーしました", "success");
      announceStatus("出力をクリップボードにコピーしました");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [outputText, showToast, announceStatus]);

  useKeyboardShortcut("Enter", handleConvert, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isConvertMode = mode !== "validate";

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">JSON Lines（NDJSON）フォーマッター</h2>

        {/* モード切り替え */}
        <div className="button-group" role="group" aria-label="モード選択">
          <Button
            type="button"
            className={mode === "validate" ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setMode("validate");
              setInputText("");
              setOutputText("");
              setError(null);
            }}
            aria-pressed={mode === "validate"}
          >
            検証・整形
          </Button>
          <Button
            type="button"
            className={mode === "to-array" ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setMode("to-array");
              setInputText("");
              setOutputText("");
              setError(null);
            }}
            aria-pressed={mode === "to-array"}
          >
            JSONL → JSON配列
          </Button>
          <Button
            type="button"
            className={mode === "from-array" ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setMode("from-array");
              setInputText("");
              setOutputText("");
              setError(null);
            }}
            aria-pressed={mode === "from-array"}
          >
            JSON配列 → JSONL
          </Button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} aria-label="JSON Lines フォーム">
          {/* 入力エリア */}
          <div className="converter-section">
            <label htmlFor="inputText" className="section-title">
              {mode === "from-array" ? "JSON配列 入力" : "JSON Lines 入力"}
            </label>
            <Textarea
              id="inputText"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === "from-array"
                  ? '[{"id":1,"name":"田中"},...] の形式で入力してください'
                  : '{"id":1,"name":"田中"}\n{"id":2,"name":"花子"}\n（各行に1つのJSONオブジェクト）'
              }
              aria-label={mode === "from-array" ? "JSON配列入力欄" : "JSON Lines入力欄"}
            />
          </div>

          {/* バリデーション統計（検証モード） */}
          {mode === "validate" && parseResult && (
            <div className="jsonl-stats" aria-live="polite" aria-label="バリデーション統計">
              <div className="jsonl-stat-item">
                <span className="jsonl-stat-label">有効な行</span>
                <span className="jsonl-stat-value jsonl-stat-valid">{parseResult.validCount}</span>
              </div>
              <div className="jsonl-stat-item">
                <span className="jsonl-stat-label">エラー行</span>
                <span
                  className={`jsonl-stat-value ${parseResult.errorCount > 0 ? "jsonl-stat-error" : ""}`}
                >
                  {parseResult.errorCount}
                </span>
              </div>
              <div className="jsonl-stat-item">
                <span className="jsonl-stat-label">空行（スキップ）</span>
                <span className="jsonl-stat-value">{parseResult.emptyCount}</span>
              </div>
            </div>
          )}

          {/* エラー行の詳細（検証モード） */}
          {mode === "validate" && parseResult && parseResult.errorCount > 0 && (
            <div className="jsonl-error-list" role="alert">
              <p className="jsonl-error-title">
                エラーが検出されました（{parseResult.errorCount}行）:
              </p>
              <ul className="jsonl-error-items">
                {parseResult.lines
                  .filter((l) => !l.isValid)
                  .map((l) => (
                    <li key={l.lineNumber} className="jsonl-error-item">
                      <span className="jsonl-error-line">行 {l.lineNumber}:</span>{" "}
                      <span className="jsonl-error-msg">{l.error}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="操作">
            {mode === "validate" && (
              <>
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleFormat}
                  disabled={!inputText.trim()}
                  aria-label="各行のJSONを整形"
                >
                  整形
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={handleMinify}
                  disabled={!inputText.trim()}
                  aria-label="各行のJSONを圧縮"
                >
                  圧縮
                </Button>
              </>
            )}
            {isConvertMode && (
              <Button
                type="button"
                className="btn-primary"
                onClick={handleConvert}
                aria-label={mode === "to-array" ? "JSON配列に変換" : "JSON Linesに変換"}
              >
                {mode === "to-array" ? "JSON配列に変換" : "JSON Linesに変換"}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleLoadSample}
              aria-label="サンプルデータを読み込む"
            >
              サンプル
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

          <ErrorMessage message={error} />

          {/* 出力エリア（変換モード） */}
          {isConvertMode && (
            <div className="output-section">
              <div className="output-header">
                <label htmlFor="outputText" className="section-title">
                  {mode === "to-array" ? "JSON配列 出力" : "JSON Lines 出力"}
                </label>
                {outputText && (
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-copy-small"
                    onClick={handleCopyOutput}
                    aria-label="出力をクリップボードにコピー"
                  >
                    コピー
                  </Button>
                )}
              </div>
              <Textarea
                id="outputText"
                value={outputText}
                readOnly
                placeholder="変換結果がここに表示されます..."
                aria-label="変換結果の出力欄"
                aria-live="polite"
              />
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "JSON Lines（NDJSON）とは",
              items: [
                "各行が独立したJSONオブジェクトであるテキストフォーマット",
                "ログファイル・ストリーミングAPI・大量データの処理に使用される",
                "拡張子は .jsonl または .ndjson が一般的",
                "行ごとに読み書きできるため大容量データに適している",
              ],
            },
            {
              title: "使い方",
              items: [
                "「検証・整形」: 各行のJSONをリアルタイムでバリデーション・整形・圧縮",
                "「JSONL → JSON配列」: 複数行JSONをひとつのJSON配列に変換",
                "「JSON配列 → JSONL」: JSON配列を1行ずつのJSONLに展開",
                "キーボードショートカット: Ctrl+Enter で変換実行",
              ],
            },
            {
              title: "活用例",
              items: [
                "アプリケーションログの解析と整形",
                "ストリーミングAPIレスポンスのデバッグ",
                "Elasticsearch / OpenSearch のバルクAPIデータ確認",
                "MongoDB / DynamoDB のエクスポートデータの変換",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
