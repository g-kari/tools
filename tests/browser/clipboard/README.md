# Clipboard fallback browser regression

このフィクスチャは実際の `app/hooks/useClipboard.ts` を React から呼び出し、
Chromium のフォーカス・選択範囲・スクロールの退行を検出します。
アプリ全体、外部 API、利用者のデータは使用しません。

## 実行

```sh
npm ci
npx playwright install --with-deps chromium
npx vite build --config tests/browser/clipboard/vite.config.ts
npx playwright test --config tests/browser/clipboard/playwright.config.ts
```

既存 Chromium を指定する場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` を使用できます。
専用サーバーは `127.0.0.1:4195` の固定ファイルへの GET だけを許可します。
Playwright も外部リクエストを遮断し、試行がないことを検証します。

## 検証対象

デスクトップ幅 1280px とモバイル幅 390px で、以下の 22 ケースを実行します。

- Clipboard API がない環境でのネイティブ `document.execCommand("copy")` 成功
- `execCommand` の false 戻り値と例外（この 2 分岐だけをスタブ）
- Tab → Enter / Space によるボタン操作後のフォーカス維持
- input / textarea の前向き・後ろ向き選択、値、横スクロール、textarea の縦スクロール
- ページスクロールと DOM / contenteditable の選択テキスト・端点・方向・フォーカス
- 連続コピー後も一時 textarea の追加・削除回数が一致し、ノードが残らないこと
- Clipboard API の成功と拒否が既存どおり true / false を返し、フォールバックを呼ばないこと

成功分岐では `execCommand` を置換せず、copy イベント時の選択テキストを記録します。
クリックによるネイティブコピー後に Control+V で貼り付け、paste イベントと入力値の両方で
改行・Unicode を含む合成ペイロードの完全一致を検証します。
Clipboard API の読み取り権限・ブラウザーの広範な権限は付与しません。

## 実行結果と限界

2026-10-04 の dot クラウドでフィクスチャの Vite ビルドは成功しました。
22 ケースは検出されましたが、すべてブラウザー起動前に実行不能となりました。
ローカル実行を成功・ブラウザーでの red/green として扱いません。

```
browserType.launch: Target page, context or browser has been closed
FATAL:chrome/browser/process_singleton_posix.cc:297
socket() failed: Operation not permitted (1)
process did exit: exitCode=null, signal=SIGABRT
```

同じ起動ログには Crash Reports/settings.dat の read-only filesystem エラーもあります。
GitHub Actions の `Clipboard focus browser regression` が、提出したコミット SHA と
JSON 結果・失敗時トレース・スクリーンショットを `clipboard-browser-results` に保存します。
ホスト側結果が出るまでは実ブラウザーの動作とネイティブコピー結果は未検証です。

ヘッドレス Chromium 内のコピー→貼り付けを検証するテストであり、別の OS アプリから
システムクリップボードを読み取れることは保証しません。
モバイル幅は Chromium のレイアウト検証で、iOS Safari / Android 実機や
仮想キーボードは対象外です。Clipboard API 分岐は合成成功・拒否を使い、
実際の permission UI やセキュアコンテキストのポリシーは検証しません。
