/**
 * GitHub Actions ワークフロービルダーユーティリティ
 */

/** ワークフロートリガーの種類 */
export type WorkflowTriggerType =
  | 'push'
  | 'pull_request'
  | 'workflow_dispatch'
  | 'schedule'
  | 'release';

/** ブランチ条件付きトリガー設定 */
export interface TriggerBranches {
  /** 対象ブランチのリスト */
  branches: string[];
}

/** スケジュールトリガー設定 */
export interface ScheduleCron {
  /** cron式 */
  cron: string;
}

/** ジョブを実行するOSランナー */
export type RunnerOS =
  | 'ubuntu-latest'
  | 'macos-latest'
  | 'windows-latest'
  | 'ubuntu-22.04'
  | 'ubuntu-20.04';

/** ステップの種類 */
export type StepType =
  | 'checkout'
  | 'setup-node'
  | 'setup-python'
  | 'setup-go'
  | 'cache'
  | 'run'
  | 'upload-artifact'
  | 'download-artifact'
  | 'docker-login'
  | 'docker-build-push'
  | 'deploy-pages';

/** ステップの設定 */
export interface StepConfig {
  /** ステップの種類 */
  type: StepType;
  /** このステップを有効にするか */
  enabled: boolean;
  /** Node.jsのバージョン（setup-node用） */
  nodeVersion?: string;
  /** Pythonのバージョン（setup-python用） */
  pythonVersion?: string;
  /** Goのバージョン（setup-go用） */
  goVersion?: string;
  /** キャッシュキー（cache用） */
  cacheKey?: string;
  /** 実行コマンド（run用） */
  command?: string;
  /** アーティファクト名（upload/download-artifact用） */
  artifactName?: string;
  /** アーティファクトのパス */
  artifactPath?: string;
  /** Dockerレジストリ（docker-login用） */
  registry?: string;
  /** Dockerイメージ名（docker-build-push用） */
  imageName?: string;
}

/** ジョブの設定 */
export interface JobConfig {
  /** ジョブID */
  id: string;
  /** ジョブ名 */
  name: string;
  /** 実行OS */
  runsOn: RunnerOS;
  /** ステップ一覧 */
  steps: StepConfig[];
  /** ジョブ固有の環境変数 */
  env?: { key: string; value: string }[];
}

/** ワークフロー全体の設定 */
export interface WorkflowConfig {
  /** ワークフロー名 */
  name: string;
  /** トリガー設定 */
  triggers: {
    /** pushトリガー */
    push: TriggerBranches | null;
    /** pull_requestトリガー */
    pull_request: TriggerBranches | null;
    /** 手動実行トリガー */
    workflow_dispatch: boolean;
    /** スケジュールトリガー */
    schedule: ScheduleCron | null;
    /** リリーストリガー */
    release: boolean;
  };
  /** ジョブ一覧 */
  jobs: JobConfig[];
  /** グローバル環境変数 */
  globalEnv: { key: string; value: string }[];
}

/** テンプレート定義 */
export interface WorkflowTemplate {
  /** テンプレートラベル */
  label: string;
  /** テンプレートの説明 */
  description: string;
  /** ワークフロー設定 */
  config: WorkflowConfig;
}

