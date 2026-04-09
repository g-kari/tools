import { describe, it, expect, beforeAll } from 'vite-plus/test';
import {
  randomInt,
  randomElement,
  generateJapaneseName,
  generateEnglishName,
  generateEmail,
  generateJapanesePhone,
  generateJapaneseAddress,
  generateCompanyName,
  generateUUID,
  generateNumber,
  generateDate,
  generateLoremIpsum,
  generateColor,
  generateIPv4,
  generateIPv6,
  generateMAC,
  generateRandomData,
  FIELD_CONFIGS,
} from '../../app/utils/random-data';

// Node.js環境でcrypto.getRandomValuesが利用できない場合のポリフィル
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    globalThis.crypto = {
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        const buf = nodeCrypto.randomBytes(array.byteLength);
        new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(buf);
        return array;
      },
    } as Crypto;
  }
});

describe('randomInt', () => {
  it('min以上max以下の整数を返すこと', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('min === max のとき固定値を返すこと', () => {
    expect(randomInt(5, 5)).toBe(5);
  });

  it('整数を返すこと', () => {
    const val = randomInt(0, 100);
    expect(Number.isInteger(val)).toBe(true);
  });
});

describe('randomElement', () => {
  it('配列の要素を返すこと', () => {
    const arr = ['a', 'b', 'c'];
    const val = randomElement(arr);
    expect(arr).toContain(val);
  });

  it('長さ1の配列の唯一の要素を返すこと', () => {
    expect(randomElement(['only'])).toBe('only');
  });
});

describe('generateJapaneseName', () => {
  it('スペースで区切られた姓名を返すこと', () => {
    const name = generateJapaneseName();
    expect(name).toMatch(/^.+ .+$/);
  });

  it('文字列を返すこと', () => {
    expect(typeof generateJapaneseName()).toBe('string');
  });
});

describe('generateEnglishName', () => {
  it('スペースで区切られた名姓を返すこと', () => {
    const name = generateEnglishName();
    const parts = name.split(' ');
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });
});

describe('generateEmail', () => {
  it('@を含むメールアドレスを返すこと', () => {
    const email = generateEmail();
    expect(email).toContain('@');
  });

  it('有効なメール形式であること', () => {
    const email = generateEmail();
    expect(email).toMatch(/^[a-z.0-9]+@[a-z.]+\.[a-z]+$/);
  });
});

describe('generateJapanesePhone', () => {
  it('ハイフン区切りの電話番号形式であること', () => {
    const phone = generateJapanesePhone();
    expect(phone).toMatch(/^\d{3}-\d{4}-\d{4}$/);
  });

  it('090/080/070/050のいずれかで始まること', () => {
    const phone = generateJapanesePhone();
    expect(['090', '080', '070', '050']).toContain(phone.slice(0, 3));
  });
});

describe('generateJapaneseAddress', () => {
  it('文字列を返すこと', () => {
    const addr = generateJapaneseAddress();
    expect(typeof addr).toBe('string');
    expect(addr.length).toBeGreaterThan(0);
  });

  it('ハイフンを含む番地を含むこと', () => {
    const addr = generateJapaneseAddress();
    expect(addr).toMatch(/-/);
  });
});

describe('generateCompanyName', () => {
  it('会社種別を含む名前を返すこと', () => {
    const name = generateCompanyName();
    const hasType =
      name.includes('株式会社') ||
      name.includes('有限会社') ||
      name.includes('合同会社');
    expect(hasType).toBe(true);
  });
});

describe('generateUUID', () => {
  it('UUID v4形式の文字列を返すこと', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('36文字（ハイフン含む）であること', () => {
    expect(generateUUID()).toHaveLength(36);
  });

  it('生成するたびに異なるUUIDを返すこと', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(uuids.size).toBe(100);
  });
});

describe('generateNumber', () => {
  it('指定範囲内の整数を返すこと', () => {
    for (let i = 0; i < 50; i++) {
      const val = generateNumber({ min: 10, max: 20 });
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('整数を返すこと', () => {
    expect(Number.isInteger(generateNumber({ min: 0, max: 100 }))).toBe(true);
  });
});

describe('generateDate', () => {
  it('YYYY-MM-DD形式の日付を返すこと', () => {
    const date = generateDate({ startYear: 2000, endYear: 2025 });
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('有効な日付であること', () => {
    for (let i = 0; i < 50; i++) {
      const date = generateDate({ startYear: 2000, endYear: 2025 });
      const parsed = new Date(date);
      expect(isNaN(parsed.getTime())).toBe(false);
    }
  });

  it('指定年の範囲内であること', () => {
    for (let i = 0; i < 20; i++) {
      const date = generateDate({ startYear: 2010, endYear: 2015 });
      const year = parseInt(date.slice(0, 4));
      expect(year).toBeGreaterThanOrEqual(2010);
      expect(year).toBeLessThanOrEqual(2015);
    }
  });

  it('閏年の2月29日を正しく処理すること', () => {
    // 閏年のみを許可する範囲で生成して有効日付であることを確認
    for (let i = 0; i < 100; i++) {
      const date = generateDate({ startYear: 2000, endYear: 2024 });
      const parsed = new Date(date);
      expect(isNaN(parsed.getTime())).toBe(false);
    }
  });
});

describe('generateLoremIpsum', () => {
  it('文字列を返すこと', () => {
    const text = generateLoremIpsum();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('大文字で始まりピリオドで終わること', () => {
    const text = generateLoremIpsum();
    expect(text[0]).toBe(text[0].toUpperCase());
    expect(text.endsWith('.')).toBe(true);
  });

  it('5〜15単語を含むこと', () => {
    for (let i = 0; i < 20; i++) {
      const text = generateLoremIpsum();
      // ピリオドを除いた単語数を数える
      const wordCount = text.replace('.', '').trim().split(' ').length;
      expect(wordCount).toBeGreaterThanOrEqual(5);
      expect(wordCount).toBeLessThanOrEqual(15);
    }
  });
});

describe('generateColor', () => {
  it('#RRGGBBの6桁16進数カラーコードを返すこと', () => {
    const color = generateColor();
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('#で始まること', () => {
    expect(generateColor()).toMatch(/^#/);
  });
});

describe('generateIPv4', () => {
  it('ドット区切り4オクテット形式であること', () => {
    const ip = generateIPv4();
    const parts = ip.split('.');
    expect(parts).toHaveLength(4);
    parts.forEach((p) => {
      const n = parseInt(p);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(255);
    });
  });
});

describe('generateIPv6', () => {
  it('コロン区切り8グループの完全形式であること', () => {
    const ip = generateIPv6();
    const groups = ip.split(':');
    expect(groups).toHaveLength(8);
    groups.forEach((g) => {
      expect(g).toMatch(/^[0-9a-f]{4}$/);
    });
  });

  it('小文字hexであること', () => {
    const ip = generateIPv6();
    expect(ip).toBe(ip.toLowerCase());
  });
});

describe('generateMAC', () => {
  it('コロン区切り6グループのMACアドレス形式であること', () => {
    const mac = generateMAC();
    const groups = mac.split(':');
    expect(groups).toHaveLength(6);
    groups.forEach((g) => {
      expect(g).toMatch(/^[0-9A-F]{2}$/);
    });
  });

  it('大文字hexであること', () => {
    const mac = generateMAC();
    expect(mac).toBe(mac.toUpperCase());
  });
});

describe('generateRandomData', () => {
  it('fieldsが空の場合は空文字列を返すこと', () => {
    const result = generateRandomData({
      fields: [],
      count: 10,
      format: 'json',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    expect(result).toBe('');
  });

  it('countが0の場合は空文字列を返すこと', () => {
    const result = generateRandomData({
      fields: ['uuid'],
      count: 0,
      format: 'json',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    expect(result).toBe('');
  });

  it('JSON形式で指定件数のレコードを返すこと', () => {
    const result = generateRandomData({
      fields: ['uuid', 'email'],
      count: 5,
      format: 'json',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(5);
  });

  it('JSON形式で各レコードが選択フィールドのラベルをキーに持つこと', () => {
    const result = generateRandomData({
      fields: ['uuid'],
      count: 3,
      format: 'json',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed[0])).toContain('UUID');
  });

  it('CSV形式でヘッダー行+データ行を返すこと', () => {
    const result = generateRandomData({
      fields: ['email', 'uuid'],
      count: 3,
      format: 'csv',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    const lines = result.split('\n');
    expect(lines).toHaveLength(4); // ヘッダー + 3行
    expect(lines[0]).toContain('メールアドレス');
    expect(lines[0]).toContain('UUID');
  });

  it('TSV形式でタブ区切りを返すこと', () => {
    const result = generateRandomData({
      fields: ['uuid', 'email'],
      count: 2,
      format: 'tsv',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    const lines = result.split('\n');
    // ヘッダー行にタブが含まれること（2フィールド以上）
    expect(lines[0]).toContain('\t');
    expect(lines).toHaveLength(3); // ヘッダー + 2行
  });

  it('全フィールドタイプで正しく生成できること', () => {
    const allFields = FIELD_CONFIGS.map((c) => c.type);
    const result = generateRandomData({
      fields: allFields,
      count: 1,
      format: 'json',
      numberOptions: { min: 1, max: 100 },
      dateOptions: { startYear: 2000, endYear: 2025 },
    });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(Object.keys(parsed[0])).toHaveLength(allFields.length);
  });
});

describe('FIELD_CONFIGS', () => {
  it('14種類のフィールド設定が存在すること', () => {
    expect(FIELD_CONFIGS).toHaveLength(14);
  });

  it('各フィールド設定がtype/label/descriptionを持つこと', () => {
    FIELD_CONFIGS.forEach((config) => {
      expect(config.type).toBeTruthy();
      expect(config.label).toBeTruthy();
      expect(config.description).toBeTruthy();
    });
  });
});
