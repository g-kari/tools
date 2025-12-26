import { html } from 'hono/html';
import { commonStyles } from './layout';

export const homePage = html`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web ツール集</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap" rel="stylesheet">
  <style>
    ${commonStyles}
    header { text-align: center; color: var(--md-sys-color-on-surface); margin-bottom: 40px; margin-top: 20px; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 400;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 1.1rem;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 300;
    }
    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .tool-card {
      background: white;
      border-radius: 4px;
      padding: 25px;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid transparent;
    }
    .tool-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: var(--md-sys-color-primary);
    }
    .tool-card:focus-visible {
      outline: 3px solid var(--md-sys-color-primary);
      outline-offset: 3px;
    }
    .tool-card h2 {
      font-size: 1.3rem;
      margin-bottom: 10px;
      color: var(--md-sys-color-primary);
      font-weight: 500;
    }
    .tool-card p {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      h1 { font-size: 2rem; }
      .tools-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header role="banner">
      <h1>🛠️ Web ツール集</h1>
      <p class="subtitle">便利なWebツールをブラウザで簡単に使えます</p>
    </header>

    <main id="main-content" role="main">
      <div class="tools-grid">
        <a href="/unicode" class="tool-card" aria-label="Unicodeエスケープ変換ツール">
          <h2>Unicode エスケープ変換</h2>
          <p>日本語などのUnicode文字をエスケープシーケンスに変換します</p>
        </a>
        
        <a href="/uuid" class="tool-card" aria-label="UUID生成ツール">
          <h2>UUID 生成</h2>
          <p>ランダムなUUID（v4）を生成します</p>
        </a>
        
        <a href="/password" class="tool-card" aria-label="パスワード生成ツール">
          <h2>パスワード生成</h2>
          <p>安全でランダムなパスワードを生成します</p>
        </a>
        
        <a href="/json" class="tool-card" aria-label="JSONエンコード・デコードツール">
          <h2>JSON フォーマット</h2>
          <p>JSONのフォーマット、圧縮、検証を行います</p>
        </a>
        
        <a href="/url" class="tool-card" aria-label="URLエンコード・デコードツール">
          <h2>URL エンコード・デコード</h2>
          <p>URLのエンコードとデコードを行います</p>
        </a>
        
        <a href="/html" class="tool-card" aria-label="HTML変換ツール">
          <h2>HTML エスケープ</h2>
          <p>HTMLの特殊文字をエスケープ・アンエスケープします</p>
        </a>
        
        <a href="/jwt" class="tool-card" aria-label="JWTデコーダー">
          <h2>JWT デコーダー</h2>
          <p>JSON Web Tokenの内容を確認します</p>
        </a>
        
        <a href="/ip" class="tool-card" aria-label="グローバルIP確認">
          <h2>グローバル IP</h2>
          <p>あなたのグローバルIPアドレスを表示します</p>
        </a>
      </div>
    </main>
  </div>
</body>
</html>
`;
