import { html } from 'hono/html';
import { toolLayout } from './layout';

export const unicodeToolPage = toolLayout('Unicode エスケープ変換', html`
<main id="main-content" role="main">
  <header style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 2rem; margin-bottom: 10px;">Unicode エスケープ変換ツール</h1>
    <p style="color: var(--md-sys-color-on-surface-variant);">日本語などのUnicode文字をエスケープシーケンスに変換します</p>
  </header>

  <div class="tool-container">
    <form onsubmit="return false;" aria-label="Unicode変換フォーム">
      <div class="tool-section">
        <label for="inputText" class="section-title">入力テキスト</label>
        <textarea
          id="inputText"
          name="inputText"
          placeholder="変換したいテキストを入力してください...&#10;例: こんにちは"
          aria-describedby="input-help"
          aria-label="変換元のテキスト入力欄"></textarea>
        <span id="input-help" class="sr-only">このフィールドにテキストを入力して、Unicodeエスケープシーケンスに変換できます</span>
      </div>

      <div class="button-group" role="group" aria-label="変換操作">
        <button
          type="button"
          class="btn-primary"
          onclick="encodeToUnicode()"
          aria-label="入力テキストをUnicodeエスケープに変換">
          Unicode エスケープに変換
        </button>
        <button
          type="button"
          class="btn-secondary"
          onclick="decodeFromUnicode()"
          aria-label="Unicodeエスケープを通常のテキストに復元">
          Unicode から復元
        </button>
        <button
          type="button"
          class="btn-clear"
          onclick="clearAll()"
          aria-label="入力と出力をクリア">
          クリア
        </button>
      </div>

      <div class="tool-section">
        <label for="outputText" class="section-title">出力結果</label>
        <textarea
          id="outputText"
          name="outputText"
          placeholder="変換結果がここに表示されます..."
          readonly
          aria-label="変換結果の出力欄"
          aria-live="polite"></textarea>
      </div>
    </form>

    <aside class="info-box" role="complementary" aria-labelledby="usage-title">
      <h3 id="usage-title">使い方</h3>
      <ul>
        <li>「入力テキスト」欄にテキストを入力します</li>
        <li>「Unicode エスケープに変換」ボタンで日本語などを \\uXXXX 形式に変換</li>
        <li>「Unicode から復元」ボタンで \\uXXXX 形式を元の文字に変換</li>
        <li>変換結果は「出力結果」欄に表示されます</li>
        <li>キーボードショートカット: Ctrl+Enter で変換実行</li>
      </ul>
    </aside>
  </div>
</main>

<script>
  // Announce status to screen readers
  function announceStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = message;
      // Clear after announcement
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }
  }

  function toUnicodeEscape(text) {
    let result = '';
    for (let i = 0; i < text.length; ) {
      const cp = text.codePointAt(i);
      if (cp > 0xFFFF) {
        const high = ((cp - 0x10000) >> 10) + 0xD800;
        const low = ((cp - 0x10000) & 0x3FF) + 0xDC00;
        result += '\\\\u' + high.toString(16).padStart(4, '0');
        result += '\\\\u' + low.toString(16).padStart(4, '0');
        i += 2;
      } else if (cp > 127) {
        result += '\\\\u' + cp.toString(16).padStart(4, '0');
        i += 1;
      } else {
        result += text[i];
        i += 1;
      }
    }
    return result;
  }

  function fromUnicodeEscape(text) {
    return text.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  function encodeToUnicode() {
    const input = document.getElementById('inputText').value;
    if (!input) {
      announceStatus('エラー: テキストを入力してください');
      alert('テキストを入力してください');
      document.getElementById('inputText').focus();
      return;
    }
    const result = toUnicodeEscape(input);
    document.getElementById('outputText').value = result;
    announceStatus('Unicodeエスケープへの変換が完了しました');
  }

  function decodeFromUnicode() {
    const input = document.getElementById('inputText').value;
    if (!input) {
      announceStatus('エラー: テキストを入力してください');
      alert('テキストを入力してください');
      document.getElementById('inputText').focus();
      return;
    }
    const result = fromUnicodeEscape(input);
    document.getElementById('outputText').value = result;
    announceStatus('Unicodeからの復元が完了しました');
  }

  function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('outputText').value = '';
    announceStatus('入力と出力をクリアしました');
    document.getElementById('inputText').focus();
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl+Enter or Cmd+Enter to encode
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      encodeToUnicode();
    }
  });

  // Focus management on page load
  window.addEventListener('load', function() {
    document.getElementById('inputText').focus();
  });
</script>
`);
