import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  validateJsonAgainstSchema,
  getSampleJsonData,
  getSampleSchema,
  type ValidationResult,
} from "../utils/json-schema-validator";

export const Route = createFileRoute("/json-schema-validator")({
  head: () => ({
    meta: [
      { title: "JSON Schema バリデーター | Web ツール集" },
      {
        name: "description",
        content:
          "JSONデータをJSON Schema (draft-07) に対してバリデーションするツール。type・required・pattern・enum・allOf/anyOf/oneOf など主要なキーワードに対応。エラー箇所をパスで表示。",
      },
      {
        property: "og:title",
        content: "JSON Schema バリデーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "JSONデータをJSON Schema (draft-07) に対してバリデーションするツール。type・required・pattern・enum・allOf/anyOf/oneOf など主要なキーワードに対応。",
      },
      {
        property: "og:url",
        content: `${SITE_BASE_URL}/json-schema-validator`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "JSON Schema バリデーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "JSONデータをJSON Schema (draft-07) に対してバリデーションするツール。",
      },
    ],
  }),
  component: JsonSchemaValidator,
});

/**
 * JSON Schema バリデーターのメインコンポーネント
 * JSON データを JSON Schema (draft-07) に対して検証する
 */
function JsonSchemaValidator() {
  const { showToast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [schemaText, setSchemaText] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleValidate = useCallback(() => {
    setParseError(null);
    setResult(null);

    const validationResult = validateJsonAgainstSchema(jsonText, schemaText);

    // 入力不足・パースエラーは parseError として表示
    if (
      validationResult.errors.length > 0 &&
      (validationResult.errors[0].keyword === "input" ||
        validationResult.errors[0].keyword === "parse")
    ) {
      setParseError(validationResult.errors[0].message);
      announceStatus("エラー: " + validationResult.errors[0].message);
      return;
    }

    setResult(validationResult);

    if (validationResult.valid) {
      announceStatus("バリデーション成功: JSONはスキーマに準拠しています");
      showToast("バリデーション成功", "success");
    } else {
      announceStatus(
        `バリデーション失敗: ${validationResult.errors.length} 件のエラーがあります`
      );
      showToast(
        `${validationResult.errors.length} 件のエラーが見つかりました`,
        "error"
      );
    }
  }, [jsonText, schemaText, announceStatus, showToast]);

  const handleLoadSample = useCallback(() => {
    setJsonText(getSampleJsonData());
    setSchemaText(getSampleSchema());
    setResult(null);
    setParseError(null);
    announceStatus("サンプルデータを読み込みました");
    showToast("サンプルデータを読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setJsonText("");
    setSchemaText("");
    setResult(null);
    setParseError(null);
    announceStatus("入力と結果をクリアしました");
    jsonRef.current?.focus();
  }, [announceStatus]);

  const handleFormatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      announceStatus("JSONデータを整形しました");
      showToast("JSONデータを整形しました", "success");
    } catch {
      showToast("JSONデータの形式が正しくありません", "error");
    }
  }, [jsonText, announceStatus, showToast]);

  const handleFormatSchema = useCallback(() => {
    try {
      const parsed = JSON.parse(schemaText);
      setSchemaText(JSON.stringify(parsed, null, 2));
      announceStatus("JSON Schemaを整形しました");
      showToast("JSON Schemaを整形しました", "success");
    } catch {
      showToast("JSON Schemaの形式が正しくありません", "error");
    }
  }, [schemaText, announceStatus, showToast]);

  // Ctrl+Enter でバリデーション実行
  useKeyboardShortcut("Enter", handleValidate, { ctrl: true });

  useEffect(() => {
    jsonRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JSON Schema バリデーションフォーム"
        >
          {/* 入力パネル（2カラム） */}
          <div className="jsv-layout">
            {/* 左パネル: JSON データ */}
            <div className="jsv-panel">
              <span className="jsv-panel-label">JSON データ</span>
              <textarea
                ref={jsonRef}
                id="jsonData"
                className="jsv-textarea"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'検証したいJSONデータを入力...\n例: {"name": "Alice", "age": 30}'}
                aria-label="JSON データ入力欄"
                aria-describedby="jsv-json-help"
                spellCheck={false}
              />
              <span id="jsv-json-help" className="sr-only">
                バリデーション対象のJSONデータを入力してください
              </span>
              <div className="jsv-actions">
                <button
                  type="button"
                  className="jsv-btn"
                  onClick={handleFormatJson}
                  aria-label="JSONデータを整形する"
                >
                  整形
                </button>
              </div>
            </div>

            {/* 右パネル: JSON Schema */}
            <div className="jsv-panel">
              <span className="jsv-panel-label">JSON Schema</span>
              <textarea
                id="jsonSchema"
                className="jsv-textarea"
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                placeholder={'JSON Schemaを入力...\n例: {"type": "object", "required": ["name"]}'}
                aria-label="JSON Schema 入力欄"
                aria-describedby="jsv-schema-help"
                spellCheck={false}
              />
              <span id="jsv-schema-help" className="sr-only">
                バリデーション基準となるJSON Schemaを入力してください
              </span>
              <div className="jsv-actions">
                <button
                  type="button"
                  className="jsv-btn"
                  onClick={handleFormatSchema}
                  aria-label="JSON Schemaを整形する"
                >
                  整形
                </button>
              </div>
            </div>
          </div>

          {/* 操作ボタン行 */}
          <div className="jsv-validate-row">
            <div className="jsv-actions">
              <button
                type="button"
                className="jsv-btn"
                onClick={handleLoadSample}
                aria-label="サンプルデータを読み込む"
              >
                サンプル読込
              </button>
              <button
                type="button"
                className="jsv-btn"
                onClick={handleClear}
                aria-label="入力と結果をクリアする"
              >
                クリア
              </button>
              <button
                type="button"
                className="jsv-btn jsv-btn--primary"
                onClick={handleValidate}
                aria-label="バリデーションを実行する（Ctrl+Enter）"
              >
                バリデーション実行
              </button>
            </div>
          </div>

          <ErrorMessage message={parseError} />

          {/* バリデーション結果 */}
          {result && (
            <div
              className="jsv-result-section"
              role="region"
              aria-label="バリデーション結果"
              aria-live="polite"
            >
              <div className="jsv-result-label">バリデーション結果</div>

              {/* 結果バナー */}
              <div
                className={`jsv-result-banner ${result.valid ? "jsv-result-banner--valid" : "jsv-result-banner--invalid"}`}
                role="status"
              >
                <span className="jsv-result-banner-icon" aria-hidden="true">
                  {result.valid ? "✅" : "❌"}
                </span>
                <span className="jsv-result-banner-text">
                  {result.valid
                    ? "バリデーション成功 — JSONはスキーマに準拠しています"
                    : "バリデーション失敗 — スキーマ違反が検出されました"}
                </span>
                {!result.valid && (
                  <span className="jsv-result-banner-count">
                    {result.errors.length} 件のエラー
                  </span>
                )}
              </div>

              {/* エラー一覧 */}
              {!result.valid && result.errors.length > 0 && (
                <ul
                  className="jsv-error-list"
                  aria-label="バリデーションエラー一覧"
                >
                  {result.errors.map((error, index) => (
                    <li key={index} className="jsv-error-item">
                      <div className="jsv-error-header">
                        <span
                          className={
                            error.path
                              ? "jsv-error-path"
                              : "jsv-error-path-root"
                          }
                          aria-label={`パス: ${error.path || "(root)"}`}
                        >
                          {error.path || "(root)"}
                        </span>
                        <span
                          className="jsv-error-keyword"
                          aria-label={`キーワード: ${error.keyword}`}
                        >
                          {error.keyword}
                        </span>
                      </div>
                      <span className="jsv-error-message">{error.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!result && !parseError && (
            <div className="jsv-result-empty">
              JSONデータとJSON Schemaを入力して「バリデーション実行」ボタンを押してください（Ctrl+Enter）
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左側にバリデーション対象のJSONデータを入力します",
                "右側にJSON Schema (draft-07) を入力します",
                "「サンプル読込」ボタンでサンプルデータを読み込めます",
                "「バリデーション実行」またはCtrl+Enterで検証を開始します",
                "「整形」ボタンで入力JSONを整形できます",
              ],
            },
            {
              title: "対応キーワード",
              items: [
                "基本: type, enum, const",
                "オブジェクト: properties, required, additionalProperties, patternProperties, minProperties, maxProperties",
                "配列: items, additionalItems, minItems, maxItems, uniqueItems, contains",
                "文字列: minLength, maxLength, pattern",
                "数値: minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf",
                "結合: allOf, anyOf, oneOf, not",
              ],
            },
            {
              title: "JSON Schema について",
              items: [
                "JSON Schema draft-07 の主要なキーワードをサポートしています",
                "$ref（外部参照）はサポートしていません",
                "ブラウザ内で計算されるため、データがサーバーに送信されることはありません",
                "JSON Schema ジェネレーター（/json-schema）でスキーマを自動生成できます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
