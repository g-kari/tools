import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  generatePkce,
  generateCodeChallengeS256,
  validateCodeVerifier,
} from "~/utils/pkce";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

export const Route = createFileRoute("/pkce")({
  head: () => ({
    meta: [
      { title: "PKCE ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "OAuth 2.0 の PKCE（Proof Key for Code Exchange）に必要な code_verifier と code_challenge を生成するツール。RFC 7636 準拠。S256・plain メソッド対応。ブラウザ内で完結。",
      },
      { property: "og:title", content: "PKCE ジェネレーター | Web ツール集" },
      {
        property: "og:description",
        content:
          "OAuth 2.0 の PKCE（Proof Key for Code Exchange）に必要な code_verifier と code_challenge を生成するツール。RFC 7636 準拠。S256・plain メソッド対応。ブラウザ内で完結。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/pkce` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "PKCE ジェネレーター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "OAuth 2.0 の PKCE（Proof Key for Code Exchange）に必要な code_verifier と code_challenge を生成するツール。RFC 7636 準拠。S256・plain メソッド対応。ブラウザ内で完結。",
      },
    ],
  }),
  component: PkceGenerator,
});

/** code_challenge_method の選択肢 */
type PkceMethod = "S256" | "plain";

/** バイト長のプリセット */
const BYTE_LENGTH_OPTIONS = [
  { label: "32バイト（推奨・43文字）", value: 32 },
  { label: "48バイト（64文字）", value: 48 },
  { label: "64バイト（86文字）", value: 64 },
  { label: "96バイト（128文字・最大）", value: 96 },
] as const;

/**
 * PKCE ジェネレーターコンポーネント
 * OAuth 2.0 / RFC 7636 に準拠した code_verifier と code_challenge を生成する
 */
