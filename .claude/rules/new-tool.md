---
description: 新規ツール追加時のルール（ヘッダコメント・登録・リリースノート）
paths: "app/routes/*.tsx,app/styles/tools/*.css"
---

# 新規ツール追加ルール

新しいツールを `app/routes/` に追加するときは、以下の 4 点を必ず満たすこと。詳細な手順・テンプレートは [`docs/tools-guide.md`](../../docs/tools-guide.md) を参照。

## 1. JSDoc モジュールヘッダ必須

`createFileRoute(...)` の**直前**に、以下のフィールドを含む JSDoc コメントを配置する。

```ts
/**
 * @tool <日本語ツール名>
 * @description <一文でユーザー向けの機能説明>
 * @example <代表的な入出力・操作例（任意）>
 * @limitations <制限・注意事項（任意）>
 */
export const Route = createFileRoute("/<path>")({ ... });
```

- `@tool` と `@description` は必須。`@example` と `@limitations` は必要に応じて追加。
- 説明文は `app/routes/top.tsx` の `description` と整合させること（同じ内容でよい）。
- 外部依存・ネットワーク送信の有無・ブラウザ内完結かどうかは `@limitations` に明記。

## 2. ルート登録

1. `app/routes/<tool-name>.tsx` を作成
2. `app/styles/tools/<tool-name>.css` を作成（必要な場合）
3. `app/styles.css` 末尾に `@import` を追加
4. `app/routes/top.tsx` の該当カテゴリの `items[]` に `{ path, label, description, icon }` を追加

## 3. head メタの整備

`head()` の `meta` 配列には以下を含めること：

- `title`
- `description`（ツール概要。検索結果に表示される）
- `og:title` / `og:description` / `og:image` / `og:url`
- `twitter:card`

## 4. リリースノート更新

ユーザー影響のある追加・変更のため、[`release-notes.md`](release-notes.md) のルールに従って `app/routes/release-notes.tsx` の `releases` 配列を更新すること。

## チェックリスト

新規ツール PR 作成前に以下を確認：

- [ ] JSDoc モジュールヘッダ（`@tool` / `@description`）を記載した
- [ ] `top.tsx` に登録し `description` を入れた
- [ ] 専用 CSS を `styles.css` に import した
- [ ] `head()` の meta を整備した
- [ ] `release-notes.tsx` に `feat` エントリを追加した
- [ ] `vp check` が通る
- [ ] `vp test run` が通る
