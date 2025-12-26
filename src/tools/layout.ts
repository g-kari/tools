import { html } from 'hono/html';

export const commonStyles = `
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

  /* Material Design - Base Styles */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--md-sys-color-surface);
    min-height: 100vh;
    padding: 20px;
    color: var(--md-sys-color-on-surface);
  }
  .container { max-width: 1200px; margin: 0 auto; }
  
  /* Navigation */
  nav {
    background: white;
    border-radius: 4px;
    padding: 15px 30px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  nav a {
    color: var(--md-sys-color-primary);
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
    padding: 5px 10px;
  }
  nav a:hover { opacity: 0.7; }
  nav a:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .nav-home {
    font-size: 1.2rem;
    margin-right: auto;
  }
  
  /* Common tool container styles */
  .tool-container {
    background: white;
    border-radius: 4px;
    padding: 30px;
  }
  .tool-section { margin-bottom: 30px; }
  .section-title {
    font-size: 1.2rem;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 15px;
    font-weight: 500;
  }
  textarea, input[type="text"], input[type="number"] {
    width: 100%;
    min-height: 150px;
    padding: 15px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 4px;
    font-size: 14px;
    font-family: 'Roboto Mono', 'Courier New', monospace;
    resize: vertical;
    transition: border-color 0.2s;
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface);
  }
  input[type="text"], input[type="number"] {
    min-height: auto;
    height: 50px;
  }
  textarea:focus, input:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
    background: white;
  }
  .button-group { display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap; }
  button {
    flex: 1;
    min-width: 200px;
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
  .btn-clear {
    background: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface);
    flex: 0 0 auto;
    min-width: 120px;
  }
  button:hover { opacity: 0.85; }
  button:active { opacity: 0.7; }
  button:focus-visible {
    outline: 3px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  label {
    display: block;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--md-sys-color-on-surface);
  }
  .info-box {
    background: var(--md-sys-color-primary-container);
    border-left: 4px solid var(--md-sys-color-primary);
    padding: 15px;
    border-radius: 4px;
    margin-top: 20px;
  }
  .info-box h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    color: var(--md-sys-color-on-primary-container);
    font-weight: 500;
  }
  .info-box ul {
    list-style-position: inside;
    color: var(--md-sys-color-on-primary-container);
    font-size: 0.9rem;
    line-height: 1.8;
  }
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
  @media (max-width: 768px) {
    .button-group { flex-direction: column; }
    button { width: 100%; }
    nav { padding: 10px 15px; }
    nav a { padding: 5px; font-size: 0.9rem; }
  }
`;

export function toolLayout(title: string, content: any, additionalStyles: string = ''): any {
  return html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Web ツール集</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap" rel="stylesheet">
  <style>
    ${commonStyles}
    ${additionalStyles}
  </style>
</head>
<body>
  <div class="container">
    <nav role="navigation" aria-label="メインナビゲーション">
      <a href="/" class="nav-home">🏠 ホーム</a>
      <a href="/unicode">Unicode</a>
      <a href="/uuid">UUID</a>
      <a href="/password">Password</a>
      <a href="/json">JSON</a>
      <a href="/url">URL</a>
      <a href="/html">HTML</a>
      <a href="/jwt">JWT</a>
      <a href="/ip">IP</a>
    </nav>
    ${content}
  </div>
  <div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="status-message"></div>
</body>
</html>`;
}
