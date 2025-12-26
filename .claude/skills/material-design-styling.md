# Material Design Styling

このスキルは、Google Material Design に基づいたスタイリングガイドラインを提供します。

## デザイン仕様

### ベースデザイン
- **デザインシステム**: Google Material Design
- **デザイン原則**: フラットデザイン（影やグラデーションを排除）

### カラーパレット
- **プライマリカラー**: `#ffffef` （ブランドカラー）
- **プライマリバリエーション**: `#f0e68c` （khaki - ボタンなどに使用）
- **セカンダリバリエーション**: `#ffe4b5` （moccasin - セカンダリボタンに使用）
- **テキストカラー（高コントラスト）**: `rgba(0, 0, 0, 0.87)`
- **テキストカラー（中コントラスト）**: `rgba(0, 0, 0, 0.6)`
- **ボーダーカラー**: `rgba(0, 0, 0, 0.12)`
- **グレーボタン**: `rgba(0, 0, 0, 0.12)`

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

### 基本スタイル

```css
/* Material Design - Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffef;
  color: rgba(0, 0, 0, 0.87);
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
  background: #f0e68c;
  color: rgba(0, 0, 0, 0.87);
}

.btn-secondary {
  background: #ffe4b5;
  color: rgba(0, 0, 0, 0.87);
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
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  transition: border-color 0.2s;
  background: #fafafa;
}

textarea:focus, input:focus {
  outline: none;
  border-color: #f0e68c;
  background: white;
}
```

## 使用ガイドライン

1. **一貫性の維持**: すべての角丸は `4px` に統一
2. **影の禁止**: box-shadow は使用しない（フラットデザイン原則）
3. **グラデーションの禁止**: linear-gradient は使用しない
4. **カラーの統一**: Material Design の rgba 値を使用
5. **トランジション**: すべてのアニメーションは `0.2s` で統一
6. **ホバー効果**: transform ではなく opacity を使用

## 注意事項

- このデザインシステムは、ブランドカラー `#ffffef` を中心に構築されています
- すべての変更は Material Design の原則に従ってください
- 新しいコンポーネントを追加する際は、このガイドラインを参照してください
