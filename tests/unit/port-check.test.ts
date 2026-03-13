import { describe, it, expect } from "vitest";
import {
  validateHost,
  parsePorts,
  getServiceName,
  isPrivateHost,
} from "../../app/functions/port-check";

describe("validateHost", () => {
  it("有効なドメイン名を受け入れる", () => {
    expect(validateHost("example.com")).toBe(true);
    expect(validateHost("sub.example.com")).toBe(true);
    expect(validateHost("my-host.example.co.jp")).toBe(true);
    expect(validateHost("localhost")).toBe(true);
  });

  it("有効なIPv4アドレスを受け入れる", () => {
    expect(validateHost("192.168.1.1")).toBe(true);
    expect(validateHost("8.8.8.8")).toBe(true);
    expect(validateHost("0.0.0.0")).toBe(true);
    expect(validateHost("255.255.255.255")).toBe(true);
  });

  it("無効なIPv4アドレスを拒否する（オクテット値が範囲外）", () => {
    expect(validateHost("256.0.0.1")).toBe(false);
    expect(validateHost("192.168.1.256")).toBe(false);
    // 注: "192.168.1" は3オクテットのため IPv4 ではなく、ホスト名としても有効
    // （各ラベルが数字のみでも RFC1123 上は許容される）
  });

  it("空文字列やホワイトスペースを拒否する", () => {
    expect(validateHost("")).toBe(false);
    expect(validateHost("   ")).toBe(false);
  });

  it("無効な文字を含む文字列を拒否する", () => {
    expect(validateHost("exam ple.com")).toBe(false);
    expect(validateHost("example..com")).toBe(false);
    expect(validateHost("-example.com")).toBe(false);
  });

  it("253文字を超えるホスト名を拒否する", () => {
    const longHost = "a".repeat(254);
    expect(validateHost(longHost)).toBe(false);
  });

  it("253文字ちょうどのホスト名は受け入れる", () => {
    // 253文字: 63文字ラベル.63文字ラベル.63文字ラベル.61文字ラベル = 253文字
    const label63 = "a".repeat(63);
    const label61 = "a".repeat(61);
    const host253 = `${label63}.${label63}.${label63}.${label61}`;
    expect(host253.length).toBe(253);
    expect(validateHost(host253)).toBe(true);
  });

  it("先頭・末尾のスペースをトリムして検証する", () => {
    expect(validateHost("  example.com  ")).toBe(true);
    expect(validateHost("  192.168.1.1  ")).toBe(true);
  });

  it("数字で始まるホスト名も受け入れる", () => {
    expect(validateHost("1example.com")).toBe(true);
    expect(validateHost("123.example.com")).toBe(true);
  });

  it("ハイフンで終わるラベルを拒否する", () => {
    expect(validateHost("example-.com")).toBe(false);
  });
});

describe("parsePorts", () => {
  it("カンマ区切りのポート文字列を配列に変換する", () => {
    expect(parsePorts("80,443")).toEqual([80, 443]);
    expect(parsePorts("22")).toEqual([22]);
    expect(parsePorts("80,443,8080")).toEqual([80, 443, 8080]);
  });

  it("スペースを含む入力を正しく処理する", () => {
    expect(parsePorts(" 80 , 443 ")).toEqual([80, 443]);
  });

  it("範囲外のポートを除外する", () => {
    expect(parsePorts("0,80,65535,65536")).toEqual([80, 65535]);
    expect(parsePorts("-1,22")).toEqual([22]);
  });

  it("重複するポートを除去する", () => {
    expect(parsePorts("80,80,443")).toEqual([80, 443]);
  });

  it("空文字列に対して空配列を返す", () => {
    expect(parsePorts("")).toEqual([]);
    expect(parsePorts("   ")).toEqual([]);
  });

  it("無効な値を除外する", () => {
    expect(parsePorts("abc,80,xyz")).toEqual([80]);
  });

  it("最小・最大ポートを受け入れる", () => {
    expect(parsePorts("1,65535")).toEqual([1, 65535]);
  });

  it("小数点を含む値はintParseにより整数部分のみが有効なポートとして扱われる", () => {
    // parseInt("80.5") === 80 のため、80 は有効なポートとして含まれる
    expect(parsePorts("80.5,443")).toEqual([80, 443]);
  });

  it("ポート範囲記法（80-443）はサポートされず、先頭の数値のみ取得される", () => {
    // parseInt("80-443") === 80 のため、80 のみが含まれる
    expect(parsePorts("80-443")).toEqual([80]);
  });

  it("先頭がゼロ補完された文字列を正しく処理する", () => {
    expect(parsePorts("080,0443")).toEqual([80, 443]);
  });
});

