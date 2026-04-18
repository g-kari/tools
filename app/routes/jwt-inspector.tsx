import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  decodeJWT,
  analyzeClaims,
  verifyJwt,
  type DecodedJWT,
  type JwtClaimAnalysis,
  type ClaimStatus,
  type JwtVerifyResult,
} from "../utils/jwt";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/jwt-inspector")({
  head: () => ({
    meta: [
      { title: "JWT Inspector | Web ツール集" },
      {
        name: "description",
        content:
          "JWTのヘッダー・ペイロードをデコードし、HS256/384/512・RS256/384/512・ES256/384の署名検証と有効期限解析をブラウザ内で実行。",
      },
      { property: "og:title", content: "JWT Inspector | Web ツール集" },
      {
        property: "og:description",
        content:
          "JWTのヘッダー・ペイロードをデコードし、HS256/384/512・RS256/384/512・ES256/384の署名検証と有効期限解析をブラウザ内で実行。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/jwt-inspector` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JWT Inspector | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "JWTのヘッダー・ペイロードをデコードし、署名検証と有効期限解析をブラウザ内で実行。",
      },
    ],
  }),
  component: JwtInspector,
});

/** 秒を人間向けの短い表記に整形する（1d 2h 3m 4s） */
function formatDuration(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const s = Math.abs(Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours) parts.push(`${seconds}s`);
  return sign + (parts.join(" ") || "0s");
}

/** クレーム1行の表示用データ */
function ClaimRow({
  label,
  status,
  mode,
}: {
  label: string;
  status: ClaimStatus;
  mode: "exp" | "iat" | "nbf";
}) {
  if (!status.present) {
    return (
      <div className="jwti-claim-row jwti-claim-absent">
        <span className="jwti-claim-label">{label}</span>
        <span className="jwti-claim-value">未設定</span>
      </div>
    );
  }

  const invalidClass = status.invalid ? " jwti-claim-invalid" : " jwti-claim-valid";
  const relative =
    status.deltaSeconds === undefined
      ? ""
      : mode === "exp"
        ? status.invalid
          ? `${formatDuration(-status.deltaSeconds)} 前に失効`
          : `残り ${formatDuration(status.deltaSeconds)}`
        : mode === "nbf"
          ? status.invalid
            ? `${formatDuration(status.deltaSeconds)} 後に発効`
            : `${formatDuration(-status.deltaSeconds)} 前に発効`
          : `${formatDuration(status.deltaSeconds)} 前に発行`;

  return (
    <div className={`jwti-claim-row${invalidClass}`}>
      <span className="jwti-claim-label">{label}</span>
      <span className="jwti-claim-value">
        <code>{status.value}</code>
        <span className="jwti-claim-date">{status.dateString}</span>
        <span className="jwti-claim-relative">{relative}</span>
      </span>
    </div>
  );
}

/**
 * JWT Inspector: デコード + 時刻クレーム解析 + 署名検証を1画面で提供する。
 * 秘密情報はローカル処理のみで外部送信しない。
 */
