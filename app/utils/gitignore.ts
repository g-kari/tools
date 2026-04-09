/**
 * @fileoverview Gitignoreジェネレーターのテンプレート定義とユーティリティ関数
 * プログラミング言語・フレームワーク・IDE・OSごとの.gitignoreルールを管理する
 */

/**
 * Gitignoreテンプレートのカテゴリ種別
 * - language: プログラミング言語
 * - framework: Webフレームワーク
 * - ide: 統合開発環境
 * - os: オペレーティングシステム
 */
export type GitignoreCategory = "language" | "framework" | "ide" | "os";

/**
 * Gitignoreテンプレートの定義
 */
export interface GitignoreTemplate {
  /** テンプレートの一意識別子 */
  id: string;
  /** UIに表示するラベル */
  label: string;
  /** テンプレートのカテゴリ */
  category: GitignoreCategory;
  /** .gitignoreに書き込むルール内容 */
  content: string;
}

/** 全テンプレートの定義 */
const TEMPLATES: GitignoreTemplate[] = [
  // ===== 言語 =====
  {
    id: "node",
    label: "Node.js",
    category: "language",
    content:
      "node_modules/\ndist/\n.env\n.env.local\n.env.*.local\nnpm-debug.log*\nyarn-error.log*\n.pnpm-debug.log*\n*.tsbuildinfo\n.npm\n",
  },
  {
    id: "python",
    label: "Python",
    category: "language",
    content:
      "__pycache__/\n*.py[cod]\n*$py.class\n.Python\n.env\nvenv/\n.venv/\nENV/\n*.egg-info/\ndist/\nbuild/\n*.egg\n",
  },
  {
    id: "go",
    label: "Go",
    category: "language",
    content: "*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n/vendor/\n/Godeps/\n*.test\n*.out\n",
  },
  {
    id: "rust",
    label: "Rust",
    category: "language",
    content: "/target/\nCargo.lock\n**/*.rs.bk\n",
  },
  {
    id: "java",
    label: "Java",
    category: "language",
    content: "*.class\n*.jar\n*.war\n*.ear\nhs_err_pid*\ntarget/\n.gradle/\nbuild/\n",
  },
  {
    id: "ruby",
    label: "Ruby",
    category: "language",
    content: "*.gem\n*.rbc\n.bundle/\nvendor/bundle/\nGemfile.lock\n/.yardoc/\n/doc/\n",
  },
  {
    id: "php",
    label: "PHP",
    category: "language",
    content: "vendor/\n.env\ncomposer.phar\n*.log\n",
  },
  {
    id: "cpp",
    label: "C/C++",
    category: "language",
    content:
      "*.o\n*.obj\n*.exe\n*.out\n*.so\n*.dylib\n*.dll\nbuild/\ncmake-build-*\nCMakeFiles/\nCMakeCache.txt\n",
  },
  {
    id: "csharp",
    label: "C#",
    category: "language",
    content: "bin/\nobj/\n*.user\n.vs/\n*.suo\n[Dd]ebug/\n[Rr]elease/\n",
  },
  {
    id: "swift",
    label: "Swift",
    category: "language",
    content: ".build/\n*.xcworkspace\n*.xcuserstate\nPackages/\nxcuserdata/\n.swiftpm/\n",
  },
  {
    id: "dart",
    label: "Dart/Flutter",
    category: "language",
    content:
      ".dart_tool/\n.flutter-plugins\n.flutter-plugins-dependencies\n.pub-cache/\nbuild/\n*.g.dart\n",
  },
  // ===== フレームワーク =====
  {
    id: "react",
    label: "React",
    category: "framework",
    content: "build/\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n",
  },
  {
    id: "nextjs",
    label: "Next.js",
    category: "framework",
    content: ".next/\nout/\n.env*.local\nnext-env.d.ts\n",
  },
  {
    id: "vue",
    label: "Vue",
    category: "framework",
    content: "dist/\n.env.local\n.env.*.local\n",
  },
  {
    id: "nuxt",
    label: "Nuxt",
    category: "framework",
    content: ".nuxt/\ndist/\n.env\n.output/\n",
  },
  {
    id: "django",
    label: "Django",
    category: "framework",
    content: "*.log\nlocal_settings.py\ndb.sqlite3\nmedia/\nstaticfiles/\n__pycache__/\n*.pyc\n",
  },
  {
    id: "rails",
    label: "Ruby on Rails",
    category: "framework",
    content: "log/\ntmp/\nstorage/\n.byebug_history\nconfig/master.key\nconfig/credentials/*.key\n",
  },
  {
    id: "laravel",
    label: "Laravel",
    category: "framework",
    content:
      "vendor/\n.env\nstorage/app/*\n!storage/app/.gitignore\nstorage/logs/*\n!storage/logs/.gitignore\nbootstrap/cache/*\n!bootstrap/cache/.gitignore\n",
  },
  {
    id: "spring",
    label: "Spring Boot",
    category: "framework",
    content: "target/\n*.war\n*.ear\n*.jar\n!gradle-wrapper.jar\napplication-*.properties\n",
  },
  // ===== IDE =====
  {
    id: "vscode",
    label: "VSCode",
    category: "ide",
    content:
      ".vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n!.vscode/extensions.json\n*.code-workspace\n.history/\n",
  },
  {
    id: "jetbrains",
    label: "JetBrains",
    category: "ide",
    content: ".idea/\n*.iml\n*.iws\n*.ipr\nout/\n",
  },
  {
    id: "vim",
    label: "Vim",
    category: "ide",
    content: "*.swp\n*.swo\n*~\n.netrwhist\nSession.vim\n",
  },
  {
    id: "emacs",
    label: "Emacs",
    category: "ide",
    content: "*~\n\\#*\\#\n/.emacs.desktop\n/.emacs.desktop.lock\n*.elc\nauto-save-list\n",
  },
  {
    id: "xcode",
    label: "Xcode",
    category: "ide",
    content:
      "*.xcodeproj/**/xcuserdata/\n*.xcworkspace\nxcuserdata/\nbuild/\nDerivedData/\n*.moved-aside\n",
  },
  // ===== OS =====
  {
    id: "macos",
    label: "macOS",
    category: "os",
    content:
      ".DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes\n.fseventsd\n.TemporaryItems\n",
  },
  {
    id: "windows",
    label: "Windows",
    category: "os",
    content: "Thumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n*.lnk\n",
  },
  {
    id: "linux",
    label: "Linux",
    category: "os",
    content: "*~\n.fuse_hidden*\n.directory\n.Trash-*\n.nfs*\n",
  },
];

