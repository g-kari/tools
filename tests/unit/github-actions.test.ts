import { describe, it, expect } from 'vitest';
import {
  generateWorkflow,
  defaultWorkflowConfig,
  GITHUB_ACTIONS_TEMPLATES,
  type WorkflowConfig,
} from '../../app/utils/github-actions';

describe('generateWorkflow', () => {
  it('デフォルト設定でワークフローが生成されること', () => {
    const config = defaultWorkflowConfig();
    const result = generateWorkflow(config);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('ワークフロー名が出力に含まれること', () => {
    const config = defaultWorkflowConfig();
    config.name = 'My Custom Workflow';
    const result = generateWorkflow(config);
    expect(result).toContain('name: My Custom Workflow');
  });

  it('push トリガーが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.triggers.push = { branches: ['main', 'develop'] };
    config.triggers.pull_request = null;
    const result = generateWorkflow(config);
    expect(result).toContain('  push:');
    expect(result).toContain('    branches:');
    expect(result).toContain('      - main');
    expect(result).toContain('      - develop');
  });

  it('push トリガーが null の場合は出力されないこと', () => {
    const config = defaultWorkflowConfig();
    config.triggers.push = null;
    config.triggers.pull_request = null;
    config.triggers.workflow_dispatch = true;
    const result = generateWorkflow(config);
    expect(result).not.toContain('  push:');
  });

  it('pull_request トリガーが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.triggers.push = null;
    config.triggers.pull_request = { branches: ['main'] };
    const result = generateWorkflow(config);
    expect(result).toContain('  pull_request:');
    expect(result).toContain('    branches:');
    expect(result).toContain('      - main');
  });

  it('workflow_dispatch トリガーが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.triggers.workflow_dispatch = true;
    const result = generateWorkflow(config);
    expect(result).toContain('  workflow_dispatch:');
  });

  it('workflow_dispatch が false の場合は出力されないこと', () => {
    const config = defaultWorkflowConfig();
    config.triggers.workflow_dispatch = false;
    const result = generateWorkflow(config);
    expect(result).not.toContain('workflow_dispatch:');
  });

  it('schedule トリガーが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.triggers.schedule = { cron: '0 9 * * 1' };
    const result = generateWorkflow(config);
    expect(result).toContain('  schedule:');
    expect(result).toContain("    - cron: '0 9 * * 1'");
  });

  it('schedule が null の場合は出力されないこと', () => {
    const config = defaultWorkflowConfig();
    config.triggers.schedule = null;
    const result = generateWorkflow(config);
    expect(result).not.toContain('schedule:');
  });

  it('release トリガーが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.triggers.release = true;
    const result = generateWorkflow(config);
    expect(result).toContain('  release:');
    expect(result).toContain('    types: [published]');
  });

  it('runner OS が正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].runsOn = 'macos-latest';
    const result = generateWorkflow(config);
    expect(result).toContain('runs-on: macos-latest');
  });

  it('ubuntu-latest が正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].runsOn = 'ubuntu-latest';
    const result = generateWorkflow(config);
    expect(result).toContain('runs-on: ubuntu-latest');
  });

  it('Node.js セットアップステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'setup-node', enabled: true, nodeVersion: '18' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/setup-node@v4');
    expect(result).toContain("node-version: '18'");
  });

  it('Node.js セットアップのデフォルトバージョンが出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'setup-node', enabled: true },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/setup-node@v4');
    expect(result).toContain("node-version: '20'");
  });

  it('Python セットアップステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'setup-python', enabled: true, pythonVersion: '3.11' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/setup-python@v5');
    expect(result).toContain("python-version: '3.11'");
  });

  it('無効なステップは出力されないこと', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'setup-node', enabled: false, nodeVersion: '20' },
    ];
    const result = generateWorkflow(config);
    expect(result).not.toContain('setup-node');
  });

  it('環境変数がジョブに正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].env = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'API_URL', value: 'https://api.example.com' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('    env:');
    expect(result).toContain('      NODE_ENV: production');
    expect(result).toContain('      API_URL: https://api.example.com');
  });

  it('グローバル環境変数が正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.globalEnv = [
      { key: 'TZ', value: 'Asia/Tokyo' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('env:');
    expect(result).toContain('  TZ: Asia/Tokyo');
  });

  it('空のキーの環境変数は出力されないこと', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].env = [{ key: '', value: 'some-value' }];
    const result = generateWorkflow(config);
    expect(result).not.toContain('some-value');
  });

  it('checkout ステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [{ type: 'checkout', enabled: true }];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/checkout@v4');
  });

  it('run ステップのコマンドが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'run', enabled: true, command: 'npm run test' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('run: npm run test');
  });

  it('upload-artifact ステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      {
        type: 'upload-artifact',
        enabled: true,
        artifactName: 'build-output',
        artifactPath: 'dist/',
      },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/upload-artifact@v4');
    expect(result).toContain('name: build-output');
    expect(result).toContain('path: dist/');
  });

  it('cache ステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      {
        type: 'cache',
        enabled: true,
        cacheKey: 'npm-${{ hashFiles(\'package-lock.json\') }}',
      },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: actions/cache@v4');
  });

  it('docker-login ステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      { type: 'docker-login', enabled: true, registry: 'ghcr.io' },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: docker/login-action@v3');
    expect(result).toContain('registry: ghcr.io');
  });

  it('docker-build-push ステップが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].steps = [
      { type: 'checkout', enabled: true },
      {
        type: 'docker-build-push',
        enabled: true,
        imageName: 'ghcr.io/my-org/my-app',
      },
    ];
    const result = generateWorkflow(config);
    expect(result).toContain('uses: docker/build-push-action@v5');
    expect(result).toContain('tags: ghcr.io/my-org/my-app:latest');
  });

  it('ワークフロー名が空の場合はデフォルト名 CI が使用されること', () => {
    const config = defaultWorkflowConfig();
    config.name = '';
    const result = generateWorkflow(config);
    expect(result).toContain('name: CI');
  });

  it('jobs セクションが出力に含まれること', () => {
    const config = defaultWorkflowConfig();
    const result = generateWorkflow(config);
    expect(result).toContain('jobs:');
  });

  it('ジョブIDが正しく出力されること', () => {
    const config = defaultWorkflowConfig();
    config.jobs[0].id = 'my-job';
    const result = generateWorkflow(config);
    expect(result).toContain('  my-job:');
  });
});

