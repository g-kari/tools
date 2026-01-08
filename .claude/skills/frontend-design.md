# Frontend Design

このスキルは、ジェネリックなAIデザインとは一線を画す、個性的でプロダクション品質のフロントエンドインターフェースを作成するためのガイドラインを提供します。

## デザイン思考プロセス

コーディング前に、コンテキストを理解し、**大胆な美的方向性**にコミットする：

### 1. 目的の理解
- このインターフェースが解決する問題は何か？
- 誰が使用するのか？
- 技術的制約（フレームワーク、パフォーマンス、アクセシビリティ）

### 2. トーンの選択
以下から明確な方向性を選択（または独自の方向性を定義）：

| トーン | 特徴 |
|--------|------|
| **ブルータルミニマル** | 極限まで削ぎ落とした、力強いシンプルさ |
| **マキシマリスト** | 豊かなディテール、レイヤー、要素の重なり |
| **レトロフューチャー** | 80年代/90年代のノスタルジアと未来的要素の融合 |
| **オーガニック/ナチュラル** | 自然の形状、テクスチャ、流れるような曲線 |
| **ラグジュアリー/洗練** | 上質な素材感、繊細なディテール、余白の美学 |
| **プレイフル/トイライク** | 遊び心、丸み、カラフル、アニメーション |
| **エディトリアル/マガジン** | 雑誌レイアウト、タイポグラフィ重視、グリッド |
| **ブルータリスト/ロー** | 生々しいHTML感、意図的な粗さ |
| **アールデコ/ジオメトリック** | 幾何学パターン、装飾的ライン、対称性 |
| **ソフト/パステル** | 柔らかい色彩、グラデーション、優しい印象 |
| **インダストリアル** | 実用的、機能重視、堅牢な印象 |

### 3. 差別化ポイント
- この設計を**忘れられないものにする**要素は何か？
- ユーザーが記憶する「一つのこと」を定義する

## 美的ガイドライン

### タイポグラフィ

**重要**: ジェネリックなフォント（Arial、Inter、Roboto、システムフォント）を避け、個性的な選択を行う。

```css
/* 良い例：個性的なフォント選択 */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@300;400;600&display=swap');

:root {
  --font-display: 'Playfair Display', serif;  /* 見出し用 */
  --font-body: 'Source Sans 3', sans-serif;   /* 本文用 */
}

/* 避けるべき例 */
font-family: Inter, Arial, sans-serif;  /* ジェネリックすぎる */
```

#### フォント選択の指針
- **ディスプレイフォント**: 見出しに個性を与える（例：Playfair Display, Archivo Black, Space Mono）
- **ボディフォント**: 可読性を維持しつつ洗練された選択（例：Source Sans 3, Lora, Work Sans）
- **モノスペース**: コード表示用（例：JetBrains Mono, Fira Code）

### カラー＆テーマ

**原則**: 控えめな均等配分より、ドミナントカラーとシャープなアクセントの組み合わせ。

```css
/* 大胆なカラースキームの例 */
:root {
  /* ドミナントカラー */
  --color-dominant: #0a0a0a;
  --color-dominant-soft: #1a1a1a;

  /* シャープなアクセント */
  --color-accent: #ff4d4d;
  --color-accent-glow: rgba(255, 77, 77, 0.3);

  /* テキスト */
  --color-text-primary: #ffffff;
  --color-text-muted: #888888;
}
```

#### 避けるべきパターン
- 白背景に紫グラデーション（クリシェ）
- 無難な青と白の組み合わせ
- すべての要素が同じ視覚的重みを持つ配色

### モーション＆アニメーション

**原則**: 散らばったマイクロインタラクションより、ページロード時の統一されたオーケストレーション。

```css
/* ページロードアニメーション - スタガード効果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
}

.hero-subtitle {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.hero-cta {
  animation: fadeInUp 0.6s ease-out forwards;
  animation-delay: 0.3s;
  opacity: 0;
}
```

#### ハイインパクトなモーメント
- **ページロード**: スタガードリビール（animation-delay）
- **スクロールトリガー**: 要素が視界に入った時のアニメーション
- **ホバーステート**: 予想外の変化で驚きを与える
- **トランジション**: ページ間の滑らかな移行

### 空間構成

**原則**: 予測可能なレイアウトを破る。

