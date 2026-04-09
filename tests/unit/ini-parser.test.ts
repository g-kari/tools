import { describe, it, expect } from 'vite-plus/test';
import {
  parseIni,
  formatIni,
  iniToJson,
  jsonToIni,
  calcIniStats,
} from '../../app/utils/ini-parser';

describe('parseIni', () => {
  describe('基本的なパース', () => {
    it('空文字列はデータなしを返す', () => {
      const result = parseIni('');
      expect(result.errors).toHaveLength(0);
    });

    it('単純なキー・値をパースする', () => {
      const result = parseIni('name = Alice\nage = 30');
      expect(result.errors).toHaveLength(0);
      expect(result.data['']['name']).toBe('Alice');
      expect(result.data['']['age']).toBe('30');
    });

    it('コロン区切りをパースする', () => {
      const result = parseIni('key: value');
      expect(result.data['']['key']).toBe('value');
    });

    it('セクション付きのINIをパースする', () => {
      const ini = `
[database]
host = localhost
port = 5432

[app]
debug = true
`;
      const result = parseIni(ini);
      expect(result.errors).toHaveLength(0);
      expect(result.data['database']['host']).toBe('localhost');
      expect(result.data['database']['port']).toBe('5432');
      expect(result.data['app']['debug']).toBe('true');
    });

    it('前後の空白をトリムする', () => {
      const result = parseIni('  key  =  value  ');
      expect(result.data['']['key']).toBe('value');
    });
  });

  describe('コメント処理', () => {
    it('セミコロンコメントをスキップする', () => {
      const result = parseIni('; This is a comment\nkey = value');
      expect(result.data['']['key']).toBe('value');
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].text).toBe('; This is a comment');
    });

    it('ハッシュコメントをスキップする', () => {
      const result = parseIni('# comment\nkey = value');
      expect(result.data['']['key']).toBe('value');
      expect(result.comments[0].text).toBe('# comment');
    });

    it('インラインコメントを除去する', () => {
      const result = parseIni('key = value ; inline comment');
      expect(result.data['']['key']).toBe('value');
    });
  });

  describe('引用符処理', () => {
    it('ダブルクォートを除去する', () => {
      const result = parseIni('key = "hello world"');
      expect(result.data['']['key']).toBe('hello world');
    });

    it('シングルクォートを除去する', () => {
      const result = parseIni("key = 'hello world'");
      expect(result.data['']['key']).toBe('hello world');
    });

    it('引用符なしの値をそのまま返す', () => {
      const result = parseIni('key = hello world');
      expect(result.data['']['key']).toBe('hello world');
    });
  });

  describe('マルチバリュー', () => {
    it('multiValue=true で重複キーを配列にする', () => {
      const result = parseIni('key = a\nkey = b\nkey = c', { multiValue: true });
      expect(Array.isArray(result.data['']['key'])).toBe(true);
      expect(result.data['']['key']).toEqual(['a', 'b', 'c']);
    });

    it('multiValue=false (デフォルト) で最後の値を使う', () => {
      const result = parseIni('key = a\nkey = b');
      expect(result.data['']['key']).toBe('b');
    });
  });

  describe('エラー処理', () => {
    it('空セクション名はエラーを返す', () => {
      const result = parseIni('[] \nkey = value');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('解析できない行はエラーを返す', () => {
      const result = parseIni('!!!invalid!!!');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('実用的なINI例', () => {
    it('php.ini風のINIをパースする', () => {
      const phpIni = `
; PHP Configuration
[PHP]
engine = On
max_execution_time = 30
memory_limit = 128M

[Date]
date.timezone = Asia/Tokyo
`;
      const result = parseIni(phpIni);
      expect(result.errors).toHaveLength(0);
      expect(result.data['PHP']['memory_limit']).toBe('128M');
      expect(result.data['Date']['date.timezone']).toBe('Asia/Tokyo');
    });

    it('.gitconfig風のINIをパースする', () => {
      const gitConfig = `
[user]
  name = John Doe
  email = john@example.com

[core]
  autocrlf = false
  editor = vim
`;
      const result = parseIni(gitConfig);
      expect(result.errors).toHaveLength(0);
      expect(result.data['user']['name']).toBe('John Doe');
      expect(result.data['core']['editor']).toBe('vim');
    });
  });
});

describe('formatIni', () => {
  it('基本的なINIデータをフォーマットする', () => {
    const data = {
      database: { host: 'localhost', port: '5432' },
      app: { debug: 'true' },
    };
    const result = formatIni(data);
    expect(result).toContain('[database]');
    expect(result).toContain('host = localhost');
    expect(result).toContain('[app]');
    expect(result).toContain('debug = true');
  });

  it('グローバルセクション（空キー）はヘッダーなしで出力する', () => {
    const data = { '': { key: 'value' } };
    const result = formatIni(data);
    expect(result).toContain('key = value');
    expect(result).not.toContain('[]');
  });

  it('セパレーターをカスタマイズできる', () => {
    const data = { '': { key: 'value' } };
    const result = formatIni(data, { separator: '=' });
    expect(result).toContain('key=value');
  });

  it('配列値を複数行で出力する', () => {
    const data = { '': { key: ['a', 'b', 'c'] } };
    const result = formatIni(data);
    const lines = result.split('\n');
    const keyLines = lines.filter((l) => l.startsWith('key'));
    expect(keyLines).toHaveLength(3);
  });
});

describe('iniToJson', () => {
  it('INIデータをJSONオブジェクトに変換する', () => {
    const data = {
      database: { host: 'localhost', port: '5432' },
    };
    const json = iniToJson(data);
    expect(json['database']).toEqual({ host: 'localhost', port: '5432' });
  });

  it('グローバルセクションをトップレベルに展開する', () => {
    const data = {
      '': { globalKey: 'globalValue' },
      section: { key: 'value' },
    };
    const json = iniToJson(data);
    expect(json['globalKey']).toBe('globalValue');
    expect(json['section']).toEqual({ key: 'value' });
  });

  it('includeGlobal=false でグローバルセクションを除外する', () => {
    const data = {
      '': { globalKey: 'globalValue' },
      section: { key: 'value' },
    };
    const json = iniToJson(data, false);
    expect(json['globalKey']).toBeUndefined();
    expect(json['section']).toBeDefined();
  });
});

describe('jsonToIni', () => {
  it('JSONオブジェクトをINIデータに変換する', () => {
    const json = {
      database: { host: 'localhost', port: '5432' },
    };
    const data = jsonToIni(json);
    expect(data['database']['host']).toBe('localhost');
    expect(data['database']['port']).toBe('5432');
  });

  it('プリミティブ値をグローバルセクションに配置する', () => {
    const json = { key: 'value', num: 42 };
    const data = jsonToIni(json as Record<string, unknown>);
    expect(data['']['key']).toBe('value');
    expect(data['']['num']).toBe('42');
  });

  it('配列値をグローバルセクションのマルチバリューにする', () => {
    const json = { tags: ['a', 'b', 'c'] };
    const data = jsonToIni(json as Record<string, unknown>);
    expect(Array.isArray(data['']['tags'])).toBe(true);
    expect(data['']['tags']).toEqual(['a', 'b', 'c']);
  });

  it('null値を空文字列に変換する', () => {
    const json = { key: null };
    const data = jsonToIni(json as Record<string, unknown>);
    expect(data['']['key']).toBe('');
  });
});

describe('calcIniStats', () => {
  it('セクション数・キー数・コメント数を計算する', () => {
    const ini = `
; comment
[section1]
key1 = val1
key2 = val2

[section2]
key3 = val3
`;
    const result = parseIni(ini);
    const stats = calcIniStats(result);
    expect(stats.sectionCount).toBe(2);
    expect(stats.totalKeys).toBe(3);
    expect(stats.commentCount).toBe(1);
    expect(stats.sectionKeyCounts['section1']).toBe(2);
    expect(stats.sectionKeyCounts['section2']).toBe(1);
  });

  it('グローバルセクションのキーをカウントする', () => {
    const result = parseIni('key1 = a\nkey2 = b');
    const stats = calcIniStats(result);
    expect(stats.totalKeys).toBe(2);
    expect(stats.sectionKeyCounts['(グローバル)']).toBe(2);
  });
});
