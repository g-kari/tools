import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { analyzePassword, type PasswordStrengthResult } from "~/utils/password-strength";
import "../styles/tools/password-strength.css";

export const Route = createFileRoute("/password-strength")({
  head: () => ({
    meta: [
      { title: "パスワード強度チェッカー | Web ツール集" },
      {
        name: "description",
        content:
          "パスワードの強度をエントロピー・クラック時間・文字クラス・パターン検知で詳細解析。よく使われるパスワードの検出、改善アドバイスつき。ブラウザ内完結で外部送信なし。",
      },
      { property: "og:title", content: "パスワード強度チェッカー | Web ツール集" },
      {
        property: "og:description",
        content:
          "パスワードの強度をエントロピー・クラック時間・パターン検知で詳細解析。ブラウザ内完結。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/password-strength` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "パスワード強度チェッカー | Web ツール集" },
      {
        name: "twitter:description",
        content: "パスワードのエントロピー・クラック時間・文字クラスを詳細解析。外部送信なし。",
      },
    ],
  }),
  component: PasswordStrengthChecker,
});

/** 強度バーコンポーネント */
function StrengthBar({ result }: { result: PasswordStrengthResult }) {
  return (
    <div className="ps-strength-bar-container">
      <div
        className="ps-strength-bar"
        role="progressbar"
        aria-valuenow={result.score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`パスワード強度: ${result.label}`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`ps-strength-segment${i <= result.score && result.length > 0 ? ` active-${result.score}` : ""}`}
          />
        ))}
      </div>
      <div className="ps-strength-label-row">
        <span className={`ps-strength-label ps-strength-label-${result.score}`}>
          {result.length > 0 ? result.label : "—"}
        </span>
        {result.length > 0 && (
          <span className="ps-entropy-text">エントロピー: {result.entropy} bit</span>
        )}
      </div>
    </div>
  );
}

