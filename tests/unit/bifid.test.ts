import { describe, expect, it } from 'vite-plus/test';
import { buildBifidSquare, findInSquare, encodeBifid, decodeBifid } from '../../app/utils/bifid';

describe('buildBifidSquare', () => {
  it('5×5のグリッドを返す', () => {
    const grid = buildBifidSquare('KEY');
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
    }
  });

  it('キーワードの文字が先頭に配置される', () => {
    const grid = buildBifidSquare('KEY');
    // K, E, Y が最初の3文字
    const flat = grid.flat();
    expect(flat[0]).toBe('K');
    expect(flat[1]).toBe('E');
    expect(flat[2]).toBe('Y');
  });

  it('25文字すべてを含む（J は I に統合）', () => {
    const grid = buildBifidSquare('KEY');
    const flat = grid.flat();
    expect(flat).toHaveLength(25);
    expect(flat.includes('I')).toBe(true);
    expect(flat.includes('J')).toBe(false);
  });

  it('重複文字なし', () => {
    const grid = buildBifidSquare('KEYWORD');
    const flat = grid.flat();
    const unique = new Set(flat);
    expect(unique.size).toBe(25);
  });

  it('キーワード中の J は I に変換される', () => {
    const gridWithJ = buildBifidSquare('JUNGLE');
    const gridWithI = buildBifidSquare('IUNGLE');
    expect(gridWithJ.flat().join('')).toBe(gridWithI.flat().join(''));
  });

  it('キーワードが空の場合は標準アルファベット順になる', () => {
    const grid = buildBifidSquare('');
    expect(grid[0][0]).toBe('A');
    expect(grid[0][1]).toBe('B');
    expect(grid[0][2]).toBe('C');
  });
});

describe('findInSquare', () => {
  const grid = buildBifidSquare('');

  it('A は (0,0) にある', () => {
    expect(findInSquare(grid, 'A')).toEqual([0, 0]);
  });

  it('E は (0,4) にある（標準配置）', () => {
    expect(findInSquare(grid, 'E')).toEqual([0, 4]);
  });

  it('存在しない文字は [-1,-1] を返す', () => {
    expect(findInSquare(grid, 'J')).toEqual([-1, -1]);
  });

  it('Z は (4,4) にある', () => {
    expect(findInSquare(grid, 'Z')).toEqual([4, 4]);
  });
});

describe('encodeBifid', () => {
  describe('基本的な変換', () => {
    it('HELP をキーなし（A始まり）でエンコードできる', () => {
      // 標準方陣（キー=""）で HELP をエンコード
      // H→(1,2), E→(0,4), L→(2,0), P→(2,4)
      // rows: 1 0 2 2 / cols: 2 4 0 4
      // combined: 1 0 2 2 2 4 0 4
      // pairs: (1,0)→F, (2,2)→N, (2,4)→P, (0,4)→E
      expect(encodeBifid('HELP', '')).toBe('FNPE');
    });

    it('キーワード付きでエンコードできる', () => {
      const result = encodeBifid('HELLO', 'KEYWORD');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(5);
    });

    it('大文字・小文字どちらも処理される', () => {
      expect(encodeBifid('hello', '')).toBe(encodeBifid('HELLO', ''));
    });

    it('J は I と同一視される', () => {
      expect(encodeBifid('JAIL', '')).toBe(encodeBifid('IAIL', ''));
    });
  });

  describe('非アルファベット文字の扱い', () => {
    it('スペースは除去される', () => {
      expect(encodeBifid('HE LP', '')).toBe(encodeBifid('HELP', ''));
    });

    it('数字・記号は除去される', () => {
      expect(encodeBifid('H3L P!', '')).toBe(encodeBifid('HLP', ''));
    });

    it('空テキストは空文字を返す', () => {
      expect(encodeBifid('', 'KEY')).toBe('');
    });

    it('アルファベットなしテキストは空文字を返す', () => {
      expect(encodeBifid('123!@#', 'KEY')).toBe('');
    });
  });

  describe('周期の動作', () => {
    it('周期0は全体を一括処理する', () => {
      const result0 = encodeBifid('HELLOWORLD', 'KEY', 0);
      const resultFull = encodeBifid('HELLOWORLD', 'KEY', 10);
      expect(result0).toBe(resultFull);
    });

    it('周期1以下は全体を一括処理する', () => {
      expect(encodeBifid('HELLO', 'KEY', 0)).toBe(encodeBifid('HELLO', 'KEY', 1));
    });

    it('周期が異なると結果が異なる', () => {
      const result5 = encodeBifid('HELLOWORLD', 'KEY', 5);
      const result0 = encodeBifid('HELLOWORLD', 'KEY', 0);
      // 周期によって結果は変わる
      expect(result5).not.toBe(result0);
    });
  });
});

describe('decodeBifid', () => {
  describe('基本的な変換', () => {
    it('FNPE をキーなしでデコードして HELP に戻る', () => {
      expect(decodeBifid('FNPE', '')).toBe('HELP');
    });

    it('空テキストは空文字を返す', () => {
      expect(decodeBifid('', 'KEY')).toBe('');
    });
  });

  describe('往復変換', () => {
    it('キーなしで往復変換が成功する', () => {
      const original = 'HELLO';
      expect(decodeBifid(encodeBifid(original, ''), '')).toBe(original);
    });

    it('キーワード付きで往復変換が成功する', () => {
      const original = 'WEAREDISCOVERED';
      expect(decodeBifid(encodeBifid(original, 'KEYWORD'), 'KEYWORD')).toBe(original);
    });

    it('長いテキストの往復変換が成功する', () => {
      const original = 'THEQUICKBROWNFOX';
      expect(decodeBifid(encodeBifid(original, 'ZEBRAS'), 'ZEBRAS')).toBe(original);
    });

    it('周期5の往復変換が成功する', () => {
      const original = 'HELLOWORLD';
      expect(decodeBifid(encodeBifid(original, 'KEY', 5), 'KEY', 5)).toBe(original);
    });

    it('周期3の往復変換が成功する', () => {
      const original = 'ABCDEFGHI';
      expect(decodeBifid(encodeBifid(original, 'KEY', 3), 'KEY', 3)).toBe(original);
    });

    it('大文字テキストで往復変換が成功する', () => {
      const original = 'FLEEATONCE';
      expect(decodeBifid(encodeBifid(original, 'BGWKZQPNDSIOAXEFCLUMTHYVR'), 'BGWKZQPNDSIOAXEFCLUMTHYVR')).toBe(
        original
      );
    });
  });
});
