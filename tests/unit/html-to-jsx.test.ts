import { describe, it, expect } from 'vitest';
import {
  convertHtmlToJsx,
  cssPropertyToCamelCase,
  convertStyleValue,
  convertEventName,
} from '../../app/utils/html-to-jsx';

describe('cssPropertyToCamelCase', () => {
  it('kebab-caseをcamelCaseに変換する', () => {
    expect(cssPropertyToCamelCase('font-size')).toBe('fontSize');
    expect(cssPropertyToCamelCase('background-color')).toBe('backgroundColor');
    expect(cssPropertyToCamelCase('margin-top')).toBe('marginTop');
    expect(cssPropertyToCamelCase('border-bottom-width')).toBe('borderBottomWidth');
  });

  it('単一単語はそのまま返す', () => {
    expect(cssPropertyToCamelCase('color')).toBe('color');
    expect(cssPropertyToCamelCase('display')).toBe('display');
  });

  it('ベンダープレフィックスを正しく変換する', () => {
    expect(cssPropertyToCamelCase('-webkit-transform')).toBe('WebkitTransform');
    expect(cssPropertyToCamelCase('-moz-user-select')).toBe('MozUserSelect');
  });
});

describe('convertStyleValue', () => {
  it('単一プロパティを変換する', () => {
    expect(convertStyleValue('color: red')).toBe("{{ color: 'red' }}");
  });

  it('複数プロパティを変換する', () => {
    expect(convertStyleValue('color: red; font-size: 14px')).toBe(
      "{{ color: 'red', fontSize: '14px' }}"
    );
  });

  it('純粋な数値はクォートなしで出力する', () => {
    expect(convertStyleValue('z-index: 10')).toBe('{{ zIndex: 10 }}');
  });

  it('ケバブケースのプロパティ名をcamelCaseに変換する', () => {
    expect(convertStyleValue('margin-top: 8px; background-color: blue')).toBe(
      "{{ marginTop: '8px', backgroundColor: 'blue' }}"
    );
  });

  it('末尾のセミコロンを無視する', () => {
    expect(convertStyleValue('color: red;')).toBe("{{ color: 'red' }}");
  });
});

describe('convertEventName', () => {
  it('HTMLイベント名をJSXのcamelCaseに変換する', () => {
    expect(convertEventName('onclick')).toBe('onClick');
    expect(convertEventName('onchange')).toBe('onChange');
    expect(convertEventName('onsubmit')).toBe('onSubmit');
    expect(convertEventName('onmouseenter')).toBe('onMouseenter');
  });

  it('onで始まらない名前はそのまま返す', () => {
    expect(convertEventName('disabled')).toBe('disabled');
    expect(convertEventName('class')).toBe('class');
  });
});

