import { describe, it, expect } from "vite-plus/test";
import {
  parseExif,
  stripExif,
  groupEntriesByCategory,
  isJpegFile,
  findApp1Segment,
} from "../../app/utils/exif";

/**
 * 最小限の JPEG バイナリを生成するヘルパー
 * SOI + APP0 + EOI のみ（EXIF なし）
 */
function createMinimalJpeg(): ArrayBuffer {
  const bytes = new Uint8Array([
    0xff,
    0xd8, // SOI
    0xff,
    0xe0, // APP0
    0x00,
    0x10, // APP0 長さ (16)
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00, // "JFIF\0"
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00, // JFIF データ
    0xff,
    0xd9, // EOI
  ]);
  return bytes.buffer;
}

/**
 * 指定タグを含む最小限の EXIF APP1 セグメントを生成するヘルパー
 * @param tags - { tagId, type, value } の配列
 */
function createJpegWithExif(
  makeStr: string = "TestMake",
  modelStr: string = "TestModel",
): ArrayBuffer {
  // EXIF データを手動で構築（リトルエンディアン）
  const makeBytes = [...makeStr].map((c) => c.charCodeAt(0)).concat([0]); // null 終端
  const modelBytes = [...modelStr].map((c) => c.charCodeAt(0)).concat([0]);

  // TIFF ヘッダー (8 バイト)
  // "II" + 0x002A + IFD0 オフセット (8)
  const tiffHeader = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00];

  // IFD0 エントリ数: 2 (Make + Model)
  // 各エントリ: 12 バイト
  // IFD0 開始: offset 8 (TIFF ベースから)
  // IFD0 = 2バイト(count) + 2*12バイト(entries) + 4バイト(next IFD = 0)
  const ifdSize = 2 + 2 * 12 + 4;
  const dataOffset = 8 + ifdSize; // TIFF ベースから

  // Make (0x010F): ASCII, count = makeBytes.length, オフセット = dataOffset
  // Model (0x0110): ASCII, count = modelBytes.length, オフセット = dataOffset + makeBytes.length
  const makeCount = makeBytes.length;
  const modelOffset = dataOffset + makeCount;
  const modelCount = modelBytes.length;

  function uint16LE(v: number): number[] {
    return [v & 0xff, (v >> 8) & 0xff];
  }
  function uint32LE(v: number): number[] {
    return [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff];
  }

  const makeEntry = [
    ...uint16LE(0x010f), // Tag: Make
    ...uint16LE(2), // Type: ASCII
    ...uint32LE(makeCount), // Count
    ...uint32LE(dataOffset), // Value/Offset
  ];

  const modelEntry = [
    ...uint16LE(0x0110), // Tag: Model
    ...uint16LE(2), // Type: ASCII
    ...uint32LE(modelCount), // Count
    ...uint32LE(modelOffset), // Value/Offset
  ];

  const ifd0 = [
    ...uint16LE(2), // エントリ数
    ...makeEntry,
    ...modelEntry,
    0x00,
    0x00,
    0x00,
    0x00, // 次の IFD (なし)
  ];

  const tiffData = [...tiffHeader, ...ifd0, ...makeBytes, ...modelBytes];

  // APP1 セグメント: FF E1 + 長さ(2) + "Exif\0\0" + TIFF データ
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  const app1Data = [...exifHeader, ...tiffData];
  const app1Length = app1Data.length + 2; // 長さフィールド自体を含む

  const jpeg = new Uint8Array([
    0xff,
    0xd8, // SOI
    0xff,
    0xe1, // APP1
    (app1Length >> 8) & 0xff,
    app1Length & 0xff, // 長さ
    ...app1Data,
    0xff,
    0xda, // SOS (以降はデータとみなす)
    0x00, // ダミーデータ
  ]);

  return jpeg.buffer;
}

describe("isJpegFile", () => {
  it("JPEG MIMEタイプのファイルを正しく識別する", () => {
    const file = new File([""], "test.jpg", { type: "image/jpeg" });
    expect(isJpegFile(file)).toBe(true);
  });

  it(".jpg 拡張子のファイルを正しく識別する", () => {
    const file = new File([""], "test.jpg", { type: "" });
    expect(isJpegFile(file)).toBe(true);
  });

  it(".jpeg 拡張子のファイルを正しく識別する", () => {
    const file = new File([""], "test.jpeg", { type: "" });
    expect(isJpegFile(file)).toBe(true);
  });

  it("PNG ファイルは JPEG として識別しない", () => {
    const file = new File([""], "test.png", { type: "image/png" });
    expect(isJpegFile(file)).toBe(false);
  });

  it("WebP ファイルは JPEG として識別しない", () => {
    const file = new File([""], "test.webp", { type: "image/webp" });
    expect(isJpegFile(file)).toBe(false);
  });
});

