# Tools - Web ツール集

様々な便利なWebツールを集めたサイトです。Cloudflare Workers上で動作します。

## 機能

エンコード・デコード、ハッシュ・暗号、JSON / YAML / XML、色変換、日付・時刻、画像・QR、ネットワーク系ツールなど **300 種類以上**のツールを提供しています。

全ツールの一覧・カテゴリは `app/routes/top.tsx` の `toolCatalog` を参照するか、本番サイトのトップページで確認できます。

ツール一覧と Ctrl+K / Cmd+K の検索では、ツール名・説明・カテゴリ名・パスを検索できます。`JSON 圧縮` のように空白で区切るとすべての語で絞り込みます。前後の空白、大文字小文字、全角英数字・半角かなの違いを吸収し、検索語はサーバーへ送信・保存しません。

検索ダイアログは Tab / Shift+Tab で中の操作を循環し、Esc・閉じるボタン・外側クリックで取り消せます。取り消した後は検索を開いたボタンや入力欄へ戻ります。検索欄では矢印キーで結果を選び、Enter で開けます。

ワールドクロックは最初に時刻の読み込み表示を出し、画面の起動後にブラウザーの現在時刻・ローカルタイムゾーンを反映します。サーバーの時刻やタイムゾーンを現地時刻として表示せず、以後は従来どおり1秒ごとに更新します。

JSON Linesの整形・圧縮・JSON配列との相互変換は、数値の元の表記（大整数、小数、指数、負のゼロ）、文字列のエスケープ、キー順と重複キーを保持します。空白と配列の外枠だけを変更し、1レコード1行を維持します。無効な入力を許可するものではなく、重複キーの解釈や数値計算、元の空白の完全な復元は行いません。詳しくは [JSON Linesのトークン保持](docs/json-lines-token-preservation.md) を参照してください。

主要カテゴリ:

- **エンコード/デコード系**: Base16/32/36/58/62/64/85、URL エンコード、Unicode エスケープ、他
- **ハッシュ・暗号系**: MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512、JWT Inspector、他
- **テキスト・データ系**: JSON / YAML / XML / TOML 整形、正規表現チェッカー、diff、他
- **色・デザイン系**: RGB / HSL / CMYK / HEX 変換、グラデーション、カラーパレット、他
- **日付・時刻系**: タイムゾーン、Unix 時刻、和暦、タイマー、他
- **ネットワーク系**: WHOIS、IP ジオロケーション、OGP、DNS、他
- **画像・QR 系**: QR コード生成・読み取り、画像圧縮、他

## 新しいツールを追加するには

[`docs/tools-guide.md`](docs/tools-guide.md) にテンプレートと手順をまとめています。最小限のチェックリストは [`.claude/rules/new-tool.md`](.claude/rules/new-tool.md) にあります。

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
│   ├── styles.css        # 共通スタイル（各ツールCSSをimport）
│   ├── styles/tools/     # 各ツール専用CSS
│   ├── components/       # 共通Reactコンポーネント
│   ├── hooks/            # 共通カスタムフック
│   ├── utils/            # 共通ユーティリティ
│   ├── functions/        # TanStack Start サーバーファンクション
│   └── routes/           # 各ツールのルート（300以上。top.tsxで一覧管理）
├── docs/                 # 開発者向けドキュメント
│   ├── tools-guide.md            # 新ツール追加ガイド
│   └── cloudflare-cache-rules.md # CDNキャッシュ方針
├── .claude/rules/        # AI向けプロジェクトルール
├── tests/
│   ├── unit/             # ユニットテスト (Vitest)
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