/** GitHub Actions ワークフローテンプレート一覧 */
export const GITHUB_ACTIONS_TEMPLATES: WorkflowTemplate[] = [
  {
    label: 'Node.js CI',
    description: 'Node.js プロジェクトのCI（lint・test・build）',
    config: {
      name: 'Node.js CI',
      triggers: {
        push: { branches: ['main'] },
        pull_request: { branches: ['main'] },
        workflow_dispatch: false,
        schedule: null,
        release: false,
      },
      globalEnv: [],
      jobs: [
        {
          id: 'build',
          name: 'Build and Test',
          runsOn: 'ubuntu-latest',
          steps: [
            { type: 'checkout', enabled: true },
            { type: 'setup-node', enabled: true, nodeVersion: '20' },
            { type: 'run', enabled: true, command: 'npm ci' },
            { type: 'run', enabled: true, command: 'npm run lint' },
            { type: 'run', enabled: true, command: 'npm test' },
            { type: 'run', enabled: true, command: 'npm run build' },
          ],
          env: [],
        },
      ],
    },
  },
  {
    label: 'Python CI',
    description: 'Python プロジェクトのCI（pytest）',
    config: {
      name: 'Python CI',
      triggers: {
        push: { branches: ['main'] },
        pull_request: { branches: ['main'] },
        workflow_dispatch: false,
        schedule: null,
        release: false,
      },
      globalEnv: [],
      jobs: [
        {
          id: 'test',
          name: 'Test',
          runsOn: 'ubuntu-latest',
          steps: [
            { type: 'checkout', enabled: true },
            { type: 'setup-python', enabled: true, pythonVersion: '3.11' },
            {
              type: 'run',
              enabled: true,
              command: 'pip install -r requirements.txt',
            },
            { type: 'run', enabled: true, command: 'pytest' },
          ],
          env: [],
        },
      ],
    },
  },
  {
    label: 'Docker Build & Push',
    description: 'Docker イメージのビルドとGHCRへのプッシュ',
    config: {
      name: 'Docker Build and Push',
      triggers: {
        push: { branches: ['main'] },
        pull_request: null,
        workflow_dispatch: false,
        schedule: null,
        release: true,
      },
      globalEnv: [],
      jobs: [
        {
          id: 'build-push',
          name: 'Build and Push Docker Image',
          runsOn: 'ubuntu-latest',
          steps: [
            { type: 'checkout', enabled: true },
            {
              type: 'docker-login',
              enabled: true,
              registry: 'ghcr.io',
            },
            {
              type: 'docker-build-push',
              enabled: true,
              imageName: 'ghcr.io/${{ github.repository }}',
            },
          ],
          env: [],
        },
      ],
    },
  },
  {
    label: 'Cloudflare Workers Deploy',
    description: 'Cloudflare Workers へのデプロイ',
    config: {
      name: 'Deploy to Cloudflare Workers',
      triggers: {
        push: { branches: ['main'] },
        pull_request: null,
        workflow_dispatch: true,
        schedule: null,
        release: false,
      },
      globalEnv: [],
      jobs: [
        {
          id: 'deploy',
          name: 'Deploy',
          runsOn: 'ubuntu-latest',
          steps: [
            { type: 'checkout', enabled: true },
            { type: 'setup-node', enabled: true, nodeVersion: '20' },
            { type: 'run', enabled: true, command: 'npm ci' },
            { type: 'run', enabled: true, command: 'npm run build' },
            {
              type: 'run',
              enabled: true,
              command:
                'npx wrangler deploy --env production',
            },
          ],
          env: [
            { key: 'CLOUDFLARE_API_TOKEN', value: '${{ secrets.CLOUDFLARE_API_TOKEN }}' },
          ],
        },
      ],
    },
  },
];

/**
 * デフォルトのワークフロー設定を返す
 * @returns デフォルト設定
 */
export function defaultWorkflowConfig(): WorkflowConfig {
  return {
    name: 'CI',
    triggers: {
      push: { branches: ['main'] },
      pull_request: { branches: ['main'] },
      workflow_dispatch: false,
      schedule: null,
      release: false,
    },
    globalEnv: [],
    jobs: [
      {
        id: 'build',
        name: 'Build',
        runsOn: 'ubuntu-latest',
        steps: [
          { type: 'checkout', enabled: true },
          { type: 'setup-node', enabled: true, nodeVersion: '20' },
          { type: 'run', enabled: true, command: 'npm ci' },
          { type: 'run', enabled: false, command: '' },
        ],
        env: [],
      },
    ],
  };
}

/**
 * ステップ設定からYAMLステップ文字列を生成する
 * @param step - ステップ設定
 * @param indent - インデントの数（スペース）
 * @returns YAMLステップ文字列（複数行）
 */
