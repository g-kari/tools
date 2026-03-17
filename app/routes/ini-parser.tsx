import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  parseIni,
  formatIni,
  iniToJson,
  jsonToIni,
  calcIniStats,
  type IniData,
  type IniParseResult,
} from '~/utils/ini-parser';
import '../styles/tools/ini-parser.css';

export const Route = createFileRoute('/ini-parser')({
  head: () => ({
    meta: [
      { title: 'INIファイルパーサー/フォーマッター | Web ツール集' },
      {
        name: 'description',
        content:
          'INIファイルのパース・整形・JSON変換ツール。php.ini、.gitconfig、Windows設定ファイルなど各種INI形式に対応。セクション・キー・値をビジュアルで確認。',
      },
      { property: 'og:title', content: 'INIファイルパーサー/フォーマッター | Web ツール集' },
      {
        property: 'og:description',
        content:
          'INIファイルのパース・整形・JSON変換。php.ini、.gitconfig、Windows設定ファイルに対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/ini-parser` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'INIファイルパーサー/フォーマッター | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'INIファイルのパース・JSON変換。php.ini / .gitconfig 対応。',
      },
    ],
  }),
  component: IniParserTool,
});

// ---------------------------------------------------------------------------
// サンプルINI
// ---------------------------------------------------------------------------

const SAMPLES: Record<string, string> = {
  'php.ini': `; PHP Configuration File
[PHP]
engine = On
short_open_tag = Off
max_execution_time = 30
max_input_time = 60
memory_limit = 128M
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
post_max_size = 8M
upload_max_filesize = 2M

[Date]
date.timezone = Asia/Tokyo

[MySQLi]
mysqli.max_links = -1
mysqli.default_port = 3306`,

  '.gitconfig': `[user]
  name = John Doe
  email = john@example.com

[core]
  autocrlf = false
  editor = vim
  ignorecase = false

[alias]
  st = status
  co = checkout
  br = branch
  lg = log --oneline --decorate --all --graph

[pull]
  rebase = true`,

  'app.ini': `; Application Configuration
[general]
app_name = MyApp
version = 1.0.0
debug = false
timezone = Asia/Tokyo
language = ja

[database]
host = localhost
port = 5432
name = myapp_db
user = admin
# password is read from environment variable

[cache]
driver = redis
host = 127.0.0.1
port = 6379
ttl = 3600

[logging]
level = info
file = /var/log/myapp.log
max_size = 10M`,
};

// ---------------------------------------------------------------------------
// ツリービュー
// ---------------------------------------------------------------------------

interface IniTreeViewProps {
  result: IniParseResult;
}

