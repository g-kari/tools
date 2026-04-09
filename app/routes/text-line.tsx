import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { LINE_OPS, applyLineOp, type LineOp } from "~/utils/text-line";
import "~/styles/tools/text-line.css";

export const Route = createFileRoute("/text-line")({
  head: () => ({
    meta: [
      { title: "テキスト行操作 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストの行に対してトリム・空行削除・行番号付加・プレフィックス/サフィックス追加・逆順・シャッフル・フィルタリングなどの操作を行うオンラインツール。",
      },
      {
        property: "og:title",
        content: "テキスト行操作 | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "トリム・空行削除・行番号・プレフィックス/サフィックス・逆順・シャッフル・フィルタなどのテキスト行操作ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/text-line` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "テキスト行操作 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "トリム・空行削除・行番号・プレフィックス/サフィックス・逆順・シャッフル・フィルタなどのテキスト行操作ツール。",
      },
    ],
  }),
  component: TextLineTool,
});

/** 追加入力の状態 */
type ExtraInputs = Record<LineOp, string>;

const DEFAULT_EXTRA: ExtraInputs = {
  trim: "",
  "remove-empty": "",
  "add-numbers": "",
  "add-prefix": "",
  "add-suffix": "",
  reverse: "",
  shuffle: "",
  "filter-keep": "",
  "filter-remove": "",
};

/**
 * テキスト行操作ツールコンポーネント
 *
 * テキストの各行にトリム・空行削除・行番号付加・プレフィックス/サフィックス追加・
 * 逆順・シャッフル・フィルタリングなどの操作を提供します。
 *
 * @returns テキスト行操作ツールの React コンポーネント
 */
function TextLineTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [lineCount, setLineCount] = useState<{
    before: number;
    after: number;
  } | null>(null);
  const [extraInputs, setExtraInputs] = useState<ExtraInputs>(DEFAULT_EXTRA);

  const handleApply = useCallback(
    (op: LineOp) => {
      if (!inputText.trim()) {
        showToast("テキストを入力してください", "error");
        return;
      }
      const { result, lineCount: lc } = applyLineOp(inputText, op, extraInputs[op]);
      setOutputText(result);
      setLineCount(lc);
      showToast("操作を適用しました", "success");
    },
    [inputText, extraInputs, showToast],
  );

  const handleCopy = useCallback(async () => {
    if (!outputText) {
      showToast("コピーする内容がありません", "error");
      return;
    }
    await copy(outputText);
    showToast("コピーしました", "success");
  }, [outputText, copy, showToast]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    setLineCount(null);
  }, []);

  const handleExtraChange = useCallback((op: LineOp, value: string) => {
    setExtraInputs((prev) => ({ ...prev, [op]: value }));
  }, []);

  const inputLineCount = inputText ? inputText.split("\n").length : 0;

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1 className="tool-title">テキスト行操作</h1>
        <p className="tool-description">
          テキストの各行にトリム・空行削除・行番号付加・プレフィックス/サフィックス追加・逆順・シャッフル・フィルタリングなどの操作を行います。
        </p>
      </div>

      <div className="tl-layout">
        {/* ── 操作パネル ── */}
        <div className="tl-ops-panel">
          <div className="tl-ops-title">操作を選択</div>

          {/* 操作グループ：整形 */}
          <div className="tl-op-group">
            <div className="tl-ops-title">整形</div>
            {LINE_OPS.filter((op) => ["trim", "remove-empty"].includes(op.id)).map((op) => (
              <div key={op.id}>
                <button
                  className="tl-op-btn"
                  onClick={() => handleApply(op.id)}
                  aria-label={op.label}
                >
                  {op.label}
                  <span className="tl-op-desc">{op.description}</span>
                </button>
              </div>
            ))}
          </div>

          {/* 操作グループ：追加 */}
          <div className="tl-op-group">
            <div className="tl-ops-title">追加</div>
            {LINE_OPS.filter((op) =>
              ["add-numbers", "add-prefix", "add-suffix"].includes(op.id),
            ).map((op) => (
              <div key={op.id} className={op.hasInput ? "tl-op-with-input" : ""}>
                {op.hasInput ? (
                  <>
                    <div className="tl-op-input-row">
                      <input
                        type="text"
                        className="tl-extra-input"
                        value={extraInputs[op.id]}
                        onChange={(e) => handleExtraChange(op.id, e.target.value)}
                        placeholder={op.inputPlaceholder}
                        aria-label={op.inputLabel}
                      />
                      <Button size="sm" onClick={() => handleApply(op.id)} aria-label={op.label}>
                        {op.label}
                      </Button>
                    </div>
                    <span className="tl-op-desc">{op.description}</span>
                  </>
                ) : (
                  <button
                    className="tl-op-btn"
                    onClick={() => handleApply(op.id)}
                    aria-label={op.label}
                  >
                    {op.label}
                    <span className="tl-op-desc">{op.description}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 操作グループ：並び替え */}
          <div className="tl-op-group">
            <div className="tl-ops-title">並び替え</div>
            {LINE_OPS.filter((op) => ["reverse", "shuffle"].includes(op.id)).map((op) => (
              <div key={op.id}>
                <button
                  className="tl-op-btn"
                  onClick={() => handleApply(op.id)}
                  aria-label={op.label}
                >
                  {op.label}
                  <span className="tl-op-desc">{op.description}</span>
                </button>
              </div>
            ))}
          </div>

          {/* 操作グループ：フィルタ */}
          <div className="tl-op-group">
            <div className="tl-ops-title">フィルタ</div>
            {LINE_OPS.filter((op) => ["filter-keep", "filter-remove"].includes(op.id)).map((op) => (
              <div key={op.id} className="tl-op-with-input">
                <div className="tl-op-input-row">
                  <input
                    type="text"
                    className="tl-extra-input"
                    value={extraInputs[op.id]}
                    onChange={(e) => handleExtraChange(op.id, e.target.value)}
                    placeholder={op.inputPlaceholder}
                    aria-label={op.inputLabel}
                  />
                  <Button size="sm" onClick={() => handleApply(op.id)} aria-label={op.label}>
                    {op.id === "filter-keep" ? "含む" : "除外"}
                  </Button>
                </div>
                <span className="tl-op-desc">{op.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── IO エリア ── */}
        <div className="tl-io-area">
          {/* 入力 */}
          <div className="tl-io-section">
            <div className="tl-io-header">
              <label htmlFor="tl-input" className="tl-io-label">
                入力テキスト
              </label>
              <div className="tl-io-actions">
                <span className="tl-line-count">
                  {inputLineCount > 0 ? `${inputLineCount} 行` : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="tl-clear-btn"
                  onClick={handleClear}
                  aria-label="入力と出力をクリア"
                >
                  クリア
                </Button>
              </div>
            </div>
            <Textarea
              id="tl-input"
              aria-label="操作対象のテキスト入力欄"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ここにテキストを入力してください"
              rows={12}
            />
          </div>

          {/* 出力 */}
          <div className="tl-io-section">
            <div className="tl-io-header">
              <label htmlFor="tl-output" className="tl-io-label">
                結果
              </label>
              <div className="tl-io-actions">
                {lineCount && (
                  <span
                    className={`tl-line-count ${lineCount.before !== lineCount.after ? "tl-line-count-changed" : ""}`}
                  >
                    {lineCount.before} → {lineCount.after} 行
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!outputText}
                  aria-label="結果をコピー"
                >
                  コピー
                </Button>
              </div>
            </div>
            <Textarea
              id="tl-output"
              aria-label="テキスト行操作の結果出力欄"
              value={outputText}
              readOnly
              placeholder="操作を選択すると結果が表示されます"
              rows={12}
            />
          </div>
        </div>
      </div>

      {/* ── Tips ── */}
      <TipsCard title="使い方">
        <ul>
          <li>左側のテキストエリアにテキストを入力します。</li>
          <li>右パネルから操作を選択すると即時適用され、結果が表示されます。</li>
          <li>
            <strong>プレフィックス/サフィックス</strong>・<strong>フィルタ</strong>
            は入力欄にキーワードを入力してから実行します。
          </li>
          <li>操作は連続して適用できます（結果を次の入力として再利用）。</li>
        </ul>
      </TipsCard>
    </div>
  );
}
