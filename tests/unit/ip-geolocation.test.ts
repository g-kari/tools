import { describe, it, expect } from "vite-plus/test";
import { isValidIPv4, isValidIPv6, isValidIP } from "../../app/functions/ip-geolocation";

describe("isValidIPv4", () => {
  describe("有効なIPv4アドレス", () => {
    it("最小アドレス 0.0.0.0 を有効と判定する", () => {
      expect(isValidIPv4("0.0.0.0")).toBe(true);
    });

    it("最大アドレス 255.255.255.255 を有効と判定する", () => {
      expect(isValidIPv4("255.255.255.255")).toBe(true);
    });

    it("ループバックアドレス 127.0.0.1 を有効と判定する", () => {
      expect(isValidIPv4("127.0.0.1")).toBe(true);
    });

    it("プライベートアドレス 192.168.1.1 を有効と判定する", () => {
      expect(isValidIPv4("192.168.1.1")).toBe(true);
    });

    it("パブリックアドレス 8.8.8.8 を有効と判定する", () => {
      expect(isValidIPv4("8.8.8.8")).toBe(true);
    });

    it("各オクテットが 0 のアドレス 10.0.0.0 を有効と判定する", () => {
      expect(isValidIPv4("10.0.0.0")).toBe(true);
    });

    it("1.2.3.4 を有効と判定する", () => {
      expect(isValidIPv4("1.2.3.4")).toBe(true);
    });
  });

  describe("無効なIPv4アドレス", () => {
    it("256.0.0.0（範囲外）を無効と判定する", () => {
      expect(isValidIPv4("256.0.0.0")).toBe(false);
    });

    it("0.256.0.0 を無効と判定する", () => {
      expect(isValidIPv4("0.256.0.0")).toBe(false);
    });

    it("0.0.256.0 を無効と判定する", () => {
      expect(isValidIPv4("0.0.256.0")).toBe(false);
    });

    it("0.0.0.256 を無効と判定する", () => {
      expect(isValidIPv4("0.0.0.256")).toBe(false);
    });

    it("オクテットが3つの 192.168.1 を無効と判定する", () => {
      expect(isValidIPv4("192.168.1")).toBe(false);
    });

    it("オクテットが5つの 192.168.1.1.1 を無効と判定する", () => {
      expect(isValidIPv4("192.168.1.1.1")).toBe(false);
    });

    it("空文字列を無効と判定する", () => {
      expect(isValidIPv4("")).toBe(false);
    });

    it("先頭ゼロ付き 01.02.03.04 を無効と判定する（先頭ゼロ不可）", () => {
      expect(isValidIPv4("01.02.03.04")).toBe(false);
    });

    it("負の数 -1.0.0.0 を無効と判定する", () => {
      expect(isValidIPv4("-1.0.0.0")).toBe(false);
    });

    it("文字を含む abc.def.ghi.jkl を無効と判定する", () => {
      expect(isValidIPv4("abc.def.ghi.jkl")).toBe(false);
    });

    it("IPv6アドレスを無効と判定する", () => {
      expect(isValidIPv4("2001:db8::1")).toBe(false);
    });

    it("ドットなし 12345678 を無効と判定する", () => {
      expect(isValidIPv4("12345678")).toBe(false);
    });
  });
});

describe("isValidIPv6", () => {
  describe("有効なIPv6アドレス", () => {
    it("ループバックアドレス ::1 を有効と判定する", () => {
      expect(isValidIPv6("::1")).toBe(true);
    });

    it("全ゼロ :: を有効と判定する", () => {
      expect(isValidIPv6("::")).toBe(true);
    });

    it("フルフォーマット 2001:0db8:0000:0000:0000:0000:0000:0001 を有効と判定する", () => {
      expect(isValidIPv6("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe(true);
    });

    it("省略形 2001:db8::1 を有効と判定する", () => {
      expect(isValidIPv6("2001:db8::1")).toBe(true);
    });

    it("リンクローカル fe80::1 を有効と判定する", () => {
      expect(isValidIPv6("fe80::1")).toBe(true);
    });

    it("マルチキャスト ff02::1 を有効と判定する", () => {
      expect(isValidIPv6("ff02::1")).toBe(true);
    });

    it("ULA fc00::1 を有効と判定する", () => {
      expect(isValidIPv6("fc00::1")).toBe(true);
    });

    it("8グループの完全なアドレス 2001:db8:1:2:3:4:5:6 を有効と判定する", () => {
      expect(isValidIPv6("2001:db8:1:2:3:4:5:6")).toBe(true);
    });

    it("大文字小文字混在 2001:DB8::1 を有効と判定する", () => {
      expect(isValidIPv6("2001:DB8::1")).toBe(true);
    });

    it("先頭 :: で始まる ::ffff:192.0.2.1 形式を有効と判定する", () => {
      expect(isValidIPv6("::ffff:c0a8:0101")).toBe(true);
    });
  });

  describe("無効なIPv6アドレス", () => {
    it("空文字列を無効と判定する", () => {
      expect(isValidIPv6("")).toBe(false);
    });

    it("単一コロン : を無効と判定する", () => {
      expect(isValidIPv6(":")).toBe(false);
    });

    it("三連コロン ::: を無効と判定する", () => {
      expect(isValidIPv6(":::")).toBe(false);
    });

    it("複数の :: が含まれる 1::2::3 を無効と判定する", () => {
      expect(isValidIPv6("1::2::3")).toBe(false);
    });

    it("9グループのアドレス 1:2:3:4:5:6:7:8:9 を無効と判定する", () => {
      expect(isValidIPv6("1:2:3:4:5:6:7:8:9")).toBe(false);
    });

    it("7グループのアドレス（:: なし）1:2:3:4:5:6:7 を無効と判定する", () => {
      expect(isValidIPv6("1:2:3:4:5:6:7")).toBe(false);
    });

    it("無効な文字 gggg::1 を無効と判定する", () => {
      expect(isValidIPv6("gggg::1")).toBe(false);
    });

    it("先頭単一コロン :1::1 を無効と判定する", () => {
      expect(isValidIPv6(":1::1")).toBe(false);
    });

    it("末尾単一コロン 1::1: を無効と判定する", () => {
      expect(isValidIPv6("1::1:")).toBe(false);
    });

    it("IPv4アドレス 192.168.1.1 を無効と判定する", () => {
      expect(isValidIPv6("192.168.1.1")).toBe(false);
    });
  });
});

describe("isValidIP", () => {
  it("有効なIPv4アドレス 8.8.8.8 を有効と判定する", () => {
    expect(isValidIP("8.8.8.8")).toBe(true);
  });

  it("有効なIPv6アドレス 2001:db8::1 を有効と判定する", () => {
    expect(isValidIP("2001:db8::1")).toBe(true);
  });

  it("IPv6ループバック ::1 を有効と判定する", () => {
    expect(isValidIP("::1")).toBe(true);
  });

  it("IPv4ループバック 127.0.0.1 を有効と判定する", () => {
    expect(isValidIP("127.0.0.1")).toBe(true);
  });

  it("無効なアドレス example.com を無効と判定する", () => {
    expect(isValidIP("example.com")).toBe(false);
  });

  it("空文字列を無効と判定する", () => {
    expect(isValidIP("")).toBe(false);
  });

  it("無効なIPアドレス 999.999.999.999 を無効と判定する", () => {
    expect(isValidIP("999.999.999.999")).toBe(false);
  });

  it("無効なIPv6アドレス 1::2::3 を無効と判定する", () => {
    expect(isValidIP("1::2::3")).toBe(false);
  });
});
