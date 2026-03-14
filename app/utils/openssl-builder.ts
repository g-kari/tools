/**
 * OpenSSLコマンドビルダーユーティリティ
 * GUIからOpenSSLコマンドを組み立てる
 */

/**
 * OpenSSL操作の種類
 */
export type OpenSslOperation =
  | "genrsa"
  | "ecparam"
  | "req-x509"
  | "req-csr"
  | "x509-view"
  | "pkcs12";

/**
 * 鍵の種類
 */
export type KeyType = "rsa" | "ec";

/**
 * RSA鍵サイズ
 */
export type RsaKeySize = 1024 | 2048 | 3072 | 4096;

/**
 * 楕円曲線の種類
 */
export type EcCurve = "prime256v1" | "secp384r1" | "secp521r1";

/**
 * ハッシュアルゴリズム
 */
export type HashAlgorithm = "sha256" | "sha384" | "sha512";

/**
 * エンコードフォーマット
 */
export type EncodingFormat = "PEM" | "DER";

/**
 * 出力フォーマット
 */
export type OutputFormat = "single" | "multiline";

/**
 * 証明書サブジェクト情報
 */
export interface CertificateSubject {
  /** コモンネーム（ドメイン名など） */
  cn: string;
  /** 組織名 */
  o: string;
  /** 組織単位名 */
  ou: string;
  /** 国コード（2文字） */
  c: string;
  /** 都道府県・州名 */
  st: string;
  /** 市区町村名 */
  l: string;
  /** メールアドレス */
  email: string;
}

/**
 * OpenSSLビルダーの設定
 */
export interface OpenSslConfig {
  /** 操作の種類 */
  operation: OpenSslOperation;
  /** RSA鍵サイズ */
  rsaKeySize: RsaKeySize;
  /** 楕円曲線の種類 */
  ecCurve: EcCurve;
  /** パスフレーズ */
  passphrase: string;
  /** 出力鍵ファイル */
  outputKeyFile: string;
  /** 入力鍵ファイル */
  inputKeyFile: string;
  /** 入力証明書ファイル */
  inputCertFile: string;
  /** 出力証明書ファイル */
  outputCertFile: string;
  /** 出力CSRファイル */
  outputCsrFile: string;
  /** 出力PKCS12ファイル */
  outputPkcs12File: string;
  /** 証明書サブジェクト */
  subject: CertificateSubject;
  /** 証明書有効期間（日数） */
  days: number;
  /** ハッシュアルゴリズム */
  hashAlgorithm: HashAlgorithm;
  /** 出力フォーマット */
  outputFormat: OutputFormat;
}

/**
 * デフォルトの証明書サブジェクトを返す
 * @returns デフォルトの証明書サブジェクト
 */
export function getDefaultSubject(): CertificateSubject {
  return {
    cn: "",
    o: "",
    ou: "",
    c: "",
    st: "",
    l: "",
    email: "",
  };
}

/**
 * デフォルト設定を返す
 * @returns デフォルトのOpenSSLビルダー設定
 */
export function getDefaultConfig(): OpenSslConfig {
  return {
    operation: "genrsa",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "",
    outputKeyFile: "",
    inputKeyFile: "",
    inputCertFile: "",
    outputCertFile: "",
    outputCsrFile: "",
    outputPkcs12File: "",
    subject: getDefaultSubject(),
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  };
}

/**
 * シェル文字列をシングルクォートでエスケープする
 * @param str - エスケープ対象の文字列
 * @returns エスケープ済み文字列（シングルクォートで囲まれた形式）
 */
