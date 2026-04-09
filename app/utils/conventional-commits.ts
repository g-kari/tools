/**
 * Conventional Commits パーサー・バリデーター
 * https://www.conventionalcommits.org/ja/v1.0.0/
 */

/** 標準のコミットタイプ */
export const COMMIT_TYPES = [
  { type: "feat", description: "新機能の追加", emoji: "✨", bump: "minor" },
  { type: "fix", description: "バグ修正", emoji: "🐛", bump: "patch" },
  { type: "docs", description: "ドキュメントの変更のみ", emoji: "📝", bump: "none" },
  {
    type: "style",
    description: "コードの意味に影響しない変更（空白・フォーマット等）",
    emoji: "💄",
    bump: "none",
  },
  {
    type: "refactor",
    description: "バグ修正でも機能追加でもないコード変更",
    emoji: "♻️",
    bump: "none",
  },
  { type: "perf", description: "パフォーマンス改善", emoji: "⚡", bump: "patch" },
  { type: "test", description: "テストの追加・修正", emoji: "✅", bump: "none" },
  {
    type: "chore",
    description: "ビルドプロセスや補助ツールの変更",
    emoji: "🔧",
    bump: "none",
  },
  {
    type: "build",
    description: "ビルドシステムや外部依存関係の変更",
    emoji: "📦",
    bump: "none",
  },
  {
    type: "ci",
    description: "CIの設定・スクリプトの変更",
    emoji: "👷",
    bump: "none",
  },
  { type: "revert", description: "以前のコミットの取り消し", emoji: "⏪", bump: "patch" },
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number]["type"];

/** コミットメッセージのフッター情報 */
export interface CommitFooter {
  /** フッタートークン */
  token: string;
  /** セパレーター（": " または " #"） */
  separator: string;
  /** フッター値 */
  value: string;
  /** BREAKING CHANGE フラグ */
  isBreaking: boolean;
}

/** バリデーションエラー */
export interface ValidationError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
}

/** バリデーション警告 */
export interface ValidationWarning {
  /** 警告コード */
  code: string;
  /** 警告メッセージ */
  message: string;
}

/** コミットメッセージのパース結果 */
export interface ParsedCommit {
  /** パースが成功したか */
  valid: boolean;
  /** コミットタイプ */
  type: string | null;
  /** スコープ */
  scope: string | null;
  /** BREAKING CHANGE フラグ（! マーク） */
  breakingMark: boolean;
  /** 説明（ヘッダー行の description 部分） */
  description: string | null;
  /** ボディ */
  body: string | null;
  /** フッター一覧 */
  footers: CommitFooter[];
  /** BREAKING CHANGE フッターの有無 */
  hasBreakingFooter: boolean;
  /** 全体として BREAKING CHANGE か（! またはフッター） */
  isBreaking: boolean;
  /** 元のメッセージ */
  raw: string;
  /** バリデーションエラー */
  errors: ValidationError[];
  /** バリデーション警告 */
  warnings: ValidationWarning[];
}

/**
 * フッタートークン行かどうかを判定する
 * Conventional Commits spec: BREAKING CHANGE, BREAKING-CHANGE, または英数字ハイフン記号
 */
function isFooterTokenLine(line: string): boolean {
  return /^(BREAKING[ -]CHANGE|[A-Za-z][A-Za-z0-9-]*)(: | #)/.test(line);
}

/**
 * 空行でブロックに分割する
 */
function splitIntoParagraphs(lines: string[]): string[][] {
  const paragraphs: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line === "") {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    paragraphs.push(current);
  }

  return paragraphs;
}

/**
 * パラグラフのフッターをパースする
 */
function parseFooterParagraph(lines: string[]): CommitFooter[] {
  const footers: CommitFooter[] = [];
  let currentToken: string | null = null;
  let currentSep = "";
  let currentValueLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(BREAKING[ -]CHANGE|[A-Za-z][A-Za-z0-9-]*)(: | #)(.*)$/);
    if (match) {
      if (currentToken !== null) {
        const normalized = currentToken === "BREAKING-CHANGE" ? "BREAKING CHANGE" : currentToken;
        footers.push({
          token: normalized,
          separator: currentSep,
          value: currentValueLines.join("\n"),
          isBreaking: normalized === "BREAKING CHANGE",
        });
      }
      currentToken = match[1];
      currentSep = match[2];
      currentValueLines = [match[3]];
    } else if (currentToken !== null) {
      currentValueLines.push(line);
    }
  }

  if (currentToken !== null) {
    const normalized = currentToken === "BREAKING-CHANGE" ? "BREAKING CHANGE" : currentToken;
    footers.push({
      token: normalized,
      separator: currentSep,
      value: currentValueLines.join("\n"),
      isBreaking: normalized === "BREAKING CHANGE",
    });
  }

  return footers;
}

/**
 * Conventional Commits のメッセージをパース・検証する
 */
