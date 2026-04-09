import { describe, it, expect } from "vite-plus/test";
import {
  buildCurlCommand,
  getDefaultConfig,
  getDefaultOptions,
  SAMPLE_CONFIGS,
  shellEscapeSingle,
} from "../../app/utils/curl-builder";
import type { CurlBuilderConfig, Header } from "../../app/utils/curl-builder";

describe("buildCurlCommand", () => {
  it("空のURLの場合はプレースホルダーを返す", () => {
    const config = getDefaultConfig();
    const result = buildCurlCommand(config);
    expect(result).toContain("[URLを入力してください]");
  });

  it("基本的なGETリクエストを生成する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/users",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("curl");
    expect(result).toContain("https://api.example.com/users");
    expect(result).not.toContain("-X GET");
  });

  it("GETメソッドでは-Xフラグを省略する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "GET",
      url: "https://api.example.com/test",
    };
    const result = buildCurlCommand(config);
    expect(result).not.toContain("-X");
  });

  it("POSTリクエストで-X POSTを含む", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "POST",
      url: "https://api.example.com/users",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-X POST");
  });

  it("PUTリクエストで-X PUTを含む", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "PUT",
      url: "https://api.example.com/users/1",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-X PUT");
  });

  it("PATCHリクエストで-X PATCHを含む", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "PATCH",
      url: "https://api.example.com/users/1",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-X PATCH");
  });

  it("DELETEリクエストで-X DELETEを含む", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "DELETE",
      url: "https://api.example.com/users/1",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-X DELETE");
  });

  it("HEADリクエストで-Iを使用する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "HEAD",
      url: "https://api.example.com/users",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-I");
    expect(result).not.toContain("-X HEAD");
  });

  it("OPTIONSリクエストで-X OPTIONSを含む", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      method: "OPTIONS",
      url: "https://api.example.com/users",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-X OPTIONS");
  });

  it("有効なヘッダーを-Hフラグで追加する", () => {
    const headers: Header[] = [
      { id: "1", key: "Content-Type", value: "application/json", enabled: true },
    ];
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      headers,
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-H");
    expect(result).toContain("Content-Type: application/json");
  });

  it("無効（disabled）なヘッダーは除外する", () => {
    const headers: Header[] = [
      { id: "1", key: "X-Disabled", value: "disabled", enabled: false },
      { id: "2", key: "X-Enabled", value: "enabled", enabled: true },
    ];
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      headers,
    };
    const result = buildCurlCommand(config);
    expect(result).not.toContain("X-Disabled");
    expect(result).toContain("X-Enabled");
  });

  it("複数のヘッダーをすべて含む", () => {
    const headers: Header[] = [
      { id: "1", key: "Content-Type", value: "application/json", enabled: true },
      { id: "2", key: "Accept", value: "application/json", enabled: true },
      { id: "3", key: "Authorization", value: "Bearer token", enabled: true },
    ];
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      headers,
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("Content-Type");
    expect(result).toContain("Accept");
    expect(result).toContain("Authorization");
  });

  it("JSONボディを--data-rawで追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/users",
      method: "POST",
      bodyType: "json",
      body: '{"name":"test"}',
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("--data-raw");
    expect(result).toContain("name");
  });

  it("テキストボディを--data-rawで追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      method: "POST",
      bodyType: "text",
      body: "plain text content",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("--data-raw");
    expect(result).toContain("plain text content");
  });

  it("フォームボディを-dで追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://example.com/login",
      method: "POST",
      bodyType: "form",
      body: "username=user&password=pass",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-d");
    expect(result).toContain("username=user");
  });

  it("verboseオプションで-vを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      options: { ...getDefaultOptions(), verbose: true },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-v");
  });

  it("silentオプションで-sを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      options: { ...getDefaultOptions(), silent: true },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-s");
  });

  it("compressedオプションで--compressedを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      options: { ...getDefaultOptions(), compressed: true },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("--compressed");
  });

  it("followRedirectsオプションで-Lを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      options: { ...getDefaultOptions(), followRedirects: true },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-L");
  });

  it("insecureオプションで-kを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      options: { ...getDefaultOptions(), insecure: true },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-k");
  });

  it("outputFileオプションで-o ファイルを追加する", () => {
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://example.com/file.zip",
      options: { ...getDefaultOptions(), outputFile: "output.zip" },
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("-o");
    expect(result).toContain("output.zip");
  });

  it("multiline出力フォーマットで改行とバックスラッシュを含む", () => {
    const headers: Header[] = [
      { id: "1", key: "Content-Type", value: "application/json", enabled: true },
    ];
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      headers,
      outputFormat: "multiline",
    };
    const result = buildCurlCommand(config);
    expect(result).toContain("\\\n");
  });

  it("single出力フォーマットで改行を含まない", () => {
    const headers: Header[] = [
      { id: "1", key: "Content-Type", value: "application/json", enabled: true },
    ];
    const config: CurlBuilderConfig = {
      ...getDefaultConfig(),
      url: "https://api.example.com/test",
      headers,
      outputFormat: "single",
    };
    const result = buildCurlCommand(config);
    expect(result).not.toContain("\n");
  });
});

describe("shellEscapeSingle", () => {
  it("シンプルなURLをそのまま返す", () => {
    const result = shellEscapeSingle("https://api.example.com/test");
    expect(result).toBe("https://api.example.com/test");
  });

  it("スペースを含む文字列をシングルクォートで囲む", () => {
    const result = shellEscapeSingle("hello world");
    expect(result).toBe("'hello world'");
  });

  it("シングルクォートを含む文字列を適切にエスケープする", () => {
    const result = shellEscapeSingle("it's a test");
    expect(result).toContain("\\'");
  });
});

describe("getDefaultConfig", () => {
  it("デフォルト設定を返す", () => {
    const config = getDefaultConfig();
    expect(config.method).toBe("GET");
    expect(config.url).toBe("");
    expect(config.headers).toHaveLength(0);
    expect(config.bodyType).toBe("none");
    expect(config.body).toBe("");
    expect(config.outputFormat).toBe("multiline");
  });
});

describe("getDefaultOptions", () => {
  it("デフォルトオプションを返す", () => {
    const options = getDefaultOptions();
    expect(options.verbose).toBe(false);
    expect(options.silent).toBe(false);
    expect(options.compressed).toBe(false);
    expect(options.followRedirects).toBe(false);
    expect(options.insecure).toBe(false);
    expect(options.outputFile).toBe("");
  });
});

describe("SAMPLE_CONFIGS", () => {
  it("サンプル設定が存在する", () => {
    expect(Object.keys(SAMPLE_CONFIGS).length).toBeGreaterThan(0);
  });

  it("各サンプルが有効なCurlBuilderConfigを持つ", () => {
    for (const config of Object.values(SAMPLE_CONFIGS)) {
      expect(config).toHaveProperty("method");
      expect(config).toHaveProperty("url");
      expect(config).toHaveProperty("headers");
      expect(config).toHaveProperty("bodyType");
      expect(config).toHaveProperty("options");
      expect(config).toHaveProperty("outputFormat");
      expect(config.url).not.toBe("");
      const cmd = buildCurlCommand(config);
      expect(cmd).toContain("curl");
    }
  });

  it("POST JSONサンプルがJSONボディを含む", () => {
    const sample = SAMPLE_CONFIGS["POST JSON"];
    expect(sample).toBeDefined();
    expect(sample.bodyType).toBe("json");
    expect(sample.body).toBeTruthy();
    const cmd = buildCurlCommand(sample);
    expect(cmd).toContain("-X POST");
    expect(cmd).toContain("--data-raw");
  });
});
