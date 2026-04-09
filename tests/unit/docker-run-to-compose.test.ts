import { describe, it, expect } from "vite-plus/test";
import {
  tokenize,
  parseDockerRun,
  toComposeYaml,
  convertDockerRun,
} from "../../app/utils/docker-run-to-compose";

describe("tokenize", () => {
  it("シンプルなコマンドをトークン化する", () => {
    const tokens = tokenize("docker run nginx");
    expect(tokens).toEqual(["docker", "run", "nginx"]);
  });

  it("シングルクォートを処理する", () => {
    const tokens = tokenize("docker run -e 'KEY=value' nginx");
    expect(tokens).toEqual(["docker", "run", "-e", "KEY=value", "nginx"]);
  });

  it("ダブルクォートを処理する", () => {
    const tokens = tokenize('docker run -e "KEY=value" nginx');
    expect(tokens).toEqual(["docker", "run", "-e", "KEY=value", "nginx"]);
  });

  it("バックスラッシュ改行（行継続）を処理する", () => {
    const tokens = tokenize("docker run \\\n  -p 80:80 \\\n  nginx");
    expect(tokens).toEqual(["docker", "run", "-p", "80:80", "nginx"]);
  });
});

describe("parseDockerRun", () => {
  it("シンプルなイメージ名を解析する", () => {
    const { parsed } = parseDockerRun("docker run nginx");
    expect(parsed.image).toBe("nginx");
  });

  it('"docker run" なしでも解析する', () => {
    const { parsed } = parseDockerRun("nginx:latest");
    expect(parsed.image).toBe("nginx:latest");
  });

  it("--name を解析する", () => {
    const { parsed } = parseDockerRun("docker run --name mycontainer nginx");
    expect(parsed.containerName).toBe("mycontainer");
  });

  it("--name= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --name=mycontainer nginx");
    expect(parsed.containerName).toBe("mycontainer");
  });

  it("-p ポートマッピングを解析する", () => {
    const { parsed } = parseDockerRun("docker run -p 80:80 -p 443:443 nginx");
    expect(parsed.ports).toEqual(["80:80", "443:443"]);
  });

  it("-e 環境変数を解析する", () => {
    const { parsed } = parseDockerRun("docker run -e KEY=value -e FOO=bar nginx");
    expect(parsed.environment).toEqual(["KEY=value", "FOO=bar"]);
  });

  it("-v ボリュームを解析する", () => {
    const { parsed } = parseDockerRun("docker run -v /host:/container nginx");
    expect(parsed.volumes).toEqual(["/host:/container"]);
  });

  it("--network を解析する", () => {
    const { parsed } = parseDockerRun("docker run --network mynet nginx");
    expect(parsed.network).toBe("mynet");
  });

  it("--restart を解析する", () => {
    const { parsed } = parseDockerRun("docker run --restart unless-stopped nginx");
    expect(parsed.restart).toBe("unless-stopped");
  });

  it("-d フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run -d nginx");
    expect(parsed.detach).toBe(true);
  });

  it("-it フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run -it ubuntu bash");
    expect(parsed.tty).toBe(true);
    expect(parsed.interactive).toBe(true);
    expect(parsed.image).toBe("ubuntu");
    expect(parsed.command).toEqual(["bash"]);
  });

  it("-dit 複合フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run -dit ubuntu");
    expect(parsed.detach).toBe(true);
    expect(parsed.tty).toBe(true);
    expect(parsed.interactive).toBe(true);
  });

  it("--workdir を解析する", () => {
    const { parsed } = parseDockerRun("docker run -w /app nginx");
    expect(parsed.workdir).toBe("/app");
  });

  it("--user を解析する", () => {
    const { parsed } = parseDockerRun("docker run -u 1000:1000 nginx");
    expect(parsed.user).toBe("1000:1000");
  });

  it("--memory を解析する", () => {
    const { parsed } = parseDockerRun("docker run -m 512m nginx");
    expect(parsed.memory).toBe("512m");
  });

  it("--cpus を解析する", () => {
    const { parsed } = parseDockerRun("docker run --cpus=2 nginx");
    expect(parsed.cpus).toBe("2");
  });

  it("--privileged を解析する", () => {
    const { parsed, warnings } = parseDockerRun("docker run --privileged nginx");
    expect(parsed.privileged).toBe(true);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("--read-only を解析する", () => {
    const { parsed } = parseDockerRun("docker run --read-only nginx");
    expect(parsed.readOnly).toBe(true);
  });

  it("--cap-add を解析する", () => {
    const { parsed } = parseDockerRun("docker run --cap-add NET_ADMIN nginx");
    expect(parsed.capAdd).toEqual(["NET_ADMIN"]);
  });

  it("--rm 警告を出す", () => {
    const { warnings } = parseDockerRun("docker run --rm nginx");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("コマンドを解析する", () => {
    const { parsed } = parseDockerRun('docker run ubuntu /bin/bash -c "echo hello"');
    expect(parsed.image).toBe("ubuntu");
    expect(parsed.command).toEqual(["/bin/bash", "-c", "echo hello"]);
  });
});

describe("toComposeYaml", () => {
  it("基本的なYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run nginx:latest");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("services:");
    expect(yaml).toContain('image: "nginx:latest"');
  });

  it("ポートマッピングを含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -p 80:80 nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("ports:");
    expect(yaml).toContain('"80:80"');
  });

  it("環境変数を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -e KEY=value nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("environment:");
    expect(yaml).toContain("KEY=value");
  });

  it("ボリュームを含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -v /host:/container nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("volumes:");
    expect(yaml).toContain("/host:/container");
  });

  it("ネットワークを含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --network mynet nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("networks:");
    expect(yaml).toContain("mynet");
    expect(yaml).toContain("external: true");
  });

  it("コンテナ名をサービス名に使用する", () => {
    const { parsed } = parseDockerRun("docker run --name myapp nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("myapp:");
    expect(yaml).toContain("container_name: myapp");
  });

  it("メモリとCPU制限を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -m 512m --cpus=2 nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("deploy:");
    expect(yaml).toContain("memory: 512m");
    expect(yaml).toContain('cpus: "2"');
  });

  it("stdin_open と tty を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -it ubuntu");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("tty: true");
    expect(yaml).toContain("stdin_open: true");
  });

  it("コマンドを含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run ubuntu /bin/bash");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("command: /bin/bash");
  });
});

