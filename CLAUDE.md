# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Cloudflare Workers上で動作するWebツール集（React + TanStack Start）。

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: TanStack Start (React + TanStack Router)
- **言語**: TypeScript
- **ビルドツール**: Vite+（`vite-plus` — Rolldown/Oxc ベース）
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## 開発コマンド

```bash
vp dev           # 開発サーバー起動（または npm run dev）
vp build         # ビルド（または npm run build）
vp check         # フォーマット + lint + 型チェック
vp check --fix   # 自動修正付きチェック
vp test run      # ユニットテスト実行（または npm test）
npm run deploy   # ビルド + Cloudflareデプロイ
```

## 行動原則

- **インラインスタイル原則禁止**: `style` 属性を使用せず、`app/styles.css` または専用CSSファイルで定義すること
- **`alert()` 使用禁止**: `app/components/Toast.tsx` のトースト通知を使用すること
- **コード解析にSerena活用**: ファイル検索・シンボル解析には必ずSerena MCPを使用すること
- **AIによる開発はGit Worktree使用**: `git worktree add wip/tools-feat-xxx feat/xxx`
- **コミット前は `vp check`**: `.vite-hooks/pre-commit` が自動で `vp staged` を実行する
