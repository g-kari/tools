/**
 * @fileoverview Makefileジェネレーターのテンプレート定義とユーティリティ関数
 * プロジェクト種別ごとのMakefileテンプレートを管理し、カスタム設定に基づいてMakefileを生成する
 */

/**
 * サポートするプロジェクト種別
 */
export type ProjectType = "nodejs" | "python" | "go" | "rust" | "c" | "cpp";

/**
 * Makefileの生成オプション
 */
export interface MakefileOptions {
  /** プロジェクト種別 */
  projectType: ProjectType;
  /** アプリケーション/バイナリ名 */
  appName: string;
  /** Dockerターゲットを含むか */
  includeDocker: boolean;
  /** リントターゲットを含むか */
  includeLint: boolean;
}

/**
 * プロジェクト種別テンプレートの定義
 */
export interface MakefileTemplate {
  /** テンプレートの一意識別子 */
  id: ProjectType;
  /** UIに表示するラベル */
  label: string;
  /** デフォルトのアプリ名 */
  defaultAppName: string;
  /** テンプレートの説明 */
  description: string;
}

/** 全テンプレートの定義 */
export const MAKEFILE_TEMPLATES: MakefileTemplate[] = [
  {
    id: "nodejs",
    label: "Node.js",
    defaultAppName: "app",
    description: "npm プロジェクト向け",
  },
  {
    id: "python",
    label: "Python",
    defaultAppName: "app",
    description: "pip/venv プロジェクト向け",
  },
  {
    id: "go",
    label: "Go",
    defaultAppName: "app",
    description: "Go モジュールプロジェクト向け",
  },
  {
    id: "rust",
    label: "Rust",
    defaultAppName: "app",
    description: "Cargo プロジェクト向け",
  },
  {
    id: "c",
    label: "C",
    defaultAppName: "app",
    description: "C言語プロジェクト向け",
  },
  {
    id: "cpp",
    label: "C++",
    defaultAppName: "app",
    description: "C++プロジェクト向け",
  },
];

/**
 * Makefileのヘルプターゲットを生成する
 * @param targets ターゲット名と説明のペア
 * @returns ヘルプターゲットの文字列
 */
function buildHelpTarget(targets: Record<string, string>): string {
  const lines = [
    `.PHONY: help`,
    `help: ## このヘルプを表示`,
    `\t@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'`,
    ``,
  ];
  return (
    lines.join("\n") +
    Object.keys(targets)
      .map(() => "")
      .join("")
  );
}

/** ヘルプターゲットのスニペット */
const HELP_TARGET = `.PHONY: help
help: ## このヘルプを表示
\t@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'
`;

/**
 * Dockerターゲットを生成する
 * @param appName アプリケーション名
 * @returns Dockerターゲットの文字列
 */
function buildDockerTargets(appName: string): string {
  return `
# Docker
.PHONY: docker-build docker-run docker-push
docker-build: ## Dockerイメージをビルド
\tdocker build -t $(APP_NAME) .

docker-run: ## Dockerコンテナを起動
\tdocker run --rm -p 3000:3000 $(APP_NAME)

docker-push: ## Dockerイメージをプッシュ
\tdocker push $(APP_NAME)
`.replace(/\$\(APP_NAME\)/g, `$(APP_NAME)`);
}

