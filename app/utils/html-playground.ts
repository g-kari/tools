/**
 * HTML/CSS/JS プレイグラウンド ユーティリティ
 * HTML・CSS・JavaScript を結合してプレビュー用ドキュメントを生成する
 */

/**
 * HTML/CSS/JS を組み合わせてスタンドアロン HTML ドキュメントを生成する
 * @param html - body 内に挿入する HTML コンテンツ
 * @param css - スタイルシート文字列
 * @param js - JavaScript コード文字列
 * @returns スタンドアロン HTML ドキュメント文字列
 */
export function buildDocument(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`;
}

/**
 * サンプルコードセット型定義
 */
export interface SampleCode {
  /** サンプル名 */
  name: string;
  /** HTML コンテンツ（body 内） */
  html: string;
  /** CSS スタイル */
  css: string;
  /** JavaScript コード */
  js: string;
}

/**
 * プリセットサンプルコード一覧
 */
export const SAMPLES: SampleCode[] = [
  {
    name: "カウンター",
    html: `<div class="counter">
  <button id="decBtn" class="btn btn-dec">−</button>
  <span id="count" class="count">0</span>
  <button id="incBtn" class="btn btn-inc">＋</button>
</div>`,
    css: `* { box-sizing: border-box; }
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: #f0f4f8;
  font-family: sans-serif;
}
.counter {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  padding: 2rem 3rem;
  border-radius: 1rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
}
.count {
  font-size: 3.5rem;
  font-weight: bold;
  min-width: 4rem;
  text-align: center;
  color: #2d3748;
}
.btn {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.1s;
}
.btn:hover { opacity: 0.85; }
.btn:active { transform: scale(0.9); }
.btn-inc { background: #48bb78; color: #fff; }
.btn-dec { background: #fc8181; color: #fff; }`,
    js: `const countEl = document.getElementById('count');
const incBtn = document.getElementById('incBtn');
const decBtn = document.getElementById('decBtn');
let count = 0;

incBtn.addEventListener('click', () => {
  count++;
  countEl.textContent = count;
});

decBtn.addEventListener('click', () => {
  count--;
  countEl.textContent = count;
});`,
  },
  {
    name: "ToDoリスト",
    html: `<div class="app">
  <h1>📝 ToDoリスト</h1>
  <div class="input-row">
    <input id="inp" type="text" placeholder="新しいタスクを入力..." />
    <button id="addBtn">追加</button>
  </div>
  <ul id="list"></ul>
</div>`,
    css: `* { box-sizing: border-box; }
body {
  font-family: -apple-system, sans-serif;
  max-width: 500px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #2d3748;
}
h1 { font-size: 1.6rem; margin-bottom: 1.25rem; }
.input-row { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
input[type="text"] {
  flex: 1;
  padding: 0.6rem 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}
input[type="text"]:focus { outline: none; border-color: #667eea; }
button {
  padding: 0.6rem 1.1rem;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
button:hover { background: #5a67d8; }
ul { list-style: none; padding: 0; margin: 0; }
li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #edf2f7;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }
li.done span { text-decoration: line-through; color: #a0aec0; }
li input[type="checkbox"] { accent-color: #667eea; width: 1.1rem; height: 1.1rem; cursor: pointer; }
li span { flex: 1; }
.del-btn { padding: 0.25rem 0.625rem; background: #fc8181; font-size: 0.8rem; }
.del-btn:hover { background: #f56565; }`,
    js: `const inp = document.getElementById('inp');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');

function addTodo() {
  const text = inp.value.trim();
  if (!text) return;

  const li = document.createElement('li');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  const span = document.createElement('span');
  span.textContent = text;
  const del = document.createElement('button');
  del.textContent = '削除';
  del.className = 'del-btn';

  cb.addEventListener('change', () => li.classList.toggle('done', cb.checked));
  del.addEventListener('click', () => li.remove());

  li.append(cb, span, del);
  list.appendChild(li);
  inp.value = '';
  inp.focus();
}

addBtn.addEventListener('click', addTodo);
inp.addEventListener('keydown', e => e.key === 'Enter' && addTodo());`,
  },
  {
    name: "CSSアニメーション",
    html: `<div class="scene">
  <div class="orbit">
    <div class="planet"></div>
  </div>
  <div class="sun"></div>
</div>`,
    css: `* { box-sizing: border-box; }
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: #0a0a1a;
}
.scene {
  position: relative;
  width: 240px;
  height: 240px;
}
.sun {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px; height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, #f6ad2b);
  box-shadow: 0 0 30px #f6ad2b88, 0 0 60px #f6ad2b44;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 30px #f6ad2b88, 0 0 60px #f6ad2b44; }
  50%        { box-shadow: 0 0 50px #f6ad2bcc, 0 0 90px #f6ad2b66; }
}
.orbit {
  position: absolute;
  top: 50%; left: 50%;
  width: 160px; height: 160px;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(255,255,255,0.15);
  border-radius: 50%;
  animation: spin 3s linear infinite;
}
@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.planet {
  position: absolute;
  top: -12px; left: 50%;
  transform: translateX(-50%);
  width: 24px; height: 24px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #63b3ed, #2b6cb0);
  box-shadow: 0 0 12px #63b3ed88;
}`,
    js: `// CSS アニメーションのみで動作します`,
  },
];

/**
 * コードパネルのタブ種別
 */
export type PanelTab = "html" | "css" | "js";

/**
 * パネルタブのラベルマップ
 */
export const PANEL_TAB_LABELS: Record<PanelTab, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
};
