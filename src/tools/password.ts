import { html } from 'hono/html';
import { toolLayout } from './layout';

export const passwordPage = toolLayout('パスワード生成', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">パスワード生成ツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">安全でランダムなパスワードを生成します</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="length" class="section-title">パスワードの長さ</label>
      <input type="number" id="length" value="16" min="4" max="128" aria-label="パスワードの長さ">
    </div>

    <div class="tool-section">
      <label class="section-title">使用する文字種</label>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="useUppercase" checked>
          <span>大文字 (A-Z)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="useLowercase" checked>
          <span>小文字 (a-z)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="useNumbers" checked>
          <span>数字 (0-9)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="useSymbols" checked>
          <span>記号 (!@#$%^&*)</span>
        </label>
      </div>
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="generatePassword()" aria-label="パスワードを生成">
        生成
      </button>
      <button type="button" class="btn-secondary" onclick="copyToClipboard()" aria-label="クリップボードにコピー">
        コピー
      </button>
      <button type="button" class="btn-clear" onclick="clearOutput()" aria-label="クリア">
        クリア
      </button>
    </div>

    <div class="tool-section">
      <label for="output" class="section-title">生成されたパスワード</label>
      <textarea id="output" readonly aria-label="生成されたパスワード" aria-live="polite" style="font-size: 18px;"></textarea>
    </div>

    <aside class="info-box">
      <h3>安全なパスワードのポイント</h3>
      <ul>
        <li>12文字以上の長さを推奨します</li>
        <li>大文字、小文字、数字、記号を組み合わせましょう</li>
        <li>サービスごとに異なるパスワードを使用しましょう</li>
        <li>パスワードマネージャーの使用を推奨します</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  function generatePassword() {
    const length = parseInt(document.getElementById('length').value) || 16;
    const useUppercase = document.getElementById('useUppercase').checked;
    const useLowercase = document.getElementById('useLowercase').checked;
    const useNumbers = document.getElementById('useNumbers').checked;
    const useSymbols = document.getElementById('useSymbols').checked;

    let charset = '';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      alert('少なくとも1つの文字種を選択してください');
      return;
    }

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    document.getElementById('output').value = password;
    announceStatus('パスワードを生成しました');
  }

  async function copyToClipboard() {
    const output = document.getElementById('output').value;
    if (!output) {
      alert('パスワードを生成してください');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(output);
      announceStatus('クリップボードにコピーしました');
      alert('クリップボードにコピーしました');
    } catch (err) {
      alert('コピーに失敗しました');
    }
  }

  function clearOutput() {
    document.getElementById('output').value = '';
    announceStatus('クリアしました');
  }

  function announceStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }

  // Generate on load
  window.addEventListener('load', generatePassword);
</script>
`);
