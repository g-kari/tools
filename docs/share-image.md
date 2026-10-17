# デフォルト共有画像

各ページの `SITE_OGP_IMAGE` は `https://tools.0g0.xyz/ogp-default.png` を参照します。
配信用の実体は `public/ogp-default.png`（1200 × 630、PNG）です。Vite の public
ディレクトリから `dist/client/ogp-default.png` にコピーされ、通常の静的アセットとして
配信されます。画像生成サービスや実行時の画像処理は不要です。

## 編集と書き出し

編集可能な原稿は `docs/assets/ogp-default.svg` です。`app/styles/base.css` の
ターミナル配色と日本語のサイト名を使った、このプロジェクト用のオリジナル図案です。
写真・アバター・外部画像は使っていません。原稿には外部参照もありません。

書き出しには Inkscape と Noto Sans CJK JP / Noto Sans Mono CJK JP を使用します。
Noto CJK は [SIL Open Font License 1.1](https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE)
のフォントです。フォントファイルは本リポジトリに同梱せず、配信される PNG には
画像として文字が描画されています。図案はプロジェクトの MIT ライセンスに従います。

リポジトリのルートで実行してください：

```bash
inkscape docs/assets/ogp-default.svg \
  --export-type=png --export-filename=public/ogp-default.png \
  --export-width=1200 --export-height=630
```

生成した PNG の文字・余白・配色を目視で確認してからコミットしてください。
PNG はコミット済みなので、通常のビルドや CI に Inkscape / フォントの追加は不要です。

## 検証

- `vp test run tests/unit/site-metadata.test.ts`：参照 URL、PNG の実体・寸法、メタデータとの一致
- `vp build`：`dist/client/ogp-default.png` が生成されること
- プレビュー起動後、`CI=true BASE_URL=http://127.0.0.1:8788 vp exec playwright test tests/e2e/share-image.spec.ts --project=chromium`：SSR メタデータ、HTTP 200 / image/png、ブラウザでの画像デコード

本番確認では `/top` の `og:image` と `twitter:image` の参照先を開き、HTTP 200、
`Content-Type: image/png`、1200 × 630 の画像であることを確認します。
HTML の 404 ページや SPA のフォールバックを画像として扱わないでください。

参考：[Vite の public ディレクトリ](https://vite.dev/guide/assets.html#the-public-directory)、
[Open Graph の画像メタデータ](https://ogp.me/#structured)