```css
/* 非対称レイアウト */
.asymmetric-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

/* オーバーラップ効果 */
.overlapping-element {
  position: relative;
  margin-top: -4rem;
  z-index: 10;
}

/* 対角線の流れ */
.diagonal-section {
  clip-path: polygon(0 0, 100% 5%, 100% 95%, 0 100%);
}

/* グリッドを破る要素 */
.grid-breaker {
  grid-column: 1 / -1;
  margin-left: -2rem;
  margin-right: -2rem;
}
```

#### 空間のアプローチ
- **寛大なネガティブスペース** または **制御された密度**
- **非対称性**: 完璧な対称を避ける
- **オーバーラップ**: 要素の重なりで深みを作る
- **グリッドブレイク**: 時折グリッドを破る要素

### 背景＆ビジュアルディテール

**原則**: ソリッドカラーをデフォルトにせず、雰囲気と深みを作る。

```css
/* グラデーションメッシュ */
.gradient-mesh {
  background:
    radial-gradient(at 40% 20%, hsla(28, 100%, 74%, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(355, 85%, 63%, 0.2) 0px, transparent 50%);
}

/* ノイズテクスチャ */
.noise-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.05;
}

/* グレインオーバーレイ */
.grain-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/noise.png');
  opacity: 0.03;
  pointer-events: none;
}

/* ドラマチックなシャドウ */
.dramatic-shadow {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}
```

## 避けるべきパターン（AIスロップ）

以下は「AIが生成した典型的なデザイン」として認識されやすいパターン：

| カテゴリ | 避けるべきもの |
|----------|----------------|
| **フォント** | Inter, Roboto, Arial, システムフォント、Space Grotesk |
| **カラー** | 白背景に紫グラデーション、無難な青系統 |
| **レイアウト** | 完全に予測可能なグリッド、すべて中央揃え |
| **アニメーション** | 控えめすぎるフェードイン、ジェネリックなホバー効果 |
| **パターン** | クッキーカッター的なカード、同じ見た目のセクション |

## 実装複雑度のマッチング

**重要**: 美的ビジョンに合わせた実装複雑度を選択する。

### マキシマリストデザインの場合
- 豊富なアニメーション
- 複数のレイヤーと効果
- 詳細なマイクロインタラクション
- 複雑なCSSグリッドとレイアウト

### ミニマリスト/洗練デザインの場合
- 抑制された実装
- スペーシング、タイポグラフィ、微細なディテールへの注意
- 少ない要素で最大の効果
- 繊細で意図的なアニメーション

## このプロジェクトでの適用

このプロジェクトはMaterial Design 3をベースとしていますが、以下の方法で個性を出すことができます：

### カラーカスタマイズ
```css
/* Material Design 3のカラートークンを活用しつつ個性を追加 */
:root {
  /* 既存のMD3カラーに加えて */
  --accent-glow: rgba(139, 105, 20, 0.2);
  --surface-texture: url('/subtle-pattern.svg');
}
```

### タイポグラフィの強化
```css
/* Robotoをベースに、見出しに個性的なフォントを追加 */
.page-title {
  font-family: 'Playfair Display', var(--font-primary);
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### 独自のモーション
```css
/* Material Designの0.2sトランジションをベースに */
.tool-card {
  transition: transform 0.2s, box-shadow 0.3s ease-out;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px var(--accent-glow);
}
```

## アクセシビリティとの両立

個性的なデザインでもアクセシビリティは必須です：

1. **コントラスト比**: WCAG AA基準（4.5:1以上）を維持
2. **モーション**: `prefers-reduced-motion`で代替を提供
3. **フォーカス**: 視認可能なフォーカスインジケーター
4. **キーボード**: すべての操作がキーボードで可能

```css
/* モーション軽減設定への対応 */
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

## チェックリスト

デザイン実装時に確認すること：

- [ ] ジェネリックなフォント（Inter, Roboto, Arial）を避けているか
- [ ] 明確な美的方向性を持っているか
- [ ] 少なくとも1つの「忘れられない」要素があるか
- [ ] アニメーションが意図的で統一されているか
- [ ] WCAG AA基準を満たしているか
- [ ] `prefers-reduced-motion`に対応しているか
- [ ] フォーカスインジケーターが視認可能か

## 参考リソース

- [Awwwards](https://www.awwwards.com/) - 受賞デザインの参考
- [Dribbble](https://dribbble.com/) - UIインスピレーション
- [Typewolf](https://www.typewolf.com/) - フォントの組み合わせ
- [Coolors](https://coolors.co/) - カラーパレット生成
- [Cubic-bezier](https://cubic-bezier.com/) - イージング関数のカスタマイズ
