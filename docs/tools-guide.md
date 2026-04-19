# ツール追加ガイド

このリポジトリに新しいツールを追加するときの手順とテンプレートをまとめる。

本プロジェクトには **300 を超えるツール**（`app/routes/*.tsx`）が登録されている。開発者 / AI アシスタント / ユーザーのいずれが参照してもぶれないよう、追加・更新の作法はこのガイドに集約する。

関連ルール:

- [`.claude/rules/new-tool.md`](../.claude/rules/new-tool.md) — チェックリスト最小版
- [`.claude/rules/coding-style.md`](../.claude/rules/coding-style.md) — UI / 禁止事項
- [`.claude/rules/release-notes.md`](../.claude/rules/release-notes.md) — リリースノート更新

---

## 手順サマリ

1. ルートファイル `app/routes/<tool-name>.tsx` を作る
2. 専用 CSS `app/styles/tools/<tool-name>.css` を作る（必要な場合）
3. `app/styles.css` の末尾に `@import` を追加
4. `app/routes/top.tsx` のカテゴリに登録
5. `app/routes/release-notes.tsx` に `feat` エントリを追加
6. `vp check` と `vp test run` を通す

---

## ルートテンプレート

`app/routes/<tool-name>.tsx` の冒頭は以下の構造にする。先頭の JSDoc ブロックは **モジュールヘッダ**として必須。

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";

/**
 * @tool サンプルツール
 * @description 〇〇を△△するブラウザ内完結ツール。
 * @example
 *   入力: "hello"
 *   出力: "HELLO"
 * @limitations
 *   - 1MB を超える入力は処理が遅くなる
 *   - 外部ネットワーク送信なし（全てブラウザ内で処理）
 */
export const Route = createFileRoute("/sample-tool")({
  head: () => ({
    meta: [
      { title: "サンプルツール | Web ツール集" },
      {
        name: "description",
        content: "〇〇を△△するブラウザ内完結ツール。",
      },
      { property: "og:title", content: "サンプルツール | Web ツール集" },
      {
        property: "og:description",
        content: "〇〇を△△するブラウザ内完結ツール。",
      },
      { property: "og:image", content: `${SITE_BASE_URL}${SITE_OGP_IMAGE}` },
      { property: "og:url", content: `${SITE_BASE_URL}/sample-tool` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SampleTool,
});

function SampleTool() {
  // ...
  return <div className="sample-tool">...</div>;
}
```

### JSDoc ヘッダの項目

| タグ           | 必須 | 内容                                                                   |
| -------------- | ---- | ---------------------------------------------------------------------- |
| `@tool`        | ◯    | 日本語のツール名。`top.tsx` の `label` と一致させる                    |
| `@description` | ◯    | 1 文。`top.tsx` の `description`・`head()` の `description` と合わせる |
| `@example`     |      | 代表的な入出力 / 操作例                                                |
| `@limitations` |      | 制限事項。外部送信の有無・サイズ上限・未対応ブラウザなど               |

> **なぜ必要か**: ツール本体のコードを開かなくても、ファイル先頭の数行で「何をするツールか」「どこまで使えるか」を把握できる状態を保つため。AI アシスタントが大量のファイルを横断するときも有効。

---

## `top.tsx` への登録

`app/routes/top.tsx` の `toolCatalog` 配列で、該当カテゴリの `items[]` に追加する。

```ts
{
  path: "/sample-tool",
  label: "サンプルツール",
  description: "〇〇を△△するブラウザ内完結ツール。",
  icon: "🔧",
},
```

- `label` = JSDoc の `@tool`
- `description` = JSDoc の `@description`
- `icon` は絵文字 1 つ
- カテゴリが足りない場合は新しい `ToolCategory` を追加する

---

## CSS 追加

`app/styles/tools/<tool-name>.css` を作成し、`app/styles.css` の末尾に以下を追加：

```css
@import "./styles/tools/sample-tool.css";
```

クラス名は `.sample-tool` のように**ツール名をプレフィックス**にして衝突を避ける。

---

## リリースノート

同日リリースがある場合はその `entries` に追加。なければ新しい `Release` を配列の先頭に追加。

```ts
{
  type: "feat",
  title: "新ツール追加: サンプルツール",
  description: "〇〇を△△するブラウザ内完結ツール。",
}
```

詳細は [`.claude/rules/release-notes.md`](../.claude/rules/release-notes.md) を参照。

---

## チェックリスト

PR を出す前に以下を確認：

- [ ] JSDoc モジュールヘッダ（`@tool` / `@description`）を記載した
- [ ] `top.tsx` の `toolCatalog` に登録した
- [ ] `head()` の meta を整備した（`title` / `description` / OGP / Twitter）
- [ ] 専用 CSS を `styles.css` に import した
- [ ] `release-notes.tsx` に `feat` エントリを追加した
- [ ] `vp check` を通した
- [ ] `vp test run` を通した（`tests/unit/release-notes.test.ts` も含む）
- [ ] 必要なら E2E テストを `tests/e2e/` に追加した

---

## 既存ツールへの遡及

既存ツールに JSDoc ヘッダが付いていない場合、触るついでに追加していく運用とする。一括リファクタではなく、関連ツールを編集するついでに段階的に揃える。

参考実装のある代表例:

- `app/routes/jwt-inspector.tsx`
- `app/routes/hash.tsx`
- `app/routes/base64.tsx`