/**
 * Node.js用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generateNodejsMakefile(
  appName: string,
  includeDocker: boolean,
  includeLint: boolean,
): string {
  const lines: string[] = [
    `# Node.js Makefile`,
    `APP_NAME := ${appName}`,
    `NODE_ENV ?= development`,
    ``,
    `${HELP_TARGET}`,
    `# 依存関係`,
    `.PHONY: install`,
    `install: ## 依存パッケージをインストール`,
    `\tnpm install`,
    ``,
    `# 開発`,
    `.PHONY: dev`,
    `dev: ## 開発サーバーを起動`,
    `\tnpm run dev`,
    ``,
    `# ビルド`,
    `.PHONY: build`,
    `build: ## 本番用ビルドを実行`,
    `\tnpm run build`,
    ``,
    `# テスト`,
    `.PHONY: test`,
    `test: ## テストを実行`,
    `\tnpm test`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物を削除`,
    `\trm -rf dist node_modules/.cache`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# リント・フォーマット`,
      `.PHONY: lint format`,
      `lint: ## リントを実行`,
      `\tnpm run lint`,
      ``,
      `format: ## コードをフォーマット`,
      `\tnpm run format`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * Python用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generatePythonMakefile(
  appName: string,
  includeDocker: boolean,
  includeLint: boolean,
): string {
  const lines: string[] = [
    `# Python Makefile`,
    `APP_NAME := ${appName}`,
    `PYTHON ?= python3`,
    `VENV := .venv`,
    ``,
    `${HELP_TARGET}`,
    `# 仮想環境`,
    `.PHONY: venv`,
    `venv: ## 仮想環境を作成`,
    `\t$(PYTHON) -m venv $(VENV)`,
    ``,
    `# 依存関係`,
    `.PHONY: install`,
    `install: ## 依存パッケージをインストール`,
    `\t$(VENV)/bin/pip install -r requirements.txt`,
    ``,
    `# 実行`,
    `.PHONY: run`,
    `run: ## アプリケーションを起動`,
    `\t$(VENV)/bin/python -m ${appName}`,
    ``,
    `# テスト`,
    `.PHONY: test`,
    `test: ## テストを実行`,
    `\t$(VENV)/bin/pytest`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物・キャッシュを削除`,
    `\trm -rf __pycache__ .pytest_cache dist build *.egg-info`,
    `\tfind . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# リント・フォーマット`,
      `.PHONY: lint format`,
      `lint: ## リントを実行（ruff）`,
      `\t$(VENV)/bin/ruff check .`,
      ``,
      `format: ## コードをフォーマット（ruff format）`,
      `\t$(VENV)/bin/ruff format .`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * Go用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generateGoMakefile(appName: string, includeDocker: boolean, includeLint: boolean): string {
  const lines: string[] = [
    `# Go Makefile`,
    `APP_NAME := ${appName}`,
    `BUILD_DIR := ./bin`,
    `MAIN_PKG := ./cmd/$(APP_NAME)`,
    ``,
    `${HELP_TARGET}`,
    `# 依存関係`,
    `.PHONY: tidy`,
    `tidy: ## go.mod・go.sumを整理`,
    `\tgo mod tidy`,
    ``,
    `# ビルド`,
    `.PHONY: build`,
    `build: ## バイナリをビルド`,
    `\tgo build -o $(BUILD_DIR)/$(APP_NAME) $(MAIN_PKG)`,
    ``,
    `# 実行`,
    `.PHONY: run`,
    `run: ## アプリケーションを起動`,
    `\tgo run $(MAIN_PKG)`,
    ``,
    `# テスト`,
    `.PHONY: test`,
    `test: ## テストを実行`,
    `\tgo test ./...`,
    ``,
    `test-cover: ## カバレッジ付きでテストを実行`,
    `\tgo test -cover ./...`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物を削除`,
    `\trm -rf $(BUILD_DIR)`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# リント`,
      `.PHONY: lint vet`,
      `lint: ## golangci-lintを実行`,
      `\tgolangci-lint run ./...`,
      ``,
      `vet: ## go vetを実行`,
      `\tgo vet ./...`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * Rust用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generateRustMakefile(
  appName: string,
  includeDocker: boolean,
  includeLint: boolean,
): string {
  const lines: string[] = [
    `# Rust Makefile`,
    `APP_NAME := ${appName}`,
    ``,
    `${HELP_TARGET}`,
    `# ビルド`,
    `.PHONY: build build-release`,
    `build: ## デバッグビルドを実行`,
    `\tcargo build`,
    ``,
    `build-release: ## リリースビルドを実行`,
    `\tcargo build --release`,
    ``,
    `# 実行`,
    `.PHONY: run`,
    `run: ## アプリケーションを起動`,
    `\tcargo run`,
    ``,
    `# テスト`,
    `.PHONY: test`,
    `test: ## テストを実行`,
    `\tcargo test`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物を削除`,
    `\tcargo clean`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# リント・フォーマット`,
      `.PHONY: lint fmt`,
      `lint: ## Clippyでリントを実行`,
      `\tcargo clippy -- -D warnings`,
      ``,
      `fmt: ## rustfmtでコードをフォーマット`,
      `\tcargo fmt`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * C言語用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generateCMakefile(appName: string, includeDocker: boolean, includeLint: boolean): string {
  const lines: string[] = [
    `# C Makefile`,
    `APP_NAME := ${appName}`,
    `CC := gcc`,
    `CFLAGS := -Wall -Wextra -O2`,
    `SRC_DIR := src`,
    `BUILD_DIR := build`,
    `SRCS := $(wildcard $(SRC_DIR)/*.c)`,
    `OBJS := $(SRCS:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)`,
    ``,
    `${HELP_TARGET}`,
    `# ビルド`,
    `.PHONY: all`,
    `all: $(BUILD_DIR)/$(APP_NAME) ## バイナリをビルド`,
    ``,
    `$(BUILD_DIR)/$(APP_NAME): $(OBJS)`,
    `\t@mkdir -p $(BUILD_DIR)`,
    `\t$(CC) $(CFLAGS) -o $@ $^`,
    ``,
    `$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c`,
    `\t@mkdir -p $(BUILD_DIR)`,
    `\t$(CC) $(CFLAGS) -c -o $@ $<`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物を削除`,
    `\trm -rf $(BUILD_DIR)`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# 静的解析`,
      `.PHONY: lint`,
      `lint: ## clang-tidyで静的解析を実行`,
      `\tclang-tidy $(SRCS) -- $(CFLAGS)`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * C++用Makefileを生成する
 * @param appName アプリケーション名
 * @param includeDocker Dockerターゲットを含むか
 * @param includeLint リントターゲットを含むか
 * @returns 生成されたMakefileの文字列
 */
