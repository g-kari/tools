/**
 * package.json ビルダー ユーティリティ
 *
 * npm パッケージの package.json を生成するユーティリティ関数群。
 * 基本情報・scripts・keywords・エントリポイント設定に対応。
 */

/** package.json の author フィールド */
export interface PackageAuthor {
  /** 作者名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** URL */
  url: string;
}

/** scripts セクションの個別エントリ */
export interface ScriptEntry {
  /** スクリプト名（キー） */
  key: string;
  /** スクリプトコマンド（値） */
  value: string;
}

/** package.json の設定インターフェース */
export interface PackageJsonConfig {
  /** 基本情報 */
  basic: {
    /** パッケージ名 */
    name: string;
    /** バージョン */
    version: string;
    /** 説明 */
    description: string;
    /** 作者情報 */
    author: PackageAuthor;
    /** ライセンス */
    license: string;
    /** プライベートパッケージか */
    private: boolean;
    /** モジュール形式 */
    type: 'commonjs' | 'module' | '';
  };
  /** エントリポイント */
  entries: {
    /** main フィールド */
    main: string;
    /** module フィールド（ESM） */
    module: string;
    /** types フィールド（TypeScript 型定義） */
    types: string;
  };
  /** scripts セクション */
  scripts: ScriptEntry[];
  /** キーワード */
  keywords: string[];
}

/** よく使うスクリプトのテンプレート一覧 */
export const SCRIPT_TEMPLATES: ScriptEntry[] = [
  { key: 'build', value: 'tsc' },
  { key: 'test', value: 'vitest' },
  { key: 'start', value: 'node dist/index.js' },
  { key: 'dev', value: 'tsx src/index.ts' },
  { key: 'lint', value: 'eslint src' },
  { key: 'format', value: 'prettier --write src' },
  { key: 'typecheck', value: 'tsc --noEmit' },
];

/** ライセンスの選択肢 */
export const LICENSE_OPTIONS = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'UNLICENSED',
] as const;

/** モジュール形式の選択肢 */
export const MODULE_TYPE_OPTIONS: Array<{ value: PackageJsonConfig['basic']['type']; label: string }> = [
  { value: '', label: '指定なし' },
  { value: 'commonjs', label: 'CommonJS (require)' },
  { value: 'module', label: 'ES Module (import)' },
];

/** プリセット定義 */
export const PRESETS: Array<{
  label: string;
  description: string;
  config: Partial<PackageJsonConfig>;
}> = [
  {
    label: 'シンプル（最小構成）',
    description: '最低限の設定',
    config: {
      basic: {
        name: 'my-package',
        version: '1.0.0',
        description: '',
        author: { name: '', email: '', url: '' },
        license: 'MIT',
        private: false,
        type: '',
      },
      entries: { main: '', module: '', types: '' },
      scripts: [{ key: 'test', value: 'echo "Error: no test specified" && exit 1' }],
      keywords: [],
    },
  },
  {
    label: 'Node.js CLI ツール',
    description: 'コマンドラインツール向け',
    config: {
      basic: {
        name: 'my-cli',
        version: '0.1.0',
        description: 'A command-line tool',
        author: { name: '', email: '', url: '' },
        license: 'MIT',
        private: false,
        type: 'module',
      },
      entries: { main: 'dist/index.js', module: '', types: 'dist/index.d.ts' },
      scripts: [
        { key: 'build', value: 'tsc' },
        { key: 'dev', value: 'tsx src/index.ts' },
        { key: 'test', value: 'vitest' },
        { key: 'lint', value: 'eslint src' },
        { key: 'typecheck', value: 'tsc --noEmit' },
      ],
      keywords: ['cli'],
    },
  },
  {
    label: 'Webアプリ（React + Vite）',
    description: 'フロントエンドアプリ向け',
    config: {
      basic: {
        name: 'my-app',
        version: '0.1.0',
        description: 'A React web application',
        author: { name: '', email: '', url: '' },
        license: 'MIT',
        private: true,
        type: 'module',
      },
      entries: { main: '', module: '', types: '' },
      scripts: [
        { key: 'dev', value: 'vite' },
        { key: 'build', value: 'tsc && vite build' },
        { key: 'preview', value: 'vite preview' },
        { key: 'test', value: 'vitest' },
        { key: 'lint', value: 'eslint src' },
        { key: 'typecheck', value: 'tsc --noEmit' },
      ],
      keywords: [],
    },
  },
  {
    label: 'ライブラリ（TypeScript）',
    description: 'npm 公開ライブラリ向け',
    config: {
      basic: {
        name: 'my-library',
        version: '0.1.0',
        description: 'A TypeScript library',
        author: { name: '', email: '', url: '' },
        license: 'MIT',
        private: false,
        type: 'module',
      },
      entries: {
        main: 'dist/index.cjs',
        module: 'dist/index.js',
        types: 'dist/index.d.ts',
      },
      scripts: [
        { key: 'build', value: 'vite build' },
        { key: 'test', value: 'vitest' },
        { key: 'lint', value: 'eslint src' },
        { key: 'typecheck', value: 'tsc --noEmit' },
        { key: 'prepublishOnly', value: 'npm run build' },
      ],
      keywords: [],
    },
  },
];

/**
 * デフォルト設定を返す
 * @returns デフォルトの PackageJsonConfig
 */
export function getDefaultConfig(): PackageJsonConfig {
  return {
    basic: {
      name: '',
      version: '1.0.0',
      description: '',
      author: { name: '', email: '', url: '' },
      license: 'MIT',
      private: false,
      type: '',
    },
    entries: { main: '', module: '', types: '' },
    scripts: [],
    keywords: [],
  };
}

/**
 * author フィールドを文字列にフォーマットする
 * @param author - 作者情報
 * @returns フォーマット済みの author 文字列、または空文字
 */
export function formatAuthor(author: PackageAuthor): string {
  if (!author.name) return '';
  let result = author.name;
  if (author.email) result += ` <${author.email}>`;
  if (author.url) result += ` (${author.url})`;
  return result;
}

/**
 * package.json の JSON 文字列を生成する
 * @param config - package.json の設定
 * @returns インデント済みの JSON 文字列
 */
export function generatePackageJson(config: PackageJsonConfig): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: Record<string, any> = {};

  // 基本フィールド
  if (config.basic.name) obj.name = config.basic.name;
  if (config.basic.version) obj.version = config.basic.version;
  if (config.basic.description) obj.description = config.basic.description;

  if (config.basic.private) obj.private = true;
  if (config.basic.type) obj.type = config.basic.type;

  // エントリポイント
  if (config.entries.main) obj.main = config.entries.main;
  if (config.entries.module) obj.module = config.entries.module;
  if (config.entries.types) obj.types = config.entries.types;

  // scripts
  if (config.scripts.length > 0) {
    obj.scripts = Object.fromEntries(
      config.scripts.filter((s) => s.key).map((s) => [s.key, s.value])
    );
  }

  // keywords
  if (config.keywords.length > 0) {
    obj.keywords = config.keywords.filter((k) => k);
  }

  // author
  const authorStr = formatAuthor(config.basic.author);
  if (authorStr) obj.author = authorStr;

  // license
  if (config.basic.license) obj.license = config.basic.license;

  return JSON.stringify(obj, null, 2);
}
