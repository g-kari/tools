import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import "../styles/tools/encode-chain.css";

export const Route = createFileRoute("/encode-chain")({
  head: () => ({
    meta: [
      { title: "エンコードチェーン | Web ツール集" },
      {
        name: "description",
        content:
          "テキストに複数のエンコード・変換を連鎖して適用するツール。Base64・URLエンコード・Hex変換・HTMLエスケープなどを組み合わせ、各ステップの結果を可視化。",
      },
      { property: "og:title", content: "エンコードチェーン | Web ツール集" },
      {
        property: "og:description",
        content: "複数のエンコード・変換を連鎖して適用。各ステップの結果をリアルタイムで確認。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/encode-chain` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "エンコードチェーン | Web ツール集" },
      {
        name: "twitter:description",
        content: "複数のエンコード・変換を連鎖して適用。各ステップの結果をリアルタイムで確認。",
      },
    ],
  }),
  component: EncodeChainPage,
});

/** 変換タイプ */
export type TransformType =
  | "base64-encode"
  | "base64-decode"
  | "url-encode"
  | "url-decode"
  | "hex-encode"
  | "hex-decode"
  | "html-escape"
  | "html-unescape"
  | "uppercase"
  | "lowercase"
  | "reverse"
  | "rot13"
  | "json-stringify"
  | "json-parse"
  | "trim";

/** 変換定義 */
interface TransformDef {
  type: TransformType;
  label: string;
  description: string;
  category: "エンコード" | "変換" | "テキスト";
}

export const TRANSFORM_DEFS: TransformDef[] = [
  {
    type: "base64-encode",
    label: "Base64 エンコード",
    description: "テキストをBase64形式にエンコード",
    category: "エンコード",
  },
  {
    type: "base64-decode",
    label: "Base64 デコード",
    description: "Base64文字列をテキストにデコード",
    category: "エンコード",
  },
  {
    type: "url-encode",
    label: "URL エンコード",
    description: "encodeURIComponentで特殊文字をエスケープ",
    category: "エンコード",
  },
  {
    type: "url-decode",
    label: "URL デコード",
    description: "decodeURIComponentで%エスケープを復元",
    category: "エンコード",
  },
  {
    type: "hex-encode",
    label: "Hex エンコード",
    description: "テキストを16進数に変換（UTF-8バイト単位）",
    category: "エンコード",
  },
  {
    type: "hex-decode",
    label: "Hex デコード",
    description: "16進数文字列をテキストに変換",
    category: "エンコード",
  },
  {
    type: "html-escape",
    label: "HTML エスケープ",
    description: "&・<・>・\"・'をHTMLエンティティに変換",
    category: "エンコード",
  },
  {
    type: "html-unescape",
    label: "HTML アンエスケープ",
    description: "HTMLエンティティをテキストに戻す",
    category: "エンコード",
  },
  {
    type: "json-stringify",
    label: "JSON 文字列化",
    description: "JSON.stringifyで文字列としてエスケープ（引用符付き）",
    category: "変換",
  },
  {
    type: "json-parse",
    label: "JSON パース",
    description: "JSON.parseで文字列を値に復元",
    category: "変換",
  },
  {
    type: "rot13",
    label: "ROT13",
    description: "アルファベットを13文字シフト",
    category: "変換",
  },
  {
    type: "uppercase",
    label: "大文字変換",
    description: "すべての文字を大文字に変換",
    category: "テキスト",
  },
  {
    type: "lowercase",
    label: "小文字変換",
    description: "すべての文字を小文字に変換",
    category: "テキスト",
  },
  {
    type: "reverse",
    label: "文字列反転",
    description: "文字列を逆順に並べ替え",
    category: "テキスト",
  },
  {
    type: "trim",
    label: "トリム",
    description: "先頭・末尾の空白を除去",
    category: "テキスト",
  },
];

/** 1ステップの変換を適用する */
export function applyTransform(
  input: string,
  type: TransformType,
): { output: string; error?: string } {
  try {
    switch (type) {
      case "base64-encode":
        return { output: btoa(unescape(encodeURIComponent(input))) };
      case "base64-decode":
        return { output: decodeURIComponent(escape(atob(input))) };
      case "url-encode":
        return { output: encodeURIComponent(input) };
      case "url-decode":
        return { output: decodeURIComponent(input) };
      case "hex-encode": {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        return {
          output: Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
        };
      }
      case "hex-decode": {
        const hex = input.replace(/\s/g, "");
        if (hex.length % 2 !== 0) {
          return { output: input, error: "16進数文字列の長さが奇数です" };
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.slice(i, i + 2), 16);
          if (isNaN(byte)) {
            return { output: input, error: `無効な16進数文字: ${hex.slice(i, i + 2)}` };
          }
          bytes[i / 2] = byte;
        }
        const decoder = new TextDecoder();
        return { output: decoder.decode(bytes) };
      }
      case "html-escape":
        return {
          output: input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;"),
        };
      case "html-unescape":
        return {
          output: input
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'"),
        };
      case "json-stringify":
        return { output: JSON.stringify(input) };
      case "json-parse": {
        const parsed = JSON.parse(input);
        if (typeof parsed === "string") return { output: parsed };
        return { output: JSON.stringify(parsed, null, 2) };
      }
      case "rot13":
        return {
          output: input.replace(/[A-Za-z]/g, (c) => {
            const base = c <= "Z" ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
          }),
        };
      case "uppercase":
        return { output: input.toUpperCase() };
      case "lowercase":
        return { output: input.toLowerCase() };
      case "reverse":
        return { output: Array.from(input).reverse().join("") };
      case "trim":
        return { output: input.trim() };
      default:
        return { output: input };
    }
  } catch (e) {
    return { output: input, error: e instanceof Error ? e.message : String(e) };
  }
}

