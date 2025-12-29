import { describe, it, expect } from "vitest";

// Test DNS record validation logic
describe("Email DNS Record Validation", () => {
  describe("SPF Record Validation", () => {
    it("should validate a valid SPF record", () => {
      const spfRecord = "v=spf1 include:_spf.google.com ~all";
      const isValid = spfRecord.startsWith("v=spf1");
      expect(isValid).toBe(true);
    });

    it("should invalidate SPF record without version", () => {
      const spfRecord = "include:_spf.google.com ~all";
      const isValid = spfRecord.startsWith("v=spf1");
      expect(isValid).toBe(false);
    });

    it("should parse SPF mechanisms", () => {
      const spfRecord = "v=spf1 include:_spf.google.com mx ~all";
      const parts = spfRecord.split(/\s+/);
      const version = parts[0];
      const mechanisms = parts.slice(1);

      expect(version).toBe("v=spf1");
      expect(mechanisms).toContain("include:_spf.google.com");
      expect(mechanisms).toContain("mx");
      expect(mechanisms).toContain("~all");
    });
  });

  describe("DMARC Record Validation", () => {
    it("should validate a valid DMARC record", () => {
      const dmarcRecord = "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com";
      const isValid = dmarcRecord.startsWith("v=DMARC1");
      expect(isValid).toBe(true);
    });

    it("should invalidate DMARC record without version", () => {
      const dmarcRecord = "p=quarantine; rua=mailto:dmarc@example.com";
      const isValid = dmarcRecord.startsWith("v=DMARC1");
      expect(isValid).toBe(false);
    });

    it("should parse DMARC policy", () => {
      const dmarcRecord = "v=DMARC1; p=reject; sp=quarantine; pct=100";
      const parts = dmarcRecord.split(";").map((p) => p.trim());

      const policyPart = parts.find((p) => p.startsWith("p="));
      const policy = policyPart?.split("=")[1];

      const spPart = parts.find((p) => p.startsWith("sp="));
      const subdomainPolicy = spPart?.split("=")[1];

      const pctPart = parts.find((p) => p.startsWith("pct="));
      const percentage = pctPart ? parseInt(pctPart.split("=")[1], 10) : undefined;

      expect(policy).toBe("reject");
      expect(subdomainPolicy).toBe("quarantine");
      expect(percentage).toBe(100);
    });
  });

  describe("MX Record Parsing", () => {
    it("should parse MX record priority and exchange", () => {
      const mxData = "10 mail.example.com.";
      const parts = mxData.split(" ");
      const priority = parseInt(parts[0], 10);
      const exchange = parts[1].replace(/\.$/, "");

      expect(priority).toBe(10);
      expect(exchange).toBe("mail.example.com");
    });

    it("should sort MX records by priority", () => {
      const mxRecords = [
        { priority: 20, exchange: "mail2.example.com" },
        { priority: 10, exchange: "mail1.example.com" },
        { priority: 30, exchange: "mail3.example.com" },
      ];

      const sorted = mxRecords.sort((a, b) => a.priority - b.priority);

      expect(sorted[0].priority).toBe(10);
      expect(sorted[1].priority).toBe(20);
      expect(sorted[2].priority).toBe(30);
    });
  });

  describe("Domain Validation", () => {
    it("should validate correct domain formats", () => {
      const validDomains = [
        "example.com",
        "mail.example.com",
        "example.co.jp",
        "my-domain.com",
        "123.com",
      ];

      const domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

      validDomains.forEach((domain) => {
        expect(domainRegex.test(domain)).toBe(true);
      });
    });

    it("should invalidate incorrect domain formats", () => {
      const invalidDomains = [
        "example",
        "-example.com",
        "example-.com",
        ".example.com",
        "example..com",
        "",
      ];

      const domainRegex =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

      invalidDomains.forEach((domain) => {
        expect(domainRegex.test(domain)).toBe(false);
      });
    });
  });

  describe("TXT Record Parsing", () => {
    it("should remove quotes from TXT record data", () => {
      const txtData = '"v=spf1 include:_spf.google.com ~all"';
      const cleaned = txtData.replace(/^"|"$/g, "");

      expect(cleaned).toBe("v=spf1 include:_spf.google.com ~all");
    });

    it("should handle TXT data without quotes", () => {
      const txtData = "v=spf1 include:_spf.google.com ~all";
      const cleaned = txtData.replace(/^"|"$/g, "");

      expect(cleaned).toBe("v=spf1 include:_spf.google.com ~all");
    });
  });

  describe("DKIM Selector", () => {
    it("should construct DKIM domain with selector", () => {
      const domain = "example.com";
      const selector = "google";
      const dkimDomain = `${selector}._domainkey.${domain}`;

      expect(dkimDomain).toBe("google._domainkey.example.com");
    });

    it("should construct DKIM domain with default selector", () => {
      const domain = "example.com";
      const selector = "default";
      const dkimDomain = `${selector}._domainkey.${domain}`;

      expect(dkimDomain).toBe("default._domainkey.example.com");
    });
  });

  describe("DMARC Domain", () => {
    it("should construct DMARC domain", () => {
      const domain = "example.com";
      const dmarcDomain = `_dmarc.${domain}`;

      expect(dmarcDomain).toBe("_dmarc.example.com");
    });
  });
});
