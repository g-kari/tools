import { describe, it, expect } from "vitest";
import {
  fileSizeToBytes,
  speedToBps,
  calcTransferTime,
  calcRequiredSpeed,
  formatTransferTime,
  formatSpeed,
  formatFileSize,
} from "../../app/utils/transfer-speed";

describe("fileSizeToBytes", () => {
  it("バイトをそのまま返す", () => {
    expect(fileSizeToBytes(1, "B")).toBe(1);
    expect(fileSizeToBytes(500, "B")).toBe(500);
  });

  it("KBを正しく変換する", () => {
    expect(fileSizeToBytes(1, "KB")).toBe(1_024);
    expect(fileSizeToBytes(2, "KB")).toBe(2_048);
  });

  it("MBを正しく変換する", () => {
    expect(fileSizeToBytes(1, "MB")).toBe(1_048_576);
    expect(fileSizeToBytes(100, "MB")).toBe(104_857_600);
  });

  it("GBを正しく変換する", () => {
    expect(fileSizeToBytes(1, "GB")).toBe(1_073_741_824);
  });

  it("TBを正しく変換する", () => {
    expect(fileSizeToBytes(1, "TB")).toBe(1_099_511_627_776);
  });
});

describe("speedToBps", () => {
  it("bpsをそのまま返す", () => {
    expect(speedToBps(1, "bps")).toBe(1);
    expect(speedToBps(100, "bps")).toBe(100);
  });

  it("Kbpsを正しく変換する", () => {
    expect(speedToBps(1, "Kbps")).toBe(1_000);
    expect(speedToBps(384, "Kbps")).toBe(384_000);
  });

  it("Mbpsを正しく変換する", () => {
    expect(speedToBps(1, "Mbps")).toBe(1_000_000);
    expect(speedToBps(100, "Mbps")).toBe(100_000_000);
  });

  it("Gbpsを正しく変換する", () => {
    expect(speedToBps(1, "Gbps")).toBe(1_000_000_000);
  });

  it("KBps（バイト毎秒）を正しく変換する", () => {
    // 1 KB/s = 8 Kbps = 8000 bps
    expect(speedToBps(1, "KBps")).toBe(8_000);
  });

  it("MBps（メガバイト毎秒）を正しく変換する", () => {
    // 1 MB/s = 8 Mbps = 8,000,000 bps
    expect(speedToBps(1, "MBps")).toBe(8_000_000);
  });

  it("GBpsを正しく変換する", () => {
    expect(speedToBps(1, "GBps")).toBe(8_000_000_000);
  });
});

describe("calcTransferTime", () => {
  it("1GBファイルを100Mbpsで転送する時間を計算する", () => {
    const bytes = 1_073_741_824; // 1GB
    const bps = 100_000_000; // 100Mbps
    const result = calcTransferTime(bytes, bps);
    expect(result).not.toBeNull();
    // 1GB = 8,589,934,592 bits / 100,000,000 bps ≈ 85.9秒
    expect(result!.seconds).toBeCloseTo(85.899, 2);
  });

  it("100MBファイルを1Gbpsで転送する時間を計算する", () => {
    const bytes = fileSizeToBytes(100, "MB");
    const bps = speedToBps(1, "Gbps");
    const result = calcTransferTime(bytes, bps);
    expect(result).not.toBeNull();
    // 100MB = 838,860,800 bits / 1,000,000,000 bps ≈ 0.839秒
    expect(result!.seconds).toBeCloseTo(0.839, 2);
  });

  it("不正なバイト数に対してnullを返す", () => {
    expect(calcTransferTime(0, 100_000_000)).toBeNull();
    expect(calcTransferTime(-1, 100_000_000)).toBeNull();
    expect(calcTransferTime(NaN, 100_000_000)).toBeNull();
  });

  it("不正な速度に対してnullを返す", () => {
    expect(calcTransferTime(1_000_000, 0)).toBeNull();
    expect(calcTransferTime(1_000_000, -1)).toBeNull();
    expect(calcTransferTime(1_000_000, NaN)).toBeNull();
  });

  it("formattedとbreakdownを含む結果を返す", () => {
    const result = calcTransferTime(1_073_741_824, 100_000_000);
    expect(result).toHaveProperty("seconds");
    expect(result).toHaveProperty("formatted");
    expect(result).toHaveProperty("breakdown");
    expect(result!.breakdown).toHaveProperty("days");
    expect(result!.breakdown).toHaveProperty("hours");
    expect(result!.breakdown).toHaveProperty("minutes");
    expect(result!.breakdown).toHaveProperty("seconds");
  });
});