function generateCppMakefile(
  appName: string,
  includeDocker: boolean,
  includeLint: boolean,
): string {
  const lines: string[] = [
    `# C++ Makefile`,
    `APP_NAME := ${appName}`,
    `CXX := g++`,
    `CXXFLAGS := -Wall -Wextra -O2 -std=c++17`,
    `SRC_DIR := src`,
    `BUILD_DIR := build`,
    `SRCS := $(wildcard $(SRC_DIR)/*.cpp)`,
    `OBJS := $(SRCS:$(SRC_DIR)/%.cpp=$(BUILD_DIR)/%.o)`,
    ``,
    `${HELP_TARGET}`,
    `# ビルド`,
    `.PHONY: all`,
    `all: $(BUILD_DIR)/$(APP_NAME) ## バイナリをビルド`,
    ``,
    `$(BUILD_DIR)/$(APP_NAME): $(OBJS)`,
    `\t@mkdir -p $(BUILD_DIR)`,
    `\t$(CXX) $(CXXFLAGS) -o $@ $^`,
    ``,
    `$(BUILD_DIR)/%.o: $(SRC_DIR)/%.cpp`,
    `\t@mkdir -p $(BUILD_DIR)`,
    `\t$(CXX) $(CXXFLAGS) -c -o $@ $<`,
    ``,
    `# クリーン`,
    `.PHONY: clean`,
    `clean: ## ビルド成果物を削除`,
    `\trm -rf $(BUILD_DIR)`,
    ``,
  ];

  if (includeLint) {
    lines.push(
      `# 静的解析`,
      `.PHONY: lint`,
      `lint: ## clang-tidyで静的解析を実行`,
      `\tclang-tidy $(SRCS) -- $(CXXFLAGS)`,
      ``,
    );
  }

  if (includeDocker) {
    lines.push(buildDockerTargets(appName));
  }

  return lines.join("\n");
}

/**
 * 指定されたオプションに基づいてMakefileを生成する
 * @param options 生成オプション
 * @returns 生成されたMakefileの文字列
 */
export function generateMakefile(options: MakefileOptions): string {
  const { projectType, appName, includeDocker, includeLint } = options;
  const name = appName.trim() || "app";

  switch (projectType) {
    case "nodejs":
      return generateNodejsMakefile(name, includeDocker, includeLint);
    case "python":
      return generatePythonMakefile(name, includeDocker, includeLint);
    case "go":
      return generateGoMakefile(name, includeDocker, includeLint);
    case "rust":
      return generateRustMakefile(name, includeDocker, includeLint);
    case "c":
      return generateCMakefile(name, includeDocker, includeLint);
    case "cpp":
      return generateCppMakefile(name, includeDocker, includeLint);
    default:
      return "";
  }
}

/**
 * 全テンプレートの一覧を返す
 * @returns MakefileTemplateの配列
 */
export function getTemplates(): MakefileTemplate[] {
  return MAKEFILE_TEMPLATES;
}

// buildHelpTarget関数はモジュール内部で使用しているため再エクスポートしない
void buildHelpTarget;
