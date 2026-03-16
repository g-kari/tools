import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  parseConventionalCommit,
  getCommitTypeInfo,
  COMMIT_TYPES,
  COMMIT_EXAMPLES,
  type ParsedCommit,
} from "~/utils/conventional-commits";

export const Route = createFileRoute("/conventional-commits")({
  head: () => ({
    meta: [
      { title: "Conventional Commits バリデーター | Web ツール集" },
      {
        name: "description",
        content:
          "Git コミットメッセージを Conventional Commits 仕様でパース・検証するツール。タイプ・スコープ・説明・ボディ・フッターを解析し、BREAKING CHANGE の検出、エラー・警告の表示に対応。",
      },
      {
        property: "og:title",
        content: "Conventional Commits バリデーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "Git コミットメッセージを Conventional Commits 仕様でパース・検証するツール。BREAKING CHANGE の検出・エラー・警告の表示に対応。",
      },
      {
        property: "og:url",
        content: `${SITE_BASE_URL}/conventional-commits`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "Conventional Commits バリデーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "Git コミットメッセージを Conventional Commits 仕様でパース・検証するツール。",
      },
    ],
  }),
  component: ConventionalCommitsPage,
});

/** コンポーネントアイテム表示 */
function ComponentItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | boolean;
  highlight?: boolean;
}) {
  const isNull = value === null;
  const isBool = typeof value === "boolean";
  const displayValue = isBool ? (value ? "あり" : "なし") : value;

  return (
    <div className="cc-component-item">
      <span className="cc-component-label">{label}</span>
      {isNull ? (
        <span className="cc-component-value cc-component-value-null">なし</span>
      ) : (
        <span
          className={`cc-component-value${highlight ? " cc-breaking-text" : ""}`}
          aria-label={`${label}: ${displayValue}`}
        >
          {displayValue as string}
        </span>
      )}
    </div>
  );
}

