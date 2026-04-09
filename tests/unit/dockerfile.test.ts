import { describe, it, expect } from "vite-plus/test";
import {
  generateDockerfile,
  defaultDockerfileConfig,
  DOCKERFILE_TEMPLATES,
  type DockerfileConfig,
} from "../../app/utils/dockerfile";

describe("defaultDockerfileConfig", () => {
  it("デフォルト設定を返す", () => {
    const config = defaultDockerfileConfig();
    expect(config.from).toBe("node:20-alpine");
    expect(config.workdir).toBe("/app");
    expect(config.args).toEqual([]);
    expect(config.envs).toEqual([]);
    expect(config.copies).toEqual([]);
    expect(config.runs).toEqual([]);
    expect(config.ports).toEqual([]);
    expect(config.user).toBe("");
    expect(config.entrypoint).toBe("");
    expect(config.cmd).toBe("");
  });
});

describe("DOCKERFILE_TEMPLATES", () => {
  it("テンプレートが4つ定義されている", () => {
    expect(DOCKERFILE_TEMPLATES).toHaveLength(4);
  });

  it("各テンプレートにlabelとconfigがある", () => {
    for (const t of DOCKERFILE_TEMPLATES) {
      expect(t.label).toBeTruthy();
      expect(t.config.from).toBeTruthy();
    }
  });
});

