import { Hono } from 'hono';

const app = new Hono();

// Unicode escape converter functions
function toUnicodeEscape(text: string): string {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code > 127) {
        return '\\u' + code.toString(16).padStart(4, '0');
      }
      return char;
    })
    .join('');
}

function fromUnicodeEscape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}

// HTML template for the UI
const getHTMLPage = () => `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unicode エスケープ変換ツール</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .converter-container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .converter-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 1.2rem;
      color: #333;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    textarea {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Courier New', monospace;
      resize: vertical;
      transition: border-color 0.3s;
    }
    
    textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .button-group {
      display: flex;
      gap: 15px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    
    button {
      flex: 1;
      min-width: 200px;
      padding: 15px 30px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      color: white;
    }
    
    .btn-encode {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .btn-decode {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .btn-clear {
      background: #6c757d;
      flex: 0 0 auto;
      min-width: 120px;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    
    .info-box h3 {
      font-size: 1rem;
      margin-bottom: 10px;
      color: #667eea;
    }
    
    .info-box ul {
      list-style-position: inside;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.8;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      
      .button-group {
        flex-direction: column;
      }
      
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔧 Unicode エスケープ変換ツール</h1>
      <p class="subtitle">日本語などのUnicode文字をエスケープシーケンスに変換します</p>
    </header>
    
    <div class="converter-container">
      <div class="converter-section">
        <h2 class="section-title">入力テキスト</h2>
        <textarea id="inputText" placeholder="変換したいテキストを入力してください...&#10;例: こんにちは"></textarea>
      </div>
      
      <div class="button-group">
        <button class="btn-encode" onclick="encodeToUnicode()">
          ⬇ Unicode エスケープに変換
        </button>
        <button class="btn-decode" onclick="decodeFromUnicode()">
          ⬆ Unicode から復元
        </button>
        <button class="btn-clear" onclick="clearAll()">
          🗑 クリア
        </button>
      </div>
      
      <div class="converter-section">
        <h2 class="section-title">出力結果</h2>
        <textarea id="outputText" placeholder="変換結果がここに表示されます..." readonly></textarea>
      </div>
      
      <div class="info-box">
        <h3>📝 使い方</h3>
        <ul>
          <li>「入力テキスト」欄にテキストを入力します</li>
          <li>「Unicode エスケープに変換」ボタンで日本語などを \\uXXXX 形式に変換</li>
          <li>「Unicode から復元」ボタンで \\uXXXX 形式を元の文字に変換</li>
          <li>変換結果は「出力結果」欄に表示されます</li>
        </ul>
      </div>
    </div>
  </div>
  
  <script>
    async function encodeToUnicode() {
      const input = document.getElementById('inputText').value;
      if (!input) {
        alert('テキストを入力してください');
        return;
      }
      
      try {
        const response = await fetch('/api/encode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: input })
        });
        
        const data = await response.json();
        document.getElementById('outputText').value = data.result;
      } catch (error) {
        alert('変換に失敗しました: ' + error.message);
      }
    }
    
    async function decodeFromUnicode() {
      const input = document.getElementById('inputText').value;
      if (!input) {
        alert('テキストを入力してください');
        return;
      }
      
      try {
        const response = await fetch('/api/decode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: input })
        });
        
        const data = await response.json();
        document.getElementById('outputText').value = data.result;
      } catch (error) {
        alert('変換に失敗しました: ' + error.message);
      }
    }
    
    function clearAll() {
      document.getElementById('inputText').value = '';
      document.getElementById('outputText').value = '';
    }
  </script>
</body>
</html>
`;

// Routes
app.get('/', (c) => {
  return c.html(getHTMLPage());
});

app.post('/api/encode', async (c) => {
  try {
    const { text } = await c.req.json();
    const result = toUnicodeEscape(text);
    return c.json({ result });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.post('/api/decode', async (c) => {
  try {
    const { text } = await c.req.json();
    const result = fromUnicodeEscape(text);
    return c.json({ result });
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

export default app;
