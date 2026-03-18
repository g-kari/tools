import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/basic-auth")({
  head: () => ({
    meta: [
      { title: "HTTP Basic Auth エンコーダー | Web ツール集" },
      {
        name: "description",
        content:
          "HTTP Basic認証ヘッダーをエンコード・デコードするツール。ユーザー名とパスワードからAuthorization: Basicヘッダーを生成。ブラウザ内完結でデータは外部に送信されません。",
      },
      {
        property: "og:title",
        content: "HTTP Basic Auth エンコーダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "HTTP Basic認証ヘッダーをエンコード・デコードするツール。ユーザー名とパスワードからAuthorization: Basicヘッダーを生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/basic-auth` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "HTTP Basic Auth エンコーダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "HTTP Basic認証ヘッダーをエンコード・デコードするツール。ユーザー名とパスワードからAuthorization: Basicヘッダーを生成。",
      },
    ],
  }),
  component: BasicAuthTool,
});

/**
 * ユーザー名とパスワードをBasic認証用にエンコードする
 * @param username ユーザー名
 * @param password パスワード
 * @returns Base64エンコードされた認証情報
 */
export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  return btoa(unescape(encodeURIComponent(credentials)));
}

/**
 * Basic認証トークンをデコードしてユーザー名とパスワードを返す
 * @param token Base64エンコードされたトークン（"Basic "プレフィックスありなし両対応）
 * @returns ユーザー名とパスワードのオブジェクト、失敗時はnull
 */
export function decodeBasicAuth(
  token: string
): { username: string; password: string } | null {
  try {
    const base64 = token.replace(/^Basic\s+/i, "").trim();
    if (!base64) return null;
    const decoded = decodeURIComponent(escape(atob(base64)));
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return null;
    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);
    return { username, password };
  } catch {
    return null;
  }
}

/**
 * HTTP Basic Auth エンコーダー/デコーダーコンポーネント
 */
function BasicAuthTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  // エンコードモード用ステート
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [encodedToken, setEncodedToken] = useState("");
  const [encodedHeader, setEncodedHeader] = useState("");

  // デコードモード用ステート
  const [decodeInput, setDecodeInput] = useState("");
  const [decodedUsername, setDecodedUsername] = useState("");
  const [decodedPassword, setDecodedPassword] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const [activeTab, setActiveTab] = useState<"encode" | "decode">("encode");
  const usernameRef = useRef<HTMLInputElement>(null);
  const decodeInputRef = useRef<HTMLTextAreaElement>(null);

  // エンコードタブのリアルタイム変換
  useEffect(() => {
    if (!username && !password) {
      setEncodedToken("");
      setEncodedHeader("");
      return;
    }
    const token = encodeBasicAuth(username, password);
    setEncodedToken(token);
    setEncodedHeader(`Authorization: Basic ${token}`);
  }, [username, password]);

  // デコードタブのリアルタイム変換
  useEffect(() => {
    if (!decodeInput.trim()) {
      setDecodedUsername("");
      setDecodedPassword("");
      setDecodeError("");
      return;
    }
    const result = decodeBasicAuth(decodeInput.trim());
    if (result) {
      setDecodedUsername(result.username);
      setDecodedPassword(result.password);
      setDecodeError("");
    } else {
      setDecodedUsername("");
      setDecodedPassword("");
      setDecodeError("無効なBase64文字列またはBasic認証ヘッダーです");
    }
  }, [decodeInput]);

  useEffect(() => {
    if (activeTab === "encode") {
      usernameRef.current?.focus();
    } else {
      decodeInputRef.current?.focus();
    }
  }, [activeTab]);

  const handleCopyToken = useCallback(async () => {
    if (!encodedToken) {
      showToast("コピーするトークンがありません", "error");
      return;
    }
    const success = await copy(encodedToken);
    if (success) {
      announceStatus("Base64トークンをコピーしました");
      showToast("Base64トークンをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [encodedToken, copy, announceStatus, showToast]);

  const handleCopyHeader = useCallback(async () => {
    if (!encodedHeader) {
      showToast("コピーするヘッダーがありません", "error");
      return;
    }
    const success = await copy(encodedHeader);
    if (success) {
      announceStatus("Authorizationヘッダーをコピーしました");
      showToast("Authorizationヘッダーをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [encodedHeader, copy, announceStatus, showToast]);

  const handleCopyDecodedUsername = useCallback(async () => {
    if (!decodedUsername) return;
    const success = await copy(decodedUsername);
    if (success) {
      showToast("ユーザー名をコピーしました", "success");
    }
  }, [decodedUsername, copy, showToast]);

  const handleCopyDecodedPassword = useCallback(async () => {
    if (!decodedPassword) return;
    const success = await copy(decodedPassword);
    if (success) {
      showToast("パスワードをコピーしました", "success");
    }
  }, [decodedPassword, copy, showToast]);

  const handleClearEncode = useCallback(() => {
    setUsername("");
    setPassword("");
    setEncodedToken("");
    setEncodedHeader("");
    announceStatus("入力をクリアしました");
    usernameRef.current?.focus();
  }, [announceStatus]);

  const handleClearDecode = useCallback(() => {
    setDecodeInput("");
    setDecodedUsername("");
    setDecodedPassword("");
    setDecodeError("");
    announceStatus("入力をクリアしました");
    decodeInputRef.current?.focus();
  }, [announceStatus]);

  // Ctrl+Enter でコピー
  useKeyboardShortcut(
    "Enter",
    activeTab === "encode" ? handleCopyHeader : handleCopyDecodedUsername,
    { ctrl: true }
  );

  return (
    <>
      <div className="tool-container">
        {/* タブ切り替え */}
        <div className="hash-input-tabs" role="tablist" aria-label="モード選択">
          <button
            role="tab"
            aria-selected={activeTab === "encode"}
            className={`hash-input-tab ${activeTab === "encode" ? "active" : ""}`}
            onClick={() => setActiveTab("encode")}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "decode"}
            className={`hash-input-tab ${activeTab === "decode" ? "active" : ""}`}
            onClick={() => setActiveTab("decode")}
          >
            デコード
          </button>
        </div>

        {/* エンコードタブ */}
        {activeTab === "encode" && (
          <div className="converter-section">
            <div className="basic-auth-form">
              <div className="basic-auth-field">
                <label htmlFor="basic-auth-username" className="section-title">
                  ユーザー名
                </label>
                <input
                  id="basic-auth-username"
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="ユーザー名入力欄"
                />
              </div>

              <div className="basic-auth-field">
                <label htmlFor="basic-auth-password" className="section-title">
                  パスワード
                </label>
                <div className="basic-auth-password-wrapper">
                  <input
                    id="basic-auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="パスワード入力欄"
                  />
                  <button
                    type="button"
                    className="basic-auth-toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "パスワードを非表示" : "パスワードを表示"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <div className="button-group" role="group" aria-label="操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleCopyHeader}
                disabled={!encodedHeader}
                aria-label="Authorizationヘッダーをコピー"
              >
                ヘッダーをコピー
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopyToken}
                disabled={!encodedToken}
                aria-label="Base64トークンのみをコピー"
              >
                トークンのみコピー
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearEncode}
                aria-label="入力をクリア"
              >
                クリア
              </Button>
            </div>

            {(username || password) && (
              <div className="basic-auth-results" aria-live="polite">
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">
                    認証情報（平文）
                  </span>
                  <code className="basic-auth-result-value">
                    {username}:{password}
                  </code>
                </div>
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">
                    Base64 トークン
                  </span>
                  <code className="basic-auth-result-value basic-auth-result-monospace">
                    {encodedToken}
                  </code>
                </div>
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">
                    Authorization ヘッダー
                  </span>
                  <code className="basic-auth-result-value basic-auth-result-monospace">
                    Authorization: Basic {encodedToken}
                  </code>
                </div>
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">
                    curl オプション
                  </span>
                  <code className="basic-auth-result-value basic-auth-result-monospace">
                    -u "{username}:{password}"
                  </code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* デコードタブ */}
        {activeTab === "decode" && (
          <div className="converter-section">
            <label htmlFor="basic-auth-decode-input" className="section-title">
              Base64トークンまたはAuthorizationヘッダー
            </label>
            <textarea
              id="basic-auth-decode-input"
              ref={decodeInputRef}
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder={`例: dXNlcm5hbWU6cGFzc3dvcmQ=\nまたは: Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=`}
              rows={3}
              aria-label="デコードするBase64トークン入力欄"
              spellCheck={false}
            />

            <div className="button-group" role="group" aria-label="操作">
              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleClearDecode}
                aria-label="入力をクリア"
              >
                クリア
              </Button>
            </div>

            {decodeError && decodeInput.trim() && (
              <div className="basic-auth-decode-error" role="alert">
                {decodeError}
              </div>
            )}

            {decodedUsername !== "" || decodedPassword !== "" ? (
              <div className="basic-auth-results" aria-live="polite">
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">ユーザー名</span>
                  <div className="basic-auth-result-row">
                    <code className="basic-auth-result-value">
                      {decodedUsername || "（空）"}
                    </code>
                    {decodedUsername && (
                      <button
                        className="basic-auth-copy-btn"
                        onClick={handleCopyDecodedUsername}
                        aria-label="ユーザー名をコピー"
                      >
                        コピー
                      </button>
                    )}
                  </div>
                </div>
                <div className="basic-auth-result-item">
                  <span className="basic-auth-result-label">パスワード</span>
                  <div className="basic-auth-result-row">
                    <code className="basic-auth-result-value">
                      {decodedPassword || "（空）"}
                    </code>
                    {decodedPassword && (
                      <button
                        className="basic-auth-copy-btn"
                        onClick={handleCopyDecodedPassword}
                        aria-label="パスワードをコピー"
                      >
                        コピー
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "【エンコード】ユーザー名とパスワードを入力するとリアルタイムでBasic認証トークンを生成",
                "【デコード】Base64トークンまたは「Authorization: Basic ...」ヘッダーを貼り付けてユーザー名とパスワードを確認",
                "「ヘッダーをコピー」でAuthorization: Basicヘッダー全体をコピー",
                "「トークンのみコピー」でBase64部分だけをコピー",
                "キーボードショートカット: Ctrl+Enter でヘッダーをコピー",
              ],
            },
            {
              title: "HTTP Basic認証とは",
              items: [
                "RFC 7617で定義されたHTTP認証スキーム",
                "ユーザー名とパスワードを「:」で連結しBase64エンコードしたもの",
                "リクエストヘッダーに「Authorization: Basic <トークン>」の形式で送信",
                "curlでは -u \"user:pass\" オプションで自動的にBasic認証ヘッダーを付与",
              ],
            },
            {
              title: "セキュリティ上の注意",
              items: [
                "Base64は暗号化ではなくエンコードのため、盗聴を防ぐには必ずHTTPS（TLS）を使用してください",
                "ブラウザ内で完結し、入力データはサーバーに送信されません",
                "本番環境ではより強固な認証方式（OAuth 2.0、JWT等）の使用を推奨します",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