/** 文字クラス詳細 */
function CharClassCard({ result }: { result: PasswordStrengthResult }) {
  const classes = [
    { key: "lowercase", label: "小文字 (a-z)", present: result.characterClasses.lowercase },
    { key: "uppercase", label: "大文字 (A-Z)", present: result.characterClasses.uppercase },
    { key: "digits", label: "数字 (0-9)", present: result.characterClasses.digits },
    { key: "symbols", label: "記号 (!@#$% …)", present: result.characterClasses.symbols },
  ];

  return (
    <div className="ps-detail-card">
      <p className="ps-detail-card-title">文字クラス</p>
      <ul className="ps-char-class-list" aria-label="文字クラスの内訳">
        {classes.map(({ key, label, present }) => (
          <li key={key} className={`ps-char-class-item${present ? " present" : ""}`}>
            <span
              className={`ps-char-class-icon${present ? " present" : " absent"}`}
              aria-hidden="true"
            >
              {present ? "✓" : "○"}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** パターン検知カード */
function PatternCard({ result }: { result: PasswordStrengthResult }) {
  const patterns = [
    {
      ok: !result.isCommonPassword,
      label: result.isCommonPassword ? "よく使われるパスワード" : "一般的なパスワードではない",
    },
    {
      ok: !result.hasSequence,
      label: result.hasSequence ? "連続パターンあり (abc, 123, qwerty …)" : "連続パターンなし",
    },
    {
      ok: !result.hasRepeats,
      label: result.hasRepeats ? "同一文字の繰り返しあり (aaa, 111 …)" : "同一文字の繰り返しなし",
    },
  ];

  return (
    <div className="ps-detail-card">
      <p className="ps-detail-card-title">パターン検知</p>
      <div className="ps-patterns" aria-label="パターン検知結果">
        {patterns.map(({ ok, label }) => (
          <div key={label} className="ps-pattern-row">
            <span className={`ps-pattern-icon${ok ? " ok" : " warn"}`} aria-hidden="true">
              {ok ? "✓" : "⚠"}
            </span>
            <span className={`ps-pattern-label${ok ? "" : " warn"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 基本情報カード */
function StatsCard({ result }: { result: PasswordStrengthResult }) {
  return (
    <div className="ps-detail-card">
      <p className="ps-detail-card-title">基本情報</p>
      <div className="ps-stat-row">
        <span className="ps-stat-key">文字数</span>
        <span className="ps-stat-value">{result.length}</span>
      </div>
      <div className="ps-stat-row">
        <span className="ps-stat-key">文字セット</span>
        <span className="ps-stat-value">{result.charsetSize} 種</span>
      </div>
      <div className="ps-stat-row">
        <span className="ps-stat-key">エントロピー</span>
        <span className="ps-stat-value">{result.entropy} bit</span>
      </div>
      <div className="ps-stat-row">
        <span className="ps-stat-key">文字クラス数</span>
        <span className="ps-stat-value">
          {Object.values(result.characterClasses).filter(Boolean).length} / 4
        </span>
      </div>
    </div>
  );
}

/** クラック時間カード */
function CrackTimeCard({ result }: { result: PasswordStrengthResult }) {
  const rows = [
    {
      scenario: "オンライン（レート制限あり）",
      detail: "100 回/時間",
      time: result.crackTimes.onlineThrottled,
    },
    {
      scenario: "オンライン（レート制限なし）",
      detail: "10 回/秒",
      time: result.crackTimes.onlineUnthrottled,
    },
    {
      scenario: "オフライン（低速: bcrypt 等）",
      detail: "10,000 回/秒",
      time: result.crackTimes.offlineSlow,
    },
    {
      scenario: "オフライン（高速: MD5 等）",
      detail: "10,000,000,000 回/秒",
      time: result.crackTimes.offlineFast,
    },
  ];

  return (
    <div className="ps-detail-card">
      <p className="ps-detail-card-title">クラック時間の推定</p>
      <div className="ps-crack-table" aria-label="クラック時間の推定">
        {rows.map(({ scenario, detail, time }) => (
          <div key={scenario} className="ps-crack-row">
            <span className="ps-crack-scenario">
              {scenario}
              <br />
              <span className="ps-crack-detail">{detail}</span>
            </span>
            <span className="ps-crack-time">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 改善アドバイス */
function SuggestionsCard({ result }: { result: PasswordStrengthResult }) {
  const isAllGood =
    result.suggestions.length === 1 && result.suggestions[0] === "このパスワードは十分に安全です！";

  return (
    <div className="ps-detail-card ps-suggestions">
      <p className="ps-detail-card-title">改善アドバイス</p>
      <ul className="ps-suggestion-list" aria-label="改善アドバイス">
        {result.suggestions.map((s, i) => (
          <li key={i} className={`ps-suggestion-item${isAllGood ? " good" : ""}`}>
            <span className="ps-suggestion-bullet" aria-hidden="true">
              {isAllGood ? "✓" : "›"}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** メインコンポーネント */
function PasswordStrengthChecker() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const result = useMemo(() => analyzePassword(password), [password]);

  const handleCopy = useCallback(async () => {
    if (!password) return;
    const ok = await copy(password);
    if (ok) {
      showToast("パスワードをコピーしました", "success");
      announceStatus("パスワードをコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [password, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setPassword("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleToggleVisibility = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  return (
    <>
      <div className="tool-container">
        {/* 入力エリア */}
        <div className="converter-section">
          <label htmlFor="ps-password-input" className="section-title">
            パスワードを入力
          </label>
          <div className="ps-input-area">
            <input
              id="ps-password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="チェックしたいパスワードを入力..."
              className="ps-password-input"
              aria-label="パスワード"
              aria-describedby="ps-input-hint"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="ps-toggle-btn"
              onClick={handleToggleVisibility}
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
              title={showPassword ? "隠す" : "表示"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          <p id="ps-input-hint" className="cert-input-hint">
            入力した内容はブラウザ内で処理されます（外部送信なし）
          </p>
        </div>

        {/* 強度バー */}
        <StrengthBar result={result} />

        {/* ボタン */}
        <div className="button-group">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopy}
            disabled={!password}
            aria-label="パスワードをコピー"
          >
            コピー
          </button>
          <button type="button" className="btn-clear" onClick={handleClear} disabled={!password}>
            クリア
          </button>
        </div>

        {/* 詳細結果 */}
        {password ? (
          <div className="ps-details-grid" aria-live="polite">
            <StatsCard result={result} />
            <CharClassCard result={result} />
            <PatternCard result={result} />
            <CrackTimeCard result={result} />
            <SuggestionsCard result={result} />
          </div>
        ) : (
          <div className="ps-empty" aria-label="パスワードを入力してください">
            <p>パスワードを入力すると強度を即座に解析します</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "強度の目安",
              items: [
                "とても弱い: エントロピー 20 bit 未満 / よく使われるパスワード",
                "弱い: エントロピー 20〜35 bit",
                "普通: エントロピー 36〜59 bit",
                "強い: エントロピー 60〜99 bit",
                "とても強い: エントロピー 100 bit 以上",
              ],
            },
            {
              title: "クラック時間について",
              items: [
                "オンライン（レート制限あり）: ログイン試行に制限がある一般的なWebサービス",
                "オンライン（レート制限なし）: レート制限のないAPIやサービス",
                "オフライン（低速）: bcrypt/scrypt など計算コストの高いハッシュ",
                "オフライン（高速）: MD5/SHA-1 などの高速ハッシュ（データ漏洩時のリスク）",
                "推定は平均ケース（組み合わせ数の半分）で計算しています",
              ],
            },
            {
              title: "安全なパスワードのヒント",
              items: [
                "12文字以上を推奨（長さが最も重要）",
                "大文字・小文字・数字・記号を組み合わせる",
                "辞書にある単語や個人情報を避ける",
                "各サービスで異なるパスワードを使用する",
                "パスワードマネージャーの利用をお勧めします",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
