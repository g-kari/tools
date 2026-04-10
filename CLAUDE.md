# CLAUDE.md

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

- **コード解析にSerena活用**: ファイル検索・シンボル解析には必ずSerena MCPを使用すること
