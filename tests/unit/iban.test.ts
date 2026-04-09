import { describe, it, expect } from 'vite-plus/test';
import {
  validateIban,
  formatIban,
  TEST_IBAN_NUMBERS,
  IBAN_COUNTRIES,
} from '../../app/utils/iban';

describe('formatIban', () => {
  it('22桁のIBANを4文字ごとにスペース区切りでフォーマットする', () => {
    expect(formatIban('DE89370400440532013000')).toBe(
      'DE89 3704 0044 0532 0130 00'
    );
  });

  it('16桁のIBANをフォーマットする', () => {
    expect(formatIban('BE68539007547034')).toBe('BE68 5390 0754 7034');
  });

  it('空文字列はそのまま返す', () => {
    expect(formatIban('')).toBe('');
  });

  it('4文字ちょうどはそのまま返す', () => {
    expect(formatIban('DE89')).toBe('DE89');
  });
});

describe('validateIban', () => {
  describe('有効なIBAN', () => {
    it('ドイツのIBANを有効と判定する', () => {
      const result = validateIban('DE89370400440532013000');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
      expect(result.countryCode).toBe('DE');
      expect(result.country?.name).toBe('ドイツ');
    });

    it('イギリスのIBANを有効と判定する', () => {
      const result = validateIban('GB29NWBK60161331926819');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
      expect(result.countryCode).toBe('GB');
      expect(result.country?.name).toBe('イギリス');
    });

    it('フランスのIBANを有効と判定する', () => {
      const result = validateIban('FR7630006000011234567890189');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
      expect(result.countryCode).toBe('FR');
    });

    it('スペインのIBANを有効と判定する', () => {
      const result = validateIban('ES9121000418450200051332');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
    });

    it('オランダのIBANを有効と判定する', () => {
      const result = validateIban('NL91ABNA0417164300');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
    });

    it('スイスのIBANを有効と判定する', () => {
      const result = validateIban('CH9300762011623852957');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
    });

    it('ベルギーのIBANを有効と判定する', () => {
      const result = validateIban('BE68539007547034');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
    });

    it('イタリアのIBANを有効と判定する', () => {
      const result = validateIban('IT60X0542811101000000123456');
      expect(result.isValid).toBe(true);
      expect(result.isValidLength).toBe(true);
    });
  });

  describe('スペース・ハイフン付きの入力', () => {
    it('スペース区切りのドイツIBANを有効と判定する', () => {
      const result = validateIban('DE89 3704 0044 0532 0130 00');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('DE89370400440532013000');
    });

    it('ハイフン区切りのIBANを有効と判定する', () => {
      const result = validateIban('BE68-5390-0754-7034');
      expect(result.isValid).toBe(true);
    });

    it('小文字の入力を大文字に変換して検証する', () => {
      const result = validateIban('de89370400440532013000');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('DE89370400440532013000');
    });
  });

  describe('無効なIBAN', () => {
    it('1桁変更したIBANを無効と判定する', () => {
      const result = validateIban('DE89370400440532013001');
      expect(result.isValid).toBe(false);
    });

    it('チェックディジットを変更したIBANを無効と判定する', () => {
      const result = validateIban('DE90370400440532013000');
      expect(result.isValid).toBe(false);
    });

    it('文字数不足の場合はエラーを返す', () => {
      const result = validateIban('DE89');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });

    it('空文字列の場合はエラーを返す', () => {
      const result = validateIban('');
      expect(result.isValid).toBe(false);
    });

    it('英数字以外の文字が含まれる場合はエラーを返す', () => {
      const result = validateIban('DE89!37040044');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });
  });

  describe('詳細情報の検証', () => {
    it('正しいチェックディジットを返す', () => {
      const result = validateIban('DE89370400440532013000');
      expect(result.checkDigits).toBe('89');
    });

    it('正しいBBANを返す', () => {
      const result = validateIban('DE89370400440532013000');
      expect(result.bban).toBe('370400440532013000');
    });

    it('フォーマット済みIBANを返す', () => {
      const result = validateIban('DE89370400440532013000');
      expect(result.formatted).toBe('DE89 3704 0044 0532 0130 00');
    });

    it('未登録の国コードの場合はcountryがnullになる', () => {
      // ZZ は未登録の国コード
      const result = validateIban('ZZ00123456789012345678');
      expect(result.country).toBeNull();
      expect(result.countryCode).toBe('ZZ');
    });
  });

  describe('テスト番号の検証', () => {
    it('TEST_IBAN_NUMBERSのすべてのIBANが有効と判定される', () => {
      for (const item of TEST_IBAN_NUMBERS) {
        const result = validateIban(item.iban);
        expect(result.isValid).toBe(true);
        expect(result.isValidLength).toBe(true);
      }
    });
  });
});

describe('IBAN_COUNTRIES', () => {
  it('ドイツ（DE）が含まれている', () => {
    const de = IBAN_COUNTRIES.find((c) => c.code === 'DE');
    expect(de).toBeDefined();
    expect(de?.length).toBe(22);
    expect(de?.name).toBe('ドイツ');
  });

  it('イギリス（GB）が含まれている', () => {
    const gb = IBAN_COUNTRIES.find((c) => c.code === 'GB');
    expect(gb).toBeDefined();
    expect(gb?.length).toBe(22);
  });

  it('ベルギー（BE）が含まれている', () => {
    const be = IBAN_COUNTRIES.find((c) => c.code === 'BE');
    expect(be).toBeDefined();
    expect(be?.length).toBe(16);
  });

  it('少なくとも30カ国以上登録されている', () => {
    expect(IBAN_COUNTRIES.length).toBeGreaterThanOrEqual(30);
  });
});