describe("calcRequiredSpeed", () => {
  it("1GBファイルを60秒で転送するための必要速度を計算する", () => {
    const bytes = fileSizeToBytes(1, "GB");
    const result = calcRequiredSpeed(bytes, 60);
    expect(result).not.toBeNull();
    // 1GB = 8,589,934,592 bits / 60秒 ≈ 143,165,576 bps ≈ 143.17 Mbps
    expect(result!.bps).toBeCloseTo(143_165_576, -3);
    expect(result!.mbps).toBeCloseTo(143.165, 1);
  });

  it("全速度単位を含む結果を返す", () => {
    const result = calcRequiredSpeed(1_000_000, 1);
    expect(result).toHaveProperty("bps");
    expect(result).toHaveProperty("kbps");
    expect(result).toHaveProperty("mbps");
    expect(result).toHaveProperty("gbps");
    expect(result).toHaveProperty("kBps");
    expect(result).toHaveProperty("mBps");
    expect(result).toHaveProperty("gBps");
  });

  it("bpsとMBpsの関係が正しい", () => {
    const result = calcRequiredSpeed(1_000_000, 1);
    // MBps = bps / 8,000,000
    expect(result!.mBps).toBeCloseTo(result!.bps / 8_000_000, 10);
  });

  it("不正な入力に対してnullを返す", () => {
    expect(calcRequiredSpeed(0, 60)).toBeNull();
    expect(calcRequiredSpeed(1_000_000, 0)).toBeNull();
    expect(calcRequiredSpeed(-1, 60)).toBeNull();
    expect(calcRequiredSpeed(1_000_000, -1)).toBeNull();
  });
});

describe("formatTransferTime", () => {
  it("1秒未満をミリ秒で表示する", () => {
    const result = formatTransferTime(0.5);
    expect(result).toContain("ミリ秒");
    expect(result).toContain("500.0");
  });

  it("秒を表示する", () => {
    const result = formatTransferTime(45);
    expect(result).toBe("45 秒");
  });

  it("分と秒を表示する", () => {
    const result = formatTransferTime(90); // 1分30秒
    expect(result).toContain("1 分");
    expect(result).toContain("30 秒");
  });

  it("時間・分・秒を表示する", () => {
    const result = formatTransferTime(3725); // 1時間2分5秒
    expect(result).toContain("1 時間");
    expect(result).toContain("2 分");
    expect(result).toContain("5 秒");
  });

  it("日・時間を表示する", () => {
    const result = formatTransferTime(90_000); // 1日1時間
    expect(result).toContain("1 日");
    expect(result).toContain("1 時間");
  });

  it("0秒を表示する", () => {
    const result = formatTransferTime(1);
    expect(result).toBe("1 秒");
  });

  it("Infinityに対して—を返す", () => {
    expect(formatTransferTime(Infinity)).toBe("—");
  });

  it("負の値に対して—を返す", () => {
    expect(formatTransferTime(-1)).toBe("—");
  });
});

describe("formatSpeed", () => {
  it("bpsで表示する（1000未満）", () => {
    const result = formatSpeed(500);
    expect(result).toContain("bps");
    expect(result).not.toContain("Kbps");
  });

  it("Kbpsで表示する", () => {
    const result = formatSpeed(384_000);
    expect(result).toContain("Kbps");
  });

  it("Mbpsで表示する", () => {
    const result = formatSpeed(100_000_000);
    expect(result).toContain("Mbps");
    expect(result).toContain("100.00");
  });

  it("Gbpsで表示する", () => {
    const result = formatSpeed(1_000_000_000);
    expect(result).toContain("Gbps");
    expect(result).toContain("1.00");
  });
});

describe("formatFileSize", () => {
  it("バイトで表示する", () => {
    expect(formatFileSize(500)).toContain("B");
  });

  it("KBで表示する", () => {
    const result = formatFileSize(2_048);
    expect(result).toContain("KB");
    expect(result).toContain("2.00");
  });

  it("MBで表示する", () => {
    const result = formatFileSize(1_048_576);
    expect(result).toContain("MB");
    expect(result).toContain("1.00");
  });

  it("GBで表示する", () => {
    const result = formatFileSize(1_073_741_824);
    expect(result).toContain("GB");
    expect(result).toContain("1.00");
  });

  it("TBで表示する", () => {
    const result = formatFileSize(1_099_511_627_776);
    expect(result).toContain("TB");
    expect(result).toContain("1.00");
  });
});