describe("convertDockerRun", () => {
  it("空文字列の場合は空のYAMLを返す", () => {
    const result = convertDockerRun("");
    expect(result.yaml).toBe("");
    expect(result.warnings).toEqual([]);
  });

  it("イメージ名がない場合は警告を返す", () => {
    const result = convertDockerRun("docker run -p 80:80");
    expect(result.yaml).toBe("");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("Nginxのdocker runを変換する", () => {
    const result = convertDockerRun(
      "docker run -d --name nginx -p 80:80 --restart unless-stopped nginx:latest",
    );
    expect(result.yaml).toContain("services:");
    expect(result.yaml).toContain('image: "nginx:latest"');
    expect(result.yaml).toContain('"80:80"');
    expect(result.yaml).toContain("restart: unless-stopped");
    expect(result.warnings).toEqual([]);
  });

  it("PostgreSQLのdocker runを変換する", () => {
    const result = convertDockerRun(
      "docker run -d --name postgres -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16",
    );
    expect(result.yaml).toContain('image: "postgres:16"');
    expect(result.yaml).toContain("POSTGRES_PASSWORD=secret");
    expect(result.yaml).toContain('"5432:5432"');
  });

  it("複数行のdocker runを変換する", () => {
    const result = convertDockerRun(
      "docker run -d \\\n  --name myapp \\\n  -p 3000:3000 \\\n  myapp:latest",
    );
    expect(result.yaml).toContain('image: "myapp:latest"');
    expect(result.yaml).toContain('"3000:3000"');
  });
});

describe("parseDockerRun - 追加フラグ", () => {
  it("--cap-drop を解析する", () => {
    const { parsed } = parseDockerRun("docker run --cap-drop NET_RAW nginx");
    expect(parsed.capDrop).toEqual(["NET_RAW"]);
  });

  it("--cap-drop= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --cap-drop=SYS_ADMIN nginx");
    expect(parsed.capDrop).toEqual(["SYS_ADMIN"]);
  });

  it("--cap-add= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --cap-add=NET_ADMIN nginx");
    expect(parsed.capAdd).toEqual(["NET_ADMIN"]);
  });

  it("--link は警告を出す", () => {
    const { warnings } = parseDockerRun("docker run --link other:other nginx");
    expect(warnings.some((w) => w.includes("--link"))).toBe(true);
  });

  it("--link= 形式は警告を出す", () => {
    const { warnings } = parseDockerRun("docker run --link=db:db nginx");
    expect(warnings.some((w) => w.includes("--link"))).toBe(true);
  });

  it("-P フラグは無視される", () => {
    const { parsed } = parseDockerRun("docker run -P nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--publish-all フラグは無視される", () => {
    const { parsed } = parseDockerRun("docker run --publish-all nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--no-healthcheck フラグは無視される", () => {
    const { parsed } = parseDockerRun("docker run --no-healthcheck nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--init フラグは無視される", () => {
    const { parsed } = parseDockerRun("docker run --init nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--log-driver は値をスキップして解析を続ける", () => {
    const { parsed } = parseDockerRun("docker run --log-driver json-file nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--platform は値をスキップして解析を続ける", () => {
    const { parsed } = parseDockerRun("docker run --platform linux/amd64 nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--dns は値をスキップして解析を続ける", () => {
    const { parsed } = parseDockerRun("docker run --dns 8.8.8.8 nginx");
    expect(parsed.image).toBe("nginx");
  });

  it("--hostname を解析する", () => {
    const { parsed } = parseDockerRun("docker run -h myhost nginx");
    expect(parsed.hostname).toBe("myhost");
  });

  it("--hostname= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --hostname=myhost nginx");
    expect(parsed.hostname).toBe("myhost");
  });

  it("--entrypoint を解析する", () => {
    const { parsed } = parseDockerRun("docker run --entrypoint /bin/sh nginx");
    expect(parsed.entrypoint).toBe("/bin/sh");
  });

  it("--entrypoint= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --entrypoint=/bin/sh nginx");
    expect(parsed.entrypoint).toBe("/bin/sh");
  });

  it("--env-file は環境変数コメントと警告を追加する", () => {
    const { parsed, warnings } = parseDockerRun("docker run --env-file .env nginx");
    expect(parsed.environment.some((e) => e.includes("# env_file: .env"))).toBe(true);
    expect(warnings.some((w) => w.includes("--env-file"))).toBe(true);
  });

  it("--mount は volumes に追加して警告を出す", () => {
    const { parsed, warnings } = parseDockerRun(
      "docker run --mount type=bind,source=/host,target=/app nginx",
    );
    expect(parsed.volumes.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.includes("--mount"))).toBe(true);
  });

  it("--net= 形式でネットワークを解析する", () => {
    const { parsed } = parseDockerRun("docker run --net=mynet nginx");
    expect(parsed.network).toBe("mynet");
  });

  it("--net フラグでネットワークを解析する", () => {
    const { parsed } = parseDockerRun("docker run --net bridge nginx");
    expect(parsed.network).toBe("bridge");
  });

  it("-l フラグでラベルを解析する", () => {
    const { parsed } = parseDockerRun("docker run -l app=myapp nginx");
    expect(parsed.labels).toContain("app=myapp");
  });

  it("--label= 形式でラベルを解析する", () => {
    const { parsed } = parseDockerRun("docker run --label=env=prod nginx");
    expect(parsed.labels).toContain("env=prod");
  });

  it("-l= 形式でラベルを解析する", () => {
    const { parsed } = parseDockerRun("docker run -l=tier=frontend nginx");
    expect(parsed.labels).toContain("tier=frontend");
  });

  it("--workdir= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --workdir=/app nginx");
    expect(parsed.workdir).toBe("/app");
  });

  it("-w= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run -w=/app nginx");
    expect(parsed.workdir).toBe("/app");
  });

  it("--user= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --user=nobody nginx");
    expect(parsed.user).toBe("nobody");
  });

  it("-u= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run -u=1000 nginx");
    expect(parsed.user).toBe("1000");
  });

  it("-m= 形式でメモリを解析する", () => {
    const { parsed } = parseDockerRun("docker run -m=256m nginx");
    expect(parsed.memory).toBe("256m");
  });

  it("--memory= 形式でメモリを解析する", () => {
    const { parsed } = parseDockerRun("docker run --memory=1g nginx");
    expect(parsed.memory).toBe("1g");
  });

  it("--network= 形式でネットワークを解析する", () => {
    const { parsed } = parseDockerRun("docker run --network=host nginx");
    expect(parsed.network).toBe("host");
  });

  it("-p= 形式でポートを解析する", () => {
    const { parsed } = parseDockerRun("docker run -p=8080:80 nginx");
    expect(parsed.ports).toContain("8080:80");
  });

  it("--publish= 形式でポートを解析する", () => {
    const { parsed } = parseDockerRun("docker run --publish=443:443 nginx");
    expect(parsed.ports).toContain("443:443");
  });

  it("-e= 形式で環境変数を解析する", () => {
    const { parsed } = parseDockerRun("docker run -e=DEBUG=1 nginx");
    expect(parsed.environment).toContain("DEBUG=1");
  });

  it("--env= 形式で環境変数を解析する", () => {
    const { parsed } = parseDockerRun("docker run --env=NODE_ENV=production nginx");
    expect(parsed.environment).toContain("NODE_ENV=production");
  });

  it("-v= 形式でボリュームを解析する", () => {
    const { parsed } = parseDockerRun("docker run -v=/data:/data nginx");
    expect(parsed.volumes).toContain("/data:/data");
  });

  it("--volume= 形式でボリュームを解析する", () => {
    const { parsed } = parseDockerRun("docker run --volume=/data:/data nginx");
    expect(parsed.volumes).toContain("/data:/data");
  });

  it("-t フラグ単体を解析する", () => {
    const { parsed } = parseDockerRun("docker run -t nginx");
    expect(parsed.tty).toBe(true);
  });

  it("-i フラグ単体を解析する", () => {
    const { parsed } = parseDockerRun("docker run -i nginx");
    expect(parsed.interactive).toBe(true);
  });

  it("-ti フラグを解析する（-it と等価）", () => {
    const { parsed } = parseDockerRun("docker run -ti ubuntu");
    expect(parsed.tty).toBe(true);
    expect(parsed.interactive).toBe(true);
  });

  it("--detach フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run --detach nginx");
    expect(parsed.detach).toBe(true);
  });

  it("--interactive フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run --interactive ubuntu");
    expect(parsed.interactive).toBe(true);
  });

  it("--tty フラグを解析する", () => {
    const { parsed } = parseDockerRun("docker run --tty ubuntu");
    expect(parsed.tty).toBe(true);
  });
});

