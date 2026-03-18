import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  generateSql,
  isCsvSqlError,
  DEFAULT_OPTIONS,
  type CsvSqlOptions,
  type SqlDialect,
} from '~/utils/csv-sql';
import '../styles/tools/csv-sql.css';

export const Route = createFileRoute('/csv-sql')({
  head: () => ({
    meta: [
      { title: 'CSV → SQL INSERT文ジェネレーター | Web ツール集' },
      {
        name: 'description',
        content:
          'CSVデータからSQL INSERT文を自動生成するツール。MySQL・PostgreSQL・SQLite・SQL Server に対応。バッチINSERT、NULL変換、数値・ブーリアン自動検出に対応。',
      },
      { property: 'og:title', content: 'CSV → SQL INSERT文ジェネレーター | Web ツール集' },
      {
        property: 'og:description',
        content: 'CSVデータからSQL INSERT文を自動生成。MySQL・PostgreSQL・SQLite・SQL Server対応。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/csv-sql` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'CSV → SQL INSERT文ジェネレーター | Web ツール集' },
      {
        name: 'twitter:description',
        content: 'CSVデータからSQL INSERT文を自動生成。MySQL・PostgreSQL・SQLite・SQL Server対応。',
      },
    ],
  }),
  component: CsvSqlGenerator,
});

// ---------------------------------------------------------------------------
// サンプル CSV データ
// ---------------------------------------------------------------------------

const SAMPLE_CSV = `id,name,email,age,active,score
1,田中 太郎,taro@example.com,28,true,95.5
2,佐藤 花子,hanako@example.com,34,false,82.0
3,鈴木 一郎,ichiro@example.com,22,true,NULL
4,山田 美咲,misaki@example.com,41,true,77.3
5,中村 健太,,29,false,88.1`;

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function CsvSqlGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [csvInput, setCsvInput] = useState('');
  const [options, setOptions] = useState<CsvSqlOptions>({ ...DEFAULT_OPTIONS });

  // SQL 生成（リアルタイム）
  const result = useMemo(() => {
    if (!csvInput.trim()) return null;
    return generateSql(csvInput, options);
  }, [csvInput, options]);

  const isError = result !== null && isCsvSqlError(result);
  const sqlOutput = result !== null && !isCsvSqlError(result) ? result.sql : '';

  const handleOptionChange = useCallback(
    <K extends keyof CsvSqlOptions>(key: K, value: CsvSqlOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!sqlOutput) return;
    const ok = await copy(sqlOutput);
    if (ok) {
      showToast('SQL をコピーしました', 'success');
      announceStatus('SQL をクリップボードにコピーしました');
    } else {
      showToast('コピーに失敗しました', 'error');
    }
  }, [sqlOutput, copy, showToast, announceStatus]);

  const handleClear = useCallback(() => {
    setCsvInput('');
    announceStatus('入力をクリアしました');
  }, [announceStatus]);

  const handleLoadSample = useCallback(() => {
    setCsvInput(SAMPLE_CSV);
    announceStatus('サンプルデータを読み込みました');
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* オプション */}
        <div className="csv-sql-options">
          {/* テーブル名 */}
          <div className="csv-sql-option-group">
            <label htmlFor="csv-sql-table" className="csv-sql-option-label">
              テーブル名
            </label>
            <input
              id="csv-sql-table"
              type="text"
              className="csv-sql-input"
              value={options.tableName}
              onChange={(e) => handleOptionChange('tableName', e.target.value)}
              placeholder="my_table"
              aria-label="テーブル名"
            />
          </div>

          {/* ダイアレクト */}
          <div className="csv-sql-option-group">
            <label htmlFor="csv-sql-dialect" className="csv-sql-option-label">
              SQLダイアレクト
            </label>
            <select
              id="csv-sql-dialect"
              className="csv-sql-select"
              value={options.dialect}
              onChange={(e) => handleOptionChange('dialect', e.target.value as SqlDialect)}
              aria-label="SQLダイアレクト"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="sqlserver">SQL Server</option>
            </select>
          </div>

          {/* バッチサイズ */}
          <div className="csv-sql-option-group">
            <label htmlFor="csv-sql-batch" className="csv-sql-option-label">
              バッチサイズ（行/INSERT）
            </label>
            <input
              id="csv-sql-batch"
              type="number"
              className="csv-sql-input"
              value={options.batchSize}
              min={1}
              max={1000}
              onChange={(e) =>
                handleOptionChange('batchSize', Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              aria-label="バッチサイズ"
            />
          </div>
        </div>

        {/* チェックボックスオプション */}
        <div className="csv-sql-checkboxes">
          <label className="csv-sql-checkbox-label">
            <input
              type="checkbox"
              checked={options.hasHeader}
              onChange={(e) => handleOptionChange('hasHeader', e.target.checked)}
              aria-label="1行目をヘッダーとして使用"
            />
            1行目をヘッダーとして使用
          </label>
          <label className="csv-sql-checkbox-label">
            <input
              type="checkbox"
              checked={options.convertNull}
              onChange={(e) => handleOptionChange('convertNull', e.target.checked)}
              aria-label="空値・NULLをSQL NULLに変換"
            />
            空値・NULL を SQL NULL に変換
          </label>
          <label className="csv-sql-checkbox-label">
            <input
              type="checkbox"
              checked={options.detectNumbers}
              onChange={(e) => handleOptionChange('detectNumbers', e.target.checked)}
              aria-label="数値を自動検出"
            />
            数値を自動検出（クォートなし）
          </label>
          <label className="csv-sql-checkbox-label">
            <input
              type="checkbox"
              checked={options.detectBooleans}
              onChange={(e) => handleOptionChange('detectBooleans', e.target.checked)}
              aria-label="ブーリアンを自動検出"
            />
            ブーリアン (true/false) を自動検出
          </label>
        </div>

        {/* CSV 入力 */}
        <div className="converter-section">
          <label htmlFor="csv-sql-input" className="section-title">
            CSV 入力
          </label>
          <textarea
            id="csv-sql-input"
            className="csv-sql-textarea"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder={'id,name,email\n1,田中太郎,taro@example.com\n2,佐藤花子,hanako@example.com'}
            spellCheck={false}
            aria-label="CSV入力"
          />
        </div>

        {/* エラー */}
        {isError && csvInput.trim() && (
          <div className="csv-sql-error" role="alert" aria-label="エラー">
            <span className="csv-sql-error-icon" aria-hidden="true">
              ⚠
            </span>
            {(result as { type: string; message: string }).message}
          </div>
        )}

        {/* ボタン */}
        <div className="csv-sql-action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopy}
            disabled={!sqlOutput}
            aria-label="SQLをコピー"
          >
            SQL をコピー
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSample}
            aria-label="サンプルデータを読み込む"
          >
            サンプル
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!csvInput}
            aria-label="入力をクリア"
          >
            クリア
          </button>
        </div>

        {/* 出力 */}
        {sqlOutput && !isError && result && !isCsvSqlError(result) && (
          <div className="converter-section">
            <div className="csv-sql-output-header">
              <span className="csv-sql-output-title">生成された SQL</span>
              <div className="csv-sql-output-meta" aria-label="生成結果の統計">
                <span className="csv-sql-badge">{result.rowCount} 行</span>
                <span className="csv-sql-badge">{result.columnCount} 列</span>
                <span className="csv-sql-badge">{result.statementCount} 文</span>
              </div>
            </div>
            <textarea
              className="csv-sql-textarea csv-sql-textarea-output"
              readOnly
              value={sqlOutput}
              aria-label="生成されたSQL INSERT文"
              aria-live="polite"
            />
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'CSV 形式について',
              items: [
                '1行目はヘッダー行として列名に使用されます（設定で無効化可能）',
                'ダブルクォートで囲まれたフィールドはカンマ・改行を含めることができます',
                '連続するダブルクォート ("") はエスケープされた引用符として扱われます',
                'Excel・Google Sheetsからコピーしたデータもそのまま貼り付けできます',
              ],
            },
            {
              title: 'NULL 変換について',
              items: [
                '空セル・"null"・"NULL"・"N/A"・"nil" は SQL NULL に変換されます',
                '「NULL 変換」オプションを無効にすると、すべて文字列として扱われます',
                '数値自動検出が有効な場合、数値はクォートなしで出力されます',
              ],
            },
            {
              title: 'バッチ INSERT について',
              items: [
                'バッチサイズ = 1: 各行が個別の INSERT 文になります',
                'バッチサイズ > 1: 複数行をひとつの INSERT VALUES (...), (...) にまとめます',
                'バッチ INSERT はパフォーマンスが向上しますが、1エラーで行全体が失敗します',
                'MySQL では最大パケットサイズ（max_allowed_packet）に注意が必要です',
              ],
            },
            {
              title: 'ダイアレクト別の違い',
              items: [
                'MySQL: 識別子にバッククォート (`) を使用',
                'PostgreSQL・SQLite: 識別子に二重引用符 (") を使用',
                'SQL Server: 識別子に角括弧 ([]) を使用',
                'MySQL では TRUE/FALSE の代わりに 1/0 を使用します',
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
