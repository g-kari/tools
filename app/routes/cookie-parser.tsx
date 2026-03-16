import { createFileRoute } from '@tanstack/react-router';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { TipsCard } from '~/components/TipsCard';
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from '~/hooks/useStatusAnnouncement';
import { useClipboard } from '~/hooks/useClipboard';
import {
  parseCookieHeader,
  parseSetCookieHeader,
  buildSetCookieHeader,
  getCookieSecurityWarnings,
  getCookieExpiration,
  type CookieEntry,
  type SetCookieAttributes,
} from '~/utils/cookie-parser';

export const Route = createFileRoute('/cookie-parser')({
  head: () => ({
    meta: [
      { title: 'Cookieパーサー | Web ツール集' },
      {
        name: 'description',
        content:
          'HTTP CookieヘッダーとSet-Cookieヘッダーをパース・解析するツール。Cookie属性（Secure、HttpOnly、SameSite、Expires等）の確認とセキュリティ検証ができます。',
      },
      { property: 'og:title', content: 'Cookieパーサー | Web ツール集' },
      {
        property: 'og:description',
        content:
          'HTTP CookieヘッダーとSet-Cookieヘッダーをパース・解析するツール。Cookie属性の確認とセキュリティ検証。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/cookie-parser` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'Cookieパーサー | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'HTTP CookieヘッダーとSet-Cookieヘッダーをパース・解析するツール。',
      },
    ],
  }),
  component: CookieParserPage,
});

type ParseMode = 'cookie' | 'set-cookie';

/** Cookie サンプル（リクエストヘッダー） */
const COOKIE_SAMPLES = [
  'session_id=abc123; user_pref=dark; lang=ja',
  'auth=Bearer%20eyJhbGciOiJIUzI1NiJ9; csrf_token=xyz789; _ga=GA1.1.1234567890',
  'remember_me=1; theme=light; timezone=Asia%2FTokyo',
];

/** Set-Cookie サンプル（レスポンスヘッダー） */
const SET_COOKIE_SAMPLES = [
  'sessionId=abc123; Path=/; Domain=example.com; HttpOnly; Secure; SameSite=Strict',
  'token=eyJhbGciOiJIUzI1NiJ9; Max-Age=3600; Path=/api; Secure; HttpOnly; SameSite=Lax',
  'prefs=dark-mode; Expires=Mon, 01 Jan 2026 00:00:00 GMT; Path=/; SameSite=Lax',
  'insecure_cookie=bad_practice; Path=/',
];

/** SameSite属性の説明 */
const SAMESITE_DESCRIPTIONS: Record<string, string> = {
  Strict:
    'Strict - クロスサイトリクエストでは送信されません（最も安全）',
  Lax: 'Lax - トップレベルナビゲーションのGETリクエストでのみ送信されます',
  None: 'None - クロスサイトリクエストでも送信されます（Secure必須）',
};

/** アトリビュートカード */
function AttrCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cookie-parser-attr-card">
      <div className="cookie-parser-attr-key">{label}</div>
      <div className="cookie-parser-attr-val">{children}</div>
    </div>
  );
}

