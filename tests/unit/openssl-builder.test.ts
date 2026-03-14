import { describe, it, expect } from "vitest";
import {
  shellEscapeSingle,
  buildOpenSslCommand,
  getDefaultConfig,
  SAMPLE_CONFIGS,
  getDefaultSubject,
} from "../../app/utils/openssl-builder";
import type { OpenSslConfig } from "../../app/utils/openssl-builder";

describe("shellEscapeSingle", () => {
  it("安全な文字列はそのまま返す", () => {
    expect(shellEscapeSingle("private.key")).toBe("private.key");
  });

  it("アルファベットと数字はそのまま返す", () => {
    expect(shellEscapeSingle("abc123")).toBe("abc123");
  });

  it("ハイフンとドットはそのまま返す", () => {
    expect(shellEscapeSingle("my-file.key")).toBe("my-file.key");
  });

  it("スラッシュを含むパスはそのまま返す", () => {
    expect(shellEscapeSingle("/etc/ssl/private.key")).toBe(
      "/etc/ssl/private.key"
    );
  });

  it("スペースを含む文字列はシングルクォートで囲む", () => {
    expect(shellEscapeSingle("my private.key")).toBe("'my private.key'");
  });

  it("シングルクォートを含む文字列をエスケープする", () => {
    expect(shellEscapeSingle("it's")).toBe("'it'\\''s'");
  });

  it("日本語テキストはシングルクォートで囲む", () => {
    const result = shellEscapeSingle("テスト");
    expect(result).toBe("'テスト'");
  });

  it("空文字列はシングルクォートで囲まれる", () => {
    expect(shellEscapeSingle("")).toBe("''");
  });

  it("特殊文字を含む文字列はシングルクォートで囲む", () => {
    expect(shellEscapeSingle("pass word!")).toBe("'pass word!'");
  });
});

describe("getDefaultConfig", () => {
  it("デフォルト設定を返す", () => {
    const config = getDefaultConfig();
    expect(config.operation).toBe("genrsa");
    expect(config.rsaKeySize).toBe(2048);
    expect(config.ecCurve).toBe("prime256v1");
    expect(config.passphrase).toBe("");
    expect(config.outputKeyFile).toBe("");
    expect(config.days).toBe(365);
    expect(config.hashAlgorithm).toBe("sha256");
    expect(config.outputFormat).toBe("multiline");
  });

  it("デフォルトサブジェクトが空であること", () => {
    const config = getDefaultConfig();
    expect(config.subject.cn).toBe("");
    expect(config.subject.o).toBe("");
    expect(config.subject.c).toBe("");
  });
});

describe("getDefaultSubject", () => {
  it("空のサブジェクトを返す", () => {
    const subject = getDefaultSubject();
    expect(subject.cn).toBe("");
    expect(subject.o).toBe("");
    expect(subject.ou).toBe("");
    expect(subject.c).toBe("");
    expect(subject.st).toBe("");
    expect(subject.l).toBe("");
    expect(subject.email).toBe("");
  });
});

describe("buildOpenSslCommand - genrsa", () => {
  it("基本的なRSA鍵生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      rsaKeySize: 2048,
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl genrsa");
    expect(cmd).toContain("2048");
  });

  it("出力ファイルを含むコマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      rsaKeySize: 2048,
      outputKeyFile: "private.key",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("-out private.key");
    expect(cmd).toContain("2048");
  });

  it("パスフレーズありのコマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      rsaKeySize: 4096,
      passphrase: "mypassphrase",
      outputKeyFile: "private.key",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("-aes256");
    expect(cmd).toContain("pass:mypassphrase");
    expect(cmd).toContain("4096");
  });

  it("スペースを含むパスフレーズをエスケープする", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      passphrase: "my passphrase",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("pass:'my passphrase'");
  });

  it("1行フォーマットで生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      outputKeyFile: "private.key",
      outputFormat: "single",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).not.toContain("\\\n");
  });

  it("複数行フォーマットで生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "genrsa",
      outputKeyFile: "private.key",
      outputFormat: "multiline",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("\\\n");
  });
});

describe("buildOpenSslCommand - ecparam", () => {
  it("基本的なEC鍵生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "ecparam",
      ecCurve: "prime256v1",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl genpkey");
    expect(cmd).toContain("-algorithm EC");
    expect(cmd).toContain("prime256v1");
  });

  it("P-384曲線でEC鍵生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "ecparam",
      ecCurve: "secp384r1",
      outputKeyFile: "ec.key",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("secp384r1");
    expect(cmd).toContain("-out ec.key");
  });

  it("パスフレーズありのEC鍵生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "ecparam",
      ecCurve: "prime256v1",
      passphrase: "secret",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("-aes-256-cbc");
    expect(cmd).toContain("pass:secret");
  });
});

