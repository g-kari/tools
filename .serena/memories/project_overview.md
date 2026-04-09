# Project Overview

## Purpose

Cloudflare Workers上で動作するWebツール集。200以上のツールを提供する大規模プロジェクト。

## Tech Stack

- Runtime: Cloudflare Workers
- Framework: TanStack Start (React + TanStack Router)
- Language: TypeScript
- Build: Vite 7
- Unit Test: Vitest
- E2E Test: Playwright
- CSS: Tailwind CSS + Material Design 3

## Project Structure

- `app/routes/` - 各ツールのページコンポーネント（200以上）
- `app/functions/` - サーバーファンクション（whois, ip-geolocation, global-ip, server-env, ogp等）
- `app/components/` - 共通コンポーネント（Toast.tsx等）
- `app/hooks/` - カスタムフック
- `app/utils/` - ユーティリティ関数
- `app/lib/` - ライブラリ
- `app/types/` - 型定義
- `app/constants/` - 定数
- `app/styles/` - CSSファイル
- `tests/unit/` - ユニットテスト
- `tests/e2e/` - E2Eテスト（Playwright）

## Key Guidelines

- インラインスタイル（style属性）使用禁止 → app/styles.cssまたは専用CSSで定義
- alert()使用禁止 → app/components/Toast.tsxのトースト通知を使用
- JSDocコメントで80%以上のドキュメントカバレッジを維持
- Serena MCP積極活用
- Git Worktreeを使用した開発