/**
 * 全テンプレートの一覧を返す
 * @returns GitignoreTemplate の配列
 */
export function getTemplates(): GitignoreTemplate[] {
  return TEMPLATES;
}

/**
 * カテゴリの日本語表示名を返す
 * @param category - テンプレートカテゴリ
 * @returns 日本語カテゴリ名
 */
export function getCategoryLabel(category: GitignoreCategory): string {
  const labels: Record<GitignoreCategory, string> = {
    language: "言語",
    framework: "フレームワーク",
    ide: "IDE",
    os: "OS",
  };
  return labels[category];
}

/**
 * カテゴリの表示順序
 */
export const CATEGORY_ORDER: GitignoreCategory[] = ["language", "framework", "ide", "os"];

/**
 * 選択されたテンプレートIDから.gitignoreファイルの内容を生成する
 * 各テンプレートには "# === ラベル ===" 形式のセクションヘッダーが付与される
 * @param selectedIds - 選択されたテンプレートIDの配列
 * @returns 生成された.gitignoreファイルの内容文字列（未選択の場合は空文字列）
 */
export function generateGitignoreContent(selectedIds: string[]): string {
  if (selectedIds.length === 0) return "";

  const templateMap = new Map(TEMPLATES.map((t) => [t.id, t]));
  const sections: string[] = [];

  for (const id of selectedIds) {
    const template = templateMap.get(id);
    if (!template) continue;
    sections.push(`# === ${template.label} ===\n${template.content}`);
  }

  return sections.join("\n");
}
