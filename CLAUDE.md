# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

<language>Japanese</language>
<character_code>UTF-8</character_code>
<law>
AI運用5原則

第1原則： AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

第2原則： AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

第3原則： AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

第4原則： AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

第5原則： AIは全てのチャットの冒頭にこの5原則を逐語的に必ず画面出力してから対応する。
</law>

<every_chat>
[AI運用5原則]

[main_output]

#[n] times. # n = increment each chat, end line, etc(#1, #2...)
</every_chat>

## プロジェクト概要

Cloudflare Workers上で動作するWebツール集です。以下のツールを提供しています：

- **Unicodeエスケープ変換** - Unicode文字列のエスケープ/アンエスケープ変換
- **WHOIS検索** - ドメイン情報の検索
- **IPジオロケーション** - IPアドレスから地理情報を取得
- **グローバルIP確認** - アクセス元のグローバルIPアドレスを表示
- **UUID生成** - UUID v4の生成
- **URLエンコード/デコード** - URL文字列のエンコード/デコード変換
- **パスワード生成** - 安全なランダムパスワードの生成
- **JSON整形** - JSONデータの整形・検証
- **サーバー環境** - サーバー環境情報の表示
- **正規表現チェッカー** - 正規表現のテスト・検証
- **JWTデコーダー** - JWTトークンのデコード・検証
- **OGPチェッカー** - Open Graph Protocol情報の取得・確認

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

**重要**: コミット前に必ず以下を実行し、成功を確認してください：

```bash
# 1. ユニットテストを実行（必須）
npm test

# 2. ビルドを実行（必須）
npm run build
```

**ユニットテストとビルドが成功するまでコミットしないでください。**

### E2Eテストについて

**E2Eテストの実装は必須です。** 新しい機能やページを追加した場合は、対応するE2Eテスト（`tests/e2e/`配下）を必ず実装してください。

**E2Eテストの実行は任意です。** CLI環境ではPlaywrightが動作しないため、E2Eテストの実行はコミット前の必須事項には含まれません。ローカルのGUI環境で実行可能な場合は、以下のコマンドで実行できます：

```bash
# ビルドしてからE2Eテスト実行
npm run build && npm run test:e2e
```

**注意**: E2Eテストはビルド済みのアプリケーションに対して実行されます。

### テスト失敗時の対応

- ユニットテストが失敗: コードの問題を修正してください
- ビルドが失敗: TypeScriptエラーや依存関係の問題を解決してください
- E2Eテストが失敗: UIの問題やテストの期待値を確認してください

### ドキュメントカバレッジ

**ドキュメントカバレッジは80%以上を維持してください。** 新しい関数やモジュールを追加した場合は、適切なJSDocコメントを必ず記述してください。

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
│   │   ├── unicode.test.ts
│   │   ├── whois.test.ts
│   │   ├── uuid.test.ts
│   │   ├── url-encode.test.ts
│   │   ├── password.test.ts
│   │   ├── json.test.ts
│   │   ├── regex.test.ts
│   │   ├── ip-validation.test.ts
│   │   └── ogp.test.ts
│   └── e2e/              # E2Eテスト（Playwright）
│       ├── navigation.spec.ts
│       ├── unicode.spec.ts
│       ├── whois.spec.ts
│       ├── ip-geolocation.spec.ts
│       ├── global-ip.spec.ts
│       ├── uuid.spec.ts
│       ├── url-encode.spec.ts
│       ├── password-generator.spec.ts
│       ├── json.spec.ts
│       ├── server-env.spec.ts
│       ├── regex-checker.spec.ts
│       ├── jwt.spec.ts
│       ├── ogp.spec.ts
│       ├── accessibility.spec.ts
│       └── not-found.spec.ts
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

## スキル（デザインガイドライン）

このプロジェクトでは以下のスキルファイルを参照してください：

- [Material Design Styling](.claude/skills/material-design-styling.md) - Material Design 3に基づくスタイリングガイドライン（カラーパレット、タイポグラフィ、コンポーネントスタイル）
- [WCAG Accessibility](.claude/skills/wcag-accessibility.md) - WCAG 2.1準拠のアクセシビリティ実装ガイドライン