function IniTreeView({ result }: IniTreeViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = useCallback((section: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const entries = Object.entries(result.data);
  if (entries.length === 0) {
    return (
      <div className="ini-tree">
        <p className="ini-tree-empty">
          パース結果がありません
        </p>
      </div>
    );
  }

  return (
    <div className="ini-tree" role="tree" aria-label="INI構造ツリー">
      {entries.map(([section, data]) => {
        const displayName = section === '' ? '(グローバル)' : section;
        const isCollapsed = collapsed.has(section);
        const keyCount = Object.keys(data).length;

        return (
          <div key={section} className="ini-tree-section" role="treeitem" aria-expanded={!isCollapsed}>
            <div
              className="ini-tree-section-header"
              onClick={() => toggle(section)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? toggle(section) : undefined}
              aria-label={`セクション: ${displayName} (${keyCount}件)`}
            >
              <span
                className={`ini-tree-section-toggle${isCollapsed ? '' : ' expanded'}`}
                aria-hidden="true"
              >
                ▶
              </span>
              <span className="ini-tree-section-name">[{displayName}]</span>
              <span className="ini-tree-section-count">{keyCount} キー</span>
            </div>

            {!isCollapsed && (
              <div className="ini-tree-entries">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="ini-tree-entry">
                    <span className="ini-tree-key">{key}</span>
                    <span className="ini-tree-separator">=</span>
                    {Array.isArray(value) ? (
                      <span className="ini-tree-value">
                        {value.join(', ')}
                        <span className="ini-tree-value-badge">{value.length}件</span>
                      </span>
                    ) : (
                      <span className="ini-tree-value">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = 'ini-to-json' | 'json-to-ini';

function IniParserTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [mode, setMode] = useState<Mode>('ini-to-json');
  const [iniInput, setIniInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [multiValue, setMultiValue] = useState(false);

  // INI→JSON モードの結果
  const iniParseResult = useMemo<IniParseResult | null>(() => {
    if (mode !== 'ini-to-json' || !iniInput.trim()) return null;
    return parseIni(iniInput, { multiValue });
  }, [mode, iniInput, multiValue]);

  const jsonOutput = useMemo<string>(() => {
    if (!iniParseResult) return '';
    const json = iniToJson(iniParseResult.data);
    return JSON.stringify(json, null, 2);
  }, [iniParseResult]);

  const iniStats = useMemo(() => {
    if (!iniParseResult) return null;
    return calcIniStats(iniParseResult);
  }, [iniParseResult]);

  // JSON→INI モードの結果
  const { iniOutput, jsonParseError } = useMemo<{
    iniOutput: string;
    jsonParseError: string | null;
  }>(() => {
    if (mode !== 'json-to-ini' || !jsonInput.trim()) {
      return { iniOutput: '', jsonParseError: null };
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { iniOutput: '', jsonParseError: 'トップレベルはオブジェクトである必要があります' };
      }
      const data = jsonToIni(parsed as Record<string, unknown>);
      return { iniOutput: formatIni(data), jsonParseError: null };
    } catch (e) {
      return {
        iniOutput: '',
        jsonParseError: e instanceof Error ? e.message : 'JSONのパースに失敗しました',
      };
    }
  }, [mode, jsonInput]);

  // JSON→INI モードのツリービュー用データ
  const jsonToIniParseResult = useMemo<IniParseResult | null>(() => {
    if (mode !== 'json-to-ini' || !jsonInput.trim() || jsonParseError) return null;
    try {
      const parsed = JSON.parse(jsonInput) as Record<string, unknown>;
      const data: IniData = jsonToIni(parsed);
      return { data, errors: [], comments: [] };
    } catch {
      return null;
    }
  }, [mode, jsonInput, jsonParseError]);

  const handleCopyOutput = useCallback(async () => {
    const text = mode === 'ini-to-json' ? jsonOutput : iniOutput;
    if (!text) return;
    const ok = await copy(text);
    if (ok) {
      showToast('コピーしました', 'success');
      announceStatus('出力をコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [mode, jsonOutput, iniOutput, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    if (mode === 'ini-to-json') {
      setIniInput('');
    } else {
      setJsonInput('');
    }
    announceStatus('入力をクリアしました');
  }, [mode, announceStatus]);

  const handleSample = useCallback((name: string) => {
    if (mode === 'ini-to-json') {
      setIniInput(SAMPLES[name] ?? '');
    }
    announceStatus(`${name} サンプルを読み込みました`);
  }, [mode, announceStatus]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    announceStatus(newMode === 'ini-to-json' ? 'INI→JSON モードに切り替えました' : 'JSON→INI モードに切り替えました');
  }, [announceStatus]);

  const hasInput = mode === 'ini-to-json' ? !!iniInput.trim() : !!jsonInput.trim();
  const currentParseResult = mode === 'ini-to-json' ? iniParseResult : jsonToIniParseResult;

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="ini-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === 'ini-to-json'}
            className={`ini-tab-btn${mode === 'ini-to-json' ? ' active' : ''}`}
            onClick={() => handleModeChange('ini-to-json')}
          >
            INI → JSON
          </button>
          <button
            role="tab"
            aria-selected={mode === 'json-to-ini'}
            className={`ini-tab-btn${mode === 'json-to-ini' ? ' active' : ''}`}
            onClick={() => handleModeChange('json-to-ini')}
          >
            JSON → INI
          </button>
        </div>

        {/* 入力エリア */}
        <div className="converter-section">
          <div className="ini-output-header">
            <label
              htmlFor="ini-input"
              className="section-title ini-label-no-margin"
            >
              {mode === 'ini-to-json' ? 'INI 入力' : 'JSON 入力'}
            </label>
          </div>

          {/* INI→JSON: サンプルボタン */}
          {mode === 'ini-to-json' && (
            <div className="ini-sample-row" aria-label="サンプルを選択">
              <span className="ini-sample-label">
                サンプル:
              </span>
              {Object.keys(SAMPLES).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="ini-sample-btn"
                  onClick={() => handleSample(name)}
                  aria-label={`${name} のサンプルを読み込む`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <textarea
            id="ini-input"
            className="ini-textarea"
            value={mode === 'ini-to-json' ? iniInput : jsonInput}
            onChange={(e) => {
              if (mode === 'ini-to-json') setIniInput(e.target.value);
              else setJsonInput(e.target.value);
            }}
            placeholder={
              mode === 'ini-to-json'
                ? '[section]\nkey = value\n\n; コメントも対応'
                : '{\n  "section": {\n    "key": "value"\n  }\n}'
            }
            aria-label={mode === 'ini-to-json' ? 'INI入力テキストエリア' : 'JSON入力テキストエリア'}
            spellCheck={false}
          />

          {/* INI→JSON: オプション */}
          {mode === 'ini-to-json' && (
            <div className="ini-options-row">
              <label className="ini-option-label">
                <input
                  type="checkbox"
                  checked={multiValue}
                  onChange={(e) => setMultiValue(e.target.checked)}
                  aria-label="重複キーを配列として扱う"
                />
                重複キーを配列として扱う
              </label>
            </div>
          )}

          {/* ボタン */}
          <div className="ini-action-row">
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyOutput}
              disabled={mode === 'ini-to-json' ? !jsonOutput : !iniOutput}
              aria-label="出力をコピー"
            >
              コピー
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              disabled={!hasInput}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>

          {/* パースエラー */}
          {mode === 'ini-to-json' && iniParseResult && iniParseResult.errors.length > 0 && (
            <div className="ini-errors" role="alert" aria-label="パースエラー">
              <div className="ini-errors-title">
                <span aria-hidden="true">⚠</span>
                {iniParseResult.errors.length} 件の解析エラー
              </div>
              {iniParseResult.errors.map((err, i) => (
                <div key={i} className="ini-error-item">
                  行 {err.line}: {err.message}
                </div>
              ))}
            </div>
          )}

          {/* JSON→INI: JSONパースエラー */}
          {mode === 'json-to-ini' && jsonParseError && (
            <div className="ini-errors" role="alert" aria-label="JSONパースエラー">
              <div className="ini-errors-title">
                <span aria-hidden="true">✕</span>
                JSONパースエラー
              </div>
              <div className="ini-error-item">{jsonParseError}</div>
            </div>
          )}
        </div>

        {/* 出力エリア */}
        {hasInput && (
          <div className="converter-section">
            <div className="ini-output-header">
              <span className="ini-output-label">
                {mode === 'ini-to-json' ? 'JSON 出力' : 'INI 出力'}
              </span>
            </div>
            <textarea
              className="ini-textarea"
              readOnly
              value={mode === 'ini-to-json' ? jsonOutput : iniOutput}
              aria-label={mode === 'ini-to-json' ? 'JSON出力' : 'INI出力'}
              aria-live="polite"
            />
          </div>
        )}

        {/* ツリービュー */}
        {currentParseResult && hasInput && (
          <div className="converter-section">
            <p className="section-title">構造ビュー</p>
            <IniTreeView result={currentParseResult} />
          </div>
        )}

        {/* 統計情報 (INI→JSON モードのみ) */}
        {mode === 'ini-to-json' && iniStats && (
          <div className="converter-section">
            <p className="section-title">統計</p>
            <div className="ini-stats">
              <div className="ini-stat-card">
                <div className="ini-stat-value">{iniStats.sectionCount}</div>
                <div className="ini-stat-label">セクション数</div>
              </div>
              <div className="ini-stat-card">
                <div className="ini-stat-value">{iniStats.totalKeys}</div>
                <div className="ini-stat-label">総キー数</div>
              </div>
              <div className="ini-stat-card">
                <div className="ini-stat-value">{iniStats.commentCount}</div>
                <div className="ini-stat-label">コメント数</div>
              </div>
              {iniParseResult && (
                <div className="ini-stat-card">
                  <div className="ini-stat-value">{iniParseResult.errors.length}</div>
                  <div className="ini-stat-label">エラー数</div>
                </div>
              )}
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'INIファイルの書式',
              items: [
                '[section] でセクションを定義します',
                'key = value または key: value でキーと値を設定します',
                '; または # で始まる行はコメントです',
                '値の末尾に ; を付けるとインラインコメントになります',
                'セクションなしのキーはグローバルキーとして扱われます',
              ],
            },
            {
              title: '対応フォーマット',
              items: [
                'php.ini (PHP設定ファイル)',
                '.gitconfig (Git設定)',
                'smb.conf (Samba設定)',
                'Windows INIファイル',
                'Python configparser形式',
                '.editorconfig (エディター設定)',
              ],
            },
            {
              title: '使い方',
              items: [
                'INI→JSON: INIテキストを貼り付けてJSONに変換',
                'JSON→INI: JSONオブジェクトをINI形式に変換',
                '「重複キーを配列として扱う」オプションで同名キーを配列化',
                'サンプルボタンで各種設定ファイルのサンプルを読み込めます',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
