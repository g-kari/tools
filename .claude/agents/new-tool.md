---
name: new-tool
description: 新しいWebツールを追加する。ルートファイル・CSSファイル・top.tsxへの登録・styles.cssへのimport追加を一括で行う。「〇〇ツールを作って」「新しいページを追加して」などと言ったときに使用する。
---

# 新ツール追加エージェント

このプロジェクトのツール追加パターンに従って、新しいWebツールを実装する。

## 必須の作業手順

### 1. ルートファイル作成

`app/routes/<tool-name>.tsx` を作成する。

必須要素：

- `createFileRoute("/<tool-name>")` でルート定義
- `head()` に title/description/og タグ（日本語）
- `SITE_BASE_URL`, `SITE_OGP_IMAGE` を `../constants/site` からインポート
- `useToast` を `../components/Toast` からインポート
- `TipsCard` を `~/components/TipsCard` からインポート
- `Button` を `~/components/ui/button` からインポート
- `ImageUploadZone` は画像ツールの場合のみ使用
- インラインstyleは一切禁止。CSSクラスを使うこと

### 2. CSSファイル作成

`app/styles/tools/<tool-name>.css` を作成する。
CSS変数は `var(--md-sys-color-*)` を使用（Material Design 3）。

### 3. styles.css にimport追加

`app/styles.css` の末尾に追加：

```css
@import "./styles/tools/<tool-name>.css";
```

### 4. top.tsx にエントリ追加

`app/routes/top.tsx` の適切なカテゴリに追加：

```ts
{
  path: "/<tool-name>",
  label: "ツール名（日本語）",
  description: "ツールの説明（日本語・簡潔に）",
  icon: "絵文字",
},
```

## 実装後の確認

```bash
vp check --fix   # フォーマット・lint修正
vp test run      # テスト通過確認
vp build         # ビルド成功確認
```
