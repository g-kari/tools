# 絵文字GIFの生成と保存

`/emoji-converter` のGIF出力は、編集プレビューとは別に実際のGIFを生成してから保存します。

1. 画像を選び、編集・エフェクト・FPS・ループを設定します
2. 最大色数とディザリングを選びます。Bayerだけはディザの強さも調整できます
3. 「GIFを生成」で128×128のGIFを生成します
4. 生成されたGIFの見た目と実際のバイト数を確認します
5. ツールの容量制限内なら「GIFを保存」でプレビューと同じファイルを保存できます

保存時に再エンコードしません。上限を超えた場合は保存できず、色数やFPSを下げて再生成する案内を表示します。画像・編集・エフェクト・FPS・ループ・形式・使用先・GIF設定を変更すると、以前の生成結果は無効になります。

## 容量の意味

既存のツール設定を維持しています。Discord向けは262,144 bytes、Slack向けは1,048,576 bytesで、ツール内の判定は上限と同じバイト数も許可します。表示を丸めたKBで判定しません。

これは登録先の受け付けを保証する判定ではありません。[Discordの公式案内](https://support.discord.com/hc/en-us/articles/360036479811-How-to-Add-Custom-Emojis-on-Discord)は256KB未満と説明し、[Slackの公式案内](https://slack.com/help/articles/206870177-Add-custom-emoji-and-aliases-to-your-workspace)は128KB未満の正方形画像を推奨しています。各サービスの条件を確認してください。

## 画質と制限

- 既存のブラウザFFmpegとpalettegen/paletteuseを使用します。依存関係や配信元は追加しません
- 色数は256・128・64・32・16から選べます
- Floyd–Steinberg、Sierra、Bayer、ディザなしを選べます
- Bayerの調整値は既存ヘルパーのbayer_scale 5〜0に対応します。他のディザ方式に画質スライダーの効果があるとは表示しません
- GIFのフレーム時間は1/100秒単位です。選んだFPSに近い時間へ丸められます
- 入力GIFなどの全アニメーションフレームの読み込みは追加しません。エディターで作ったエフェクトのフレームを出力します
- 自動的に設定を下げたり、収まるまで繰り返しエンコードしたりしません
- FFmpeg未読込・読込失敗・生成失敗・空出力では保存できません。PNGをGIFとして保存する代替処理はありません
- PNG/JPEG/WebP/AVIFの出力と画像→GIFツールの既存動作は維持します

## 検証

単体テストは実際の引数生成・エンコード処理・生成結果管理を検証します。

```sh
npx vp test run tests/unit/emoji-gif-export.test.ts tests/unit/emoji-gif-no-fallback.test.ts tests/unit/use-generated-gif.test.ts tests/unit/image-to-gif.test.ts
npx vp check
npm test
npm run build
```

実ルートコンポーネントのブラウザ検証と実際のFFmpegによる生成は[専用テストの手順](../tests/browser/emoji/README.md)を参照してください。バイト単位の上限、保存とプレビューの一致、生成中の設定変更・リセット・画像変更・画面離脱、Blob URL解放、再試行、320/390/1280pxとキーボード操作を含みます。
