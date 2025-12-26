# Material Design Styling

このスキルは、Google Material Design に基づいたスタイリングガイドラインを提供します。

## デザイン仕様

### ベースデザイン
- **デザインシステム**: Google Material Design
- **デザイン原則**: フラットデザイン（影やグラデーションを排除）

### カラーパレット (Material Design 3 準拠・WCAG AA 検証済み)

このカラーシステムは、ブランドカラー `#ffffef` を基に Material Design 3 の色彩理論に従って設計され、すべてのテキストとバックグラウンドの組み合わせが WCAG AA 基準（≥4.5:1）をクリアしています。

#### Surface Colors（基本背景色）
- **Surface**: `#ffffef` （ブランドカラー - メイン背景）
- **On-Surface**: `#1c1b1e` （Surface上のテキスト - 16.98:1）
- **On-Surface-Variant**: `#49454e` （Surface上のセカンダリテキスト - 9.27:1）
- **Surface-Variant**: `#e7e0ec` （入力フィールド背景 - 13.28:1）

#### Primary Colors（主要アクション用）
- **Primary**: `#8b6914` （暗い金茶色 - プライマリボタン）
- **On-Primary**: `#ffffff` （Primary上のテキスト - 5.09:1）
- **Primary-Container**: `#ffedb3` （プライマリコンテナ背景）
- **On-Primary-Container**: `#2d1f00` （コンテナ上のテキスト - 13.78:1）

#### Secondary Colors（補助アクション用）
- **Secondary**: `#6b5e3f` （温かみのある茶色 - セカンダリボタン）
- **On-Secondary**: `#ffffff` （Secondary上のテキスト - 6.37:1）
- **Secondary-Container**: `#f4e7c3` （セカンダリコンテナ背景）
- **On-Secondary-Container**: `#231b04` （コンテナ上のテキスト - 13.87:1）

#### Neutral Colors（補助的な要素用）
- **Outline**: `#79747e` （ボーダーやディバイダー）
- **Outline-Variant**: `#cac4cf` （軽いボーダー）

### タイポグラフィ
- **フォントファミリー**: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **モノスペースフォント**: `'Roboto Mono', 'Courier New', monospace`
- **フォントウェイト**:
  - Light: `300` （サブタイトルなど）
  - Regular: `400` （見出し）
  - Medium: `500` （セクションタイトル、ボタン）

### ボタンスタイル
- **形状**: 角丸 `4px`
- **影**: なし（フラットデザイン）
- **パディング**: `15px 30px`
- **フォントサイズ**: `16px`
- **フォントウェイト**: `500`
- **テキスト変形**: `uppercase`
- **レタースペーシング**: `0.5px`
- **トランジション**: `background-color 0.2s, opacity 0.2s`
- **ホバー効果**: `opacity: 0.85`
- **アクティブ効果**: `opacity: 0.7`

### その他のコンポーネント
- **角丸**: `4px` （一貫性のため、すべてのカードやインプット要素で使用）
- **トランジション速度**: `0.2s` （Material Design推奨値）
- **影**: 使用しない（フラットデザイン原則）
- **グラデーション**: 使用しない（フラットデザイン原則）

## 実装例

### フォント読み込み

```html
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap" rel="stylesheet">
</head>
```

### CSS カスタムプロパティ（カラートークン）

```css
/* Material Design 3 - Color System (WCAG AA Compliant) */
:root {
  /* Brand color #ffffef used as surface */
  --md-sys-color-surface: #ffffef;
  --md-sys-color-on-surface: #1c1b1e;
  --md-sys-color-on-surface-variant: #49454e;

  /* Primary colors - warm golden brown palette */
  --md-sys-color-primary: #8b6914;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #ffedb3;
  --md-sys-color-on-primary-container: #2d1f00;

  /* Secondary colors - warm earth tones */
  --md-sys-color-secondary: #6b5e3f;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #f4e7c3;
  --md-sys-color-on-secondary-container: #231b04;

  /* Neutral colors */
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4cf;
}
```

### 基本スタイル

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}
```

### ボタンスタイル

```css
button {
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.btn-secondary {
  background: var(--md-sys-color-secondary);
  color: var(--md-sys-color-on-secondary);
}

button:hover {
  opacity: 0.85;
}

button:active {
  opacity: 0.7;
}
```

### インプット要素

```css
textarea, input {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 4px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  transition: border-color 0.2s;
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface);
}

textarea:focus, input:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  background: white;
}
```

### コンテナ要素

```css
.info-box {
  background: var(--md-sys-color-primary-container);
  border-left: 4px solid var(--md-sys-color-primary);
  padding: 15px;
  border-radius: 4px;
  color: var(--md-sys-color-on-primary-container);
}
```

## 使用ガイドライン

1. **一貫性の維持**: すべての角丸は `4px` に統一
2. **影の禁止**: box-shadow は使用しない（フラットデザイン原則）
3. **グラデーションの禁止**: linear-gradient は使用しない
4. **カラートークンの使用**: CSS カスタムプロパティ（`--md-sys-color-*`）を使用してカラーを指定
5. **トランジション**: すべてのアニメーションは `0.2s` で統一
6. **ホバー効果**: transform ではなく opacity を使用
7. **WCAG AA 準拠**: すべてのテキストとバックグラウンドの組み合わせで 4.5:1 以上のコントラスト比を維持

### Material Design 3 のカラーロール

- **Surface**: メインの背景色として使用
- **Primary**: 主要なアクション（重要なボタンなど）
- **Secondary**: 補助的なアクション（副次的なボタンなど）
- **Container**: コンテンツのグループ化や強調表示
- **On-XXX**: 特定の背景色上で使用するテキスト色（必ず対応する背景色と組み合わせて使用）

## WCAG コントラスト検証

すべてのカラーコンビネーションは自動検証済みです：

```bash
node verify-contrast.js
```

新しいカラーを追加する場合は、必ず WCAG AA 基準（≥4.5:1）を満たすことを確認してください。

## アクセシビリティ（WCAG 2.1 準拠）

Material Design を実装する際は、WCAG 2.1 レベル AA 以上の基準を満たす必要があります。

### フォーカスインジケーター

```css
/* Material Design 準拠のフォーカススタイル */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--md-sys-color-primary);
  outline-offset: 3px;
}
```

### スキップリンク

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
  font-weight: 500;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
```

### スクリーンリーダー専用テキスト

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### セマンティックHTML

```html
<!-- ✓ ランドマークの使用 -->
<header role="banner">
<main role="main">
<nav role="navigation">
<aside role="complementary">

<!-- ✓ ラベルとの関連付け -->
<label for="input-id">ラベル</label>
<input id="input-id" type="text">

<!-- ✓ ARIAラベル -->
<button aria-label="閉じる">×</button>
```

### ライブリージョン

```html
<!-- ステータスメッセージの通知 -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- 動的に更新される内容 -->
</div>
```

詳細は `wcag-accessibility.md` スキルを参照してください。

## 注意事項

- このデザインシステムは、ブランドカラー `#ffffef` を Surface カラーとして使用
- Material Design 3 の色彩理論に基づいた温かみのある golden-brown パレット
- すべての変更は Material Design の原則と WCAG AA アクセシビリティ基準に従ってください
- 新しいコンポーネントを追加する際は、このガイドラインとカラートークンを参照してください
- カスタムカラーを使用する場合は、必ずコントラスト比を検証してください
- キーボード操作性、フォーカス管理、ARIAラベルなどのアクセシビリティ要件を満たしてください
