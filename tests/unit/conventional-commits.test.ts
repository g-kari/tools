import { describe, it, expect } from "vite-plus/test";
import {
  parseConventionalCommit,
  getCommitTypeInfo,
} from "../../app/utils/conventional-commits";

describe("parseConventionalCommit - 空入力", () => {
  it("空文字列は無効", () => {
    const result = parseConventionalCommit("");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "EMPTY_MESSAGE")).toBe(true);
  });

  it("スペースのみも無効", () => {
    const result = parseConventionalCommit("   ");
    expect(result.valid).toBe(false);
  });
});

describe("parseConventionalCommit - ヘッダー行のパース", () => {
  it("基本形式: type: description", () => {
    const result = parseConventionalCommit("feat: add new feature");
    expect(result.valid).toBe(true);
    expect(result.type).toBe("feat");
    expect(result.scope).toBeNull();
    expect(result.breakingMark).toBe(false);
    expect(result.description).toBe("add new feature");
  });

  it("スコープ付き: type(scope): description", () => {
    const result = parseConventionalCommit("fix(api): handle null response");
    expect(result.valid).toBe(true);
    expect(result.type).toBe("fix");
    expect(result.scope).toBe("api");
    expect(result.description).toBe("handle null response");
  });

  it("BREAKING CHANGE マーク: type!: description", () => {
    const result = parseConventionalCommit("feat!: remove old API");
    expect(result.valid).toBe(true);
    expect(result.breakingMark).toBe(true);
    expect(result.isBreaking).toBe(true);
  });

  it("スコープ + BREAKING CHANGE: type(scope)!: description", () => {
    const result = parseConventionalCommit("feat(api)!: remove endpoint");
    expect(result.valid).toBe(true);
    expect(result.type).toBe("feat");
    expect(result.scope).toBe("api");
    expect(result.breakingMark).toBe(true);
  });

  it("全コミットタイプを有効として認識する", () => {
    const types = [
      "feat",
      "fix",
      "docs",
      "style",
      "refactor",
      "perf",
      "test",
      "chore",
      "build",
      "ci",
      "revert",
    ];
    for (const type of types) {
      const result = parseConventionalCommit(`${type}: some change`);
      expect(result.valid).toBe(true);
      expect(result.type).toBe(type);
      expect(result.warnings.some((w) => w.code === "UNKNOWN_TYPE")).toBe(
        false
      );
    }
  });

  it("未知のタイプは警告が出るが有効", () => {
    const result = parseConventionalCommit("improvement: something");
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "UNKNOWN_TYPE")).toBe(true);
  });

  it("セパレーターなしは無効", () => {
    const result = parseConventionalCommit("feat add feature");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_SEPARATOR")).toBe(
      true
    );
  });

  it("大文字始まりのタイプは無効", () => {
    const result = parseConventionalCommit("Feat: add feature");
    expect(result.valid).toBe(false);
  });

  it("空のスコープは無効", () => {
    const result = parseConventionalCommit("feat(): add feature");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "EMPTY_SCOPE")).toBe(true);
  });
});

describe("parseConventionalCommit - 警告", () => {
  it("説明が大文字始まりで警告", () => {
    const result = parseConventionalCommit("feat: Add new feature");
    expect(result.warnings.some((w) => w.code === "DESCRIPTION_UPPERCASE")).toBe(
      true
    );
  });

  it("説明がピリオド終わりで警告", () => {
    const result = parseConventionalCommit("feat: add new feature.");
    expect(result.warnings.some((w) => w.code === "DESCRIPTION_PERIOD")).toBe(
      true
    );
  });

  it("ヘッダー行が72文字超で警告", () => {
    const longDesc = "a".repeat(70);
    const result = parseConventionalCommit(`feat: ${longDesc}`);
    expect(
      result.warnings.some(
        (w) => w.code === "HEADER_LONG" || w.code === "HEADER_TOO_LONG"
      )
    ).toBe(true);
  });

  it("ヘッダーとボディの間に空行がないと警告", () => {
    const msg = "feat: add feature\nThis is the body";
    const result = parseConventionalCommit(msg);
    expect(
      result.warnings.some((w) => w.code === "MISSING_BLANK_LINE_AFTER_HEADER")
    ).toBe(true);
  });
});

