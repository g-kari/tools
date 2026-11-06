import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, it, expect } from "vite-plus/test";
import {
  tokenize,
  parseCurl,
  toFetchCode,
  toAxiosCode,
  convertCurl,
  type ParsedCurl,
  type ConvertOptions,
} from "../../app/utils/curl-to-fetch";

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Compile only fixed synthetic fixtures and capture requests without external I/O. */
async function captureGeneratedRequest(
  code: string,
  typescript: boolean,
): Promise<CapturedRequest[]> {
  const compiled = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  expect(compiled.diagnostics).toEqual([]);
  const calls: CapturedRequest[] = [];
  const context = {
    marker: false,
    fetch: async (url: string, init: RequestInit = {}) => {
      calls.push({
        url,
        method: init.method ?? "GET",
        headers: (init.headers ?? {}) as Record<string, string>,
        body: init.body ?? null,
      });
      return { ok: true, json: async () => ({}) };
    },
    axios: async (config: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      data?: unknown;
    }) => {
      calls.push({
        url: config.url,
        method: config.method,
        headers: config.headers ?? {},
        body: config.data ?? null,
      });
      return { data: {} };
    },
    console: { log: () => {} },
  };
  // Axios's fixed import is replaced by the local stub, never loaded from a package or URL.
  const executable = (typescript ? compiled.outputText : code).replace(
    "import axios from 'axios';",
    "",
  );
  await runInNewContext(`(async () => {\n${executable}\n})()`, context, { timeout: 1000 });
  expect(context.marker).toBe(false);
  return calls;
}

describe("generated string literal integrity", () => {
  const modes: ConvertOptions[] = [
    { mode: "fetch", typescript: false },
    { mode: "fetch", typescript: true },
    { mode: "axios", typescript: false },
    { mode: "axios", typescript: true },
  ];

  const stringCases = [
    ["apostrophe", "O'Reilly"],
    ["backslash and quote", "path\\'\"end"],
    ["line feed", "line1\nline2"],
    ["carriage return", "line1\rline2"],
    ["tab", "left\tright"],
    ["NUL before a digit", "zero\u00001"],
    ["other ASCII controls", "\u0001\b\f\u001f"],
    ["Unicode line separators", "left\u2028middle\u2029right"],
    ["lone high surrogate", "left\ud800right"],
    ["lone low surrogate", "left\udc00right"],
    ["surrogate pair", "left😀right"],
    ["interpolation and statement text", "${marker}`'); globalThis.marker = true; //"],
  ];

  for (const options of modes) {
    for (const [label, value] of stringCases) {
      it(`${options.mode} TS=${options.typescript}: ${label} stays data in every string slot`, async () => {
        // Some fixtures are not valid HTTP fields. This tests code serialization, not HTTP validation.
        const parsed: ParsedCurl = {
          method: `X-${value}`,
          url: `https://example.com/${value}`,
          headers: { [`X-${value}`]: value },
          body: `raw:${value}`,
          followRedirects: false,
          insecure: false,
        };
        const code =
          options.mode === "fetch" ? toFetchCode(parsed, options) : toAxiosCode(parsed, options);
        expect(await captureGeneratedRequest(code, options.typescript)).toEqual([
          {
            url: parsed.url,
            method: options.mode === "axios" ? parsed.method.toLowerCase() : parsed.method,
            headers: parsed.headers,
            body: parsed.body,
          },
        ]);
      });
    }

    it(`${options.mode} TS=${options.typescript}: parsed cURL values survive conversion`, async () => {
      const command =
        `curl "https://example.com/O'Reilly" -X "X'PATCH" -H "X'O: safe" ` +
        String.raw`--data-raw $'line1\nline2\rline3\tvalue'`;
      const { parsed } = parseCurl(command);
      expect(parsed.url).toBe("https://example.com/O'Reilly");
      expect(parsed.headers).toEqual({ "X'O": "safe" });
      expect(parsed.body).toBe("line1\nline2\rline3\tvalue");
      const result = convertCurl(command, options);
      expect(result.warnings).toEqual([]);
      expect(await captureGeneratedRequest(result.code, options.typescript)).toEqual([
        {
          url: parsed.url,
          method: options.mode === "axios" ? parsed.method.toLowerCase() : parsed.method,
          headers: parsed.headers,
          body: parsed.body,
        },
      ]);
    });

    it(`${options.mode} TS=${options.typescript}: an apostrophe in a GET URL needs no init`, async () => {
      const result = convertCurl(`curl "https://example.com/O'Reilly"`, options);
      expect(await captureGeneratedRequest(result.code, options.typescript)).toEqual([
        {
          url: "https://example.com/O'Reilly",
          method: options.mode === "axios" ? "get" : "GET",
          headers: {},
          body: null,
        },
      ]);
    });
  }
});

