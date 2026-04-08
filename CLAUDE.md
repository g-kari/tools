# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Cloudflare Workers上で動作するWebツール集（React + TanStack Start）。

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: TanStack Start (React + TanStack Router)
- **言語**: TypeScript
- **ビルドツール**: Vite 7
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run deploy   # デプロイ
```

## 行動原則

- **インラインスタイル原則禁止**: `style` 属性を使用せず、CSSファイルで定義すること
- **`alert()` 使用禁止**: `app/components/Toast.tsx` のトースト通知を使用すること
- **コード解析にSerena活用**: ファイル検索・シンボル解析には必ずSerena MCPを使用すること
- **AIによる開発はGit Worktree使用**: `git worktree add wip/tools-feat-xxx feat/xxx`
