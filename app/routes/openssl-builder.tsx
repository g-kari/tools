import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import "../styles/tools/openssl-builder.css";
import {
  buildOpenSslCommand,
  getDefaultConfig,
  SAMPLE_CONFIGS,
} from "../utils/openssl-builder";
import type {
  OpenSslConfig,
  OpenSslOperation,
  RsaKeySize,
  EcCurve,
  HashAlgorithm,
  OutputFormat,
} from "../utils/openssl-builder";

export const Route = createFileRoute("/openssl-builder")({
  head: () => ({
    meta: [
      { title: "OpenSSLコマンドジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応。",
      },
      {
        property: "og:title",
        content: "OpenSSLコマンドジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/openssl-builder` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "OpenSSLコマンドジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応。",
      },
    ],
  }),
  component: OpenSslBuilderPage,
});

const OPERATIONS: { value: OpenSslOperation; label: string }[] = [
  { value: "genrsa", label: "RSA秘密鍵の生成 (genrsa)" },
  { value: "ecparam", label: "EC秘密鍵の生成 (genpkey)" },
  { value: "req-x509", label: "自己署名証明書の生成 (req -x509)" },
  { value: "req-csr", label: "CSRの生成 (req -new)" },
  { value: "x509-view", label: "証明書の確認 (x509 -text)" },
  { value: "pkcs12", label: "PKCS12変換 (pkcs12 -export)" },
];

const RSA_KEY_SIZES: RsaKeySize[] = [1024, 2048, 3072, 4096];

const EC_CURVES: { value: EcCurve; label: string }[] = [
  { value: "prime256v1", label: "prime256v1 (P-256)" },
  { value: "secp384r1", label: "secp384r1 (P-384)" },
  { value: "secp521r1", label: "secp521r1 (P-521)" },
];

const HASH_ALGORITHMS: { value: HashAlgorithm; label: string }[] = [
  { value: "sha256", label: "SHA-256" },
  { value: "sha384", label: "SHA-384" },
  { value: "sha512", label: "SHA-512" },
];

/**
 * OpenSSLコマンドジェネレーターのメインコンポーネント
 * OpenSSL操作をGUIで設定し、コマンドをリアルタイム生成する
 */
