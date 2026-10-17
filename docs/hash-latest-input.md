# ハッシュ計算の latest-input lifecycle

テキストの debounce、FileReader、SHA の Promise は入力を変えても完了できます。
画面への反映は入力イベントで同期的に進めた generation と、effect が捕捉した
requestVersion が一致する場合だけに限ります。cleanup はローカルの cancellation と
タイマー・reader の後始末だけを担当し、別の新しい計算の loading を解除しません。
同一 File object や一括 A→B→A でも requestVersion の変更で effect が再実行されます。

- テキスト変更、ファイル選択、clear、実際のモード変更が古い世代を失効させる
- 選択済みタブの再クリック、ネイティブ picker のキャンセルは計算を維持する
- 読み込み cleanup はコールバックを外してから LOADING reader だけ abort する
- 読み込み失敗は固定のアクセシブルなエラーを表示し、ファイル再選択で復帰する
- 空バイトファイルは有効。HEX/Base64 変更は表示だけで再計算しない
- SHA ごとのエラー処理、MD5、150ms debounce、ローカル処理は従来どおり
- stale SHA 自体はキャンセルできず、完了を捨てる。巨大ファイル最適化は対象外

## 回帰検証

`vp test run tests/unit/hash-lifecycle.test.ts tests/unit/hash.test.ts`

実際の Route と ToastProvider を StrictMode で mount し、FileReader と crypto.subtle.digest
の deferred promises だけを制御する。順序逆転、旧 finally、clear、モード変更、同一
ファイル再選択、読み込み error/abort/throw/無効結果、algorithm error、unmount、
batched A→B→A を再現する。jsdom の結果はネイティブブラウザー API の証明とは分ける。

`npx vite build --config tests/browser/hash/vite.config.ts`

`npx playwright test --config tests/browser/hash/playwright.config.ts`

ブラウザー fixture は実際の Route、ToastProvider、CSS を隔離 mount する。
3 本は Chromium の実際の FileReader/WebCrypto で全5種の既知値、Unicode、空バイト、
バイナリ drop、同一ファイルの再選択、キーボード picker、HEX/Base64 を確認する。
2 本は SHA の Promise 完了順だけを制御し、旧結果・loading・通知の反映を確認する。
後者は native digest を使って期待値を生成しても、API タイミングは模擬検証である。

fixture server は loopback の固定 GET 3 ファイルだけ、CSP は connect-src none。
Playwright も外部要求・pageerror を失敗させる。実データ、認証、Cloudflare、
production logs は不要。隔離 mount のため本番 shell/SSR/hydration や他ブラウザーは
この5本の合格から推定しない。専用 CI は Node22、Chromium、固定 head、read-only 権限、
10分上限、retry0、artifact保持1日で同じ検証を実行する。
