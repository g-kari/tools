# Frontend Design

このスキルは、Material Design 3の枠組み内で個性的でプロダクション品質のフロントエンドインターフェースを作成するためのガイドラインを提供します。

> **注意**: このスキルは `material-design-styling.md` を補完するものです。基本的なカラーパレット、タイポグラフィ、コンポーネントスタイルについてはそちらを参照してください。

## デザイン思考プロセス

コーディング前に、コンテキストを理解する：

### 1. 目的の理解
- このインターフェースが解決する問題は何か？
- 誰が使用するのか？
- 技術的制約（パフォーマンス、アクセシビリティ）

### 2. 差別化ポイント
Material Design 3の一貫性を維持しながら、以下で個性を出す：
- **モーション**: アニメーションの工夫
- **空間構成**: レイアウトと余白の使い方
- **情報階層**: コンテンツの優先順位付け
- **マイクロインタラクション**: ユーザーフィードバック

## Material Design 3内での個性化

### 1. モーション＆アニメーション

Material Design 3では0.2sのトランジションが基本ですが、**表現力のあるモーション**で個性を出せます。

#### ページロードのスタガード効果
```css
/* 要素を順番に表示してリズムを作る */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tool-section:nth-child(1) { animation: fadeInUp 0.3s ease-out 0.1s both; }
.tool-section:nth-child(2) { animation: fadeInUp 0.3s ease-out 0.2s both; }
.tool-section:nth-child(3) { animation: fadeInUp 0.3s ease-out 0.3s both; }
```

#### インタラクティブなフィードバック
```css
/* ボタンのプレス効果 */
.btn-primary:active {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

/* 入力フォーカス時のラベルアニメーション */
.input-label {
  transition: transform 0.2s, font-size 0.2s, color 0.2s;
}

.input:focus + .input-label {
  transform: translateY(-24px);
  font-size: 12px;
  color: var(--md-sys-color-primary);
}
```

#### 成功/エラー時のフィードバック
```css
/* コピー成功時のパルス効果 */
@keyframes successPulse {
  0% { box-shadow: 0 0 0 0 rgba(139, 105, 20, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(139, 105, 20, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 105, 20, 0); }
}

.copy-success {
  animation: successPulse 0.6s ease-out;
}
```

### 2. 空間構成とレイアウト

#### 意図的な余白
```css
/* セクション間の余白でリズムを作る */
.tool-section {
  margin-bottom: 32px;
}

.tool-section:last-child {
  margin-bottom: 0;
}

/* グループ内の要素間隔 */
.button-group {
  display: flex;
  gap: 12px;
}
```

#### 情報の階層化
```css
/* プライマリアクションを目立たせる */
.action-primary {
  grid-column: 1 / -1;
  padding: 20px;
}

.action-secondary {
  padding: 16px;
}

/* 結果表示エリアの強調 */
.result-area {
  background: var(--md-sys-color-primary-container);
  border-left: 4px solid var(--md-sys-color-primary);
  padding: 16px;
  border-radius: 4px;
}
```

#### レスポンシブな2カラムレイアウト
```css
/* 入力と出力を並べて表示 */
.tool-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .tool-layout {
    grid-template-columns: 1fr 1fr;
  }
}
```

### 3. タイポグラフィの階層

Robotoファミリー内でウェイトとサイズを効果的に使い分ける：

```css
/* ページタイトル - 軽いウェイトで大きく */
.page-title {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: -0.5px;
  color: var(--md-sys-color-on-surface);
}

/* セクションタイトル - ミディアムウェイト */
.section-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

/* ラベル - 小さく控えめに */
.input-label {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--md-sys-color-on-surface-variant);
}

/* モノスペース - コード/データ表示 */
.code-output {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

### 4. カラーの効果的な使用

既存のMD3カラートークンを活用しつつ、視覚的な深みを追加：

```css
/* プライマリカラーのグロー効果（控えめに） */
.primary-glow:focus {
  box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.2);
}

/* ホバー時の背景変化 */
.interactive-card {
  transition: background-color 0.2s;
}

.interactive-card:hover {
  background-color: var(--md-sys-color-surface-variant);
}

/* ステータス表示 */
.status-success { color: #2e7d32; }
.status-error { color: #c62828; }
.status-warning { color: #f57c00; }
```

### 5. マイクロインタラクション

ユーザーアクションへの即座のフィードバック：

```css
/* コピーボタン */
.copy-button {
  position: relative;
  overflow: hidden;
}

.copy-button::after {
  content: 'コピーしました';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  transform: translateY(100%);
  transition: transform 0.2s ease-out;
}

.copy-button.copied::after {
  transform: translateY(0);
}

/* トグルスイッチ */
.toggle-track {
  transition: background-color 0.2s;
}

.toggle-thumb {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 避けるべきパターン

Material Design 3を使用していても、以下は避ける：

| カテゴリ | 避けるべきもの | 代わりに |
|----------|----------------|----------|
| **レイアウト** | すべて中央揃え、均一な間隔 | 意図的な階層と余白 |
| **アニメーション** | 静的なUI、瞬間的な変化 | スムーズなトランジション |
| **フィードバック** | 操作後の無反応 | 即座の視覚的フィードバック |
| **情報設計** | フラットな情報構造 | 明確な優先順位付け |
| **インタラクション** | 基本的なホバーのみ | 状態変化の可視化 |

## 実装チェックリスト

デザイン実装時に確認すること：

### モーション
- [ ] ページロード時にスタガード効果があるか
- [ ] ボタンクリック時にフィードバックがあるか
- [ ] 状態変化がスムーズにアニメーションするか
- [ ] `prefers-reduced-motion`に対応しているか

### 空間構成
- [ ] 適切な余白でグループ化されているか
- [ ] プライマリアクションが目立っているか
- [ ] モバイルとデスクトップでレイアウトが最適化されているか

### フィードバック
- [ ] 操作成功時に視覚的確認があるか
- [ ] エラー時に明確なメッセージがあるか
- [ ] ローディング状態が表示されるか

### アクセシビリティ
- [ ] フォーカスインジケーターが視認可能か
- [ ] コントラスト比がWCAG AA基準を満たすか
- [ ] キーボード操作が可能か

## prefers-reduced-motion対応

アニメーションを使用する場合は必ず対応：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 関連スキル

- [Material Design Styling](./material-design-styling.md) - 基本的なスタイルガイドライン
- [WCAG Accessibility](./wcag-accessibility.md) - アクセシビリティ要件
- [UX Psychology](./ux-psychology.md) - ユーザー心理の活用
