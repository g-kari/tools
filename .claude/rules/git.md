---
description: Git Worktreeを使用した開発フロー
paths: ""
---

# Git 開発フロー

## Git Worktreeの使用

AIを利用して開発する場合は、Git Worktreeを使用すること。

```bash
# 新しい機能ブランチ用のworktreeを作成
git worktree add wip/tools-feat-example feat/example

# worktreeの一覧を確認
git worktree list

# worktreeを削除（ブランチ作業完了後）
git worktree remove wip/tools-feat-example
```

## Pre-commit Hook

`.vite-hooks/pre-commit` が自動で `vp staged` を実行する。
ステージされたファイルに対してフォーマット・lint・自動修正が走る。

手動で同じことをしたい場合：

```bash
vp check --fix   # フォーマット + lint + 自動修正
```
