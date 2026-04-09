import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { useToast } from "../components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { generateKeyPair, type KeyAlgorithmId, type SshKeyPair } from "~/utils/ssh-key";
import "../styles/tools/ssh-key.css";

export const Route = createFileRoute("/ssh-key")({
  head: () => ({
    meta: [
      { title: "SSH鍵生成 | Web ツール集" },
      {
        name: "description",
        content:
          "RSA (2048/4096bit) および ECDSA (P-256/P-384) の鍵ペアをブラウザ内で生成。PKCS#8 PEM・OpenSSH形式で出力。秘密鍵は外部に送信されません。",
      },
      { property: "og:title", content: "SSH鍵生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "RSA (2048/4096bit) および ECDSA (P-256/P-384) の鍵ペアをブラウザ内で生成。PKCS#8 PEM・OpenSSH形式で出力。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ssh-key` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "SSH鍵生成 | Web ツール集" },
      {
        name: "twitter:description",
        content: "RSA/ECDSA鍵ペアをブラウザ内で生成。秘密鍵は外部に送信されません。",
      },
    ],
  }),
  component: SshKeyTool,
});

/** アルゴリズム選択肢の定義 */
const ALGORITHMS: { id: KeyAlgorithmId; label: string; description: string }[] = [
  { id: "RSA-2048", label: "RSA 2048", description: "RSA 2048bit（標準）" },
  { id: "RSA-4096", label: "RSA 4096", description: "RSA 4096bit（高セキュリティ）" },
  { id: "ECDSA-P256", label: "ECDSA P-256", description: "ECDSA P-256（推奨）" },
  { id: "ECDSA-P384", label: "ECDSA P-384", description: "ECDSA P-384（高セキュリティ）" },
];

/** 公開鍵表示タブの種別 */
type PublicKeyTab = "pem" | "openssh";

/** SSH鍵生成ツールのメインコンポーネント */
function SshKeyTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [algorithm, setAlgorithm] = useState<KeyAlgorithmId>("ECDSA-P256");
  const [keyPair, setKeyPair] = useState<SshKeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [publicKeyTab, setPublicKeyTab] = useState<PublicKeyTab>("openssh");

  /** 鍵ペアを生成する */
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setKeyPair(null);
    announceStatus("鍵ペアを生成中...");
    try {
      const pair = await generateKeyPair(algorithm);
      setKeyPair(pair);
      announceStatus("鍵ペアの生成が完了しました");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "鍵の生成に失敗しました";
      showToast(msg, "error");
      announceStatus(`エラー: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }, [algorithm, announceStatus, showToast]);

  /** テキストをクリップボードにコピーする */
  const handleCopy = useCallback(
    async (value: string, label: string) => {
      const ok = await copy(value);
      if (ok) {
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  return (
    <>
      <div className="tool-container">
        <h1 className="section-title">SSH鍵生成</h1>

        {/* セキュリティ警告 */}
        <div className="ssh-key-warning" role="note">
          <span className="ssh-key-warning-icon" aria-hidden="true">
            🔒
          </span>
          <span>
            鍵ペアはブラウザ内（SubtleCrypto
            API）で生成されます。秘密鍵は外部のサーバーに送信されません。
          </span>
        </div>

        {/* アルゴリズム選択 */}
        <div className="converter-section">
          <p className="section-title">アルゴリズム</p>
          <div className="ssh-key-algo-selector" role="group" aria-label="鍵アルゴリズムを選択">
            {ALGORITHMS.map(({ id, label, description }) => (
              <button
                key={id}
                type="button"
                className={`ssh-key-algo-btn${algorithm === id ? " active" : ""}`}
                onClick={() => setAlgorithm(id)}
                aria-pressed={algorithm === id}
                title={description}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 生成ボタン */}
        <div className="button-group">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            aria-busy={isGenerating}
            aria-label="鍵ペアを生成する"
          >
            {isGenerating ? (
              <span className="ssh-key-loading">
                <span className="ssh-key-loading-spinner" aria-hidden="true" />
                生成中...
              </span>
            ) : (
              "鍵ペアを生成"
            )}
          </Button>
        </div>

        {/* 生成結果 */}
        {keyPair && (
          <>
            {/* 秘密鍵 */}
            <div className="converter-section">
              <div className="ssh-key-output-section">
                <p className="ssh-key-output-label">秘密鍵（PKCS#8 PEM形式）</p>
                <p className="section-title" />
                <div className="ssh-key-output-row">
                  <pre
                    className="ssh-key-output-area"
                    aria-label="秘密鍵（PKCS#8 PEM）"
                    tabIndex={0}
                  >
                    {keyPair.privateKeyPem}
                  </pre>
                  <Button
                    variant="secondary"
                    onClick={() => handleCopy(keyPair.privateKeyPem, "秘密鍵")}
                    aria-label="秘密鍵をコピー"
                  >
                    コピー
                  </Button>
                </div>
              </div>
            </div>

            {/* 公開鍵 */}
            <div className="converter-section">
              <div className="ssh-key-output-section">
                <p className="ssh-key-output-label">公開鍵</p>

                {/* タブ切り替え */}
                <div className="ssh-key-public-tabs" role="tablist" aria-label="公開鍵フォーマット">
                  <button
                    type="button"
                    role="tab"
                    className={`ssh-key-public-tab${publicKeyTab === "openssh" ? " active" : ""}`}
                    onClick={() => setPublicKeyTab("openssh")}
                    aria-selected={publicKeyTab === "openssh"}
                    id="tab-openssh"
                    aria-controls="panel-openssh"
                  >
                    OpenSSH形式
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`ssh-key-public-tab${publicKeyTab === "pem" ? " active" : ""}`}
                    onClick={() => setPublicKeyTab("pem")}
                    aria-selected={publicKeyTab === "pem"}
                    id="tab-pem"
                    aria-controls="panel-pem"
                  >
                    PEM公開鍵
                  </button>
                </div>

                {publicKeyTab === "openssh" && (
                  <div role="tabpanel" id="panel-openssh" aria-labelledby="tab-openssh">
                    <p className="ssh-key-output-label">
                      ~/.ssh/authorized_keys に追記して使用します
                    </p>
                    <div className="ssh-key-output-row">
                      <pre className="ssh-key-output-area" aria-label="OpenSSH公開鍵" tabIndex={0}>
                        {keyPair.publicKeyOpenSsh}
                      </pre>
                      <Button
                        variant="secondary"
                        onClick={() => handleCopy(keyPair.publicKeyOpenSsh, "OpenSSH公開鍵")}
                        aria-label="OpenSSH公開鍵をコピー"
                      >
                        コピー
                      </Button>
                    </div>
                  </div>
                )}

                {publicKeyTab === "pem" && (
                  <div role="tabpanel" id="panel-pem" aria-labelledby="tab-pem">
                    <div className="ssh-key-output-row">
                      <pre
                        className="ssh-key-output-area"
                        aria-label="PEM公開鍵（SPKI形式）"
                        tabIndex={0}
                      >
                        {keyPair.publicKeyPem}
                      </pre>
                      <Button
                        variant="secondary"
                        onClick={() => handleCopy(keyPair.publicKeyPem, "PEM公開鍵")}
                        aria-label="PEM公開鍵をコピー"
                      >
                        コピー
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <TipsCard
          sections={[
            {
              title: "アルゴリズムの選び方",
              items: [
                "ECDSA P-256: 推奨。短い鍵長で高いセキュリティ。最新のSSHクライアントで対応。",
                "ECDSA P-384: P-256より高セキュリティ。政府・金融系システムでの要件に対応。",
                "RSA 2048: 広く対応。レガシーシステムとの互換性が必要な場合に選択。",
                "RSA 4096: RSAで最高のセキュリティ。処理が遅く、鍵が長くなります。",
              ],
            },
            {
              title: "SSH鍵の使い方",
              items: [
                "秘密鍵は ~/.ssh/id_ecdsa や ~/.ssh/id_rsa などに保存します",
                "公開鍵（OpenSSH形式）は接続先の ~/.ssh/authorized_keys に追記します",
                "秘密鍵ファイルのパーミッションは必ず 600 に設定してください",
                "chmod 600 ~/.ssh/id_ecdsa",
              ],
            },
            {
              title: "セキュリティについて",
              items: [
                "鍵の生成は完全にブラウザ内で行われます（外部送信なし）",
                "生成した秘密鍵は安全な場所に保管してください",
                "パスフレーズで秘密鍵を保護することを推奨します",
                "ssh-keygen -p -f ~/.ssh/id_ecdsa でパスフレーズを設定できます",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
