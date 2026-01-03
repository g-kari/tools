import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { convertIP, type IPConversionResult } from "../utils/ip-converter";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/ip-converter")({
  head: () => ({
    meta: [{ title: "IP変換 - Webツール集" }],
  }),
  component: IPConverter,
});

function IPConverter() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<IPConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError("IPアドレスまたは数値を入力してください");
      announceStatus("エラー: IPアドレスまたは数値を入力してください");
      setResult(null);
      inputRef.current?.focus();
      return;
    }

    try {
      const converted = convertIP(input.trim());
      setResult(converted);
      setError(null);
      announceStatus("変換が完了しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "変換エラーが発生しました";
      setError(message);
      setResult(null);
      announceStatus("エラー: " + message);
    }
  }, [input, announceStatus]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        announceStatus("コピーに失敗しました");
      }
    },
    [announceStatus]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement)?.id === "ipInput") {
        e.preventDefault();
        handleConvert();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleConvert]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatInteger = (num: number): string => {
    return num.toLocaleString("ja-JP");
  };

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="IP変換フォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="ipInput">IPアドレス</label>
                <Input
                  type="text"
                  id="ipInput"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="192.168.1.1 または C0.A8.01.01 または 3232235777"
                  aria-describedby="ip-help"
                  aria-label="IPアドレスまたは数値を入力"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <Button
                type="submit"
                onClick={handleConvert}
                aria-label="IP変換を実行"
              >
                変換
              </Button>
            </div>
            <span id="ip-help" className="sr-only">
              IPアドレス、16進数、2進数、または整数形式で入力してください
            </span>
          </div>
        </form>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {result && !error && (
          <>
            <section aria-labelledby="decimal-title">
              <h2 id="decimal-title" className="section-title">
                10進数表記
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">ドット記法</div>
                  <div className="result-value">
                    {result.decimal}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(result.decimal, "10進数表記")}
                      aria-label="10進数表記をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">整数</div>
                  <div className="result-value">
                    {formatInteger(result.integer)}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.integer.toString(), "整数表記")
                      }
                      aria-label="整数表記をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="hex-title">
              <h2 id="hex-title" className="section-title">
                16進数表記
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">ドット記法</div>
                  <div className="result-value cidr-binary">
                    {result.hexDotted}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.hexDotted, "16進数ドット記法")
                      }
                      aria-label="16進数ドット記法をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">0xプレフィックス</div>
                  <div className="result-value cidr-binary">
                    {result.hexSolid}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.hexSolid, "16進数0x形式")
                      }
                      aria-label="16進数0x形式をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="binary-title">
              <h2 id="binary-title" className="section-title">
                2進数表記
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">ドット記法</div>
                  <div className="result-value cidr-binary">
                    {result.binaryDotted}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.binaryDotted, "2進数ドット記法")
                      }
                      aria-label="2進数ドット記法をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">32ビット</div>
                  <div className="result-value cidr-binary">
                    {result.binarySolid}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.binarySolid, "2進数32ビット形式")
                      }
                      aria-label="2進数32ビット形式をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "以下のいずれかの形式でIPアドレスを入力",
                "10進数: 192.168.1.1",
                "16進数（ドット）: C0.A8.01.01",
                "16進数（0x）: 0xC0A80101",
                "2進数（ドット）: 11000000.10101000.00000001.00000001",
                "2進数（32ビット）: 11000000101010000000000100000001",
                "整数: 3232235777",
                "各値は「コピー」ボタンでクリップボードにコピー可能",
                "キーボードショートカット: Enterキーで変換実行",
              ],
            },
            {
              title: "対応形式について",
              items: [
                "IPv4アドレスは32ビットの数値で、複数の形式で表現できます",
                "10進数ドット記法: 最も一般的な形式（0-255の4つの数値）",
                "16進数: ネットワーク機器の設定で使用されることがある",
                "2進数: サブネットマスクの理解やネットワーク計算に有用",
                "整数: データベースやプログラミングで使用",
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
    </>
  );
}
