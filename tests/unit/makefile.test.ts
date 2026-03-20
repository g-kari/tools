import { describe, it, expect } from "vitest";
import {
  getTemplates,
  generateMakefile,
  MAKEFILE_TEMPLATES,
  type ProjectType,
} from "~/utils/makefile";

describe("getTemplates", () => {
  it("テンプレート一覧が空でない", () => {
    const templates = getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("各テンプレートにid・label・defaultAppName・descriptionが存在する", () => {
    const templates = getTemplates();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.defaultAppName).toBeTruthy();
      expect(t.description).toBeTruthy();
    }
  });

  it("MAKEFILE_TEMPLATESと同じ内容を返す", () => {
    expect(getTemplates()).toEqual(MAKEFILE_TEMPLATES);
  });

  it("全プロジェクト種別が含まれる", () => {
    const templates = getTemplates();
    const ids = templates.map((t) => t.id);
    expect(ids).toContain("nodejs");
    expect(ids).toContain("python");
    expect(ids).toContain("go");
    expect(ids).toContain("rust");
    expect(ids).toContain("c");
    expect(ids).toContain("cpp");
  });
});

describe("generateMakefile - 共通", () => {
  const projectTypes: ProjectType[] = [
    "nodejs",
    "python",
    "go",
    "rust",
    "c",
    "cpp",
  ];

  for (const projectType of projectTypes) {
    it(`${projectType}: helpターゲットが含まれる`, () => {
      const result = generateMakefile({
        projectType,
        appName: "myapp",
        includeDocker: false,
        includeLint: false,
      });
      expect(result).toContain("help:");
    });

    it(`${projectType}: .PHONYが含まれる`, () => {
      const result = generateMakefile({
        projectType,
        appName: "myapp",
        includeDocker: false,
        includeLint: false,
      });
      expect(result).toContain(".PHONY:");
    });

    it(`${projectType}: アプリ名が反映される`, () => {
      const result = generateMakefile({
        projectType,
        appName: "myapp",
        includeDocker: false,
        includeLint: false,
      });
      expect(result).toContain("myapp");
    });

    it(`${projectType}: appNameが空でもデフォルト値「app」が使われる`, () => {
      const result = generateMakefile({
        projectType,
        appName: "",
        includeDocker: false,
        includeLint: false,
      });
      expect(result).toContain("app");
    });

    it(`${projectType}: includeDocker=trueでDockerターゲットが含まれる`, () => {
      const result = generateMakefile({
        projectType,
        appName: "myapp",
        includeDocker: true,
        includeLint: false,
      });
      expect(result).toContain("docker-build:");
      expect(result).toContain("docker-run:");
    });

    it(`${projectType}: includeDocker=falseでDockerターゲットが含まれない`, () => {
      const result = generateMakefile({
        projectType,
        appName: "myapp",
        includeDocker: false,
        includeLint: false,
      });
      expect(result).not.toContain("docker-build:");
    });
  }
});

describe("generateMakefile - Node.js", () => {
  it("installターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "nodejs",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("install:");
    expect(result).toContain("npm install");
  });

  it("devターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "nodejs",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("dev:");
  });

  it("buildターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "nodejs",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("build:");
    expect(result).toContain("npm run build");
  });

  it("includeLint=trueでlintターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "nodejs",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("lint:");
    expect(result).toContain("npm run lint");
  });

  it("includeLint=falseでlintターゲットが含まれない", () => {
    const result = generateMakefile({
      projectType: "nodejs",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).not.toContain("npm run lint");
  });
});

describe("generateMakefile - Python", () => {
  it("venvターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "python",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("venv:");
  });

  it("pytestが含まれる", () => {
    const result = generateMakefile({
      projectType: "python",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("pytest");
  });

  it("includeLint=trueでruffが含まれる", () => {
    const result = generateMakefile({
      projectType: "python",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("ruff");
  });
});

describe("generateMakefile - Go", () => {
  it("go buildが含まれる", () => {
    const result = generateMakefile({
      projectType: "go",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("go build");
  });

  it("go testが含まれる", () => {
    const result = generateMakefile({
      projectType: "go",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("go test");
  });

  it("go mod tidyが含まれる", () => {
    const result = generateMakefile({
      projectType: "go",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("go mod tidy");
  });

  it("includeLint=trueでgolangci-lintが含まれる", () => {
    const result = generateMakefile({
      projectType: "go",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("golangci-lint");
  });
});

describe("generateMakefile - Rust", () => {
  it("cargo buildが含まれる", () => {
    const result = generateMakefile({
      projectType: "rust",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("cargo build");
  });

  it("cargo testが含まれる", () => {
    const result = generateMakefile({
      projectType: "rust",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("cargo test");
  });

  it("includeLint=trueでcargo clippyが含まれる", () => {
    const result = generateMakefile({
      projectType: "rust",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("cargo clippy");
  });

  it("includeLint=trueでcargo fmtが含まれる", () => {
    const result = generateMakefile({
      projectType: "rust",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("cargo fmt");
  });
});

describe("generateMakefile - C", () => {
  it("gccが含まれる", () => {
    const result = generateMakefile({
      projectType: "c",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("gcc");
  });

  it("cleanターゲットが含まれる", () => {
    const result = generateMakefile({
      projectType: "c",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("clean:");
  });

  it("includeLint=trueでclang-tidyが含まれる", () => {
    const result = generateMakefile({
      projectType: "c",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("clang-tidy");
  });
});

describe("generateMakefile - C++", () => {
  it("g++が含まれる", () => {
    const result = generateMakefile({
      projectType: "cpp",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("g++");
  });

  it("C++17フラグが含まれる", () => {
    const result = generateMakefile({
      projectType: "cpp",
      appName: "myapp",
      includeDocker: false,
      includeLint: false,
    });
    expect(result).toContain("-std=c++17");
  });

  it("includeLint=trueでclang-tidyが含まれる", () => {
    const result = generateMakefile({
      projectType: "cpp",
      appName: "myapp",
      includeDocker: false,
      includeLint: true,
    });
    expect(result).toContain("clang-tidy");
  });
});
