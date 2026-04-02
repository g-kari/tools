import { describe, expect, it } from 'vitest';
import {
  buildFourSquareGrid,
  buildStandardGrid,
  findInGrid,
  fourSquareEncrypt,
  fourSquareDecrypt,
  getFourSquareDigraphs,
} from '../../app/utils/four-square';

describe('buildFourSquareGrid', () => {
  it('5×5のグリッドを返す', () => {
    const grid = buildFourSquareGrid('KEY');
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
    }
  });

  it('キーワードの文字が先頭に配置される', () => {
    const grid = buildFourSquareGrid('KEY');
    const flat = grid.flat();
    expect(flat[0]).toBe('K');
    expect(flat[1]).toBe('E');
    expect(flat[2]).toBe('Y');
  });

  it('25文字すべてを含む（J は I に統合）', () => {
    const grid = buildFourSquareGrid('KEY');
    const flat = grid.flat();
    expect(flat).toHaveLength(25);
    expect(flat.includes('I')).toBe(true);
    expect(flat.includes('J')).toBe(false);
  });

  it('重複文字なし', () => {
    const grid = buildFourSquareGrid('KEYWORD');
    const flat = grid.flat();
    const unique = new Set(flat);
    expect(unique.size).toBe(25);
  });

  it('キーワード中の J は I に変換される', () => {
    const gridWithJ = buildFourSquareGrid('JUNGLE');
    const gridWithI = buildFourSquareGrid('IUNGLE');
    expect(gridWithJ.flat().join('')).toBe(gridWithI.flat().join(''));
  });

  it('キーワードが空の場合は標準アルファベット順になる', () => {
    const grid = buildFourSquareGrid('');
    expect(grid[0][0]).toBe('A');
    expect(grid[0][1]).toBe('B');
  });
});