describe("generateDockerfile", () => {
  it("fromが空の場合は空文字列を返す", () => {
    const config = defaultDockerfileConfig();
    config.from = "";
    expect(generateDockerfile(config)).toBe("");
  });

  it("最小構成でFROMのみ生成する", () => {
    const config: DockerfileConfig = {
      from: "alpine:3.20",
      fromAlias: "",
      workdir: "",
      args: [],
      envs: [],
      copies: [],
      runs: [],
      ports: [],
      user: "",
      entrypoint: "",
      cmd: "",
    };
    expect(generateDockerfile(config)).toBe("FROM alpine:3.20");
  });

  it("fromAlias指定でFROM ... ASを生成する", () => {
    const config = defaultDockerfileConfig();
    config.from = "golang:1.22-alpine";
    config.fromAlias = "builder";
    const result = generateDockerfile(config);
    expect(result).toContain("FROM golang:1.22-alpine AS builder");
  });

  it("WORKDIRを生成する", () => {
    const config = defaultDockerfileConfig();
    config.workdir = "/app";
    const result = generateDockerfile(config);
    expect(result).toContain("WORKDIR /app");
  });

  it("ARGをデフォルト値なしで生成する", () => {
    const config = defaultDockerfileConfig();
    config.args = [{ key: "VERSION", defaultValue: "" }];
    const result = generateDockerfile(config);
    expect(result).toContain("ARG VERSION");
    expect(result).not.toContain("ARG VERSION=");
  });

  it("ARGをデフォルト値ありで生成する", () => {
    const config = defaultDockerfileConfig();
    config.args = [{ key: "VERSION", defaultValue: "1.0.0" }];
    const result = generateDockerfile(config);
    expect(result).toContain("ARG VERSION=1.0.0");
  });

  it("key空のARGは無視する", () => {
    const config = defaultDockerfileConfig();
    config.args = [{ key: "", defaultValue: "value" }];
    const result = generateDockerfile(config);
    expect(result).not.toContain("ARG");
  });

  it("ENV単一項目を生成する", () => {
    const config = defaultDockerfileConfig();
    config.envs = [{ key: "NODE_ENV", value: "production" }];
    const result = generateDockerfile(config);
    expect(result).toContain("ENV NODE_ENV=production");
  });

  it("ENV複数項目をバックスラッシュ結合で生成する", () => {
    const config = defaultDockerfileConfig();
    config.envs = [
      { key: "FOO", value: "bar" },
      { key: "BAZ", value: "qux" },
    ];
    const result = generateDockerfile(config);
    expect(result).toContain("ENV \\");
    expect(result).toContain("FOO=bar \\");
    expect(result).toContain("BAZ=qux");
  });

  it("key空のENVは無視する", () => {
    const config = defaultDockerfileConfig();
    config.envs = [{ key: "", value: "value" }];
    const result = generateDockerfile(config);
    expect(result).not.toContain("ENV");
  });

  it("COPYを生成する", () => {
    const config = defaultDockerfileConfig();
    config.copies = [{ src: "package*.json", dest: "./" }];
    const result = generateDockerfile(config);
    expect(result).toContain("COPY package*.json ./");
  });

  it("src/destが空のCOPYは無視する", () => {
    const config = defaultDockerfileConfig();
    config.copies = [{ src: "", dest: "./" }];
    const result = generateDockerfile(config);
    expect(result).not.toContain("COPY");
  });

  it("RUN単一コマンドを生成する", () => {
    const config = defaultDockerfileConfig();
    config.runs = ["npm install"];
    const result = generateDockerfile(config);
    expect(result).toContain("RUN npm install");
  });

  it("RUN複数コマンドをANDで結合する", () => {
    const config = defaultDockerfileConfig();
    config.runs = ["apt-get update", "apt-get install -y curl", "rm -rf /var/lib/apt/lists/*"];
    const result = generateDockerfile(config);
    expect(result).toContain("RUN apt-get update \\");
    expect(result).toContain("&& apt-get install -y curl \\");
    expect(result).toContain("&& rm -rf /var/lib/apt/lists/*");
  });

  it("空のRUNコマンドは無視する", () => {
    const config = defaultDockerfileConfig();
    config.runs = ["", "npm install", ""];
    const result = generateDockerfile(config);
    expect(result).toContain("RUN npm install");
    expect((result.match(/RUN/g) ?? []).length).toBe(1);
  });

  it("EXPOSEを生成する", () => {
    const config = defaultDockerfileConfig();
    config.ports = ["3000", "8080"];
    const result = generateDockerfile(config);
    expect(result).toContain("EXPOSE 3000");
    expect(result).toContain("EXPOSE 8080");
  });

  it("USERを生成する", () => {
    const config = defaultDockerfileConfig();
    config.user = "node";
    const result = generateDockerfile(config);
    expect(result).toContain("USER node");
  });

  it("ENTRYPOINTを生成する", () => {
    const config = defaultDockerfileConfig();
    config.entrypoint = '["/bin/app"]';
    const result = generateDockerfile(config);
    expect(result).toContain('ENTRYPOINT ["/bin/app"]');
  });

  it("CMDを生成する", () => {
    const config = defaultDockerfileConfig();
    config.cmd = '["node", "server.js"]';
    const result = generateDockerfile(config);
    expect(result).toContain('CMD ["node", "server.js"]');
  });

  it("Node.jsテンプレート設定でDockerfileを生成する", () => {
    const template = DOCKERFILE_TEMPLATES.find((t) => t.label === "Node.js");
    expect(template).toBeDefined();
    const result = generateDockerfile(template!.config);
    expect(result).toContain("FROM node:20-alpine");
    expect(result).toContain("WORKDIR /app");
    expect(result).toContain("ENV NODE_ENV=production");
    expect(result).toContain("COPY package*.json ./");
    expect(result).toContain("RUN npm ci --only=production");
    expect(result).toContain("EXPOSE 3000");
    expect(result).toContain("USER node");
    expect(result).toContain('CMD ["node", "server.js"]');
  });

  it("Goテンプレート設定でFROM ... ASを生成する", () => {
    const template = DOCKERFILE_TEMPLATES.find((t) => t.label === "Go");
    expect(template).toBeDefined();
    const result = generateDockerfile(template!.config);
    expect(result).toContain("FROM golang:1.22-alpine AS builder");
  });

  it("命令の間に空行が入る", () => {
    const config: DockerfileConfig = {
      from: "alpine:3.20",
      fromAlias: "",
      workdir: "/app",
      args: [],
      envs: [{ key: "FOO", value: "bar" }],
      copies: [],
      runs: [],
      ports: [],
      user: "",
      entrypoint: "",
      cmd: "",
    };
    const result = generateDockerfile(config);
    expect(result).toContain("\n\n");
  });

  it("前後の空白をトリムして生成する", () => {
    const config = defaultDockerfileConfig();
    config.from = "  node:20-alpine  ";
    config.workdir = "  /app  ";
    const result = generateDockerfile(config);
    expect(result).toContain("FROM node:20-alpine");
    expect(result).toContain("WORKDIR /app");
  });
});
