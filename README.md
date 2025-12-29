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

### IP ジオロケーションツール
IPアドレスから地理情報（国、都市、緯度経度など）を取得するツールです。

### グローバルIP確認ツール
アクセス元のグローバルIPアドレスを表示するツールです。

### UUID 生成ツール
UUID v4形式のユニークIDを生成するツールです。

### URL エンコード/デコードツール
URL文字列のエンコード（パーセントエンコーディング）およびデコードを行うツールです。

### パスワード生成ツール
安全なランダムパスワードを生成するツールです。長さや使用する文字種（大文字、小文字、数字、記号）を指定できます。

### JSON 整形ツール
JSONデータの整形（フォーマット）および検証を行うツールです。

### サーバー環境確認ツール
Cloudflare Workersのサーバー環境情報を表示するツールです。

### 正規表現チェッカー
正規表現パターンのテスト・検証を行うツールです。マッチ結果をリアルタイムで確認できます。

### JWT デコーダー
JWT（JSON Web Token）トークンをデコードし、ヘッダーとペイロードの内容を確認できるツールです。

### OGP チェッカー
URLを入力してOpen Graph Protocol（OGP）情報を取得・確認できるツールです。SNSでのシェア時の表示を事前に確認できます。

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
│   ├── start.tsx         # TanStack Start設定
│   ├── styles.css        # 共通スタイル
│   ├── routes/
│   │   ├── __root.tsx           # ルートレイアウト
│   │   ├── index.tsx            # Unicode変換ページ (/)
│   │   ├── whois.tsx            # WHOIS検索ページ (/whois)
│   │   ├── ip-geolocation.tsx   # IPジオロケーションページ (/ip-geolocation)
│   │   ├── global-ip.tsx        # グローバルIP確認ページ (/global-ip)
│   │   ├── uuid.tsx             # UUID生成ページ (/uuid)
│   │   ├── url-encode.tsx       # URLエンコードページ (/url-encode)
│   │   ├── password-generator.tsx # パスワード生成ページ (/password-generator)
│   │   ├── json.tsx             # JSON整形ページ (/json)
│   │   ├── server-env.tsx       # サーバー環境ページ (/server-env)
│   │   ├── regex-checker.tsx    # 正規表現チェッカーページ (/regex-checker)
│   │   ├── jwt.tsx              # JWTデコーダーページ (/jwt)
│   │   └── ogp.tsx              # OGPチェッカーページ (/ogp)
│   └── functions/
│       ├── whois.ts             # WHOISサーバーファンクション
│       ├── ip-geolocation.ts    # IPジオロケーションファンクション
│       ├── global-ip.ts         # グローバルIPファンクション
│       ├── server-env.ts        # サーバー環境ファンクション
│       └── ogp.ts               # OGPファンクション
├── tests/
│   ├── unit/             # ユニットテスト
│   └── e2e/              # E2Eテスト（Playwright）
├── package.json
├── tsconfig.json
├── vite.config.ts        # Vite設定
├── vitest.config.ts      # Vitest設定
├── playwright.config.ts  # Playwright設定
└── wrangler.jsonc        # Cloudflare Workers設定
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
