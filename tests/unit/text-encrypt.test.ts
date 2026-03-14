import { describe, expect, it } from 'vitest';
import {
  rot13,
  caesarEncrypt,
  caesarDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  atbash,
  encryptText,
  decryptText,
  getCipherLabel,
  getCipherDescription,
} from '../../app/utils/text-encrypt';

describe('rot13', () => {
  it('アルファベット大文字をROT13変換する', () => {
    expect(rot13('A')).toBe('N');
    expect(rot13('Z')).toBe('M');
    expect(rot13('N')).toBe('A');
  });

  it('アルファベット小文字をROT13変換する', () => {
    expect(rot13('a')).toBe('n');
    expect(rot13('z')).toBe('m');
    expect(rot13('n')).toBe('a');
  });

  it('HELLOをROT13変換する', () => {
    expect(rot13('HELLO')).toBe('URYYB');
  });

  it('自己逆関数である（二回適用で元に戻る）', () => {
    expect(rot13(rot13('HELLO WORLD'))).toBe('HELLO WORLD');
    expect(rot13(rot13('test message 123'))).toBe('test message 123');
  });

  it('非アルファベット文字はそのまま', () => {
    expect(rot13('123')).toBe('123');
    expect(rot13('!@#')).toBe('!@#');
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!');
  });

  it('空文字列は空文字列を返す', () => {
    expect(rot13('')).toBe('');
  });
});

describe('caesarEncrypt', () => {
  it('シフト3でHELLOを暗号化する', () => {
    expect(caesarEncrypt('HELLO', 3)).toBe('KHOOR');
  });

  it('大文字・小文字を保持する', () => {
    expect(caesarEncrypt('Hello', 3)).toBe('Khoor');
  });

  it('シフト1でAをBに変換する', () => {
    expect(caesarEncrypt('A', 1)).toBe('B');
  });

  it('Zのシフトが折り返す', () => {
    expect(caesarEncrypt('Z', 1)).toBe('A');
    expect(caesarEncrypt('z', 1)).toBe('a');
  });

  it('シフト13はROT13と同じ結果', () => {
    expect(caesarEncrypt('HELLO', 13)).toBe(rot13('HELLO'));
  });

  it('非アルファベット文字はそのまま', () => {
    expect(caesarEncrypt('Hello, World!', 3)).toBe('Khoor, Zruog!');
  });

  it('空文字列は空文字列を返す', () => {
    expect(caesarEncrypt('', 3)).toBe('');
  });

  it('シフト26は元のテキストと同じ', () => {
    expect(caesarEncrypt('HELLO', 26)).toBe('HELLO');
  });
});

describe('caesarDecrypt', () => {
  it('シフト3でKHOORを復号化する', () => {
    expect(caesarDecrypt('KHOOR', 3)).toBe('HELLO');
  });

  it('大文字・小文字を保持する', () => {
    expect(caesarDecrypt('Khoor', 3)).toBe('Hello');
  });
});

describe('Caesar暗号の往復変換', () => {
  it('暗号化→復号化で元に戻る', () => {
    const original = 'HELLO WORLD';
    expect(caesarDecrypt(caesarEncrypt(original, 3), 3)).toBe(original);
  });

  it('様々なシフト数で往復変換が成功する', () => {
    for (let shift = 1; shift <= 25; shift++) {
      const original = 'TEST MESSAGE';
      expect(caesarDecrypt(caesarEncrypt(original, shift), shift)).toBe(original);
    }
  });

  it('小文字で往復変換が成功する', () => {
    const original = 'hello world';
    expect(caesarDecrypt(caesarEncrypt(original, 7), 7)).toBe(original);
  });
});

describe('vigenereEncrypt', () => {
  it('キーワードKEYでHELLOを暗号化する', () => {
    expect(vigenereEncrypt('HELLO', 'KEY')).toBe('RIJVS');
  });

  it('大文字・小文字を保持する', () => {
    const result = vigenereEncrypt('Hello', 'KEY');
    expect(result).toBe('Rijvs');
  });

  it('キーが空の場合は元のテキストを返す', () => {
    expect(vigenereEncrypt('HELLO', '')).toBe('HELLO');
  });

  it('キーに非アルファベット文字が含まれても動作する', () => {
    // 非アルファベットは除去されるのでKEY123はKEYと同じ
    expect(vigenereEncrypt('HELLO', 'KEY123')).toBe(vigenereEncrypt('HELLO', 'KEY'));
  });

  it('小文字のキーも機能する', () => {
    expect(vigenereEncrypt('HELLO', 'key')).toBe(vigenereEncrypt('HELLO', 'KEY'));
  });

  it('非アルファベット文字はそのまま（キーインデックスは進めない）', () => {
    const result = vigenereEncrypt('A B', 'K');
    // A->K, スペースはスペース, B->L
    expect(result).toBe('K L');
  });
});

describe('vigenereDecrypt', () => {
  it('キーワードKEYでRIJVSを復号化する', () => {
    expect(vigenereDecrypt('RIJVS', 'KEY')).toBe('HELLO');
  });

  it('キーが空の場合は元のテキストを返す', () => {
    expect(vigenereDecrypt('HELLO', '')).toBe('HELLO');
  });
});

