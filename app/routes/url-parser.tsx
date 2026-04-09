import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import {
  parseUrl,
  buildUrl,
  getSampleUrl,
  type ParsedUrl,
  type QueryParam,
} from "../utils/url-parser";
import "../styles/tools/url-parser.css";

export const Route = createFileRoute("/url-parser")({
  head: () => ({
    meta: [
      { title: "URLパーサー/ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析し、各パーツからURLを組み立てるオンラインツール。",
      },
      { property: "og:title", content: "URLパーサー/ビルダー | Web ツール集" },
      {
        property: "og:description",
        content:
          "URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析し、各パーツからURLを組み立てる。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/url-parser` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "URLパーサー/ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析し、各パーツからURLを組み立てる。",
      },
    ],
  }),
  component: UrlParserBuilder,
});

type ToolMode = "parser" | "builder";

/** クイック例URL一覧 */
const EXAMPLE_URLS = [
  "https://example.com/path?key=value&lang=ja#section",
  "https://user:pass@sub.example.com:8080/api/v1/users?page=1&limit=10",
  "https://ja.wikipedia.org/wiki/URL?useskin=vector#概要",
  "ftp://files.example.com/public/file.txt",
];

/**
 * URLパーサー/ビルダーのメインコンポーネント
 * URLを各コンポーネントに分解・解析し、各パーツからURLを組み立てる
 */
