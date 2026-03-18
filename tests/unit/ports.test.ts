import { describe, it, expect } from 'vitest';
import {
  PORT_DATABASE,
  filterPorts,
  getCategoryLabel,
  getCategoryClass,
  getPortRange,
  type PortCategory,
  type PortProtocol,
} from '../../app/utils/ports';

describe('PORT_DATABASE', () => {
  it('エントリが存在すること', () => {
    expect(PORT_DATABASE.length).toBeGreaterThan(0);
  });

  it('各エントリに必須フィールドがあること', () => {
    for (const entry of PORT_DATABASE) {
      expect(typeof entry.port).toBe('number');
      expect(entry.port).toBeGreaterThanOrEqual(0);
      expect(entry.port).toBeLessThanOrEqual(65535);
      expect(typeof entry.service).toBe('string');
      expect(entry.service.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
      expect(['TCP', 'UDP', 'TCP/UDP']).toContain(entry.protocol);
      expect(['web', 'email', 'database', 'security', 'messaging', 'development', 'network', 'remote', 'file']).toContain(entry.category);
    }
  });

  it('主要ポートが含まれていること', () => {
    const portNumbers = PORT_DATABASE.map((e) => e.port);
    // Web
    expect(portNumbers).toContain(80);
    expect(portNumbers).toContain(443);
    // SSH
    expect(portNumbers).toContain(22);
    // DNS
    expect(portNumbers).toContain(53);
    // メール
    expect(portNumbers).toContain(25);
    expect(portNumbers).toContain(587);
    expect(portNumbers).toContain(993);
    // データベース
    expect(portNumbers).toContain(3306);
    expect(portNumbers).toContain(5432);
    expect(portNumbers).toContain(6379);
    expect(portNumbers).toContain(27017);
  });
});

describe('filterPorts', () => {
  it('クエリ・カテゴリ・プロトコルがすべて "all" の場合、全件返すこと', () => {
    const result = filterPorts(PORT_DATABASE, '', 'all', 'all');
    expect(result).toHaveLength(PORT_DATABASE.length);
  });

  it('ポート番号で検索できること', () => {
    const result = filterPorts(PORT_DATABASE, '443', 'all', 'all');
    expect(result.some((e) => e.port === 443)).toBe(true);
  });

  it('サービス名で検索できること', () => {
    const result = filterPorts(PORT_DATABASE, 'ssh', 'all', 'all');
    expect(result.some((e) => e.service.toLowerCase().includes('ssh'))).toBe(true);
  });

  it('説明文で検索できること', () => {
    const result = filterPorts(PORT_DATABASE, 'Redis', 'all', 'all');
    expect(result.some((e) => e.port === 6379)).toBe(true);
  });

  it('カテゴリフィルタが機能すること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'database', 'all');
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.category).toBe('database');
    }
  });

  it('web カテゴリに HTTP と HTTPS が含まれること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'web', 'all');
    const ports = result.map((e) => e.port);
    expect(ports).toContain(80);
    expect(ports).toContain(443);
  });

  it('email カテゴリに SMTP・IMAP が含まれること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'email', 'all');
    const ports = result.map((e) => e.port);
    expect(ports).toContain(25);
    expect(ports).toContain(587);
    expect(ports).toContain(993);
  });

  it('TCP プロトコルフィルタが機能すること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'all', 'TCP');
    for (const entry of result) {
      expect(entry.protocol).toBe('TCP');
    }
  });

  it('UDP プロトコルフィルタが機能すること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'all', 'UDP');
    for (const entry of result) {
      expect(entry.protocol).toBe('UDP');
    }
  });

  it('カテゴリとプロトコルを組み合わせてフィルタできること', () => {
    const result = filterPorts(PORT_DATABASE, '', 'network', 'UDP');
    for (const entry of result) {
      expect(entry.category).toBe('network');
      expect(entry.protocol).toBe('UDP');
    }
  });

  it('存在しないキーワードでは空配列を返すこと', () => {
    const result = filterPorts(PORT_DATABASE, 'xyzxyzxyz_notexist_99999', 'all', 'all');
    expect(result).toHaveLength(0);
  });

  it('大文字小文字を区別せずに検索できること', () => {
    const lower = filterPorts(PORT_DATABASE, 'redis', 'all', 'all');
    const upper = filterPorts(PORT_DATABASE, 'REDIS', 'all', 'all');
    expect(lower.length).toBeGreaterThan(0);
    expect(lower.length).toBe(upper.length);
  });
});

describe('getCategoryLabel', () => {
  it('"all" は "すべて" を返すこと', () => {
    expect(getCategoryLabel('all')).toBe('すべて');
  });

  it('各カテゴリの日本語ラベルが存在すること', () => {
    const categories: Array<PortCategory | 'all'> = [
      'all', 'web', 'email', 'database', 'security',
      'messaging', 'development', 'network', 'remote', 'file',
    ];
    for (const cat of categories) {
      const label = getCategoryLabel(cat);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('各カテゴリが重複しないラベルを返すこと', () => {
    const categories: Array<PortCategory | 'all'> = [
      'web', 'email', 'database', 'security',
      'messaging', 'development', 'network', 'remote', 'file',
    ];
    const labels = categories.map(getCategoryLabel);
    const unique = new Set(labels);
    expect(unique.size).toBe(categories.length);
  });
});

describe('getCategoryClass', () => {
  it('正しい CSS クラス名を返すこと', () => {
    expect(getCategoryClass('web')).toBe('ports-cat-web');
    expect(getCategoryClass('database')).toBe('ports-cat-database');
    expect(getCategoryClass('security')).toBe('ports-cat-security');
    expect(getCategoryClass('network')).toBe('ports-cat-network');
  });
});

describe('getPortRange', () => {
  it('ウェルノウンポート（0–1023）を識別すること', () => {
    expect(getPortRange(0)).toContain('ウェルノウン');
    expect(getPortRange(80)).toContain('ウェルノウン');
    expect(getPortRange(1023)).toContain('ウェルノウン');
  });

  it('登録済みポート（1024–49151）を識別すること', () => {
    expect(getPortRange(1024)).toContain('登録済み');
    expect(getPortRange(3306)).toContain('登録済み');
    expect(getPortRange(49151)).toContain('登録済み');
  });

  it('ダイナミックポート（49152–65535）を識別すること', () => {
    expect(getPortRange(49152)).toContain('ダイナミック');
    expect(getPortRange(65535)).toContain('ダイナミック');
  });

  it('範囲外の値には "不明" を返すこと', () => {
    expect(getPortRange(-1)).toBe('不明');
    expect(getPortRange(65536)).toBe('不明');
  });
});
