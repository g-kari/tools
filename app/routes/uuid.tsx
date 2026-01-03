import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoBox } from "@/components/InfoBox";

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
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedAllTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
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
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      return true;
    } catch {
      return false;
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
      const success = await copyToClipboard(uuid);
      if (success) {
        setCopied(index);
        announceStatus("UUIDをコピーしました");
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => setCopied(null), 2000);
      } else {
        announceStatus("コピーに失敗しました");
      }
    },
    [uuids, formatUUID, copyToClipboard, announceStatus]
  );

  const handleCopyAll = useCallback(async () => {
    const allUuids = uuids.map(formatUUID).join("\n");
    const success = await copyToClipboard(allUuids);
    if (success) {
      setCopiedAll(true);
      announceStatus("すべてのUUIDをコピーしました");
      if (copiedAllTimeoutRef.current) {
        clearTimeout(copiedAllTimeoutRef.current);
      }
      copiedAllTimeoutRef.current = setTimeout(() => setCopiedAll(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
    }
  }, [uuids, formatUUID, copyToClipboard, announceStatus]);

  const handleClear = useCallback(() => {
    setUuids([]);
    setCopied(null);
    setCopiedAll(false);
    announceStatus("UUIDをクリアしました");
  }, [announceStatus]);

  // Generate one UUID on initial load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      handleGenerate();
    }
  }, [handleGenerate]);

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
                <Label htmlFor="count">生成数:</Label>
                <Input
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
                  className="w-20"
                />
                <span id="count-help" className="sr-only">
                  1から100の間で生成するUUIDの数を指定できます
                </span>
              </div>

              <div className="option-group checkbox-group">
                <Checkbox
                  id="uppercase"
                  checked={uppercase}
                  onCheckedChange={setUppercase}
                />
                <Label htmlFor="uppercase" className="cursor-pointer">
                  大文字で表示
                </Label>
              </div>

              <div className="option-group checkbox-group">
                <Checkbox
                  id="noHyphens"
                  checked={noHyphens}
                  onCheckedChange={setNoHyphens}
                />
                <Label htmlFor="noHyphens" className="cursor-pointer">
                  ハイフンなし
                </Label>
              </div>
            </div>

            <div className="button-group" role="group" aria-label="UUID操作">
              <Button type="submit" className="btn-primary">
                UUID生成
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={uuids.length === 0}
                className="btn-clear"
              >
                クリア
              </Button>
            </div>
          </div>

          {uuids.length > 0 && (
            <div className="converter-section">
              <div className="uuid-result-header">
                <h2 className="section-title">生成結果</h2>
                {uuids.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? "コピーしました" : "すべてコピー"}
                  </Button>
                )}
              </div>

              <div className="uuid-list" role="list" aria-live="polite">
                {uuids.map((uuid, index) => (
                  <div key={index} className="uuid-item" role="listitem">
                    <code className="uuid-value">{formatUUID(uuid)}</code>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(index)}
                      aria-label={`UUID ${index + 1}をコピー`}
                      className="btn-copy"
                    >
                      {copied === index ? "済" : "コピー"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <InfoBox
          sections={[
            {
              title: "UUIDとは",
              items: [
                "UUID（Universally Unique Identifier）は128ビットの一意識別子です",
                "このツールはUUID v4（ランダム生成）を使用しています",
                "形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
                "衝突確率は実用上ほぼゼロです",
              ],
            },
            {
              title: "使い方",
              items: [
                "「UUID生成」ボタンで新しいUUIDを生成します",
                "生成数を変更して複数のUUIDを一度に生成できます",
                "大文字表示やハイフンなしの形式も選択可能です",
                "各UUIDの「コピー」ボタンでクリップボードにコピーできます",
              ],
            },
          ]}
        />
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

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        }
      `}</style>
    </>
  );
}