describe("tokenize", () => {
  it("シンプルなcURLコマンドをトークン化する", () => {
    const tokens = tokenize("curl 'https://example.com'");
    expect(tokens).toEqual(["curl", "https://example.com"]);
  });

  it("ダブルクォートを処理する", () => {
    const tokens = tokenize('curl "https://example.com"');
    expect(tokens).toEqual(["curl", "https://example.com"]);
  });

  it("バックスラッシュ改行（行継続）を処理する", () => {
    const tokens = tokenize("curl 'https://example.com' \\\n  -H 'Accept: */*'");
    expect(tokens).toEqual(["curl", "https://example.com", "-H", "Accept: */*"]);
  });

  it("クォートなしトークンを処理する", () => {
    const tokens = tokenize("curl -X POST https://example.com");
    expect(tokens).toEqual(["curl", "-X", "POST", "https://example.com"]);
  });

  it("シングルクォート内のスペースを保持する", () => {
    const tokens = tokenize("curl -H 'Content-Type: application/json'");
    expect(tokens).toEqual(["curl", "-H", "Content-Type: application/json"]);
  });

  it("ダブルクォート内のエスケープシーケンスを処理する", () => {
    const tokens = tokenize('curl -d "line1\\nline2"');
    expect(tokens).toEqual(["curl", "-d", "line1\nline2"]);
  });

  it("ANSI-Cクォート $'...' を処理する", () => {
    const tokens = tokenize("curl -d $'hello\\nworld'");
    expect(tokens).toEqual(["curl", "-d", "hello\nworld"]);
  });
});

