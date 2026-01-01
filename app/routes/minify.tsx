import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import {
  minifyJavaScript,
  minifyCSS,
  minifyHTML,
  minifyJSON,
} from "../utils/minify";

export const Route = createFileRoute("/minify")({
  head: () => ({
    meta: [{ title: "コード圧縮ツール (Minify)" }],
    scripts: [
      // Terser - JavaScript minifier
      {
        src: "https://cdn.jsdelivr.net/npm/terser@5/dist/bundle.min.js",
        type: "text/javascript",
      },
      // CSSO - CSS minifier
      {
        src: "https://cdn.jsdelivr.net/npm/csso@5/dist/csso.min.js",
        type: "text/javascript",
      },
      // html-minifier-terser - HTML minifier
      {
        src: "https://cdn.jsdelivr.net/npm/html-minifier-terser@7/dist/htmlminifier.min.js",
        type: "text/javascript",
      },
    ],
  }),
  component: MinifyTool,
});

type CodeType = "javascript" | "css" | "html" | "json";

// グローバル変数の型定義
declare global {
  interface Window {
    Terser?: {
      minify: (
        code: string,
        options?: Record<string, unknown>
      ) => Promise<{ code?: string; error?: Error }>;
    };
    csso?: {
      minify: (code: string) => { css: string };
    };
    minify?: (code: string, options?: Record<string, unknown>) => string;
  }
}

/**
 * Minifyツールコンポーネント
 *
 * JavaScript、CSS、HTML、JSONのコードを圧縮（minify）します
 *
 * @returns Minifyツールコンポーネント
 */
