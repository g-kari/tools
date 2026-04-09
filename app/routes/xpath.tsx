import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { evaluateXPath, XPATH_EXAMPLES, SAMPLE_XML, type XPathEvalResult } from "~/utils/xpath";
import "../styles/tools/xpath.css";

export const Route = createFileRoute("/xpath")({
  head: () => ({
    meta: [
      { title: "XPath 評価器 | Web ツール集" },
      {
        name: "description",
        content:
          "XML ドキュメントに対して XPath 1.0 式をブラウザ内で評価するオンラインツール。ノードセット・文字列・数値・真偽値の結果表示に対応。サンプル XML と XPath 式を提供。",
      },
      { property: "og:title", content: "XPath 評価器 | Web ツール集" },
      {
        property: "og:description",
        content:
          "XML に対して XPath 1.0 式を評価するオンラインツール。ノードセット・文字列・数値・真偽値の結果表示に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/xpath` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "XPath 評価器 | Web ツール集" },
      {
        name: "twitter:description",
        content: "XML に対して XPath 1.0 式を評価するオンラインツール。",
      },
    ],
  }),
  component: XPathEvaluator,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function XPathEvaluator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [xml, setXml] = useState("");
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<XPathEvalResult | null>(null);
  const [isClient, setIsClient] = useState(false);

  // SSR 対応: クライアントサイドでのみ有効化
  useEffect(() => {
    setIsClient(true);
  }, []);

  // XPath 評価
  const handleEvaluate = useCallback(() => {
    if (!isClient) return;
    if (!xml.trim()) {
      showToast("XML を入力してください", "error");
      return;
    }
    if (!expression.trim()) {
      showToast("XPath 式を入力してください", "error");
      return;
    }
    const evalResult = evaluateXPath({ xml, expression });
    setResult(evalResult);
    if (evalResult.type === "error") {
      announceStatus("XPath 評価エラー");
    } else {
      announceStatus("XPath 評価完了");
    }
  }, [isClient, xml, expression, showToast, announceStatus]);

  // Enter キーで評価
  const handleExpressionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleEvaluate();
      }
    },
    [handleEvaluate],
  );

  // 例の選択
  const handleExampleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value, 10);
      if (isNaN(idx)) return;
      const example = XPATH_EXAMPLES[idx];
      if (example) {
        setExpression(example.expression);
        setResult(null);
        announceStatus(`例「${example.label}」を選択しました`);
      }
    },
    [announceStatus],
  );

  // サンプル XML をロード
  const handleLoadSample = useCallback(() => {
    setXml(SAMPLE_XML);
    setExpression("//book/title/text()");
    setResult(null);
    announceStatus("サンプル XML を読み込みました");
  }, [announceStatus]);

  // 結果をコピー
  const handleCopyResult = useCallback(async () => {
    if (!result || result.type === "error") return;
    let text = "";
    if (result.type === "string") text = result.stringValue ?? "";
    else if (result.type === "number") text = String(result.numberValue);
    else if (result.type === "boolean") text = String(result.booleanValue);
    else if (result.type === "nodeset") {
      text = (result.nodes ?? []).map((n) => n.value).join("\n");
    }
    const ok = await copy(text);
    if (ok) {
      showToast("コピーしました", "success");
      announceStatus("結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, copy, showToast, announceStatus]);

  // 結果タイプのバッジクラス
  function getTypeBadgeClass(type: string): string {
    switch (type) {
      case "nodeset":
        return "xpath-result-type-badge xpath-result-type-nodeset";
      case "string":
        return "xpath-result-type-badge xpath-result-type-string";
      case "number":
        return "xpath-result-type-badge xpath-result-type-number";
      case "boolean":
        return "xpath-result-type-badge xpath-result-type-boolean";
      default:
        return "xpath-result-type-badge";
    }
  }

  // 結果タイプ表示名
  function getTypeLabel(type: string): string {
    switch (type) {
      case "nodeset":
        return "nodeset";
      case "string":
        return "string";
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      default:
        return type;
    }
  }

  const hasValidResult = result !== null && result.type !== "error";

  return (
    <>
      <div className="tool-container">
        {/* ヘッダーアクション */}
        <div className="xpath-action-row">
          <button
            type="button"
            className="btn-secondary xpath-sample-btn"
            onClick={handleLoadSample}
            aria-label="サンプル XML を読み込む"
          >
            📄 サンプル XML を読み込む
          </button>
        </div>

        {/* XML 入力・XPath 式 */}
        <div className="xpath-layout">
          {/* 左: XML 入力 */}
          <div className="converter-section">
            <label htmlFor="xpath-xml-input" className="section-title">
              XML ドキュメント
            </label>
            <textarea
              id="xpath-xml-input"
              className="xpath-textarea"
              value={xml}
              onChange={(e) => {
                setXml(e.target.value);
                setResult(null);
              }}
              placeholder={'<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>'}
              aria-label="XML ドキュメント入力"
              spellCheck={false}
            />
          </div>

          {/* 右: 結果 */}
          <div>
            <div className="section-title" aria-hidden="true">
              評価結果
            </div>
            <div className="xpath-result-area" role="region" aria-label="XPath 評価結果">
              {result === null ? (
                <div className="xpath-placeholder">
                  XPath 式を入力して「評価」ボタンを押してください
                </div>
              ) : result.type === "error" ? (
                <div className="xpath-error" role="alert">
                  <span className="xpath-error-icon" aria-hidden="true">
                    ⚠
                  </span>
                  {result.error}
                </div>
              ) : (
                <>
                  <div className="xpath-result-header">
                    <span className="xpath-result-title">結果</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={getTypeBadgeClass(result.type)}>
                        {getTypeLabel(result.type)}
                      </span>
                      {result.type === "nodeset" && (
                        <span className="xpath-result-meta">{result.nodeCount} 件</span>
                      )}
                    </div>
                  </div>
                  <div className="xpath-result-body">
                    {result.type === "string" && (
                      <div className="xpath-scalar-result">
                        {result.stringValue === "" ? (
                          <span style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                            （空文字列）
                          </span>
                        ) : (
                          result.stringValue
                        )}
                      </div>
                    )}
                    {result.type === "number" && (
                      <div className="xpath-scalar-result">{result.numberValue}</div>
                    )}
                    {result.type === "boolean" && (
                      <div className="xpath-scalar-result">
                        {result.booleanValue ? "true" : "false"}
                      </div>
                    )}
                    {result.type === "nodeset" && (
                      <>
                        {result.nodes!.length === 0 ? (
                          <div className="xpath-empty-result">
                            マッチするノードがありませんでした
                          </div>
                        ) : (
                          <ul className="xpath-node-list" aria-label="選択されたノード一覧">
                            {result.nodes!.map((node, i) => (
                              <li key={i} className="xpath-node-item">
                                <div className="xpath-node-header">
                                  <span className="xpath-node-index">[{i + 1}]</span>
                                  <span className="xpath-node-type">{node.nodeTypeName}</span>
                                  <span className="xpath-node-name">{node.name}</span>
                                </div>
                                <div className="xpath-node-value">{node.value}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* XPath 式入力 */}
        <div className="converter-section">
          <label htmlFor="xpath-expression-input" className="section-title">
            XPath 式
          </label>

          {/* 例の選択 */}
          <label htmlFor="xpath-examples" className="xpath-examples-label">
            例から選択:
          </label>
          <select
            id="xpath-examples"
            className="xpath-examples-select"
            onChange={handleExampleSelect}
            value=""
            aria-label="XPath 式の例を選択"
          >
            <option value="">-- 例を選択 --</option>
            {XPATH_EXAMPLES.map((ex, i) => (
              <option key={i} value={i}>
                {ex.label} — {ex.expression}
              </option>
            ))}
          </select>

          <div className="xpath-expression-row">
            <input
              id="xpath-expression-input"
              type="text"
              className="xpath-expression-input"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setResult(null);
              }}
              onKeyDown={handleExpressionKeyDown}
              placeholder="XPath 式を入力（例: //book/title/text()）"
              aria-label="XPath 式入力"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleEvaluate}
              disabled={!isClient || !xml.trim() || !expression.trim()}
              aria-label="XPath 式を評価"
            >
              評価
            </button>
          </div>
        </div>

        {/* アクションボタン */}
        {hasValidResult && (
          <div className="xpath-action-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyResult}
              aria-label="結果をコピー"
            >
              コピー
            </button>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "XPath 1.0 の基本",
              items: [
                "//element: 文書全体から element を検索（子孫軸）",
                "/root/child: ルートから child を検索（絶対パス）",
                "@attribute: 属性を選択",
                "text(): テキストノードを選択",
                "[条件]: 述語でフィルタリング（例: [1] は最初の要素）",
              ],
            },
            {
              title: "よく使う関数",
              items: [
                "count(//elem): 要素の個数を返す（数値型）",
                "string(//elem): 要素のテキスト内容を返す（文字列型）",
                "contains(str, substr): 文字列に部分文字列が含まれるか（真偽値型）",
                "starts-with(str, prefix): 文字列がプレフィックスで始まるか",
                "normalize-space(str): 前後の空白を除去し連続空白を1つに正規化",
                "last(): コンテキストノード集合の最後のインデックス",
                "position(): コンテキストノードの位置",
              ],
            },
            {
              title: "結果の型",
              items: [
                "nodeset: 要素・属性・テキストノードなどのノード集合",
                "string: 文字列値（string() 関数など）",
                "number: 数値（count()・計算式など）",
                "boolean: 真偽値（contains()・比較演算など）",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