function generateStep(step: StepConfig, indent: number): string {
  const pad = ' '.repeat(indent);
  const pad2 = ' '.repeat(indent + 2);

  switch (step.type) {
    case 'checkout':
      return [
        `${pad}- name: Checkout code`,
        `${pad2}uses: actions/checkout@v4`,
      ].join('\n');

    case 'setup-node': {
      const ver = step.nodeVersion || '20';
      return [
        `${pad}- name: Setup Node.js`,
        `${pad2}uses: actions/setup-node@v4`,
        `${pad2}with:`,
        `${pad2}  node-version: '${ver}'`,
      ].join('\n');
    }

    case 'setup-python': {
      const ver = step.pythonVersion || '3.11';
      return [
        `${pad}- name: Setup Python`,
        `${pad2}uses: actions/setup-python@v5`,
        `${pad2}with:`,
        `${pad2}  python-version: '${ver}'`,
      ].join('\n');
    }

    case 'setup-go': {
      const ver = step.goVersion || '1.22';
      return [
        `${pad}- name: Setup Go`,
        `${pad2}uses: actions/setup-go@v5`,
        `${pad2}with:`,
        `${pad2}  go-version: '${ver}'`,
      ].join('\n');
    }

    case 'cache': {
      const key = step.cacheKey || 'node-modules-${{ hashFiles(\'**/package-lock.json\') }}';
      return [
        `${pad}- name: Cache dependencies`,
        `${pad2}uses: actions/cache@v4`,
        `${pad2}with:`,
        `${pad2}  path: node_modules`,
        `${pad2}  key: ${key}`,
      ].join('\n');
    }

    case 'run': {
      const cmd = step.command || 'echo "No command specified"';
      return [`${pad}- name: Run command`, `${pad2}run: ${cmd}`].join('\n');
    }

    case 'upload-artifact': {
      const name = step.artifactName || 'artifact';
      const path = step.artifactPath || 'dist/';
      return [
        `${pad}- name: Upload artifact`,
        `${pad2}uses: actions/upload-artifact@v4`,
        `${pad2}with:`,
        `${pad2}  name: ${name}`,
        `${pad2}  path: ${path}`,
      ].join('\n');
    }

    case 'download-artifact': {
      const name = step.artifactName || 'artifact';
      return [
        `${pad}- name: Download artifact`,
        `${pad2}uses: actions/download-artifact@v4`,
        `${pad2}with:`,
        `${pad2}  name: ${name}`,
      ].join('\n');
    }

    case 'docker-login': {
      const registry = step.registry || 'ghcr.io';
      return [
        `${pad}- name: Login to ${registry}`,
        `${pad2}uses: docker/login-action@v3`,
        `${pad2}with:`,
        `${pad2}  registry: ${registry}`,
        `${pad2}  username: \${{ github.actor }}`,
        `${pad2}  password: \${{ secrets.GITHUB_TOKEN }}`,
      ].join('\n');
    }

    case 'docker-build-push': {
      const image = step.imageName || 'ghcr.io/${{ github.repository }}';
      return [
        `${pad}- name: Build and push Docker image`,
        `${pad2}uses: docker/build-push-action@v5`,
        `${pad2}with:`,
        `${pad2}  context: .`,
        `${pad2}  push: true`,
        `${pad2}  tags: ${image}:latest`,
      ].join('\n');
    }

    case 'deploy-pages':
      return [
        `${pad}- name: Deploy to GitHub Pages`,
        `${pad2}uses: actions/deploy-pages@v4`,
      ].join('\n');

    default:
      return '';
  }
}

/**
 * ジョブ設定からYAMLジョブブロックを生成する
 * @param job - ジョブ設定
 * @returns YAMLジョブブロック文字列
 */
function generateJob(job: JobConfig): string {
  const lines: string[] = [];
  lines.push(`  ${job.id}:`);
  lines.push(`    name: ${job.name}`);
  lines.push(`    runs-on: ${job.runsOn}`);

  // ジョブ環境変数
  const validEnv = (job.env ?? []).filter((e) => e.key.trim());
  if (validEnv.length > 0) {
    lines.push('    env:');
    for (const e of validEnv) {
      lines.push(`      ${e.key}: ${e.value}`);
    }
  }

  lines.push('    steps:');

  const enabledSteps = job.steps.filter((s) => s.enabled);
  for (const step of enabledSteps) {
    const stepYaml = generateStep(step, 6);
    if (stepYaml) {
      lines.push(stepYaml);
    }
  }

  return lines.join('\n');
}

/**
 * WorkflowConfig を受け取り GitHub Actions YAML 文字列を生成する
 * @param config - ワークフロー設定
 * @returns GitHub Actions YAML 文字列
 */
export function generateWorkflow(config: WorkflowConfig): string {
  const lines: string[] = [];

  // name
  const name = config.name.trim() || 'CI';
  lines.push(`name: ${name}`);
  lines.push('');

  // on トリガー
  lines.push('on:');
  const { triggers } = config;

  if (triggers.push) {
    lines.push('  push:');
    if (triggers.push.branches.length > 0) {
      lines.push('    branches:');
      for (const b of triggers.push.branches) {
        if (b.trim()) lines.push(`      - ${b.trim()}`);
      }
    }
  }

  if (triggers.pull_request) {
    lines.push('  pull_request:');
    if (triggers.pull_request.branches.length > 0) {
      lines.push('    branches:');
      for (const b of triggers.pull_request.branches) {
        if (b.trim()) lines.push(`      - ${b.trim()}`);
      }
    }
  }

  if (triggers.workflow_dispatch) {
    lines.push('  workflow_dispatch:');
  }

  if (triggers.schedule) {
    lines.push('  schedule:');
    lines.push(`    - cron: '${triggers.schedule.cron}'`);
  }

  if (triggers.release) {
    lines.push('  release:');
    lines.push('    types: [published]');
  }

  lines.push('');

  // グローバル環境変数
  const validGlobalEnv = config.globalEnv.filter((e) => e.key.trim());
  if (validGlobalEnv.length > 0) {
    lines.push('env:');
    for (const e of validGlobalEnv) {
      lines.push(`  ${e.key}: ${e.value}`);
    }
    lines.push('');
  }

  // ジョブ
  lines.push('jobs:');
  for (const job of config.jobs) {
    lines.push(generateJob(job));
  }

  return lines.join('\n');
}
