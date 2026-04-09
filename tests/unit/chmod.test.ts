import { describe, it, expect } from 'vite-plus/test';
import {
  parseChmodOctal,
  buildChmodOctal,
  octalToSymbolic,
  symbolicToOctal,
  bitToChar,
} from '../../app/utils/chmod';
import type { ChmodPermissions } from '../../app/utils/chmod';

describe('chmod utility functions', () => {
  // --- parseChmodOctal ---
  describe('parseChmodOctal', () => {
    it('3桁の8進数をパースできる（755）', () => {
      const result = parseChmodOctal('755');
      expect(result).not.toBeNull();
      expect(result!.owner).toEqual({ read: true, write: true, execute: true });
      expect(result!.group).toEqual({ read: true, write: false, execute: true });
      expect(result!.others).toEqual({ read: true, write: false, execute: true });
      expect(result!.special).toEqual({ setuid: false, setgid: false, sticky: false });
    });

    it('3桁の8進数をパースできる（644）', () => {
      const result = parseChmodOctal('644');
      expect(result).not.toBeNull();
      expect(result!.owner).toEqual({ read: true, write: true, execute: false });
      expect(result!.group).toEqual({ read: true, write: false, execute: false });
      expect(result!.others).toEqual({ read: true, write: false, execute: false });
    });

    it('4桁の8進数をパースできる（4755: setuid）', () => {
      const result = parseChmodOctal('4755');
      expect(result).not.toBeNull();
      expect(result!.special.setuid).toBe(true);
      expect(result!.special.setgid).toBe(false);
      expect(result!.special.sticky).toBe(false);
    });

    it('4桁の8進数をパースできる（2644: setgid）', () => {
      const result = parseChmodOctal('2644');
      expect(result).not.toBeNull();
      expect(result!.special.setuid).toBe(false);
      expect(result!.special.setgid).toBe(true);
      expect(result!.special.sticky).toBe(false);
    });

    it('4桁の8進数をパースできる（1755: sticky）', () => {
      const result = parseChmodOctal('1755');
      expect(result).not.toBeNull();
      expect(result!.special.sticky).toBe(true);
    });

    it('先頭のゼロを無視する（0755）', () => {
      const result = parseChmodOctal('0755');
      expect(result).not.toBeNull();
      expect(result!.owner).toEqual({ read: true, write: true, execute: true });
    });

    it('000をパースできる', () => {
      const result = parseChmodOctal('000');
      expect(result).not.toBeNull();
      expect(result!.owner).toEqual({ read: false, write: false, execute: false });
      expect(result!.group).toEqual({ read: false, write: false, execute: false });
      expect(result!.others).toEqual({ read: false, write: false, execute: false });
    });

    it('777をパースできる', () => {
      const result = parseChmodOctal('777');
      expect(result).not.toBeNull();
      expect(result!.owner).toEqual({ read: true, write: true, execute: true });
      expect(result!.group).toEqual({ read: true, write: true, execute: true });
      expect(result!.others).toEqual({ read: true, write: true, execute: true });
    });

    it('無効な文字列はnullを返す（8進数外の数字）', () => {
      expect(parseChmodOctal('789')).toBeNull();
      expect(parseChmodOctal('999')).toBeNull();
    });

    it('無効な文字列はnullを返す（英字を含む）', () => {
      expect(parseChmodOctal('abc')).toBeNull();
      expect(parseChmodOctal('7a5')).toBeNull();
    });

    it('5桁以上はnullを返す', () => {
      expect(parseChmodOctal('12345')).toBeNull();
    });

    it('空文字列はnullを返す', () => {
      expect(parseChmodOctal('')).toBeNull();
    });
  });

  // --- buildChmodOctal ---
  describe('buildChmodOctal', () => {
    it('755に相当するパーミッションから"755"を生成する', () => {
      const perms: ChmodPermissions = {
        special: { setuid: false, setgid: false, sticky: false },
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
      };
      expect(buildChmodOctal(perms)).toBe('755');
    });

    it('644に相当するパーミッションから"644"を生成する', () => {
      const perms: ChmodPermissions = {
        special: { setuid: false, setgid: false, sticky: false },
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        others: { read: true, write: false, execute: false },
      };
      expect(buildChmodOctal(perms)).toBe('644');
    });

    it('setuidが立っている場合4桁で返す（4755）', () => {
      const perms: ChmodPermissions = {
        special: { setuid: true, setgid: false, sticky: false },
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
      };
      expect(buildChmodOctal(perms)).toBe('4755');
    });

    it('stickyが立っている場合4桁で返す（1755）', () => {
      const perms: ChmodPermissions = {
        special: { setuid: false, setgid: false, sticky: true },
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        others: { read: true, write: false, execute: true },
      };
      expect(buildChmodOctal(perms)).toBe('1755');
    });

    it('000パーミッションから"000"を生成する', () => {
      const perms: ChmodPermissions = {
        special: { setuid: false, setgid: false, sticky: false },
        owner: { read: false, write: false, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false },
      };
      expect(buildChmodOctal(perms)).toBe('000');
    });
  });

  // --- octalToSymbolic ---
  describe('octalToSymbolic', () => {
    it('755 → "rwxr-xr-x"', () => {
      expect(octalToSymbolic('755')).toBe('rwxr-xr-x');
    });

    it('644 → "rw-r--r--"', () => {
      expect(octalToSymbolic('644')).toBe('rw-r--r--');
    });

    it('777 → "rwxrwxrwx"', () => {
      expect(octalToSymbolic('777')).toBe('rwxrwxrwx');
    });

    it('000 → "---------"', () => {
      expect(octalToSymbolic('000')).toBe('---------');
    });

    it('700 → "rwx------"', () => {
      expect(octalToSymbolic('700')).toBe('rwx------');
    });

    it('400 → "r--------"', () => {
      expect(octalToSymbolic('400')).toBe('r--------');
    });

    it('4755 (setuid + execute) → "rwsr-xr-x"', () => {
      expect(octalToSymbolic('4755')).toBe('rwsr-xr-x');
    });

    it('4644 (setuid, no execute) → "rwSr--r--"', () => {
      expect(octalToSymbolic('4644')).toBe('rwSr--r--');
    });

    it('1755 (sticky + execute) → "rwxr-xr-t"', () => {
      expect(octalToSymbolic('1755')).toBe('rwxr-xr-t');
    });

    it('1644 (sticky, no execute) → "rw-r--r-T"', () => {
      expect(octalToSymbolic('1644')).toBe('rw-r--r-T');
    });

    it('無効な文字列は"---------"を返す', () => {
      expect(octalToSymbolic('invalid')).toBe('---------');
    });
  });

  // --- symbolicToOctal ---
  describe('symbolicToOctal', () => {
    it('"rwxr-xr-x" → "755"', () => {
      expect(symbolicToOctal('rwxr-xr-x')).toBe('755');
    });

    it('"rw-r--r--" → "644"', () => {
      expect(symbolicToOctal('rw-r--r--')).toBe('644');
    });

    it('"rwxrwxrwx" → "777"', () => {
      expect(symbolicToOctal('rwxrwxrwx')).toBe('777');
    });

    it('"---------" → "000"', () => {
      expect(symbolicToOctal('---------')).toBe('000');
    });

    it('"rwsr-xr-x" → "4755" (setuid + execute)', () => {
      expect(symbolicToOctal('rwsr-xr-x')).toBe('4755');
    });

    it('"rwSr--r--" → "4644" (setuid, no execute)', () => {
      expect(symbolicToOctal('rwSr--r--')).toBe('4644');
    });

    it('"rwxr-xr-t" → "1755" (sticky + execute)', () => {
      expect(symbolicToOctal('rwxr-xr-t')).toBe('1755');
    });

    it('9文字未満はnullを返す', () => {
      expect(symbolicToOctal('rwxr-x')).toBeNull();
    });

    it('無効な文字を含む場合はnullを返す', () => {
      expect(symbolicToOctal('rwxr-xr-z')).toBeNull();
      expect(symbolicToOctal('rwxr-xr-9')).toBeNull();
    });
  });

  // --- bitToChar ---
  describe('bitToChar', () => {
    it('trueのとき指定文字を返す', () => {
      expect(bitToChar(true, 'r')).toBe('r');
      expect(bitToChar(true, 'w')).toBe('w');
      expect(bitToChar(true, 'x')).toBe('x');
    });

    it('falseのとき"-"を返す', () => {
      expect(bitToChar(false, 'r')).toBe('-');
      expect(bitToChar(false, 'w')).toBe('-');
      expect(bitToChar(false, 'x')).toBe('-');
    });
  });

  // --- 往復変換テスト ---
  describe('往復変換（parseChmodOctal -> buildChmodOctal）', () => {
    const testCases = ['000', '400', '600', '644', '700', '755', '777', '4755', '2644', '1755'];

    testCases.forEach((octal) => {
      it(`${octal} をパースして再構築すると同じ値になる`, () => {
        const perms = parseChmodOctal(octal);
        expect(perms).not.toBeNull();
        expect(buildChmodOctal(perms!)).toBe(octal);
      });
    });
  });

  // --- シンボリック往復変換テスト ---
  describe('往復変換（octalToSymbolic -> symbolicToOctal）', () => {
    const testCases = ['000', '400', '600', '644', '700', '755', '777', '4755', '1755'];

    testCases.forEach((octal) => {
      it(`${octal} → symbolic → ${octal} が一致する`, () => {
        const symbolic = octalToSymbolic(octal);
        expect(symbolicToOctal(symbolic)).toBe(octal);
      });
    });
  });
});