/** パース結果パネル */
function ParseResult({ parsed }: { parsed: ParsedCommit }) {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus } = useStatusAnnouncement();

  const handleCopyMessage = useCallback(async () => {
    const success = await copy(parsed.raw);
    if (success) {
      showToast("コミットメッセージをコピーしました", "success");
      announceStatus("コミットメッセージをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [parsed.raw, copy, showToast, announceStatus]);

  const typeInfo = parsed.type ? getCommitTypeInfo(parsed.type) : null;

  return (
    <div aria-live="polite" aria-label="パース結果">
      {/* ステータス行 */}
      <div className="cc-status-row">
        {parsed.valid ? (
          <span className="cc-status-badge cc-status-badge-valid" role="status">
            ✓ 有効
          </span>
        ) : (
          <span
            className="cc-status-badge cc-status-badge-invalid"
            role="status"
          >
            ✕ 無効
          </span>
        )}
        {parsed.valid && parsed.warnings.length > 0 && (
          <span
            className="cc-status-badge cc-status-badge-warning"
            role="status"
          >
            ⚠ 警告 {parsed.warnings.length}件
          </span>
        )}
        {parsed.isBreaking && (
          <span className="cc-breaking-badge" role="status">
            💥 BREAKING CHANGE
          </span>
        )}
      </div>

      {/* ヘッダー行ビジュアル */}
      {(parsed.type || parsed.description) && (
        <div className="cc-header-result" aria-label="ヘッダー行の解析">
          {parsed.type && (
            <span
              className="cc-token cc-token-type"
              title={typeInfo ? typeInfo.description : "コミットタイプ"}
            >
              {typeInfo ? `${typeInfo.emoji} ` : ""}
              {parsed.type}
            </span>
          )}
          {parsed.scope && (
            <>
              <span className="cc-token-separator">(</span>
              <span className="cc-token cc-token-scope">{parsed.scope}</span>
              <span className="cc-token-separator">)</span>
            </>
          )}
          {parsed.breakingMark && (
            <span className="cc-token cc-token-breaking">!</span>
          )}
          {parsed.description && (
            <>
              <span className="cc-token-separator">:</span>
              <span className="cc-token-description">{parsed.description}</span>
            </>
          )}
        </div>
      )}

      {/* コンポーネント詳細 */}
      <div className="cc-section">
        <div className="cc-section-title">解析結果</div>
        <div className="cc-components-grid">
          <ComponentItem label="Type" value={parsed.type} />
          <ComponentItem label="Scope" value={parsed.scope} />
          <ComponentItem label="Description" value={parsed.description} />
          <ComponentItem
            label="Breaking (!)"
            value={parsed.breakingMark}
          />
        </div>
      </div>

      {/* ボディ */}
      {parsed.body && (
        <div className="cc-section">
          <div className="cc-section-title">Body</div>
          <pre className="cc-body-block" aria-label="コミットボディ">
            {parsed.body}
          </pre>
        </div>
      )}

      {/* フッター */}
      {parsed.footers.length > 0 && (
        <div className="cc-section">
          <div className="cc-section-title">
            Footers ({parsed.footers.length})
          </div>
          <div className="cc-footers">
            {parsed.footers.map((footer, i) => (
              <div
                key={i}
                className={`cc-footer-item${footer.isBreaking ? " cc-footer-item-breaking" : ""}`}
                aria-label={`${footer.token}: ${footer.value}`}
              >
                <span
                  className={`cc-footer-token${footer.isBreaking ? " cc-footer-token-breaking" : ""}`}
                >
                  {footer.isBreaking ? "💥 " : ""}
                  {footer.token}
                  {footer.separator}
                </span>
                <span className="cc-footer-value">{footer.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* エラー */}
      {parsed.errors.length > 0 && (
        <div className="cc-section">
          <div className="cc-section-title">
            エラー ({parsed.errors.length})
          </div>
          <div className="cc-issue-list" role="list" aria-label="エラー一覧">
            {parsed.errors.map((err, i) => (
              <div
                key={i}
                className="cc-issue-item cc-issue-item-error"
                role="listitem"
              >
                <span className="cc-issue-icon" aria-hidden="true">
                  ✕
                </span>
                <span className="cc-issue-text">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 警告 */}
      {parsed.warnings.length > 0 && (
        <div className="cc-section">
          <div className="cc-section-title">
            警告 ({parsed.warnings.length})
          </div>
          <div className="cc-issue-list" role="list" aria-label="警告一覧">
            {parsed.warnings.map((warn, i) => (
              <div
                key={i}
                className="cc-issue-item cc-issue-item-warning"
                role="listitem"
              >
                <span className="cc-issue-icon" aria-hidden="true">
                  ⚠
                </span>
                <span className="cc-issue-text">{warn.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コピーボタン */}
      {parsed.raw.trim() && (
        <div className="cc-actions">
          <button className="btn-secondary" onClick={handleCopyMessage}>
            メッセージをコピー
          </button>
        </div>
      )}
    </div>
  );
}

/** メインコンポーネント */
function ConventionalCommitsPage() {
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const [message, setMessage] = useState("");
  const [parsed, setParsed] = useState<ParsedCommit | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // デバウンスしてリアルタイムパース
  useEffect(() => {
    if (parseTimerRef.current) {
      clearTimeout(parseTimerRef.current);
    }

    if (!message.trim()) {
      setParsed(null);
      return;
    }

    parseTimerRef.current = setTimeout(() => {
      const result = parseConventionalCommit(message);
      setParsed(result);
    }, 100);

    return () => {
      if (parseTimerRef.current) {
        clearTimeout(parseTimerRef.current);
      }
    };
  }, [message]);

  // 初期フォーカス
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setMessage("");
    setParsed(null);
    announceStatus("入力をクリアしました");
    textareaRef.current?.focus();
  }, [announceStatus]);

  const handleExample = useCallback(
    (value: string) => {
      setMessage(value);
      announceStatus("サンプルを読み込みました");
      textareaRef.current?.focus();
    },
    [announceStatus]
  );

  const headerLength = message.split("\n")[0]?.length ?? 0;
  const charCountClass =
    headerLength > 100
      ? "cc-char-count cc-char-count-error"
      : headerLength > 72
        ? "cc-char-count cc-char-count-warn"
        : "cc-char-count";

  return (
    <>
      <div className="tool-container">
        {/* サンプル例 */}
        <div className="cc-examples">
          <span className="cc-example-label">例:</span>
          {COMMIT_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              className="cc-example-btn"
              onClick={() => handleExample(ex.value)}
              aria-label={`${ex.label} のサンプルを入力`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* 入力エリア */}
        <div className="cc-input-area">
          <label htmlFor="cc-message" className="converter-label">
            コミットメッセージ
          </label>
          <textarea
            id="cc-message"
            ref={textareaRef}
            className="cc-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`feat(scope): add new feature\n\nOptional commit body.\n\nBREAKING CHANGE: description of breaking change`}
            spellCheck={false}
            aria-label="コミットメッセージ入力"
          />
          <div className={charCountClass} aria-live="polite">
            ヘッダー行: {headerLength}文字
            {headerLength > 100 && " ⚠ 長すぎます"}
            {headerLength > 72 && headerLength <= 100 && " (長め)"}
          </div>
        </div>

        {/* クリアボタン */}
        {message.length > 0 && (
          <div className="cc-actions">
            <button
              className="btn-secondary"
              onClick={handleClear}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>
        )}

        {/* パース結果 */}
        {parsed ? (
          <ParseResult parsed={parsed} />
        ) : (
          <div className="cc-empty" aria-label="入力待ち">
            コミットメッセージを入力してください
          </div>
        )}
      </div>

      {/* タイプリファレンス */}
      <div className="tool-container">
        <div className="cc-section-title">コミットタイプ リファレンス</div>
        <div className="cc-types-grid">
          {COMMIT_TYPES.map((t) => (
            <div
              key={t.type}
              className="cc-type-row"
              aria-label={`${t.type}: ${t.description}`}
            >
              <span className="cc-type-emoji" aria-hidden="true">
                {t.emoji}
              </span>
              <span className="cc-type-name">{t.type}</span>
              <span className="cc-type-desc">{t.description}</span>
              <span
                className={`cc-bump-badge cc-bump-${t.bump}`}
                title={`バージョンバンプ: ${t.bump}`}
              >
                {t.bump}
              </span>
            </div>
          ))}
        </div>
      </div>

      <TipsCard
        tips={[
          "Conventional Commits はコミットメッセージを標準化し、セマンティックバージョニングの自動化を可能にします",
          "「feat」は新機能（MINOR バンプ）、「fix」はバグ修正（PATCH バンプ）を意味します",
          "BREAKING CHANGE は「!」マーク（feat!:）またはフッター（BREAKING CHANGE: ...）で示します。どちらも MAJOR バンプに相当します",
          "スコープは括弧で囲みます: feat(auth): などの形式で変更対象を明示できます",
          "ヘッダー行（1行目）は 72 文字以内を推奨します。100 文字を超えると一部ツールで表示が崩れる場合があります",
          "ボディやフッターを書く場合は、ヘッダー行との間に必ず空行を入れてください",
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