describe("parseConventionalCommit - ボディパース", () => {
  it("ボディを正しく抽出する", () => {
    const msg = "feat: add feature\n\nThis is the body of the commit.";
    const result = parseConventionalCommit(msg);
    expect(result.valid).toBe(true);
    expect(result.body).toBe("This is the body of the commit.");
  });

  it("複数段落のボディを保持する", () => {
    const msg =
      "fix: handle error\n\nFirst paragraph.\n\nSecond paragraph.";
    const result = parseConventionalCommit(msg);
    expect(result.body).toContain("First paragraph.");
    expect(result.body).toContain("Second paragraph.");
  });

  it("ボディなしは null", () => {
    const result = parseConventionalCommit("chore: update deps");
    expect(result.body).toBeNull();
  });
});

describe("parseConventionalCommit - フッターパース", () => {
  it("BREAKING CHANGE フッターを認識する", () => {
    const msg = `feat!: remove endpoint\n\nBREAKING CHANGE: /v1/users removed`;
    const result = parseConventionalCommit(msg);
    expect(result.hasBreakingFooter).toBe(true);
    expect(result.footers.length).toBe(1);
    expect(result.footers[0].token).toBe("BREAKING CHANGE");
    expect(result.footers[0].value).toBe("/v1/users removed");
    expect(result.footers[0].isBreaking).toBe(true);
  });

  it("BREAKING-CHANGE は BREAKING CHANGE に正規化される", () => {
    const msg = `feat: change\n\nBREAKING-CHANGE: something changed`;
    const result = parseConventionalCommit(msg);
    expect(result.footers[0].token).toBe("BREAKING CHANGE");
  });

  it("通常のフッターを認識する", () => {
    const msg = `fix: bug\n\nRefs: #1234\nCloses: #5678`;
    const result = parseConventionalCommit(msg);
    expect(result.footers.length).toBe(2);
    expect(result.footers[0].token).toBe("Refs");
    expect(result.footers[0].value).toBe("#1234");
    expect(result.footers[1].token).toBe("Closes");
    expect(result.footers[1].value).toBe("#5678");
  });

  it("# セパレーターのフッターを認識する", () => {
    const msg = `fix: bug\n\nFixes #123`;
    const result = parseConventionalCommit(msg);
    expect(result.footers.length).toBe(1);
    expect(result.footers[0].token).toBe("Fixes");
    expect(result.footers[0].value).toBe("123");
  });

  it("フッターなしは空配列", () => {
    const result = parseConventionalCommit("chore: clean up");
    expect(result.footers).toHaveLength(0);
    expect(result.hasBreakingFooter).toBe(false);
  });

  it("isBreaking は ! またはフッターで true になる", () => {
    const withMark = parseConventionalCommit("feat!: breaking");
    expect(withMark.isBreaking).toBe(true);

    const withFooter = parseConventionalCommit(
      `feat: change\n\nBREAKING CHANGE: something`
    );
    expect(withFooter.isBreaking).toBe(true);

    const normal = parseConventionalCommit("fix: bug");
    expect(normal.isBreaking).toBe(false);
  });
});

describe("parseConventionalCommit - 複合ケース", () => {
  it("フル形式のコミットをパースする", () => {
    const msg = `feat(auth)!: add OAuth2 support

Implements full OAuth2 authorization code flow.
Supports Google and GitHub providers.

BREAKING CHANGE: removed basic auth endpoint
Refs: #100
Co-authored-by: Alice <alice@example.com>`;

    const result = parseConventionalCommit(msg);
    expect(result.valid).toBe(true);
    expect(result.type).toBe("feat");
    expect(result.scope).toBe("auth");
    expect(result.breakingMark).toBe(true);
    expect(result.description).toBe("add OAuth2 support");
    expect(result.body).toContain("OAuth2 authorization");
    expect(result.footers.length).toBe(3);
    expect(result.hasBreakingFooter).toBe(true);
    expect(result.isBreaking).toBe(true);
  });

  it("raw プロパティに元のメッセージが保持される", () => {
    const msg = "fix: correct typo";
    const result = parseConventionalCommit(msg);
    expect(result.raw).toBe(msg);
  });
});

describe("getCommitTypeInfo", () => {
  it("既知のタイプの情報を返す", () => {
    const info = getCommitTypeInfo("feat");
    expect(info).not.toBeNull();
    expect(info?.type).toBe("feat");
    expect(info?.emoji).toBe("✨");
  });

  it("未知のタイプは null を返す", () => {
    const info = getCommitTypeInfo("unknown-type");
    expect(info).toBeNull();
  });
});
