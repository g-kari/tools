/**
 * Dockerfile ジェネレーターユーティリティ
 */

/** ARG定義 */
export interface DockerfileArg {
  /** 変数名 */
  key: string;
  /** デフォルト値（省略可） */
  defaultValue: string;
}

/** ENV定義 */
export interface DockerfileEnv {
  /** 変数名 */
  key: string;
  /** 値 */
  value: string;
}

/** COPYコマンド定義 */
export interface DockerfileCopy {
  /** コピー元パス */
  src: string;
  /** コピー先パス */
  dest: string;
}

/** Dockerfile設定 */
export interface DockerfileConfig {
  /** ベースイメージ（例: node:20-alpine） */
  from: string;
  /** マルチステージビルドのエイリアス（省略可） */
  fromAlias: string;
  /** 作業ディレクトリ */
  workdir: string;
  /** ARG定義リスト */
  args: DockerfileArg[];
  /** 環境変数リスト */
  envs: DockerfileEnv[];
  /** COPYコマンドリスト */
  copies: DockerfileCopy[];
  /** RUNコマンドリスト */
  runs: string[];
  /** 公開ポートリスト */
  ports: string[];
  /** 実行ユーザー（省略可） */
  user: string;
  /** ENTRYPOINTコマンド（省略可） */
  entrypoint: string;
  /** CMDコマンド（省略可） */
  cmd: string;
}

/** テンプレート定義 */
export interface DockerfileTemplate {
  /** テンプレート名 */
  label: string;
  /** 設定 */
  config: DockerfileConfig;
}

/** Dockerfileテンプレート一覧 */
export const DOCKERFILE_TEMPLATES: DockerfileTemplate[] = [
  {
    label: 'Node.js',
    config: {
      from: 'node:20-alpine',
      fromAlias: '',
      workdir: '/app',
      args: [],
      envs: [{ key: 'NODE_ENV', value: 'production' }],
      copies: [{ src: 'package*.json', dest: './' }],
      runs: ['npm ci --only=production'],
      ports: ['3000'],
      user: 'node',
      entrypoint: '',
      cmd: '["node", "server.js"]',
    },
  },
  {
    label: 'Python',
    config: {
      from: 'python:3.12-slim',
      fromAlias: '',
      workdir: '/app',
      args: [],
      envs: [
        { key: 'PYTHONDONTWRITEBYTECODE', value: '1' },
        { key: 'PYTHONUNBUFFERED', value: '1' },
      ],
      copies: [{ src: 'requirements.txt', dest: './' }],
      runs: ['pip install --no-cache-dir -r requirements.txt'],
      ports: ['8000'],
      user: '',
      entrypoint: '',
      cmd: '["python", "app.py"]',
    },
  },
  {
    label: 'Go',
    config: {
      from: 'golang:1.22-alpine',
      fromAlias: 'builder',
      workdir: '/app',
      args: [],
      envs: [{ key: 'CGO_ENABLED', value: '0' }],
      copies: [
        { src: 'go.mod go.sum', dest: './' },
        { src: '.', dest: '.' },
      ],
      runs: ['go mod download', 'go build -o /bin/app .'],
      ports: ['8080'],
      user: '',
      entrypoint: '["/bin/app"]',
      cmd: '',
    },
  },
  {
    label: 'Nginx',
    config: {
      from: 'nginx:alpine',
      fromAlias: '',
      workdir: '',
      args: [],
      envs: [],
      copies: [{ src: 'dist/', dest: '/usr/share/nginx/html/' }],
      runs: [],
      ports: ['80'],
      user: '',
      entrypoint: '',
      cmd: '',
    },
  },
];

/**
 * デフォルトのDockerfile設定を返す
 * @returns デフォルト設定
 */
export function defaultDockerfileConfig(): DockerfileConfig {
  return {
    from: 'node:20-alpine',
    fromAlias: '',
    workdir: '/app',
    args: [],
    envs: [],
    copies: [],
    runs: [],
    ports: [],
    user: '',
    entrypoint: '',
    cmd: '',
  };
}

/**
 * Dockerfileを生成する
 * @param config - Dockerfile設定
 * @returns 生成されたDockerfileの文字列
 */
export function generateDockerfile(config: DockerfileConfig): string {
  const from = config.from.trim();
  if (!from) return '';

  const lines: string[] = [];

  // FROM
  const alias = config.fromAlias.trim();
  lines.push(alias ? `FROM ${from} AS ${alias}` : `FROM ${from}`);

  // ARG
  const validArgs = config.args.filter((a) => a.key.trim());
  if (validArgs.length > 0) {
    lines.push('');
    for (const arg of validArgs) {
      const key = arg.key.trim();
      const val = arg.defaultValue.trim();
      lines.push(val ? `ARG ${key}=${val}` : `ARG ${key}`);
    }
  }

  // WORKDIR
  const workdir = config.workdir.trim();
  if (workdir) {
    lines.push('');
    lines.push(`WORKDIR ${workdir}`);
  }

  // ENV
  const validEnvs = config.envs.filter((e) => e.key.trim());
  if (validEnvs.length > 0) {
    lines.push('');
    if (validEnvs.length === 1) {
      lines.push(`ENV ${validEnvs[0].key.trim()}=${validEnvs[0].value}`);
    } else {
      lines.push('ENV \\');
      validEnvs.forEach((env, i) => {
        const isLast = i === validEnvs.length - 1;
        lines.push(`    ${env.key.trim()}=${env.value}${isLast ? '' : ' \\'}`);
      });
    }
  }

  // COPY
  const validCopies = config.copies.filter((c) => c.src.trim() && c.dest.trim());
  if (validCopies.length > 0) {
    lines.push('');
    for (const copy of validCopies) {
      lines.push(`COPY ${copy.src.trim()} ${copy.dest.trim()}`);
    }
  }

  // RUN
  const validRuns = config.runs.filter((r) => r.trim());
  if (validRuns.length > 0) {
    lines.push('');
    if (validRuns.length === 1) {
      lines.push(`RUN ${validRuns[0].trim()}`);
    } else {
      const runParts = validRuns.map((r, i) => {
        if (i === 0) return `RUN ${r.trim()} \\`;
        const isLast = i === validRuns.length - 1;
        return `    && ${r.trim()}${isLast ? '' : ' \\'}`;
      });
      lines.push(runParts.join('\n'));
    }
  }

  // EXPOSE
  const validPorts = config.ports.filter((p) => p.trim());
  if (validPorts.length > 0) {
    lines.push('');
    for (const port of validPorts) {
      lines.push(`EXPOSE ${port.trim()}`);
    }
  }

  // USER
  const user = config.user.trim();
  if (user) {
    lines.push('');
    lines.push(`USER ${user}`);
  }

  // ENTRYPOINT
  const entrypoint = config.entrypoint.trim();
  if (entrypoint) {
    lines.push('');
    lines.push(`ENTRYPOINT ${entrypoint}`);
  }

  // CMD
  const cmd = config.cmd.trim();
  if (cmd) {
    lines.push('');
    lines.push(`CMD ${cmd}`);
  }

  return lines.join('\n');
}
