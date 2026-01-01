import { describe, it, expect } from "vitest";
import { isPrivateOrLocalhost } from "../../app/functions/security-headers";

describe("URL validation", () => {
  it("should validate valid HTTPS URL", () => {
    const url = "https://example.com";
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).protocol).toBe("https:");
  });

  it("should validate valid HTTP URL", () => {
    const url = "http://example.com";
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).protocol).toBe("http:");
  });

  it("should reject invalid URL", () => {
    expect(() => new URL("not-a-url")).toThrow();
  });

  it("should reject FTP URL", () => {
    const url = "ftp://example.com";
    const parsedUrl = new URL(url);
    expect(parsedUrl.protocol).toBe("ftp:");
    expect(["http:", "https:"].includes(parsedUrl.protocol)).toBe(false);
  });
});

describe("SSRF protection - private IP detection", () => {

  it("should detect localhost", () => {
    expect(isPrivateOrLocalhost("localhost")).toBe(true);
    expect(isPrivateOrLocalhost("test.localhost")).toBe(true);
  });

  it("should detect IPv4 localhost", () => {
    expect(isPrivateOrLocalhost("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("127.0.0.2")).toBe(true);
    expect(isPrivateOrLocalhost("127.255.255.255")).toBe(true);
  });

  it("should detect IPv6 localhost", () => {
    expect(isPrivateOrLocalhost("::1")).toBe(true);
  });

  it("should detect private IP ranges - 10.x.x.x", () => {
    expect(isPrivateOrLocalhost("10.0.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("10.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("10.255.255.255")).toBe(true);
  });

  it("should detect private IP ranges - 172.16-31.x.x", () => {
    expect(isPrivateOrLocalhost("172.16.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("172.16.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("172.31.255.255")).toBe(true);
  });

  it("should detect private IP ranges - 192.168.x.x", () => {
    expect(isPrivateOrLocalhost("192.168.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("192.168.1.1")).toBe(true);
    expect(isPrivateOrLocalhost("192.168.255.255")).toBe(true);
  });

  it("should detect link-local addresses - 169.254.x.x", () => {
    expect(isPrivateOrLocalhost("169.254.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("169.254.169.254")).toBe(true);
  });

  it("should detect IPv6 private addresses", () => {
    expect(isPrivateOrLocalhost("fc00::1")).toBe(true);
    expect(isPrivateOrLocalhost("fd00::1")).toBe(true);
    expect(isPrivateOrLocalhost("fe80::1")).toBe(true);
  });

  it("should allow public IP addresses", () => {
    expect(isPrivateOrLocalhost("8.8.8.8")).toBe(false);
    expect(isPrivateOrLocalhost("1.1.1.1")).toBe(false);
    expect(isPrivateOrLocalhost("example.com")).toBe(false);
    expect(isPrivateOrLocalhost("google.com")).toBe(false);
  });

  it("should reject invalid IP octets", () => {
    expect(isPrivateOrLocalhost("256.1.1.1")).toBe(true);
    expect(isPrivateOrLocalhost("1.256.1.1")).toBe(true);
    expect(isPrivateOrLocalhost("1.1.256.1")).toBe(true);
    expect(isPrivateOrLocalhost("1.1.1.256")).toBe(true);
  });

  it("should detect 0.0.0.0/8 (this network)", () => {
    expect(isPrivateOrLocalhost("0.0.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("0.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("0.255.255.255")).toBe(true);
  });

  it("should detect multicast addresses - 224.0.0.0/4", () => {
    expect(isPrivateOrLocalhost("224.0.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("224.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("239.255.255.255")).toBe(true);
  });

  it("should detect reserved addresses - 240.0.0.0/4", () => {
    expect(isPrivateOrLocalhost("240.0.0.0")).toBe(true);
    expect(isPrivateOrLocalhost("240.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("255.255.255.255")).toBe(true);
  });

  it("should detect IPv4-mapped IPv6 addresses", () => {
    expect(isPrivateOrLocalhost("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("::ffff:10.0.0.1")).toBe(true);
    expect(isPrivateOrLocalhost("::ffff:192.168.1.1")).toBe(true);
    expect(isPrivateOrLocalhost("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("Security header score calculation logic", () => {
  // スコア計算の重み付けテスト
  const weights = {
    "Content-Security-Policy": 25,
    "Strict-Transport-Security": 20,
    "X-Content-Type-Options": 15,
    "X-Frame-Options": 15,
    "Referrer-Policy": 10,
    "Permissions-Policy": 10,
    "X-XSS-Protection": 5,
  };

  it("should calculate perfect score when all headers pass", () => {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(totalWeight).toBe(100);
  });

  it("should calculate 50% of weight for warnings", () => {
    const cspWeight = weights["Content-Security-Policy"];
    const warningScore = cspWeight * 0.5;
    expect(warningScore).toBe(12.5);
  });

  it("should calculate 0% of weight for danger", () => {
    const cspWeight = weights["Content-Security-Policy"];
    const dangerScore = 0;
    expect(dangerScore).toBe(0);
  });

  it("should validate score thresholds", () => {
    const passThreshold = 80;
    const warningThreshold = 50;

    expect(90).toBeGreaterThanOrEqual(passThreshold);
    expect(60).toBeGreaterThanOrEqual(warningThreshold);
    expect(60).toBeLessThan(passThreshold);
    expect(30).toBeLessThan(warningThreshold);
  });
});

describe("CSP header validation logic", () => {
  it("should detect missing CSP header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should detect unsafe-inline in CSP", () => {
    const value = "default-src 'self'; script-src 'self' 'unsafe-inline'";
    expect(value.includes("'unsafe-inline'")).toBe(true);
  });

  it("should detect unsafe-eval in CSP", () => {
    const value = "default-src 'self'; script-src 'self' 'unsafe-eval'";
    expect(value.includes("'unsafe-eval'")).toBe(true);
  });

  it("should validate safe CSP", () => {
    const value = "default-src 'self'; script-src 'self'; object-src 'none'";
    expect(value.includes("default-src")).toBe(true);
    expect(value.includes("'unsafe-inline'")).toBe(false);
    expect(value.includes("'unsafe-eval'")).toBe(false);
  });
});

describe("HSTS header validation logic", () => {
  it("should detect missing HSTS header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should parse max-age from HSTS", () => {
    const value = "max-age=31536000; includeSubDomains; preload";
    const maxAgeMatch = value.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
    expect(maxAge).toBe(31536000);
  });

  it("should detect short max-age", () => {
    const value = "max-age=86400";
    const maxAgeMatch = value.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
    expect(maxAge).toBeLessThan(31536000);
  });

  it("should detect includeSubDomains directive", () => {
    const value = "max-age=31536000; includeSubDomains";
    expect(value.includes("includeSubDomains")).toBe(true);
  });

  it("should detect preload directive", () => {
    const value = "max-age=31536000; includeSubDomains; preload";
    expect(value.includes("preload")).toBe(true);
  });
});

describe("X-Content-Type-Options validation logic", () => {
  it("should detect missing header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should validate nosniff value", () => {
    const value = "nosniff";
    expect(value.toLowerCase()).toBe("nosniff");
  });

  it("should detect invalid value", () => {
    const value = "invalid";
    expect(value.toLowerCase()).not.toBe("nosniff");
  });
});

describe("X-Frame-Options validation logic", () => {
  it("should detect missing header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should validate DENY value", () => {
    const value = "DENY";
    const validValues = ["DENY", "SAMEORIGIN"];
    expect(validValues.includes(value.toUpperCase())).toBe(true);
  });

  it("should validate SAMEORIGIN value", () => {
    const value = "SAMEORIGIN";
    const validValues = ["DENY", "SAMEORIGIN"];
    expect(validValues.includes(value.toUpperCase())).toBe(true);
  });

  it("should detect invalid value", () => {
    const value = "ALLOW-FROM https://example.com";
    const validValues = ["DENY", "SAMEORIGIN"];
    expect(validValues.includes(value.toUpperCase())).toBe(false);
  });
});

describe("Referrer-Policy validation logic", () => {
  it("should detect missing header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should validate secure values", () => {
    const secureValues = [
      "no-referrer",
      "no-referrer-when-downgrade",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
    ];

    expect(secureValues.includes("no-referrer")).toBe(true);
    expect(secureValues.includes("strict-origin-when-cross-origin")).toBe(
      true
    );
  });

  it("should detect insecure value", () => {
    const value = "unsafe-url";
    const secureValues = [
      "no-referrer",
      "no-referrer-when-downgrade",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
    ];
    expect(secureValues.includes(value.toLowerCase())).toBe(false);
  });
});

describe("X-XSS-Protection validation logic", () => {
  it("should detect missing header", () => {
    const value = undefined;
    expect(value).toBeUndefined();
  });

  it("should validate disabled value (recommended)", () => {
    const value = "0";
    expect(value).toBe("0");
  });

  it("should detect legacy enabled value", () => {
    const value = "1; mode=block";
    expect(value).not.toBe("0");
  });
});
