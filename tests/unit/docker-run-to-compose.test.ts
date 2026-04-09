import { describe, it, expect } from 'vite-plus/test';
import {
  tokenize,
  parseDockerRun,
  toComposeYaml,
  convertDockerRun,
} from '../../app/utils/docker-run-to-compose';

describe('tokenize', () => {
  it('シンプルなコマンドをトークン化する', () => {
    const tokens = tokenize("docker run nginx");
    expect(tokens).toEqual(['docker', 'run', 'nginx']);
  });

  it('シングルクォートを処理する', () => {
    const tokens = tokenize("docker run -e 'KEY=value' nginx");
    expect(tokens).toEqual(['docker', 'run', '-e', 'KEY=value', 'nginx']);
  });

  it('ダブルクォートを処理する', () => {
    const tokens = tokenize('docker run -e "KEY=value" nginx');
    expect(tokens).toEqual(['docker', 'run', '-e', 'KEY=value', 'nginx']);
  });

  it('バックスラッシュ改行（行継続）を処理する', () => {
    const tokens = tokenize("docker run \\\n  -p 80:80 \\\n  nginx");
    expect(tokens).toEqual(['docker', 'run', '-p', '80:80', 'nginx']);
  });
});

describe('parseDockerRun', () => {
  it('シンプルなイメージ名を解析する', () => {
    const { parsed } = parseDockerRun('docker run nginx');
    expect(parsed.image).toBe('nginx');
  });

  it('"docker run" なしでも解析する', () => {
    const { parsed } = parseDockerRun('nginx:latest');
    expect(parsed.image).toBe('nginx:latest');
  });

  it('--name を解析する', () => {
    const { parsed } = parseDockerRun('docker run --name mycontainer nginx');
    expect(parsed.containerName).toBe('mycontainer');
  });

  it('--name= 形式を解析する', () => {
    const { parsed } = parseDockerRun('docker run --name=mycontainer nginx');
    expect(parsed.containerName).toBe('mycontainer');
  });

  it('-p ポートマッピングを解析する', () => {
    const { parsed } = parseDockerRun('docker run -p 80:80 -p 443:443 nginx');
    expect(parsed.ports).toEqual(['80:80', '443:443']);
  });

  it('-e 環境変数を解析する', () => {
    const { parsed } = parseDockerRun('docker run -e KEY=value -e FOO=bar nginx');
    expect(parsed.environment).toEqual(['KEY=value', 'FOO=bar']);
  });

  it('-v ボリュームを解析する', () => {
    const { parsed } = parseDockerRun('docker run -v /host:/container nginx');
    expect(parsed.volumes).toEqual(['/host:/container']);
  });

  it('--network を解析する', () => {
    const { parsed } = parseDockerRun('docker run --network mynet nginx');
    expect(parsed.network).toBe('mynet');
  });

  it('--restart を解析する', () => {
    const { parsed } = parseDockerRun('docker run --restart unless-stopped nginx');
    expect(parsed.restart).toBe('unless-stopped');
  });

  it('-d フラグを解析する', () => {
    const { parsed } = parseDockerRun('docker run -d nginx');
    expect(parsed.detach).toBe(true);
  });

  it('-it フラグを解析する', () => {
    const { parsed } = parseDockerRun('docker run -it ubuntu bash');
    expect(parsed.tty).toBe(true);
    expect(parsed.interactive).toBe(true);
    expect(parsed.image).toBe('ubuntu');
    expect(parsed.command).toEqual(['bash']);
  });

  it('-dit 複合フラグを解析する', () => {
    const { parsed } = parseDockerRun('docker run -dit ubuntu');
    expect(parsed.detach).toBe(true);
    expect(parsed.tty).toBe(true);
    expect(parsed.interactive).toBe(true);
  });

  it('--workdir を解析する', () => {
    const { parsed } = parseDockerRun('docker run -w /app nginx');
    expect(parsed.workdir).toBe('/app');
  });

  it('--user を解析する', () => {
    const { parsed } = parseDockerRun('docker run -u 1000:1000 nginx');
    expect(parsed.user).toBe('1000:1000');
  });

  it('--memory を解析する', () => {
    const { parsed } = parseDockerRun('docker run -m 512m nginx');
    expect(parsed.memory).toBe('512m');
  });

  it('--cpus を解析する', () => {
    const { parsed } = parseDockerRun('docker run --cpus=2 nginx');
    expect(parsed.cpus).toBe('2');
  });

  it('--privileged を解析する', () => {
    const { parsed, warnings } = parseDockerRun('docker run --privileged nginx');
    expect(parsed.privileged).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('--read-only を解析する', () => {
    const { parsed } = parseDockerRun('docker run --read-only nginx');
    expect(parsed.readOnly).toBe(true);
  });

  it('--cap-add を解析する', () => {
    const { parsed } = parseDockerRun('docker run --cap-add NET_ADMIN nginx');
    expect(parsed.capAdd).toEqual(['NET_ADMIN']);
  });

  it('--rm 警告を出す', () => {
    const { warnings } = parseDockerRun('docker run --rm nginx');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('コマンドを解析する', () => {
    const { parsed } = parseDockerRun('docker run ubuntu /bin/bash -c "echo hello"');
    expect(parsed.image).toBe('ubuntu');
    expect(parsed.command).toEqual(['/bin/bash', '-c', 'echo hello']);
  });
});

describe('toComposeYaml', () => {
  it('基本的なYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run nginx:latest');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('services:');
    expect(yaml).toContain('image: "nginx:latest"');
  });

  it('ポートマッピングを含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run -p 80:80 nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('ports:');
    expect(yaml).toContain('"80:80"');
  });

  it('環境変数を含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run -e KEY=value nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('environment:');
    expect(yaml).toContain('KEY=value');
  });

  it('ボリュームを含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run -v /host:/container nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('volumes:');
    expect(yaml).toContain('/host:/container');
  });

  it('ネットワークを含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run --network mynet nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('networks:');
    expect(yaml).toContain('mynet');
    expect(yaml).toContain('external: true');
  });

  it('コンテナ名をサービス名に使用する', () => {
    const { parsed } = parseDockerRun('docker run --name myapp nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('myapp:');
    expect(yaml).toContain('container_name: myapp');
  });

  it('メモリとCPU制限を含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run -m 512m --cpus=2 nginx');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('deploy:');
    expect(yaml).toContain('memory: 512m');
    expect(yaml).toContain('cpus: "2"');
  });

  it('stdin_open と tty を含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run -it ubuntu');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('tty: true');
    expect(yaml).toContain('stdin_open: true');
  });

  it('コマンドを含むYAMLを生成する', () => {
    const { parsed } = parseDockerRun('docker run ubuntu /bin/bash');
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('command: /bin/bash');
  });
});