export function shellEscapeSingle(str: string): string {
  // シングルクォートを含まず、シェルセーフな文字のみならそのまま
  if (/^[a-zA-Z0-9._\-/:@=&?%#+~,;]+$/.test(str)) {
    return str;
  }
  // シングルクォートでラップし、内部のシングルクォートをエスケープ
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

/**
 * 証明書サブジェクト文字列を組み立てる
 * @param subject - 証明書サブジェクト情報
 * @returns OpenSSL形式のサブジェクト文字列（/CN=...）
 */
function buildSubjectString(subject: CertificateSubject): string {
  const parts: string[] = [];
  if (subject.cn.trim()) parts.push(`CN=${subject.cn.trim()}`);
  if (subject.o.trim()) parts.push(`O=${subject.o.trim()}`);
  if (subject.ou.trim()) parts.push(`OU=${subject.ou.trim()}`);
  if (subject.c.trim()) parts.push(`C=${subject.c.trim()}`);
  if (subject.st.trim()) parts.push(`ST=${subject.st.trim()}`);
  if (subject.l.trim()) parts.push(`L=${subject.l.trim()}`);
  if (subject.email.trim()) parts.push(`emailAddress=${subject.email.trim()}`);
  if (parts.length === 0) return "";
  return "/" + parts.join("/");
}

/**
 * OpenSSLコマンドを生成する
 * @param config - OpenSSLビルダーの設定
 * @returns 生成されたOpenSSLコマンド文字列
 */
export function buildOpenSslCommand(config: OpenSslConfig): string {
  const sep = config.outputFormat === "multiline" ? " \\\n  " : " ";
  const parts: string[] = [];

  switch (config.operation) {
    case "genrsa": {
      parts.push("openssl genrsa");
      if (config.passphrase.trim()) {
        parts.push("-aes256");
        parts.push(`-passout pass:${shellEscapeSingle(config.passphrase.trim())}`);
      }
      if (config.outputKeyFile.trim()) {
        parts.push(`-out ${shellEscapeSingle(config.outputKeyFile.trim())}`);
      }
      parts.push(String(config.rsaKeySize));
      break;
    }

    case "ecparam": {
      // EC鍵生成は2段階: ecparam でパラメータ生成 + genpkey で鍵生成
      // ここでは genpkey を使ったシンプルな形式を生成
      parts.push("openssl genpkey");
      parts.push(`-algorithm EC`);
      parts.push(`-pkeyopt ec_paramgen_curve:${config.ecCurve}`);
      if (config.passphrase.trim()) {
        parts.push(`-aes-256-cbc`);
        parts.push(`-pass pass:${shellEscapeSingle(config.passphrase.trim())}`);
      }
      if (config.outputKeyFile.trim()) {
        parts.push(`-out ${shellEscapeSingle(config.outputKeyFile.trim())}`);
      }
      break;
    }

    case "req-x509": {
      parts.push("openssl req");
      parts.push("-new");
      parts.push("-x509");
      parts.push(`-${config.hashAlgorithm}`);
      parts.push(`-days ${config.days}`);
      if (config.inputKeyFile.trim()) {
        parts.push(`-key ${shellEscapeSingle(config.inputKeyFile.trim())}`);
      } else {
        parts.push("-key [鍵ファイルを指定してください]");
      }
      const subjectStr = buildSubjectString(config.subject);
      if (subjectStr) {
        parts.push(`-subj ${shellEscapeSingle(subjectStr)}`);
      }
      if (config.outputCertFile.trim()) {
        parts.push(`-out ${shellEscapeSingle(config.outputCertFile.trim())}`);
      }
      break;
    }

    case "req-csr": {
      parts.push("openssl req");
      parts.push("-new");
      parts.push(`-${config.hashAlgorithm}`);
      if (config.inputKeyFile.trim()) {
        parts.push(`-key ${shellEscapeSingle(config.inputKeyFile.trim())}`);
      } else {
        parts.push("-key [鍵ファイルを指定してください]");
      }
      const subjectStr = buildSubjectString(config.subject);
      if (subjectStr) {
        parts.push(`-subj ${shellEscapeSingle(subjectStr)}`);
      }
      if (config.outputCsrFile.trim()) {
        parts.push(`-out ${shellEscapeSingle(config.outputCsrFile.trim())}`);
      }
      break;
    }

    case "x509-view": {
      parts.push("openssl x509");
      if (config.inputCertFile.trim()) {
        parts.push(`-in ${shellEscapeSingle(config.inputCertFile.trim())}`);
      } else {
        parts.push("-in [証明書ファイルを指定してください]");
      }
      parts.push("-text");
      parts.push("-noout");
      break;
    }

    case "pkcs12": {
      parts.push("openssl pkcs12");
      parts.push("-export");
      if (config.inputCertFile.trim()) {
        parts.push(`-in ${shellEscapeSingle(config.inputCertFile.trim())}`);
      } else {
        parts.push("-in [証明書ファイルを指定してください]");
      }
      if (config.inputKeyFile.trim()) {
        parts.push(`-inkey ${shellEscapeSingle(config.inputKeyFile.trim())}`);
      } else {
        parts.push("-inkey [鍵ファイルを指定してください]");
      }
      if (config.passphrase.trim()) {
        parts.push(`-passout pass:${shellEscapeSingle(config.passphrase.trim())}`);
      }
      if (config.outputPkcs12File.trim()) {
        parts.push(`-out ${shellEscapeSingle(config.outputPkcs12File.trim())}`);
      } else {
        parts.push("-out [出力ファイルを指定してください]");
      }
      break;
    }

    default:
      return "openssl [操作を選択してください]";
  }

  return parts.join(sep);
}

/**
 * サンプル設定の定義
 */
export const SAMPLE_CONFIGS: Record<string, OpenSslConfig> = {
  "RSA鍵生成": {
    operation: "genrsa",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "",
    outputKeyFile: "private.key",
    inputKeyFile: "",
    inputCertFile: "",
    outputCertFile: "",
    outputCsrFile: "",
    outputPkcs12File: "",
    subject: getDefaultSubject(),
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  },
  "自己署名証明書": {
    operation: "req-x509",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "",
    outputKeyFile: "",
    inputKeyFile: "private.key",
    inputCertFile: "",
    outputCertFile: "certificate.crt",
    outputCsrFile: "",
    outputPkcs12File: "",
    subject: {
      cn: "localhost",
      o: "My Company",
      ou: "",
      c: "JP",
      st: "Tokyo",
      l: "Shibuya",
      email: "",
    },
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  },
  "CSR生成": {
    operation: "req-csr",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "",
    outputKeyFile: "",
    inputKeyFile: "private.key",
    inputCertFile: "",
    outputCertFile: "",
    outputCsrFile: "server.csr",
    outputPkcs12File: "",
    subject: {
      cn: "example.com",
      o: "Example Corp",
      ou: "IT Department",
      c: "JP",
      st: "Tokyo",
      l: "Chiyoda",
      email: "admin@example.com",
    },
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  },
  "EC鍵生成 (P-256)": {
    operation: "ecparam",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "",
    outputKeyFile: "ec-private.key",
    inputKeyFile: "",
    inputCertFile: "",
    outputCertFile: "",
    outputCsrFile: "",
    outputPkcs12File: "",
    subject: getDefaultSubject(),
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  },
  "PKCS12変換": {
    operation: "pkcs12",
    rsaKeySize: 2048,
    ecCurve: "prime256v1",
    passphrase: "your-passphrase",
    outputKeyFile: "",
    inputKeyFile: "private.key",
    inputCertFile: "certificate.crt",
    outputCertFile: "",
    outputCsrFile: "",
    outputPkcs12File: "bundle.p12",
    subject: getDefaultSubject(),
    days: 365,
    hashAlgorithm: "sha256",
    outputFormat: "multiline",
  },
};