function JwtInspector() {
  const [inputToken, setInputToken] = useState("");
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyResult, setVerifyResult] = useState<JwtVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus, copyWithFeedback } = useCopyWithFeedback();

  // 1秒ごとに現在時刻を更新（有効期限のリアルタイム表示用、デコード済みのときだけ）
  useEffect(() => {
    if (!decoded) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [decoded]);

  // 鍵を変更したら過去の検証結果は無効化する
  useEffect(() => {
    setVerifyResult(null);
  }, [key]);

  // 入力が変わったら自動デコード
  useEffect(() => {
    const trimmed = inputToken.trim();
    if (!trimmed) {
      setDecoded(null);
      setErrorMessage("");
      setVerifyResult(null);
      return;
    }
    try {
      const result = decodeJWT(trimmed);
      setDecoded(result);
      setErrorMessage("");
      setVerifyResult(null);
    } catch (error) {
      setDecoded(null);
      setVerifyResult(null);
      setErrorMessage(error instanceof Error ? error.message : "デコードに失敗しました");
    }
  }, [inputToken]);

  const analysis: JwtClaimAnalysis | null = useMemo(() => {
    if (!decoded) return null;
    return analyzeClaims(decoded.payloadRaw, now);
  }, [decoded, now]);

  const headerAlg = useMemo<string>(() => {
    if (!decoded) return "";
    try {
      const parsed = JSON.parse(decoded.headerRaw) as { alg?: unknown };
      return typeof parsed.alg === "string" ? parsed.alg : "";
    } catch {
      return "";
    }
  }, [decoded]);

  const handleVerify = useCallback(async () => {
    if (!decoded) return;
    if (!key.trim()) {
      setVerifyResult({
        verified: false,
        algorithm: headerAlg || "unknown",
        error: "検証用のシークレット/公開鍵を入力してください",
      });
      announceStatus("エラー: 検証用のシークレット/公開鍵を入力してください");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyJwt(inputToken, key);
      setVerifyResult(result);
      announceStatus(result.verified ? "署名検証に成功しました" : "署名検証に失敗しました");
    } finally {
      setVerifying(false);
    }
  }, [decoded, inputToken, key, headerAlg, announceStatus]);

  const handleClear = useCallback(() => {
    setInputToken("");
    setKey("");
    setDecoded(null);
    setErrorMessage("");
    setVerifyResult(null);
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  useKeyboardShortcut("Enter", handleVerify, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JWT Inspector フォーム">
          <div className="converter-section">
            <label htmlFor="jwti-input" className="section-title">
              JWT トークン
            </label>
            <Textarea
              id="jwti-input"
              ref={inputRef}
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMiJ9.xxx"
              aria-label="JWTトークン入力欄"
              className="jwt-monospace-output"
            />
          </div>

          <ErrorMessage message={errorMessage} />

          {decoded && (
            <>
              <div className="jwti-meta">
                <span className="jwti-meta-chip">
                  alg: <strong>{headerAlg || "unknown"}</strong>
                </span>
              </div>

              {/* クレーム解析 */}
              {analysis && (
                <div className="converter-section">
                  <div className="section-title">クレーム解析</div>
                  <div className="jwti-claims">
                    <ClaimRow label="iat (発行時刻)" status={analysis.iat} mode="iat" />
                    <ClaimRow label="nbf (有効開始)" status={analysis.nbf} mode="nbf" />
                    <ClaimRow label="exp (有効期限)" status={analysis.exp} mode="exp" />
                  </div>
                </div>
              )}

              {/* ヘッダー */}
              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="jwti-header" className="section-title">
                    ヘッダー (Header)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button btn-secondary"
                    onClick={() => copyWithFeedback(decoded.header, "ヘッダーをコピーしました")}
                    aria-label="ヘッダーをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="jwti-header"
                  value={decoded.header}
                  readOnly
                  aria-label="デコードされたヘッダー"
                  className="jwt-monospace-output"
                />
              </div>

              {/* ペイロード */}
              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="jwti-payload" className="section-title">
                    ペイロード (Payload)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button btn-secondary"
                    onClick={() => copyWithFeedback(decoded.payload, "ペイロードをコピーしました")}
                    aria-label="ペイロードをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="jwti-payload"
                  value={decoded.payload}
                  readOnly
                  aria-label="デコードされたペイロード"
                  className="jwt-monospace-output"
                />
              </div>

              {/* 署名検証: HS はシングル行、RS / ES は複数行（PEM または JWK） */}
              {headerAlg && (headerAlg.startsWith("RS") || headerAlg.startsWith("ES")) ? (
                <div className="converter-section">
                  <label htmlFor="jwti-pem" className="section-title">
                    公開鍵（PEM または JWK JSON）
                  </label>
                  <Textarea
                    id="jwti-pem"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={
                      "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
                    }
                    aria-label="PEM または JWK 公開鍵入力欄"
                    className="jwt-monospace-output"
                  />
                </div>
              ) : (
                <div className="converter-section">
                  <label htmlFor="jwti-key" className="section-title">
                    シークレット
                  </label>
                  <div className="jwt-gen-secret-wrapper">
                    <input
                      id="jwti-key"
                      type={showKey ? "text" : "password"}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="HMAC 共通鍵（シークレット文字列）"
                      aria-label="HMAC 検証用シークレット"
                      className="jwt-gen-secret-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="jwt-gen-secret-toggle"
                      onClick={() => setShowKey((v) => !v)}
                      aria-pressed={showKey}
                      aria-label={showKey ? "シークレットを非表示" : "シークレットを表示"}
                    >
                      {showKey ? "非表示" : "表示"}
                    </button>
                  </div>
                </div>
              )}

              <div className="button-group" role="group" aria-label="検証操作">
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleVerify}
                  disabled={verifying}
                  aria-label="署名を検証"
                >
                  {verifying ? "検証中..." : "署名を検証"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-clear"
                  onClick={handleClear}
                  aria-label="入力と出力をクリア"
                >
                  クリア
                </Button>
              </div>

              {verifyResult && (
                <div
                  className={`jwti-verify-result ${verifyResult.verified ? "ok" : "ng"}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="jwti-verify-badge">
                    {verifyResult.verified ? "✓ 署名検証成功" : "✗ 署名検証失敗"}
                  </span>
                  <span className="jwti-verify-detail">
                    alg: {verifyResult.algorithm}
                    {verifyResult.error ? ` — ${verifyResult.error}` : ""}
                  </span>
                </div>
              )}
            </>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "JWT トークンを入力すると自動でデコードされます",
                "exp / iat / nbf クレームは有効/失効を色分け表示し、残り時間を秒単位で更新します",
                "HS256/384/512 はシークレット文字列を入力し「署名を検証」をクリック",
                "RS256/384/512・ES256/384 は PEM 公開鍵または JWK（JSON 文字列）を入力",
                "キーボードショートカット: Ctrl+Enter で検証実行",
              ],
            },
            {
              title: "セキュリティ",
              items: [
                "入力内容はブラウザ内で完結し、サーバーへ送信されません",
                "署名検証は Web Crypto API（crypto.subtle.verify）を使用します",
                "alg=none のトークンはセキュリティ上の理由から常に失敗扱いになります",
              ],
            },
            {
              title: "対応アルゴリズム",
              items: [
                "HS256 / HS384 / HS512（HMAC + SHA）",
                "RS256 / RS384 / RS512（RSASSA-PKCS1-v1_5）",
                "ES256 / ES384（ECDSA P-256 / P-384）",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
