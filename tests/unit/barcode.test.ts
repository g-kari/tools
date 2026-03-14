import { describe, it, expect } from 'vitest';
import {
  validateBarcodeInput,
  getFormatLabel,
  getFormatPlaceholder,
  getFormatDescription,
  BARCODE_FORMATS,
} from '~/utils/barcode';

describe('validateBarcodeInput', () => {
  describe('CODE128', () => {
    it('空文字はfalseを返す', () => {
      expect(validateBarcodeInput('', 'CODE128')).toBe(false);
    });

    it('通常テキストはtrueを返す', () => {
      expect(validateBarcodeInput('Hello World', 'CODE128')).toBe(true);
    });

    it('ASCII印字可能文字はtrueを返す', () => {
      expect(validateBarcodeInput('ABC123!@#', 'CODE128')).toBe(true);
    });

    it('80文字以内はtrueを返す', () => {
      expect(validateBarcodeInput('A'.repeat(80), 'CODE128')).toBe(true);
    });

    it('81文字以上はfalseを返す', () => {
      expect(validateBarcodeInput('A'.repeat(81), 'CODE128')).toBe(false);
    });

    it('100文字はfalseを返す', () => {
      expect(validateBarcodeInput('A'.repeat(100), 'CODE128')).toBe(false);
    });
  });

  describe('EAN13', () => {
    it('12桁数字はtrueを返す', () => {
      expect(validateBarcodeInput('490123456789', 'EAN13')).toBe(true);
    });

    it('正しいチェックディジットを持つ13桁数字はtrueを返す', () => {
      // 4901234567894 のチェックディジット計算:
      // 4*1 + 9*3 + 0*1 + 1*3 + 2*1 + 3*3 + 4*1 + 5*3 + 6*1 + 7*3 + 8*1 + 9*3
      // = 4 + 27 + 0 + 3 + 2 + 9 + 4 + 15 + 6 + 21 + 8 + 27 = 126
      // (10 - (126 % 10)) % 10 = (10 - 6) % 10 = 4
      expect(validateBarcodeInput('4901234567894', 'EAN13')).toBe(true);
    });

    it('誤ったチェックディジットを持つ13桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('4901234567890', 'EAN13')).toBe(false);
    });

    it('非数字はfalseを返す', () => {
      expect(validateBarcodeInput('490123456789A', 'EAN13')).toBe(false);
    });

    it('11桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('49012345678', 'EAN13')).toBe(false);
    });

    it('14桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('49012345678901', 'EAN13')).toBe(false);
    });
  });

  describe('EAN8', () => {
    it('7桁数字はtrueを返す', () => {
      expect(validateBarcodeInput('9638507', 'EAN8')).toBe(true);
    });

    it('正しいチェックディジットを持つ8桁数字はtrueを返す', () => {
      // 96385074 の検証:
      // 9*3 + 6*1 + 3*3 + 8*1 + 5*3 + 0*1 + 7*3
      // = 27 + 6 + 9 + 8 + 15 + 0 + 21 = 86
      // (10 - (86 % 10)) % 10 = (10 - 6) % 10 = 4
      expect(validateBarcodeInput('96385074', 'EAN8')).toBe(true);
    });

    it('誤ったチェックディジットを持つ8桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('96385070', 'EAN8')).toBe(false);
    });

    it('9桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('963850741', 'EAN8')).toBe(false);
    });

    it('非数字はfalseを返す', () => {
      expect(validateBarcodeInput('9638507A', 'EAN8')).toBe(false);
    });

    it('6桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('963850', 'EAN8')).toBe(false);
    });
  });

  describe('UPC', () => {
    it('11桁数字はtrueを返す', () => {
      expect(validateBarcodeInput('01234567890', 'UPC')).toBe(true);
    });

    it('正しいチェックディジットを持つ12桁数字はtrueを返す', () => {
      // 012345678905 の検証:
      // 0*3 + 1*1 + 2*3 + 3*1 + 4*3 + 5*1 + 6*3 + 7*1 + 8*3 + 9*1 + 0*3
      // = 0 + 1 + 6 + 3 + 12 + 5 + 18 + 7 + 24 + 9 + 0 = 85
      // (10 - (85 % 10)) % 10 = (10 - 5) % 10 = 5
      expect(validateBarcodeInput('012345678905', 'UPC')).toBe(true);
    });

    it('誤ったチェックディジットを持つ12桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('012345678900', 'UPC')).toBe(false);
    });

    it('非数字はfalseを返す', () => {
      expect(validateBarcodeInput('01234567890A', 'UPC')).toBe(false);
    });

    it('10桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('0123456789', 'UPC')).toBe(false);
    });

    it('13桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('0123456789000', 'UPC')).toBe(false);
    });
  });

  describe('CODE39', () => {
    it('大文字英数字はtrueを返す', () => {
      expect(validateBarcodeInput('HELLO123', 'CODE39')).toBe(true);
    });

    it('大文字英数字とハイフンはtrueを返す', () => {
      expect(validateBarcodeInput('HELLO-WORLD', 'CODE39')).toBe(true);
    });

    it('大文字英数字とスペースはtrueを返す', () => {
      expect(validateBarcodeInput('HELLO WORLD', 'CODE39')).toBe(true);
    });

    it('許可された記号($ / + %)はtrueを返す', () => {
      expect(validateBarcodeInput('AB$CD/EF+GH%', 'CODE39')).toBe(true);
    });

    it('小文字はfalseを返す', () => {
      expect(validateBarcodeInput('hello', 'CODE39')).toBe(false);
    });

    it('小文字混じりはfalseを返す', () => {
      expect(validateBarcodeInput('Hello', 'CODE39')).toBe(false);
    });
  });

  describe('ITF14', () => {
    it('14桁数字はtrueを返す', () => {
      expect(validateBarcodeInput('00012345678905', 'ITF14')).toBe(true);
    });

    it('13桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('0001234567890', 'ITF14')).toBe(false);
    });

    it('15桁数字はfalseを返す', () => {
      expect(validateBarcodeInput('000123456789050', 'ITF14')).toBe(false);
    });

    it('非数字はfalseを返す', () => {
      expect(validateBarcodeInput('0001234567890A', 'ITF14')).toBe(false);
    });
  });

  describe('MSI', () => {
    it('数字のみはtrueを返す', () => {
      expect(validateBarcodeInput('1234567', 'MSI')).toBe(true);
    });

    it('1桁の数字はtrueを返す', () => {
      expect(validateBarcodeInput('0', 'MSI')).toBe(true);
    });

    it('長い数字列はtrueを返す', () => {
      expect(validateBarcodeInput('1234567890123456', 'MSI')).toBe(true);
    });

    it('非数字はfalseを返す', () => {
      expect(validateBarcodeInput('123A456', 'MSI')).toBe(false);
    });

    it('英字のみはfalseを返す', () => {
      expect(validateBarcodeInput('ABC', 'MSI')).toBe(false);
    });
  });

  describe('codabar', () => {
    it('数字とA-Dの組み合わせはtrueを返す', () => {
      expect(validateBarcodeInput('A1234A', 'codabar')).toBe(true);
    });

    it('数字のみはtrueを返す', () => {
      expect(validateBarcodeInput('1234567', 'codabar')).toBe(true);
    });

    it('大文字A-Dはtrueを返す', () => {
      expect(validateBarcodeInput('ABCD', 'codabar')).toBe(true);
    });

    it('小文字a-dはtrueを返す', () => {
      // 実装では /^[A-Da-d0-9+\-:/.]+$/ なので小文字a-dも有効
      expect(validateBarcodeInput('abcd', 'codabar')).toBe(true);
    });

    it('許可された記号(+ - : / .)はtrueを返す', () => {
      expect(validateBarcodeInput('12+34-56:78/90.', 'codabar')).toBe(true);
    });

    it('無効文字(E以降の大文字)はfalseを返す', () => {
      expect(validateBarcodeInput('E1234', 'codabar')).toBe(false);
    });

    it('無効文字(@)はfalseを返す', () => {
      expect(validateBarcodeInput('@1234', 'codabar')).toBe(false);
    });

    it('空文字はfalseを返す', () => {
      expect(validateBarcodeInput('', 'codabar')).toBe(false);
    });
  });
});

