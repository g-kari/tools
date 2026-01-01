import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  isValidCIDR,
  calculateCIDR,
  type CIDRResult,
} from "../utils/cidr";

export const Route = createFileRoute("/cidr")({
  head: () => ({
    meta: [{ title: "CIDR計算 - Webツール集" }],
  }),
  component: CIDRCalculator,
});

function CIDRCalculator() {
  const [cidr, setCidr] = useState("");
  const [result, setResult] = useState<CIDRResult | null>(null);
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

  const handleCalculate = useCallback(() => {
    if (!cidr.trim()) {
      setError("CIDR表記を入力してください（例: 192.168.1.0/24）");
      announceStatus("エラー: CIDR表記を入力してください");
      setResult(null);
      inputRef.current?.focus();
      return;
    }

    try {
      const calculatedResult = calculateCIDR(cidr.trim());
      setResult(calculatedResult);
      setError(null);
      announceStatus("CIDR計算が完了しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "計算エラーが発生しました";
      setError(message);
      setResult(null);
      announceStatus("エラー: " + message);
    }
  }, [cidr, announceStatus]);

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
      if (e.key === "Enter" && (e.target as HTMLElement)?.id === "cidrInput") {
        e.preventDefault();
        handleCalculate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCalculate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString("ja-JP");
  };

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="CIDR計算フォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="cidrInput">CIDR表記</label>
                <input
                  type="text"
                  id="cidrInput"
                  ref={inputRef}
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  placeholder="192.168.1.0/24"
                  aria-describedby="cidr-help"
                  aria-label="CIDR表記を入力"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                onClick={handleCalculate}
                aria-label="CIDR計算を実行"
              >
                計算
              </button>
            </div>
            <span id="cidr-help" className="sr-only">
              IPアドレスとプレフィックス長をスラッシュ区切りで入力してください（例: 192.168.1.0/24）
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
            <section aria-labelledby="network-info-title">
              <h2 id="network-info-title" className="section-title">
                ネットワーク情報
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">CIDR表記</div>
                  <div className="result-value">
                    {result.cidr}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(result.cidr, "CIDR表記")}
                      aria-label="CIDR表記をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">ネットワークアドレス</div>
                  <div className="result-value">
                    {result.networkAddress}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.networkAddress, "ネットワークアドレス")
                      }
                      aria-label="ネットワークアドレスをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">ブロードキャストアドレス</div>
                  <div className="result-value">
                    {result.broadcastAddress}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(
                          result.broadcastAddress,
                          "ブロードキャストアドレス"
                        )
                      }
                      aria-label="ブロードキャストアドレスをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">サブネットマスク</div>
                  <div className="result-value">
                    {result.subnetMask}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.subnetMask, "サブネットマスク")
                      }
                      aria-label="サブネットマスクをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">ワイルドカードマスク</div>
                  <div className="result-value">
                    {result.wildcardMask}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.wildcardMask, "ワイルドカードマスク")
                      }
                      aria-label="ワイルドカードマスクをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="ip-range-title">
              <h2 id="ip-range-title" className="section-title">
                利用可能なIPアドレス範囲
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">最初の利用可能IP</div>
                  <div className="result-value">
                    {result.firstUsableIP}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.firstUsableIP, "最初の利用可能IP")
                      }
                      aria-label="最初の利用可能IPをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">最後の利用可能IP</div>
                  <div className="result-value">
                    {result.lastUsableIP}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(result.lastUsableIP, "最後の利用可能IP")
                      }
                      aria-label="最後の利用可能IPをコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">総IPアドレス数</div>
                  <div className="result-value">
                    {formatNumber(result.totalHosts)}
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">利用可能ホスト数</div>
                  <div className="result-value">
                    {formatNumber(result.usableHosts)}
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="additional-info-title">
              <h2 id="additional-info-title" className="section-title">
                追加情報
              </h2>
              <div className="result-card">
                <div className="result-row">
                  <div className="result-label">IPアドレスクラス</div>
                  <div className="result-value">{result.ipClass}</div>
                </div>
                <div className="result-row">
                  <div className="result-label">プライベートIP範囲</div>
                  <div className="result-value">
                    {result.isPrivate ? "はい" : "いいえ"}
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label">サブネットマスク（2進数）</div>
                  <div className="result-value cidr-binary">
                    {result.binarySubnetMask}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() =>
                        handleCopy(
                          result.binarySubnetMask,
                          "サブネットマスク（2進数）"
                        )
                      }
                      aria-label="サブネットマスク（2進数）をコピー"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>
              CIDR表記（例: 192.168.1.0/24）を入力して「計算」ボタンをクリック
            </li>
            <li>
              ネットワークアドレス、ブロードキャストアドレス、サブネットマスク等を表示
            </li>
            <li>利用可能なIPアドレス範囲と数を確認</li>
            <li>各値は「コピー」ボタンでクリップボードにコピー可能</li>
            <li>キーボードショートカット: Enterキーで計算実行</li>
          </ul>

          <h3>CIDR表記について</h3>
          <p className="info-text">
            CIDR（Classless Inter-Domain
            Routing）は、IPアドレスとネットワークのサイズを表す表記法です。
            「IPアドレス/プレフィックス長」の形式で記述します。
          </p>
          <ul>
            <li>/24 = サブネットマスク 255.255.255.0（256個のIP）</li>
            <li>/16 = サブネットマスク 255.255.0.0（65,536個のIP）</li>
            <li>/8 = サブネットマスク 255.0.0.0（16,777,216個のIP）</li>
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
    </>
  );
}
