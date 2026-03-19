/**
 * docker run → docker-compose.yml 変換ユーティリティ
 *
 * docker run コマンドを解析し、docker-compose.yml 形式のYAMLに変換する。
 */

/** 解析済み docker run コマンドの構造 */
export interface ParsedDockerRun {
  /** イメージ名（タグ含む） */
  image: string;
  /** コンテナ名 */
  containerName: string | null;
  /** ポートマッピング */
  ports: string[];
  /** 環境変数 */
  environment: string[];
  /** ボリュームマウント */
  volumes: string[];
  /** ネットワーク */
  network: string | null;
  /** 再起動ポリシー */
  restart: string | null;
  /** バックグラウンド実行 */
  detach: boolean;
  /** 終了時削除 */
  rm: boolean;
  /** TTY割り当て */
  tty: boolean;
  /** 標準入力を開いたまま */
  interactive: boolean;
  /** 作業ディレクトリ */
  workdir: string | null;
  /** エントリーポイント */
  entrypoint: string | null;
  /** ユーザー */
  user: string | null;
  /** ホスト名 */
  hostname: string | null;
  /** メモリ制限 */
  memory: string | null;
  /** CPU制限 */
  cpus: string | null;
  /** ラベル */
  labels: string[];
  /** 特権モード */
  privileged: boolean;
  /** 読み取り専用 */
  readOnly: boolean;
  /** cap-add */
  capAdd: string[];
  /** cap-drop */
  capDrop: string[];
  /** コマンドと引数 */
  command: string[] | null;
}

/** 変換結果 */
export interface ConvertResult {
  /** 生成されたYAML */
  yaml: string;
  /** 警告メッセージ */
  warnings: string[];
}

/**
 * シェルスタイルのトークン列を生成する
 *
 * シングルクォート・ダブルクォートに対応。
 * バックスラッシュ＋改行の行継続も処理する。
 *
 * @param command docker run コマンド文字列
 * @returns トークンの配列
 */
export function tokenize(command: string): string[] {
  const normalized = command.replace(/\\\n/g, ' ').trim();

  const tokens: string[] = [];
  let i = 0;

  while (i < normalized.length) {
    while (i < normalized.length && /\s/.test(normalized[i])) i++;
    if (i >= normalized.length) break;

    const ch = normalized[i];

    if (ch === "'") {
      i++;
      let s = '';
      while (i < normalized.length && normalized[i] !== "'") {
        s += normalized[i++];
      }
      i++;
      tokens.push(s);
    } else if (ch === '"') {
      i++;
      let s = '';
      while (i < normalized.length && normalized[i] !== '"') {
        if (normalized[i] === '\\' && i + 1 < normalized.length) {
          i++;
          switch (normalized[i]) {
            case 'n':
              s += '\n';
              break;
            case 't':
              s += '\t';
              break;
            case '"':
              s += '"';
              break;
            case '\\':
              s += '\\';
              break;
            default:
              s += '\\' + normalized[i];
          }
        } else {
          s += normalized[i];
        }
        i++;
      }
      i++;
      tokens.push(s);
    } else {
      let s = '';
      while (i < normalized.length && !/\s/.test(normalized[i])) {
        s += normalized[i++];
      }
      if (s) tokens.push(s);
    }
  }

  return tokens;
}

/**
 * docker run コマンドを解析して構造化データに変換する
 *
 * @param command docker run コマンド文字列
 * @returns 解析済みデータと警告メッセージ
 */
