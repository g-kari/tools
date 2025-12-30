# Cloudflare Cache Rules 設定ガイド

このドキュメントでは、ダミー画像生成API (`/api/image.svg`) をCloudflare CDNでキャッシュするためのCache Rules設定手順を説明します。

## 背景

Cloudflareはデフォルトで拡張子を持つ静的ファイル（`.jpg`, `.png`, `.svg`など）のみをキャッシュします。`/api/image.svg` は拡張子があるため自動キャッシュ対象ですが、Cache APIを使用して明示的にキャッシュを制御しています。追加でCache Rulesを設定することで、より細かい制御が可能です。

## 設定手順

### 1. Cloudflareダッシュボードにログイン

[Cloudflare Dashboard](https://dash.cloudflare.com/) にログインし、対象のドメイン（`tools.0g0.workers.dev` など）を選択します。

### 2. Cache Rulesに移動

左側のメニューから以下の順に移動:
```
Caching → Cache Rules
```

### 3. 新しいルールを作成

「Create rule」ボタンをクリックします。

### 4. ルール名を設定

```
Rule name: Dummy Image API Cache
```

### 5. フィルター条件を設定

「When incoming requests match...」セクションで:

**Field:** `URI Path`
**Operator:** `starts with`
**Value:** `/api/image.`

または、Expression Builderで以下を入力:
```
(starts_with(http.request.uri.path, "/api/image."))
```

### 6. キャッシュ動作を設定

「Then...」セクションで:

1. **Cache eligibility:** `Eligible for cache` を選択
2. **Edge TTL:** `Use cache-control header if present, use default Cloudflare caching behavior if not`
3. **Browser TTL:** `Respect origin TTL`

### 7. ルールの順序を確認

Cache Rulesは上から順に評価されます。このルールが最初に適用されるよう、必要に応じて順序を調整してください。

### 8. デプロイ

「Deploy」ボタンをクリックしてルールを有効化します。

## キャッシュの確認方法

ルールが正しく動作しているか確認するには、レスポンスヘッダーを確認します:

```bash
curl -I "https://your-domain.workers.dev/api/image.svg?w=800&h=600"
```

以下のヘッダーを確認:
- `cf-cache-status`: `HIT` であればCDNキャッシュから配信されています
  - `MISS`: キャッシュにない（初回リクエスト）
  - `HIT`: キャッシュから配信
  - `EXPIRED`: キャッシュ期限切れ
  - `DYNAMIC`: キャッシュ対象外（ルールが適用されていない可能性）

## トラブルシューティング

### `cf-cache-status: DYNAMIC` が返される場合

1. Cache Rulesが正しく設定されているか確認
2. ルールの順序を確認（他のルールが先に適用されていないか）
3. フィルター条件（URIパス）が正しいか確認

### キャッシュがすぐにクリアされる場合

1. Browser TTLとEdge TTLの設定を確認
2. レスポンスの `Cache-Control` ヘッダーを確認
3. `no-store` や `private` が設定されていないか確認

## 関連リソース

- [Cloudflare Cache Rules公式ドキュメント](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Cache Rulesの作成方法](https://developers.cloudflare.com/cache/how-to/cache-rules/create-dashboard/)
- [Cache Rules設定項目](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/)

## 補足：APIレスポンスのキャッシュヘッダー

このアプリケーションのAPIは以下のキャッシュヘッダーを返します:

```
Cache-Control: public, max-age=31536000, immutable
CDN-Cache-Control: public, max-age=31536000, immutable
```

- `max-age=31536000`: 1年間キャッシュ
- `immutable`: コンテンツは変更されない
- `CDN-Cache-Control`: CDN専用のキャッシュ指示
