import { describe, it, expect, beforeAll } from 'vite-plus/test';
import {
  pemToDer,
  parseCertificate,
  decodeOid,
  decodeTime,
  bytesToHex,
  hexWithColon,
  formatDN,
  type CertificateInfo,
} from '../../app/utils/cert-decoder';

// ISRG Root X1 (Let's Encrypt) - 公開 CA 証明書
const ISRG_ROOT_X1_PEM = `-----BEGIN CERTIFICATE-----
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

describe('pemToDer', () => {
  it('PEM ヘッダー・フッターを除去して Base64 デコードする', () => {
    const der = pemToDer(ISRG_ROOT_X1_PEM);
    expect(der).toBeInstanceOf(Uint8Array);
    // SEQUENCE タグ (0x30) で始まる
    expect(der[0]).toBe(0x30);
    // ISRG Root X1 の DER は 1000 バイト以上ある
    expect(der.length).toBeGreaterThan(1000);
  });

  it('改行やスペースを含む Base64 も処理できる', () => {
    const pem = `-----BEGIN CERTIFICATE-----\nMIIF\nazCC\n-----END CERTIFICATE-----`;
    // 短いが形式としては処理可能
    expect(() => pemToDer(pem)).not.toThrow();
  });

  it('ヘッダー・フッターなしの Base64 も処理できる', () => {
    const b64 = 'MIIB';
    const der = pemToDer(b64);
    expect(der).toBeInstanceOf(Uint8Array);
  });
});

describe('decodeOid', () => {
  it('RSA 暗号 OID をデコードする (1.2.840.113549.1.1.1)', () => {
    // OID 1.2.840.113549.1.1.1 の DER 表現
    const oidBytes = new Uint8Array([
      0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
    ]);
    const result = decodeOid(oidBytes, 0, oidBytes.length);
    expect(result).toBe('1.2.840.113549.1.1.1');
  });

  it('Common Name OID をデコードする (2.5.4.3)', () => {
    // OID 2.5.4.3 の DER 表現
    const oidBytes = new Uint8Array([0x55, 0x04, 0x03]);
    const result = decodeOid(oidBytes, 0, oidBytes.length);
    expect(result).toBe('2.5.4.3');
  });

  it('空バイト列に対して空文字列を返す', () => {
    const result = decodeOid(new Uint8Array([]), 0, 0);
    expect(result).toBe('');
  });
});

describe('decodeTime', () => {
  it('UTCTime をデコードする', () => {
    // "150604110438Z" (2015-06-04 11:04:38 UTC)
    const str = '150604110438Z';
    const bytes = new Uint8Array(str.split('').map((c) => c.charCodeAt(0)));
    const date = decodeTime(bytes, 0x17, 0, bytes.length);
    expect(date.getUTCFullYear()).toBe(2015);
    expect(date.getUTCMonth()).toBe(5); // 0-indexed: June
    expect(date.getUTCDate()).toBe(4);
    expect(date.getUTCHours()).toBe(11);
    expect(date.getUTCMinutes()).toBe(4);
    expect(date.getUTCSeconds()).toBe(38);
  });

  it('UTCTime の 50 以上の年を 1900 年代として扱う', () => {
    // "991231235959Z" → 1999-12-31
    const str = '991231235959Z';
    const bytes = new Uint8Array(str.split('').map((c) => c.charCodeAt(0)));
    const date = decodeTime(bytes, 0x17, 0, bytes.length);
    expect(date.getUTCFullYear()).toBe(1999);
  });

  it('UTCTime の 50 未満の年を 2000 年代として扱う', () => {
    // "300101000000Z" → 2030-01-01
    const str = '300101000000Z';
    const bytes = new Uint8Array(str.split('').map((c) => c.charCodeAt(0)));
    const date = decodeTime(bytes, 0x17, 0, bytes.length);
    expect(date.getUTCFullYear()).toBe(2030);
  });

  it('GeneralizedTime をデコードする', () => {
    // "20350604110438Z" (2035-06-04 11:04:38 UTC)
    const str = '20350604110438Z';
    const bytes = new Uint8Array(str.split('').map((c) => c.charCodeAt(0)));
    const date = decodeTime(bytes, 0x18, 0, bytes.length);
    expect(date.getUTCFullYear()).toBe(2035);
    expect(date.getUTCMonth()).toBe(5);
    expect(date.getUTCDate()).toBe(4);
  });
});

describe('bytesToHex', () => {
  it('バイト列を小文字 16 進数文字列に変換する', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
  });

  it('空配列を空文字列に変換する', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });
});

describe('hexWithColon', () => {
  it('2 桁ごとにコロンを挿入する', () => {
    expect(hexWithColon('aabbcc')).toBe('aa:bb:cc');
  });

  it('空文字列はそのまま返す', () => {
    expect(hexWithColon('')).toBe('');
  });
});

describe('formatDN', () => {
  it('DN を人間が読みやすい文字列に変換する', () => {
    const dn = { CN: 'ISRG Root X1', O: 'Internet Security Research Group', C: 'US' };
    const result = formatDN(dn);
    expect(result).toBe('CN=ISRG Root X1, O=Internet Security Research Group, C=US');
  });

  it('未定義フィールドはスキップする', () => {
    const dn = { CN: 'Example' };
    const result = formatDN(dn);
    expect(result).toBe('CN=Example');
  });

  it('空の DN は空文字列を返す', () => {
    const result = formatDN({});
    expect(result).toBe('');
  });
});

describe('parseCertificate - ISRG Root X1', () => {
  let cert: CertificateInfo;

  // 一度だけパース
  beforeAll(async () => {
    cert = await parseCertificate(ISRG_ROOT_X1_PEM);
  });

  it('証明書バージョンが v3 である', () => {
    expect(cert.version).toBe(3);
  });

  it('Subject CN が "ISRG Root X1" である', () => {
    expect(cert.subject.CN).toBe('ISRG Root X1');
  });

  it('Subject O が "Internet Security Research Group" である', () => {
    expect(cert.subject.O).toBe('Internet Security Research Group');
  });

  it('Subject C が "US" である', () => {
    expect(cert.subject.C).toBe('US');
  });

  it('自己署名証明書なので Subject === Issuer である', () => {
    expect(cert.issuer.CN).toBe(cert.subject.CN);
    expect(cert.issuer.O).toBe(cert.subject.O);
  });

  it('validFrom が 2015-06-04 である', () => {
    expect(cert.validFrom.getUTCFullYear()).toBe(2015);
    expect(cert.validFrom.getUTCMonth()).toBe(5);
    expect(cert.validFrom.getUTCDate()).toBe(4);
  });

  it('validTo が 2035-06-04 である', () => {
    expect(cert.validTo.getUTCFullYear()).toBe(2035);
    expect(cert.validTo.getUTCMonth()).toBe(5);
    expect(cert.validTo.getUTCDate()).toBe(4);
  });

  it('CA 証明書フラグが true である', () => {
    expect(cert.isCA).toBe(true);
  });

  it('署名アルゴリズムが sha256WithRSAEncryption である', () => {
    expect(cert.signatureAlgorithm).toBe('sha256WithRSAEncryption');
  });

  it('公開鍵アルゴリズムが rsaEncryption である', () => {
    expect(cert.publicKeyAlgorithm).toBe('rsaEncryption');
  });

  it('RSA 鍵長が 4096 ビットである', () => {
    expect(cert.publicKeySize).toBe(4096);
  });

  it('シリアル番号が空でない', () => {
    expect(cert.serialNumber).toBeTruthy();
    expect(cert.serialNumber.length).toBeGreaterThan(0);
  });

  it('SHA-1 フィンガープリントがコロン区切り 16 進数形式である', () => {
    expect(cert.fingerprints.sha1).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2})+$/);
  });

  it('SHA-256 フィンガープリントがコロン区切り 16 進数形式である', () => {
    expect(cert.fingerprints.sha256).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2})+$/);
  });

  it('daysUntilExpiry が計算されている', () => {
    // 2035-06-04 までの日数
    expect(typeof cert.daysUntilExpiry).toBe('number');
    // 現在 (2026) より後なので 0 以上
    expect(cert.daysUntilExpiry).toBeGreaterThan(0);
  });

  it('期限切れフラグが false である (2035 年まで有効)', () => {
    expect(cert.isExpired).toBe(false);
  });

  it('keyUsage に keyCertSign と cRLSign が含まれる', () => {
    expect(cert.keyUsage).toContain('keyCertSign');
    expect(cert.keyUsage).toContain('cRLSign');
  });
});

describe('parseCertificate - エラーハンドリング', () => {
  it('空文字列でエラーをスローする', async () => {
    await expect(parseCertificate('')).rejects.toThrow();
  });

  it('無効な Base64 でエラーをスローする', async () => {
    await expect(parseCertificate('invalid!!!')).rejects.toThrow();
  });

  it('短すぎるデータでエラーをスローする', async () => {
    await expect(parseCertificate(new Uint8Array([0x30, 0x01]))).rejects.toThrow();
  });

  it('不正な DER データでエラーをスローする', async () => {
    // SEQUENCE タグではない先頭バイト
    const badDer = new Uint8Array(100).fill(0x02);
    await expect(parseCertificate(badDer)).rejects.toThrow();
  });
});
