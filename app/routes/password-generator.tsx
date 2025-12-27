import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";

export const Route = createFileRoute("/password-generator")({
  head: () => ({
    meta: [{ title: "パスワード生成ツール" }],
  }),
  component: PasswordGenerator,
});

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generatePassword(options: PasswordOptions): string {
  let charset = "";
  if (options.uppercase) charset += UPPERCASE_CHARS;
  if (options.lowercase) charset += LOWERCASE_CHARS;
  if (options.numbers) charset += NUMBER_CHARS;
  if (options.symbols) charset += SYMBOL_CHARS;

  if (charset.length === 0) {
    return "";
  }

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

function calculateStrength(password: string, options: PasswordOptions): { score: number; label: string } {
  if (password.length === 0) return { score: 0, label: "" };

  let charsetSize = 0;
  if (options.uppercase) charsetSize += 26;
  if (options.lowercase) charsetSize += 26;
  if (options.numbers) charsetSize += 10;
  if (options.symbols) charsetSize += 26;

  const entropy = password.length * Math.log2(charsetSize || 1);

  if (entropy < 28) return { score: 1, label: "非常に弱い" };
  if (entropy < 36) return { score: 2, label: "弱い" };
  if (entropy < 60) return { score: 3, label: "普通" };
  if (entropy < 128) return { score: 4, label: "強い" };
  return { score: 5, label: "非常に強い" };
}

function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [copied, setCopied] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
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

  const handleGenerate = useCallback(() => {
    if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
      announceStatus("エラー: 少なくとも1つの文字種を選択してください");
      alert("少なくとも1つの文字種を選択してください");
      return;
    }
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setCopied(false);
    announceStatus("パスワードを生成しました");
  }, [options, announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!password) {
      announceStatus("エラー: コピーするパスワードがありません");
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      announceStatus("パスワードをクリップボードにコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      announceStatus("コピーに失敗しました");
    }
  }, [password, announceStatus]);

  const handleClear = useCallback(() => {
    setPassword("");
    setCopied(false);
    announceStatus("パスワードをクリアしました");
  }, [announceStatus]);

  const handleOptionChange = useCallback((key: keyof PasswordOptions, value: boolean | number) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strength = calculateStrength(password, options);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="パスワード生成フォーム">
          <div className="converter-section">
            <label htmlFor="passwordLength" className="section-title">
              パスワードの長さ: {options.length}文字
            </label>
            <input
              type="range"
              id="passwordLength"
              min="4"
              max="128"
              value={options.length}
              onChange={(e) => handleOptionChange("length", parseInt(e.target.value, 10))}
              aria-describedby="length-help"
              aria-label="パスワードの長さ"
              style={{ width: "100%", marginBottom: "20px" }}
            />
            <span id="length-help" className="sr-only">
              4文字から128文字までの長さを選択できます
            </span>
          </div>

          <div className="converter-section">
            <div className="section-title">文字種</div>
            <div className="checkbox-group" role="group" aria-label="使用する文字種の選択">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.uppercase}
                  onChange={(e) => handleOptionChange("uppercase", e.target.checked)}
                  aria-label="大文字を含める"
                />
                大文字 (A-Z)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.lowercase}
                  onChange={(e) => handleOptionChange("lowercase", e.target.checked)}
                  aria-label="小文字を含める"
                />
                小文字 (a-z)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.numbers}
                  onChange={(e) => handleOptionChange("numbers", e.target.checked)}
                  aria-label="数字を含める"
                />
                数字 (0-9)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.symbols}
                  onChange={(e) => handleOptionChange("symbols", e.target.checked)}
                  aria-label="記号を含める"
                />
                記号 (!@#$%...)
              </label>
            </div>
          </div>

          <div className="button-group" role="group" aria-label="パスワード生成操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              aria-label="新しいパスワードを生成"
            >
              生成
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!password}
              aria-label="パスワードをクリップボードにコピー"
            >
              {copied ? "コピーしました" : "コピー"}
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              aria-label="パスワードをクリア"
            >
              クリア
            </button>
          </div>

          <div className="converter-section" style={{ marginTop: "30px" }}>
            <label htmlFor="passwordOutput" className="section-title">
              生成されたパスワード
            </label>
            <input
              type="text"
              id="passwordOutput"
              ref={passwordRef}
              value={password}
              readOnly
              placeholder="パスワードを生成してください..."
              aria-label="生成されたパスワード"
              aria-live="polite"
              style={{ fontFamily: "'Roboto Mono', monospace", fontSize: "1.1rem", letterSpacing: "0.05em" }}
            />
          </div>

          {password && (
            <section aria-labelledby="strength-title" style={{ marginTop: "20px" }}>
              <h2 id="strength-title" className="section-title">
                パスワード強度
              </h2>
              <div className="result-card" aria-live="polite">
                <div className="result-row">
                  <div className="result-label">強度</div>
                  <div className="result-value">{strength.label}</div>
                </div>
                <div className="result-row">
                  <div className="result-label">強度インジケーター</div>
                  <div className="result-value">
                    <div
                      className="strength-bar"
                      role="progressbar"
                      aria-valuenow={strength.score}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label={`パスワード強度: ${strength.label}`}
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`strength-segment ${level <= strength.score ? `strength-${strength.score}` : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>スライダーでパスワードの長さを調整（4〜128文字）</li>
            <li>使用する文字種をチェックボックスで選択</li>
            <li>「生成」ボタンで新しいパスワードを作成</li>
            <li>「コピー」ボタンでクリップボードにコピー</li>
            <li>キーボードショートカット: Ctrl+Enter で生成</li>
          </ul>
          <h4>セキュリティのヒント</h4>
          <ul>
            <li>パスワードは12文字以上を推奨</li>
            <li>複数の文字種を組み合わせると強度が上がります</li>
            <li>各サービスで異なるパスワードを使用してください</li>
            <li>パスワードマネージャーの利用をお勧めします</li>
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
