import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";

export const Route = createFileRoute("/uuid")({
  head: () => ({
    meta: [{ title: "UUID生成ツール" }],
  }),
  component: UuidGenerator,
});

function generateUUID(): string {
  return crypto.randomUUID();
}

function UuidGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedAllTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      if (copiedAllTimeoutRef.current) {
        clearTimeout(copiedAllTimeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const formatUUID = useCallback(
    (uuid: string): string => {
      let result = uuid;
      if (noHyphens) {
        result = result.replace(/-/g, "");
      }
      if (uppercase) {
        result = result.toUpperCase();
      }
      return result;
    },
    [uppercase, noHyphens]
  );

  const handleGenerate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
    setCopied(null);
    setCopiedAll(false);
    announceStatus(`${count}個のUUIDを生成しました`);
  }, [count, announceStatus]);

  const handleCopy = useCallback(
    async (index: number) => {
      const uuid = formatUUID(uuids[index]);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(uuid);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = uuid;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
        setCopied(index);
        announceStatus("UUIDをコピーしました");
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => setCopied(null), 2000);
      } catch {
        announceStatus("コピーに失敗しました");
      }
    },
    [uuids, formatUUID, announceStatus]
  );

  const handleCopyAll = useCallback(async () => {
    const allUuids = uuids.map(formatUUID).join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(allUuids);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = allUuids;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedAll(true);
      announceStatus("すべてのUUIDをコピーしました");
      if (copiedAllTimeoutRef.current) {
        clearTimeout(copiedAllTimeoutRef.current);
      }
      copiedAllTimeoutRef.current = setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      announceStatus("コピーに失敗しました");
    }
  }, [uuids, formatUUID, announceStatus]);

  const handleClear = useCallback(() => {
    setUuids([]);
    setCopied(null);
    setCopiedAll(false);
    announceStatus("UUIDをクリアしました");
  }, [announceStatus]);

  // Generate one UUID on initial load
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          aria-label="UUID生成フォーム"
        >
          <div className="converter-section">
            <h2 className="section-title">UUID生成設定</h2>

            <div className="uuid-options">
              <div className="option-group">
                <label htmlFor="count">生成数:</label>
                <input
                  type="number"
                  id="count"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) =>
                    setCount(
                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                    )
                  }
                  aria-describedby="count-help"
                />
                <span id="count-help" className="sr-only">
                  1から100の間で生成するUUIDの数を指定できます
                </span>
              </div>

              <div className="option-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={uppercase}
                    onChange={(e) => setUppercase(e.target.checked)}
                  />
                  大文字で表示
                </label>
              </div>

              <div className="option-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={noHyphens}
                    onChange={(e) => setNoHyphens(e.target.checked)}
                  />
                  ハイフンなし
                </label>
              </div>
            </div>

            <div className="button-group" role="group" aria-label="UUID操作">
              <button type="submit" className="btn-primary">
                UUID生成
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                disabled={uuids.length === 0}
              >
                クリア
              </button>
            </div>
          </div>

          {uuids.length > 0 && (
            <div className="converter-section">
              <div className="uuid-result-header">
                <h2 className="section-title">生成結果</h2>
                {uuids.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? "コピーしました" : "すべてコピー"}
                  </button>
                )}
              </div>

              <div className="uuid-list" role="list" aria-live="polite">
                {uuids.map((uuid, index) => (
                  <div key={index} className="uuid-item" role="listitem">
                    <code className="uuid-value">{formatUUID(uuid)}</code>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(index)}
                      aria-label={`UUID ${index + 1}をコピー`}
                    >
                      {copied === index ? "済" : "コピー"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">UUIDとは</h3>
          <ul>
            <li>
              UUID（Universally Unique Identifier）は128ビットの一意識別子です
            </li>
            <li>このツールはUUID v4（ランダム生成）を使用しています</li>
            <li>形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx</li>
            <li>衝突確率は実用上ほぼゼロです</li>
          </ul>
          <h3 id="about-tool-title">使い方</h3>
          <ul>
            <li>「UUID生成」ボタンで新しいUUIDを生成します</li>
            <li>生成数を変更して複数のUUIDを一度に生成できます</li>
            <li>大文字表示やハイフンなしの形式も選択可能です</li>
            <li>各UUIDの「コピー」ボタンでクリップボードにコピーできます</li>
          </ul>
        </aside>
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <style>{`
        .uuid-options {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .option-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .option-group label {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
        }

        .option-group input[type="number"] {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid var(--md-sys-color-outline);
          border-radius: 8px;
          font-size: 1rem;
          background-color: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--md-sys-color-primary);
        }

        .uuid-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .uuid-result-header .section-title {
          margin-bottom: 0;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .uuid-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .uuid-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: 8px;
        }

        .uuid-value {
          font-family: 'Roboto Mono', monospace;
          font-size: 1rem;
          color: var(--md-sys-color-on-surface);
          user-select: all;
          word-break: break-all;
          flex: 1;
        }

        .btn-copy {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .btn-copy:hover {
          background-color: var(--md-sys-color-secondary);
          color: var(--md-sys-color-on-secondary);
        }

        @media (max-width: 480px) {
          .uuid-options {
            flex-direction: column;
            align-items: flex-start;
          }

          .uuid-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .uuid-value {
            font-size: 0.875rem;
          }

          .btn-copy {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
}
