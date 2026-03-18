import { describe, expect, it } from 'vitest';
import {
  escapeJsDouble,
  escapeJsSingle,
  escapeJsTemplate,
  escapeJson,
  escapePythonDouble,
  escapePythonSingle,
  escapeRegex,
  escapeShell,
  unescapeCommon,
  escapeString,
  unescapeString,
  ESCAPE_MODES,
} from '../../app/utils/string-escape';

describe('escapeJsDouble', () => {
  it('ダブルクォートをエスケープする', () => {
    expect(escapeJsDouble('"hello"')).toBe('\\"hello\\"');
  });

  it('バックスラッシュをエスケープする', () => {
    expect(escapeJsDouble('C:\\Users')).toBe('C:\\\\Users');
  });

  it('改行をエスケープする', () => {
    expect(escapeJsDouble('line1\nline2')).toBe('line1\\nline2');
  });

  it('タブをエスケープする', () => {
    expect(escapeJsDouble('a\tb')).toBe('a\\tb');
  });

  it('キャリッジリターンをエスケープする', () => {
    expect(escapeJsDouble('a\rb')).toBe('a\\rb');
  });

  it('ヌル文字をエスケープする', () => {
    expect(escapeJsDouble('a\0b')).toBe('a\\0b');
  });

  it('シングルクォートはエスケープしない', () => {
    expect(escapeJsDouble("it's")).toBe("it's");
  });

  it('空文字列は空文字列を返す', () => {
    expect(escapeJsDouble('')).toBe('');
  });

  it('複合パターンをエスケープする', () => {
    expect(escapeJsDouble('Hello, "World"!\nNext line')).toBe('Hello, \\"World\\"!\\nNext line');
  });
});

describe('escapeJsSingle', () => {
  it('シングルクォートをエスケープする', () => {
    expect(escapeJsSingle("it's")).toBe("it\\'s");
  });

  it('ダブルクォートはエスケープしない', () => {
    expect(escapeJsSingle('"hello"')).toBe('"hello"');
  });

  it('改行をエスケープする', () => {
    expect(escapeJsSingle('line1\nline2')).toBe('line1\\nline2');
  });

  it('バックスラッシュをエスケープする', () => {
    expect(escapeJsSingle('a\\b')).toBe('a\\\\b');
  });
});

describe('escapeJsTemplate', () => {
  it('バッククォートをエスケープする', () => {
    expect(escapeJsTemplate('a`b')).toBe('a\\`b');
  });

  it('${をエスケープする', () => {
    expect(escapeJsTemplate('${name}')).toBe('\\${name}');
  });

  it('バックスラッシュをエスケープする', () => {
    expect(escapeJsTemplate('a\\b')).toBe('a\\\\b');
  });

  it('改行はエスケープしない（テンプレートリテラルでは生の改行が使える）', () => {
    expect(escapeJsTemplate('line1\nline2')).toBe('line1\nline2');
  });
});

describe('escapeJson', () => {
  it('ダブルクォートをエスケープする', () => {
    expect(escapeJson('"hello"')).toBe('\\"hello\\"');
  });

  it('改行をエスケープする', () => {
    expect(escapeJson('line1\nline2')).toBe('line1\\nline2');
  });

  it('バックスラッシュをエスケープする', () => {
    expect(escapeJson('a\\b')).toBe('a\\\\b');
  });

  it('JSON仕様通りにエスケープされる', () => {
    // JSON.stringifyの結果から外側のクォートを除いたものと一致する
    const str = 'Hello, "World"!\nTab:\there.';
    expect(escapeJson(str)).toBe(JSON.stringify(str).slice(1, -1));
  });
});

describe('escapePythonDouble', () => {
  it('ダブルクォートをエスケープする', () => {
    expect(escapePythonDouble('"hello"')).toBe('\\"hello\\"');
  });

  it('改行をエスケープする', () => {
    expect(escapePythonDouble('line1\nline2')).toBe('line1\\nline2');
  });

  it('シングルクォートはエスケープしない', () => {
    expect(escapePythonDouble("it's")).toBe("it's");
  });
});

describe('escapePythonSingle', () => {
  it('シングルクォートをエスケープする', () => {
    expect(escapePythonSingle("it's")).toBe("it\\'s");
  });

  it('ダブルクォートはエスケープしない', () => {
    expect(escapePythonSingle('"hello"')).toBe('"hello"');
  });

  it('改行をエスケープする', () => {
    expect(escapePythonSingle('line1\nline2')).toBe('line1\\nline2');
  });
});

