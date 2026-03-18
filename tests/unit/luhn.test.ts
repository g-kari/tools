import { describe, it, expect } from 'vitest';
import {
  luhnCheck,
  detectCardType,
  formatCardNumber,
  validateCard,
  TEST_CARD_NUMBERS,
} from '../../app/utils/luhn';

describe('luhnCheck', () => {
  describe('有効なカード番号', () => {
    it('Visa 16桁を有効と判定する', () => {
      expect(luhnCheck('4532015112830366')).toBe(true);
    });

    it('Mastercard を有効と判定する', () => {
      expect(luhnCheck('5500005555555559')).toBe(true);
    });

    it('Amex を有効と判定する', () => {
      expect(luhnCheck('378282246310005')).toBe(true);
    });

    it('Discover を有効と判定する', () => {
      expect(luhnCheck('6011111111111117')).toBe(true);
    });

    it('JCB を有効と判定する', () => {
      expect(luhnCheck('3530111333300000')).toBe(true);
    });

    it('テスト番号 4111111111111111 を有効と判定する', () => {
      expect(luhnCheck('4111111111111111')).toBe(true);
    });

    it('Mastercard 2-series を有効と判定する', () => {
      expect(luhnCheck('2223000048400011')).toBe(true);
    });
  });

  describe('無効なカード番号', () => {
    it('1桁変更した番号を無効と判定する', () => {
      expect(luhnCheck('4532015112830367')).toBe(false);
    });

    it('全て同じ数字（ゼロ）はLuhnが通過する（合計0, mod10=0）', () => {
      // '0000000000000000' の Luhn sum は 0 なので有効扱い（実在カードではないが数学的に通過）
      expect(luhnCheck('0000000000000000')).toBe(true);
    });

    it('連番を無効と判定する', () => {
      expect(luhnCheck('1234567890123456')).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('空文字列に対して false を返す', () => {
      expect(luhnCheck('')).toBe(false);
    });

    it('1桁に対して false を返す', () => {
      expect(luhnCheck('5')).toBe(false);
    });

    it('チェックサムが 0 になる最短番号 (2桁) を検証する', () => {
      // "18" -> 1*2=2, 8 -> sum=10 -> valid
      expect(luhnCheck('18')).toBe(true);
    });
  });
});

describe('detectCardType', () => {
  it('Visa を検出する', () => {
    const result = detectCardType('4532015112830366');
    expect(result?.brand).toBe('visa');
    expect(result?.name).toBe('Visa');
  });

  it('Mastercard を検出する', () => {
    const result = detectCardType('5500005555555559');
    expect(result?.brand).toBe('mastercard');
  });

  it('Mastercard 2-series を検出する', () => {
    const result = detectCardType('2223000048400011');
    expect(result?.brand).toBe('mastercard');
  });

  it('Amex を検出する', () => {
    const result = detectCardType('378282246310005');
    expect(result?.brand).toBe('amex');
  });

  it('Discover を検出する', () => {
    const result = detectCardType('6011111111111117');
    expect(result?.brand).toBe('discover');
  });

  it('JCB を検出する', () => {
    const result = detectCardType('3530111333300000');
    expect(result?.brand).toBe('jcb');
  });

  it('UnionPay を検出する', () => {
    const result = detectCardType('6212345678901234');
    expect(result?.brand).toBe('unionpay');
  });

  it('不明なカードに対して null を返す', () => {
    const result = detectCardType('9999999999999999');
    expect(result).toBeNull();
  });

  it('空文字列に対して null を返す', () => {
    expect(detectCardType('')).toBeNull();
  });
});

describe('formatCardNumber', () => {
  it('16桁を 4-4-4-4 でフォーマットする', () => {
    expect(formatCardNumber('4532015112830366', [4, 4, 4, 4])).toBe(
      '4532 0151 1283 0366'
    );
  });

  it('15桁（Amex）を 4-6-5 でフォーマットする', () => {
    expect(formatCardNumber('378282246310005', [4, 6, 5])).toBe(
      '3782 822463 10005'
    );
  });

  it('部分的な番号（8桁）をフォーマットする', () => {
    expect(formatCardNumber('45320151', [4, 4, 4, 4])).toBe('4532 0151');
  });

  it('空文字列に対して空文字列を返す', () => {
    expect(formatCardNumber('', [4, 4, 4, 4])).toBe('');
  });
});

describe('validateCard', () => {
  it('有効な Visa カードの検証結果を返す', () => {
    const result = validateCard('4532015112830366');
    expect(result.isValid).toBe(true);
    expect(result.cardType?.brand).toBe('visa');
    expect(result.isValidLength).toBe(true);
    expect(result.digits).toBe('4532015112830366');
    expect(result.formatted).toBe('4532 0151 1283 0366');
  });

  it('スペース区切りの入力を正しく処理する', () => {
    const result = validateCard('4532 0151 1283 0366');
    expect(result.isValid).toBe(true);
    expect(result.digits).toBe('4532015112830366');
  });

  it('ハイフン区切りの入力を正しく処理する', () => {
    const result = validateCard('4532-0151-1283-0366');
    expect(result.isValid).toBe(true);
    expect(result.digits).toBe('4532015112830366');
  });

  it('無効な番号の検証結果を返す', () => {
    const result = validateCard('1234567890123456');
    expect(result.isValid).toBe(false);
  });

  it('空入力に対して isValid=false を返す', () => {
    const result = validateCard('');
    expect(result.isValid).toBe(false);
    expect(result.digits).toBe('');
  });

  it('チェックディジットを正しく返す', () => {
    const result = validateCard('4532015112830366');
    expect(result.checkDigit).toBe(6);
  });
});

describe('TEST_CARD_NUMBERS', () => {
  it('全テスト番号が Luhn チェックを通過する', () => {
    TEST_CARD_NUMBERS.forEach((card) => {
      expect(luhnCheck(card.number)).toBe(true);
    });
  });

  it('各テスト番号が正しいカード種別に対応する', () => {
    TEST_CARD_NUMBERS.forEach((card) => {
      const detected = detectCardType(card.number);
      expect(detected?.brand).toBe(card.brand);
    });
  });
});