describe("parseExif", () => {
  it("空のバッファでは EXIF なしを返す", () => {
    const buffer = new ArrayBuffer(0);
    const result = parseExif(buffer);
    expect(result.hasExif).toBe(false);
    expect(result.entries).toHaveLength(0);
  });

  it("JPEG ヘッダーがないバッファでは EXIF なしを返す", () => {
    const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
    const result = parseExif(buffer);
    expect(result.hasExif).toBe(false);
  });

  it("EXIF なしの JPEG では hasExif が false になる", () => {
    const buffer = createMinimalJpeg();
    const result = parseExif(buffer);
    expect(result.hasExif).toBe(false);
    expect(result.entries).toHaveLength(0);
  });

  it("EXIF ありの JPEG では hasExif が true になる", () => {
    const buffer = createJpegWithExif();
    const result = parseExif(buffer);
    expect(result.hasExif).toBe(true);
    expect(result.entries.length).toBeGreaterThan(0);
  });

  it("Make タグが正しく解析される", () => {
    const buffer = createJpegWithExif("CanonTest", "EOS R5");
    const result = parseExif(buffer);
    const makeEntry = result.entries.find((e) => e.tag === "メーカー");
    expect(makeEntry).toBeDefined();
    expect(makeEntry?.value).toBe("CanonTest");
  });

  it("Model タグが正しく解析される", () => {
    const buffer = createJpegWithExif("Canon", "EOS R5 Test");
    const result = parseExif(buffer);
    const modelEntry = result.entries.find((e) => e.tag === "モデル");
    expect(modelEntry).toBeDefined();
    expect(modelEntry?.value).toBe("EOS R5 Test");
  });

  it("GPS 座標がない場合は null を返す", () => {
    const buffer = createJpegWithExif();
    const result = parseExif(buffer);
    expect(result.gps.latitude).toBeNull();
    expect(result.gps.longitude).toBeNull();
    expect(result.gps.mapsUrl).toBeNull();
  });
});

describe("stripExif", () => {
  it("JPEG でないバッファは null を返す", () => {
    const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]).buffer;
    const result = stripExif(buffer);
    expect(result).toBeNull();
  });

  it("EXIF なしの JPEG はそのまま返される", () => {
    const buffer = createMinimalJpeg();
    const result = stripExif(buffer);
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(Blob);
  });

  it("EXIF ありの JPEG から EXIF が除去される", async () => {
    const originalBuffer = createJpegWithExif();
    const originalResult = parseExif(originalBuffer);
    expect(originalResult.hasExif).toBe(true);

    const stripped = stripExif(originalBuffer);
    expect(stripped).not.toBeNull();

    const strippedBuffer = await stripped!.arrayBuffer();
    const strippedResult = parseExif(strippedBuffer);
    expect(strippedResult.hasExif).toBe(false);
  });

  it("除去後の画像は有効な JPEG ヘッダーを持つ", async () => {
    const buffer = createJpegWithExif();
    const stripped = stripExif(buffer);
    expect(stripped).not.toBeNull();

    const strippedBuffer = await stripped!.arrayBuffer();
    const view = new DataView(strippedBuffer);
    expect(view.getUint16(0)).toBe(0xffd8); // JPEG SOI
  });

  it("除去後の Blob は image/jpeg タイプを持つ", () => {
    const buffer = createJpegWithExif();
    const stripped = stripExif(buffer);
    expect(stripped?.type).toBe("image/jpeg");
  });
});

describe("groupEntriesByCategory", () => {
  it("空配列は全カテゴリが空になる", () => {
    const grouped = groupEntriesByCategory([]);
    expect(grouped.camera).toHaveLength(0);
    expect(grouped.datetime).toHaveLength(0);
    expect(grouped.gps).toHaveLength(0);
    expect(grouped.basic).toHaveLength(0);
    expect(grouped.other).toHaveLength(0);
  });

  it("カテゴリに応じて正しくグループ化される", () => {
    const entries = [
      { tag: "メーカー", tagId: 0x010f, value: "Canon", category: "camera" as const },
      {
        tag: "撮影日時",
        tagId: 0x9003,
        value: "2024:01:01 12:00:00",
        category: "datetime" as const,
      },
      { tag: "緯度", tagId: 0x0002, value: "35.6", category: "gps" as const },
      { tag: "向き", tagId: 0x0112, value: "正常", category: "basic" as const },
      { tag: "ISO感度", tagId: 0x8827, value: "400", category: "other" as const },
    ];

    const grouped = groupEntriesByCategory(entries);
    expect(grouped.camera).toHaveLength(1);
    expect(grouped.camera[0]?.tag).toBe("メーカー");
    expect(grouped.datetime).toHaveLength(1);
    expect(grouped.datetime[0]?.tag).toBe("撮影日時");
    expect(grouped.gps).toHaveLength(1);
    expect(grouped.gps[0]?.tag).toBe("緯度");
    expect(grouped.basic).toHaveLength(1);
    expect(grouped.basic[0]?.tag).toBe("向き");
    expect(grouped.other).toHaveLength(1);
    expect(grouped.other[0]?.tag).toBe("ISO感度");
  });
});

describe("findApp1Segment", () => {
  it("EXIF なしの JPEG は null を返す", () => {
    const buffer = createMinimalJpeg();
    const result = findApp1Segment(buffer);
    expect(result).toBeNull();
  });

  it("EXIF ありの JPEG は APP1 セグメント情報を返す", () => {
    const buffer = createJpegWithExif();
    const result = findApp1Segment(buffer);
    expect(result).not.toBeNull();
    expect(result?.offset).toBeGreaterThan(0);
    expect(result?.length).toBeGreaterThan(0);
  });

  it("JPEG でないバッファは null を返す", () => {
    const buffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;
    const result = findApp1Segment(buffer);
    expect(result).toBeNull();
  });
});
