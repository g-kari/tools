# WCAG 2.1 ウェブアクセシビリティガイドライン

このスキルは、Web Content Accessibility Guidelines (WCAG) 2.1 に基づいたアクセシビリティ実装のガイドラインを提供します。

## 参考リンク

- **公式日本語訳**: https://waic.jp/translations/WCAG21/
- **W3C 公式**: https://www.w3.org/TR/WCAG21/

## WCAG 2.1 の4つの原則（POUR）

### 1. 知覚可能（Perceivable）

情報とUIコンポーネントは、ユーザーが知覚できる方法で提示されなければなりません。

**主要な達成基準:**
- **1.1.1 非テキストコンテンツ（A）**: すべての非テキストコンテンツに代替テキストを提供
- **1.3.1 情報及び関係性（A）**: セマンティックなHTMLマークアップを使用
- **1.4.3 コントラスト（最低限）（AA）**: テキストと背景のコントラスト比を 4.5:1 以上に
- **1.4.11 非テキストのコントラスト（AA）**: UIコンポーネントは 3:1 以上のコントラスト比

### 2. 操作可能（Operable）

UIコンポーネントとナビゲーションは、ユーザーが操作できなければなりません。

**主要な達成基準:**
- **2.1.1 キーボード（A）**: すべての機能をキーボードで操作可能に
- **2.1.2 キーボードトラップなし（A）**: キーボードフォーカスを閉じ込めない
- **2.4.1 ブロックスキップ（A）**: 繰り返されるコンテンツブロックをスキップする仕組み
- **2.4.3 フォーカス順序（A）**: 意味のある順序でフォーカス移動
- **2.4.7 フォーカスの可視化（AA）**: フォーカスインジケーターを明確に表示

### 3. 理解可能（Understandable）

情報とUIの操作は理解可能でなければなりません。

**主要な達成基準:**
- **3.1.1 ページの言語（A）**: HTMLのlang属性で言語を指定
- **3.2.1 フォーカス時（A）**: フォーカスだけでコンテキストの変化を引き起こさない
- **3.3.1 エラーの特定（A）**: 入力エラーを自動的に検出して説明
- **3.3.2 ラベル又は説明（A）**: 入力フィールドにラベルや説明を提供
- **3.3.3 エラー修正の提案（AA）**: エラー修正の提案を提供

### 4. 堅牢（Robust）

コンテンツは、支援技術を含む様々なユーザーエージェントで解釈できるよう十分に堅牢でなければなりません。

**主要な達成基準:**
- **4.1.2 名前（name）、役割（role）及び値（value）（A）**: すべてのUIコンポーネントに適切な名前、役割、値を提供
- **4.1.3 ステータスメッセージ（AA）**: ステータスメッセージをプログラムで判別可能に

## 適合レベル

- **レベル A**: 最低限の適合レベル
- **レベル AA**: 推奨される適合レベル（多くの法規制の基準）
- **レベル AAA**: 最高レベルの適合

**推奨**: 最低でもレベル AA への適合を目指す

## 実装チェックリスト

### HTML構造

```html
<!-- ✓ 適切な文書言語の指定 -->
<html lang="ja">

<!-- ✓ セマンティックなランドマーク -->
<header role="banner">
<main role="main">
<nav role="navigation">
<aside role="complementary">
<footer role="contentinfo">

<!-- ✓ 見出しの階層構造 -->
<h1>メインタイトル</h1>
  <h2>セクションタイトル</h2>
    <h3>サブセクション</h3>
```

### フォームアクセシビリティ

```html
<!-- ✓ label と input の関連付け -->
<label for="username">ユーザー名</label>
<input id="username" type="text" name="username" required>

<!-- ✓ ARIA による説明 -->
<input
  id="email"
  type="email"
  aria-describedby="email-help"
  aria-required="true">
<span id="email-help">例: user@example.com</span>

<!-- ✓ エラーメッセージの関連付け -->
<input
  id="password"
  type="password"
  aria-invalid="true"
  aria-describedby="password-error">
<span id="password-error" role="alert">
  パスワードは8文字以上である必要があります
</span>
```

### ボタンとリンク

```html
<!-- ✓ 明確なラベル -->
<button type="button" aria-label="メニューを開く">
  ☰
</button>

<!-- ✓ 視覚的に隠されたテキスト -->
<a href="/search">
  <span class="sr-only">検索</span>
  🔍
</a>

<!-- ✓ リンクの目的が明確 -->
<a href="/about">会社概要を見る</a>
<!-- ✗ 避けるべき -->
<a href="/about">こちら</a>
```

### キーボード操作

```javascript
// ✓ キーボードショートカット
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
});

// ✓ フォーカス管理
function openDialog() {
  const dialog = document.getElementById('dialog');
  dialog.showModal();
  // ダイアログ内の最初のフォーカス可能要素にフォーカス
  dialog.querySelector('button').focus();
}
```

### スキップリンク

```html
<!-- ✓ ページ先頭にスキップリンク -->
<a href="#main-content" class="skip-link">
  メインコンテンツへスキップ
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```

### スクリーンリーダー向けアナウンス

```html
<!-- ✓ ライブリージョン -->
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- 動的に更新されるメッセージ -->
</div>

<!-- ✓ 視覚的に隠すがスクリーンリーダーには読ませる -->
<style>
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
</style>

<span class="sr-only">追加情報</span>
```

