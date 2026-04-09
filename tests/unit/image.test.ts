import { describe, it, expect } from "vite-plus/test";
import {
  formatFileSize,
  clampDimension,
  calculateAspectRatioSize,
  getExtensionFromMimeType,
  getFilenameWithoutExtension,
  getExtension,
  calculateCompressionRatio,
  MAX_DIMENSION,
  MIN_DIMENSION,
} from "../../app/utils/image";

describe("formatFileSize", () => {
  it('0バイトを "0 B" として返す', () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it('1バイトを "1 B" として返す', () => {
    expect(formatFileSize(1)).toBe("1 B");
  });

  it("1023バイトをBで返す", () => {
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it('1024バイトを "1 KB" として返す', () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it('1536バイトを "1.5 KB" として返す', () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it('1048576バイトを "1 MB" として返す', () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it('1572864バイトを "1.5 MB" として返す', () => {
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
  });

  it('1073741824バイトを "1 GB" として返す', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("小数点以下2桁まで表示する", () => {
    expect(formatFileSize(1126)).toBe("1.1 KB");
  });
});

describe("clampDimension", () => {
  it("範囲内の値はそのまま返す（四捨五入）", () => {
    expect(clampDimension(500)).toBe(500);
  });

  it("最小値未満の場合は最小値を返す", () => {
    expect(clampDimension(0)).toBe(MIN_DIMENSION);
  });

  it("負の値の場合は最小値を返す", () => {
    expect(clampDimension(-100)).toBe(MIN_DIMENSION);
  });

  it("最大値超過の場合は最大値を返す", () => {
    expect(clampDimension(99999)).toBe(MAX_DIMENSION);
  });

  it("小数値を四捨五入する", () => {
    expect(clampDimension(100.6)).toBe(101);
    expect(clampDimension(100.4)).toBe(100);
  });

  it("カスタムmin/maxを使用できる", () => {
    expect(clampDimension(5, 10, 100)).toBe(10);
    expect(clampDimension(200, 10, 100)).toBe(100);
    expect(clampDimension(50, 10, 100)).toBe(50);
  });

  it("MIN_DIMENSION は 1 である", () => {
    expect(MIN_DIMENSION).toBe(1);
  });

  it("MAX_DIMENSION は 10000 である", () => {
    expect(MAX_DIMENSION).toBe(10000);
  });
});

describe("calculateAspectRatioSize", () => {
  describe("幅から高さを計算する場合", () => {
    it("幅指定時に高さをアスペクト比から計算する", () => {
      const result = calculateAspectRatioSize(800, 600, 400, null);
      expect(result).toEqual({ width: 400, height: 300 });
    });

    it("正方形画像の幅指定時に同じサイズを返す", () => {
      const result = calculateAspectRatioSize(100, 100, 50, null);
      expect(result).toEqual({ width: 50, height: 50 });
    });

    it("縦長画像の幅指定時にアスペクト比を保持する", () => {
      const result = calculateAspectRatioSize(400, 800, 200, null);
      expect(result).toEqual({ width: 200, height: 400 });
    });
  });

  describe("高さから幅を計算する場合", () => {
    it("高さ指定時に幅をアスペクト比から計算する", () => {
      const result = calculateAspectRatioSize(800, 600, null, 300);
      expect(result).toEqual({ width: 400, height: 300 });
    });

    it("正方形画像の高さ指定時に同じサイズを返す", () => {
      const result = calculateAspectRatioSize(100, 100, null, 50);
      expect(result).toEqual({ width: 50, height: 50 });
    });
  });

  describe("両方指定する場合", () => {
    it("幅と高さ両方指定時はそのまま返す", () => {
      const result = calculateAspectRatioSize(800, 600, 400, 200);
      expect(result).toEqual({ width: 400, height: 200 });
    });
  });

  describe("両方nullの場合", () => {
    it("幅と高さ両方nullの場合は元のサイズを返す", () => {
      const result = calculateAspectRatioSize(800, 600, null, null);
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });
});

describe("getExtensionFromMimeType", () => {
  it("image/png を .png に変換する", () => {
    expect(getExtensionFromMimeType("image/png")).toBe(".png");
  });

  it("image/jpeg を .jpg に変換する", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe(".jpg");
  });

  it("image/webp を .webp に変換する", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe(".webp");
  });

  it("image/gif を .gif に変換する", () => {
    expect(getExtensionFromMimeType("image/gif")).toBe(".gif");
  });

  it("image/svg+xml を .svg に変換する", () => {
    expect(getExtensionFromMimeType("image/svg+xml")).toBe(".svg");
  });

  it("image/bmp を .bmp に変換する", () => {
    expect(getExtensionFromMimeType("image/bmp")).toBe(".bmp");
  });

  it("image/tiff を .tiff に変換する", () => {
    expect(getExtensionFromMimeType("image/tiff")).toBe(".tiff");
  });

  it("未知のMIMEタイプはデフォルト .png を返す", () => {
    expect(getExtensionFromMimeType("image/unknown")).toBe(".png");
    expect(getExtensionFromMimeType("")).toBe(".png");
  });
});

describe("getFilenameWithoutExtension", () => {
  it("拡張子を除いたファイル名を返す", () => {
    expect(getFilenameWithoutExtension("image.png")).toBe("image");
  });

  it("複数ドットがある場合は最後の拡張子を除く", () => {
    expect(getFilenameWithoutExtension("my.photo.jpg")).toBe("my.photo");
  });

  it("長い拡張子を除く", () => {
    expect(getFilenameWithoutExtension("archive.tar.gz")).toBe("archive.tar");
  });

  it("拡張子なしのファイル名はそのまま返す", () => {
    expect(getFilenameWithoutExtension("filename")).toBe("filename");
  });

  it("日本語ファイル名も正しく処理する", () => {
    expect(getFilenameWithoutExtension("画像ファイル.jpg")).toBe("画像ファイル");
  });
});

describe("getExtension", () => {
  it("ファイル名から拡張子を取得する", () => {
    expect(getExtension("image.png")).toBe(".png");
  });

  it("複数ドットがある場合は最後の拡張子を返す", () => {
    expect(getExtension("my.photo.jpg")).toBe(".jpg");
  });

  it("拡張子なしの場合はデフォルト .png を返す", () => {
    expect(getExtension("filename")).toBe(".png");
  });

  it("大文字拡張子もそのまま返す", () => {
    expect(getExtension("IMAGE.PNG")).toBe(".PNG");
  });

  it("日本語ファイル名の拡張子も取得できる", () => {
    expect(getExtension("画像.webp")).toBe(".webp");
  });
});

describe("calculateCompressionRatio", () => {
  it("50%圧縮の場合 50 を返す", () => {
    expect(calculateCompressionRatio(1000, 500)).toBe(50);
  });

  it("圧縮なしの場合 0 を返す", () => {
    expect(calculateCompressionRatio(1000, 1000)).toBe(0);
  });

  it("完全圧縮の場合 100 を返す", () => {
    expect(calculateCompressionRatio(1000, 0)).toBe(100);
  });

  it("元サイズが0の場合 0 を返す", () => {
    expect(calculateCompressionRatio(0, 0)).toBe(0);
  });

  it("圧縮後が大きい場合（負の圧縮率）を正しく計算する", () => {
    expect(calculateCompressionRatio(100, 150)).toBe(-50);
  });

  it("小数点以下を四捨五入する", () => {
    expect(calculateCompressionRatio(1000, 333)).toBe(67);
  });
});
