import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  type KeyEventInfo,
  formatKeyEventInfo,
  getKeyDisplayName,
  isModifierKey,
} from "~/utils/keycode";
import "~/styles/tools/keycode.css";

export const Route = createFileRoute("/keycode")({
  head: () => ({
    meta: [
      { title: "キーコードチェック | Web ツール集" },
      {
        name: "description",
        content:
          "キーボードキー押下時のイベント情報（key, code, keyCode など）をリアルタイムで確認できるツール。",
      },
      { property: "og:title", content: "キーコードチェック | Web ツール集" },
      {
        property: "og:description",
        content:
          "キーボードキー押下時のイベント情報（key, code, keyCode など）をリアルタイムで確認できるツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/keycode` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "キーコードチェック | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "キーボードキー押下時のイベント情報（key, code, keyCode など）をリアルタイムで確認できるツール。",
      },
    ],
  }),
  component: KeycodeChecker,
});

/** 履歴の最大保持件数 */
const MAX_HISTORY = 10;

/** キーイベント情報のテーブル行定義 */
interface KeyInfoRow {
  label: string;
  field: keyof KeyEventInfo;
  isBoolean?: boolean;
}

const KEY_INFO_ROWS: KeyInfoRow[] = [
  { label: "key", field: "key" },
  { label: "code", field: "code" },
  { label: "keyCode", field: "keyCode" },
  { label: "which", field: "which" },
  { label: "charCode", field: "charCode" },
  { label: "ctrlKey", field: "ctrlKey", isBoolean: true },
  { label: "shiftKey", field: "shiftKey", isBoolean: true },
  { label: "altKey", field: "altKey", isBoolean: true },
  { label: "metaKey", field: "metaKey", isBoolean: true },
  { label: "type", field: "type" },
];