describe("isPrivateHost", () => {
  it("ループバックアドレス (127.0.0.1) をプライベートと判定する", () => {
    expect(isPrivateHost("127.0.0.1")).toBe(true);
  });

  it("プライベートClass C (192.168.1.1) をプライベートと判定する", () => {
    expect(isPrivateHost("192.168.1.1")).toBe(true);
  });

  it("プライベートClass A (10.0.0.1) をプライベートと判定する", () => {
    expect(isPrivateHost("10.0.0.1")).toBe(true);
  });

  it("パブリックIP (8.8.8.8) はプライベートではないと判定する", () => {
    expect(isPrivateHost("8.8.8.8")).toBe(false);
  });

  it("パブリックドメイン (example.com) はプライベートではないと判定する", () => {
    expect(isPrivateHost("example.com")).toBe(false);
  });

  it("プライベートClass B (172.16.0.1) をプライベートと判定する", () => {
    expect(isPrivateHost("172.16.0.1")).toBe(true);
    expect(isPrivateHost("172.31.255.255")).toBe(true);
    expect(isPrivateHost("172.15.0.1")).toBe(false);
    expect(isPrivateHost("172.32.0.1")).toBe(false);
  });

  it("リンクローカルアドレス (169.254.x.x) をプライベートと判定する", () => {
    expect(isPrivateHost("169.254.0.1")).toBe(true);
  });

  it("非ルーティングアドレス (0.0.0.0) をプライベートと判定する", () => {
    expect(isPrivateHost("0.0.0.0")).toBe(true);
  });

  it("IPv6ループバック (::1) をプライベートと判定する", () => {
    expect(isPrivateHost("::1")).toBe(true);
  });
});

describe("getServiceName", () => {
  it("既知のポートに対してサービス名を返す", () => {
    expect(getServiceName(80)).toBe("HTTP");
    expect(getServiceName(443)).toBe("HTTPS");
    expect(getServiceName(22)).toBe("SSH");
    expect(getServiceName(21)).toBe("FTP");
    expect(getServiceName(3306)).toBe("MySQL");
    expect(getServiceName(5432)).toBe("PostgreSQL");
    expect(getServiceName(6379)).toBe("Redis");
    expect(getServiceName(27017)).toBe("MongoDB");
  });

  it("その他の既知ポートのサービス名を返す", () => {
    expect(getServiceName(23)).toBe("Telnet");
    expect(getServiceName(25)).toBe("SMTP");
    expect(getServiceName(53)).toBe("DNS");
    expect(getServiceName(110)).toBe("POP3");
    expect(getServiceName(143)).toBe("IMAP");
    expect(getServiceName(587)).toBe("SMTP TLS");
    expect(getServiceName(993)).toBe("IMAPS");
    expect(getServiceName(995)).toBe("POP3S");
    expect(getServiceName(1433)).toBe("MSSQL");
    expect(getServiceName(8080)).toBe("HTTP Proxy");
    expect(getServiceName(8443)).toBe("HTTPS Alt");
  });

  it("未知のポートに対してundefinedを返す", () => {
    expect(getServiceName(12345)).toBeUndefined();
    expect(getServiceName(9999)).toBeUndefined();
  });

  it("ポート0や負の値はundefinedを返す", () => {
    expect(getServiceName(0)).toBeUndefined();
    expect(getServiceName(-1)).toBeUndefined();
  });
});
