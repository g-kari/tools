import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/regex-checker")({
  head: () => ({
    meta: [{ title: "正規表現チェッカー" }],
  }),
  component: RegexChecker,
});

interface RegexMatch {
  fullMatch: string;
  index: number;
  groups: string[];
}

function RegexChecker() {
  const { showToast } = useToast();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<RegexMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const patternRef = useRef<HTMLInputElement>(null);
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

  const handleTest = useCallback(() => {
    if (!pattern) {
      announceStatus("エラー: 正規表現パターンを入力してください");
      showToast("正規表現パターンを入力してください", "error");
      patternRef.current?.focus();
      return;
    }

    if (!testString) {
      announceStatus("エラー: テスト文字列を入力してください");
      showToast("テスト文字列を入力してください", "error");
      return;
    }

    setError(null);
    setMatches([]);
    setIsValid(null);

    try {
      const regex = new RegExp(pattern, flags);
      const foundMatches: RegexMatch[] = [];

      if (flags.includes("g")) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            fullMatch: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            fullMatch: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);
      setIsValid(foundMatches.length > 0);
      announceStatus(
        foundMatches.length > 0
          ? `${foundMatches.length}件のマッチが見つかりました`
          : "マッチが見つかりませんでした"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "無効な正規表現です";
      setError(message);
      setIsValid(false);
      announceStatus("エラー: " + message);
    }
  }, [pattern, flags, testString, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setPattern("");
    setFlags("");
    setTestString("");
    setMatches([]);
    setError(null);
    setIsValid(null);
    announceStatus("すべての入力をクリアしました");
    patternRef.current?.focus();
  }, [announceStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleTest();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleTest]);

  useEffect(() => {
    patternRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="正規表現チェックフォーム">
          <div className="converter-section">
            <div className="regex-input-group">
              <div className="regex-pattern-wrapper">
                <label htmlFor="patternInput">正規表現パターン</label>
                <input
                  type="text"
                  id="patternInput"
                  ref={patternRef}
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="例: \d{3}-\d{4}"
                  aria-describedby="pattern-help"
                  aria-label="正規表現パターン入力欄"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div className="regex-flags-wrapper">
                <label htmlFor="flagsInput">フラグ</label>
                <input
                  type="text"
                  id="flagsInput"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="g, i, m など"
                  aria-describedby="flags-help"
                  aria-label="正規表現フラグ入力欄"
                  autoComplete="off"
                  spellCheck="false"
                  style={{ maxWidth: "120px" }}
                />
              </div>
            </div>
            <span id="pattern-help" className="sr-only">
              JavaScriptの正規表現パターンを入力してください
            </span>
            <span id="flags-help" className="sr-only">
              g（グローバル）、i（大文字小文字を区別しない）、m（複数行）などのフラグを入力してください
            </span>
          </div>

          <div className="converter-section">
            <label htmlFor="testString" className="section-title">
              テスト文字列
            </label>
            <Textarea
              id="testString"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="正規表現をテストする文字列を入力してください...&#10;例: 電話番号: 03-1234-5678"
              aria-describedby="teststring-help"
              aria-label="テスト文字列入力欄"
            />
            <span id="teststring-help" className="sr-only">
              このフィールドに正規表現をテストする文字列を入力してください
            </span>
          </div>

          <div className="button-group" role="group" aria-label="正規表現チェック操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleTest}
              aria-label="正規表現をテスト"
            >
              テスト
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="すべての入力をクリア"
            >
              クリア
            </Button>
          </div>
        </form>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {isValid !== null && !error && (
          <section aria-labelledby="result-title">
            <h2 id="result-title" className="section-title">
              テスト結果
            </h2>
            <div className="result-card" aria-live="polite">
              <div className="result-row">
                <div className="result-label">マッチ数</div>
                <div className="result-value">{matches.length}件</div>
              </div>
              {matches.length > 0 && (
                <>
                  {matches.map((match, index) => (
                    <div key={index} className="match-item">
                      <div className="result-row">
                        <div className="result-label">マッチ {index + 1}</div>
                        <div className="result-value">{match.fullMatch}</div>
                      </div>
                      <div className="result-row">
                        <div className="result-label">位置</div>
                        <div className="result-value">{match.index}</div>
                      </div>
                      {match.groups.length > 0 && (
                        <div className="result-row">
                          <div className="result-label">キャプチャグループ</div>
                          <div className="result-value list">
                            {match.groups.map((group, i) => (
                              <span key={i}>
                                グループ {i + 1}: {group || "(空)"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「正規表現パターン」欄にテストしたい正規表現を入力",
                "「フラグ」欄に必要に応じてフラグ（g, i, m など）を入力",
                "「テスト文字列」欄にマッチングを試す文字列を入力",
                "「テスト」ボタンでマッチング結果を確認",
                "マッチした文字列、位置、キャプチャグループを表示",
                "キーボードショートカット: Ctrl+Enter でテスト実行",
              ],
            },
            {
              title: "フラグの説明",
              items: [
                "g: グローバル検索（すべてのマッチを検索）",
                "i: 大文字小文字を区別しない",
                "m: 複数行モード",
                "s: ドットが改行にもマッチ",
                "u: Unicode モード",
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
