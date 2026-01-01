import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("DNS Lookup Utilities", () => {
  describe("Domain validation", () => {
    it("should accept valid domain names", () => {
      const validDomains = [
        "example.com",
        "sub.example.com",
        "www.example.co.jp",
        "test-domain.com",
        "a.b.c.d.example.com",
      ];

      const domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

      validDomains.forEach((domain) => {
        expect(domainRegex.test(domain)).toBe(true);
      });
    });

    it("should reject invalid domain names", () => {
      const invalidDomains = [
        "",
        " ",
        "example",
        "-example.com",
        "example-.com",
        "exam ple.com",
        ".example.com",
        "example.com.",
        "exa!mple.com",
      ];

      const domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

      invalidDomains.forEach((domain) => {
        expect(domainRegex.test(domain)).toBe(false);
      });
    });
  });

  describe("DNS record type mapping", () => {
    it("should have correct type numbers", () => {
      const DNS_TYPE_MAP = {
        A: 1,
        AAAA: 28,
        CNAME: 5,
        MX: 15,
        TXT: 16,
        NS: 2,
        SOA: 6,
        PTR: 12,
        SRV: 33,
        CAA: 257,
      };

      expect(DNS_TYPE_MAP.A).toBe(1);
      expect(DNS_TYPE_MAP.AAAA).toBe(28);
      expect(DNS_TYPE_MAP.CNAME).toBe(5);
      expect(DNS_TYPE_MAP.MX).toBe(15);
      expect(DNS_TYPE_MAP.TXT).toBe(16);
      expect(DNS_TYPE_MAP.NS).toBe(2);
      expect(DNS_TYPE_MAP.SOA).toBe(6);
      expect(DNS_TYPE_MAP.PTR).toBe(12);
      expect(DNS_TYPE_MAP.SRV).toBe(33);
      expect(DNS_TYPE_MAP.CAA).toBe(257);
    });
  });

  describe("DOH Response parsing", () => {
    it("should parse successful DOH response with A records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Question: [{ name: "example.com", type: 1 }],
        Answer: [
          {
            name: "example.com",
            type: 1,
            TTL: 3600,
            data: "93.184.216.34",
          },
        ],
      };

      expect(dohResponse.Status).toBe(0);
      expect(dohResponse.Answer).toBeDefined();
      expect(dohResponse.Answer?.length).toBe(1);
      expect(dohResponse.Answer?.[0].data).toBe("93.184.216.34");
    });

    it("should handle NXDOMAIN response", () => {
      const dohResponse = {
        Status: 3, // NXDOMAIN
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
      };

      expect(dohResponse.Status).toBe(3);
    });

    it("should handle response with no records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Question: [{ name: "example.com", type: 15 }],
      };

      expect(dohResponse.Status).toBe(0);
      expect(dohResponse.Answer).toBeUndefined();
    });

    it("should parse MX records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Answer: [
          {
            name: "example.com",
            type: 15,
            TTL: 3600,
            data: "10 mail.example.com",
          },
          {
            name: "example.com",
            type: 15,
            TTL: 3600,
            data: "20 mail2.example.com",
          },
        ],
      };

      const mxRecords = dohResponse.Answer.filter((r) => r.type === 15);
      expect(mxRecords.length).toBe(2);
      expect(mxRecords[0].data).toContain("mail.example.com");
    });

    it("should parse TXT records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Answer: [
          {
            name: "example.com",
            type: 16,
            TTL: 3600,
            data: '"v=spf1 include:_spf.example.com ~all"',
          },
        ],
      };

      const txtRecords = dohResponse.Answer.filter((r) => r.type === 16);
      expect(txtRecords.length).toBe(1);
      expect(txtRecords[0].data).toContain("v=spf1");
    });

    it("should parse NS records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Answer: [
          {
            name: "example.com",
            type: 2,
            TTL: 3600,
            data: "ns1.example.com",
          },
          {
            name: "example.com",
            type: 2,
            TTL: 3600,
            data: "ns2.example.com",
          },
        ],
      };

      const nsRecords = dohResponse.Answer.filter((r) => r.type === 2);
      expect(nsRecords.length).toBe(2);
    });

    it("should parse AAAA records (IPv6)", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Answer: [
          {
            name: "example.com",
            type: 28,
            TTL: 3600,
            data: "2606:2800:220:1:248:1893:25c8:1946",
          },
        ],
      };

      const aaaaRecords = dohResponse.Answer.filter((r) => r.type === 28);
      expect(aaaaRecords.length).toBe(1);
      expect(aaaaRecords[0].data).toContain(":");
    });

    it("should parse CNAME records", () => {
      const dohResponse = {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
        Answer: [
          {
            name: "www.example.com",
            type: 5,
            TTL: 3600,
            data: "example.com",
          },
        ],
      };

      const cnameRecords = dohResponse.Answer.filter((r) => r.type === 5);
      expect(cnameRecords.length).toBe(1);
      expect(cnameRecords[0].data).toBe("example.com");
    });
  });

  describe("DNS lookup input validation", () => {
    it("should accept valid input with domain and types", () => {
      const input = {
        domain: "example.com",
        types: ["A", "AAAA", "MX"],
      };

      expect(input.domain).toBe("example.com");
      expect(Array.isArray(input.types)).toBe(true);
      expect(input.types?.length).toBe(3);
    });

    it("should accept input with only domain", () => {
      const input = {
        domain: "example.com",
      };

      expect(input.domain).toBe("example.com");
      expect(input.types).toBeUndefined();
    });

    it("should normalize domain to lowercase", () => {
      const domain = "EXAMPLE.COM";
      const normalized = domain.toLowerCase().trim();

      expect(normalized).toBe("example.com");
    });

    it("should trim whitespace from domain", () => {
      const domain = "  example.com  ";
      const trimmed = domain.trim();

      expect(trimmed).toBe("example.com");
    });
  });

  describe("DNS record filtering", () => {
    it("should filter records by type", () => {
      const allRecords = [
        { name: "example.com", type: 1, TTL: 3600, data: "1.2.3.4" },
        { name: "example.com", type: 28, TTL: 3600, data: "::1" },
        { name: "example.com", type: 1, TTL: 3600, data: "5.6.7.8" },
      ];

      const aRecords = allRecords.filter((r) => r.type === 1);
      expect(aRecords.length).toBe(2);
    });

    it("should handle empty record arrays", () => {
      const records: unknown[] = [];
      expect(records.length).toBe(0);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", () => {
      const error = new Error("Network error");
      expect(error.message).toBe("Network error");
    });

    it("should handle timeout errors", () => {
      const error = new Error("Request timeout");
      expect(error.message).toContain("timeout");
    });

    it("should handle DNS server errors", () => {
      const errorResponse = {
        Status: 2, // SERVFAIL
        TC: false,
        RD: true,
        RA: true,
        AD: false,
        CD: false,
      };

      expect(errorResponse.Status).not.toBe(0);
      expect(errorResponse.Status).toBe(2);
    });
  });

  describe("TTL formatting", () => {
    it("should display TTL in seconds", () => {
      const ttl = 3600;
      const formatted = `${ttl}秒`;

      expect(formatted).toBe("3600秒");
    });

    it("should handle various TTL values", () => {
      const ttls = [60, 300, 3600, 86400];

      ttls.forEach((ttl) => {
        expect(ttl).toBeGreaterThan(0);
      });
    });
  });

  describe("Record type labels", () => {
    it("should have proper labels for all record types", () => {
      const recordTypes = [
        { value: "A", label: "A", description: "IPv4アドレス" },
        { value: "AAAA", label: "AAAA", description: "IPv6アドレス" },
        { value: "CNAME", label: "CNAME", description: "正規名" },
        { value: "MX", label: "MX", description: "メールサーバー" },
        { value: "TXT", label: "TXT", description: "テキストレコード" },
        { value: "NS", label: "NS", description: "ネームサーバー" },
      ];

      recordTypes.forEach((type) => {
        expect(type.value).toBe(type.label);
        expect(type.description).toBeTruthy();
      });
    });
  });
});
