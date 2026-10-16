# Tools - Web ツール集

様々な便利なWebツールを集めたサイトです。Cloudflare Workers上で動作します。

## 機能

エンコード・デコード、ハッシュ・暗号、JSON / YAML / XML、色変換、日付・時刻、画像・QR、ネットワーク系ツールなど **300 種類以上**のツールを提供しています。

全ツールの一覧・カテゴリは `app/routes/top.tsx` の `toolCatalog` を参照するか、本番サイトのトップページで確認できます。

ツール一覧と Ctrl+K / Cmd+K の検索では、ツール名・説明・カテゴリ名・パスを検索できます。`JSON 圧縮` のように空白で区切るとすべての語で絞り込みます。前後の空白、大文字小文字、全角英数字・半角かなの違いを吸収し、検索語はサーバーへ送信・保存しません。

検索ダイアログの結果はツール名を名前とするリンクの一覧です。Tab / Shift+Tab で中の操作を循環し、上下の矢印キーでも実際のリンクへ移動して Enter で開けます。検索欄の ↓ は次の候補、↑ は前の候補へ移動し、結果の先頭で ↑・末尾で ↓ を押すと検索欄へ戻ります。検索欄に戻ると先頭候補を選び直し、Enter で開けます。修飾クリック・中クリックでも標準のリンク操作ができます。Esc・閉じるボタン・外側クリックで取り消した後は、検索を開いたボタンや入力欄へ戻ります。

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

MarkdownテーブルのCSVインポートは引用符内のカンマ・二重引用符（`""`）・空白を保持し、不正な引用符とヘッダーより多い列は位置付きのエラーにします。セル・ヘッダー内の改行と、バックスラッシュの直後に `|` がある値は現在の編集・Markdown出力で保持できないため、未対応としてインポートを拒否します。失敗時は入力と現在の表を保持します。先頭の非空ヘッダーの引用符外にタブがあればTSV、それ以外はCSVです。CSV内のタブだけでは形式を変えません。TSVの同一セル内で閉じる引用符は文字として扱い、引用符付き改行・タブや先頭の引用符が閉じないセルは拒否します。引用符で始まる曖昧なヘッダーはCSVとして検証します。引用符外の前後空白と空行は除去し、不足列は空文字で補います。既存の手入力・Markdown出力は変更しておらず、表の完全な可逆性や既存のバックスラッシュ付き `|` の出力不具合を解決するものではありません。

JSON→SQL CREATE TABLE生成では、キーをスネークケースに変換した後の列名の重複をエラーにします（例: `userName` と `user_name`）。追加するidカラムと入力列の重複も拒否し、元キー・衝突列と修復方法を表示します。入力キーを変更するか、追加idとの衝突なら「id カラムを追加する」をオフにして再生成できます。列を自動改名したり省略したりはしません。失敗時は入力を保持して旧SQLを消去し、コピーを無効にします。

JSON→Zod生成では、ハイフン・空白・引用符・改行などを含むJSONのキーを文字列リテラルとして出力し、元のキー名を保持します。`__proto__` はオブジェクトリテラルの特殊な挙動を避けるため `["__proto__"]` と出力し、スキーマのshapeに保持します。Zod自体の解析方針は変更しておらず、Zod 3.25.76では `__proto__` がparse結果から省かれます。通常の英数字・`_`・`$`の識別子は従来の表記を維持します。型推論やルート変数名の検証は変更していません。

## 新しいツールを追加するには

テキスト差分比較は元・新しいテキストの行番号を表示します。「変更箇所の前後3行だけ表示」で長い未変更部分を省略でき、それぞれの省略部分は表示・折りたたみできます。コピーには表示状態にかかわらず全行の差分を含みます。入力はブラウザー内だけで処理し、送信・保存しません。比較アルゴリズムと処理できる入力規模は従来どおりです。

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

ダミー画像のconversion unit testsは、lockfileに対応する導入済みresvg WASMを使い、PNG/JPEG/WebPの実encoderとdecode後の寸法を確認します。外部assetへの実通信は行わず、既知fontの取得失敗を明示して既存のno-font fallbackを検証します。未知URLはtest failureにします。これは実Robotoの見た目、実CDNの到達性・可変assetの互換性、Cloudflare runtimeの動作を検証したものではありません。詳しくは [画像変換テストのoffline境界](docs/dummy-image-offline-tests.md) を参照してください。

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