describe("buildOpenSslCommand - req-x509", () => {
  it("基本的な自己署名証明書生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-x509",
      inputKeyFile: "private.key",
      outputCertFile: "cert.crt",
      days: 365,
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl req");
    expect(cmd).toContain("-new");
    expect(cmd).toContain("-x509");
    expect(cmd).toContain("-days 365");
    expect(cmd).toContain("-key private.key");
    expect(cmd).toContain("-out cert.crt");
  });

  it("サブジェクト情報を含むコマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-x509",
      inputKeyFile: "private.key",
      subject: {
        cn: "localhost",
        o: "Test Corp",
        ou: "",
        c: "JP",
        st: "",
        l: "",
        email: "",
      },
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("CN=localhost");
    expect(cmd).toContain("O=Test Corp");
    expect(cmd).toContain("C=JP");
  });

  it("sha512ハッシュアルゴリズムを使用する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-x509",
      hashAlgorithm: "sha512",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("-sha512");
  });

  it("鍵ファイルが未指定の場合プレースホルダーを表示する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-x509",
      inputKeyFile: "",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("[鍵ファイルを指定してください]");
  });
});

describe("buildOpenSslCommand - req-csr", () => {
  it("基本的なCSR生成コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-csr",
      inputKeyFile: "private.key",
      outputCsrFile: "server.csr",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl req");
    expect(cmd).toContain("-new");
    expect(cmd).not.toContain("-x509");
    expect(cmd).toContain("-key private.key");
    expect(cmd).toContain("-out server.csr");
  });

  it("完全なサブジェクトを含むCSRコマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "req-csr",
      inputKeyFile: "private.key",
      subject: {
        cn: "example.com",
        o: "Example Corp",
        ou: "IT",
        c: "JP",
        st: "Tokyo",
        l: "Shibuya",
        email: "admin@example.com",
      },
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("CN=example.com");
    expect(cmd).toContain("emailAddress=admin@example.com");
  });
});

describe("buildOpenSslCommand - x509-view", () => {
  it("証明書確認コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "x509-view",
      inputCertFile: "certificate.crt",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl x509");
    expect(cmd).toContain("-in certificate.crt");
    expect(cmd).toContain("-text");
    expect(cmd).toContain("-noout");
  });

  it("証明書ファイルが未指定の場合プレースホルダーを表示する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "x509-view",
      inputCertFile: "",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("[証明書ファイルを指定してください]");
  });
});

describe("buildOpenSslCommand - pkcs12", () => {
  it("PKCS12変換コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "pkcs12",
      inputCertFile: "certificate.crt",
      inputKeyFile: "private.key",
      outputPkcs12File: "bundle.p12",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl pkcs12");
    expect(cmd).toContain("-export");
    expect(cmd).toContain("-in certificate.crt");
    expect(cmd).toContain("-inkey private.key");
    expect(cmd).toContain("-out bundle.p12");
  });

  it("パスフレーズありのPKCS12コマンドを生成する", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "pkcs12",
      inputCertFile: "cert.crt",
      inputKeyFile: "key.pem",
      outputPkcs12File: "out.pfx",
      passphrase: "secret123",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("pass:secret123");
  });

  it("スペースを含むファイルパスをエスケープする", () => {
    const config: OpenSslConfig = {
      ...getDefaultConfig(),
      operation: "pkcs12",
      inputCertFile: "my cert.crt",
      inputKeyFile: "private.key",
      outputPkcs12File: "bundle.p12",
    };
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("-in 'my cert.crt'");
  });
});

describe("SAMPLE_CONFIGS", () => {
  it("RSA鍵生成サンプルが存在する", () => {
    expect(SAMPLE_CONFIGS["RSA鍵生成"]).toBeDefined();
  });

  it("自己署名証明書サンプルが存在する", () => {
    expect(SAMPLE_CONFIGS["自己署名証明書"]).toBeDefined();
  });

  it("CSR生成サンプルが存在する", () => {
    expect(SAMPLE_CONFIGS["CSR生成"]).toBeDefined();
  });

  it("全サンプルを正常にビルドできる", () => {
    for (const [key, config] of Object.entries(SAMPLE_CONFIGS)) {
      expect(() => buildOpenSslCommand(config)).not.toThrow();
      const cmd = buildOpenSslCommand(config);
      expect(cmd).toBeTruthy();
      expect(cmd.length).toBeGreaterThan(0);
      // eslint-disable-next-line no-console
      console.log(`Sample "${key}": OK`);
    }
  });

  it("RSA鍵生成サンプルのコマンドが正しい", () => {
    const config = SAMPLE_CONFIGS["RSA鍵生成"];
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl genrsa");
    expect(cmd).toContain("2048");
  });

  it("自己署名証明書サンプルのコマンドが正しい", () => {
    const config = SAMPLE_CONFIGS["自己署名証明書"];
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl req");
    expect(cmd).toContain("-x509");
    expect(cmd).toContain("CN=localhost");
  });

  it("CSR生成サンプルのコマンドが正しい", () => {
    const config = SAMPLE_CONFIGS["CSR生成"];
    const cmd = buildOpenSslCommand(config);
    expect(cmd).toContain("openssl req");
    expect(cmd).not.toContain("-x509");
    expect(cmd).toContain("CN=example.com");
  });
});