describe("parseCurl", () => {
  it("シンプルなGETリクエストを解析する", () => {
    const { parsed } = parseCurl("curl 'https://api.example.com/users'");
    expect(parsed.method).toBe("GET");
    expect(parsed.url).toBe("https://api.example.com/users");
    expect(parsed.body).toBeNull();
  });

  it("-X でメソッドを指定できる", () => {
    const { parsed } = parseCurl("curl -X DELETE https://api.example.com/users/1");
    expect(parsed.method).toBe("DELETE");
    expect(parsed.url).toBe("https://api.example.com/users/1");
  });

  it("--request でメソッドを指定できる", () => {
    const { parsed } = parseCurl("curl --request PUT https://api.example.com");
    expect(parsed.method).toBe("PUT");
  });

  it("-H でヘッダーを解析する", () => {
    const { parsed } = parseCurl(
      "curl 'https://api.example.com' -H 'Authorization: Bearer token123' -H 'Accept: application/json'",
    );
    expect(parsed.headers["Authorization"]).toBe("Bearer token123");
    expect(parsed.headers["Accept"]).toBe("application/json");
  });

  it("-d でボディを解析してメソッドをPOSTにする", () => {
    const { parsed } = parseCurl("curl 'https://api.example.com' -d '{\"name\":\"test\"}'");
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toBe('{"name":"test"}');
  });

  it("--data-raw でボディを解析する", () => {
    const { parsed } = parseCurl("curl --data-raw 'test data' https://api.example.com");
    expect(parsed.body).toBe("test data");
    expect(parsed.method).toBe("POST");
  });

  it("-u でBasic認証をAuthorizationヘッダーに変換する", () => {
    const { parsed } = parseCurl("curl -u admin:password https://api.example.com");
    expect(parsed.headers["Authorization"]).toBe(`Basic ${btoa("admin:password")}`);
  });

  it("-b でCookieヘッダーを設定する", () => {
    const { parsed } = parseCurl("curl -b 'session=abc123' https://api.example.com");
    expect(parsed.headers["Cookie"]).toBe("session=abc123");
  });

  it("-A でUser-Agentを設定する", () => {
    const { parsed } = parseCurl("curl -A 'MyApp/1.0' https://api.example.com");
    expect(parsed.headers["User-Agent"]).toBe("MyApp/1.0");
  });

  it("--compressed でAccept-Encodingを追加する", () => {
    const { parsed } = parseCurl("curl --compressed https://api.example.com");
    expect(parsed.headers["Accept-Encoding"]).toBe("gzip, deflate, br");
  });

  it("-L でfollowRedirectsをtrueにする", () => {
    const { parsed } = parseCurl("curl -L https://example.com");
    expect(parsed.followRedirects).toBe(true);
  });

  it("-k で警告を生成する", () => {
    const { warnings } = parseCurl("curl -k https://api.example.com");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("insecure");
  });

  it("-I でHEADメソッドに変換する", () => {
    const { parsed } = parseCurl("curl -I https://api.example.com");
    expect(parsed.method).toBe("HEAD");
  });

  it("--json でContent-TypeとAcceptを設定する", () => {
    const { parsed } = parseCurl('curl --json \'{"key":"val"}\' https://api.example.com');
    expect(parsed.headers["Content-Type"]).toBe("application/json");
    expect(parsed.headers["Accept"]).toBe("application/json");
    expect(parsed.method).toBe("POST");
  });

  it("--oauth2-bearer でAuthorizationヘッダーを設定する", () => {
    const { parsed } = parseCurl("curl --oauth2-bearer mytoken https://api.example.com");
    expect(parsed.headers["Authorization"]).toBe("Bearer mytoken");
  });

  it("-d があってもメソッドを明示的に指定した場合はそちらを優先する", () => {
    const { parsed } = parseCurl('curl -X PATCH -d \'{"k":"v"}\' https://api.example.com');
    expect(parsed.method).toBe("PATCH");
  });

  it("curlなしで入力しても解析できる", () => {
    const { parsed } = parseCurl("https://api.example.com -H 'Accept: application/json'");
    expect(parsed.url).toBe("https://api.example.com");
    expect(parsed.headers["Accept"]).toBe("application/json");
  });

  it("-e でRefererヘッダーを設定する", () => {
    const { parsed } = parseCurl("curl -e 'https://example.com' https://api.example.com");
    expect(parsed.headers["Referer"]).toBe("https://example.com");
  });

  it("--referer でRefererヘッダーを設定する", () => {
    const { parsed } = parseCurl("curl --referer 'https://example.com' https://api.example.com");
    expect(parsed.headers["Referer"]).toBe("https://example.com");
  });

  it("--user-agent でUser-Agentヘッダーを設定する", () => {
    const { parsed } = parseCurl("curl --user-agent 'Mozilla/5.0' https://api.example.com");
    expect(parsed.headers["User-Agent"]).toBe("Mozilla/5.0");
  });

  it("未知のフラグがあっても解析できる", () => {
    const { parsed } = parseCurl("curl --unknown-flag https://api.example.com");
    expect(parsed.url).toBe("https://api.example.com");
  });
});

