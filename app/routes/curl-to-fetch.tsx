import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { Button } from '~/components/ui/button';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import { convertCurl, type ConvertOptions } from '../utils/curl-to-fetch';

export const Route = createFileRoute('/curl-to-fetch')({
  head: () => ({
    meta: [
      { title: 'cURL → fetch 変換 | Web ツール集' },
      {
        name: 'description',
        content:
          'cURLコマンドをJavaScript Fetch API または axios のコードに変換するツール。-H / -d / -X / -u などのフラグに対応。ブラウザ内完結。',
      },
      {
        property: 'og:title',
        content: 'cURL → fetch 変換 | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'cURLコマンドをJavaScript Fetch API / axios コードに変換。ヘッダー・ボディ・認証に対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/curl-to-fetch` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'cURL → fetch 変換 | Web ツール集',
      },
      {
        name: 'twitter:description',
        content:
          'cURLコマンドをJavaScript Fetch API / axios コードに変換するツール。',
      },
    ],
  }),
  component: CurlToFetchPage,
});

/** サンプルcURLコマンド集 */
const SAMPLES = [
  {
    label: 'GET リクエスト',
    value: `curl 'https://api.example.com/users' \\
  -H 'Accept: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.example'`,
  },
  {
    label: 'POST JSON',
    value: `curl 'https://api.example.com/users' \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"山田太郎","email":"taro@example.com"}'`,
  },
  {
    label: 'Basic 認証',
    value: `curl 'https://api.example.com/private' \\
  -u 'admin:secret123' \\
  -H 'Accept: application/json'`,
  },
  {
    label: 'フォームデータ送信',
    value: `curl 'https://api.example.com/login' \\
  -X POST \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'username=taro&password=pass123'`,
  },
] as const;

/**
 * cURL → fetch 変換ツール
 */
function CurlToFetchPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [curlInput, setCurlInput] = useState('');
  const [mode, setMode] = useState<'fetch' | 'axios'>('fetch');
  const [typescript, setTypescript] = useState(false);

  const opts: ConvertOptions = { mode, typescript };

  const result = useMemo(() => {
    if (!curlInput.trim()) return null;
    return convertCurl(curlInput, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curlInput, mode, typescript]);

  const handleClear = () => {
    setCurlInput('');
    announceStatus('入力をクリアしました');
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    const success = await copy(result.code);
    if (success) {
      showToast('コードをコピーしました', 'success');
      announceStatus('コードをコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleSample = (value: string) => {
    setCurlInput(value);
    announceStatus('サンプルを読み込みました');
  };

  return (
    <>
      <div className="ctf-container">
        {/* 入力セクション */}
        <section className="ctf-section" aria-labelledby="ctf-input-heading">
          <h2 id="ctf-input-heading" className="section-title">
            cURL → fetch 変換
          </h2>

          {/* サンプルボタン */}
          <div className="ctf-samples" role="group" aria-label="サンプルを読み込む">
            <span className="ctf-samples-label">サンプル：</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                className="ctf-sample-btn"
                onClick={() => handleSample(s.value)}
                aria-label={`${s.label}のサンプルを読み込む`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* cURL入力 */}
          <div className="ctf-input-wrapper">
            <label htmlFor="ctf-curl-input" className="ctf-label">
              cURL コマンド
            </label>
            <textarea
              id="ctf-curl-input"
              className="ctf-textarea ctf-textarea--input"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder={`curl 'https://api.example.com/data' \\
  -H 'Authorization: Bearer TOKEN' \\
  -H 'Content-Type: application/json'`}
              aria-label="cURLコマンドを入力"
              spellCheck={false}
              autoComplete="off"
              rows={6}
            />
          </div>

          {/* オプション */}
          <div className="ctf-options" role="group" aria-label="変換オプション">
            <div className="ctf-option-group">
              <span className="ctf-option-label">出力形式：</span>
              <label className="ctf-radio-label">
                <input
                  type="radio"
                  name="ctf-mode"
                  value="fetch"
                  checked={mode === 'fetch'}
                  onChange={() => setMode('fetch')}
                  className="ctf-radio"
                />
                fetch
              </label>
              <label className="ctf-radio-label">
                <input
                  type="radio"
                  name="ctf-mode"
                  value="axios"
                  checked={mode === 'axios'}
                  onChange={() => setMode('axios')}
                  className="ctf-radio"
                />
                axios
              </label>
            </div>

            <label className="ctf-checkbox-label">
              <input
                type="checkbox"
                checked={typescript}
                onChange={(e) => setTypescript(e.target.checked)}
                className="ctf-checkbox"
              />
              TypeScript
            </label>
          </div>

          {/* 操作ボタン */}
          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              disabled={!curlInput}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
            {result?.code && (
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleCopy}
                aria-label="コードをコピー"
              >
                コピー
              </Button>
            )}
          </div>
        </section>

        {/* 出力セクション */}
        <section className="ctf-section" aria-labelledby="ctf-output-heading">
          <h2 id="ctf-output-heading" className="section-title">
            変換結果{' '}
            <span className="ctf-mode-badge" aria-hidden="true">
              {mode === 'fetch' ? 'Fetch API' : 'axios'}
              {typescript ? ' + TypeScript' : ''}
            </span>
          </h2>

          {/* 警告メッセージ */}
          {result?.warnings && result.warnings.length > 0 && (
            <ul className="ctf-warnings" role="list" aria-label="変換時の注意">
              {result.warnings.map((w, i) => (
                <li key={i} className="ctf-warning-item">
                  <span aria-hidden="true">⚠</span> {w}
                </li>
              ))}
            </ul>
          )}

          {/* コード出力 */}
          <div className="ctf-output-wrapper">
            <pre
              className="ctf-code-block"
              aria-label="変換されたコード"
              aria-live="polite"
            >
              {result?.code ? (
                <code>{result.code}</code>
              ) : (
                <span className="ctf-placeholder">
                  cURLコマンドを入力すると変換結果が表示されます
                </span>
              )}
            </pre>
          </div>
        </section>

        <TipsCard
          sections={[
            {
              title: '使い方',
              items: [
                'cURL コマンドをそのまま貼り付けてください（"curl" の有無は問いません）',
                'バックスラッシュ改行（\\）による複数行のcURLにも対応しています',
                '「サンプル」ボタンで典型的なパターンをすぐに試せます',
                '「コピー」ボタンで生成されたコードをクリップボードにコピーできます',
              ],
            },
            {
              title: '対応フラグ',
              items: [
                '-X / --request : HTTPメソッドを指定（GET, POST, PUT, DELETE 等）',
                '-H / --header : リクエストヘッダーを追加',
                '-d / --data / --data-raw : リクエストボディを設定',
                '-u / --user : Basic認証（Authorization: Basic ヘッダーに変換）',
                '-b / --cookie : Cookieを設定',
                '-A / --user-agent : User-Agentを設定',
                '-L / --location : リダイレクト追従（fetch の redirect: follow に変換）',
                '-I / --head : HEAD メソッドに変換',
                '--compressed : Accept-Encoding ヘッダーを追加',
                '--json : --data + Content-Type: application/json の組み合わせ',
              ],
            },
            {
              title: '注意点',
              items: [
                '-k / --insecure はブラウザの fetch では設定不可。Node.js 環境では https.Agent が必要です',
                '--data-binary はバイナリデータの場合、手動での調整が必要です',
                'Cookie セキュリティポリシー（SameSite等）はコードに含まれません',
                '環境変数 ${VAR} や $() のコマンド置換は展開されません。手動で値を置き換えてください',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