describe('escapeRegex', () => {
  it('ドットをエスケープする', () => {
    expect(escapeRegex('a.b')).toBe('a\\.b');
  });

  it('アスタリスクをエスケープする', () => {
    expect(escapeRegex('a*b')).toBe('a\\*b');
  });

  it('全てのメタ文字をエスケープする', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('通常文字はエスケープしない', () => {
    expect(escapeRegex('hello123')).toBe('hello123');
  });

  it('メールアドレスのドットとプラスをエスケープする', () => {
    expect(escapeRegex('user+tag@example.com')).toBe('user\\+tag@example\\.com');
  });
});

describe('escapeShell', () => {
  it('シングルクォートで囲む', () => {
    expect(escapeShell('hello')).toBe("'hello'");
  });

  it('内部のシングルクォートをエスケープする', () => {
    expect(escapeShell("it's")).toBe("'it'\\''s'");
  });

  it('ダブルクォートはそのまま（シングルクォート内は安全）', () => {
    expect(escapeShell('"hello"')).toBe('\'"hello"\'');
  });

  it('ドル記号はシングルクォート内で展開されない', () => {
    expect(escapeShell('$HOME')).toBe("'$HOME'");
  });

  it('空文字列は空のシングルクォート', () => {
    expect(escapeShell('')).toBe("''");
  });
});

describe('unescapeCommon', () => {
  it('\\n を改行に変換する', () => {
    expect(unescapeCommon('line1\\nline2')).toBe('line1\nline2');
  });

  it('\\t をタブに変換する', () => {
    expect(unescapeCommon('a\\tb')).toBe('a\tb');
  });

  it('\\r をキャリッジリターンに変換する', () => {
    expect(unescapeCommon('a\\rb')).toBe('a\rb');
  });

  it('\\\\ をバックスラッシュに変換する', () => {
    expect(unescapeCommon('a\\\\b')).toBe('a\\b');
  });

  it('\\" をダブルクォートに変換する', () => {
    expect(unescapeCommon('\\"hello\\"')).toBe('"hello"');
  });

  it("\\' をシングルクォートに変換する", () => {
    expect(unescapeCommon("it\\'s")).toBe("it's");
  });

  it('\\` をバッククォートに変換する', () => {
    expect(unescapeCommon('a\\`b')).toBe('a`b');
  });

  it('\\uXXXX をUnicode文字に変換する', () => {
    expect(unescapeCommon('\\u3053\\u3093\\u306B\\u3061\\u306F')).toBe('こんにちは');
  });

  it('\\xXX を文字に変換する', () => {
    expect(unescapeCommon('\\x41\\x42\\x43')).toBe('ABC');
  });

  it('\\0 をヌル文字に変換する', () => {
    expect(unescapeCommon('a\\0b')).toBe('a\0b');
  });

  it('認識されないエスケープはそのまま残す', () => {
    expect(unescapeCommon('\\q')).toBe('\\q');
  });

  it('複合パターンをアンエスケープする', () => {
    expect(unescapeCommon('Hello, \\"World\\"!\\nNext line')).toBe('Hello, "World"!\nNext line');
  });
});

describe('escapeString (統合)', () => {
  it('各モードで正しくエスケープされる', () => {
    const str = 'a"b\'c\nd';
    expect(escapeString(str, 'js-double')).toBe('a\\"b\'c\\nd');
    expect(escapeString(str, 'js-single')).toBe("a\"b\\'c\\nd");
    expect(escapeString(str, 'json')).toBe('a\\"b\'c\\nd');
  });

  it('regexモードで正規表現メタ文字をエスケープする', () => {
    expect(escapeString('a.b*c', 'regex')).toBe('a\\.b\\*c');
  });

  it('shellモードでシングルクォートに囲む', () => {
    expect(escapeString('hello world', 'shell')).toBe("'hello world'");
  });
});

describe('unescapeString (統合)', () => {
  it('アンエスケープ対応モードでアンエスケープされる', () => {
    expect(unescapeString('Hello\\nWorld', 'js-double')).toBe('Hello\nWorld');
    expect(unescapeString('Hello\\nWorld', 'json')).toBe('Hello\nWorld');
    expect(unescapeString('Hello\\nWorld', 'python-double')).toBe('Hello\nWorld');
  });

  it('アンエスケープ非対応モードは入力をそのまま返す', () => {
    expect(unescapeString('Hello\\nWorld', 'regex')).toBe('Hello\\nWorld');
    expect(unescapeString('Hello\\nWorld', 'shell')).toBe('Hello\\nWorld');
  });
});

describe('往復変換', () => {
  const testStrings = [
    'Hello, "World"!',
    "it's a test",
    'line1\nline2\nline3',
    'C:\\Users\\user\\Documents',
    'Tab\there',
    'こんにちは世界',
  ];

  it('js-doubleモードで往復変換できる', () => {
    for (const str of testStrings) {
      const escaped = escapeString(str, 'js-double');
      const restored = unescapeCommon(escaped);
      expect(restored).toBe(str);
    }
  });

  it('js-singleモードで往復変換できる', () => {
    for (const str of testStrings) {
      const escaped = escapeString(str, 'js-single');
      const restored = unescapeCommon(escaped);
      expect(restored).toBe(str);
    }
  });

  it('jsonモードで往復変換できる', () => {
    for (const str of testStrings) {
      const escaped = escapeString(str, 'json');
      const restored = unescapeCommon(escaped);
      expect(restored).toBe(str);
    }
  });
});

describe('ESCAPE_MODES定数', () => {
  it('全モードが定義されている', () => {
    const ids = ESCAPE_MODES.map((m) => m.id);
    expect(ids).toContain('js-double');
    expect(ids).toContain('js-single');
    expect(ids).toContain('js-template');
    expect(ids).toContain('json');
    expect(ids).toContain('python-double');
    expect(ids).toContain('python-single');
    expect(ids).toContain('regex');
    expect(ids).toContain('shell');
  });

  it('各モードにlabelとdescriptionが設定されている', () => {
    for (const m of ESCAPE_MODES) {
      expect(m.label).toBeTruthy();
      expect(m.description).toBeTruthy();
    }
  });

  it('regexとshellはアンエスケープ非対応', () => {
    const regex = ESCAPE_MODES.find((m) => m.id === 'regex');
    const shell = ESCAPE_MODES.find((m) => m.id === 'shell');
    expect(regex?.supportsUnescape).toBe(false);
    expect(shell?.supportsUnescape).toBe(false);
  });

  it('JS・JSON・PythonモードはアンエスケープFに対応している', () => {
    const supportedModes = ['js-double', 'js-single', 'js-template', 'json', 'python-double', 'python-single'];
    for (const id of supportedModes) {
      const m = ESCAPE_MODES.find((m) => m.id === id);
      expect(m?.supportsUnescape).toBe(true);
    }
  });
});
