/**
 * @fileoverview .gitattributes ジェネレーターのテンプレート定義とユーティリティ関数
 * 言語・フレームワーク・Git LFS・GitHub Linguist ごとのルールを管理する
 */

/**
 * gitattributes テンプレートのカテゴリ種別
 * - general: 汎用ルール（改行コード正規化など）
 * - language: プログラミング言語固有ルール
 * - lfs: Git Large File Storage
 * - linguist: GitHub Linguist 設定
 */
export type GitAttributesCategory = "general" | "language" | "lfs" | "linguist";

/**
 * gitattributes テンプレートの定義
 */
export interface GitAttributesTemplate {
  /** テンプレートの一意識別子 */
  id: string;
  /** UIに表示するラベル */
  label: string;
  /** テンプレートのカテゴリ */
  category: GitAttributesCategory;
  /** .gitattributes に書き込むルール内容 */
  content: string;
}

/** カテゴリ表示順の定義 */
export const CATEGORY_ORDER: GitAttributesCategory[] = ["general", "language", "lfs", "linguist"];

/** 全テンプレートの定義 */
const TEMPLATES: GitAttributesTemplate[] = [
  // ===== 汎用 =====
  {
    id: "auto-crlf",
    label: "改行コード自動正規化",
    category: "general",
    content: "# 改行コードを自動検出してリポジトリ内は LF に統一\n* text=auto\n",
  },
  {
    id: "web-lf",
    label: "Webファイル（LF固定）",
    category: "general",
    content:
      "# Web フロントエンドファイルは LF 固定\n*.html text eol=lf\n*.css text eol=lf\n*.js text eol=lf\n*.mjs text eol=lf\n*.cjs text eol=lf\n*.ts text eol=lf\n*.tsx text eol=lf\n*.jsx text eol=lf\n*.json text eol=lf\n*.svg text eol=lf\n",
  },
  {
    id: "shell-lf",
    label: "シェルスクリプト（LF固定）",
    category: "general",
    content:
      "# シェルスクリプトは LF 固定（Windows でも UNIX 系ツールが処理）\n*.sh text eol=lf\n*.bash text eol=lf\n*.zsh text eol=lf\n*.fish text eol=lf\nMakefile text eol=lf\n",
  },
  {
    id: "windows-batch",
    label: "Windowsバッチ（CRLF固定）",
    category: "general",
    content:
      "# Windows バッチファイルは CRLF 固定\n*.bat text eol=crlf\n*.cmd text eol=crlf\n*.ps1 text eol=crlf\n",
  },
  {
    id: "common-binary",
    label: "共通バイナリファイル",
    category: "general",
    content:
      "# 画像・フォント・圧縮ファイルはバイナリ扱い（diff/改行変換を無効化）\n*.png binary\n*.jpg binary\n*.jpeg binary\n*.gif binary\n*.webp binary\n*.avif binary\n*.ico binary\n*.bmp binary\n*.tiff binary\n*.woff binary\n*.woff2 binary\n*.ttf binary\n*.otf binary\n*.eot binary\n*.zip binary\n*.gz binary\n*.tar binary\n*.tgz binary\n*.7z binary\n*.rar binary\n",
  },
  {
    id: "export-ignore",
    label: "アーカイブから除外（export-ignore）",
    category: "general",
    content:
      "# git archive 時に除外するファイル・ディレクトリ\n.gitattributes export-ignore\n.gitignore export-ignore\n.editorconfig export-ignore\n.github/ export-ignore\n.gitlab/ export-ignore\ntests/ export-ignore\ndocs/ export-ignore\n*.test.ts export-ignore\n*.spec.ts export-ignore\n",
  },

  // ===== 言語 =====
  {
    id: "node",
    label: "Node.js / TypeScript",
    category: "language",
    content:
      "# Node.js / TypeScript\n*.js text eol=lf\n*.mjs text eol=lf\n*.cjs text eol=lf\n*.ts text eol=lf\n*.tsx text eol=lf\n*.jsx text eol=lf\n*.json text eol=lf\n*.jsonc text eol=lf\npackage.json text eol=lf\npackage-lock.json text eol=lf\nyarn.lock text eol=lf\npnpm-lock.yaml text eol=lf\n.npmignore text eol=lf\n",
  },
  {
    id: "python",
    label: "Python",
    category: "language",
    content:
      "# Python\n*.py text eol=lf\n*.pyw text eol=lf\n*.pyi text eol=lf\n*.ipynb text eol=lf\nrequirements*.txt text eol=lf\nPipfile text eol=lf\npyproject.toml text eol=lf\nsetup.cfg text eol=lf\n*.cfg text eol=lf\n*.pickle binary\n*.pkl binary\n",
  },
  {
    id: "go",
    label: "Go",
    category: "language",
    content: "# Go\n*.go text eol=lf\ngo.mod text eol=lf\ngo.sum text eol=lf\n",
  },
  {
    id: "ruby",
    label: "Ruby",
    category: "language",
    content:
      "# Ruby\n*.rb text eol=lf\n*.rake text eol=lf\n*.gemspec text eol=lf\nGemfile text eol=lf\nGemfile.lock text eol=lf\nRakefile text eol=lf\n",
  },
  {
    id: "java",
    label: "Java / Kotlin",
    category: "language",
    content:
      "# Java / Kotlin\n*.java text eol=lf\n*.kt text eol=lf\n*.kts text eol=lf\n*.groovy text eol=lf\n*.gradle text eol=lf\n*.xml text eol=lf\n*.properties text eol=lf\n*.class binary\n*.jar binary\n*.war binary\n*.ear binary\n",
  },
  {
    id: "c-cpp",
    label: "C / C++",
    category: "language",
    content:
      "# C / C++\n*.c text eol=lf\n*.cc text eol=lf\n*.cpp text eol=lf\n*.cxx text eol=lf\n*.h text eol=lf\n*.hh text eol=lf\n*.hpp text eol=lf\n*.hxx text eol=lf\n*.o binary\n*.a binary\n*.so binary\n*.dylib binary\n*.dll binary\n*.exe binary\n",
  },
  {
    id: "rust",
    label: "Rust",
    category: "language",
    content: "# Rust\n*.rs text eol=lf\nCargo.toml text eol=lf\nCargo.lock text eol=lf\n",
  },
  {
    id: "php",
    label: "PHP",
    category: "language",
    content:
      "# PHP\n*.php text eol=lf\n*.phtml text eol=lf\n*.blade.php text eol=lf\ncomposer.json text eol=lf\ncomposer.lock text eol=lf\n",
  },
  {
    id: "dotnet",
    label: "C# / .NET",
    category: "language",
    content:
      "# C# / .NET\n*.cs text eol=crlf\n*.vb text eol=crlf\n*.csproj text eol=crlf\n*.vbproj text eol=crlf\n*.sln text eol=crlf\n*.config text eol=crlf\n*.resx text eol=crlf\n*.dll binary\n*.exe binary\n*.pdb binary\n",
  },
  {
    id: "swift",
    label: "Swift",
    category: "language",
    content:
      "# Swift\n*.swift text eol=lf\nPackage.swift text eol=lf\nPackage.resolved text eol=lf\n*.xcodeproj/** text eol=lf\n*.xcworkspace/** text eol=lf\n",
  },

  // ===== Git LFS =====
  {
    id: "lfs-images",
    label: "画像ファイル（LFS）",
    category: "lfs",
    content:
      "# 画像ファイルを Git LFS で管理\n*.png filter=lfs diff=lfs merge=lfs -text\n*.jpg filter=lfs diff=lfs merge=lfs -text\n*.jpeg filter=lfs diff=lfs merge=lfs -text\n*.gif filter=lfs diff=lfs merge=lfs -text\n*.webp filter=lfs diff=lfs merge=lfs -text\n*.avif filter=lfs diff=lfs merge=lfs -text\n*.bmp filter=lfs diff=lfs merge=lfs -text\n*.tiff filter=lfs diff=lfs merge=lfs -text\n*.psd filter=lfs diff=lfs merge=lfs -text\n*.ai filter=lfs diff=lfs merge=lfs -text\n",
  },
  {
    id: "lfs-video",
    label: "動画・音声ファイル（LFS）",
    category: "lfs",
    content:
      "# 動画・音声ファイルを Git LFS で管理\n*.mp4 filter=lfs diff=lfs merge=lfs -text\n*.mov filter=lfs diff=lfs merge=lfs -text\n*.avi filter=lfs diff=lfs merge=lfs -text\n*.mkv filter=lfs diff=lfs merge=lfs -text\n*.webm filter=lfs diff=lfs merge=lfs -text\n*.mp3 filter=lfs diff=lfs merge=lfs -text\n*.wav filter=lfs diff=lfs merge=lfs -text\n*.flac filter=lfs diff=lfs merge=lfs -text\n*.ogg filter=lfs diff=lfs merge=lfs -text\n*.aac filter=lfs diff=lfs merge=lfs -text\n",
  },
  {
    id: "lfs-docs",
    label: "ドキュメントファイル（LFS）",
    category: "lfs",
    content:
      "# 大型ドキュメントを Git LFS で管理\n*.pdf filter=lfs diff=lfs merge=lfs -text\n*.docx filter=lfs diff=lfs merge=lfs -text\n*.xlsx filter=lfs diff=lfs merge=lfs -text\n*.pptx filter=lfs diff=lfs merge=lfs -text\n*.doc filter=lfs diff=lfs merge=lfs -text\n*.xls filter=lfs diff=lfs merge=lfs -text\n*.ppt filter=lfs diff=lfs merge=lfs -text\n",
  },
  {
    id: "lfs-archives",
    label: "アーカイブ・バイナリ（LFS）",
    category: "lfs",
    content:
      "# アーカイブ・バイナリを Git LFS で管理\n*.zip filter=lfs diff=lfs merge=lfs -text\n*.tar filter=lfs diff=lfs merge=lfs -text\n*.gz filter=lfs diff=lfs merge=lfs -text\n*.tgz filter=lfs diff=lfs merge=lfs -text\n*.7z filter=lfs diff=lfs merge=lfs -text\n*.rar filter=lfs diff=lfs merge=lfs -text\n*.exe filter=lfs diff=lfs merge=lfs -text\n*.dmg filter=lfs diff=lfs merge=lfs -text\n*.iso filter=lfs diff=lfs merge=lfs -text\n",
  },

  // ===== GitHub Linguist =====
  {
    id: "linguist-vendored",
    label: "ベンダーディレクトリを除外",
    category: "linguist",
    content:
      "# GitHub の言語統計からベンダーコードを除外\nvendor/** linguist-vendored\nnode_modules/** linguist-vendored\npublic/vendor/** linguist-vendored\nassets/vendor/** linguist-vendored\nstatic/vendor/** linguist-vendored\n",
  },
  {
    id: "linguist-generated",
    label: "生成コードを除外",
    category: "linguist",
    content:
      "# 自動生成コードを GitHub の言語統計から除外\ndist/** linguist-generated\nbuild/** linguist-generated\n*.min.js linguist-generated\n*.min.css linguist-generated\n*.bundle.js linguist-generated\napp/routeTree.gen.ts linguist-generated\n*.pb.go linguist-generated\n*.generated.ts linguist-generated\n",
  },
  {
    id: "linguist-docs",
    label: "ドキュメントを言語統計から除外",
    category: "linguist",
    content:
      "# ドキュメントを GitHub の言語統計から除外\ndocs/** linguist-documentation\n*.md linguist-documentation\n*.rst linguist-documentation\n*.txt linguist-documentation\n",
  },
  {
    id: "linguist-language",
    label: "言語を明示指定（例）",
    category: "linguist",
    content:
      "# ファイル拡張子と言語の対応を明示（例: .tsx を TypeScript と認識させる）\n*.tsx linguist-language=TypeScript\n*.mjs linguist-language=JavaScript\n",
  },
];

/**
 * 全テンプレートを返す
 * @returns GitAttributesTemplate の配列
 */
export function getTemplates(): GitAttributesTemplate[] {
  return TEMPLATES;
}

/**
 * カテゴリの日本語ラベルを返す
 * @param category - カテゴリ識別子
 * @returns 日本語ラベル
 */
export function getCategoryLabel(category: GitAttributesCategory): string {
  const labels: Record<GitAttributesCategory, string> = {
    general: "汎用",
    language: "言語",
    lfs: "Git LFS",
    linguist: "GitHub Linguist",
  };
  return labels[category];
}

/**
 * 選択されたテンプレートIDから .gitattributes ファイルの内容を生成する
 * @param selectedIds - 選択されたテンプレートIDの配列
 * @returns 生成された .gitattributes の文字列
 */
export function generateGitAttributesContent(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "";

  const selected = TEMPLATES.filter((t) => selectedIds.includes(t.id));
  if (selected.length === 0) return "";

  const lines: string[] = [
    "# .gitattributes",
    "# 生成日時: " + new Date().toISOString().split("T")[0],
    "",
  ];

  for (const template of selected) {
    lines.push(template.content.trimEnd());
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
