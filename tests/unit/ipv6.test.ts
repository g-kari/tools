import { describe, it, expect } from "vite-plus/test";
import { expandIPv6, compressIPv6, parseIPv6, isValidIPv6 } from "~/utils/ipv6";

describe("expandIPv6", () => {
  it("ループバックアドレスを展開する", () => {
    expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
  });

  it("未指定アドレスを展開する", () => {
    expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
  });

  it("リンクローカルアドレスを展開する", () => {
    expect(expandIPv6("fe80::1")).toBe("fe80:0000:0000:0000:0000:0000:0000:0001");
  });

  it("IPv4射影アドレスを展開する", () => {
    expect(expandIPv6("::ffff:192.168.1.1")).toBe("0000:0000:0000:0000:0000:ffff:c0a8:0101");
  });

  it("フル形式はそのまま返す（小文字化）", () => {
    expect(expandIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(
      "2001:0db8:0000:0000:0000:0000:0000:0001",
    );
  });

  it("先頭ゼロを補完する", () => {
    expect(expandIPv6("2001:db8::1")).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
  });
});

describe("compressIPv6", () => {
  it("ループバックを最短形式に圧縮する", () => {
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("::1");
  });

  it("未指定アドレスを :: にする", () => {
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("::");
  });

  it("リンクローカルを圧縮する", () => {
    expect(compressIPv6("fe80:0000:0000:0000:0000:0000:0000:0001")).toBe("fe80::1");
  });

  it("IPv4射影アドレスを圧縮する", () => {
    expect(compressIPv6("0000:0000:0000:0000:0000:ffff:c0a8:0101")).toBe("::ffff:c0a8:101");
  });

  it("ゼロ連続が複数ある場合は最長を :: にする", () => {
    // 2001:0:0:1:0:0:0:1 → 最長 0:0:0 は後半なので :: はそこに付く
    const result = compressIPv6("2001:0000:0000:0001:0000:0000:0000:0001");
    expect(result).toBe("2001:0:0:1::1");
  });

  it("グローバルユニキャストを圧縮する", () => {
    expect(compressIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("2001:db8::1");
  });

  it("圧縮不要な場合はそのまま返す（先頭ゼロは除去）", () => {
    expect(compressIPv6("2001:0db8:0001:0002:0003:0004:0005:0006")).toBe("2001:db8:1:2:3:4:5:6");
  });
});

describe("isValidIPv6", () => {
  it("有効なアドレスに true を返す", () => {
    expect(isValidIPv6("::1")).toBe(true);
    expect(isValidIPv6("::")).toBe(true);
    expect(isValidIPv6("fe80::1")).toBe(true);
    expect(isValidIPv6("2001:db8::1")).toBe(true);
    expect(isValidIPv6("::ffff:192.168.1.1")).toBe(true);
    expect(isValidIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(true);
  });

  it("無効なアドレスに false を返す", () => {
    expect(isValidIPv6("")).toBe(false);
    expect(isValidIPv6(":::")).toBe(false);
    expect(isValidIPv6("192.168.1.1")).toBe(false);
    expect(isValidIPv6("gggg::")).toBe(false);
    expect(isValidIPv6("2001:db8:1:2:3:4:5:6:7")).toBe(false);
    expect(isValidIPv6("12345::")).toBe(false);
  });
});

describe("parseIPv6", () => {
  it("ループバックアドレスを正しく解析する", () => {
    const info = parseIPv6("::1");
    expect(info.type).toBe("loopback");
    expect(info.compressed).toBe("::1");
    expect(info.expanded).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
    expect(info.isIPv4Mapped).toBe(false);
    expect(info.ipv4Mapped).toBeNull();
    expect(info.scopeId).toBeNull();
    expect(info.groups).toHaveLength(8);
    expect(info.binaryGroups).toHaveLength(8);
    expect(info.binaryGroups[7]).toBe("0000000000000001");
  });

  it("未指定アドレスを正しく解析する", () => {
    const info = parseIPv6("::");
    expect(info.type).toBe("unspecified");
    expect(info.compressed).toBe("::");
    expect(info.expanded).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
  });

  it("IPv4射影アドレスを正しく解析する", () => {
    const info = parseIPv6("::ffff:192.168.1.1");
    expect(info.type).toBe("ipv4-mapped");
    expect(info.isIPv4Mapped).toBe(true);
    expect(info.ipv4Mapped).toBe("192.168.1.1");
  });

  it("リンクローカルアドレスを正しく解析する", () => {
    const info = parseIPv6("fe80::1");
    expect(info.type).toBe("link-local");
    expect(info.compressed).toBe("fe80::1");
  });

  it("リンクローカルのゾーンIDを解析する", () => {
    const info = parseIPv6("fe80::1%eth0");
    expect(info.type).toBe("link-local");
    expect(info.scopeId).toBe("eth0");
  });

  it("マルチキャストアドレスを正しく解析する", () => {
    const info = parseIPv6("ff02::1");
    expect(info.type).toBe("multicast");
  });

  it("ユニークローカルアドレスを正しく解析する", () => {
    const info = parseIPv6("fd12:3456:789a::1");
    expect(info.type).toBe("unique-local");
  });

  it("ドキュメント用アドレスを正しく解析する", () => {
    const info = parseIPv6("2001:db8::1");
    expect(info.type).toBe("documentation");
  });

  it("グローバルユニキャストアドレスを正しく解析する", () => {
    const info = parseIPv6("2404:6800:4004:819::200e");
    expect(info.type).toBe("global-unicast");
    expect(info.isIPv4Mapped).toBe(false);
  });

  it("16進数文字列が32桁であることを確認する", () => {
    const info = parseIPv6("2001:db8::1");
    expect(info.hexadecimal).toHaveLength(32);
    expect(info.hexadecimal).toMatch(/^[0-9a-f]{32}$/);
  });

  it("2進数グループが各16桁であることを確認する", () => {
    const info = parseIPv6("fe80::1");
    for (const bits of info.binaryGroups) {
      expect(bits).toHaveLength(16);
      expect(bits).toMatch(/^[01]{16}$/);
    }
  });

  it("空文字列でエラーをスローする", () => {
    expect(() => parseIPv6("")).toThrow("アドレスを入力してください");
  });

  it("無効なアドレスでエラーをスローする", () => {
    expect(() => parseIPv6("not-an-ipv6")).toThrow();
    expect(() => parseIPv6(":::")).toThrow();
    expect(() => parseIPv6("gggg::")).toThrow();
  });
});
