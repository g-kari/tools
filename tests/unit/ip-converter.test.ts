import { describe, it, expect } from "vitest";
import {
  ipToHexDotted,
  ipToHexSolid,
  ipToBinaryDotted,
  ipToBinarySolid,
  hexDottedToIp,
  hexSolidToIp,
  binaryDottedToIp,
  binarySolidToIp,
  convertIP,
} from "../../app/utils/ip-converter";

describe("IP Converter Utilities", () => {
  describe("IP to Hexadecimal", () => {
    it("should convert IP to hexadecimal dotted notation", () => {
      expect(ipToHexDotted("192.168.1.1")).toBe("C0.A8.01.01");
      expect(ipToHexDotted("0.0.0.0")).toBe("00.00.00.00");
      expect(ipToHexDotted("255.255.255.255")).toBe("FF.FF.FF.FF");
      expect(ipToHexDotted("10.0.0.1")).toBe("0A.00.00.01");
    });

    it("should convert IP to hexadecimal solid notation", () => {
      expect(ipToHexSolid("192.168.1.1")).toBe("0xC0A80101");
      expect(ipToHexSolid("0.0.0.0")).toBe("0x00000000");
      expect(ipToHexSolid("255.255.255.255")).toBe("0xFFFFFFFF");
      expect(ipToHexSolid("10.0.0.1")).toBe("0x0A000001");
    });
  });

  describe("IP to Binary", () => {
    it("should convert IP to binary dotted notation", () => {
      expect(ipToBinaryDotted("192.168.1.1")).toBe(
        "11000000.10101000.00000001.00000001"
      );
      expect(ipToBinaryDotted("0.0.0.0")).toBe(
        "00000000.00000000.00000000.00000000"
      );
      expect(ipToBinaryDotted("255.255.255.255")).toBe(
        "11111111.11111111.11111111.11111111"
      );
    });

    it("should convert IP to binary solid notation", () => {
      expect(ipToBinarySolid("192.168.1.1")).toBe(
        "11000000101010000000000100000001"
      );
      expect(ipToBinarySolid("0.0.0.0")).toBe(
        "00000000000000000000000000000000"
      );
      expect(ipToBinarySolid("255.255.255.255")).toBe(
        "11111111111111111111111111111111"
      );
    });
  });

  describe("Hexadecimal to IP", () => {
    it("should convert hexadecimal dotted notation to IP", () => {
      expect(hexDottedToIp("C0.A8.01.01")).toBe("192.168.1.1");
      expect(hexDottedToIp("00.00.00.00")).toBe("0.0.0.0");
      expect(hexDottedToIp("FF.FF.FF.FF")).toBe("255.255.255.255");
      expect(hexDottedToIp("0A.00.00.01")).toBe("10.0.0.1");
    });

    it("should handle lowercase hexadecimal", () => {
      expect(hexDottedToIp("c0.a8.01.01")).toBe("192.168.1.1");
      expect(hexDottedToIp("ff.ff.ff.ff")).toBe("255.255.255.255");
    });

    it("should throw error for invalid hexadecimal dotted notation", () => {
      expect(() => hexDottedToIp("GG.00.00.00")).toThrow();
      expect(() => hexDottedToIp("100.00.00.00")).toThrow(); // >255
      expect(() => hexDottedToIp("C0.A8.01")).toThrow(); // Missing octet
    });

    it("should convert hexadecimal solid notation to IP", () => {
      expect(hexSolidToIp("0xC0A80101")).toBe("192.168.1.1");
      expect(hexSolidToIp("C0A80101")).toBe("192.168.1.1"); // Without 0x
      expect(hexSolidToIp("0x00000000")).toBe("0.0.0.0");
      expect(hexSolidToIp("0xFFFFFFFF")).toBe("255.255.255.255");
    });

    it("should handle lowercase hexadecimal solid", () => {
      expect(hexSolidToIp("0xc0a80101")).toBe("192.168.1.1");
      expect(hexSolidToIp("c0a80101")).toBe("192.168.1.1");
    });

    it("should throw error for invalid hexadecimal solid notation", () => {
      expect(() => hexSolidToIp("0xGGGGGGGG")).toThrow();
      expect(() => hexSolidToIp("0x1FFFFFFFF")).toThrow(); // Too large
    });
  });

  describe("Binary to IP", () => {
    it("should convert binary dotted notation to IP", () => {
      expect(
        binaryDottedToIp("11000000.10101000.00000001.00000001")
      ).toBe("192.168.1.1");
      expect(
        binaryDottedToIp("00000000.00000000.00000000.00000000")
      ).toBe("0.0.0.0");
      expect(
        binaryDottedToIp("11111111.11111111.11111111.11111111")
      ).toBe("255.255.255.255");
    });

    it("should throw error for invalid binary dotted notation", () => {
      expect(() => binaryDottedToIp("2.0.0.0")).toThrow(); // Invalid binary
      expect(() => binaryDottedToIp("11111111.11111111.11111111")).toThrow(); // Missing octet
      expect(() => binaryDottedToIp("111111111.0.0.0")).toThrow(); // >255
    });

    it("should convert binary solid notation to IP", () => {
      expect(binarySolidToIp("11000000101010000000000100000001")).toBe(
        "192.168.1.1"
      );
      expect(binarySolidToIp("00000000000000000000000000000000")).toBe(
        "0.0.0.0"
      );
      expect(binarySolidToIp("11111111111111111111111111111111")).toBe(
        "255.255.255.255"
      );
    });

    it("should handle short binary solid notation with padding", () => {
      expect(binarySolidToIp("1")).toBe("0.0.0.1"); // Padded to 32 bits
      expect(binarySolidToIp("11111111")).toBe("0.0.0.255");
    });

    it("should throw error for invalid binary solid notation", () => {
      expect(() => binarySolidToIp("2")).toThrow(); // Invalid binary
      expect(() => binarySolidToIp("111111111111111111111111111111111")).toThrow(); // >32 bits
    });
  });

  describe("convertIP - Auto-detect and convert", () => {
    it("should detect and convert decimal dotted notation", () => {
      const result = convertIP("192.168.1.1");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.hexDotted).toBe("C0.A8.01.01");
      expect(result.hexSolid).toBe("0xC0A80101");
      expect(result.binaryDotted).toBe(
        "11000000.10101000.00000001.00000001"
      );
      expect(result.binarySolid).toBe("11000000101010000000000100000001");
      expect(result.integer).toBe(3232235777);
    });

    it("should detect and convert hexadecimal dotted notation", () => {
      const result = convertIP("C0.A8.01.01");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.integer).toBe(3232235777);
    });

    it("should detect and convert hexadecimal solid notation", () => {
      const result = convertIP("0xC0A80101");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.integer).toBe(3232235777);
    });

    it("should detect and convert hexadecimal solid without 0x prefix", () => {
      const result = convertIP("C0A80101");
      expect(result.decimal).toBe("192.168.1.1");
    });

    it("should detect and convert binary dotted notation", () => {
      const result = convertIP("11000000.10101000.00000001.00000001");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.integer).toBe(3232235777);
    });

    it("should detect and convert binary solid notation", () => {
      const result = convertIP("11000000101010000000000100000001");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.integer).toBe(3232235777);
    });

    it("should detect and convert integer notation", () => {
      const result = convertIP("3232235777");
      expect(result.decimal).toBe("192.168.1.1");
      expect(result.integer).toBe(3232235777);
    });

    it("should handle edge cases", () => {
      const result0 = convertIP("0.0.0.0");
      expect(result0.decimal).toBe("0.0.0.0");
      expect(result0.integer).toBe(0);

      const result255 = convertIP("255.255.255.255");
      expect(result255.decimal).toBe("255.255.255.255");
      expect(result255.integer).toBe(4294967295);
    });

    it("should throw error for invalid IP address", () => {
      expect(() => convertIP("256.1.1.1")).toThrow("無効なIPアドレスです");
      expect(() => convertIP("192.168.1")).toThrow("認識できない形式です");
    });

    it("should throw error for out-of-range integer", () => {
      expect(() => convertIP("4294967296")).toThrow(
        "整数値がIPv4の範囲を超えています"
      );
      expect(() => convertIP("-1")).toThrow("認識できない形式です");
    });

    it("should throw error for unrecognized format", () => {
      expect(() => convertIP("abc")).toThrow("認識できない形式です");
    });

    it("should handle whitespace", () => {
      const result = convertIP("  192.168.1.1  ");
      expect(result.decimal).toBe("192.168.1.1");
    });
  });

  describe("Round-trip conversions", () => {
    it("should maintain consistency across all formats", () => {
      const testIPs = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "0.0.0.0",
        "255.255.255.255",
        "127.0.0.1",
      ];

      testIPs.forEach((ip) => {
        const result = convertIP(ip);

        // Convert back from each format
        expect(convertIP(result.decimal).decimal).toBe(ip);
        expect(convertIP(result.hexDotted).decimal).toBe(ip);
        expect(convertIP(result.hexSolid).decimal).toBe(ip);
        expect(convertIP(result.binaryDotted).decimal).toBe(ip);
        expect(convertIP(result.binarySolid).decimal).toBe(ip);
        expect(convertIP(result.integer.toString()).decimal).toBe(ip);
      });
    });
  });
});