### フォーカスインジケーター

```css
/* ✓ 明確なフォーカススタイル */
:focus-visible {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}

/* ✗ フォーカスを完全に削除してはいけない */
/* button:focus { outline: none; } */
```

## ARIAの使用ガイドライン

### ARIA 5つのルール

1. **使わないで済むなら使わない**: セマンティックHTMLを優先
2. **ネイティブのセマンティクスを変更しない**: `<button role="heading">` は避ける
3. **すべてのインタラクティブ要素はキーボード操作可能に**
4. **`role="presentation"` または `aria-hidden="true"` の要素にフォーカス不可**
5. **すべてのインタラクティブ要素にアクセシブルな名前を**

### よく使うARIA属性

```html
<!-- ラベル付け -->
<button aria-label="閉じる">×</button>
<div aria-labelledby="title-id">...</div>

<!-- 説明 -->
<input aria-describedby="help-text">

<!-- 状態 -->
<button aria-pressed="true">オン</button>
<button aria-expanded="false">メニュー</button>
<input aria-invalid="true">
<input aria-required="true">

<!-- ライブリージョン -->
<div aria-live="polite"><!-- 丁寧に通知 --></div>
<div aria-live="assertive"><!-- 即座に通知 --></div>
<div role="alert"><!-- aria-live="assertive" と同等 --></div>
<div role="status"><!-- aria-live="polite" と同等 --></div>
```

## テストツール

### 自動テストツール

```bash
# axe-core (推奨)
npm install --save-dev @axe-core/cli
npx axe https://example.com

# pa11y
npm install --save-dev pa11y
npx pa11y https://example.com
```

### 手動テスト項目

1. **キーボードのみでの操作**
   - Tab キーですべての要素にアクセス可能か
   - Enter/Space でボタンやリンクを操作可能か
   - Esc でモーダルやメニューを閉じられるか

2. **スクリーンリーダーテスト**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)
   - TalkBack (Android)

3. **拡大表示**
   - 200% ズームでレイアウトが崩れないか
   - テキストが読みやすいか

4. **カラーコントラスト**
   - テキストと背景のコントラスト比
   - フォーカスインジケーターの視認性

## よくある実装ミス

### ❌ 避けるべき実装

```html
<!-- ✗ div や span でボタンを作る -->
<div onclick="doSomething()">クリック</div>

<!-- ✗ 画像に代替テキストがない -->
<img src="logo.png">

<!-- ✗ フォーカスインジケーターを削除 -->
<style>* { outline: none; }</style>

<!-- ✗ ラベルのない入力フィールド -->
<input type="text" placeholder="名前">

<!-- ✗ 意味のないリンクテキスト -->
<a href="/more">こちら</a>
```

### ✅ 推奨される実装

```html
<!-- ✓ ネイティブのボタン要素 -->
<button type="button" onclick="doSomething()">クリック</button>

<!-- ✓ 適切な代替テキスト -->
<img src="logo.png" alt="会社ロゴ">

<!-- ✓ カスタムフォーカススタイル -->
<style>:focus-visible { outline: 2px solid blue; }</style>

<!-- ✓ label 要素を使用 -->
<label for="name">名前</label>
<input id="name" type="text" placeholder="山田太郎">

<!-- ✓ 明確なリンクテキスト -->
<a href="/more">製品の詳細を見る</a>
```

## 実装例: アクセシブルなフォーム

```html
<form>
  <div>
    <label for="username">
      ユーザー名
      <span aria-label="必須">*</span>
    </label>
    <input
      id="username"
      type="text"
      name="username"
      required
      aria-required="true"
      aria-describedby="username-help">
    <span id="username-help" class="help-text">
      半角英数字で入力してください
    </span>
  </div>

  <div>
    <label for="email">
      メールアドレス
      <span aria-label="必須">*</span>
    </label>
    <input
      id="email"
      type="email"
      name="email"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-help">
    <span id="email-help" class="help-text">
      例: user@example.com
    </span>
  </div>

  <div role="group" aria-labelledby="consent-label">
    <span id="consent-label">利用規約</span>
    <label>
      <input type="checkbox" required aria-required="true">
      利用規約に同意します
    </label>
  </div>

  <button type="submit">送信</button>

  <!-- エラーメッセージ用の領域 -->
  <div role="alert" aria-live="assertive" id="form-errors"></div>
</form>
```

## チェックリスト

実装時に確認すべき項目:

- [ ] すべてのページに適切な `lang` 属性がある
- [ ] 見出し（h1-h6）の階層が適切
- [ ] すべての画像に `alt` 属性がある
- [ ] フォームコントロールにラベルがある
- [ ] キーボードのみですべての機能を操作できる
- [ ] フォーカスインジケーターが明確に表示される
- [ ] カラーコントラストが WCAG AA を満たす（4.5:1 以上）
- [ ] ランドマークロール（main, nav, header等）を適切に使用
- [ ] スキップリンクがある
- [ ] エラーメッセージが適切に通知される
- [ ] aria-live 領域でステータス変化を通知
- [ ] スクリーンリーダーでテストした

## 追加リソース

- **MDN Web Docs**: https://developer.mozilla.org/ja/docs/Web/Accessibility
- **WebAIM**: https://webaim.org/
- **The A11Y Project**: https://www.a11yproject.com/
- **ARIA Authoring Practices Guide**: https://www.w3.org/WAI/ARIA/apg/
