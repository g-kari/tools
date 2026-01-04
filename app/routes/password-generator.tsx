import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  generatePassword,
  calculateStrength,
  type PasswordOptions,
} from "../utils/password";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/password-generator")({
  head: () => ({
    meta: [{ title: "パスワード生成ツール" }],
  }),
  component: PasswordGenerator,
});

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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
      showToast("少なくとも1つの文字種を選択してください", "error");
      return;
    }
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setCopied(false);
    announceStatus("パスワードを生成しました");
    showToast("パスワードを生成しました", "success");
  }, [options, announceStatus, showToast]);

  const handleCopy = useCallback(async () => {
    if (!password) {
      announceStatus("エラー: コピーするパスワードがありません");
      showToast("コピーするパスワードがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      announceStatus("パスワードをクリップボードにコピーしました");
      showToast("クリップボードにコピーしました", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      announceStatus("コピーに失敗しました");
      showToast("コピーに失敗しました", "error");
    }
  }, [password, announceStatus, showToast]);

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
            <Slider
              id="passwordLength"
              min={4}
              max={128}
              step={1}
              value={[options.length]}
              onValueChange={(value) => handleOptionChange("length", value[0])}
              aria-describedby="length-help"
              aria-label="パスワードの長さ"
              className="mb-5"
            />
            <span id="length-help" className="sr-only">
              4文字から128文字までの長さを選択できます
            </span>
          </div>

          <div className={`collapsible ${showAdvanced ? "open" : ""}`}>
            <button
              type="button"
              className="collapsible-header"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
              aria-controls="advanced-options"
            >
              <span className="collapsible-title">詳細設定（文字種）</span>
              <span className="collapsible-icon" aria-hidden="true">▾</span>
            </button>
            <div className="collapsible-content" id="advanced-options">
              <div className="collapsible-body">
                <div className="checkbox-group" role="group" aria-label="使用する文字種の選択">
                  <div className="checkbox-label">
                    <Checkbox
                      id="uppercase"
                      checked={options.uppercase}
                      onCheckedChange={(checked) => handleOptionChange("uppercase", checked === true)}
                      aria-label="大文字を含める"
                    />
                    <Label htmlFor="uppercase">大文字 (A-Z)</Label>
                  </div>
                  <div className="checkbox-label">
                    <Checkbox
                      id="lowercase"
                      checked={options.lowercase}
                      onCheckedChange={(checked) => handleOptionChange("lowercase", checked === true)}
                      aria-label="小文字を含める"
                    />
                    <Label htmlFor="lowercase">小文字 (a-z)</Label>
                  </div>
                  <div className="checkbox-label">
                    <Checkbox
                      id="numbers"
                      checked={options.numbers}
                      onCheckedChange={(checked) => handleOptionChange("numbers", checked === true)}
                      aria-label="数字を含める"
                    />
                    <Label htmlFor="numbers">数字 (0-9)</Label>
                  </div>
                  <div className="checkbox-label">
                    <Checkbox
                      id="symbols"
                      checked={options.symbols}
                      onCheckedChange={(checked) => handleOptionChange("symbols", checked === true)}
                      aria-label="記号を含める"
                    />
                    <Label htmlFor="symbols">記号 (!@#$%...)</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="button-group" role="group" aria-label="パスワード生成操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              aria-label="新しいパスワードを生成"
            >
              生成
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopy}
              disabled={!password}
              aria-label="パスワードをクリップボードにコピー"
            >
              {copied ? "コピーしました" : "コピー"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="パスワードをクリア"
            >
              クリア
            </Button>
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

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "スライダーでパスワードの長さを調整（4〜128文字）",
                "使用する文字種をチェックボックスで選択",
                "「生成」ボタンで新しいパスワードを作成",
                "「コピー」ボタンでクリップボードにコピー",
                "キーボードショートカット: Ctrl+Enter で生成",
              ],
            },
            {
              title: "セキュリティのヒント",
              items: [
                "パスワードは12文字以上を推奨",
                "複数の文字種を組み合わせると強度が上がります",
                "各サービスで異なるパスワードを使用してください",
                "パスワードマネージャーの利用をお勧めします",
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
