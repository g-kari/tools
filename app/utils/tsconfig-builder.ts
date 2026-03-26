/**
 * @fileoverview tsconfig.json ビルダーのオプション定義とジェネレーター
 * TypeScript コンパイラオプションのカテゴリ別定義と設定ファイル生成を管理する
 */

/** オプションの型 */
export type OptionType = 'boolean' | 'string' | 'enum' | 'list';

/**
 * tsconfig オプションの定義
 */
export interface TsConfigOption {
  /** オプション名（compilerOptions のキー） */
  key: string;
  /** UI に表示するラベル */
  label: string;
  /** オプションの説明 */
  description: string;
  /** 値の型 */
  type: OptionType;
  /** デフォルト値 */
  defaultValue: unknown;
  /** enum/list の選択肢 */
  choices?: string[];
  /** このオプションを推奨するユースケース */
  recommended?: string[];
}

/**
 * tsconfig オプションのカテゴリ
 */
export interface TsConfigCategory {
  /** カテゴリ識別子 */
  id: string;
  /** カテゴリ表示名 */
  label: string;
  /** カテゴリアイコン */
  icon: string;
  /** カテゴリに含まれるオプション */
  options: TsConfigOption[];
}

/**
 * プリセット定義
 */
export interface TsConfigPreset {
  /** プリセット識別子 */
  id: string;
  /** プリセット表示名 */
  label: string;
  /** プリセットの説明 */
  description: string;
  /** 設定値 */
  values: Record<string, unknown>;
}