describe("toFetchCode", () => {
  const baseOpts = { mode: "fetch" as const, typescript: false };

  it("シンプルなGETを生成する", () => {
    const code = toFetchCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("fetch('https://api.example.com')");
    expect(code).toContain("response.json()");
  });

  it("GETのmethodは省略される", () => {
    const code = toFetchCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).not.toContain("method: 'GET'");
  });

  it("POST メソッドを含む", () => {
    const code = toFetchCode(
      {
        method: "POST",
        url: "https://api.example.com",
        headers: {},
        body: '{"name":"test"}',
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("method: 'POST'");
    expect(code).toContain("JSON.stringify");
  });

  it("ヘッダーを含む", () => {
    const code = toFetchCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: { Authorization: "Bearer token" },
        body: null,
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("'Authorization': 'Bearer token'");
  });

  it("TypeScript型注釈を追加する", () => {
    const code = toFetchCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      { mode: "fetch", typescript: true },
    );
    expect(code).toContain(": Response");
  });

  it("redirect: follow を含む（-L フラグ）", () => {
    const code = toFetchCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: true,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("redirect: 'follow'");
  });

  it("JSONでないボディを文字列として出力する", () => {
    const code = toFetchCode(
      {
        method: "POST",
        url: "https://api.example.com",
        headers: {},
        body: "username=foo&password=bar",
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("body: 'username=foo&password=bar'");
    expect(code).not.toContain("JSON.stringify");
  });
});

describe("toAxiosCode", () => {
  const baseOpts = { mode: "axios" as const, typescript: false };

  it("axiosのインポートを含む", () => {
    const code = toAxiosCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("import axios from 'axios'");
  });

  it("method と url を含む", () => {
    const code = toAxiosCode(
      {
        method: "POST",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("method: 'post'");
    expect(code).toContain("url: 'https://api.example.com'");
  });

  it("TypeScript型注釈 axios<unknown> を含む", () => {
    const code = toAxiosCode(
      {
        method: "GET",
        url: "https://api.example.com",
        headers: {},
        body: null,
        followRedirects: false,
        insecure: false,
      },
      { mode: "axios", typescript: true },
    );
    expect(code).toContain("axios<unknown>");
  });

  it("JSONボディを data: として出力する", () => {
    const code = toAxiosCode(
      {
        method: "POST",
        url: "https://api.example.com",
        headers: {},
        body: '{"name":"test"}',
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("data:");
  });

  it("非JSONボディを data: として文字列出力する", () => {
    const code = toAxiosCode(
      {
        method: "POST",
        url: "https://api.example.com",
        headers: {},
        body: "plain text body",
        followRedirects: false,
        insecure: false,
      },
      baseOpts,
    );
    expect(code).toContain("data:");
    expect(code).toContain("plain text body");
    expect(code).not.toContain("JSON.stringify");
  });
});

describe("convertCurl", () => {
  it("空文字列は空のコードを返す", () => {
    const result = convertCurl("", { mode: "fetch", typescript: false });
    expect(result.code).toBe("");
    expect(result.warnings).toHaveLength(0);
  });

  it("fetchモードでfetchコードを生成する", () => {
    const result = convertCurl("curl 'https://api.example.com'", {
      mode: "fetch",
      typescript: false,
    });
    expect(result.code).toContain("fetch");
    expect(result.code).not.toContain("axios");
  });

  it("axiosモードでaxiosコードを生成する", () => {
    const result = convertCurl("curl 'https://api.example.com'", {
      mode: "axios",
      typescript: false,
    });
    expect(result.code).toContain("axios");
  });

  it("典型的なAPIコール全体を正しく変換する", () => {
    const curl = `curl 'https://api.example.com/users' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer mytoken' \\
  -d '{"name":"Alice","age":30}'`;

    const result = convertCurl(curl, { mode: "fetch", typescript: false });
    expect(result.code).toContain("method: 'POST'");
    expect(result.code).toContain("'Authorization': 'Bearer mytoken'");
    expect(result.code).toContain("JSON.stringify");
    expect(result.warnings).toHaveLength(0);
  });
});
