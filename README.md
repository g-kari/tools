# Tools - Web ツール集

様々な便利なWebツールを集めたサイトです。

## 機能

### Unicode エスケープ変換ツール

日本語などのUnicode文字を `\uXXXX` 形式のエスケープシーケンスに変換したり、その逆変換を行うツールです。

**使用例:**
- 入力: `こんにちは`
- 出力: `\u3053\u3093\u306b\u3061\u306f`

## 技術スタック

- **Cloudflare Workers**: サーバーレスプラットフォーム
- **Hono**: 軽量で高速なWebフレームワーク
- **TypeScript**: 型安全な開発

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ローカルで http://localhost:8787 にアクセスできます。

### デプロイ

Cloudflare Workersにデプロイする前に、Cloudflareアカウントを作成し、Wranglerでログインしてください。

```bash
npx wrangler login
npm run deploy
```

## プロジェクト構成

```
.
├── src/
│   └── index.ts        # メインアプリケーションファイル
├── package.json        # プロジェクト依存関係
├── tsconfig.json       # TypeScript設定
├── wrangler.toml       # Cloudflare Workers設定
└── README.md          # このファイル
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。