describe('getFormatLabel', () => {
  it('CODE128の日本語ラベルを返す', () => {
    expect(getFormatLabel('CODE128')).toBe('CODE 128');
  });

  it('EAN13の日本語ラベルを返す', () => {
    expect(getFormatLabel('EAN13')).toBe('EAN-13');
  });

  it('EAN8の日本語ラベルを返す', () => {
    expect(getFormatLabel('EAN8')).toBe('EAN-8');
  });

  it('UPCの日本語ラベルを返す', () => {
    expect(getFormatLabel('UPC')).toBe('UPC-A');
  });

  it('CODE39の日本語ラベルを返す', () => {
    expect(getFormatLabel('CODE39')).toBe('CODE 39');
  });

  it('ITF14の日本語ラベルを返す', () => {
    expect(getFormatLabel('ITF14')).toBe('ITF-14');
  });

  it('MSIの日本語ラベルを返す', () => {
    expect(getFormatLabel('MSI')).toBe('MSI Plessey');
  });

  it('codabarの日本語ラベルを返す', () => {
    expect(getFormatLabel('codabar')).toBe('Codabar');
  });

  it('全フォーマットでラベルが空でない', () => {
    for (const fmt of BARCODE_FORMATS) {
      const label = getFormatLabel(fmt);
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('getFormatPlaceholder', () => {
  it('全フォーマットでプレースホルダーが空でない', () => {
    for (const fmt of BARCODE_FORMATS) {
      const placeholder = getFormatPlaceholder(fmt);
      expect(placeholder).toBeTruthy();
      expect(placeholder.length).toBeGreaterThan(0);
    }
  });

  it('CODE128のプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('CODE128');
    expect(placeholder).toBe('Hello World');
  });

  it('EAN13のプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('EAN13');
    expect(placeholder).toBe('4901234567894');
  });

  it('EAN8のプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('EAN8');
    expect(placeholder).toBe('96385074');
  });

  it('UPCのプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('UPC');
    expect(placeholder).toBe('012345678905');
  });

  it('CODE39のプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('CODE39');
    expect(placeholder).toBe('HELLO-WORLD');
  });

  it('ITF14のプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('ITF14');
    expect(placeholder).toBe('00012345678905');
  });

  it('MSIのプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('MSI');
    expect(placeholder).toBe('1234567');
  });

  it('codabarのプレースホルダーが返される', () => {
    const placeholder = getFormatPlaceholder('codabar');
    expect(placeholder).toBe('A1234A');
  });

  it('全フォーマットのプレースホルダーが有効な入力値である', () => {
    for (const fmt of BARCODE_FORMATS) {
      const placeholder = getFormatPlaceholder(fmt);
      expect(validateBarcodeInput(placeholder, fmt)).toBe(true);
    }
  });
});

describe('getFormatDescription', () => {
  it('全フォーマットで説明が空でない', () => {
    for (const fmt of BARCODE_FORMATS) {
      const description = getFormatDescription(fmt);
      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    }
  });

  it('CODE128の説明が返される', () => {
    const description = getFormatDescription('CODE128');
    expect(description).toContain('ASCII');
  });

  it('EAN13の説明が返される', () => {
    const description = getFormatDescription('EAN13');
    expect(description).toContain('13');
  });

  it('EAN8の説明が返される', () => {
    const description = getFormatDescription('EAN8');
    expect(description).toContain('8');
  });

  it('UPCの説明が返される', () => {
    const description = getFormatDescription('UPC');
    expect(description).toContain('UPC');
  });

  it('CODE39の説明が返される', () => {
    const description = getFormatDescription('CODE39');
    expect(description).toContain('大文字');
  });

  it('ITF14の説明が返される', () => {
    const description = getFormatDescription('ITF14');
    expect(description).toContain('14');
  });

  it('MSIの説明が返される', () => {
    const description = getFormatDescription('MSI');
    expect(description).toContain('数字');
  });

  it('codabarの説明が返される', () => {
    const description = getFormatDescription('codabar');
    expect(description).toBeTruthy();
  });
});
