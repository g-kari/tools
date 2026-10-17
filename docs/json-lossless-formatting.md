# JSON整形・圧縮のデータ保持

`/json` は、JSONの文字列の外にある空白だけを変更します。

- 大きな整数、小数の全桁、指数表記、負のゼロを元の表記で保持
- 文字列のエスケープ、キーの順序、重複したキーを保持
- コメント、末尾カンマ、BOM、非JSON空白などは従来どおり不正なJSONとして拒否
- 入力編集・変換エラーで古い出力を消去。元の入力は自動で書き換えない
- 入力を保存せず、変換処理でサーバーや外部サービスに送信しない

これは整形機能であり、重複キーを解消する機能やJSONの正規化ではありません。
他のJSON変換・比較・JSON Linesツールはこの変更の対象外です。
下流のアプリがJSONをJavaScriptの数値に変換する際の丸めは防げません。

## 実装

`app/utils/json.ts` は `JSON.parse` で構文だけを検証し、解析した値は出力に使いません。
検証後は元の文字列・数値・構造トークンを保持して空白を配置します。
インデントは従来の数値APIと同じく0〜10スペースです。

ネイティブの構文検証とトークン化は入力全体をメモリに保持します。
極端に大きい入力や深い階層のインデント出力は、ブラウザのメモリ制限を受けます。

## 検証

- `npx vp test run tests/unit/json.test.ts tests/unit/json-ui.test.ts tests/unit/release-notes.test.ts`
- `npx vite build --config tests/browser/json/vite.config.ts`
- `npx playwright test --config tests/browser/json/playwright.config.ts`

ブラウザ検証は実際のルートコンポーネントと合成データを用います。
ループバックの固定ファイルだけを配信し、外部リクエストを拒否します。
本番サイトのシェルやSSR hydrationを再現するテストではありません。
