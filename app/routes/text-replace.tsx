import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  replaceText,
  findMatches,
  type ReplaceOptions,
  type MatchRange,
} from "~/utils/text-replace";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/text-replace")({
  head: () => ({
    meta: [
      { title: "テキスト置換 | Web ツール集" },
      {
        name: "description",
        content:
          "正規表現対応のテキスト検索・置換ツール。大文字小文字区別・全件/1件置換・複数行モードに対応。マッチ箇所をハイライト表示。",
      },
      { property: "og:title", content: "テキスト置換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "正規表現対応のテキスト検索・置換ツール。大文字小文字区別・全件/1件置換・複数行モードに対応。マッチ箇所をハイライト表示。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/text-replace` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: TextReplacePage,
});

/**
 * テキストをパーツに分割してハイライト表示するコンポーネント
 */
function HighlightedText({
  text,
  matches,
}: {
  text: string;
  matches: MatchRange[];
}) {
  if (matches.length === 0) {
    return <>{text}</>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const range of matches) {
    if (range.start > lastIndex) {
      parts.push(text.slice(lastIndex, range.start));
    }
    parts.push(
      <mark key={range.start}>{text.slice(range.start, range.end)}</mark>
    );
    lastIndex = range.end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

/**
 * テキスト置換ページコンポーネント
 */
function TextReplacePage() {
  const [inputText, setInputText] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [options, setOptions] = useState<ReplaceOptions>({
    useRegex: false,
    caseSensitive: false,
    replaceAll: true,
    multiline: false,
  });

  const { copy } = useClipboard();
  const { showToast } = useToast();

  const toggleOption = useCallback(
    (key: keyof ReplaceOptions) => {
      setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  // マッチ位置を計算（常に全件検索でハイライト用）
  const { matches, findError } = useMemo(() => {
    if (!inputText || !findText) return { matches: [], findError: undefined };
    const result = findMatches(inputText, findText, {
      ...options,
      replaceAll: true,
    });
    return { matches: result.matches, findError: result.error };
  }, [inputText, findText, options]);

  // 置換結果を計算
  const replaceResult = useMemo(() => {
    if (!inputText || !findText) return null;
    return replaceText(inputText, findText, replaceWith, options);
  }, [inputText, findText, replaceWith, options]);

  const handleCopyOutput = async () => {
    const output = replaceResult?.output ?? "";
    if (!output) return;
    const success = await copy(output);
    if (success) {
      showToast("置換後テキストをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  };

  const handleClearInput = () => {
    setInputText("");
    setFindText("");
    setReplaceWith("");
  };

  const hasInput = inputText.length > 0;
  const hasFind = findText.length > 0;
  const hasOutput = replaceResult !== null && replaceResult.matchCount > 0;

  return (
    <div className="tool-container">
      {/* オプション切り替え */}
      <div className="text-replace-options" role="group" aria-label="検索オプション">
        {(
          [
            { key: "useRegex", label: "正規表現", title: "正規表現モードで検索" },
            { key: "caseSensitive", label: "大文字小文字区別", title: "大文字と小文字を区別する" },
            { key: "replaceAll", label: "全件置換", title: "マッチした全箇所を置換（OFFの場合は最初の1件のみ）" },
            { key: "multiline", label: "複数行", title: "複数行モード（^/$が各行の先頭末尾にマッチ）" },
          ] as const
        ).map(({ key, label, title }) => (
          <label
            key={key}
            className={`text-replace-option-label${options[key] ? " active" : ""}`}
            title={title}
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={() => toggleOption(key)}
              aria-label={label}
            />
            {label}
          </label>
        ))}
      </div>

      {/* 検索・置換入力 */}
      <div className="text-replace-find-row">
        <div className="text-replace-input-group">
          <label htmlFor="find-input">検索</label>
          <input
            id="find-input"
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder={options.useRegex ? "正規表現パターン（例: \\d+）" : "検索する文字列"}
            className={options.useRegex ? "regex-active" : ""}
            aria-describedby={findError ? "find-error" : undefined}
          />
          {findError && (
            <span id="find-error" className="text-replace-match-badge error" role="alert">
              ⚠ 正規表現エラー: {findError}
            </span>
          )}
        </div>

        <div className="text-replace-arrow" aria-hidden="true">→</div>

        <div className="text-replace-input-group">
          <label htmlFor="replace-input">置換後</label>
          <input
            id="replace-input"
            type="text"
            value={replaceWith}
            onChange={(e) => setReplaceWith(e.target.value)}
            placeholder={options.useRegex ? "置換文字列（$1 等バックリファレンス可）" : "置換後の文字列（空欄で削除）"}
          />
        </div>
      </div>

      {/* マッチ件数バッジ */}
      {hasInput && hasFind && !findError && (
        <div
          className={`text-replace-match-badge ${matches.length > 0 ? "has-matches" : "no-matches"}`}
          aria-live="polite"
          role="status"
        >
          {matches.length > 0
            ? `${matches.length} 件マッチ`
            : "マッチなし"}
          {!options.replaceAll && matches.length > 1 && " （1件のみ置換）"}
        </div>
      )}

      {/* 入力テキスト（ハイライト表示） */}
      <div className="converter-section">
        <label htmlFor="input-text">入力テキスト</label>
        <textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="テキストを入力してください..."
          rows={8}
          aria-label="置換対象テキスト"
        />
      </div>

      {/* マッチハイライトプレビュー */}
      {hasInput && hasFind && !findError && matches.length > 0 && (
        <div className="text-replace-highlight-wrap">
          <span className="text-replace-highlight-label">
            マッチ箇所のプレビュー
          </span>
          <div
            className="text-replace-highlight-box"
            aria-label="マッチ箇所のハイライト表示"
          >
            <HighlightedText text={inputText} matches={matches} />
          </div>
        </div>
      )}

      {/* 置換結果 */}
      <div className="output-section">
        <div className="text-replace-output-header">
          <label htmlFor="output-text">置換後テキスト</label>
          <div className="text-replace-output-actions">
            <button
              className="text-replace-output-btn"
              onClick={handleCopyOutput}
              disabled={!hasOutput}
              aria-label="置換後テキストをコピー"
            >
              コピー
            </button>
            <button
              className="text-replace-output-btn"
              onClick={handleClearInput}
              disabled={!hasInput}
              aria-label="すべてクリア"
            >
              クリア
            </button>
          </div>
        </div>
        <textarea
          id="output-text"
          value={replaceResult?.output ?? ""}
          readOnly
          placeholder="置換結果がここに表示されます..."
          rows={8}
          aria-label="置換後テキスト（読み取り専用）"
          aria-readonly="true"
        />
      </div>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "「入力テキスト」に置換対象のテキストを貼り付けます",
              "「検索」欄に探したい文字列を入力します",
              "「置換後」欄に変換後の文字列を入力します（空欄で削除）",
              "マッチした箇所はプレビューでハイライト表示されます",
            ],
          },
          {
            title: "正規表現モード",
            items: [
              "「正規表現」をONにすると正規表現パターンで検索できます",
              "例: \\d+ で数字列にマッチ、[a-z]+ で小文字英字にマッチ",
              "置換後にはキャプチャグループの参照（$1, $2）が使えます",
              "例: (\\w+)@(\\w+) → $2@$1 でメールアドレスを逆順に",
            ],
          },
          {
            title: "オプション",
            items: [
              "大文字小文字区別: ONで Hello と hello を区別",
              "全件置換: OFFにすると最初の1件だけ置換",
              "複数行: ONで ^ が各行の先頭、$ が各行の末尾にマッチ",
            ],
          },
        ]}
      />
    </div>
  );
}
