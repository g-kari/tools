import { describe, it, expect } from "vite-plus/test";
import {
  tokenize,
  parseCurl,
  toFetchCode,
  toAxiosCode,
  convertCurl,
} from "../../app/utils/curl-to-fetch";

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
