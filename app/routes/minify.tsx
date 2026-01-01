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
  }),
  component: MinifyTool,
});

type CodeType = "javascript" | "css" | "html" | "json";

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * コードをminify化する
   */
  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError("コードを入力してください");
      setOutput("");
      setCompressionRatio(null);
      return;
    }

    setError(null);

    try {
      let minified = "";

      switch (codeType) {
        case "javascript":
          minified = minifyJavaScript(input);
          break;
        case "css":
          minified = minifyCSS(input);
          break;
        case "html":
          minified = minifyHTML(input);
          break;
        case "json":
          minified = minifyJSON(input);
          break;
      }

      setOutput(minified);

      // 圧縮率を計算
      const originalSize = new Blob([input]).size;
      const minifiedSize = new Blob([minified]).size;
      const ratio = ((originalSize - minifiedSize) / originalSize) * 100;
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
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
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
            <label htmlFor="input" className="input-label">
              入力コード
            </label>
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
                {compressionRatio !== null && (
                  <span className="compression-ratio">
                    圧縮率: {compressionRatio.toFixed(2)}% 削減
                  </span>
                )}
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
            <li>JavaScript: コメントと不要な空白を削除</li>
            <li>CSS: コメントと不要な空白を削除</li>
            <li>HTML: コメントと不要な空白を削除</li>
            <li>JSON: 不要な空白を削除して1行に圧縮</li>
          </ul>
          <h3>注意事項</h3>
          <ul>
            <li>圧縮後のコードは可読性が低下します</li>
            <li>本番環境用のファイルサイズ削減に適しています</li>
            <li>デバッグには元のコードを使用してください</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
