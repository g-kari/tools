import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import "../styles/tools/curl-builder.css";
import { buildCurlCommand, getDefaultConfig, SAMPLE_CONFIGS } from "../utils/curl-builder";
import type {
  CurlBuilderConfig,
  HttpMethod,
  BodyType,
  OutputFormat,
  Header,
} from "../utils/curl-builder";

export const Route = createFileRoute("/curl-builder")({
  head: () => ({
    meta: [
      { title: "curlコマンドビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "HTTPリクエスト設定からcurlコマンドを生成。ヘッダー・ボディ・オプションを設定して即座にコマンドをコピー。",
      },
      { property: "og:title", content: "curlコマンドビルダー | Web ツール集" },
      {
        property: "og:description",
        content:
          "HTTPリクエスト設定からcurlコマンドを生成。ヘッダー・ボディ・オプションを設定して即座にコマンドをコピー。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/curl-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "curlコマンドビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "HTTPリクエスト設定からcurlコマンドを生成。ヘッダー・ボディ・オプションを設定して即座にコマンドをコピー。",
      },
    ],
  }),
  component: CurlBuilderPage,
});

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Text" },
  { value: "form", label: "Form" },
];

/**
 * curlコマンドビルダーのメインコンポーネント
 * HTTPリクエスト設定をGUIで入力し、curlコマンドをリアルタイム生成する
 */