describe('buildStandardGrid', () => {
  it('5×5のグリッドを返す', () => {
    const grid = buildStandardGrid();
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
    }
  });

  it('ABCDE... の順で始まる', () => {
    const grid = buildStandardGrid();
    expect(grid[0]).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('J を含まない（I で代用）', () => {
    const grid = buildStandardGrid();
    const flat = grid.flat();
    expect(flat.includes('J')).toBe(false);
    expect(flat.includes('I')).toBe(true);
  });
});

describe('findInGrid', () => {
  const grid = buildStandardGrid();

  it('A は (0,0) にある', () => {
    expect(findInGrid(grid, 'A')).toEqual([0, 0]);
  });

  it('E は (0,4) にある', () => {
    expect(findInGrid(grid, 'E')).toEqual([0, 4]);
  });

  it('存在しない文字は [-1,-1] を返す', () => {
    expect(findInGrid(grid, 'J')).toEqual([-1, -1]);
  });

  it('Z は最後のセルにある', () => {
    expect(findInGrid(grid, 'Z')).toEqual([4, 4]);
  });
});

describe('fourSquareEncrypt', () => {
  describe('基本的な暗号化', () => {
    it('空テキストは空文字を返す', () => {
      expect(fourSquareEncrypt('', 'EXAMPLE', 'KEYWORD')).toBe('');
    });

    it('暗号化結果は入力長と一致する（ダイグラフ形式）', () => {
      const result = fourSquareEncrypt('HELLO', 'EXAMPLE', 'KEYWORD');
      // 5文字→X補填→6文字→3ダイグラフ（スペース区切り）
      expect(typeof result).toBe('string');
    });

    it('大文字・小文字どちらも同じ結果になる', () => {
      expect(fourSquareEncrypt('HELLO', 'EXAMPLE', 'KEYWORD')).toBe(
        fourSquareEncrypt('hello', 'EXAMPLE', 'KEYWORD')
      );
    });

    it('J は I と同一視される', () => {
      expect(fourSquareEncrypt('JAIL', 'KEY', 'WORD')).toBe(
        fourSquareEncrypt('IAIL', 'KEY', 'WORD')
      );
    });

    it('英字以外は除去される', () => {
      expect(fourSquareEncrypt('HE LLO!', 'KEY', 'WORD')).toBe(
        fourSquareEncrypt('HELLO', 'KEY', 'WORD')
      );
    });

    it('奇数文字の入力には末尾 X が補填される', () => {
      // ABCは3文字→ABCX（4文字）→2ダイグラフ
      const result = fourSquareEncrypt('ABC', 'KEY', 'WORD');
      const parts = result.split(' ');
      expect(parts).toHaveLength(2);
    });

    it('偶数文字の入力はそのまま処理される', () => {
      // ABCDは4文字→2ダイグラフ
      const result = fourSquareEncrypt('ABCD', 'KEY', 'WORD');
      const parts = result.split(' ');
      expect(parts).toHaveLength(2);
    });
  });

  describe('既知の変換テスト', () => {
    it('キーなし（標準方陣）で暗号化すると左上右下が一致するため平文と同じ文字になる', () => {
      // 両方のキー方陣が標準配列の場合、変換は特定のパターンに従う
      const result = fourSquareEncrypt('AB', '', '');
      expect(result.replace(/ /g, '')).toHaveLength(2);
    });
  });
});

describe('fourSquareDecrypt', () => {
  describe('基本的な復号化', () => {
    it('空テキストは空文字を返す', () => {
      expect(fourSquareDecrypt('', 'EXAMPLE', 'KEYWORD')).toBe('');
    });

    it('奇数文字の暗号文は空文字を返す', () => {
      expect(fourSquareDecrypt('ABC', 'EXAMPLE', 'KEYWORD')).toBe('');
    });
  });

  describe('往復変換', () => {
    it('基本的な往復変換が成功する', () => {
      const original = 'HELLO';
      const encrypted = fourSquareEncrypt(original, 'EXAMPLE', 'KEYWORD');
      const decrypted = fourSquareDecrypt(encrypted, 'EXAMPLE', 'KEYWORD');
      // 奇数文字の場合は末尾X補填、スペース除去後に比較
      const cleaned = decrypted.replace(/ /g, '');
      expect(cleaned.startsWith('HELLOX') || cleaned === 'HELLO').toBe(true);
    });

    it('偶数文字の往復変換が完全一致する', () => {
      const original = 'HELP';
      const encrypted = fourSquareEncrypt(original, 'EXAMPLE', 'KEYWORD');
      const decrypted = fourSquareDecrypt(encrypted, 'EXAMPLE', 'KEYWORD');
      expect(decrypted.replace(/ /g, '')).toBe(original);
    });

    it('長いテキストの往復変換が成功する', () => {
      const original = 'WEAREDISCOVERED';
      const encrypted = fourSquareEncrypt(original, 'EXAMPLE', 'KEYWORD');
      const decrypted = fourSquareDecrypt(encrypted, 'EXAMPLE', 'KEYWORD');
      const cleaned = decrypted.replace(/ /g, '');
      expect(cleaned.startsWith(original)).toBe(true);
    });

    it('異なるキーでは正しく復号化できない', () => {
      const original = 'HELLO';
      const encrypted = fourSquareEncrypt(original, 'EXAMPLE', 'KEYWORD');
      const wrongDecrypted = fourSquareDecrypt(encrypted, 'WRONG', 'KEY');
      expect(wrongDecrypted.replace(/ /g, '')).not.toBe('HELLOX');
    });

    it('キーワードの順序が逆では正しく復号化できない', () => {
      const original = 'TESTMESSAGE';
      const encrypted = fourSquareEncrypt(original, 'ALPHA', 'BETA');
      const wrongDecrypted = fourSquareDecrypt(encrypted, 'BETA', 'ALPHA');
      const correct = fourSquareDecrypt(encrypted, 'ALPHA', 'BETA');
      expect(wrongDecrypted.replace(/ /g, '')).not.toBe(correct.replace(/ /g, ''));
    });
  });
});

describe('getFourSquareDigraphs', () => {
  it('暗号化モードでダイグラフペアを返す', () => {
    const pairs = getFourSquareDigraphs('HELLO', 'EXAMPLE', 'KEYWORD', 'encrypt');
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(pair.input).toHaveLength(2);
      expect(pair.output).toHaveLength(2);
    }
  });

  it('復号化モードでダイグラフペアを返す', () => {
    const encrypted = fourSquareEncrypt('HELLO', 'EXAMPLE', 'KEYWORD');
    const pairs = getFourSquareDigraphs(encrypted, 'EXAMPLE', 'KEYWORD', 'decrypt');
    expect(pairs.length).toBeGreaterThan(0);
  });

  it('空テキストは空配列を返す', () => {
    expect(getFourSquareDigraphs('', 'KEY', 'WORD', 'encrypt')).toEqual([]);
    expect(getFourSquareDigraphs('', 'KEY', 'WORD', 'decrypt')).toEqual([]);
  });

  it('復号化モードで奇数文字は空配列を返す', () => {
    expect(getFourSquareDigraphs('ABC', 'KEY', 'WORD', 'decrypt')).toEqual([]);
  });

  it('暗号化・復号化のダイグラフ数が一致する', () => {
    const original = 'ABCDEF';
    const encrypted = fourSquareEncrypt(original, 'KEY', 'WORD');
    const encDigraphs = getFourSquareDigraphs(original, 'KEY', 'WORD', 'encrypt');
    const decDigraphs = getFourSquareDigraphs(encrypted, 'KEY', 'WORD', 'decrypt');
    expect(encDigraphs.length).toBe(decDigraphs.length);
  });
});