export function parseDockerRun(command: string): {
  parsed: ParsedDockerRun;
  warnings: string[];
} {
  const warnings: string[] = [];
  const tokens = tokenize(command.trim());

  let idx = 0;

  // "docker" と "run" をスキップ
  if (tokens[idx]?.toLowerCase() === 'docker') idx++;
  if (tokens[idx]?.toLowerCase() === 'run') idx++;

  const result: ParsedDockerRun = {
    image: '',
    containerName: null,
    ports: [],
    environment: [],
    volumes: [],
    network: null,
    restart: null,
    detach: false,
    rm: false,
    tty: false,
    interactive: false,
    workdir: null,
    entrypoint: null,
    user: null,
    hostname: null,
    memory: null,
    cpus: null,
    labels: [],
    privileged: false,
    readOnly: false,
    capAdd: [],
    capDrop: [],
    command: null,
  };

  /** 次のトークンを取得するヘルパー */
  const next = (): string => tokens[++idx] ?? '';

  while (idx < tokens.length) {
    const token = tokens[idx];

    if (token === '--name') {
      result.containerName = next();
    } else if (token.startsWith('--name=')) {
      result.containerName = token.slice('--name='.length);
    } else if (token === '-p' || token === '--publish') {
      result.ports.push(next());
    } else if (token.startsWith('-p=') || token.startsWith('--publish=')) {
      result.ports.push(token.slice(token.indexOf('=') + 1));
    } else if (token === '-e' || token === '--env') {
      result.environment.push(next());
    } else if (token.startsWith('-e=') || token.startsWith('--env=')) {
      result.environment.push(token.slice(token.indexOf('=') + 1));
    } else if (token === '--env-file') {
      const file = next();
      result.environment.push(`# env_file: ${file}`);
      warnings.push(
        `--env-file (${file}) は docker-compose の env_file フィールドに変換してください。`
      );
    } else if (token === '-v' || token === '--volume') {
      result.volumes.push(next());
    } else if (token.startsWith('-v=') || token.startsWith('--volume=')) {
      result.volumes.push(token.slice(token.indexOf('=') + 1));
    } else if (token === '--mount') {
      const mountStr = next();
      result.volumes.push(mountStr);
      warnings.push(
        `--mount オプションはvolumes形式に変換されました。内容を確認してください: ${mountStr}`
      );
    } else if (token === '--network' || token === '--net') {
      result.network = next();
    } else if (token.startsWith('--network=') || token.startsWith('--net=')) {
      result.network = token.slice(token.indexOf('=') + 1);
    } else if (token === '--restart') {
      result.restart = next();
    } else if (token.startsWith('--restart=')) {
      result.restart = token.slice('--restart='.length);
    } else if (token === '-d' || token === '--detach') {
      result.detach = true;
    } else if (token === '--rm') {
      result.rm = true;
      warnings.push(
        '--rm オプションはdocker-composeでは通常不要です（停止時削除はデフォルト動作と異なります）。'
      );
    } else if (token === '-t' || token === '--tty') {
      result.tty = true;
    } else if (token === '-i' || token === '--interactive') {
      result.interactive = true;
    } else if (token === '-it' || token === '-ti') {
      result.tty = true;
      result.interactive = true;
    } else if (token === '-w' || token === '--workdir') {
      result.workdir = next();
    } else if (token.startsWith('-w=') || token.startsWith('--workdir=')) {
      result.workdir = token.slice(token.indexOf('=') + 1);
    } else if (token === '--entrypoint') {
      result.entrypoint = next();
    } else if (token.startsWith('--entrypoint=')) {
      result.entrypoint = token.slice('--entrypoint='.length);
    } else if (token === '-u' || token === '--user') {
      result.user = next();
    } else if (token.startsWith('-u=') || token.startsWith('--user=')) {
      result.user = token.slice(token.indexOf('=') + 1);
    } else if (token === '-h' || token === '--hostname') {
      result.hostname = next();
    } else if (token.startsWith('--hostname=')) {
      result.hostname = token.slice('--hostname='.length);
    } else if (token === '-m' || token === '--memory') {
      result.memory = next();
    } else if (token.startsWith('-m=') || token.startsWith('--memory=')) {
      result.memory = token.slice(token.indexOf('=') + 1);
    } else if (token === '--cpus') {
      result.cpus = next();
    } else if (token.startsWith('--cpus=')) {
      result.cpus = token.slice('--cpus='.length);
    } else if (token === '-l' || token === '--label') {
      result.labels.push(next());
    } else if (token.startsWith('-l=') || token.startsWith('--label=')) {
      result.labels.push(token.slice(token.indexOf('=') + 1));
    } else if (token === '--privileged') {
      result.privileged = true;
      warnings.push('--privileged は本番環境では危険です。必要最小限の cap-add を使用することを検討してください。');
    } else if (token === '--read-only') {
      result.readOnly = true;
    } else if (token === '--cap-add') {
      result.capAdd.push(next());
    } else if (token.startsWith('--cap-add=')) {
      result.capAdd.push(token.slice('--cap-add='.length));
    } else if (token === '--cap-drop') {
      result.capDrop.push(next());
    } else if (token.startsWith('--cap-drop=')) {
      result.capDrop.push(token.slice('--cap-drop='.length));
    } else if (
      token === '--link' ||
      token.startsWith('--link=')
    ) {
      const linkVal = token.startsWith('--link=') ? token.slice('--link='.length) : next();
      warnings.push(
        `--link (${linkVal}) は非推奨です。docker-compose のネットワーク機能を使用してください。`
      );
    } else if (
      token === '-P' ||
      token === '--publish-all' ||
      token === '--no-healthcheck' ||
      token === '--init' ||
      token === '--sig-proxy'
    ) {
      // 無視するフラグ（値なし）
    } else if (
      token === '--log-driver' ||
      token === '--log-opt' ||
      token === '--platform' ||
      token === '--ipc' ||
      token === '--pid' ||
      token === '--uts' ||
      token === '--userns' ||
      token === '--dns' ||
      token === '--dns-option' ||
      token === '--dns-search' ||
      token === '--add-host' ||
      token === '--expose' ||
      token === '--device' ||
      token === '--ulimit'
    ) {
      // 値ありフラグをスキップ
      idx++;
    } else if (!token.startsWith('-')) {
      // イメージ名（最初の非フラグトークン）
      if (!result.image) {
        result.image = token;
        // 残りはコマンドとして扱う
        const remaining = tokens.slice(idx + 1);
        if (remaining.length > 0) {
          result.command = remaining;
        }
        break;
      }
    } else if (/^-[a-zA-Z]{2,}$/.test(token)) {
      // 短縮フラグの組み合わせ（例: -dit）の処理
      const chars = token.slice(1).split('');
      for (const c of chars) {
        if (c === 'd') result.detach = true;
        if (c === 'i') result.interactive = true;
        if (c === 't') result.tty = true;
      }
    }

    idx++;
  }

  return { parsed: result, warnings };
}

