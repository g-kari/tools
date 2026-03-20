import { describe, it, expect } from 'vitest';
import {
  calcIsbn10Check,
  calcIsbn13Check,
  validateIsbn10,
  validateIsbn13,
  isbn10ToIsbn13,
  isbn13ToIsbn10,
  formatIsbnWithHyphens,
  extractIsbnDigits,
  validateIsbn,
} from '../../app/utils/isbn';

describe('calcIsbn10Check', () => {
  it('097522980 → X', () => {
    // The Pragmatic Programmer: 097522980X
    expect(calcIsbn10Check('097522980')).toBe('X');
  });

  it('487311903 → 0', () => {
    expect(calcIsbn10Check('487311903')).toBe('0');
  });

  it('桁数不足はemptyを返す', () => {
    expect(calcIsbn10Check('12345678')).toBe('');
  });

  it('数字以外はemptyを返す', () => {
    expect(calcIsbn10Check('12345678X')).toBe('');
  });
});

describe('calcIsbn13Check', () => {
  it('978030640615 → 7', () => {
    expect(calcIsbn13Check('978030640615')).toBe('7');
  });

  it('978487311903 → 8', () => {
    expect(calcIsbn13Check('978487311903')).toBe('8');
  });

  it('桁数不足はemptyを返す', () => {
    expect(calcIsbn13Check('97803064061')).toBe('');
  });
});

describe('validateIsbn10', () => {
  it('有効なISBN-10: 097522980X', () => {
    expect(validateIsbn10('097522980X')).toBe(true);
  });

  it('有効なISBN-10: 4873119030', () => {
    expect(validateIsbn10('4873119030')).toBe(true);
  });

  it('有効なISBN-10: 0306406152', () => {
    expect(validateIsbn10('0306406152')).toBe(true);
  });

  it('無効なISBN-10（チェックデジット誤り）', () => {
    // 正しいチェックデジットは X なので 0 は無効
    expect(validateIsbn10('1234567890')).toBe(false);
  });

  it('桁数不足は無効', () => {
    expect(validateIsbn10('030640615')).toBe(false);
  });

  it('X が末尾以外は無効', () => {
    expect(validateIsbn10('030X406150')).toBe(false);
  });
});

describe('validateIsbn13', () => {
  it('有効なISBN-13: 9784873119038', () => {
    expect(validateIsbn13('9784873119038')).toBe(true);
  });

  it('有効なISBN-13: 9780306406157', () => {
    expect(validateIsbn13('9780306406157')).toBe(true);
  });

  it('無効なISBN-13（チェックデジット誤り）', () => {
    expect(validateIsbn13('9784873119039')).toBe(false);
  });

  it('桁数不足は無効', () => {
    expect(validateIsbn13('978487311903')).toBe(false);
  });

  it('数字以外を含む場合は無効', () => {
    expect(validateIsbn13('978487311903X')).toBe(false);
  });
});

describe('isbn10ToIsbn13', () => {
  it('4873119030 → 9784873119038', () => {
    expect(isbn10ToIsbn13('4873119030')).toBe('9784873119038');
  });

  it('097522980X → 9780975229804', () => {
    expect(isbn10ToIsbn13('097522980X')).toBe('9780975229804');
  });

  it('0306406152 → 9780306406157', () => {
    expect(isbn10ToIsbn13('0306406152')).toBe('9780306406157');
  });

  it('無効なISBN-10はnullを返す', () => {
    // 正しいチェックデジットは X なので 0 は無効
    expect(isbn10ToIsbn13('1234567890')).toBeNull();
  });
});

describe('isbn13ToIsbn10', () => {
  it('9784873119038 → 4873119030', () => {
    expect(isbn13ToIsbn10('9784873119038')).toBe('4873119030');
  });

  it('9780306406157 → 0306406152', () => {
    expect(isbn13ToIsbn10('9780306406157')).toBe('0306406152');
  });

  it('9780975229804 → 097522980X', () => {
    expect(isbn13ToIsbn10('9780975229804')).toBe('097522980X');
  });

  it('979プレフィックスはnullを返す', () => {
    expect(isbn13ToIsbn10('9791032309056')).toBeNull();
  });

  it('無効なISBN-13はnullを返す', () => {
    expect(isbn13ToIsbn10('9784873119039')).toBeNull();
  });
});

describe('formatIsbnWithHyphens', () => {
  it('ISBN-10のフォーマット', () => {
    expect(formatIsbnWithHyphens('4873119030')).toBe('4-873119-03-0');
  });

  it('ISBN-10（X終端）のフォーマット', () => {
    expect(formatIsbnWithHyphens('030640615X')).toBe('0-306406-15-X');
  });

  it('ISBN-13のフォーマット', () => {
    expect(formatIsbnWithHyphens('9784873119038')).toBe('978-4-873119-03-8');
  });
});

describe('extractIsbnDigits', () => {
  it('ハイフンを除去する', () => {
    expect(extractIsbnDigits('978-4-87311-903-8')).toBe('9784873119038');
  });

  it('スペースを除去する', () => {
    expect(extractIsbnDigits('978 4 87311 903 8')).toBe('9784873119038');
  });

  it('小文字xを大文字Xに変換する', () => {
    expect(extractIsbnDigits('030640615x')).toBe('030640615X');
  });

  it('既に正規化済みの文字列はそのまま', () => {
    expect(extractIsbnDigits('030640615X')).toBe('030640615X');
  });
});

describe('validateIsbn（総合）', () => {
  it('有効なISBN-13', () => {
    const result = validateIsbn('9784873119038');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-13');
    expect(result.isbn13).toBe('9784873119038');
    expect(result.isbn10).toBe('4873119030');
    expect(result.error).toBeNull();
  });

  it('有効なISBN-10', () => {
    const result = validateIsbn('4873119030');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-10');
    expect(result.isbn10).toBe('4873119030');
    expect(result.isbn13).toBe('9784873119038');
    expect(result.error).toBeNull();
  });

  it('ハイフン付き入力も正しく検証', () => {
    const result = validateIsbn('978-4-87311-903-8');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-13');
  });

  it('無効なISBN-13（チェックデジット誤り）', () => {
    const result = validateIsbn('9784873119039');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('桁数不正（11桁）', () => {
    const result = validateIsbn('12345678901');
    expect(result.isValid).toBe(false);
    expect(result.isValidLength).toBe(false);
    expect(result.error).toContain('桁数が不正');
  });

  it('空入力', () => {
    const result = validateIsbn('');
    expect(result.isValid).toBe(false);
    expect(result.type).toBeNull();
  });

  it('979プレフィックスのISBN-13（ISBN-10変換不可）', () => {
    // 9791032309056: チェックデジット計算
    // 979103230905: sum = 9*1+7*3+9*1+1*3+0*1+3*3+2*1+3*3+0*1+9*3+0*1+5*3
    //             = 9+21+9+3+0+9+2+9+0+27+0+15 = 104, check = (10-4)%10 = 6 → 有効なISBN-13
    const result = validateIsbn('9791032309056');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-13');
    expect(result.isbn10).toBeNull();
  });

  it('サンプルISBN（097522980X）が有効', () => {
    const result = validateIsbn('097522980X');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-10');
    expect(result.isbn13).toBe('9780975229804');
  });
});