/** Cookieリクエストヘッダー解析パネル */
function CookieParsedPanel({
  entries,
  rawHeader,
}: {
  entries: CookieEntry[];
  rawHeader: string;
}) {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus } = useStatusAnnouncement();

  const handleCopyAll = useCallback(async () => {
    const success = await copy(rawHeader);
    if (success) {
      showToast('Cookieヘッダーをコピーしました', 'success');
      announceStatus('コピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [rawHeader, copy, showToast, announceStatus]);

  const handleCopyValue = useCallback(
    async (value: string, name: string) => {
      const success = await copy(value);
      if (success) {
        showToast(`${name} の値をコピーしました`, 'success');
        announceStatus(`${name} をコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
      }
    },
    [copy, showToast, announceStatus]
  );

  if (entries.length === 0) {
    return (
      <div className="cookie-parser-empty" role="status" aria-live="polite">
        Cookieヘッダーを入力するとパース結果が表示されます
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <p className="cookie-parser-count" role="status">
        {entries.length} 件の Cookie
      </p>
      <div className="cookie-parser-table-wrapper">
        <table
          className="cookie-parser-table"
          aria-label="Cookieエントリー一覧"
        >
          <thead>
            <tr>
              <th scope="col">名前</th>
              <th scope="col">値</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td>
                  <span className="cookie-parser-table-name">{entry.name}</span>
                </td>
                <td>
                  {entry.value ? (
                    <span className="cookie-parser-table-value">
                      {entry.value}
                    </span>
                  ) : (
                    <span className="cookie-parser-table-value-empty">
                      （値なし）
                    </span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="cookie-parser-copy-btn"
                    onClick={() => handleCopyValue(entry.value, entry.name)}
                    aria-label={`${entry.name} の値をコピー`}
                    disabled={!entry.value}
                  >
                    値をコピー
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 生成されたヘッダー */}
      <div className="cookie-parser-generated">
        <div className="cookie-parser-generated-header">
          <span className="cookie-parser-generated-label">
            Cookie: ヘッダー
          </span>
          <button
            type="button"
            className="cookie-parser-copy-btn"
            onClick={handleCopyAll}
            aria-label="Cookieヘッダー全体をコピー"
          >
            コピー
          </button>
        </div>
        <div className="cookie-parser-generated-value">{rawHeader}</div>
      </div>
    </div>
  );
}

/** Set-Cookieレスポンスヘッダー解析パネル */
function SetCookieParsedPanel({
  attrs,
}: {
  attrs: SetCookieAttributes;
}) {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { announceStatus } = useStatusAnnouncement();

  const warnings = getCookieSecurityWarnings(attrs);
  const expiration = getCookieExpiration(attrs);
  const generatedHeader = buildSetCookieHeader(attrs);

  const handleCopyHeader = useCallback(async () => {
    const success = await copy(generatedHeader);
    if (success) {
      showToast('Set-Cookieヘッダーをコピーしました', 'success');
      announceStatus('コピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [generatedHeader, copy, showToast, announceStatus]);

  const handleCopyValue = useCallback(async () => {
    const success = await copy(attrs.value);
    if (success) {
      showToast('Cookie値をコピーしました', 'success');
      announceStatus('コピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [attrs.value, copy, showToast, announceStatus]);

  return (
    <div aria-live="polite">
      {/* セキュリティ警告 */}
      {warnings.length > 0 && (
        <div
          className="cookie-parser-warnings"
          role="alert"
          aria-label="セキュリティ警告"
        >
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`cookie-parser-warning cookie-parser-warning-${w.level}`}
            >
              <span className="cookie-parser-warning-icon" aria-hidden="true">
                {w.level === 'error' ? '🚨' : w.level === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 有効期限 */}
      {expiration && (
        <div className="cookie-parser-expiry" role="status">
          <span className="cookie-parser-expiry-label">有効期限:</span>
          <span>{expiration}</span>
        </div>
      )}

      {/* 属性カードグリッド */}
      <div className="cookie-parser-attrs" aria-label="Cookie属性一覧">
        <AttrCard label="名前 (Name)">
          <span>{attrs.name}</span>
        </AttrCard>

        <AttrCard label="値 (Value)">
          <div className="cookie-parser-attr-value-row">
            <span className="cookie-parser-attr-value-text">
              {attrs.value || <span className="cookie-parser-attr-value-empty">（空）</span>}
            </span>
            {attrs.value && (
              <button
                type="button"
                className="cookie-parser-copy-btn"
                onClick={handleCopyValue}
                aria-label="Cookie値をコピー"
              >
                コピー
              </button>
            )}
          </div>
        </AttrCard>

        {attrs.path !== undefined && (
          <AttrCard label="パス (Path)">{attrs.path}</AttrCard>
        )}

        {attrs.domain !== undefined && (
          <AttrCard label="ドメイン (Domain)">{attrs.domain}</AttrCard>
        )}

        {attrs.expires !== undefined && (
          <AttrCard label="有効期限 (Expires)">{attrs.expires}</AttrCard>
        )}

        {attrs.maxAge !== undefined && (
          <AttrCard label="最大存続時間 (Max-Age)">
            {attrs.maxAge}秒
          </AttrCard>
        )}

        {attrs.sameSite !== undefined && (
          <AttrCard label="SameSite">
            {SAMESITE_DESCRIPTIONS[attrs.sameSite] ?? attrs.sameSite}
          </AttrCard>
        )}

        <AttrCard label="Secure">
          <span
            className={`cookie-parser-attr-val-bool ${attrs.secure ? 'cookie-parser-attr-val-true' : 'cookie-parser-attr-val-false'}`}
          >
            {attrs.secure ? '✓ 有効' : '✗ 無効'}
          </span>
        </AttrCard>

        <AttrCard label="HttpOnly">
          <span
            className={`cookie-parser-attr-val-bool ${attrs.httpOnly ? 'cookie-parser-attr-val-true' : 'cookie-parser-attr-val-false'}`}
          >
            {attrs.httpOnly ? '✓ 有効' : '✗ 無効'}
          </span>
        </AttrCard>

        {attrs.unknown.length > 0 && (
          <AttrCard label="その他の属性">
            <div className="cookie-parser-unknown-list">
              {attrs.unknown.map((u, i) => (
                <span key={i} className="cookie-parser-unknown-chip">
                  {u.value !== undefined ? `${u.key}=${u.value}` : u.key}
                </span>
              ))}
            </div>
          </AttrCard>
        )}
      </div>

      {/* 生成されたヘッダー */}
      <div className="cookie-parser-generated">
        <div className="cookie-parser-generated-header">
          <span className="cookie-parser-generated-label">
            Set-Cookie: ヘッダー
          </span>
          <button
            type="button"
            className="cookie-parser-copy-btn"
            onClick={handleCopyHeader}
            aria-label="Set-Cookieヘッダーをコピー"
          >
            コピー
          </button>
        </div>
        <div className="cookie-parser-generated-value">{generatedHeader}</div>
      </div>
    </div>
  );
}

/**
 * Cookieパーサーページコンポーネント
 * CookieリクエストヘッダーとSet-Cookieレスポンスヘッダーをパース・解析する
 */
function CookieParserPage() {
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<ParseMode>('cookie');
  const [cookieInput, setCookieInput] = useState('');
  const [setCookieHeaderInput, setSetCookieHeaderInput] = useState('');

  // パース結果
  const cookieEntries = parseCookieHeader(cookieInput);
  const setCookieAttrs = parseSetCookieHeader(setCookieHeaderInput);

  const handleModeChange = useCallback(
    (newMode: ParseMode) => {
      setMode(newMode);
      announceStatus(
        newMode === 'cookie'
          ? 'CookieリクエストヘッダーモードE切り替えました'
          : 'Set-CookieレスポンスヘッダーモードE切り替えました'
      );
    },
    [announceStatus]
  );

  const handleCookieSample = useCallback((sample: string) => {
    setCookieInput(sample);
  }, []);

  const handleSetCookieSample = useCallback((sample: string) => {
    setSetCookieHeaderInput(sample);
  }, []);

  const handleCookieClear = useCallback(() => {
    setCookieInput('');
    announceStatus('クリアしました');
  }, [announceStatus]);

  const handleSetCookieClear = useCallback(() => {
    setSetCookieInput('');
    announceStatus('クリアしました');
  }, [announceStatus]);

  const handleSetCookieParseError = setCookieHeaderInput.trim() && !setCookieAttrs;

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">Cookie パーサー</h2>

        {/* モードタブ */}
        <div
          className="cookie-parser-tabs"
          role="tablist"
          aria-label="解析モード"
        >
          <button
            role="tab"
            aria-selected={mode === 'cookie'}
            className={`cookie-parser-tab${mode === 'cookie' ? ' active' : ''}`}
            onClick={() => handleModeChange('cookie')}
            id="tab-cookie"
            aria-controls="panel-cookie"
          >
            Cookie（リクエスト）
          </button>
          <button
            role="tab"
            aria-selected={mode === 'set-cookie'}
            className={`cookie-parser-tab${mode === 'set-cookie' ? ' active' : ''}`}
            onClick={() => handleModeChange('set-cookie')}
            id="tab-set-cookie"
            aria-controls="panel-set-cookie"
          >
            Set-Cookie（レスポンス）
          </button>
        </div>

        {/* Cookieリクエストヘッダー モード */}
        {mode === 'cookie' && (
          <section
            id="panel-cookie"
            role="tabpanel"
            aria-labelledby="tab-cookie"
          >
            {/* サンプル */}
            <div className="cookie-parser-samples">
              <span className="cookie-parser-sample-label">サンプル:</span>
              {COOKIE_SAMPLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="cookie-parser-sample-chip"
                  onClick={() => handleCookieSample(s)}
                  aria-label={`サンプル: ${s}`}
                  title={s}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* 入力 */}
            <div className="cookie-parser-input-area">
              <label
                htmlFor="cookie-input"
                className="cookie-parser-input-label"
              >
                Cookie: ヘッダー値
              </label>
              <textarea
                id="cookie-input"
                className="cookie-parser-textarea"
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="session_id=abc123; user_pref=dark; lang=ja"
                rows={3}
                aria-label="Cookie ヘッダー値を入力"
                spellCheck={false}
              />
            </div>

            <div className="cookie-parser-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCookieClear}
                aria-label="入力をクリア"
              >
                クリア
              </button>
            </div>

            {/* 結果 */}
            <div className="cookie-parser-result">
              <CookieParsedPanel
                entries={cookieEntries}
                rawHeader={cookieInput}
              />
            </div>
          </section>
        )}

        {/* Set-Cookieレスポンスヘッダー モード */}
        {mode === 'set-cookie' && (
          <section
            id="panel-set-cookie"
            role="tabpanel"
            aria-labelledby="tab-set-cookie"
          >
            {/* サンプル */}
            <div className="cookie-parser-samples">
              <span className="cookie-parser-sample-label">サンプル:</span>
              {SET_COOKIE_SAMPLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="cookie-parser-sample-chip"
                  onClick={() => handleSetCookieSample(s)}
                  aria-label={`サンプル: ${s}`}
                  title={s}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* 入力 */}
            <div className="cookie-parser-input-area">
              <label
                htmlFor="set-cookie-input"
                className="cookie-parser-input-label"
              >
                Set-Cookie: ヘッダー値
              </label>
              <textarea
                id="set-cookie-input"
                className="cookie-parser-textarea"
                value={setCookieHeaderInput}
                onChange={(e) => setSetCookieHeaderInput(e.target.value)}
                placeholder="sessionId=abc123; Path=/; Domain=example.com; HttpOnly; Secure; SameSite=Strict"
                rows={3}
                aria-label="Set-Cookie ヘッダー値を入力"
                spellCheck={false}
              />
            </div>

            <div className="cookie-parser-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSetCookieClear}
                aria-label="入力をクリア"
              >
                クリア
              </button>
            </div>

            {/* エラー */}
            {handleSetCookieParseError && (
              <p className="converter-error" role="alert">
                Set-Cookieヘッダーのパースに失敗しました。形式を確認してください。
              </p>
            )}

            {/* 結果 */}
            <div className="cookie-parser-result">
              {setCookieAttrs ? (
                <SetCookieParsedPanel attrs={setCookieAttrs} />
              ) : (
                !handleSetCookieParseError && (
                  <div
                    className="cookie-parser-empty"
                    role="status"
                    aria-live="polite"
                  >
                    Set-Cookieヘッダーを入力するとパース結果が表示されます
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: 'Cookie と Set-Cookie の違い',
              items: [
                'Cookie: ヘッダー — ブラウザ→サーバーへ送信するリクエストヘッダー。複数のCookieをセミコロンで区切る',
                'Set-Cookie: ヘッダー — サーバー→ブラウザへ送信するレスポンスヘッダー。1ヘッダーに1つのCookieを設定する',
                '複数のCookieをセットするには Set-Cookie: ヘッダーを複数行使用する',
              ],
            },
            {
              title: '重要なセキュリティ属性',
              items: [
                'Secure — HTTPSのみでCookieを送信。セッションCookieには必須',
                'HttpOnly — JavaScriptからのCookie読み取りを禁止。XSS攻撃対策に有効',
                'SameSite=Strict — クロスサイトリクエストでCookieを送信しない（最も安全）',
                'SameSite=Lax — トップレベルナビゲーションのGETのみ送信（推奨デフォルト）',
                'SameSite=None — クロスサイトでも送信（Secure属性が必須）',
              ],
            },
            {
              title: '有効期限の指定方法',
              items: [
                'Max-Age=3600 — 相対的な秒数で指定（優先度高）。3600秒=1時間後に期限切れ',
                'Expires=日時 — 絶対日時で指定（RFC 7231形式）。Max-Ageが存在する場合は無視される',
                '両方未指定の場合 — セッションCookie（ブラウザを閉じると削除される）',
                'Max-Age=0 または負の値 — Cookieを即時削除するために使用',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