/** tsconfig オプションのカテゴリ一覧 */
export const TSCONFIG_CATEGORIES: TsConfigCategory[] = [
  {
    id: 'language',
    label: '言語・環境',
    icon: '🌐',
    options: [
      {
        key: 'target',
        label: 'target',
        description:
          'コンパイル後の JavaScript のバージョン。新しいほど機能が増えるが古い環境では動かない',
        type: 'enum',
        defaultValue: 'ES3',
        choices: ['ES3', 'ES5', 'ES6', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', 'ES2021', 'ES2022', 'ES2023', 'ESNext'],
      },
      {
        key: 'lib',
        label: 'lib',
        description:
          '使用する組み込みライブラリの型定義。DOM API や ES の機能を有効にする',
        type: 'list',
        defaultValue: [],
        choices: ['ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', 'ES2021', 'ES2022', 'ESNext', 'DOM', 'DOM.Iterable', 'WebWorker'],
      },
      {
        key: 'module',
        label: 'module',
        description:
          '出力するモジュール形式。Node.js なら CommonJS、モダンブラウザなら ESNext が一般的',
        type: 'enum',
        defaultValue: 'CommonJS',
        choices: ['CommonJS', 'ES6', 'ES2015', 'ES2020', 'ES2022', 'ESNext', 'Node16', 'NodeNext', 'None'],
      },
      {
        key: 'moduleResolution',
        label: 'moduleResolution',
        description:
          'モジュールの解決戦略。Node.js なら node16/nodenext、バンドラーなら bundler が推奨',
        type: 'enum',
        defaultValue: 'Classic',
        choices: ['Classic', 'Node', 'Node10', 'Node16', 'NodeNext', 'Bundler'],
      },
      {
        key: 'jsx',
        label: 'jsx',
        description:
          'JSX のコンパイル方法。React 17+ は react-jsx、Next.js などは preserve が一般的',
        type: 'enum',
        defaultValue: 'preserve',
        choices: ['preserve', 'react', 'react-jsx', 'react-jsxdev', 'react-native'],
      },
    ],
  },
  {
    id: 'strictness',
    label: '型チェック・厳密性',
    icon: '🔒',
    options: [
      {
        key: 'strict',
        label: 'strict',
        description:
          '厳密モードを有効にする。以下の strict 系オプションをまとめて有効化する推奨設定',
        type: 'boolean',
        defaultValue: false,
        recommended: ['推奨: 新規プロジェクト'],
      },
      {
        key: 'noImplicitAny',
        label: 'noImplicitAny',
        description: '型が推論できない場合に any を暗黙的に使用することを禁止する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'strictNullChecks',
        label: 'strictNullChecks',
        description: 'null と undefined の代入チェックを厳密にする',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'strictFunctionTypes',
        label: 'strictFunctionTypes',
        description: '関数型の引数の型チェックを厳密にする（共変・反変）',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'strictPropertyInitialization',
        label: 'strictPropertyInitialization',
        description: 'クラスプロパティがコンストラクターで初期化されることを保証する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'noUncheckedIndexedAccess',
        label: 'noUncheckedIndexedAccess',
        description: '配列・インデックスアクセス時に undefined を含む型として扱う',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'exactOptionalPropertyTypes',
        label: 'exactOptionalPropertyTypes',
        description: 'オプショナルプロパティに undefined を明示的に代入することを禁止する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'noImplicitReturns',
        label: 'noImplicitReturns',
        description: 'すべてのコードパスで return 文があることを保証する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'noFallthroughCasesInSwitch',
        label: 'noFallthroughCasesInSwitch',
        description: 'switch 文の case がフォールスルーしないことを保証する',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
  {
    id: 'output',
    label: '出力・ビルド',
    icon: '📦',
    options: [
      {
        key: 'outDir',
        label: 'outDir',
        description: 'コンパイル済みファイルの出力先ディレクトリ',
        type: 'string',
        defaultValue: '',
      },
      {
        key: 'rootDir',
        label: 'rootDir',
        description: 'ソースファイルのルートディレクトリ',
        type: 'string',
        defaultValue: '',
      },
      {
        key: 'declaration',
        label: 'declaration',
        description: '型定義ファイル (.d.ts) を生成する。ライブラリ開発時に必要',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'declarationMap',
        label: 'declarationMap',
        description: '型定義ファイルのソースマップを生成する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'sourceMap',
        label: 'sourceMap',
        description: 'ソースマップを生成する。デバッグ時に元の TypeScript ファイルを参照できる',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'noEmit',
        label: 'noEmit',
        description: 'ファイルを出力しない（型チェックのみ）。バンドラーを使う場合に有効',
        type: 'boolean',
        defaultValue: false,
        recommended: ['Vite', 'webpack', 'esbuild 利用時'],
      },
      {
        key: 'removeComments',
        label: 'removeComments',
        description: 'コンパイル後のコードからコメントを削除する',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
  {
    id: 'interop',
    label: '相互運用性',
    icon: '🔗',
    options: [
      {
        key: 'esModuleInterop',
        label: 'esModuleInterop',
        description:
          'CommonJS モジュールを ES モジュールとして import できるようにする（推奨）',
        type: 'boolean',
        defaultValue: false,
        recommended: ['推奨: ほぼ全プロジェクト'],
      },
      {
        key: 'allowSyntheticDefaultImports',
        label: 'allowSyntheticDefaultImports',
        description: 'default export がないモジュールでも default import を許可する',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'resolveJsonModule',
        label: 'resolveJsonModule',
        description: 'JSON ファイルを import できるようにする',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'allowJs',
        label: 'allowJs',
        description: 'JavaScript ファイルを TypeScript プロジェクトに含める',
        type: 'boolean',
        defaultValue: false,
      },
      {
        key: 'checkJs',
        label: 'checkJs',
        description: 'JavaScript ファイルも型チェックする（allowJs が必要）',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
  {
    id: 'paths',
    label: 'パス・モジュール解決',
    icon: '📂',
    options: [
      {
        key: 'baseUrl',
        label: 'baseUrl',
        description: 'モジュール解決の基準ディレクトリ。paths オプションと組み合わせて使う',
        type: 'string',
        defaultValue: '',
      },
      {
        key: 'skipLibCheck',
        label: 'skipLibCheck',
        description:
          '型定義ファイル (.d.ts) の型チェックをスキップする。ビルド速度向上に有効',
        type: 'boolean',
        defaultValue: false,
        recommended: ['推奨: 依存関係の型エラーを回避'],
      },
      {
        key: 'forceConsistentCasingInFileNames',
        label: 'forceConsistentCasingInFileNames',
        description:
          'ファイル名の大文字・小文字を一貫させる。大文字小文字を区別しない OS（macOS 等）との互換性に重要',
        type: 'boolean',
        defaultValue: false,
        recommended: ['推奨: クロスプラットフォーム開発'],
      },
      {
        key: 'isolatedModules',
        label: 'isolatedModules',
        description:
          '各ファイルを独立したモジュールとしてコンパイルする。esbuild・Babel などで必要',
        type: 'boolean',
        defaultValue: false,
        recommended: ['Vite', 'esbuild', 'Babel 利用時'],
      },
    ],
  },
];

/** プリセット一覧 */
export const TSCONFIG_PRESETS: TsConfigPreset[] = [
  {
    id: 'node-lts',
    label: 'Node.js (LTS)',
    description: 'Node.js 20 LTS 向けの推奨設定',
    values: {
      target: 'ES2022',
      module: 'CommonJS',
      moduleResolution: 'Node',
      lib: ['ES2022'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
      sourceMap: true,
    },
  },
  {
    id: 'vite-react',
    label: 'Vite + React',
    description: 'Vite と React 18 を使ったフロントエンド向け設定',
    values: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
    },
  },
  {
    id: 'next-js',
    label: 'Next.js',
    description: 'Next.js プロジェクト向けの推奨設定',
    values: {
      target: 'ES5',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['DOM', 'DOM.Iterable', 'ESNext'],
      jsx: 'preserve',
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
      allowJs: true,
    },
  },
  {
    id: 'library',
    label: 'ライブラリ',
    description: 'npm パッケージ・ライブラリ開発向けの設定',
    values: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2020'],
      strict: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
  },
  {
    id: 'cloudflare-workers',
    label: 'Cloudflare Workers',
    description: 'Cloudflare Workers / Hono 向けの設定',
    values: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      lib: ['ES2022'],
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      isolatedModules: true,
    },
  },
];

/**
 * tsconfig.json の compilerOptions を JSON 文字列として生成する
 * @param values - 設定値のマップ
 * @returns tsconfig.json の JSON 文字列
 */
export function generateTsConfig(values: Record<string, unknown>): string {
  const compilerOptions: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    compilerOptions[key] = value;
  }

  const config = {
    compilerOptions,
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  return JSON.stringify(config, null, 2);
}

/**
 * 全カテゴリのデフォルト値を収集して初期状態を返す
 * @returns 初期値マップ
 */
export function getDefaultValues(): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const category of TSCONFIG_CATEGORIES) {
    for (const option of category.options) {
      defaults[option.key] = option.defaultValue;
    }
  }
  return defaults;
}