describe('convertDockerRun', () => {
  it('空文字列の場合は空のYAMLを返す', () => {
    const result = convertDockerRun('');
    expect(result.yaml).toBe('');
    expect(result.warnings).toEqual([]);
  });

  it('イメージ名がない場合は警告を返す', () => {
    const result = convertDockerRun('docker run -p 80:80');
    expect(result.yaml).toBe('');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('Nginxのdocker runを変換する', () => {
    const result = convertDockerRun(
      'docker run -d --name nginx -p 80:80 --restart unless-stopped nginx:latest'
    );
    expect(result.yaml).toContain('services:');
    expect(result.yaml).toContain('image: "nginx:latest"');
    expect(result.yaml).toContain('"80:80"');
    expect(result.yaml).toContain('restart: unless-stopped');
    expect(result.warnings).toEqual([]);
  });

  it('PostgreSQLのdocker runを変換する', () => {
    const result = convertDockerRun(
      'docker run -d --name postgres -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16'
    );
    expect(result.yaml).toContain('image: "postgres:16"');
    expect(result.yaml).toContain('POSTGRES_PASSWORD=secret');
    expect(result.yaml).toContain('"5432:5432"');
  });

  it('複数行のdocker runを変換する', () => {
    const result = convertDockerRun(
      'docker run -d \\\n  --name myapp \\\n  -p 3000:3000 \\\n  myapp:latest'
    );
    expect(result.yaml).toContain('image: "myapp:latest"');
    expect(result.yaml).toContain('"3000:3000"');
  });
});