function MinifyTool() {
  const { showToast } = useToast();
  const [codeType, setCodeType] = useState<CodeType>("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [usedLibrary, setUsedLibrary] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * コードをminify化する
   */
  const handleMinify = useCallback(async () => {
    if (!input.trim()) {
      setError("コードを入力してください");
      setOutput("");
      setCompressionRatio(null);
      return;
    }

    setError(null);

    try {
      let minified = "";
      let library = "";

      switch (codeType) {
        case "javascript":
          // Terserが利用可能ならそれを使用
          if (window.Terser) {
            const result = await window.Terser.minify(input, {
              compress: {
                passes: 2,
              },
              mangle: {
                toplevel: true,
              },
              format: {
                comments: false,
              },
            });
            if (result.error) {
              throw new Error(
                result.error instanceof Error
                  ? result.error.message
                  : String(result.error)
              );
            }
            minified = result.code || "";
            library = "Terser";
          } else {
            // フォールバック: regex実装
            minified = minifyJavaScript(input);
            library = "正規表現（フォールバック）";
          }
          break;
        case "css":
          // CSSOが利用可能ならそれを使用
          if (window.csso) {
            const result = window.csso.minify(input);
            minified = result.css;
            library = "CSSO";
          } else {
            // フォールバック: regex実装
            minified = minifyCSS(input);
            library = "正規表現（フォールバック）";
          }
          break;
        case "html":
          // html-minifier-terserが利用可能ならそれを使用
          if (window.minify) {
            minified = window.minify(input, {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
              minifyCSS: true,
              minifyJS: true,
            });
            library = "html-minifier-terser";
          } else {
            // フォールバック: regex実装
            minified = minifyHTML(input);
            library = "正規表現（フォールバック）";
          }
          break;
        case "json":
          minified = minifyJSON(input);
          library = "JSON.stringify";
          break;
      }

      setOutput(minified);
      setUsedLibrary(library);

      // 圧縮率を計算
      const originalSize = new Blob([input]).size;
      const minifiedSize = new Blob([minified]).size;
      const ratio = Math.max(
        0,
        ((originalSize - minifiedSize) / originalSize) * 100
      );
      setCompressionRatio(ratio);

      showToast("コードを圧縮しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "圧縮エラーが発生しました";
      setError(message);
      setOutput("");
      setCompressionRatio(null);
      showToast(message, "error");
    }
  }, [input, codeType, showToast]);

  /**
   * ファイルをアップロードして読み込む
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInput(text);
        showToast("ファイルを読み込みました", "success");
      };
      reader.onerror = () => {
        showToast("ファイルの読み込みに失敗しました", "error");
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  /**
   * 出力をクリップボードにコピー
   */
  const handleCopy = useCallback(() => {
    if (!output) {
      showToast("コピーする内容がありません", "error");
      return;
    }

    navigator.clipboard
      .writeText(output)
      .then(() => showToast("コピーしました", "success"))
      .catch(() => showToast("コピーに失敗しました", "error"));
  }, [output, showToast]);

  /**
   * フィールドをクリア
   */
  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
    setCompressionRatio(null);
    setUsedLibrary(null);
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <h1>コード圧縮ツール (Minify)</h1>
        <p className="page-subtitle">
          JavaScript、CSS、HTML、JSONのコードを圧縮します
        </p>

        <div className="converter-section">
          <div className="input-group">
            <label htmlFor="codeType" className="input-label">
              コードタイプ
            </label>
            <select
              id="codeType"
              value={codeType}
              onChange={(e) => setCodeType(e.target.value as CodeType)}
              className="select-input"
              aria-label="圧縮するコードのタイプ"
            >
              <option value="javascript">JavaScript</option>
              <option value="css">CSS</option>
              <option value="html">HTML</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="input-group">
            <div className="output-header">
              <label htmlFor="input" className="input-label">
                入力コード
              </label>
              <label htmlFor="fileInput" className="text-button">
                📁 ファイルから読み込む
              </label>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileUpload}
                accept=".js,.css,.html,.json,.txt"
                className="sr-only"
                aria-label="ファイルを選択"
              />
            </div>
            <textarea
              ref={inputRef}
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${codeType.toUpperCase()}のコードを入力してください`}
              className="textarea-input"
              rows={12}
              spellCheck={false}
              aria-label="圧縮する元のコード"
            />
          </div>

          <div className="button-group">
            <button
              onClick={handleMinify}
              className="btn-primary"
              aria-label="コードを圧縮"
            >
              圧縮
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary"
              aria-label="すべてクリア"
            >
              クリア
            </button>
          </div>

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {output && (
            <div className="input-group">
              <div className="output-header">
                <label htmlFor="output" className="input-label">
                  圧縮結果
                </label>
                <div className="library-info-group">
                  {usedLibrary && (
                    <span className="library-info">使用: {usedLibrary}</span>
                  )}
                  {compressionRatio !== null && (
                    <span className="compression-ratio">
                      圧縮率: {compressionRatio.toFixed(2)}% 削減 (
                      {new Blob([input]).size} → {new Blob([output]).size}{" "}
                      bytes)
                    </span>
                  )}
                </div>
              </div>
              <textarea
                id="output"
                value={output}
                readOnly
                className="textarea-input"
                rows={12}
                spellCheck={false}
                aria-label="圧縮後のコード"
              />
              <button
                onClick={handleCopy}
                className="btn-secondary"
                aria-label="圧縮結果をコピー"
              >
                📋 コピー
              </button>
            </div>
          )}
        </div>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>コードタイプ（JavaScript/CSS/HTML/JSON）を選択</li>
            <li>入力欄にコードを貼り付けまたは入力</li>
            <li>「圧縮」ボタンをクリックしてminify化</li>
            <li>圧縮結果をコピーして使用</li>
          </ul>
          <h3>圧縮の特徴</h3>
          <ul>
            <li>
              JavaScript:{" "}
              <a
                href="https://terser.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terser
              </a>
              を使用した高精度な圧縮
            </li>
            <li>
              CSS:{" "}
              <a
                href="https://css.github.io/csso/"
                target="_blank"
                rel="noopener noreferrer"
              >
                CSSO
              </a>
              による構造的最適化
            </li>
            <li>
              HTML:{" "}
              <a
                href="https://github.com/terser/html-minifier-terser"
                target="_blank"
                rel="noopener noreferrer"
              >
                html-minifier-terser
              </a>
              による高度な圧縮
            </li>
            <li>JSON: 不要な空白を削除して1行に圧縮</li>
          </ul>
          <h3>注意事項</h3>
          <ul>
            <li>圧縮後のコードは可読性が低下します</li>
            <li>本番環境用のファイルサイズ削減に適しています</li>
            <li>デバッグには元のコードを使用してください</li>
          </ul>
          <h3>スポンサー支援</h3>
          <p>このツールは以下の素晴らしいオープンソースライブラリを使用しています：</p>
          <ul>
            <li>
              <a
                href="https://opencollective.com/terser"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terser への支援
              </a>
              {" - JavaScript minifier"}
            </li>
            <li>
              <a
                href="https://github.com/sponsors/css"
                target="_blank"
                rel="noopener noreferrer"
              >
                CSSO への支援
              </a>
              {" - CSS optimizer"}
            </li>
            <li>
              <a
                href="https://www.jsdelivr.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                jsDelivr への支援
              </a>
              {" - CDN provider"}
            </li>
          </ul>
          <p>
            これらのライブラリの開発者に感謝します。スポンサーとしての支援をぜひご検討ください。
          </p>
        </aside>
      </div>
    </>
  );
}
