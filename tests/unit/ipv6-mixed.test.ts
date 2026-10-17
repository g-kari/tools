import { describe, expect, it } from "vite-plus/test";
import { compressIPv6, expandIPv6, isValidIPv6, parseIPv6 } from "~/utils/ipv6";

const validMixed = [
  ["::192.0.2.1", "0000:0000:0000:0000:0000:0000:c000:0201"],
  ["2001:db8::192.0.2.1", "2001:0db8:0000:0000:0000:0000:c000:0201"],
  ["1:2:3:4:5::192.0.2.1", "0001:0002:0003:0004:0005:0000:c000:0201"],
  ["::1:2:3:4:5:192.0.2.1", "0000:0001:0002:0003:0004:0005:c000:0201"],
  ["1:2::3:4:5:192.0.2.1", "0001:0002:0000:0003:0004:0005:c000:0201"],
  ["1:2:3:4:5:6:192.0.2.1", "0001:0002:0003:0004:0005:0006:c000:0201"],
  ["::ffff:192.0.2.1", "0000:0000:0000:0000:0000:ffff:c000:0201"],
  ["0:0:0:0:0:FFFF:192.0.2.1", "0000:0000:0000:0000:0000:ffff:c000:0201"],
  ["2001:DB8::0.0.0.0", "2001:0db8:0000:0000:0000:0000:0000:0000"],
  ["2001:db8::255.255.255.255", "2001:0db8:0000:0000:0000:0000:ffff:ffff"],
  ["fe80::192.0.2.1%eth0", "fe80:0000:0000:0000:0000:0000:c000:0201"],
] as const;

describe("IPv4末尾付きIPv6表記", () => {
  it.each(validMixed)("%s を16進表記と同じ128ビットへ正規化する", (input, expanded) => {
    expect(isValidIPv6(input)).toBe(true);
    expect(expandIPv6(input)).toBe(expanded);
    expect(compressIPv6(input)).toBe(compressIPv6(expanded));
    const result = parseIPv6(input);
    expect(result.expanded).toBe(expanded);
    expect(result.groups).toEqual(expanded.split(":"));
    expect(result.hexadecimal).toBe(expanded.replaceAll(":", ""));
    expect(result.binaryGroups).toEqual(
      expanded.split(":").map((group) => parseInt(group, 16).toString(2).padStart(16, "0")),
    );
    expect(parseIPv6(result.compressed).expanded).toBe(expanded);
  });

  it("射影アドレスの分類とIPv4抽出を維持する", () => {
    const result = parseIPv6("::ffff:192.0.2.1");
    expect(result.type).toBe("ipv4-mapped");
    expect(result.isIPv4Mapped).toBe(true);
    expect(result.ipv4Mapped).toBe("192.0.2.1");
  });

  it("リンクローカルのゾーンIDと分類を維持する", () => {
    const result = parseIPv6("fe80::192.0.2.1%eth0");
    expect(result.scopeId).toBe("eth0");
    expect(result.type).toBe("link-local");
    expect(result.isIPv4Mapped).toBe(false);
    expect(result.ipv4Mapped).toBeNull();
  });

  it.each([
    "1:2:3:4:5:6::192.0.2.1",
    "::1:2:3:4:5:6:192.0.2.1",
    "1:2:3::4:5:6:192.0.2.1",
    "1:2:3:4:5:6:7:192.0.2.1",
    "1:2:3:4:5:192.0.2.1",
    "2001:db8:::192.0.2.1",
    "2001::db8::192.0.2.1",
    "::256.0.2.1",
    "::192.0.2.256",
    "::192.0.2",
    "::192.0.2.1.5",
    "::192.-1.2.1",
    "::192.0.2.ff",
    "192.0.2.1",
    "1:2:3:4:5:6:7::8",
    "::1:2:3:4:5:6:7:8",
    "1:2:3:4:5:6:7:8::",
  ])("不正なグループ数・圧縮・IPv4オクテット %s を拒否する", (input) => {
    expect(isValidIPv6(input)).toBe(false);
    expect(() => expandIPv6(input)).toThrow();
    expect(() => compressIPv6(input)).toThrow();
    expect(() => parseIPv6(input)).toThrow();
  });
});
