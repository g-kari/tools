import { describe, expect, it } from 'vite-plus/test';
import {
  buildColumnOrder,
  encodeColumnar,
  decodeColumnar,
  buildGrid,
} from '../../app/utils/columnar-transposition';

describe('buildColumnOrder', () => {
  it('アルファベット順のランクを返す', () => {
    // KEY: E=0(rank0), K=1(rank1), Y=2(rank2)
    // → col0(K)=rank1, col1(E)=rank0, col2(Y)=rank2
    expect(buildColumnOrder('KEY')).toEqual([1, 0, 2]);
  });

  it('単一文字の場合はランク0を返す', () => {
    expect(buildColumnOrder('A')).toEqual([0]);
  });

  it('アルファベット順通りのキーはそのまま', () => {
    // ABC: A=rank0, B=rank1, C=rank2
    expect(buildColumnOrder('ABC')).toEqual([0, 1, 2]);
  });

  it('逆順のキーは逆のランクを返す', () => {
    // ZYX: X=rank0, Y=rank1, Z=rank2
    // → col0(Z)=rank2, col1(Y)=rank1, col2(X)=rank0
    expect(buildColumnOrder('ZYX')).toEqual([2, 1, 0]);
  });

  it('重複文字がある場合は左から順にランク付け', () => {
    // ABA: 最初のA=rank0, 2番目のA=rank1, B=rank2
    // → col0(A)=rank0, col1(B)=rank2, col2(A)=rank1
    expect(buildColumnOrder('ABA')).toEqual([0, 2, 1]);
  });

  it('大文字・小文字を区別しない', () => {
    expect(buildColumnOrder('key')).toEqual(buildColumnOrder('KEY'));
  });
});

describe('encodeColumnar', () => {
  describe('基本的な変換', () => {
    it('キー"KEY"でエンコードできる', () => {
      // KEY → col order: E(rank0)=col1, K(rank1)=col0, Y(rank2)=col2
      // WEAREDISCOVERED (15文字, 5行×3列)
      // Row0: W E A
      // Row1: R E D
      // Row2: I S C
      // Row3: O V E
      // Row4: R E D
      // 読み取り: col1(E-rank): EESVE, col0(K-rank): WRIOR, col2(Y-rank): ADCED
      expect(encodeColumnar('WEAREDISCOVERED', 'KEY')).toBe('EESVEWRIORADCED');
    });

    it('パディングが必要なケース', () => {
      // HELLO (5文字), KEY(3列) → 2行必要 (6セル)
      // Row0: H E L
      // Row1: L O X  (Xはパディング)
      // 読み取り: E-rank(col1): EO, K-rank(col0): HL, Y-rank(col2): LX
      expect(encodeColumnar('HELLO', 'KEY')).toBe('EOHLLX');
    });

    it('カスタムパディング文字を使える', () => {
      const result = encodeColumnar('HELLO', 'KEY', 'Z');
      expect(result).toBe('EOHLLZ');
    });
  });

  describe('境界値', () => {
    it('空テキストはそのまま返す', () => {
      expect(encodeColumnar('', 'KEY')).toBe('');
    });

    it('キーが空の場合はそのまま返す', () => {
      expect(encodeColumnar('HELLO', '')).toBe('HELLO');
    });

    it('キー長1の場合はそのまま返す', () => {
      expect(encodeColumnar('HELLO', 'A')).toBe('HELLO');
    });

    it('テキスト長がキー長と同じ場合', () => {
      // ABC, key=BCA: C=rank0, A=rank1, B=rank2
      // 1行のみ: A B C
      // 読み取り: col2(C-rank0): C, col0(A-rank1): A, col1(B-rank2): B
      const result = encodeColumnar('ABC', 'BCA');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(3);
    });
  });

  describe('往復変換', () => {
    it('キー"KEY"で往復変換が成功する', () => {
      const original = 'WEAREDISCOVERED';
      expect(decodeColumnar(encodeColumnar(original, 'KEY'), 'KEY')).toBe(original);
    });

    it('パディングありの往復変換が成功する', () => {
      const original = 'HELLO';
      const encoded = encodeColumnar(original, 'KEY');
      expect(decodeColumnar(encoded, 'KEY')).toBe(original);
    });

    it('長いテキストの往復変換が成功する', () => {
      const original = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG';
      expect(decodeColumnar(encodeColumnar(original, 'ZEBRAS'), 'ZEBRAS')).toBe(original);
    });

    it('数字混在テキストの往復変換が成功する', () => {
      const original = 'HELLO123WORLD456';
      expect(decodeColumnar(encodeColumnar(original, 'KEY'), 'KEY')).toBe(original);
    });
  });
});

describe('decodeColumnar', () => {
  it('キー"KEY"でデコードできる', () => {
    expect(decodeColumnar('EESVEWRIORADCED', 'KEY')).toBe('WEAREDISCOVERED');
  });

  it('パディングを除去してデコードできる', () => {
    expect(decodeColumnar('EOHLLX', 'KEY')).toBe('HELLO');
  });

  it('空テキストはそのまま返す', () => {
    expect(decodeColumnar('', 'KEY')).toBe('');
  });

  it('キーが空の場合はそのまま返す', () => {
    expect(decodeColumnar('HELLO', '')).toBe('HELLO');
  });
});

describe('buildGrid', () => {
  it('グリッド行数が正しい', () => {
    // HELLO (5文字), KEY (3列) → 2行
    const grid = buildGrid('HELLO', 'KEY');
    expect(grid).toHaveLength(2);
  });

  it('グリッド列数がキー長と一致する', () => {
    const grid = buildGrid('HELLO', 'KEY');
    for (const row of grid) {
      expect(row).toHaveLength(3);
    }
  });

  it('パディングセルが正しくマークされる', () => {
    // HELLO(5文字), KEY(3列) → 6セル → 最後の1セルがパディング
    const grid = buildGrid('HELLO', 'KEY');
    const padCells = grid.flat().filter((c) => c.isPad);
    expect(padCells).toHaveLength(1);
    expect(padCells[0].char).toBe('X');
  });

  it('テキストがグリッドを完全に埋める場合はパディングなし', () => {
    // ABC (3文字), ABC (3列) → 1行、パディングなし
    const grid = buildGrid('ABC', 'ABC');
    const padCells = grid.flat().filter((c) => c.isPad);
    expect(padCells).toHaveLength(0);
  });

  it('空テキストは空グリッドを返す', () => {
    expect(buildGrid('', 'KEY')).toEqual([]);
  });

  it('空キーは空グリッドを返す', () => {
    expect(buildGrid('HELLO', '')).toEqual([]);
  });

  it('カスタムパディング文字が反映される', () => {
    const grid = buildGrid('HELLO', 'KEY', 'Z');
    const padCells = grid.flat().filter((c) => c.isPad);
    expect(padCells[0].char).toBe('Z');
  });
});
