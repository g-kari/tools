import { describe, it, expect } from 'vite-plus/test';
import { formatCss, minifyCss, validateCss } from '../../app/utils/css-formatter';

describe('formatCss', () => {
  it('基本的なCSSを整形する', () => {
    const input = 'div{color:red;font-size:16px;}';
    const result = formatCss(input);
    expect(result).toContain('div {');
    expect(result).toContain('  color: red;');
    expect(result).toContain('  font-size: 16px;');
    expect(result).toContain('}');
  });

  it('複数のルールを整形する', () => {
    const input = '.foo{color:red;}.bar{background:blue;}';
    const result = formatCss(input);
    expect(result).toContain('.foo {');
    expect(result).toContain('  color: red;');
    expect(result).toContain('.bar {');
    expect(result).toContain('  background: blue;');
  });

  it('インデント幅4を適用する', () => {
    const input = 'div{color:red;}';
    const result = formatCss(input, { indent: 4 });
    expect(result).toContain('    color: red;');
  });

  it('インデント幅2を適用する（デフォルト）', () => {
    const input = 'div{color:red;}';
    const result = formatCss(input);
    expect(result).toContain('  color: red;');
  });

  it('@mediaクエリを整形する', () => {
    const input = '@media(max-width:768px){.foo{color:red;}}';
    const result = formatCss(input);
    // @media条件内の : はセレクター扱いのため正規化しない
    expect(result).toContain('@media(max-width:768px) {');
    expect(result).toContain('  .foo {');
    expect(result).toContain('    color: red;');
  });

  it('コメントを保持する', () => {
    const input = '/* スタイル定義 */\ndiv{color:red;}';
    const result = formatCss(input);
    expect(result).toContain('/* スタイル定義 */');
    expect(result).toContain('div {');
  });

  it('プロパティをアルファベット順にソートする', () => {
    const input = 'div{z-index:1;background:blue;color:red;align-items:center;}';
    const result = formatCss(input, { sortProperties: true });
    const lines = result.split('\n').filter((l) => l.trim().endsWith(';'));
    expect(lines[0].trim()).toBe('align-items: center;');
    expect(lines[1].trim()).toBe('background: blue;');
    expect(lines[2].trim()).toBe('color: red;');
    expect(lines[3].trim()).toBe('z-index: 1;');
  });

  it('擬似クラスを含むセレクターを整形する', () => {
    const input = 'a:hover{color:blue;}';
    const result = formatCss(input);
    expect(result).toContain('a:hover {');
    expect(result).toContain('  color: blue;');
  });

  it('CSS変数を整形する', () => {
    const input = ':root{--primary-color:#007bff;--secondary-color:#6c757d;}';
    const result = formatCss(input);
    expect(result).toContain(':root {');
    expect(result).toContain('  --primary-color: #007bff;');
    expect(result).toContain('  --secondary-color: #6c757d;');
  });

  it('文字列リテラルを保持する', () => {
    const input = 'div{content:"hello: world";}';
    const result = formatCss(input);
    expect(result).toContain('content: "hello: world";');
  });

  it('空文字列はエラーをスローする', () => {
    expect(() => formatCss('')).toThrow('CSSデータが空です');
    expect(() => formatCss('   ')).toThrow('CSSデータが空です');
  });

  it('括弧が閉じられていない場合はエラーをスローする', () => {
    expect(() => formatCss('div{color:red;')).toThrow();
  });
});

describe('minifyCss', () => {
  it('基本的なCSSを圧縮する', () => {
    const input = 'div {\n  color: red;\n  font-size: 16px;\n}';
    const result = minifyCss(input);
    expect(result).toBe('div{color:red;font-size:16px;}');
  });

  it('コメントを除去する', () => {
    const input = '/* コメント */\ndiv { color: red; }';
    const result = minifyCss(input);
    expect(result).not.toContain('/*');
    expect(result).toContain('div{color:red;}');
  });

  it('複数のスペースを正規化する', () => {
    const input = 'div   {   color:   red;   }';
    const result = minifyCss(input);
    expect(result).toBe('div{color:red;}');
  });

  it('文字列リテラルを保持する', () => {
    const input = 'div { content: "hello world"; }';
    const result = minifyCss(input);
    expect(result).toContain('"hello world"');
  });

  it('空文字列はエラーをスローする', () => {
    expect(() => minifyCss('')).toThrow('CSSデータが空です');
  });
});

describe('validateCss', () => {
  it('有効なCSSをtrueで返す', () => {
    const result = validateCss('div { color: red; }');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('複数ルールの有効なCSSをtrueで返す', () => {
    const result = validateCss('.foo { color: red; } .bar { background: blue; }');
    expect(result.valid).toBe(true);
  });

  it('@mediaクエリの有効なCSSをtrueで返す', () => {
    const result = validateCss('@media (max-width: 768px) { div { color: red; } }');
    expect(result.valid).toBe(true);
  });

  it('閉じられていない波括弧をfalseで返す', () => {
    const result = validateCss('div { color: red;');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('波括弧');
  });

  it('余分な閉じ波括弧をfalseで返す', () => {
    const result = validateCss('div { color: red; }}');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('"}"');
  });

  it('閉じられていないコメントをfalseで返す', () => {
    const result = validateCss('/* コメント div { color: red; }');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('コメント');
  });

  it('閉じられていない文字列をfalseで返す', () => {
    const result = validateCss('div { content: "未閉じ; }');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('文字列');
  });

  it('空文字列をfalseで返す', () => {
    const result = validateCss('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('空');
  });

  it('コメントを含む有効なCSSをtrueで返す', () => {
    const result = validateCss('/* スタイル */ div { /* 色 */ color: red; }');
    expect(result.valid).toBe(true);
  });
});