describe('GITHUB_ACTIONS_TEMPLATES', () => {
  it('4つのテンプレートが存在すること', () => {
    expect(GITHUB_ACTIONS_TEMPLATES).toHaveLength(4);
  });

  it('Node.js CI テンプレートが正しいYAMLを生成すること', () => {
    const template = GITHUB_ACTIONS_TEMPLATES.find(
      (t) => t.label === 'Node.js CI'
    );
    expect(template).toBeDefined();
    if (!template) return;

    const result = generateWorkflow(template.config);
    expect(result).toContain('name: Node.js CI');
    expect(result).toContain('  push:');
    expect(result).toContain('  pull_request:');
    expect(result).toContain('uses: actions/checkout@v4');
    expect(result).toContain('uses: actions/setup-node@v4');
    expect(result).toContain("node-version: '20'");
    expect(result).toContain('run: npm ci');
    expect(result).toContain('run: npm run lint');
    expect(result).toContain('run: npm test');
    expect(result).toContain('run: npm run build');
  });

  it('Python CI テンプレートが正しいYAMLを生成すること', () => {
    const template = GITHUB_ACTIONS_TEMPLATES.find(
      (t) => t.label === 'Python CI'
    );
    expect(template).toBeDefined();
    if (!template) return;

    const result = generateWorkflow(template.config);
    expect(result).toContain('name: Python CI');
    expect(result).toContain('uses: actions/setup-python@v5');
    expect(result).toContain("python-version: '3.11'");
    expect(result).toContain('run: pip install -r requirements.txt');
    expect(result).toContain('run: pytest');
  });

  it('Docker Build & Push テンプレートが正しいYAMLを生成すること', () => {
    const template = GITHUB_ACTIONS_TEMPLATES.find(
      (t) => t.label === 'Docker Build & Push'
    );
    expect(template).toBeDefined();
    if (!template) return;

    const result = generateWorkflow(template.config);
    expect(result).toContain('name: Docker Build and Push');
    expect(result).toContain('uses: docker/login-action@v3');
    expect(result).toContain('registry: ghcr.io');
    expect(result).toContain('uses: docker/build-push-action@v5');
    expect(result).toContain('  release:');
  });

  it('Cloudflare Workers Deploy テンプレートが正しいYAMLを生成すること', () => {
    const template = GITHUB_ACTIONS_TEMPLATES.find(
      (t) => t.label === 'Cloudflare Workers Deploy'
    );
    expect(template).toBeDefined();
    if (!template) return;

    const result = generateWorkflow(template.config);
    expect(result).toContain('name: Deploy to Cloudflare Workers');
    expect(result).toContain('  workflow_dispatch:');
    expect(result).toContain('uses: actions/setup-node@v4');
    expect(result).toContain('run: npm ci');
    expect(result).toContain('run: npm run build');
    expect(result).toContain('wrangler deploy');
    expect(result).toContain('CLOUDFLARE_API_TOKEN');
  });

  it('各テンプレートがラベルと説明を持つこと', () => {
    for (const template of GITHUB_ACTIONS_TEMPLATES) {
      expect(template.label).toBeTruthy();
      expect(template.description).toBeTruthy();
    }
  });

  it('各テンプレートのワークフローにジョブが含まれること', () => {
    for (const template of GITHUB_ACTIONS_TEMPLATES) {
      expect(template.config.jobs.length).toBeGreaterThan(0);
      const result = generateWorkflow(template.config);
      expect(result).toContain('jobs:');
    }
  });
});

describe('defaultWorkflowConfig', () => {
  it('デフォルト設定が正しい構造を持つこと', () => {
    const config = defaultWorkflowConfig();
    expect(config.name).toBe('CI');
    expect(config.triggers.push).not.toBeNull();
    expect(config.triggers.pull_request).not.toBeNull();
    expect(config.triggers.workflow_dispatch).toBe(false);
    expect(config.triggers.schedule).toBeNull();
    expect(config.triggers.release).toBe(false);
    expect(config.jobs).toHaveLength(1);
    expect(config.globalEnv).toHaveLength(0);
  });

  it('デフォルト設定のジョブが ubuntu-latest を使用すること', () => {
    const config = defaultWorkflowConfig();
    expect(config.jobs[0].runsOn).toBe('ubuntu-latest');
  });

  it('デフォルト設定のジョブにチェックアウトステップが含まれること', () => {
    const config = defaultWorkflowConfig();
    const checkoutStep = config.jobs[0].steps.find(
      (s) => s.type === 'checkout'
    );
    expect(checkoutStep).toBeDefined();
    expect(checkoutStep?.enabled).toBe(true);
  });

  it('複数回呼んでも独立した設定オブジェクトを返すこと', () => {
    const config1 = defaultWorkflowConfig();
    const config2 = defaultWorkflowConfig();
    config1.name = 'Modified';
    expect(config2.name).toBe('CI');
  });
});