/**
 * YAMLの文字列値をクォートする
 *
 * 特殊文字を含む場合はダブルクォートで囲む。
 *
 * @param value 文字列値
 * @returns クォート済み文字列
 */
function quoteYamlValue(value: string): string {
  // 数値・真偽値・コロン含む・スペース含む場合はクォート
  if (
    /^\d+$/.test(value) ||
    /^(true|false|yes|no|on|off|null|~)$/i.test(value) ||
    value.includes(':') ||
    value.includes('#') ||
    value.includes('"') ||
    value.startsWith(' ') ||
    value.endsWith(' ') ||
    value === ''
  ) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * サービス名を生成する
 *
 * コンテナ名またはイメージ名（タグ除く）から生成する。
 *
 * @param parsed 解析済みデータ
 * @returns サービス名
 */
function getServiceName(parsed: ParsedDockerRun): string {
  const base = parsed.containerName ?? parsed.image.split(':')[0].split('/').pop() ?? 'app';
  // docker-compose のサービス名として使えるよう変換（英数字とハイフン・アンダースコアのみ）
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'app';
}

/**
 * 解析済みデータを docker-compose.yml YAML に変換する
 *
 * @param parsed 解析済み docker run データ
 * @returns 生成された YAML 文字列
 */
export function toComposeYaml(parsed: ParsedDockerRun): string {
  const lines: string[] = [];
  const serviceName = getServiceName(parsed);

  lines.push('services:');
  lines.push(`  ${serviceName}:`);
  lines.push(`    image: ${quoteYamlValue(parsed.image || 'your-image:latest')}`);

  if (parsed.containerName) {
    lines.push(`    container_name: ${quoteYamlValue(parsed.containerName)}`);
  }

  if (parsed.hostname) {
    lines.push(`    hostname: ${quoteYamlValue(parsed.hostname)}`);
  }

  if (parsed.restart) {
    lines.push(`    restart: ${quoteYamlValue(parsed.restart)}`);
  }

  if (parsed.ports.length > 0) {
    lines.push('    ports:');
    for (const p of parsed.ports) {
      lines.push(`      - ${quoteYamlValue(p)}`);
    }
  }

  if (parsed.environment.length > 0) {
    lines.push('    environment:');
    for (const e of parsed.environment) {
      if (e.startsWith('# env_file:')) {
        lines.push(`      ${e}`);
      } else {
        lines.push(`      - ${quoteYamlValue(e)}`);
      }
    }
  }

  if (parsed.volumes.length > 0) {
    lines.push('    volumes:');
    for (const v of parsed.volumes) {
      lines.push(`      - ${quoteYamlValue(v)}`);
    }
  }

  if (parsed.network) {
    lines.push('    networks:');
    lines.push(`      - ${quoteYamlValue(parsed.network)}`);
  }

  if (parsed.workdir) {
    lines.push(`    working_dir: ${quoteYamlValue(parsed.workdir)}`);
  }

  if (parsed.entrypoint) {
    lines.push(`    entrypoint: ${quoteYamlValue(parsed.entrypoint)}`);
  }

  if (parsed.user) {
    lines.push(`    user: ${quoteYamlValue(parsed.user)}`);
  }

  if (parsed.tty) {
    lines.push('    tty: true');
  }

  if (parsed.interactive) {
    lines.push('    stdin_open: true');
  }

  if (parsed.readOnly) {
    lines.push('    read_only: true');
  }

  if (parsed.privileged) {
    lines.push('    privileged: true');
  }

  if (parsed.capAdd.length > 0) {
    lines.push('    cap_add:');
    for (const cap of parsed.capAdd) {
      lines.push(`      - ${cap}`);
    }
  }

  if (parsed.capDrop.length > 0) {
    lines.push('    cap_drop:');
    for (const cap of parsed.capDrop) {
      lines.push(`      - ${cap}`);
    }
  }

  if (parsed.labels.length > 0) {
    lines.push('    labels:');
    for (const label of parsed.labels) {
      const eqIdx = label.indexOf('=');
      if (eqIdx > -1) {
        const key = label.slice(0, eqIdx);
        const value = label.slice(eqIdx + 1);
        lines.push(`      ${key}: ${quoteYamlValue(value)}`);
      } else {
        lines.push(`      ${label}: ""`);
      }
    }
  }

  if (parsed.memory || parsed.cpus) {
    lines.push('    deploy:');
    lines.push('      resources:');
    lines.push('        limits:');
    if (parsed.memory) {
      lines.push(`          memory: ${quoteYamlValue(parsed.memory)}`);
    }
    if (parsed.cpus) {
      lines.push(`          cpus: ${quoteYamlValue(parsed.cpus)}`);
    }
  }

  if (parsed.command && parsed.command.length > 0) {
    if (parsed.command.length === 1) {
      lines.push(`    command: ${quoteYamlValue(parsed.command[0])}`);
    } else {
      lines.push('    command:');
      for (const arg of parsed.command) {
        lines.push(`      - ${quoteYamlValue(arg)}`);
      }
    }
  }

  if (parsed.network) {
    lines.push('');
    lines.push('networks:');
    lines.push(`  ${parsed.network}:`);
    lines.push('    external: true');
  }

  return lines.join('\n');
}

/**
 * docker run コマンドを docker-compose.yml に変換する
 *
 * @param command docker run コマンド文字列
 * @returns 変換結果（YAMLと警告メッセージ）
 */
export function convertDockerRun(command: string): ConvertResult {
  if (!command.trim()) {
    return { yaml: '', warnings: [] };
  }

  const { parsed, warnings } = parseDockerRun(command);

  if (!parsed.image) {
    return {
      yaml: '',
      warnings: ['イメージ名が見つかりませんでした。docker run コマンドにイメージ名が含まれているか確認してください。'],
    };
  }

  const yaml = toComposeYaml(parsed);
  return { yaml, warnings };
}