function PkceGenerator() {
  const { showToast } = useToast();
  const [method, setMethod] = useState<PkceMethod>("S256");
  const [byteLength, setByteLength] = useState<number>(32);
  const [codeVerifier, setCodeVerifier] = useState("");
  const [codeChallenge, setCodeChallenge] = useState("");
  const [verifierInput, setVerifierInput] = useState("");
  const [challengeFromInput, setChallengeFromInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    length?: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(
    async (value: string, fieldName: string) => {
      if (!value) return;
      const success = await copy(value);
      if (success) {
        setCopiedField(fieldName);
        announceStatus(`${fieldName} をコピーしました`);
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopiedField(null), 2000);
      } else {
        announceStatus("コピーに失敗しました");
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generatePkce(byteLength, method);
      setCodeVerifier(result.codeVerifier);
      setCodeChallenge(result.codeChallenge);
      announceStatus(
        `PKCE ペアを生成しました（${result.codeVerifier.length}文字）`
      );
    } catch {
      showToast("生成に失敗しました", "error");
      announceStatus("エラー: 生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }, [byteLength, method, announceStatus, showToast]);

  const handleVerifierInputChange = useCallback(
    async (value: string) => {
      setVerifierInput(value);
      setChallengeFromInput("");
      setValidationResult(null);

      if (!value.trim()) return;

      const validation = validateCodeVerifier(value.trim());
      setValidationResult(validation);

      if (validation.valid) {
        try {
          const challenge = await generateCodeChallengeS256(value.trim());
          setChallengeFromInput(challenge);
          announceStatus(
            "code_challenge を計算しました"
          );
        } catch {
          setChallengeFromInput("");
        }
      }
    },
    [announceStatus]
  );

  const handleClear = useCallback(() => {
    setCodeVerifier("");
    setCodeChallenge("");
    setVerifierInput("");
    setChallengeFromInput("");
    setValidationResult(null);
    announceStatus("クリアしました");
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* 生成セクション */}
        <section aria-labelledby="generate-section-title">
          <h2 id="generate-section-title" className="section-title">
            PKCE ペア生成
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            aria-label="PKCE 生成フォーム"
          >
            {/* オプション */}
            <div className="converter-section">
              <div className="pkce-options-row">
                {/* バイト長 */}
                <fieldset className="pkce-fieldset">
                  <legend className="section-title pkce-legend">
                    code_verifier の長さ
                  </legend>
                  <div
                    className="csv-json-mode-group"
                    role="group"
                    aria-label="バイト長の選択"
                  >
                    {BYTE_LENGTH_OPTIONS.map((opt) => (
                      <label key={opt.value} className="format-option">
                        <input
                          type="radio"
                          name="byteLength"
                          value={opt.value}
                          checked={byteLength === opt.value}
                          onChange={() => setByteLength(opt.value)}
                          aria-label={opt.label}
                        />
                        <span className="format-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* メソッド */}
                <fieldset className="pkce-fieldset">
                  <legend className="section-title pkce-legend">
                    code_challenge_method
                  </legend>
                  <div
                    className="csv-json-mode-group"
                    role="group"
                    aria-label="メソッドの選択"
                  >
                    <label className="format-option">
                      <input
                        type="radio"
                        name="method"
                        value="S256"
                        checked={method === "S256"}
                        onChange={() => setMethod("S256")}
                        aria-label="S256（推奨）"
                      />
                      <span className="format-label">S256（推奨）</span>
                    </label>
                    <label className="format-option">
                      <input
                        type="radio"
                        name="method"
                        value="plain"
                        checked={method === "plain"}
                        onChange={() => setMethod("plain")}
                        aria-label="plain（非推奨）"
                      />
                      <span className="format-label">plain（非推奨）</span>
                    </label>
                  </div>
                </fieldset>
              </div>
            </div>

            {/* ボタン */}
            <div className="button-group" role="group" aria-label="生成操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                aria-label="PKCE ペアを生成"
              >
                {isGenerating ? "生成中..." : "生成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClear}
                aria-label="すべてクリア"
              >
                クリア
              </Button>
            </div>

            {/* 結果表示 */}
            {(codeVerifier || codeChallenge) && (
              <div className="converter-section">
                <div className="pkce-result-grid">
                  {/* code_verifier */}
                  <div className="pkce-result-item">
                    <div className="pkce-result-header">
                      <span className="pkce-result-label">code_verifier</span>
                      <button
                        type="button"
                        className={`number-base-copy-btn${copiedField === "code_verifier" ? " copied" : ""}`}
                        onClick={() =>
                          handleCopy(codeVerifier, "code_verifier")
                        }
                        disabled={!codeVerifier}
                        aria-label="code_verifier をコピー"
                      >
                        {copiedField === "code_verifier" ? "コピー済" : "コピー"}
                      </button>
                    </div>
                    <div
                      className="pkce-result-value"
                      aria-label="code_verifier の値"
                      role="region"
                      aria-live="polite"
                    >
                      {codeVerifier || "—"}
                    </div>
                    {codeVerifier && (
                      <p className="pkce-length-info">
                        {codeVerifier.length} 文字（{byteLength} バイト）
                      </p>
                    )}
                  </div>

                  {/* code_challenge */}
                  <div className="pkce-result-item">
                    <div className="pkce-result-header">
                      <span className="pkce-result-label">code_challenge</span>
                      <div className="pkce-challenge-actions">
                        <span
                          className={`pkce-method-badge${method === "plain" ? " plain" : ""}`}
                          aria-label={`メソッド: ${method}`}
                        >
                          {method}
                        </span>
                        <button
                          type="button"
                          className={`number-base-copy-btn${copiedField === "code_challenge" ? " copied" : ""}`}
                          onClick={() =>
                            handleCopy(codeChallenge, "code_challenge")
                          }
                          disabled={!codeChallenge}
                          aria-label="code_challenge をコピー"
                        >
                          {copiedField === "code_challenge" ? "コピー済" : "コピー"}
                        </button>
                      </div>
                    </div>
                    <div
                      className="pkce-result-value"
                      aria-label="code_challenge の値"
                      role="region"
                      aria-live="polite"
                    >
                      {codeChallenge || "—"}
                    </div>
                    {codeChallenge && (
                      <p className="pkce-length-info">
                        {codeChallenge.length} 文字
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>

        {/* 検証セクション */}
        <section aria-labelledby="verify-section-title" className="pkce-verify-section">
          <h2 id="verify-section-title" className="section-title">
            code_verifier から code_challenge を計算
          </h2>
          <p className="pkce-verify-desc">
            既存の code_verifier を貼り付けて、対応する code_challenge（S256）を確認できます。
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            aria-label="code_verifier 検証フォーム"
          >
            <div className="converter-section">
              <label htmlFor="verifier-input" className="section-title pkce-legend">
                code_verifier を入力
              </label>
              <Textarea
                id="verifier-input"
                value={verifierInput}
                onChange={(e) => handleVerifierInputChange(e.target.value)}
                placeholder="code_verifier を貼り付けてください（43〜128文字）"
                aria-label="検証する code_verifier の入力欄"
                className="pkce-verifier-input csv-json-textarea"
                rows={3}
              />
            </div>

            {validationResult !== null && (
              <div className="converter-section">
                <div
                  className={`pkce-validation-result ${validationResult.valid ? "valid" : "invalid"}`}
                  role="status"
                  aria-live="polite"
                >
                  <span aria-hidden="true">
                    {validationResult.valid ? "✓" : "✗"}
                  </span>
                  <span>
                    {validationResult.valid
                      ? `有効な code_verifier です（${validationResult.length} 文字）`
                      : validationResult.error}
                  </span>
                </div>
              </div>
            )}

            {challengeFromInput && (
              <div className="converter-section">
                <div className="pkce-result-item">
                  <div className="pkce-result-header">
                    <span className="pkce-result-label">
                      code_challenge（S256）
                    </span>
                    <button
                      type="button"
                      className={`number-base-copy-btn${copiedField === "challenge-from-input" ? " copied" : ""}`}
                      onClick={() =>
                        handleCopy(challengeFromInput, "challenge-from-input")
                      }
                      aria-label="計算された code_challenge をコピー"
                    >
                      {copiedField === "challenge-from-input"
                        ? "コピー済"
                        : "コピー"}
                    </button>
                  </div>
                  <div
                    className="pkce-result-value"
                    aria-label="計算された code_challenge の値"
                    role="region"
                    aria-live="polite"
                  >
                    {challengeFromInput}
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>

        <TipsCard
          sections={[
            {
              title: "PKCE とは",
              items: [
                "PKCE（Proof Key for Code Exchange）は OAuth 2.0 の認可コードフローを安全にする拡張仕様（RFC 7636）です",
                "code_verifier：クライアントが生成するランダムな秘密値（43〜128文字・URL-safe Base64）",
                "code_challenge：認可リクエスト時に送る code_verifier のハッシュ値（S256 推奨）",
                "S256 メソッド：code_challenge = BASE64URL(SHA-256(code_verifier))",
                "plain メソッド：code_challenge = code_verifier（セキュリティ上 S256 を強く推奨）",
              ],
            },
            {
              title: "OAuth 2.0 フロー",
              items: [
                "① code_verifier をランダム生成し、code_challenge = SHA-256(verifier) を計算",
                "② 認可リクエスト：code_challenge と code_challenge_method=S256 を送信",
                "③ 認可コードを受け取る",
                "④ トークンリクエスト：認可コードと code_verifier を送信",
                "⑤ サーバーが SHA-256(verifier) == code_challenge を検証してトークン発行",
              ],
            },
            {
              title: "使い方",
              items: [
                "「生成」ボタンを押すと code_verifier と code_challenge を一括生成します",
                "「code_verifier の長さ」でランダムバイト数を選択できます（推奨: 32バイト）",
                "既存の code_verifier がある場合は「検証」セクションに貼り付けて code_challenge を確認できます",
                "すべての計算はブラウザ内で完結し、値がサーバーに送信されることはありません",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
