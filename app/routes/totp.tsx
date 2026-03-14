import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import {
  generateTotp,
  getSampleSecret,
  generateRandomSecret,
  generateOtpauthUri,
} from "../utils/totp";
import type { TotpResult } from "../utils/totp";

export const Route = createFileRoute("/totp")({
  head: () => ({
    meta: [
      { title: "TOTPジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "RFC 6238準拠のTOTP（時間ベースワンタイムパスワード）を生成するオンラインツール。",
      },
      { property: "og:title", content: "TOTPジェネレーター | Web ツール集" },
      {
        property: "og:description",
        content:
          "RFC 6238準拠のTOTP（時間ベースワンタイムパスワード）を生成するオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/totp` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "TOTPジェネレーター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "RFC 6238準拠のTOTP（時間ベースワンタイムパスワード）を生成するオンラインツール。",
      },
    ],
  }),
  component: TotpGeneratorPage,
});

/**
 * TOTPジェネレーターのメインコンポーネント
 * 秘密鍵を入力としてリアルタイムでTOTPコードを生成・更新する
 */
function TotpGeneratorPage() {
  const { showToast } = useToast();
  const [secret, setSecret] = useState("");
  const [period, setPeriod] = useState(30);
  const [digits, setDigits] = useState(6);
  const [algorithm, setAlgorithm] = useState<"SHA-1" | "SHA-256" | "SHA-512">(
    "SHA-1"
  );
  const [totpResult, setTotpResult] = useState<TotpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const secretRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const updateTotp = useCallback(async () => {
    if (!secret.trim()) return;

    try {
      const result = await generateTotp({
        secret,
        period,
        digits,
        algorithm,
      });
      setTotpResult(result);
      setRemaining(result.remaining);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      setTotpResult(null);
      setIsRunning(false);
    }
  }, [secret, period, digits, algorithm]);

  const handleStart = useCallback(async () => {
    setError(null);

    if (!secret.trim()) {
      setError("秘密鍵を入力してください");
      showToast("秘密鍵を入力してください", "error");
      return;
    }

    try {
      await updateTotp();
      setIsRunning(true);
      announceStatus("TOTP生成を開始しました");
      showToast("TOTP生成を開始しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "エラーが発生しました";
      setError(message);
      showToast(message, "error");
    }
  }, [secret, updateTotp, announceStatus, showToast]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setTotpResult(null);
    setRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    announceStatus("TOTP生成を停止しました");
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    setSecret(getSampleSecret());
    setError(null);
    announceStatus("サンプル秘密鍵を読み込みました");
    showToast("サンプル秘密鍵を読み込みました", "success");
  }, [announceStatus, showToast]);

  const handleGenerateSecret = useCallback(() => {
    const newSecret = generateRandomSecret();
    setSecret(newSecret);
    setError(null);
    announceStatus("ランダムな秘密鍵を生成しました");
    showToast("ランダムな秘密鍵を生成しました", "success");
  }, [announceStatus, showToast]);

  const handleClear = useCallback(() => {
    handleStop();
    setSecret("");
    setError(null);
    announceStatus("入力をクリアしました");
    secretRef.current?.focus();
  }, [handleStop, announceStatus]);

  const handleCopyCode = useCallback(async () => {
    if (!totpResult) {
      showToast("コピーするコードがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(totpResult.code);
      announceStatus("TOTPコードをクリップボードにコピーしました");
      showToast("TOTPコードをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [totpResult, announceStatus, showToast]);

  const handleCopyUri = useCallback(async () => {
    if (!secret.trim()) return;
    const uri = generateOtpauthUri(secret, "WebTools", "user@example.com", {
      secret,
      period,
      digits,
      algorithm,
    });
    try {
      await navigator.clipboard.writeText(uri);
      announceStatus("otpauth URIをコピーしました");
      showToast("otpauth URIをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [secret, period, digits, algorithm, announceStatus, showToast]);

  // リアルタイム更新タイマー
  useEffect(() => {
    if (!isRunning) return;

    const tick = async () => {
      await updateTotp();
    };

    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, updateTotp]);

  useEffect(() => {
    secretRef.current?.focus();
  }, []);

  const timerPercent =
    totpResult && period > 0 ? (remaining / period) * 100 : 0;

  const otpauthUri =
    secret.trim()
      ? generateOtpauthUri(secret, "WebTools", "user@example.com", {
          secret,
          period,
          digits,
          algorithm,
        })
      : "";

  return (
    <>
      <div className="tool-container">
        <h1 className="tool-title">TOTPコードジェネレーター</h1>
        <p className="tool-description">
          RFC 6238準拠のTOTP（時間ベースワンタイムパスワード）をブラウザ内で生成します。Google
          Authenticator等の2FAコードをシークレットキーから確認できます。
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="TOTPジェネレーターフォーム"
        >
          <div className="tp-layout">
            {/* 左パネル: 秘密鍵入力・オプション */}
            <div className="tp-panel">
              <span className="tp-panel-label">秘密鍵（Base32）</span>
              <input
                ref={secretRef}
                id="secretInput"
                type="text"
                className="tp-secret-input"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="JBSWY3DPEHPK3PXP..."
                aria-label="Base32秘密鍵入力欄"
                aria-describedby="tp-input-help"
                spellCheck={false}
                autoComplete="off"
              />
              <span id="tp-input-help" className="sr-only">
                TOTP生成に使用するBase32エンコードされた秘密鍵を入力してください
              </span>

              {/* オプション設定 */}
              <div
                className="tp-options"
                role="group"
                aria-label="TOTP生成オプション"
              >
                <div className="tp-options-row">
                  <label className="tp-option-label" htmlFor="tp-period">
                    期間（秒）:
                  </label>
                  <input
                    id="tp-period"
                    type="number"
                    className="tp-number-input"
                    min="10"
                    max="120"
                    value={period}
                    onChange={(e) =>
                      setPeriod(
                        Math.max(10, Math.min(120, parseInt(e.target.value) || 30))
                      )
                    }
                    aria-label="タイムステップ期間（秒）"
                  />
                </div>
                <div className="tp-options-row">
                  <label className="tp-option-label" htmlFor="tp-digits">
                    桁数:
                  </label>
                  <select
                    id="tp-digits"
                    className="tp-select"
                    value={digits}
                    onChange={(e) => setDigits(parseInt(e.target.value))}
                    aria-label="OTPの桁数"
                  >
                    <option value={6}>6桁</option>
                    <option value={7}>7桁</option>
                    <option value={8}>8桁</option>
                  </select>
                </div>
                <div className="tp-options-row">
                  <label className="tp-option-label" htmlFor="tp-algorithm">
                    アルゴリズム:
                  </label>
                  <select
                    id="tp-algorithm"
                    className="tp-select"
                    value={algorithm}
                    onChange={(e) =>
                      setAlgorithm(
                        e.target.value as "SHA-1" | "SHA-256" | "SHA-512"
                      )
                    }
                    aria-label="ハッシュアルゴリズム"
                  >
                    <option value="SHA-1">SHA-1</option>
                    <option value="SHA-256">SHA-256</option>
                    <option value="SHA-512">SHA-512</option>
                  </select>
                </div>
              </div>

              <div className="tp-actions">
                <button
                  type="button"
                  className="tp-btn"
                  onClick={handleLoadSample}
                  aria-label="サンプル秘密鍵を読み込む"
                >
                  サンプル読込
                </button>
                <button
                  type="button"
                  className="tp-btn"
                  onClick={handleGenerateSecret}
                  aria-label="ランダムな秘密鍵を生成する"
                >
                  鍵生成
                </button>
                <button
                  type="button"
                  className="tp-btn"
                  onClick={handleClear}
                  aria-label="入力をクリアする"
                >
                  クリア
                </button>
                {!isRunning ? (
                  <button
                    type="button"
                    className="tp-btn tp-btn--primary"
                    onClick={handleStart}
                    aria-label="TOTP生成を開始する"
                  >
                    生成開始
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tp-btn tp-btn--primary"
                    onClick={handleStop}
                    aria-label="TOTP生成を停止する"
                  >
                    停止
                  </button>
                )}
              </div>

              {otpauthUri && (
                <div className="tp-panel">
                  <span className="tp-panel-label">otpauth URI</span>
                  <div className="tp-uri-area" aria-label="otpauth URI">
                    {otpauthUri}
                  </div>
                  <div className="tp-actions">
                    <button
                      type="button"
                      className="tp-btn"
                      onClick={handleCopyUri}
                      aria-label="otpauth URIをコピーする"
                    >
                      URIコピー
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 右パネル: TOTPコード表示 */}
            <div className="tp-panel">
              <span className="tp-panel-label">TOTPコード</span>
              <div
                className="tp-code-display"
                role="region"
                aria-label="生成されたTOTPコード"
                aria-live="polite"
              >
                {totpResult ? (
                  <>
                    <span className="tp-code-value">{totpResult.code}</span>
                    <div className="tp-timer-bar">
                      <div
                        className="tp-timer-fill"
                        role="progressbar"
                        aria-valuenow={remaining}
                        aria-valuemin={0}
                        aria-valuemax={period}
                        aria-label={`残り${remaining}秒`}
                        /* eslint-disable-next-line react/no-unknown-property */
                        ref={(el) => {
                          if (el) {
                            el.style.width = `${timerPercent}%`;
                          }
                        }}
                      />
                    </div>
                    <span className="tp-timer-text">
                      残り {remaining} 秒
                    </span>
                  </>
                ) : (
                  <span className="tp-code-empty">
                    {error
                      ? "エラーが発生しました"
                      : "秘密鍵を入力して「生成開始」ボタンを押してください"}
                  </span>
                )}
              </div>

              {totpResult && (
                <div className="tp-info" aria-label="TOTP詳細情報">
                  <div className="tp-info-row">
                    <span className="tp-info-label">カウンター:</span>
                    <span>{totpResult.counter}</span>
                  </div>
                  <div className="tp-info-row">
                    <span className="tp-info-label">アルゴリズム:</span>
                    <span>{algorithm}</span>
                  </div>
                  <div className="tp-info-row">
                    <span className="tp-info-label">桁数:</span>
                    <span>{digits}</span>
                  </div>
                  <div className="tp-info-row">
                    <span className="tp-info-label">期間:</span>
                    <span>{period}秒</span>
                  </div>
                </div>
              )}

              <div className="tp-actions">
                <button
                  type="button"
                  className="tp-btn"
                  onClick={handleCopyCode}
                  disabled={!totpResult}
                  aria-label="TOTPコードをクリップボードにコピーする"
                >
                  コードをコピー
                </button>
              </div>
            </div>
          </div>

          <ErrorMessage message={error} />
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「秘密鍵」欄にBase32エンコードされた鍵を入力します",
                "「サンプル読込」でRFC 6238テスト用の鍵を読み込めます",
                "「鍵生成」でランダムな秘密鍵を生成できます",
                "「生成開始」ボタンでTOTPコードのリアルタイム生成を開始します",
                "コードは設定した期間（デフォルト30秒）ごとに自動更新されます",
              ],
            },
            {
              title: "TOTPについて",
              items: [
                "TOTP (Time-based One-Time Password) はRFC 6238で定義された標準規格です",
                "Google Authenticator、Microsoft Authenticator等の2FAアプリと同じアルゴリズムです",
                "秘密鍵は安全に管理してください。このツールはブラウザ内でのみ処理を行います",
                "otpauth URIは認証アプリへの登録に使用できます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