describe('Vigenère暗号の往復変換', () => {
  it('暗号化→復号化で元に戻る', () => {
    const original = 'HELLO WORLD';
    const key = 'SECRET';
    expect(vigenereDecrypt(vigenereEncrypt(original, key), key)).toBe(original);
  });

  it('長いキーで往復変換が成功する', () => {
    const original = 'THE QUICK BROWN FOX';
    const key = 'VERYLONGKEYWORD';
    expect(vigenereDecrypt(vigenereEncrypt(original, key), key)).toBe(original);
  });

  it('単一文字キーで往復変換が成功する', () => {
    const original = 'HELLO';
    const key = 'A';
    expect(vigenereDecrypt(vigenereEncrypt(original, key), key)).toBe(original);
  });
});

describe('atbash', () => {
  it('AをZに変換する', () => {
    expect(atbash('A')).toBe('Z');
  });

  it('ZをAに変換する', () => {
    expect(atbash('Z')).toBe('A');
  });

  it('HELLOをSVOOLに変換する', () => {
    expect(atbash('HELLO')).toBe('SVOOL');
  });

  it('小文字も変換する', () => {
    expect(atbash('a')).toBe('z');
    expect(atbash('hello')).toBe('svool');
  });

  it('自己逆関数である（二回適用で元に戻る）', () => {
    expect(atbash(atbash('HELLO WORLD'))).toBe('HELLO WORLD');
  });

  it('非アルファベット文字はそのまま', () => {
    expect(atbash('Hello, World!')).toBe('Svool, Dliow!');
  });

  it('空文字列は空文字列を返す', () => {
    expect(atbash('')).toBe('');
  });
});

describe('encryptText', () => {
  it('ROT13で暗号化する', () => {
    expect(encryptText('HELLO', 'rot13')).toBe('URYYB');
  });

  it('Caesar暗号で暗号化する（デフォルトシフト3）', () => {
    expect(encryptText('HELLO', 'caesar')).toBe('KHOOR');
  });

  it('Caesar暗号でカスタムシフトを使用する', () => {
    expect(encryptText('HELLO', 'caesar', { shift: 13 })).toBe(rot13('HELLO'));
  });

  it('Vigenère暗号で暗号化する', () => {
    expect(encryptText('HELLO', 'vigenere', { key: 'KEY' })).toBe('RIJVS');
  });

  it('Atbash暗号で暗号化する', () => {
    expect(encryptText('HELLO', 'atbash')).toBe('SVOOL');
  });
});

describe('decryptText', () => {
  it('ROT13で復号化する（自己逆関数）', () => {
    expect(decryptText('URYYB', 'rot13')).toBe('HELLO');
  });

  it('Caesar暗号で復号化する（デフォルトシフト3）', () => {
    expect(decryptText('KHOOR', 'caesar')).toBe('HELLO');
  });

  it('Vigenère暗号で復号化する', () => {
    expect(decryptText('RIJVS', 'vigenere', { key: 'KEY' })).toBe('HELLO');
  });

  it('Atbash暗号で復号化する（自己逆関数）', () => {
    expect(decryptText('SVOOL', 'atbash')).toBe('HELLO');
  });
});

describe('encryptText/decryptText 往復変換', () => {
  const testCases = [
    'HELLO WORLD',
    'The Quick Brown Fox',
    'Testing 123!',
  ];

  testCases.forEach((original) => {
    it(`ROT13 往復変換: "${original}"`, () => {
      const encrypted = encryptText(original, 'rot13');
      expect(decryptText(encrypted, 'rot13')).toBe(original);
    });

    it(`Caesar暗号 往復変換: "${original}"`, () => {
      const encrypted = encryptText(original, 'caesar', { shift: 7 });
      expect(decryptText(encrypted, 'caesar', { shift: 7 })).toBe(original);
    });

    it(`Vigenère暗号 往復変換: "${original}"`, () => {
      const encrypted = encryptText(original, 'vigenere', { key: 'SECRET' });
      expect(decryptText(encrypted, 'vigenere', { key: 'SECRET' })).toBe(original);
    });

    it(`Atbash暗号 往復変換: "${original}"`, () => {
      const encrypted = encryptText(original, 'atbash');
      expect(decryptText(encrypted, 'atbash')).toBe(original);
    });
  });
});

describe('getCipherLabel', () => {
  it('各暗号方式のラベルを返す', () => {
    expect(getCipherLabel('rot13')).toBe('ROT13');
    expect(getCipherLabel('caesar')).toBe('Caesar暗号');
    expect(getCipherLabel('vigenere')).toBe('Vigenère暗号');
    expect(getCipherLabel('atbash')).toBe('Atbash暗号');
  });
});

describe('getCipherDescription', () => {
  it('各暗号方式の説明を返す', () => {
    expect(getCipherDescription('rot13')).toBeTruthy();
    expect(getCipherDescription('caesar')).toBeTruthy();
    expect(getCipherDescription('vigenere')).toBeTruthy();
    expect(getCipherDescription('atbash')).toBeTruthy();
  });

  it('説明が文字列である', () => {
    const ciphers = ['rot13', 'caesar', 'vigenere', 'atbash'] as const;
    ciphers.forEach((cipher) => {
      expect(typeof getCipherDescription(cipher)).toBe('string');
    });
  });
});
