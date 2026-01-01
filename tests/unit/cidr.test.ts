import { describe, it, expect } from "vitest";
import {
  isValidIPv4,
  isValidCIDR,
  ipToInt,
  intToIp,
  prefixToSubnetMask,
  calculateNetworkAddress,
  calculateBroadcastAddress,
  calculateFirstUsableIP,
  calculateLastUsableIP,
  calculateTotalHosts,
  calculateUsableHosts,
  calculateWildcardMask,
  subnetMaskToBinary,
  getIPClass,
  isPrivateIP,
  calculateCIDR,
} from "../../app/utils/cidr";

describe("CIDR Utilities", () => {
  describe("isValidIPv4", () => {
    it("should validate correct IPv4 addresses", () => {
      expect(isValidIPv4("192.168.1.1")).toBe(true);
      expect(isValidIPv4("0.0.0.0")).toBe(true);
      expect(isValidIPv4("255.255.255.255")).toBe(true);
      expect(isValidIPv4("127.0.0.1")).toBe(true);
    });

    it("should reject invalid IPv4 addresses", () => {
      expect(isValidIPv4("256.1.1.1")).toBe(false);
      expect(isValidIPv4("192.168.1")).toBe(false);
      expect(isValidIPv4("192.168.1.1.1")).toBe(false);
      expect(isValidIPv4("192.168.01.1")).toBe(false); // Leading zero
      expect(isValidIPv4("192.168.-1.1")).toBe(false);
      expect(isValidIPv4("abc.def.ghi.jkl")).toBe(false);
    });
  });

  describe("isValidCIDR", () => {
    it("should validate correct CIDR notation", () => {
      expect(isValidCIDR("192.168.1.0/24")).toBe(true);
      expect(isValidCIDR("10.0.0.0/8")).toBe(true);
      expect(isValidCIDR("172.16.0.0/12")).toBe(true);
      expect(isValidCIDR("192.168.1.128/25")).toBe(true);
      expect(isValidCIDR("0.0.0.0/0")).toBe(true);
      expect(isValidCIDR("192.168.1.1/32")).toBe(true);
    });

    it("should reject invalid CIDR notation", () => {
      expect(isValidCIDR("192.168.1.0/33")).toBe(false); // Prefix > 32
      expect(isValidCIDR("192.168.1.0/-1")).toBe(false); // Negative prefix
      expect(isValidCIDR("192.168.1.0/")).toBe(false); // Missing prefix
      expect(isValidCIDR("192.168.1.0")).toBe(false); // Missing slash
      expect(isValidCIDR("256.1.1.1/24")).toBe(false); // Invalid IP
      expect(isValidCIDR("192.168.1.0/024")).toBe(false); // Leading zero in prefix
    });
  });

  describe("ipToInt and intToIp", () => {
    it("should convert IP to integer and back", () => {
      expect(ipToInt("192.168.1.1")).toBe(3232235777);
      expect(ipToInt("0.0.0.0")).toBe(0);
      expect(ipToInt("255.255.255.255")).toBe(4294967295);
      expect(ipToInt("127.0.0.1")).toBe(2130706433);
    });

    it("should convert integer to IP", () => {
      expect(intToIp(3232235777)).toBe("192.168.1.1");
      expect(intToIp(0)).toBe("0.0.0.0");
      expect(intToIp(4294967295)).toBe("255.255.255.255");
      expect(intToIp(2130706433)).toBe("127.0.0.1");
    });

    it("should round-trip correctly", () => {
      const ips = [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "0.0.0.0",
        "255.255.255.255",
      ];
      ips.forEach((ip) => {
        expect(intToIp(ipToInt(ip))).toBe(ip);
      });
    });
  });

  describe("prefixToSubnetMask", () => {
    it("should calculate correct subnet masks", () => {
      expect(prefixToSubnetMask(24)).toBe("255.255.255.0");
      expect(prefixToSubnetMask(16)).toBe("255.255.0.0");
      expect(prefixToSubnetMask(8)).toBe("255.0.0.0");
      expect(prefixToSubnetMask(32)).toBe("255.255.255.255");
      expect(prefixToSubnetMask(0)).toBe("0.0.0.0");
      expect(prefixToSubnetMask(25)).toBe("255.255.255.128");
    });
  });

  describe("calculateNetworkAddress", () => {
    it("should calculate correct network addresses", () => {
      expect(calculateNetworkAddress("192.168.1.100", 24)).toBe("192.168.1.0");
      expect(calculateNetworkAddress("10.1.2.3", 8)).toBe("10.0.0.0");
      expect(calculateNetworkAddress("172.16.5.7", 12)).toBe("172.16.0.0");
      expect(calculateNetworkAddress("192.168.1.128", 25)).toBe(
        "192.168.1.128"
      );
    });
  });

  describe("calculateBroadcastAddress", () => {
    it("should calculate correct broadcast addresses", () => {
      expect(calculateBroadcastAddress("192.168.1.0", 24)).toBe(
        "192.168.1.255"
      );
      expect(calculateBroadcastAddress("10.0.0.0", 8)).toBe("10.255.255.255");
      expect(calculateBroadcastAddress("172.16.0.0", 12)).toBe(
        "172.31.255.255"
      );
      expect(calculateBroadcastAddress("192.168.1.128", 25)).toBe(
        "192.168.1.255"
      );
    });
  });

  describe("calculateFirstUsableIP and calculateLastUsableIP", () => {
    it("should calculate first and last usable IPs", () => {
      expect(calculateFirstUsableIP("192.168.1.0")).toBe("192.168.1.1");
      expect(calculateLastUsableIP("192.168.1.255")).toBe("192.168.1.254");
      expect(calculateFirstUsableIP("10.0.0.0")).toBe("10.0.0.1");
      expect(calculateLastUsableIP("10.255.255.255")).toBe("10.255.255.254");
    });
  });

  describe("calculateTotalHosts and calculateUsableHosts", () => {
    it("should calculate total hosts correctly", () => {
      expect(calculateTotalHosts(24)).toBe(256);
      expect(calculateTotalHosts(16)).toBe(65536);
      expect(calculateTotalHosts(8)).toBe(16777216);
      expect(calculateTotalHosts(32)).toBe(1);
    });

    it("should calculate usable hosts correctly", () => {
      expect(calculateUsableHosts(24)).toBe(254); // 256 - 2
      expect(calculateUsableHosts(16)).toBe(65534); // 65536 - 2
      expect(calculateUsableHosts(32)).toBe(1); // Single host
      expect(calculateUsableHosts(31)).toBe(2); // Point-to-point
    });
  });

  describe("calculateWildcardMask", () => {
    it("should calculate correct wildcard masks", () => {
      expect(calculateWildcardMask("255.255.255.0")).toBe("0.0.0.255");
      expect(calculateWildcardMask("255.255.0.0")).toBe("0.0.255.255");
      expect(calculateWildcardMask("255.0.0.0")).toBe("0.255.255.255");
      expect(calculateWildcardMask("255.255.255.128")).toBe("0.0.0.127");
    });
  });

  describe("subnetMaskToBinary", () => {
    it("should convert subnet mask to binary", () => {
      expect(subnetMaskToBinary("255.255.255.0")).toBe(
        "11111111.11111111.11111111.00000000"
      );
      expect(subnetMaskToBinary("255.255.0.0")).toBe(
        "11111111.11111111.00000000.00000000"
      );
      expect(subnetMaskToBinary("255.255.255.128")).toBe(
        "11111111.11111111.11111111.10000000"
      );
    });
  });

  describe("getIPClass", () => {
    it("should determine IP address class correctly", () => {
      expect(getIPClass("10.0.0.1")).toBe("A");
      expect(getIPClass("172.16.0.1")).toBe("B");
      expect(getIPClass("192.168.1.1")).toBe("C");
      expect(getIPClass("224.0.0.1")).toBe("D (Multicast)");
      expect(getIPClass("240.0.0.1")).toBe("E (Reserved)");
    });
  });

  describe("isPrivateIP", () => {
    it("should identify private IP addresses", () => {
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("10.255.255.255")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("172.31.255.255")).toBe(true);
      expect(isPrivateIP("192.168.0.1")).toBe(true);
      expect(isPrivateIP("192.168.255.255")).toBe(true);
    });

    it("should identify public IP addresses", () => {
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("1.1.1.1")).toBe(false);
      expect(isPrivateIP("172.32.0.1")).toBe(false); // Just outside private range
      expect(isPrivateIP("11.0.0.1")).toBe(false); // Just outside private range
    });
  });

  describe("calculateCIDR", () => {
    it("should calculate all CIDR information correctly for /24", () => {
      const result = calculateCIDR("192.168.1.0/24");

      expect(result.cidr).toBe("192.168.1.0/24");
      expect(result.networkAddress).toBe("192.168.1.0");
      expect(result.broadcastAddress).toBe("192.168.1.255");
      expect(result.subnetMask).toBe("255.255.255.0");
      expect(result.firstUsableIP).toBe("192.168.1.1");
      expect(result.lastUsableIP).toBe("192.168.1.254");
      expect(result.totalHosts).toBe(256);
      expect(result.usableHosts).toBe(254);
      expect(result.wildcardMask).toBe("0.0.0.255");
      expect(result.binarySubnetMask).toBe(
        "11111111.11111111.11111111.00000000"
      );
      expect(result.ipClass).toBe("C");
      expect(result.isPrivate).toBe(true);
    });

    it("should calculate all CIDR information correctly for /16", () => {
      const result = calculateCIDR("172.16.0.0/16");

      expect(result.cidr).toBe("172.16.0.0/16");
      expect(result.networkAddress).toBe("172.16.0.0");
      expect(result.broadcastAddress).toBe("172.16.255.255");
      expect(result.subnetMask).toBe("255.255.0.0");
      expect(result.firstUsableIP).toBe("172.16.0.1");
      expect(result.lastUsableIP).toBe("172.16.255.254");
      expect(result.totalHosts).toBe(65536);
      expect(result.usableHosts).toBe(65534);
      expect(result.ipClass).toBe("B");
      expect(result.isPrivate).toBe(true);
    });

    it("should handle /32 (single host) correctly", () => {
      const result = calculateCIDR("192.168.1.1/32");

      expect(result.networkAddress).toBe("192.168.1.1");
      expect(result.broadcastAddress).toBe("192.168.1.1");
      expect(result.firstUsableIP).toBe("192.168.1.1");
      expect(result.lastUsableIP).toBe("192.168.1.1");
      expect(result.totalHosts).toBe(1);
      expect(result.usableHosts).toBe(1);
    });

    it("should handle /31 (point-to-point) correctly", () => {
      const result = calculateCIDR("192.168.1.0/31");

      expect(result.networkAddress).toBe("192.168.1.0");
      expect(result.broadcastAddress).toBe("192.168.1.1");
      expect(result.firstUsableIP).toBe("192.168.1.0");
      expect(result.lastUsableIP).toBe("192.168.1.1");
      expect(result.totalHosts).toBe(2);
      expect(result.usableHosts).toBe(2);
    });

    it("should throw error for invalid CIDR", () => {
      expect(() => calculateCIDR("192.168.1.0/33")).toThrow(
        "Invalid CIDR notation"
      );
      expect(() => calculateCIDR("256.1.1.1/24")).toThrow(
        "Invalid CIDR notation"
      );
      expect(() => calculateCIDR("192.168.1.0")).toThrow(
        "Invalid CIDR notation"
      );
    });

    it("should normalize IP address to network address", () => {
      const result = calculateCIDR("192.168.1.100/24");
      expect(result.networkAddress).toBe("192.168.1.0");
    });
  });
});
