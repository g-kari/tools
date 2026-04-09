import { describe, it, expect } from 'vite-plus/test';
import { yamlToToml, tomlToYaml } from '../../app/utils/yaml-toml';

describe('yamlToToml', () => {
  it('基本的な YAML を TOML に変換する', () => {
    const yaml = 'name: my-app\nversion: "1.0.0"';
    const result = yamlToToml(yaml);
    expect(result).toContain('name = "my-app"');
    expect(result).toContain('version = "1.0.0"');
  });

  it('ネストされた YAML を TOML に変換する', () => {
    const yaml = 'package:\n  name: foo\n  version: "0.1.0"';
    const result = yamlToToml(yaml);
    expect(result).toContain('[package]');
    expect(result).toContain('name = "foo"');
  });

  it('配列を変換する', () => {
    const yaml = 'features:\n  - serde\n  - tokio';
    const result = yamlToToml(yaml);
    expect(result).toContain('features');
    expect(result).toContain('serde');
  });

  it('空文字列はエラーを投げる', () => {
    expect(() => yamlToToml('')).toThrow();
    expect(() => yamlToToml('   ')).toThrow();
  });

  it('配列ルートはエラーを投げる', () => {
    expect(() => yamlToToml('- a\n- b')).toThrow();
  });

  it('スカラールートはエラーを投げる', () => {
    expect(() => yamlToToml('hello')).toThrow();
  });

  it('Cargo.toml スタイルのデータを変換できる', () => {
    const yaml = `package:\n  name: my-crate\n  version: "0.1.0"\n  edition: "2021"`;
    const result = yamlToToml(yaml);
    expect(result).toContain('[package]');
    expect(result).toContain('edition = "2021"');
  });
});

describe('tomlToYaml', () => {
  it('基本的な TOML を YAML に変換する', () => {
    const toml = '[package]\nname = "my-app"\nversion = "1.0.0"';
    const result = tomlToYaml(toml);
    expect(result).toContain('package:');
    expect(result).toContain('name: my-app');
  });

  it('配列を変換する', () => {
    const toml = '[deps]\nlist = ["a", "b", "c"]';
    const result = tomlToYaml(toml);
    expect(result).toContain('- a');
  });

  it('空文字列はエラーを投げる', () => {
    expect(() => tomlToYaml('')).toThrow();
    expect(() => tomlToYaml('  ')).toThrow();
  });

  it('不正な TOML はエラーを投げる', () => {
    expect(() => tomlToYaml('[ invalid toml !!!')).toThrow();
  });

  it('数値・真偽値を変換する', () => {
    const toml = 'count = 42\nflag = true';
    const result = tomlToYaml(toml);
    expect(result).toContain('42');
    expect(result).toContain('true');
  });
});

describe('ラウンドトリップ', () => {
  it('YAML → TOML → YAML で元のデータが保持される', () => {
    const yaml = 'name: test\nvalue: "hello"';
    const toml = yamlToToml(yaml);
    const back = tomlToYaml(toml);
    expect(back).toContain('name: test');
    expect(back).toContain('hello');
  });

  it('TOML → YAML → TOML で元のデータが保持される', () => {
    const toml = '[server]\nhost = "localhost"\nport = 8080';
    const yml = tomlToYaml(toml);
    const back = yamlToToml(yml);
    expect(back).toContain('host = "localhost"');
    expect(back).toContain('8080');
  });
});
