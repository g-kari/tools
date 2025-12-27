# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Cloudflare Workers上で動作するWebツール集です。以下のツールを提供しています：

- **Unicodeエスケープ変換** - Unicode文字列のエスケープ/アンエスケープ変換
- **WHOIS検索** - ドメイン情報の検索
- **IPジオロケーション** - IPアドレスから地理情報を取得
- **グローバルIP確認** - アクセス元のグローバルIPアドレスを表示

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: TanStack Start (React + TanStack Router)
- **言語**: TypeScript
- **ビルドツール**: Vite 7
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

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

**重要**: コミット前に必ず以下のテストを**すべて**実行し、成功を確認してください：

```bash
# 1. ユニットテストを実行（必須）
npm test

# 2. ビルドを実行（必須）
npm run build

# 3. E2Eテストを実行（必須）
npm run test:e2e
```

### E2Eテストの実行方法

E2Eテストを実行するには、事前にビルドが必要です：

```bash
# ビルドしてからE2Eテスト実行
npm run build && npm run test:e2e
```

**注意**: E2Eテストはビルド済みのアプリケーションに対して実行されます。コード変更後は必ず`npm run build`を実行してからE2Eテストを行ってください。

### テスト失敗時の対応

- ユニットテストが失敗: コードの問題を修正してください
- ビルドが失敗: TypeScriptエラーや依存関係の問題を解決してください
- E2Eテストが失敗: UIの問題やテストの期待値を確認してください

**すべてのテストが成功するまでコミットしないでください。**

## プロジェクト構造

```
.
├── app/
│   ├── router.tsx        # ルーター設定
│   ├── client.tsx        # クライアントエントリ
│   ├── ssr.tsx           # SSRエントリ
│   ├── start.tsx         # TanStack Start設定
│   ├── styles.css        # 共通スタイル
│   ├── routes/
│   │   ├── __root.tsx        # ルートレイアウト
│   │   ├── index.tsx         # Unicode変換ページ (/)
│   │   ├── whois.tsx         # WHOIS検索ページ (/whois)
│   │   ├── ip-geolocation.tsx # IPジオロケーションページ (/ip-geolocation)
│   │   └── global-ip.tsx     # グローバルIP確認ページ (/global-ip)
│   └── functions/
│       ├── whois.ts          # WHOISサーバーファンクション
│       ├── ip-geolocation.ts # IPジオロケーションファンクション
│       └── global-ip.ts      # グローバルIPファンクション
├── tests/
│   ├── app.test.ts       # ユニットテスト
│   └── e2e.spec.ts       # E2Eテスト（Playwright）
├── package.json
├── tsconfig.json
├── vite.config.ts        # Vite設定
├── vitest.config.ts
├── playwright.config.ts
└── wrangler.jsonc        # Cloudflare Workers設定
```

## 開発ガイドライン

- Material Design 3のカラーシステムを使用
- アクセシビリティを考慮（ARIAラベル、キーボードナビゲーション対応）
- レスポンシブデザイン対応
- 日本語UIをメインにサポート
- TanStack Startのサーバーファンクションを使用してAPI実装