function CurlBuilderPage() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<CurlBuilderConfig>(getDefaultConfig());

  const curlCommand = useMemo(() => buildCurlCommand(config), [config]);

  const updateConfig = useCallback((updates: Partial<CurlBuilderConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleMethodChange = useCallback(
    (method: HttpMethod) => {
      updateConfig({ method });
    },
    [updateConfig],
  );

  const handleUrlChange = useCallback(
    (url: string) => {
      updateConfig({ url });
    },
    [updateConfig],
  );

  const handleAddHeader = useCallback(() => {
    const newHeader: Header = {
      id: crypto.randomUUID(),
      key: "",
      value: "",
      enabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      headers: [...prev.headers, newHeader],
    }));
  }, []);

  const handleRemoveHeader = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.filter((h) => h.id !== id),
    }));
  }, []);

  const handleHeaderChange = useCallback(
    (id: string, field: keyof Header, value: string | boolean) => {
      setConfig((prev) => ({
        ...prev,
        headers: prev.headers.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
      }));
    },
    [],
  );

  const handleBodyTypeChange = useCallback(
    (bodyType: BodyType) => {
      updateConfig({ bodyType });
    },
    [updateConfig],
  );

  const handleBodyChange = useCallback(
    (body: string) => {
      updateConfig({ body });
    },
    [updateConfig],
  );

  const handleOptionChange = useCallback(
    (option: keyof CurlBuilderConfig["options"], value: boolean | string) => {
      setConfig((prev) => ({
        ...prev,
        options: { ...prev.options, [option]: value },
      }));
    },
    [],
  );

  const handleFormatChange = useCallback(
    (outputFormat: OutputFormat) => {
      updateConfig({ outputFormat });
    },
    [updateConfig],
  );

  const handleLoadSample = useCallback(
    (sampleKey: string) => {
      if (sampleKey && SAMPLE_CONFIGS[sampleKey]) {
        setConfig(SAMPLE_CONFIGS[sampleKey]);
        announceStatus(`サンプル「${sampleKey}」を読み込みました`);
        showToast(`サンプル「${sampleKey}」を読み込みました`, "success");
      }
    },
    [announceStatus, showToast],
  );

  const handleClear = useCallback(() => {
    setConfig(getDefaultConfig());
    announceStatus("設定をクリアしました");
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!config.url.trim()) {
      showToast("URLを入力してください", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(curlCommand);
      announceStatus("curlコマンドをクリップボードにコピーしました");
      showToast("curlコマンドをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [curlCommand, config.url, announceStatus, showToast]);

  const getBodyPlaceholder = (bodyType: BodyType): string => {
    switch (bodyType) {
      case "json":
        return '{\n  "key": "value"\n}';
      case "text":
        return "テキストボディを入力してください";
      case "form":
        return "key1=value1&key2=value2";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="tool-container">
        <h1 className="tool-title">curlコマンドビルダー</h1>
        <p className="tool-description">
          HTTPリクエスト設定からcurlコマンドを生成。ヘッダー・ボディ・オプションを設定して即座にコマンドをコピー。
        </p>

        <div className="cb-layout">
          {/* 左パネル: 設定 */}
          <div className="cb-panel">
            <span className="cb-panel-label">リクエスト設定</span>

            {/* メソッド + URL */}
            <div className="cb-method-url-row">
              <select
                className="cb-method-select"
                value={config.method}
                onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
                aria-label="HTTPメソッド選択"
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="cb-url-input"
                value={config.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                aria-label="URL入力"
              />
            </div>

            {/* ヘッダー */}
            <span className="cb-section-title">ヘッダー</span>
            <div className="cb-header-list" role="group" aria-label="HTTPヘッダー一覧">
              {config.headers.map((header) => (
                <div key={header.id} className="cb-header-row">
                  <input
                    type="checkbox"
                    className="cb-header-checkbox"
                    checked={header.enabled}
                    onChange={(e) => handleHeaderChange(header.id, "enabled", e.target.checked)}
                    aria-label={`ヘッダー「${header.key || "無題"}」を有効にする`}
                  />
                  <input
                    type="text"
                    className="cb-header-key"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(header.id, "key", e.target.value)}
                    placeholder="Header-Name"
                    aria-label="ヘッダー名"
                  />
                  <input
                    type="text"
                    className="cb-header-value"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(header.id, "value", e.target.value)}
                    placeholder="value"
                    aria-label="ヘッダー値"
                  />
                  <button
                    type="button"
                    className="cb-header-delete"
                    onClick={() => handleRemoveHeader(header.id)}
                    aria-label={`ヘッダー「${header.key || "無題"}」を削除`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="cb-add-header-btn"
              onClick={handleAddHeader}
              aria-label="ヘッダーを追加"
            >
              + ヘッダーを追加
            </button>

            {/* ボディタイプ */}
            <span className="cb-section-title">ボディ</span>
            <div className="cb-body-type-group" role="group" aria-label="ボディタイプ選択">
              {BODY_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  type="button"
                  className={`cb-body-type-btn${config.bodyType === bt.value ? " cb-body-type-btn--active" : ""}`}
                  onClick={() => handleBodyTypeChange(bt.value)}
                  aria-pressed={config.bodyType === bt.value}
                  aria-label={`ボディタイプを${bt.label}に設定`}
                >
                  {bt.label}
                </button>
              ))}
            </div>

            {config.bodyType !== "none" && (
              <textarea
                className="cb-body-textarea"
                value={config.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder={getBodyPlaceholder(config.bodyType)}
                aria-label="リクエストボディ"
                spellCheck={false}
              />
            )}

            {/* オプション */}
            <span className="cb-section-title">オプション</span>
            <div className="cb-options-group" role="group" aria-label="curlオプション">
              <label className="cb-option-label">
                <input
                  type="checkbox"
                  checked={config.options.verbose}
                  onChange={(e) => handleOptionChange("verbose", e.target.checked)}
                />
                -v 詳細出力（verbose）
              </label>
              <label className="cb-option-label">
                <input
                  type="checkbox"
                  checked={config.options.silent}
                  onChange={(e) => handleOptionChange("silent", e.target.checked)}
                />
                -s サイレントモード（silent）
              </label>
              <label className="cb-option-label">
                <input
                  type="checkbox"
                  checked={config.options.compressed}
                  onChange={(e) => handleOptionChange("compressed", e.target.checked)}
                />
                --compressed 圧縮レスポンスを受け入れる
              </label>
              <label className="cb-option-label">
                <input
                  type="checkbox"
                  checked={config.options.followRedirects}
                  onChange={(e) => handleOptionChange("followRedirects", e.target.checked)}
                />
                -L リダイレクトを追従
              </label>
              <label className="cb-option-label">
                <input
                  type="checkbox"
                  checked={config.options.insecure}
                  onChange={(e) => handleOptionChange("insecure", e.target.checked)}
                />
                -k SSL証明書の検証をスキップ
              </label>
              <div className="cb-output-file-row">
                <label className="cb-option-label" htmlFor="cb-output-file">
                  -o 出力ファイル:
                </label>
                <input
                  id="cb-output-file"
                  type="text"
                  className="cb-output-file-input"
                  value={config.options.outputFile}
                  onChange={(e) => handleOptionChange("outputFile", e.target.value)}
                  placeholder="output.json"
                  aria-label="出力ファイルパス"
                />
              </div>
            </div>

            {/* 出力フォーマット */}
            <div className="cb-format-group" role="group" aria-label="出力フォーマット">
              <span className="cb-format-label">フォーマット:</span>
              <label className="cb-format-option">
                <input
                  type="radio"
                  name="outputFormat"
                  value="multiline"
                  checked={config.outputFormat === "multiline"}
                  onChange={() => handleFormatChange("multiline")}
                />
                複数行
              </label>
              <label className="cb-format-option">
                <input
                  type="radio"
                  name="outputFormat"
                  value="single"
                  checked={config.outputFormat === "single"}
                  onChange={() => handleFormatChange("single")}
                />
                1行
              </label>
            </div>

            {/* アクション */}
            <div className="cb-actions">
              <select
                className="cb-sample-select"
                onChange={(e) => handleLoadSample(e.target.value)}
                value=""
                aria-label="サンプルを選択して読み込む"
              >
                <option value="" disabled>
                  サンプルを選択...
                </option>
                {Object.keys(SAMPLE_CONFIGS).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="cb-btn"
                onClick={handleClear}
                aria-label="設定をクリアする"
              >
                クリア
              </button>
            </div>
          </div>

          {/* 右パネル: コマンド出力 */}
          <div className="cb-panel">
            <span className="cb-panel-label">生成されたcurlコマンド</span>

            <pre
              className="cb-output-area"
              role="region"
              aria-label="生成されたcurlコマンド"
              aria-live="polite"
            >
              {config.url.trim() ? (
                curlCommand
              ) : (
                <span className="cb-output-empty">URLを入力するとcurlコマンドが生成されます</span>
              )}
            </pre>

            <div className="cb-actions">
              <button
                type="button"
                className="cb-btn cb-btn--primary"
                onClick={handleCopy}
                disabled={!config.url.trim()}
                aria-label="curlコマンドをクリップボードにコピーする"
              >
                コピー
              </button>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左パネルでHTTPメソッドとURLを設定します",
                "必要に応じてヘッダー・ボディ・オプションを追加します",
                "右パネルにcurlコマンドがリアルタイムで生成されます",
                "「コピー」ボタンでコマンドをクリップボードにコピーできます",
                "「サンプルを選択」からよく使うリクエストのサンプルを読み込めます",
              ],
            },
            {
              title: "オプション説明",
              items: [
                "-v: レスポンスヘッダーや接続情報など詳細なデバッグ情報を表示",
                "-s: プログレスバーやエラーメッセージを非表示（スクリプト用）",
                "--compressed: gzip/deflate圧縮レスポンスを自動的にデコード",
                "-L: 301/302リダイレクトに自動的に追従",
                "-k: 自己署名証明書など無効なSSL証明書を無視（開発環境用）",
                "-o: レスポンスをファイルに保存",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
