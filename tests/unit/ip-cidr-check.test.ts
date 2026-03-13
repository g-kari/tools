import { describe, it, expect } from "vitest";
import { isIPInCIDR } from "../../app/utils/cidr";

describe("isIPInCIDR", () => {
  describe("IPがCIDR内に含まれるケース（正常系）", () => {
    it("ホストIPが/24ネットワーク内に含まれる", () => {
      expect(isIPInCIDR("192.168.1.100", "192.168.1.0/24")).toBe(true);
    });

    it("ホストIPが/8ネットワーク内に含まれる", () => {
      expect(isIPInCIDR("10.50.30.1", "10.0.0.0/8")).toBe(true);
    });

    it("ホストIPが/16ネットワーク内に含まれる", () => {
      expect(isIPInCIDR("172.16.5.10", "172.16.0.0/16")).toBe(true);
    });

    it("ホストIPが/12ネットワーク内に含まれる", () => {
      expect(isIPInCIDR("172.20.0.1", "172.16.0.0/12")).toBe(true);
    });

    it("ホストIPが/25ネットワーク内に含まれる", () => {
      expect(isIPInCIDR("192.168.1.200", "192.168.1.128/25")).toBe(true);
    });
  });

  describe("IPがCIDR内に含まれないケース（正常系）", () => {
    it("異なるサブネットのIPは含まれない", () => {
      expect(isIPInCIDR("192.168.2.1", "192.168.1.0/24")).toBe(false);
    });

    it("異なるネットワーク（/8）のIPは含まれない", () => {
      expect(isIPInCIDR("11.0.0.1", "10.0.0.0/8")).toBe(false);
    });

    it("上位サブネットのIPは下位サブネットに含まれない", () => {
      expect(isIPInCIDR("192.168.1.10", "192.168.1.128/25")).toBe(false);
    });

    it("パブリックIPはプライベートCIDRに含まれない", () => {
      expect(isIPInCIDR("8.8.8.8", "192.168.0.0/16")).toBe(false);
    });
  });

  describe("境界値テスト", () => {
    it("ネットワークアドレス自体はCIDR内に含まれる", () => {
      expect(isIPInCIDR("192.168.1.0", "192.168.1.0/24")).toBe(true);
    });

    it("ブロードキャストアドレスはCIDR内に含まれる", () => {
      expect(isIPInCIDR("192.168.1.255", "192.168.1.0/24")).toBe(true);
    });

    it("/0（全IPアドレス）はすべてのIPを含む", () => {
      expect(isIPInCIDR("1.2.3.4", "0.0.0.0/0")).toBe(true);
      expect(isIPInCIDR("255.255.255.255", "0.0.0.0/0")).toBe(true);
      expect(isIPInCIDR("0.0.0.0", "0.0.0.0/0")).toBe(true);
    });

    it("/32（単一ホスト）は完全一致のIPのみ含む", () => {
      expect(isIPInCIDR("192.168.1.1", "192.168.1.1/32")).toBe(true);
      expect(isIPInCIDR("192.168.1.2", "192.168.1.1/32")).toBe(false);
    });

    it("/31（ポイントツーポイント）は2つのIPを含む", () => {
      expect(isIPInCIDR("192.168.1.0", "192.168.1.0/31")).toBe(true);
      expect(isIPInCIDR("192.168.1.1", "192.168.1.0/31")).toBe(true);
      expect(isIPInCIDR("192.168.1.2", "192.168.1.0/31")).toBe(false);
    });

    it("ネットワーク境界の直前は含まれない", () => {
      // 192.168.1.0/24 の直前 = 192.168.0.255
      expect(isIPInCIDR("192.168.0.255", "192.168.1.0/24")).toBe(false);
    });

    it("ネットワーク境界の直後は含まれない", () => {
      // 192.168.1.0/24 の直後 = 192.168.2.0
      expect(isIPInCIDR("192.168.2.0", "192.168.1.0/24")).toBe(false);
    });
  });

  describe("無効な入力でfalseを返すケース（エラー系）", () => {
    it("無効なIPアドレスはfalseを返す", () => {
      expect(isIPInCIDR("256.1.1.1", "192.168.1.0/24")).toBe(false);
    });

    it("不完全なIPアドレスはfalseを返す", () => {
      expect(isIPInCIDR("192.168.1", "192.168.1.0/24")).toBe(false);
    });

    it("文字列IPアドレスはfalseを返す", () => {
      expect(isIPInCIDR("abc.def.ghi.jkl", "192.168.1.0/24")).toBe(false);
    });

    it("無効なCIDR（プレフィックス33）はfalseを返す", () => {
      expect(isIPInCIDR("192.168.1.1", "192.168.1.0/33")).toBe(false);
    });

    it("無効なCIDR（スラッシュなし）はfalseを返す", () => {
      expect(isIPInCIDR("192.168.1.1", "192.168.1.0")).toBe(false);
    });

    it("空文字のIPはfalseを返す", () => {
      expect(isIPInCIDR("", "192.168.1.0/24")).toBe(false);
    });

    it("空文字のCIDRはfalseを返す", () => {
      expect(isIPInCIDR("192.168.1.1", "")).toBe(false);
    });

    it("両方空文字はfalseを返す", () => {
      expect(isIPInCIDR("", "")).toBe(false);
    });

    it("先頭ゼロのあるIPはfalseを返す", () => {
      expect(isIPInCIDR("192.168.01.1", "192.168.0.0/16")).toBe(false);
    });

    it("CIDRのプレフィックスに先頭ゼロがある場合はfalseを返す", () => {
      expect(isIPInCIDR("192.168.1.1", "192.168.1.0/024")).toBe(false);
    });
  });
});