function UrlParserBuilder() {
  const [toolMode, setToolMode] = useState<ToolMode>("parser");

  // パーサー状態
  const [inputUrl, setInputUrl] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedUrl | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ビルダー状態
  const [buildProtocol, setBuildProtocol] = useState("https");
  const [buildUsername, setBuildUsername] = useState("");
  const [buildPassword, setBuildPassword] = useState("");
  const [buildHostname, setBuildHostname] = useState("");
  const [buildPort, setBuildPort] = useState("");
  const [buildPathname, setBuildPathname] = useState("/");
  const [buildHash, setBuildHash] = useState("");
  const [queryParams, setQueryParams] = useState<QueryParam[]>([{ key: "", value: "" }]);
  const [builtUrl, setBuiltUrl] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleParse = useCallback(() => {
    if (!inputUrl.trim()) {
      setError("URLを入力してください");
      setParsedResult(null);
      return;
    }
    const result = parseUrl(inputUrl.trim());
    if (!result.isValid) {
      setError("無効なURLです。有効なURL（例: https://example.com）を入力してください");
      setParsedResult(null);
      announceStatus("パースに失敗しました");
      return;
    }
    setError(null);
    setParsedResult(result);
    announceStatus("URLを正常にパースしました");
  }, [inputUrl, announceStatus]);

  const handleClear = useCallback(() => {
    setInputUrl("");
    setParsedResult(null);
    setError(null);
    inputRef.current?.focus();
    announceStatus("クリアしました");
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    const sample = getSampleUrl();
    setInputUrl(sample);
    setParsedResult(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleChipClick = useCallback((url: string) => {
    setInputUrl(url);
    setParsedResult(null);
    setError(null);
  }, []);

  const handleCopyParsed = useCallback(() => {
    if (!parsedResult) return;
    navigator.clipboard
      .writeText(parsedResult.href)
      .then(() => {
        showToast("URLをコピーしました", "success");
        announceStatus("URLをコピーしました");
      })
      .catch(() => {
        showToast("コピーに失敗しました", "error");
      });
  }, [parsedResult, showToast, announceStatus]);

  useKeyboardShortcut("Enter", handleParse, { ctrl: true });

  // ビルダー
  const handleBuild = useCallback(() => {
    const result = buildUrl({
      protocol: buildProtocol,
      username: buildUsername || undefined,
      password: buildPassword || undefined,
      hostname: buildHostname,
      port: buildPort || undefined,
      pathname: buildPathname || "/",
      queryParams,
      hash: buildHash || undefined,
    });
    setBuiltUrl(result);
    if (result) {
      announceStatus("URLを生成しました");
    } else {
      announceStatus("ホスト名を入力してください");
    }
  }, [
    buildProtocol,
    buildUsername,
    buildPassword,
    buildHostname,
    buildPort,
    buildPathname,
    queryParams,
    buildHash,
    announceStatus,
  ]);

  const handleCopyBuilt = useCallback(() => {
    if (!builtUrl) return;
    navigator.clipboard
      .writeText(builtUrl)
      .then(() => {
        showToast("URLをコピーしました", "success");
        announceStatus("URLをコピーしました");
      })
      .catch(() => {
        showToast("コピーに失敗しました", "error");
      });
  }, [builtUrl, showToast, announceStatus]);

  const handleBuilderClear = useCallback(() => {
    setBuildProtocol("https");
    setBuildUsername("");
    setBuildPassword("");
    setBuildHostname("");
    setBuildPort("");
    setBuildPathname("/");
    setBuildHash("");
    setQueryParams([{ key: "", value: "" }]);
    setBuiltUrl("");
    announceStatus("クリアしました");
  }, [announceStatus]);

  const addQueryParam = useCallback(() => {
    setQueryParams((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const removeQueryParam = useCallback((index: number) => {
    setQueryParams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQueryParam = useCallback((index: number, field: "key" | "value", value: string) => {
    setQueryParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }, []);

  const componentItems = parsedResult
    ? [
        { label: "プロトコル (protocol)", value: parsedResult.protocol },
        { label: "ホスト名 (hostname)", value: parsedResult.hostname },
        { label: "ポート (port)", value: parsedResult.port },
        { label: "パス (pathname)", value: parsedResult.pathname },
        { label: "クエリ文字列 (search)", value: parsedResult.search },
        { label: "フラグメント (hash)", value: parsedResult.hash },
        { label: "ユーザー名 (username)", value: parsedResult.username },
        {
          label: "パスワード (password)",
          value: parsedResult.password ? "***" : "",
        },
        { label: "ホスト (host)", value: parsedResult.host },
      ]
    : [];

  return (
    <>
      <div className="tool-container url-parser-container">
        <h1 className="tool-title">URLパーサー/ビルダー</h1>
        <p className="tool-description">
          URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析します。
          また、各パーツからURLを組み立てることもできます。
        </p>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "パーサーモードでURLを入力して「パース」ボタン（Ctrl+Enter）でURLを分解",
                "ビルダーモードで各コンポーネントを入力してURLを組み立てられます",
                "クイック例のボタンでサンプルURLを試せます",
                "クエリパラメータは一覧で確認・コピーができます",
              ],
            },
          ]}
        />

        <div className="url-parser-mode-tabs" role="tablist" aria-label="ツールモード選択">
          <button
            role="tab"
            aria-selected={toolMode === "parser"}
            className={`url-parser-mode-tab${toolMode === "parser" ? " url-parser-mode-tab--active" : ""}`}
            onClick={() => setToolMode("parser")}
            aria-label="パーサーモード"
          >
            パーサー
          </button>
          <button
            role="tab"
            aria-selected={toolMode === "builder"}
            className={`url-parser-mode-tab${toolMode === "builder" ? " url-parser-mode-tab--active" : ""}`}
            onClick={() => setToolMode("builder")}
            aria-label="ビルダーモード"
          >
            ビルダー
          </button>
        </div>

        {toolMode === "parser" && (
          <section aria-label="URLパーサー">
            <div className="url-parser-input-area">
              <input
                ref={inputRef}
                type="text"
                className="url-parser-input"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/path?key=value#section"
                aria-label="パースするURL"
                autoFocus
              />
              <div className="url-parser-actions">
                <button
                  type="button"
                  className="url-parser-btn url-parser-btn--primary"
                  onClick={handleParse}
                  aria-label="URLをパース (Ctrl+Enter)"
                >
                  パース
                </button>
                <button
                  type="button"
                  className="url-parser-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプルURLを読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="url-parser-btn"
                  onClick={handleClear}
                  aria-label="入力と結果をクリア"
                >
                  クリア
                </button>
              </div>
            </div>

            <div className="url-parser-chips" role="group" aria-label="クイック例">
              {EXAMPLE_URLS.map((url) => (
                <button
                  key={url}
                  type="button"
                  className="url-parser-chip"
                  onClick={() => handleChipClick(url)}
                  aria-label={`例: ${url}`}
                  title={url}
                >
                  {url}
                </button>
              ))}
            </div>

            <ErrorMessage message={error} />

            {parsedResult && (
              <div aria-live="polite" aria-label="パース結果">
                <div className="url-parser-result-grid">
                  {componentItems.map(({ label, value }) => (
                    <div key={label} className="url-parser-component-card">
                      <div className="url-parser-component-label">{label}</div>
                      <div
                        className={`url-parser-component-value${!value ? " url-parser-component-value--empty" : ""}`}
                      >
                        {value || "(なし)"}
                      </div>
                    </div>
                  ))}
                </div>

                {parsedResult.queryParams.length > 0 && (
                  <div className="url-parser-query-section">
                    <div className="url-parser-query-title">
                      クエリパラメータ ({parsedResult.queryParams.length}件)
                    </div>
                    <table className="url-parser-query-table" aria-label="クエリパラメータ一覧">
                      <thead>
                        <tr>
                          <th scope="col">キー</th>
                          <th scope="col">値</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedResult.queryParams.map((param, index) => (
                          <tr key={index}>
                            <td className="url-parser-query-key">{param.key}</td>
                            <td>{param.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="url-parser-copy-row">
                  <button
                    type="button"
                    className="url-parser-btn url-parser-btn--sm"
                    onClick={handleCopyParsed}
                    aria-label="URLをコピー"
                  >
                    URLをコピー
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {toolMode === "builder" && (
          <section aria-label="URLビルダー">
            <div className="url-parser-builder">
              <div className="url-parser-builder-grid">
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-protocol">
                    プロトコル
                  </label>
                  <input
                    id="build-protocol"
                    type="text"
                    className="url-parser-input"
                    value={buildProtocol}
                    onChange={(e) => setBuildProtocol(e.target.value)}
                    placeholder="https"
                    aria-label="プロトコル"
                  />
                </div>
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-hostname">
                    ホスト名 *
                  </label>
                  <input
                    id="build-hostname"
                    type="text"
                    className="url-parser-input"
                    value={buildHostname}
                    onChange={(e) => setBuildHostname(e.target.value)}
                    placeholder="example.com"
                    aria-label="ホスト名（必須）"
                  />
                </div>
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-port">
                    ポート
                  </label>
                  <input
                    id="build-port"
                    type="text"
                    className="url-parser-input"
                    value={buildPort}
                    onChange={(e) => setBuildPort(e.target.value)}
                    placeholder="8080"
                    aria-label="ポート番号"
                  />
                </div>
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-pathname">
                    パス
                  </label>
                  <input
                    id="build-pathname"
                    type="text"
                    className="url-parser-input"
                    value={buildPathname}
                    onChange={(e) => setBuildPathname(e.target.value)}
                    placeholder="/api/v1/resource"
                    aria-label="パス"
                  />
                </div>
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-username">
                    ユーザー名
                  </label>
                  <input
                    id="build-username"
                    type="text"
                    className="url-parser-input"
                    value={buildUsername}
                    onChange={(e) => setBuildUsername(e.target.value)}
                    placeholder="user"
                    aria-label="ユーザー名"
                  />
                </div>
                <div className="url-parser-field">
                  <label className="url-parser-label" htmlFor="build-password">
                    パスワード
                  </label>
                  <input
                    id="build-password"
                    type="password"
                    className="url-parser-input"
                    value={buildPassword}
                    onChange={(e) => setBuildPassword(e.target.value)}
                    placeholder="password"
                    aria-label="パスワード"
                  />
                </div>
                <div className="url-parser-field url-parser-field--full">
                  <label className="url-parser-label" htmlFor="build-hash">
                    フラグメント（# なしで入力）
                  </label>
                  <input
                    id="build-hash"
                    type="text"
                    className="url-parser-input"
                    value={buildHash}
                    onChange={(e) => setBuildHash(e.target.value)}
                    placeholder="section-1"
                    aria-label="フラグメント"
                  />
                </div>
              </div>

              <div className="url-parser-params-section">
                <div className="url-parser-params-header">
                  <div className="url-parser-query-title">クエリパラメータ</div>
                  <button
                    type="button"
                    className="url-parser-btn url-parser-btn--sm"
                    onClick={addQueryParam}
                    aria-label="クエリパラメータを追加"
                  >
                    + 追加
                  </button>
                </div>
                {queryParams.map((param, index) => (
                  <div key={index} className="url-parser-param-row">
                    <input
                      type="text"
                      className="url-parser-param-input"
                      value={param.key}
                      onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                      placeholder="キー"
                      aria-label={`クエリパラメータ ${index + 1} のキー`}
                    />
                    <input
                      type="text"
                      className="url-parser-param-input"
                      value={param.value}
                      onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                      placeholder="値"
                      aria-label={`クエリパラメータ ${index + 1} の値`}
                    />
                    <button
                      type="button"
                      className="url-parser-btn url-parser-btn--sm url-parser-btn--danger"
                      onClick={() => removeQueryParam(index)}
                      aria-label={`クエリパラメータ ${index + 1} を削除`}
                      disabled={queryParams.length === 1}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>

              <div className="url-parser-actions">
                <button
                  type="button"
                  className="url-parser-btn url-parser-btn--primary"
                  onClick={handleBuild}
                  aria-label="URLを生成"
                >
                  URLを生成
                </button>
                <button
                  type="button"
                  className="url-parser-btn"
                  onClick={handleBuilderClear}
                  aria-label="ビルダーをクリア"
                >
                  クリア
                </button>
              </div>

              <div className="url-parser-result-url">
                <div className="url-parser-result-url-label">生成されたURL</div>
                <div
                  className={`url-parser-result-url-value${!builtUrl ? " url-parser-result-url-value--placeholder" : ""}`}
                  aria-live="polite"
                  aria-label="生成されたURL"
                >
                  {builtUrl || "URLを生成してください"}
                </div>
                <div className="url-parser-copy-row">
                  <button
                    type="button"
                    className="url-parser-btn url-parser-btn--sm"
                    onClick={handleCopyBuilt}
                    disabled={!builtUrl}
                    aria-label="生成されたURLをコピー"
                  >
                    コピー
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
