# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Cloudflare Workers上で動作するWebツール集です。現在、Unicodeエスケープ変換ツールを提供しています。

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: Hono
- **言語**: TypeScript
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（localhost:8787）
npm run dev

# ビルド（SSG生成）
npm run build

# デプロイ
npm run deploy
```

## テストコマンド

```bash
# ユニットテスト実行
npm test

# ユニットテストをウォッチモードで実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# E2Eテスト実行
npm run test:e2e
```

## コミット前の必須事項

**重要**: コミット前に必ず以下のテストを実行してください：

```bash
# ユニットテストを実行
npm test

# E2Eテストを実行（可能であれば）
npm run test:e2e
```

テストが全て通過していることを確認してからコミットしてください。

## プロジェクト構造

```
.
├── src/
│   ├── app.ts          # メインアプリケーション（Hono）
│   ├── index.ts        # エントリーポイント
│   └── ssg.ts          # 静的サイト生成スクリプト
├── tests/
│   ├── app.test.ts     # ユニットテスト
│   └── e2e.spec.ts     # E2Eテスト（Playwright）
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── wrangler.toml       # Cloudflare Workers設定
```

## 開発ガイドライン

- Material Design 3のカラーシステムを使用
- アクセシビリティを考慮（ARIAラベル、キーボードナビゲーション対応）
- レスポンシブデザイン対応
- 日本語UIをメインにサポート