function KeycodeChecker() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const [currentEvent, setCurrentEvent] = useState<KeyEventInfo | null>(null);
  const [history, setHistory] = useState<KeyEventInfo[]>([]);
  const captureAreaRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ページ内のキーボードショートカットと競合しないよう、デフォルトの動作は維持
    const info = formatKeyEventInfo(e);
    setCurrentEvent(info);
    setHistory((prev) => [info, ...prev].slice(0, MAX_HISTORY));
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleCopy = useCallback(
    (value: string, label: string) => {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          showToast(`${label} をコピーしました: ${value}`, "success");
          announceStatus(`${label} をコピーしました`);
        })
        .catch(() => {
          showToast("コピーに失敗しました", "error");
        });
    },
    [showToast, announceStatus]
  );

  const handleClear = useCallback(() => {
    setCurrentEvent(null);
    setHistory([]);
    announceStatus("履歴をクリアしました");
    captureAreaRef.current?.focus();
  }, [announceStatus]);

  const getValueString = (info: KeyEventInfo, field: keyof KeyEventInfo): string => {
    const val = info[field];
    return String(val);
  };

  const renderTableValue = (info: KeyEventInfo, row: KeyInfoRow) => {
    const value = info[row.field];
    if (row.isBoolean) {
      return (
        <span
          className={`kc-table-value ${value ? "kc-boolean-true" : "kc-boolean-false"}`}
        >
          {String(value)}
        </span>
      );
    }
    return (
      <span className="kc-table-value">
        {row.field === "key" ? getKeyDisplayName(String(value)) : String(value)}
      </span>
    );
  };

  const getActiveModifiers = (info: KeyEventInfo) => {
    const mods: string[] = [];
    if (info.ctrlKey) mods.push("Ctrl");
    if (info.shiftKey) mods.push("Shift");
    if (info.altKey) mods.push("Alt");
    if (info.metaKey) mods.push("Meta");
    return mods;
  };

  return (
    <>
      <div className="tool-container">
        <div className="kc-container">
          {/* キャプチャエリア */}
          <div
            ref={captureAreaRef}
            className={`kc-capture-area ${currentEvent ? "kc-active" : ""}`}
            role="region"
            aria-label="キーボードキャプチャエリア。キーを押してください。"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={0}
          >
            {currentEvent ? (
              <>
                <span className="kc-capture-icon" aria-hidden="true">
                  ⌨️
                </span>
                <strong>
                  {getKeyDisplayName(currentEvent.key)}
                </strong>
                <span className="kc-capture-hint">
                  code: {currentEvent.code}
                </span>
              </>
            ) : (
              <>
                <span className="kc-capture-icon" aria-hidden="true">
                  ⌨️
                </span>
                <span>キーボードのキーを押してください</span>
                <span className="kc-capture-hint">
                  押下したキーのイベント情報が表示されます
                </span>
              </>
            )}
          </div>

          {/* 現在のキーイベント詳細 */}
          {currentEvent && (
            <section className="kc-info-section" aria-labelledby="kc-info-title">
              <div className="kc-section-header">
                <h2 id="kc-info-title" className="kc-section-title">
                  キーイベント情報
                </h2>
              </div>

              {/* 修飾キー状態 */}
              <div className="kc-modifier-group" role="group" aria-label="修飾キーの状態">
                {[
                  { label: "Ctrl", active: currentEvent.ctrlKey },
                  { label: "Shift", active: currentEvent.shiftKey },
                  { label: "Alt", active: currentEvent.altKey },
                  { label: "Meta", active: currentEvent.metaKey },
                ].map(({ label, active }) => (
                  <span
                    key={label}
                    className={`kc-modifier-badge ${active ? "kc-active" : ""}`}
                    aria-label={`${label}: ${active ? "押下中" : "未押下"}`}
                  >
                    {label}
                    {active && " ✓"}
                  </span>
                ))}
              </div>

              {/* キー情報テーブル */}
              <div
                className="kc-table"
                role="table"
                aria-label="キーイベントプロパティ一覧"
              >
                {KEY_INFO_ROWS.map((row) => (
                  <div
                    key={row.field}
                    className="kc-table-row"
                    role="row"
                  >
                    <span className="kc-table-label" role="rowheader">
                      {row.label}
                    </span>
                    <span role="cell">
                      {renderTableValue(currentEvent, row)}
                    </span>
                    <span role="cell">
                      <button
                        type="button"
                        className="kc-copy-btn"
                        aria-label={`${row.label} の値をコピー`}
                        onClick={() =>
                          handleCopy(
                            getValueString(currentEvent, row.field),
                            row.label
                          )
                        }
                      >
                        📋
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 履歴セクション */}
          <section className="kc-history-section" aria-labelledby="kc-history-title">
            <div className="kc-section-header">
              <h2 id="kc-history-title" className="kc-section-title">
                キー履歴（最新 {MAX_HISTORY} 件）
              </h2>
              {history.length > 0 && (
                <div className="kc-actions">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-clear"
                    onClick={handleClear}
                    aria-label="履歴をすべてクリア"
                  >
                    クリア
                  </Button>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="kc-empty-state" aria-live="polite">
                キーを押すと履歴が表示されます
              </div>
            ) : (
              <ol
                className="kc-history-list"
                aria-label="キー押下履歴リスト"
              >
                {history.map((item, index) => {
                  const mods = getActiveModifiers(item);
                  return (
                    <li key={index} className="kc-history-item">
                      <span className="kc-history-key">
                        {isModifierKey(item.key)
                          ? item.key
                          : getKeyDisplayName(item.key)}
                      </span>
                      <span className="kc-history-code" aria-label={`code: ${item.code}`}>
                        {item.code}
                      </span>
                      {mods.length > 0 && (
                        <span className="kc-history-modifiers" aria-label={`修飾キー: ${mods.join(", ")}`}>
                          {mods.map((mod) => (
                            <span key={mod} className="kc-history-mod-badge">
                              {mod}
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "ページ上でキーボードのキーを押すと、イベント情報が表示されます",
                "key: 押したキーの値（例: \"a\", \"Enter\", \"ArrowUp\"）",
                "code: 物理キーのコード（例: \"KeyA\", \"Enter\"）",
                "keyCode / which: 非推奨だが参考情報として表示",
                "各値の 📋 ボタンでクリップボードにコピー可能",
                "履歴は最新 10 件を保持します",
              ],
            },
            {
              title: "key と code の違い",
              items: [
                "key: キーが表す文字や機能（ロケール・レイアウト依存）",
                "code: 物理キーの位置（レイアウトに依存しない）",
                "例: 日本語キーボードで「A」を押すと key=\"a\", code=\"KeyA\"",
                "Shift + A では key=\"A\", code=\"KeyA\"",
                "新しい実装では keyCode や which の代わりに key / code を使用推奨",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
