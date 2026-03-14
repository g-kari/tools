import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  generateJWT,
  type JwtAlgorithm,
  type JwtGeneratorResult,
} from "../utils/jwt";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/jwt-generator")({
  head: () => ({
    meta: [
      { title: "JWT生成 | Web ツール集" },
      {
        name: "description",
        content:
          "HS256/HS384/HS512アルゴリズムでJWTトークンをブラウザ内で生成するオンラインツール。",
      },
      { property: "og:title", content: "JWT生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "HS256/HS384/HS512アルゴリズムでJWTトークンをブラウザ内で生成するオンラインツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/jwt-generator` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "JWT生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "HS256/HS384/HS512アルゴリズムでJWTトークンをブラウザ内で生成するオンラインツール。",
      },
    ],
  }),
  component: JwtGenerator,
});

const ALGORITHMS: JwtAlgorithm[] = ["HS256", "HS384", "HS512"];

const SAMPLE_PAYLOAD = JSON.stringify(
  {
    sub: "1234567890",
    name: "John Doe",
    role: "user",
  },
  null,
  2
);

/**
 * JWT生成ツールコンポーネント。
 * HS256/HS384/HS512を選択し、ペイロードとシークレットからJWTトークンを生成する。
 */
function JwtGenerator() {
  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD);
  const [secret, setSecret] = useState("your-secret-key");
  const [showSecret, setShowSecret] = useState(false);
  const [result, setResult] = useState<JwtGeneratorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const payloadRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /**
   * JWTトークンを生成する。
   * 入力バリデーション後、generateJWT を呼び出して結果を表示する。
   */
  const handleGenerate = useCallback(async () => {
    if (!payload.trim()) {
      const message = "ペイロードを入力してください";
      setErrorMessage(message);
      announceStatus(`エラー: ${message}`);
      payloadRef.current?.focus();
      return;
    }
    if (!secret.trim()) {
      const message = "シークレットを入力してください";
      setErrorMessage(message);
      announceStatus(`エラー: ${message}`);
      return;
    }

    try {
      const generated = await generateJWT({ payload, secret, algorithm });
      setResult(generated);
      setErrorMessage("");
      announceStatus("JWTトークンの生成が完了しました");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "生成に失敗しました";
      setErrorMessage(message);
      setResult(null);
      announceStatus(`エラー: ${message}`);
    }
  }, [payload, secret, algorithm, announceStatus]);

  /**
   * 入力と出力をクリアする。
   */
  const handleClear = useCallback(() => {
    setPayload(SAMPLE_PAYLOAD);
    setSecret("your-secret-key");
    setResult(null);
    setErrorMessage("");
    announceStatus("入力と出力をクリアしました");
    payloadRef.current?.focus();
  }, [announceStatus]);

  /**
   * 指定のテキストをクリップボードにコピーする。
   * @param text コピーするテキスト
   * @param label コピー対象の名称（アナウンス用）
   */
  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const success = await copy(text);
      if (success) {
        announceStatus(`${label}をクリップボードにコピーしました`);
      } else {
        announceStatus("コピーに失敗しました");
      }
    },
    [copy, announceStatus]
  );

  // Ctrl+Enter で生成
  useKeyboardShortcut("Enter", handleGenerate, { ctrl: true });

  // マウント時にペイロード入力欄にフォーカス
  useEffect(() => {
    payloadRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="JWT生成フォーム"
        >
          {/* アルゴリズム選択タブ */}
          <div className="converter-section">
            <span className="section-title" id="algo-label">
              アルゴリズム
            </span>
            <div
              className="jwt-gen-algo-tabs"
              role="tablist"
              aria-labelledby="algo-label"
            >
              {ALGORITHMS.map((algo) => (
                <button
                  key={algo}
                  type="button"
                  role="tab"
                  aria-selected={algorithm === algo}
                  className={`jwt-gen-algo-tab${algorithm === algo ? " active" : ""}`}
                  onClick={() => setAlgorithm(algo)}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {/* ペイロード入力 */}
          <div className="converter-section">
            <label htmlFor="jwtPayload" className="section-title">
              ペイロード (JSON)
            </label>
            <Textarea
              id="jwtPayload"
              ref={payloadRef}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder='{"sub": "1234567890", "name": "John Doe"}'
              aria-describedby="payload-help"
              aria-label="JWTペイロード入力欄（JSON形式）"
              className="jwt-monospace-output"
            />
            <span id="payload-help" className="sr-only">
              JSON形式でペイロードを入力してください。iat（発行時刻）は自動付与されます。
            </span>
          </div>

          {/* シークレット入力 */}
          <div className="converter-section">
            <label htmlFor="jwtSecret" className="section-title">
              シークレット
            </label>
            <div className="jwt-gen-secret-wrapper">
              <input
                id="jwtSecret"
                type={showSecret ? "text" : "password"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="シークレットキーを入力してください"
                aria-describedby="secret-help"
                aria-label="JWT署名用シークレット入力欄"
                className="jwt-gen-secret-input"
                autoComplete="off"
              />
              <button
                type="button"
                className="jwt-gen-secret-toggle"
                onClick={() => setShowSecret((prev) => !prev)}
                aria-label={
                  showSecret ? "シークレットを非表示" : "シークレットを表示"
                }
                aria-pressed={showSecret}
              >
                {showSecret ? "非表示" : "表示"}
              </button>
            </div>
            <span id="secret-help" className="sr-only">
              HMAC署名に使用するシークレットキーを入力してください
            </span>
          </div>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="生成操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              aria-label="JWTトークンを生成"
            >
              生成
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

          <ErrorMessage message={errorMessage} />

          {/* 生成結果 */}
          {result && (
            <>
              {/* トークン全体 */}
              <div className="jwt-gen-result-section">
                <div className="jwt-gen-result-header">
                  <label htmlFor="outputToken" className="section-title">
                    生成されたJWTトークン
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button btn-secondary"
                    onClick={() => handleCopy(result.token, "JWTトークン")}
                    aria-label="JWTトークンをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <div className="jwt-gen-token-value" id="outputToken" aria-live="polite" aria-label="生成されたJWTトークン">
                  {result.token}
                </div>
              </div>

              {/* ヘッダーJSON */}
              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="outputGenHeader" className="section-title">
                    ヘッダー (Header)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button btn-secondary"
                    onClick={() => handleCopy(result.header, "ヘッダー")}
                    aria-label="ヘッダーをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="outputGenHeader"
                  value={result.header}
                  readOnly
                  aria-label="生成されたJWTヘッダー"
                  aria-live="polite"
                  className="jwt-monospace-output"
                />
              </div>

              {/* ペイロードJSON（iat付与後） */}
              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="outputGenPayload" className="section-title">
                    ペイロード (Payload)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button btn-secondary"
                    onClick={() => handleCopy(result.payload, "ペイロード")}
                    aria-label="ペイロードをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="outputGenPayload"
                  value={result.payload}
                  readOnly
                  aria-label="生成されたJWTペイロード（iat追加後）"
                  aria-live="polite"
                  className="jwt-monospace-output"
                />
              </div>
            </>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "アルゴリズムタブでHS256/HS384/HS512を選択します",
                "「ペイロード」欄にJSON形式でクレームを入力します",
                "「シークレット」欄に署名用のシークレットキーを入力します",
                "「生成」ボタンでJWTトークンを生成します",
                "キーボードショートカット: Ctrl+Enter で生成実行",
                "iat（発行時刻）クレームは現在時刻で自動付与されます",
              ],
            },
            {
              title: "アルゴリズムの説明",
              items: [
                "HS256: HMAC-SHA256 — 最も一般的なJWT署名アルゴリズム",
                "HS384: HMAC-SHA384 — より高いセキュリティが必要な場合",
                "HS512: HMAC-SHA512 — 最高レベルのHMACセキュリティ",
              ],
            },
            {
              title: "注意事項",
              items: [
                "ブラウザ内処理のみ。データはサーバーに送信されません",
                "生成されたトークンは本番環境のシークレットで署名しないでください",
                "シークレットキーは十分に長くランダムな文字列を使用してください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