/** ステップ一覧の型 */
interface ChainStep {
  id: string;
  type: TransformType;
}

/** ステップ結果の型 */
interface StepResult {
  step: ChainStep;
  input: string;
  output: string;
  error?: string;
}

let stepIdCounter = 0;
function newStepId(): string {
  return `step-${++stepIdCounter}`;
}

/** エンコードチェーンページ */
function EncodeChainPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [inputText, setInputText] = useState("Hello, World!");
  const [steps, setSteps] = useState<ChainStep[]>([
    { id: newStepId(), type: "base64-encode" },
    { id: newStepId(), type: "url-encode" },
  ]);
  const [addType, setAddType] = useState<TransformType>("base64-encode");

  /** チェーン全体を評価 */
  const results = useMemo<StepResult[]>(() => {
    let current = inputText;
    return steps.map((step) => {
      const { output, error } = applyTransform(current, step.type);
      const result: StepResult = { step, input: current, output, error };
      current = error ? current : output;
      return result;
    });
  }, [inputText, steps]);

  const finalOutput = useMemo(() => {
    if (results.length === 0) return inputText;
    const last = results[results.length - 1];
    return last.error ? last.input : last.output;
  }, [results, inputText]);

  /** ステップ追加 */
  const handleAddStep = useCallback(() => {
    setSteps((prev) => [...prev, { id: newStepId(), type: addType }]);
  }, [addType]);

  /** ステップ削除 */
  const handleRemoveStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** ステップ上へ移動 */
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setSteps((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  /** ステップ下へ移動 */
  const handleMoveDown = useCallback((index: number) => {
    setSteps((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  /** ステップ変換タイプの変更 */
  const handleChangeType = useCallback((id: string, type: TransformType) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, type } : s)));
  }, []);

  /** チェーンクリア */
  const handleClear = useCallback(() => {
    setSteps([]);
  }, []);

  /** コピー */
  const handleCopy = useCallback(async () => {
    await copy(finalOutput);
    showToast("コピーしました", "success");
  }, [copy, finalOutput, showToast]);

  const hasErrors = results.some((r) => r.error);

  return (
    <div className="tool-container">
      <h1 className="tool-title">エンコードチェーン</h1>
      <p className="tool-description">
        テキストに複数のエンコード・変換を連鎖して適用します。
        Base64・URLエンコード・Hex変換などを組み合わせ、各ステップの中間結果を確認できます。
      </p>

      {/* 入力 */}
      <section className="ec-section" aria-labelledby="ec-input-heading">
        <h2 id="ec-input-heading" className="ec-section-title">
          入力テキスト
        </h2>
        <textarea
          className="ec-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="変換するテキストを入力してください"
          rows={4}
          aria-label="入力テキスト"
          spellCheck={false}
        />
      </section>

      {/* ステップ追加 */}
      <section className="ec-section" aria-labelledby="ec-add-heading">
        <h2 id="ec-add-heading" className="ec-section-title">
          変換ステップを追加
        </h2>
        <div className="ec-add-row">
          <select
            className="ec-select"
            value={addType}
            onChange={(e) => setAddType(e.target.value as TransformType)}
            aria-label="追加する変換を選択"
          >
            {(["エンコード", "変換", "テキスト"] as const).map((cat) => (
              <optgroup key={cat} label={cat}>
                {TRANSFORM_DEFS.filter((d) => d.category === cat).map((def) => (
                  <option key={def.type} value={def.type}>
                    {def.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddStep}
            aria-label="ステップを追加"
          >
            + 追加
          </button>
          {steps.length > 0 && (
            <button
              type="button"
              className="btn-secondary ec-clear-btn"
              onClick={handleClear}
              aria-label="全ステップをクリア"
            >
              クリア
            </button>
          )}
        </div>
      </section>

      {/* チェーン */}
      {steps.length === 0 ? (
        <div className="ec-empty">
          変換ステップがありません。上の「変換ステップを追加」からステップを追加してください。
        </div>
      ) : (
        <section className="ec-chain" aria-label="変換チェーン">
          {/* 入力バッジ */}
          <div className="ec-step-io ec-step-io-input">
            <span className="ec-io-label">入力</span>
            <span className="ec-io-value" title={inputText}>
              {inputText.length > 60 ? inputText.slice(0, 60) + "…" : inputText || "(空)"}
            </span>
          </div>

          {results.map((result, index) => {
            const def = TRANSFORM_DEFS.find((d) => d.type === result.step.type);
            return (
              <div
                key={result.step.id}
                className={`ec-step ${result.error ? "ec-step-error" : ""}`}
              >
                {/* ステップヘッダー */}
                <div className="ec-step-header">
                  <span className="ec-step-number" aria-label={`ステップ ${index + 1}`}>
                    {index + 1}
                  </span>
                  <select
                    className="ec-step-select"
                    value={result.step.type}
                    onChange={(e) =>
                      handleChangeType(result.step.id, e.target.value as TransformType)
                    }
                    aria-label={`ステップ ${index + 1} の変換タイプ`}
                  >
                    {(["エンコード", "変換", "テキスト"] as const).map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {TRANSFORM_DEFS.filter((d) => d.category === cat).map((d) => (
                          <option key={d.type} value={d.type}>
                            {d.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {def && <span className="ec-step-desc">{def.description}</span>}
                  <div className="ec-step-controls">
                    <button
                      type="button"
                      className="ec-move-btn"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      aria-label={`ステップ ${index + 1} を上へ`}
                      title="上へ移動"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="ec-move-btn"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === steps.length - 1}
                      aria-label={`ステップ ${index + 1} を下へ`}
                      title="下へ移動"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="ec-remove-btn"
                      onClick={() => handleRemoveStep(result.step.id)}
                      aria-label={`ステップ ${index + 1} を削除`}
                      title="削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* エラー表示 */}
                {result.error && (
                  <div className="ec-error-msg" role="alert">
                    ⚠ {result.error}
                  </div>
                )}

                {/* 出力バッジ */}
                <div
                  className={`ec-step-io ${result.error ? "ec-step-io-error" : "ec-step-io-output"}`}
                >
                  <span className="ec-io-label">出力</span>
                  <span className="ec-io-value" title={result.output}>
                    {result.output.length > 80
                      ? result.output.slice(0, 80) + "…"
                      : result.output || "(空)"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 最終出力 */}
      <section className="ec-section ec-output-section" aria-labelledby="ec-output-heading">
        <div className="ec-output-header">
          <h2 id="ec-output-heading" className="ec-section-title">
            最終出力
            {hasErrors && <span className="ec-error-badge"> ⚠ エラーあり</span>}
          </h2>
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopy}
            disabled={!finalOutput}
            aria-label="最終出力をコピー"
          >
            コピー
          </button>
        </div>
        <pre className="ec-output" aria-label="最終出力テキスト">
          {finalOutput || "(空)"}
        </pre>
        <p className="ec-output-meta">
          {finalOutput.length} 文字
          {steps.length > 0 && `（${steps.length} ステップ適用）`}
        </p>
      </section>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "「入力テキスト」に変換したいテキストを入力します",
              "「変換ステップを追加」でエンコード方式を選んで追加します",
              "各ステップの出力がリアルタイムで表示されます",
              "↑↓ボタンでステップの順序を変更できます",
              "最終出力の「コピー」ボタンで結果をクリップボードにコピーできます",
            ],
          },
          {
            title: "活用例",
            items: [
              "二重エンコード確認: URLエンコード → Base64エンコード",
              "JWT ペイロード: Base64デコード → JSON パース（スペース・改行の整形）",
              "HTMLテンプレートのデバッグ: HTMLアンエスケープ → 内容確認",
              "バイナリ解析準備: Hexエンコード → 16進数ダンプ確認",
            ],
          },
        ]}
      />
    </div>
  );
}
