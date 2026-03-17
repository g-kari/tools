import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useRef } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  parseCertificate,
  formatDN,
  type CertificateInfo,
} from '~/utils/cert-decoder';
import '../styles/tools/cert-decoder.css';

export const Route = createFileRoute('/cert-decoder')({
  head: () => ({
    meta: [
      { title: 'X.509 証明書デコーダー | Web ツール集' },
      {
        name: 'description',
        content:
          'PEM 形式の X.509 証明書を解析して Subject、Issuer、有効期限、SANs、鍵用途、フィンガープリントを表示します。ブラウザ内完結で外部送信なし。',
      },
      { property: 'og:title', content: 'X.509 証明書デコーダー | Web ツール集' },
      {
        property: 'og:description',
        content:
          'PEM 形式の X.509 証明書を解析して Subject、Issuer、有効期限、SANs、鍵用途、フィンガープリントを表示します。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/cert-decoder` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'X.509 証明書デコーダー | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'PEM 形式の X.509 証明書を解析。SANs・有効期限・フィンガープリントを表示。',
      },
    ],
  }),
  component: CertDecoder,
});

/** ISRG Root X1 のサンプル PEM (Let's Encrypt ルート CA) */
const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoBggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAgEBMB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPa
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

/** 有効期限ステータスバナー */
function StatusBanner({ cert }: { cert: CertificateInfo }) {
  if (cert.isExpired) {
    return (
      <div className="cert-status-banner cert-status-banner-expired" role="alert">
        <span className="cert-status-icon" aria-hidden="true">✕</span>
        <span className="cert-status-text">
          この証明書は期限切れです
          <span className="cert-status-days">
            {' '}（{Math.abs(cert.daysUntilExpiry)} 日前に失効）
          </span>
        </span>
      </div>
    );
  }
  if (cert.daysUntilExpiry <= 30) {
    return (
      <div className="cert-status-banner cert-status-banner-warning" role="alert">
        <span className="cert-status-icon" aria-hidden="true">⚠</span>
        <span className="cert-status-text">
          証明書の有効期限が近づいています
          <span className="cert-status-days">
            {' '}（残り {cert.daysUntilExpiry} 日）
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className="cert-status-banner cert-status-banner-valid" role="status">
      <span className="cert-status-icon" aria-hidden="true">✓</span>
      <span className="cert-status-text">
        証明書は有効です
        <span className="cert-status-days">
          {' '}（残り {cert.daysUntilExpiry} 日）
        </span>
      </span>
    </div>
  );
}

/** SAN アイテムの CSS クラスを返す */
function sanItemClass(san: string): string {
  if (san.startsWith('email:')) return 'cert-san-item cert-san-item-email';
  if (san.startsWith('uri:')) return 'cert-san-item cert-san-item-uri';
  if (/^\d+\.\d+/.test(san) || /^[0-9a-f:]+$/i.test(san)) return 'cert-san-item cert-san-item-ip';
  return 'cert-san-item cert-san-item-dns';
}

/** 証明書結果表示 */
function CertResult({ cert, onCopy }: { cert: CertificateInfo; onCopy: (v: string, label: string) => void }) {
  const dateOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    timeZone: 'UTC',
  };
  const fmtDate = (d: Date) => d.toLocaleString('ja-JP', dateOpts);

  const algoLabel = cert.publicKeyAlgorithm === 'rsaEncryption'
    ? `RSA${cert.publicKeySize ? ` ${cert.publicKeySize} bit` : ''}`
    : cert.publicKeyAlgorithm === 'ecPublicKey'
      ? `EC (${cert.publicKeyCurve ?? '?'})${cert.publicKeySize ? ` ${cert.publicKeySize} bit` : ''}`
      : cert.publicKeyAlgorithm;

  const sigAlgoLabel: Record<string, string> = {
    sha256WithRSAEncryption: 'SHA-256 with RSA',
    sha384WithRSAEncryption: 'SHA-384 with RSA',
    sha512WithRSAEncryption: 'SHA-512 with RSA',
    sha1WithRSAEncryption: 'SHA-1 with RSA',
    md5WithRSAEncryption: 'MD5 with RSA',
    'ecdsa-with-SHA256': 'ECDSA with SHA-256',
    'ecdsa-with-SHA384': 'ECDSA with SHA-384',
    'ecdsa-with-SHA512': 'ECDSA with SHA-512',
    Ed25519: 'Ed25519',
    Ed448: 'Ed448',
  };

  const isDeprecatedSig = ['sha1WithRSAEncryption', 'md5WithRSAEncryption'].includes(
    cert.signatureAlgorithm,
  );

  return (
    <div className="cert-result" aria-label="証明書情報">
      <StatusBanner cert={cert} />

      {/* 基本情報 */}
      <div className="cert-section">
        <p className="cert-section-title">基本情報</p>
        <div className="cert-field">
          <span className="cert-field-key">バージョン</span>
          <span className="cert-field-value">v{cert.version}</span>
        </div>
        <div className="cert-field">
          <span className="cert-field-key">シリアル番号</span>
          <span className="cert-field-value cert-field-value-mono">{cert.serialNumber}</span>
        </div>
        <div className="cert-field">
          <span className="cert-field-key">種別</span>
          <span className="cert-field-value">
            {cert.isCA ? (
              <span className="cert-badge cert-badge-ca">CA 証明書</span>
            ) : (
              <span className="cert-badge cert-badge-end-entity">エンドエンティティ</span>
            )}
            {cert.isCA && cert.pathLenConstraint !== undefined && (
              <span className="cert-field-value cert-pathlen">
                pathLen: {cert.pathLenConstraint}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Subject */}
      <div className="cert-section">
        <p className="cert-section-title">サブジェクト (Subject)</p>
        {(['CN', 'O', 'OU', 'L', 'ST', 'C'] as const).map((key) =>
          cert.subject[key] ? (
            <div key={key} className="cert-field">
              <span className="cert-field-key">{key}</span>
              <span className="cert-field-value">{cert.subject[key]}</span>
            </div>
          ) : null,
        )}
        {/* その他フィールド */}
        {Object.entries(cert.subject)
          .filter(([k]) => !['CN', 'O', 'OU', 'L', 'ST', 'C'].includes(k))
          .map(([k, v]) =>
            v ? (
              <div key={k} className="cert-field">
                <span className="cert-field-key">{k}</span>
                <span className="cert-field-value">{v}</span>
              </div>
            ) : null,
          )}
        <div className="cert-field">
          <span className="cert-field-key">DN 文字列</span>
          <span className="cert-field-value cert-field-value-mono">{formatDN(cert.subject)}</span>
        </div>
      </div>

      {/* Issuer */}
      <div className="cert-section">
        <p className="cert-section-title">発行者 (Issuer)</p>
        {(['CN', 'O', 'OU', 'L', 'ST', 'C'] as const).map((key) =>
          cert.issuer[key] ? (
            <div key={key} className="cert-field">
              <span className="cert-field-key">{key}</span>
              <span className="cert-field-value">{cert.issuer[key]}</span>
            </div>
          ) : null,
        )}
        <div className="cert-field">
          <span className="cert-field-key">DN 文字列</span>
          <span className="cert-field-value cert-field-value-mono">{formatDN(cert.issuer)}</span>
        </div>
      </div>

      {/* 有効期限 */}
      <div className="cert-section">
        <p className="cert-section-title">有効期限</p>
        <div className="cert-field">
          <span className="cert-field-key">開始 (notBefore)</span>
          <span className="cert-field-value">{fmtDate(cert.validFrom)}</span>
        </div>
        <div className="cert-field">
          <span className="cert-field-key">終了 (notAfter)</span>
          <span className="cert-field-value">{fmtDate(cert.validTo)}</span>
        </div>
      </div>

      {/* 公開鍵 & 署名 */}
      <div className="cert-section">
        <p className="cert-section-title">公開鍵 & 署名アルゴリズム</p>
        <div className="cert-field">
          <span className="cert-field-key">公開鍵</span>
          <span className="cert-field-value">{algoLabel}</span>
        </div>
        <div className="cert-field">
          <span className="cert-field-key">署名アルゴリズム</span>
          <span className="cert-field-value">
            {sigAlgoLabel[cert.signatureAlgorithm] ?? cert.signatureAlgorithm}
            {isDeprecatedSig && (
              <span className="cert-badge cert-badge-deprecated cert-badge-deprecated-inline">
                非推奨
              </span>
            )}
          </span>
        </div>
      </div>

      {/* SANs */}
      {cert.sans.length > 0 && (
        <div className="cert-section">
          <p className="cert-section-title">
            Subject Alternative Names ({cert.sans.length})
          </p>
          <ul className="cert-san-list" aria-label="SANs 一覧">
            {cert.sans.map((san, i) => (
              <li key={i} className={sanItemClass(san)}>
                {san.startsWith('email:') ? san.slice(6) : san.startsWith('uri:') ? san.slice(4) : san}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 鍵用途 */}
      {(cert.keyUsage.length > 0 || cert.extendedKeyUsage.length > 0) && (
        <div className="cert-section">
          <p className="cert-section-title">鍵用途</p>
          {cert.keyUsage.length > 0 && (
            <div className="cert-field">
              <span className="cert-field-key">Key Usage</span>
              <span className="cert-field-value">
                <div className="cert-usage-tags">
                  {cert.keyUsage.map((u) => (
                    <span key={u} className="cert-usage-tag">{u}</span>
                  ))}
                </div>
              </span>
            </div>
          )}
          {cert.extendedKeyUsage.length > 0 && (
            <div className="cert-field">
              <span className="cert-field-key">Extended Key Usage</span>
              <span className="cert-field-value">
                <div className="cert-usage-tags">
                  {cert.extendedKeyUsage.map((u) => (
                    <span key={u} className="cert-usage-tag">{u}</span>
                  ))}
                </div>
              </span>
            </div>
          )}
        </div>
      )}

      {/* フィンガープリント */}
      <div className="cert-section">
        <p className="cert-section-title">フィンガープリント</p>
        <div className="cert-field">
          <span className="cert-field-key">SHA-1 / SHA-256</span>
          <span className="cert-field-value">
            <div className="cert-fingerprint-row">
              <div className="cert-fingerprint-item">
                <span className="cert-fingerprint-algo">SHA-1</span>
                <span
                  className="cert-fingerprint-value"
                  onClick={() => onCopy(cert.fingerprints.sha1, 'SHA-1 フィンガープリント')}
                  title="クリックでコピー"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onCopy(cert.fingerprints.sha1, 'SHA-1 フィンガープリント')}
                  aria-label="SHA-1 フィンガープリントをコピー"
                >
                  {cert.fingerprints.sha1}
                </span>
              </div>
              <div className="cert-fingerprint-item">
                <span className="cert-fingerprint-algo">SHA-256</span>
                <span
                  className="cert-fingerprint-value"
                  onClick={() => onCopy(cert.fingerprints.sha256, 'SHA-256 フィンガープリント')}
                  title="クリックでコピー"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onCopy(cert.fingerprints.sha256, 'SHA-256 フィンガープリント')}
                  aria-label="SHA-256 フィンガープリントをコピー"
                >
                  {cert.fingerprints.sha256}
                </span>
              </div>
            </div>
          </span>
        </div>
      </div>
    </div>
  );
}

/** メインコンポーネント */
function CertDecoder() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [pem, setPem] = useState('');
  const [cert, setCert] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = useCallback(async () => {
    const trimmed = pem.trim();
    if (!trimmed) {
      setError('PEM 証明書を入力してください');
      return;
    }
    setIsParsing(true);
    setError(null);
    setCert(null);
    try {
      const result = await parseCertificate(trimmed);
      setCert(result);
      announceStatus('証明書の解析が完了しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '証明書の解析に失敗しました';
      setError(msg);
      announceStatus(`エラー: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  }, [pem, announceStatus]);

  const handleClear = useCallback(() => {
    setPem('');
    setCert(null);
    setError(null);
    textareaRef.current?.focus();
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleSample = useCallback(() => {
    setPem(SAMPLE_PEM);
    setCert(null);
    setError(null);
    announceStatus('サンプル証明書を読み込みました');
  }, [announceStatus]);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      const ok = await copy(value);
      if (ok) {
        showToast(`${label} をコピーしました`, 'success');
        announceStatus(`${label} をコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleParse();
      }
    },
    [handleParse],
  );

  return (
    <>
      <div className="tool-container">
        {/* 入力エリア */}
        <div className="converter-section">
          <label htmlFor="cert-pem-input" className="section-title">
            PEM 証明書を貼り付け
          </label>
          <textarea
            id="cert-pem-input"
            ref={textareaRef}
            value={pem}
            onChange={(e) => setPem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'}
            aria-label="PEM 形式の X.509 証明書"
            aria-describedby="cert-input-hint"
            spellCheck={false}
            rows={8}
          />
          <p id="cert-input-hint" className="cert-input-hint">
            Ctrl+Enter で解析。ブラウザ内で処理されます（外部送信なし）
          </p>
          <button
            type="button"
            className="cert-sample-btn"
            onClick={handleSample}
            aria-label="サンプル証明書 (ISRG Root X1) を読み込む"
          >
            サンプル証明書を読み込む
          </button>
        </div>

        {/* ボタン */}
        <div className="button-group">
          <button
            type="button"
            className="btn-primary"
            onClick={handleParse}
            disabled={isParsing || !pem.trim()}
            aria-busy={isParsing}
          >
            {isParsing ? '解析中...' : '解析'}
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!pem && !cert && !error}
          >
            クリア
          </button>
        </div>

        {/* エラー */}
        {error && (
          <div className="cert-error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {/* 結果 */}
        {cert && <CertResult cert={cert} onCopy={handleCopy} />}

        {/* 空状態 */}
        {!cert && !error && (
          <div className="cert-empty" aria-hidden="true">
            <p>PEM 証明書を貼り付けて「解析」をクリックしてください</p>
            <p className="cert-empty-hint">
              -----BEGIN CERTIFICATE----- で始まる PEM 形式に対応しています
            </p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'PEM 形式の証明書を貼り付けて「解析」ボタンをクリックします',
                '「サンプル証明書を読み込む」で Let\'s Encrypt Root CA の例を試せます',
                'Ctrl+Enter でも解析できます',
                'フィンガープリントはクリックでコピーできます',
                'ブラウザ内で完結するため、証明書データが外部へ送信されることはありません',
              ],
            },
            {
              title: 'PEM 証明書の取得方法',
              items: [
                'ブラウザの鍵アイコン → 証明書を表示 → PEM エクスポート',
                'openssl s_client -connect example.com:443 -showcerts',
                'openssl x509 -in cert.crt -text',
                '各 CA の公式サイトからルート証明書をダウンロード',
              ],
            },
            {
              title: '証明書の主要フィールド',
              items: [
                'CN (Common Name): サーバーのドメイン名や CA の名称',
                'SAN (Subject Alternative Names): 証明書が有効なドメイン・IP のリスト',
                'Key Usage: 証明書の用途 (Digital Signature、Key Encipherment など)',
                'Extended Key Usage: TLS/SSL サーバー認証、クライアント認証など',
                'Basic Constraints: CA 証明書かどうか、パス長制約',
                'Fingerprint: 証明書の SHA-256 ハッシュ（改ざん検知・同一性確認に使用）',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