describe("toComposeYaml - 追加フィールド", () => {
  it("hostname を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -h myhost nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("hostname: myhost");
  });

  it("workdir を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -w /app nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("working_dir: /app");
  });

  it("entrypoint を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --entrypoint /bin/sh nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("entrypoint: /bin/sh");
  });

  it("user を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run -u nobody nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("user: nobody");
  });

  it("read_only を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --read-only nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("read_only: true");
  });

  it("privileged を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --privileged nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("privileged: true");
  });

  it("cap_add を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --cap-add NET_ADMIN nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("cap_add:");
    expect(yaml).toContain("- NET_ADMIN");
  });

  it("cap_drop を含むYAMLを生成する", () => {
    const { parsed } = parseDockerRun("docker run --cap-drop NET_RAW nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("cap_drop:");
    expect(yaml).toContain("- NET_RAW");
  });

  it("labels を key: value 形式でYAMLに出力する", () => {
    const { parsed } = parseDockerRun("docker run -l app=myapp nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("labels:");
    expect(yaml).toContain("app: myapp");
  });

  it("値なしラベルを空文字列で出力する", () => {
    const { parsed } = parseDockerRun("docker run --label standalone nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain('standalone: ""');
  });

  it("複数引数のコマンドはリスト形式でYAMLに出力する", () => {
    const { parsed } = parseDockerRun("docker run ubuntu /bin/bash -c echo");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("command:");
    expect(yaml).toContain("- /bin/bash");
    expect(yaml).toContain("- -c");
    expect(yaml).toContain("- echo");
  });

  it("env_file コメント行はインデントを保って出力する", () => {
    const { parsed } = parseDockerRun("docker run --env-file .env nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("# env_file: .env");
  });

  it("CPUのみ指定した場合もdeploy secitonを出力する", () => {
    const { parsed } = parseDockerRun("docker run --cpus 1.5 nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("deploy:");
    expect(yaml).toContain("cpus:");
  });

  it("メモリのみ指定した場合もdeploy sectionを出力する", () => {
    const { parsed } = parseDockerRun("docker run -m 256m nginx");
    const yaml = toComposeYaml(parsed);
    expect(yaml).toContain("deploy:");
    expect(yaml).toContain("memory: 256m");
  });
});

describe("tokenize - 追加ケース", () => {
  it("ダブルクォート内のエスケープシーケンスを処理する", () => {
    const tokens = tokenize('docker run -e "KEY=val\\nue" nginx');
    expect(tokens).toContain("KEY=val\nue");
  });

  it("ダブルクォート内のタブエスケープを処理する", () => {
    const tokens = tokenize('docker run -e "KEY=val\\tue" nginx');
    expect(tokens).toContain("KEY=val\tue");
  });

  it("ダブルクォート内のバックスラッシュエスケープを処理する", () => {
    const tokens = tokenize('docker run -e "PATH=C:\\\\app" nginx');
    expect(tokens).toContain("PATH=C:\\app");
  });

  it("ダブルクォート内のダブルクォートエスケープを処理する", () => {
    const tokens = tokenize('docker run -e "KEY=\\"val\\"" nginx');
    expect(tokens).toContain('KEY="val"');
  });

  it("ダブルクォート内の未知のエスケープはバックスラッシュを保持する", () => {
    const tokens = tokenize('docker run -e "KEY=\\xval" nginx');
    expect(tokens).toContain("KEY=\\xval");
  });
});

describe("parseDockerRun - --restart= 形式", () => {
  it("--restart= 形式を解析する", () => {
    const { parsed } = parseDockerRun("docker run --restart=always nginx");
    expect(parsed.restart).toBe("always");
  });

  it("--restart=on-failure を解析する", () => {
    const { parsed } = parseDockerRun("docker run --restart=on-failure:3 nginx");
    expect(parsed.restart).toBe("on-failure:3");
  });
});