function OpenSslBuilderPage() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [config, setConfig] = useState<OpenSslConfig>(getDefaultConfig());

  const opensslCommand = useMemo(
    () => buildOpenSslCommand(config),
    [config]
  );

  const updateConfig = useCallback(
    (updates: Partial<OpenSslConfig>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updateSubject = useCallback(
    (field: keyof OpenSslConfig["subject"], value: string) => {
      setConfig((prev) => ({
        ...prev,
        subject: { ...prev.subject, [field]: value },
      }));
    },
    []
  );

  const handleOperationChange = useCallback(
    (operation: OpenSslOperation) => {
      updateConfig({ operation });
    },
    [updateConfig]
  );

  const handleFormatChange = useCallback(
    (outputFormat: OutputFormat) => {
      updateConfig({ outputFormat });
    },
    [updateConfig]
  );

  const handleLoadSample = useCallback(
    (sampleKey: string) => {
      if (sampleKey && SAMPLE_CONFIGS[sampleKey]) {
        setConfig(SAMPLE_CONFIGS[sampleKey]);
        announceStatus(`サンプル「${sampleKey}」を読み込みました`);
        showToast(`サンプル「${sampleKey}」を読み込みました`, "success");
      }
    },
    [announceStatus, showToast]
  );

  const handleClear = useCallback(() => {
    setConfig(getDefaultConfig());
    announceStatus("設定をクリアしました");
  }, [announceStatus]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(opensslCommand);
      announceStatus("OpenSSLコマンドをクリップボードにコピーしました");
      showToast("OpenSSLコマンドをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [opensslCommand, announceStatus, showToast]);

  const showSubjectFields =
    config.operation === "req-x509" || config.operation === "req-csr";
  const showRsaFields = config.operation === "genrsa";
  const showEcFields = config.operation === "ecparam";
  const showPassphrase =
    config.operation === "genrsa" ||
    config.operation === "ecparam" ||
    config.operation === "pkcs12";
  const showInputKey =
    config.operation === "req-x509" ||
    config.operation === "req-csr" ||
    config.operation === "pkcs12";
  const showInputCert =
    config.operation === "x509-view" || config.operation === "pkcs12";
  const showOutputKey =
    config.operation === "genrsa" || config.operation === "ecparam";
  const showOutputCert = config.operation === "req-x509";
  const showOutputCsr = config.operation === "req-csr";
  const showOutputPkcs12 = config.operation === "pkcs12";
  const showDays = config.operation === "req-x509";
  const showHashAlgorithm =
    config.operation === "req-x509" || config.operation === "req-csr";

  return (
    <>
      <div className="tool-container">
        <h1 className="tool-title">OpenSSLコマンドジェネレーター</h1>
        <p className="tool-description">
          OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応。
        </p>

        <div className="ob-layout">
          {/* 左パネル: 設定 */}
          <div className="ob-panel">
            <span className="ob-panel-label">操作設定</span>

            {/* 操作選択 */}
            <div className="ob-field-row">
              <label className="ob-field-label" htmlFor="ob-operation">
                操作の種類
              </label>
              <select
                id="ob-operation"
                className="ob-operation-select"
                value={config.operation}
                onChange={(e) =>
                  handleOperationChange(e.target.value as OpenSslOperation)
                }
                aria-label="OpenSSL操作の種類を選択"
              >
                {OPERATIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RSA鍵サイズ */}
            {showRsaFields && (
              <div className="ob-fields-group">
                <span className="ob-section-title">RSA鍵設定</span>
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-rsa-size">
                    鍵サイズ（ビット）
                  </label>
                  <select
                    id="ob-rsa-size"
                    className="ob-field-select"
                    value={config.rsaKeySize}
                    onChange={(e) =>
                      updateConfig({ rsaKeySize: Number(e.target.value) as RsaKeySize })
                    }
                    aria-label="RSA鍵サイズを選択"
                  >
                    {RSA_KEY_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} bit
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* EC曲線 */}
            {showEcFields && (
              <div className="ob-fields-group">
                <span className="ob-section-title">EC鍵設定</span>
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-ec-curve">
                    楕円曲線
                  </label>
                  <select
                    id="ob-ec-curve"
                    className="ob-field-select"
                    value={config.ecCurve}
                    onChange={(e) =>
                      updateConfig({ ecCurve: e.target.value as EcCurve })
                    }
                    aria-label="楕円曲線を選択"
                  >
                    {EC_CURVES.map((curve) => (
                      <option key={curve.value} value={curve.value}>
                        {curve.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ファイル設定 */}
            <div className="ob-fields-group">
              <span className="ob-section-title">ファイル設定</span>

              {showOutputKey && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-output-key">
                    出力鍵ファイル
                  </label>
                  <input
                    id="ob-output-key"
                    type="text"
                    className="ob-field-input"
                    value={config.outputKeyFile}
                    onChange={(e) =>
                      updateConfig({ outputKeyFile: e.target.value })
                    }
                    placeholder="private.key"
                    aria-label="出力鍵ファイルのパス"
                  />
                </div>
              )}

              {showInputKey && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-input-key">
                    入力鍵ファイル
                  </label>
                  <input
                    id="ob-input-key"
                    type="text"
                    className="ob-field-input"
                    value={config.inputKeyFile}
                    onChange={(e) =>
                      updateConfig({ inputKeyFile: e.target.value })
                    }
                    placeholder="private.key"
                    aria-label="入力鍵ファイルのパス"
                  />
                </div>
              )}

              {showInputCert && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-input-cert">
                    入力証明書ファイル
                  </label>
                  <input
                    id="ob-input-cert"
                    type="text"
                    className="ob-field-input"
                    value={config.inputCertFile}
                    onChange={(e) =>
                      updateConfig({ inputCertFile: e.target.value })
                    }
                    placeholder="certificate.crt"
                    aria-label="入力証明書ファイルのパス"
                  />
                </div>
              )}

              {showOutputCert && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-output-cert">
                    出力証明書ファイル
                  </label>
                  <input
                    id="ob-output-cert"
                    type="text"
                    className="ob-field-input"
                    value={config.outputCertFile}
                    onChange={(e) =>
                      updateConfig({ outputCertFile: e.target.value })
                    }
                    placeholder="certificate.crt"
                    aria-label="出力証明書ファイルのパス"
                  />
                </div>
              )}

              {showOutputCsr && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-output-csr">
                    出力CSRファイル
                  </label>
                  <input
                    id="ob-output-csr"
                    type="text"
                    className="ob-field-input"
                    value={config.outputCsrFile}
                    onChange={(e) =>
                      updateConfig({ outputCsrFile: e.target.value })
                    }
                    placeholder="server.csr"
                    aria-label="出力CSRファイルのパス"
                  />
                </div>
              )}

              {showOutputPkcs12 && (
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-output-pkcs12">
                    出力PKCS12ファイル
                  </label>
                  <input
                    id="ob-output-pkcs12"
                    type="text"
                    className="ob-field-input"
                    value={config.outputPkcs12File}
                    onChange={(e) =>
                      updateConfig({ outputPkcs12File: e.target.value })
                    }
                    placeholder="bundle.p12"
                    aria-label="出力PKCS12ファイルのパス"
                  />
                </div>
              )}
            </div>

            {/* パスフレーズ */}
            {showPassphrase && (
              <div className="ob-fields-group">
                <span className="ob-section-title">パスフレーズ（任意）</span>
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-passphrase">
                    パスフレーズ
                  </label>
                  <input
                    id="ob-passphrase"
                    type="password"
                    className="ob-passphrase-input"
                    value={config.passphrase}
                    onChange={(e) =>
                      updateConfig({ passphrase: e.target.value })
                    }
                    placeholder="省略可（設定するとAES-256で暗号化）"
                    aria-label="鍵ファイルのパスフレーズ"
                  />
                </div>
              </div>
            )}

            {/* ハッシュアルゴリズム */}
            {showHashAlgorithm && (
              <div className="ob-fields-group">
                <span className="ob-section-title">署名設定</span>
                <div className="ob-field-row">
                  <label className="ob-field-label" htmlFor="ob-hash">
                    ハッシュアルゴリズム
                  </label>
                  <select
                    id="ob-hash"
                    className="ob-field-select"
                    value={config.hashAlgorithm}
                    onChange={(e) =>
                      updateConfig({ hashAlgorithm: e.target.value as HashAlgorithm })
                    }
                    aria-label="ハッシュアルゴリズムを選択"
                  >
                    {HASH_ALGORITHMS.map((alg) => (
                      <option key={alg.value} value={alg.value}>
                        {alg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {showDays && (
                  <div className="ob-field-row">
                    <label className="ob-field-label" htmlFor="ob-days">
                      有効期間（日数）
                    </label>
                    <input
                      id="ob-days"
                      type="number"
                      className="ob-days-input"
                      value={config.days}
                      onChange={(e) =>
                        updateConfig({ days: Math.max(1, parseInt(e.target.value) || 365) })
                      }
                      min={1}
                      max={36500}
                      aria-label="証明書の有効期間（日数）"
                    />
                  </div>
                )}
              </div>
            )}

            {/* サブジェクト情報 */}
            {showSubjectFields && (
              <div className="ob-subject-group">
                <span className="ob-section-title">サブジェクト情報</span>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">CN</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.cn}
                    onChange={(e) => updateSubject("cn", e.target.value)}
                    placeholder="example.com"
                    aria-label="コモンネーム（CN）"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">O</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.o}
                    onChange={(e) => updateSubject("o", e.target.value)}
                    placeholder="My Company"
                    aria-label="組織名（O）"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">OU</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.ou}
                    onChange={(e) => updateSubject("ou", e.target.value)}
                    placeholder="IT Department"
                    aria-label="組織単位名（OU）"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">C</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.c}
                    onChange={(e) => updateSubject("c", e.target.value)}
                    placeholder="JP"
                    maxLength={2}
                    aria-label="国コード（C）2文字"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">ST</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.st}
                    onChange={(e) => updateSubject("st", e.target.value)}
                    placeholder="Tokyo"
                    aria-label="都道府県・州名（ST）"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">L</span>
                  <input
                    type="text"
                    className="ob-subject-input"
                    value={config.subject.l}
                    onChange={(e) => updateSubject("l", e.target.value)}
                    placeholder="Shibuya"
                    aria-label="市区町村名（L）"
                  />
                </div>
                <div className="ob-subject-row">
                  <span className="ob-subject-key" aria-hidden="true">Mail</span>
                  <input
                    type="email"
                    className="ob-subject-input"
                    value={config.subject.email}
                    onChange={(e) => updateSubject("email", e.target.value)}
                    placeholder="admin@example.com"
                    aria-label="メールアドレス（emailAddress）"
                  />
                </div>
              </div>
            )}

            {/* 出力フォーマット */}
            <div
              className="ob-format-group"
              role="group"
              aria-label="出力フォーマット"
            >
              <span className="ob-format-label">フォーマット:</span>
              <label className="ob-format-option">
                <input
                  type="radio"
                  name="ob-outputFormat"
                  value="multiline"
                  checked={config.outputFormat === "multiline"}
                  onChange={() => handleFormatChange("multiline")}
                />
                複数行
              </label>
              <label className="ob-format-option">
                <input
                  type="radio"
                  name="ob-outputFormat"
                  value="single"
                  checked={config.outputFormat === "single"}
                  onChange={() => handleFormatChange("single")}
                />
                1行
              </label>
            </div>

            {/* アクション */}
            <div className="ob-actions">
              <select
                className="ob-sample-select"
                onChange={(e) => handleLoadSample(e.target.value)}
                value=""
                aria-label="サンプルを選択して読み込む"
              >
                <option value="" disabled>
                  サンプルを選択...
                </option>
                {Object.keys(SAMPLE_CONFIGS).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ob-btn"
                onClick={handleClear}
                aria-label="設定をクリアする"
              >
                クリア
              </button>
            </div>
          </div>

          {/* 右パネル: コマンド出力 */}
          <div className="ob-panel">
            <span className="ob-panel-label">生成されたOpenSSLコマンド</span>

            <pre
              className="ob-output-area"
              role="region"
              aria-label="生成されたOpenSSLコマンド"
              aria-live="polite"
            >
              {opensslCommand}
            </pre>

            <div className="ob-actions">
              <button
                type="button"
                className="ob-btn ob-btn--primary"
                onClick={handleCopy}
                disabled={!opensslCommand}
                aria-label="OpenSSLコマンドをクリップボードにコピーする"
              >
                コピー
              </button>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左パネルで操作の種類を選択します",
                "ファイルパスやサブジェクト情報を入力します",
                "右パネルにOpenSSLコマンドがリアルタイムで生成されます",
                "「コピー」ボタンでコマンドをクリップボードにコピーできます",
                "「サンプルを選択」から一般的な操作のサンプルを読み込めます",
              ],
            },
            {
              title: "操作説明",
              items: [
                "RSA秘密鍵: openssl genrsa で指定ビット数のRSA秘密鍵を生成",
                "EC秘密鍵: openssl genpkey で楕円曲線暗号の秘密鍵を生成",
                "自己署名証明書: req -x509 でテスト・開発用の自己署名証明書を生成",
                "CSR: req -new で認証局(CA)に提出するCSRを生成",
                "証明書確認: x509 -text で証明書の詳細情報を表示",
                "PKCS12変換: pkcs12 -export で証明書と鍵を.p12/.pfxファイルに変換",
              ],
            },
            {
              title: "セキュリティ注意事項",
              items: [
                "RSA鍵は2048bit以上を推奨（1024bitは安全ではない）",
                "本番環境の証明書には認証局(CA)発行の証明書を使用してください",
                "自己署名証明書はブラウザの警告が表示されます（開発環境向け）",
                "パスフレーズはサーバー起動時に毎回入力が必要になります",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
