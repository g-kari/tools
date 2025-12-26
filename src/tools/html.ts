import { html } from 'hono/html';
import { toolLayout } from './layout';

export const htmlPage = toolLayout('HTML エスケープ', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">HTML エスケープツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">HTMLの特殊文字をエスケープ・アンエスケープします</p>
  </header>

  <div class="tool-container">
    <div class="tool-section">
      <label for="input" class="section-title">入力テキスト</label>
      <textarea id="input" placeholder="エスケープ/アンエスケープしたいテキストを入力..." aria-label="入力テキスト"></textarea>
    </div>

    <div class="button-group">
      <button type="button" class="btn-primary" onclick="escapeHTML()" aria-label="HTMLエスケープ">
        エスケープ
      </button>
      <button type="button" class="btn-secondary" onclick="unescapeHTML()" aria-label="HTMLアンエスケープ">
        アンエスケープ
      </button>
      <button type="button" class="btn-clear" onclick="clearAll()" aria-label="クリア">
        クリア
      </button>
    </div>

    <div class="tool-section">
      <label for="output" class="section-title">出力結果</label>
      <textarea id="output" readonly aria-label="出力結果" aria-live="polite"></textarea>
    </div>

    <aside class="info-box">
      <h3>HTMLエスケープとは？</h3>
      <ul>
        <li>HTML内で特別な意味を持つ文字を安全に表示するための変換です</li>
        <li>&lt; → &amp;lt; (小なり)</li>
        <li>&gt; → &amp;gt; (大なり)</li>
        <li>&amp; → &amp;amp; (アンパサンド)</li>
        <li>&quot; → &amp;quot; (ダブルクォート)</li>
        <li>' → &amp;#x27; (シングルクォート)</li>
        <li>XSS攻撃対策にも使用されます</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  function escapeHTML() {
    const input = document.getElementById('input').value;
    if (!input) {
      alert('テキストを入力してください');
      return;
    }
    
    const escaped = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\\//g, '&#x2F;');
    
    document.getElementById('output').value = escaped;
    announceStatus('エスケープしました');
  }

  function unescapeHTML() {
    const input = document.getElementById('input').value;
    if (!input) {
      alert('テキストを入力してください');
      return;
    }
    
    const textarea = document.createElement('textarea');
    textarea.innerHTML = input;
    const unescaped = textarea.value;
    
    document.getElementById('output').value = unescaped;
    announceStatus('アンエスケープしました');
  }

  function clearAll() {
    document.getElementById('input').value = '';
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
</script>
`);
