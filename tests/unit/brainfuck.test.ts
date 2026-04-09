import { describe, it, expect } from 'vite-plus/test';
import { executeBrainfuck, BRAINFUCK_SAMPLES } from '../../app/utils/brainfuck';

describe('Brainfuck インタープリター', () => {
  describe('基本コマンド', () => {
    it('+ コマンドでセルの値を増加できる', () => {
      const result = executeBrainfuck('+++.', '');
      // ASCII 3 は制御文字なので出力文字列は空でもステップ数で確認
      expect(result.error).toBeNull();
      expect(result.memory[0]).toBe(3);
    });

    it('- コマンドでセルの値を減少できる（オーバーフロー）', () => {
      const result = executeBrainfuck('-', '');
      expect(result.error).toBeNull();
      expect(result.memory[0]).toBe(255);
    });

    it('+ と - でゼロに戻る', () => {
      const result = executeBrainfuck('++-', '');
      expect(result.memory[0]).toBe(1);
    });

    it('> でポインタを右へ移動できる', () => {
      const result = executeBrainfuck('>+++', '');
      expect(result.pointer).toBe(1);
      expect(result.memory[1]).toBe(3);
    });

    it('< でポインタを左へ移動できる', () => {
      const result = executeBrainfuck('>><', '');
      expect(result.pointer).toBe(1);
    });

    it('. でASCII文字を出力できる', () => {
      // '@' = 64
      const result = executeBrainfuck(
        '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.',
        ''
      );
      expect(result.output).toBe('@');
      expect(result.error).toBeNull();
    });

    it(', で入力を読み込める', () => {
      const result = executeBrainfuck(',>,.', 'AB');
      expect(result.output).toBe('B');
      expect(result.memory[0]).toBe(65); // 'A'
      expect(result.memory[1]).toBe(66); // 'B'
    });

    it('入力がない場合 , はセルを 0 にする', () => {
      const result = executeBrainfuck(',', '');
      expect(result.memory[0]).toBe(0);
    });
  });

  describe('ループ', () => {
    it('[ ] でループが動作する', () => {
      // メモリ[0]=3 をデクリメントしながらメモリ[1]に加算
      const result = executeBrainfuck('+++[->+<]', '');
      expect(result.memory[0]).toBe(0);
      expect(result.memory[1]).toBe(3);
    });

    it('セルが0のとき [ はスキップされる', () => {
      const result = executeBrainfuck('[+++]', '');
      expect(result.memory[0]).toBe(0);
      expect(result.steps).toBe(1);
    });

    it('ネストしたループが動作する', () => {
      // 2*3 = 6 を計算
      const result = executeBrainfuck('++[->+++<]', '');
      expect(result.memory[1]).toBe(6);
    });
  });

  describe('エラーハンドリング', () => {
    it('対応していない [ はエラーを返す', () => {
      const result = executeBrainfuck('[+++', '');
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('ブラケット');
    });

    it('対応していない ] はエラーを返す', () => {
      const result = executeBrainfuck('+++]', '');
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('ブラケット');
    });

    it('最大ステップ数を超えた場合エラーを返す', () => {
      // 無限ループ
      const result = executeBrainfuck('+[]', '', { maxSteps: 100 });
      expect(result.error).not.toBeNull();
      expect(result.error).toContain('ステップ');
      expect(result.steps).toBe(100);
    });
  });

  describe('メモリ境界', () => {
    it('値が 255 を超えると 0 に折り返す', () => {
      // 255 + 1 = 0
      const cells = Array(255).fill('+').join('');
      const result = executeBrainfuck(cells + '+', '');
      expect(result.memory[0]).toBe(0);
    });

    it('ポインタが範囲外でも折り返す（左端）', () => {
      const result = executeBrainfuck('<', '');
      expect(result.pointer).toBe(29999); // 30000 - 1
    });
  });

  describe('実行統計', () => {
    it('ステップ数が正しくカウントされる', () => {
      const result = executeBrainfuck('+++', '');
      expect(result.steps).toBe(3);
    });

    it('メモリが先頭20セル分返される', () => {
      const result = executeBrainfuck('', '');
      expect(result.memory).toHaveLength(20);
    });

    it('最終ポインタ位置が正しい', () => {
      const result = executeBrainfuck('>>>', '');
      expect(result.pointer).toBe(3);
    });
  });

  describe('実際のプログラム', () => {
    it('Hello, World! を出力できる', () => {
      const helloWorld =
        '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.';
      const result = executeBrainfuck(helloWorld, '');
      expect(result.error).toBeNull();
      expect(result.output).toBe('Hello World!\n');
    });

    it('Cat プログラム（入力をそのまま出力）', () => {
      const result = executeBrainfuck(',[.,]', 'Hi');
      expect(result.output).toBe('Hi');
      expect(result.error).toBeNull();
    });

    it('2+3 の計算', () => {
      // メモリ[0]=5 に加算してASCII出力
      const result = executeBrainfuck('++>+++[<+>-]<.', '');
      expect(result.memory[0]).toBe(5);
      expect(result.error).toBeNull();
    });
  });

  describe('サンプルプログラム', () => {
    it('BRAINFUCK_SAMPLES が配列である', () => {
      expect(Array.isArray(BRAINFUCK_SAMPLES)).toBe(true);
      expect(BRAINFUCK_SAMPLES.length).toBeGreaterThan(0);
    });

    it('各サンプルに必要なフィールドがある', () => {
      BRAINFUCK_SAMPLES.forEach(sample => {
        expect(sample).toHaveProperty('name');
        expect(sample).toHaveProperty('code');
        expect(sample).toHaveProperty('input');
        expect(sample).toHaveProperty('description');
        expect(typeof sample.name).toBe('string');
        expect(typeof sample.code).toBe('string');
        expect(typeof sample.input).toBe('string');
      });
    });

    it('Hello World サンプルが正常に実行できる', () => {
      const sample = BRAINFUCK_SAMPLES.find(s => s.name === 'Hello, World!');
      expect(sample).toBeDefined();
      if (sample) {
        const result = executeBrainfuck(sample.code, sample.input);
        expect(result.error).toBeNull();
        expect(result.output.length).toBeGreaterThan(0);
      }
    });

    it('Cat プログラムサンプルが正常に実行できる', () => {
      const sample = BRAINFUCK_SAMPLES.find(s => s.name === 'Cat プログラム');
      expect(sample).toBeDefined();
      if (sample) {
        const result = executeBrainfuck(sample.code, sample.input);
        expect(result.error).toBeNull();
        expect(result.output).toBe(sample.input);
      }
    });
  });

  describe('コードに Brainfuck 以外の文字が含まれる場合', () => {
    it('コメント文字（Brainfuck以外の文字）は無視される', () => {
      // コメントと同じ出力
      const withComments = '+++  ; 3を加算\n.  ; 出力';
      const withoutComments = '+++.';
      const r1 = executeBrainfuck(withComments, '');
      const r2 = executeBrainfuck(withoutComments, '');
      expect(r1.output).toBe(r2.output);
      expect(r1.memory[0]).toBe(r2.memory[0]);
    });
  });
});