export function parseConventionalCommit(message: string): ParsedCommit {
  const raw = message;
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!message.trim()) {
    return {
      valid: false,
      type: null,
      scope: null,
      breakingMark: false,
      description: null,
      body: null,
      footers: [],
      hasBreakingFooter: false,
      isBreaking: false,
      raw,
      errors: [{ code: "EMPTY_MESSAGE", message: "コミットメッセージが空です" }],
      warnings: [],
    };
  }

  const lines = message.split("\n");
  const headerLine = lines[0];

  // ヘッダー行のパース: type(scope)!: description
  const headerMatch = headerLine.match(/^([a-z][a-z0-9-]*)(\(([^)]*)\))?(!)?: (.+)$/);

  let type: string | null = null;
  let scope: string | null = null;
  let breakingMark = false;
  let description: string | null = null;

  if (!headerMatch) {
    // より詳細なエラーメッセージを提供
    if (!headerLine.includes(":")) {
      errors.push({
        code: "MISSING_SEPARATOR",
        message: '": " セパレーターが見つかりません。形式: "type(scope): description"',
      });
    } else if (!/^[a-z]/.test(headerLine)) {
      errors.push({
        code: "INVALID_TYPE_START",
        message: "コミットタイプは小文字アルファベットで始まる必要があります",
      });
    } else {
      errors.push({
        code: "INVALID_HEADER",
        message: 'ヘッダー行の形式が不正です。正しい形式: "type(scope): description"',
      });
    }
  } else {
    type = headerMatch[1];
    scope = headerMatch[3] ?? null;
    breakingMark = headerMatch[4] === "!";
    description = headerMatch[5];

    // タイプの検証
    const knownTypes = COMMIT_TYPES.map((t) => t.type as string);
    if (!knownTypes.includes(type)) {
      warnings.push({
        code: "UNKNOWN_TYPE",
        message: `"${type}" は標準の Conventional Commits タイプではありません。標準タイプ: ${knownTypes.join(", ")}`,
      });
    }

    // 説明の検証
    if (!description.trim()) {
      errors.push({ code: "EMPTY_DESCRIPTION", message: "説明が空です" });
    }

    // 説明が大文字始まりかチェック（慣例的に小文字）
    if (description && /^[A-Z]/.test(description)) {
      warnings.push({
        code: "DESCRIPTION_UPPERCASE",
        message: "説明は通常、小文字で始めます（命令形・英小文字が慣例）",
      });
    }

    // 説明がピリオドで終わっていないか
    if (description && description.endsWith(".")) {
      warnings.push({
        code: "DESCRIPTION_PERIOD",
        message: "説明の末尾にピリオドは不要です",
      });
    }

    // スコープが空でないか
    if (scope !== null && scope.trim() === "") {
      errors.push({
        code: "EMPTY_SCOPE",
        message: "スコープが空です。スコープを削除するか、値を入力してください",
      });
    }
  }

  // ヘッダー行の長さチェック（72文字推奨、100文字警告）
  if (headerLine.length > 100) {
    warnings.push({
      code: "HEADER_TOO_LONG",
      message: `ヘッダー行が長すぎます（${headerLine.length}文字）。100文字以内を推奨します`,
    });
  } else if (headerLine.length > 72) {
    warnings.push({
      code: "HEADER_LONG",
      message: `ヘッダー行が長めです（${headerLine.length}文字）。72文字以内が理想的です`,
    });
  }

  // ボディとフッターのパース
  let body: string | null = null;
  const footers: CommitFooter[] = [];

  if (lines.length > 1) {
    // ヘッダーの後に空行がない場合は警告
    if (lines[1] !== "") {
      warnings.push({
        code: "MISSING_BLANK_LINE_AFTER_HEADER",
        message: "ヘッダー行の後に空行が必要です（Conventional Commits 仕様）",
      });
    }

    // ヘッダー以降を段落に分割
    const remainingLines = lines.slice(2);
    const paragraphs = splitIntoParagraphs(remainingLines);

    // 末尾からフッター段落を特定
    const footerParagraphIndices: Set<number> = new Set();
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const para = paragraphs[i];
      if (para.length > 0 && isFooterTokenLine(para[0])) {
        footerParagraphIndices.add(i);
      } else {
        break; // フッター以外が来たら終了
      }
    }

    // ボディ段落とフッター段落を分離
    for (let i = 0; i < paragraphs.length; i++) {
      if (footerParagraphIndices.has(i)) {
        const parsed = parseFooterParagraph(paragraphs[i]);
        footers.push(...parsed);
      } else {
        const bodyText = paragraphs[i].join("\n").trim();
        if (bodyText) {
          body = body ? `${body}\n\n${bodyText}` : bodyText;
        }
      }
    }
  }

  const hasBreakingFooter = footers.some((f) => f.isBreaking);
  const isBreaking = breakingMark || hasBreakingFooter;

  return {
    valid: errors.length === 0,
    type,
    scope,
    breakingMark,
    description,
    body,
    footers,
    hasBreakingFooter,
    isBreaking,
    raw,
    errors,
    warnings,
  };
}

/**
 * コミットタイプの情報を取得する
 */
export function getCommitTypeInfo(type: string): (typeof COMMIT_TYPES)[number] | null {
  return COMMIT_TYPES.find((t) => t.type === type) ?? null;
}

/** コミットメッセージのサンプル例 */
export const COMMIT_EXAMPLES = [
  {
    label: "新機能 (feat)",
    value: "feat(auth): add OAuth2 login support",
  },
  {
    label: "バグ修正 (fix)",
    value: "fix(api): handle null response from upstream service",
  },
  {
    label: "BREAKING CHANGE (!)",
    value: `feat(api)!: remove deprecated v1 endpoint

The /v1/users endpoint has been removed after deprecation period.
Please migrate to /v2/users.

BREAKING CHANGE: /v1/users endpoint removed, use /v2/users instead
Refs: #1234`,
  },
  {
    label: "ドキュメント (docs)",
    value: "docs(readme): add installation instructions",
  },
  {
    label: "スコープなし",
    value: "chore: update dependencies",
  },
] as const;
