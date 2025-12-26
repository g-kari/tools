# Tools - Web ツール集

様々な便利なWebツールを集めたサイトです。Cloudflare Workers上で動作します。

## 機能

### Unicode エスケープ変換ツール

日本語などのUnicode文字を `\uXXXX` 形式のエスケープシーケンスに変換したり、その逆変換を行うツールです。

**使用例:**
- 入力: `こんにちは`
- 出力: `\u3053\u3093\u306b\u3061\u306f`

### WHOIS 検索ツール

ドメイン名のWHOIS情報を検索できるツールです。ドメインの登録情報、有効期限、ネームサーバーなどを確認できます。

## 技術スタック

- **ランタイム**: Cloudflare Workers
- **フレームワーク**: TanStack Start (React + TanStack Router)
- **言語**: TypeScript
- **ビルドツール**: Vite 7
- **テスト**: Vitest（ユニットテスト）、Playwright（E2Eテスト）

## セットアップ

### 必要な環境

- Node.js 18以上
- npm

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

### デプロイ

Cloudflare Workersにデプロイする前に、Cloudflareアカウントを作成し、Wranglerでログインしてください。

```bash
npx wrangler login
npm run deploy
```

## テスト

### ユニットテスト

```bash
# テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### E2Eテスト

```bash
npm run test:e2e
```

## プロジェクト構成

```
.
├── app/
│   ├── router.tsx        # ルーター設定
│   ├── client.tsx        # クライアントエントリ
│   ├── ssr.tsx           # SSRエントリ
│   ├── styles.css        # 共通スタイル
│   ├── routes/
│   │   ├── __root.tsx    # ルートレイアウト
│   │   ├── index.tsx     # Unicode変換ページ (/)
│   │   └── whois.tsx     # WHOIS検索ページ (/whois)
│   └── functions/
│       └── whois.ts      # WHOISサーバーファンクション
├── tests/
│   ├── app.test.ts       # ユニットテスト
│   └── e2e.spec.ts       # E2Eテスト
├── package.json
├── tsconfig.json
├── vite.config.ts        # Vite設定
├── vitest.config.ts      # Vitest設定
├── playwright.config.ts  # Playwright設定
└── wrangler.jsonc        # Cloudflare Workers設定
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