describe('convertHtmlToJsx', () => {
  describe('class属性の変換', () => {
    it('classをclassNameに変換する', () => {
      const { output } = convertHtmlToJsx('<div class="foo">');
      expect(output).toBe('<div className="foo">');
    });

    it('複数のclass属性をすべて変換する', () => {
      const { output } = convertHtmlToJsx(
        '<div class="a"><span class="b"></span></div>'
      );
      expect(output).toContain('className="a"');
      expect(output).toContain('className="b"');
    });

    it('変更点リストにclassが含まれる', () => {
      const { changes } = convertHtmlToJsx('<div class="foo">');
      const change = changes.find((c) => c.type === 'class');
      expect(change).toBeDefined();
      expect(change?.count).toBe(1);
    });
  });

  describe('for属性の変換', () => {
    it('forをhtmlForに変換する', () => {
      const { output } = convertHtmlToJsx('<label for="name-input">');
      expect(output).toBe('<label htmlFor="name-input">');
    });

    it('変更点リストにforが含まれる', () => {
      const { changes } = convertHtmlToJsx('<label for="name">');
      const change = changes.find((c) => c.type === 'for');
      expect(change).toBeDefined();
    });
  });

  describe('イベントハンドラの変換', () => {
    it('onclickをonClickに変換する', () => {
      const { output } = convertHtmlToJsx('<button onclick="fn()">');
      expect(output).toContain('onClick="fn()"');
    });

    it('onchangeをonChangeに変換する', () => {
      const { output } = convertHtmlToJsx('<input onchange="fn()">');
      expect(output).toContain('onChange="fn()"');
    });

    it('onsubmitをonSubmitに変換する', () => {
      const { output } = convertHtmlToJsx('<form onsubmit="fn()">');
      expect(output).toContain('onSubmit="fn()"');
    });

    it('変更点リストにeventが含まれる', () => {
      const { changes } = convertHtmlToJsx('<button onclick="fn()">');
      const change = changes.find((c) => c.type === 'event');
      expect(change).toBeDefined();
    });
  });

  describe('属性名の変換', () => {
    it('tabindexをtabIndexに変換する', () => {
      const { output } = convertHtmlToJsx('<div tabindex="0">');
      expect(output).toContain('tabIndex="0"');
    });

    it('readonlyをreadOnlyに変換する', () => {
      const { output } = convertHtmlToJsx('<input readonly>');
      expect(output).toContain('readOnly');
    });

    it('maxlengthをmaxLengthに変換する', () => {
      const { output } = convertHtmlToJsx('<input maxlength="50">');
      expect(output).toContain('maxLength="50"');
    });

    it('crossoriginをcrossOriginに変換する', () => {
      const { output } = convertHtmlToJsx('<img crossorigin="anonymous">');
      expect(output).toContain('crossOrigin="anonymous"');
    });
  });

  describe('void要素の自己閉じ', () => {
    it('<br>を<br />に変換する', () => {
      const { output } = convertHtmlToJsx('<br>');
      expect(output).toBe('<br />');
    });

    it('<hr>を<hr />に変換する', () => {
      const { output } = convertHtmlToJsx('<hr>');
      expect(output).toBe('<hr />');
    });

    it('<img>を<img />に変換する', () => {
      const { output } = convertHtmlToJsx('<img src="x.png" alt="test">');
      expect(output).toBe('<img src="x.png" alt="test" />');
    });

    it('<input>を<input />に変換する', () => {
      const { output } = convertHtmlToJsx('<input type="text">');
      expect(output).toBe('<input type="text" />');
    });

    it('既に自己閉じになっているものはそのまま', () => {
      const { output } = convertHtmlToJsx('<br />');
      expect(output).toBe('<br />');
    });

    it('変更点リストにvoidが含まれる', () => {
      const { changes } = convertHtmlToJsx('<br>');
      const change = changes.find((c) => c.type === 'void');
      expect(change).toBeDefined();
    });
  });

  describe('style属性の変換', () => {
    it('style文字列をオブジェクト記法に変換する', () => {
      const { output } = convertHtmlToJsx('<div style="color: red">');
      expect(output).toContain("style={{ color: 'red' }}");
    });

    it('複数のCSSプロパティを変換する', () => {
      const { output } = convertHtmlToJsx(
        '<p style="font-size: 14px; margin-top: 8px">'
      );
      expect(output).toContain("fontSize: '14px'");
      expect(output).toContain("marginTop: '8px'");
    });

    it('変更点リストにstyleが含まれる', () => {
      const { changes } = convertHtmlToJsx('<div style="color: red">');
      const change = changes.find((c) => c.type === 'style');
      expect(change).toBeDefined();
    });
  });

  describe('HTMLコメントの変換', () => {
    it('HTMLコメントをJSXコメントに変換する', () => {
      const { output } = convertHtmlToJsx('<!-- これはコメントです -->');
      expect(output).toBe('{/* これはコメントです */}');
    });

    it('変更点リストにcommentが含まれる', () => {
      const { changes } = convertHtmlToJsx('<!-- comment -->');
      const change = changes.find((c) => c.type === 'comment');
      expect(change).toBeDefined();
    });
  });

  describe('変更点リストの集計', () => {
    it('変換なしの場合は空配列を返す', () => {
      const { changes } = convertHtmlToJsx('<div id="main">テキスト</div>');
      expect(changes).toHaveLength(0);
    });

    it('複数の変換が行われた場合は各エントリを返す', () => {
      const { changes } = convertHtmlToJsx(
        '<div class="foo" onclick="fn()"><br></div>'
      );
      expect(changes.find((c) => c.type === 'class')).toBeDefined();
      expect(changes.find((c) => c.type === 'event')).toBeDefined();
      expect(changes.find((c) => c.type === 'void')).toBeDefined();
    });

    it('件数が正しく集計される', () => {
      const { changes } = convertHtmlToJsx(
        '<div class="a"><span class="b"></span></div>'
      );
      const classChange = changes.find((c) => c.type === 'class');
      expect(classChange?.count).toBe(2);
    });
  });

  describe('複合テスト', () => {
    it('複数の変換ルールが同時に適用される', () => {
      const html =
        '<div class="container" onclick="fn()"><br><img src="x.png" alt="img"></div>';
      const { output, changes } = convertHtmlToJsx(html);
      expect(output).toContain('className="container"');
      expect(output).toContain('onClick="fn()"');
      expect(output).toContain('<br />');
      expect(output).toContain('<img src="x.png" alt="img" />');
      expect(changes.length).toBeGreaterThan(0);
    });

    it('変換不要な属性は変更されない', () => {
      const html = '<div id="main" data-value="test">';
      const { output, changes } = convertHtmlToJsx(html);
      expect(output).toContain('id="main"');
      expect(output).toContain('data-value="test"');
      expect(changes).toHaveLength(0);
    });

    it('空文字列を渡した場合は空文字列を返す', () => {
      const { output, changes } = convertHtmlToJsx('');
      expect(output).toBe('');
      expect(changes).toHaveLength(0);
    });
  });
});
