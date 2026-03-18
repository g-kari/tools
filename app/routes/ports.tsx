import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '~/components/Toast';
import { useClipboard } from '~/hooks/useClipboard';
import { StatusAnnouncer, useStatusAnnouncement } from '~/hooks/useStatusAnnouncement';
import { TipsCard } from '~/components/TipsCard';
import { SITE_BASE_URL, SITE_OGP_IMAGE } from '../constants/site';
import {
  PORT_DATABASE,
  filterPorts,
  getCategoryLabel,
  getCategoryClass,
  type PortCategory,
  type PortProtocol,
} from '~/utils/ports';
import '../styles/tools/ports.css';

export const Route = createFileRoute('/ports')({
  head: () => ({
    meta: [
      { title: 'ポート番号リファレンス | Web ツール集' },
      {
        name: 'description',
        content:
          'TCP/UDP ウェルノウンポート番号の一覧リファレンス。Web・メール・データベース・セキュリティ・メッセージングなどカテゴリ別に検索できる。SSH・HTTP・MySQL・Redis・Kafka など主要サービスのポートを網羅。',
      },
      { property: 'og:title', content: 'ポート番号リファレンス | Web ツール集' },
      {
        property: 'og:description',
        content:
          'TCP/UDP ウェルノウンポート番号の一覧リファレンス。Web・メール・データベース・セキュリティ・メッセージングなどカテゴリ別に検索。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/ports` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      { name: 'twitter:title', content: 'ポート番号リファレンス | Web ツール集' },
      {
        name: 'twitter:description',
        content:
          'TCP/UDP ウェルノウンポート番号の一覧リファレンス。カテゴリ別フィルタリングとキーワード検索でポートをすばやく調べられる。',
      },
    ],
  }),
  component: PortsPage,
});

const CATEGORIES: Array<PortCategory | 'all'> = [
  'all',
  'web',
  'email',
  'database',
  'security',
  'messaging',
  'development',
  'network',
  'remote',
  'file',
];

const PROTOCOLS: Array<PortProtocol | 'all'> = ['all', 'TCP', 'UDP', 'TCP/UDP'];

/**
 * ポート番号リファレンスページ
 */
function PortsPage() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [selectedCategory, setSelectedCategory] = useState<PortCategory | 'all'>('all');
  const [selectedProtocol, setSelectedProtocol] = useState<PortProtocol | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPorts = useMemo(
    () => filterPorts(PORT_DATABASE, searchQuery, selectedCategory, selectedProtocol),
    [searchQuery, selectedCategory, selectedProtocol]
  );

  const handleCopyPort = useCallback(
    async (port: number) => {
      const ok = await copy(String(port));
      if (ok) {
        showToast(`${port} をコピーしました`, 'success');
        announceStatus(`ポート番号 ${port} をクリップボードにコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
        announceStatus('コピーに失敗しました');
      }
    },
    [copy, showToast, announceStatus]
  );

  const handleCategoryChange = useCallback(
    (cat: PortCategory | 'all') => {
      setSelectedCategory(cat);
      const count = filterPorts(PORT_DATABASE, searchQuery, cat, selectedProtocol).length;
      announceStatus(`${getCategoryLabel(cat)} でフィルタリング。${count} 件表示`);
    },
    [searchQuery, selectedProtocol, announceStatus]
  );

  const handleProtocolChange = useCallback(
    (proto: PortProtocol | 'all') => {
      setSelectedProtocol(proto);
      const label = proto === 'all' ? 'すべてのプロトコル' : proto;
      const count = filterPorts(PORT_DATABASE, searchQuery, selectedCategory, proto).length;
      announceStatus(`${label} でフィルタリング。${count} 件表示`);
    },
    [searchQuery, selectedCategory, announceStatus]
  );

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">ポート番号リファレンス</h2>

        {/* カテゴリフィルター */}
        <div className="ports-filters" role="group" aria-label="カテゴリフィルター">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ports-filter-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* プロトコルフィルター */}
        <div className="ports-protocol-filters" role="group" aria-label="プロトコルフィルター">
          <span className="ports-protocol-label" aria-hidden="true">
            プロトコル:
          </span>
          {PROTOCOLS.map((proto) => (
            <button
              key={proto}
              type="button"
              className={`ports-protocol-btn${selectedProtocol === proto ? ' active' : ''}`}
              onClick={() => handleProtocolChange(proto)}
              aria-pressed={selectedProtocol === proto}
            >
              {proto === 'all' ? 'すべて' : proto}
            </button>
          ))}
        </div>

        {/* 検索ボックス */}
        <div className="ports-search">
          <label htmlFor="ports-search-input" className="sr-only">
            ポートを検索
          </label>
          <input
            id="ports-search-input"
            type="search"
            className="ports-search-input"
            placeholder="ポート番号・サービス名・説明で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="ポートを検索"
          />
        </div>

        {/* 件数表示 */}
        <p
          className="ports-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredPorts.length} 件 / 全 {PORT_DATABASE.length} 件
        </p>

        {/* カードグリッド */}
        {filteredPorts.length > 0 ? (
          <div className="ports-grid" role="list" aria-label="ポート番号一覧">
            {filteredPorts.map((entry, idx) => (
              <article
                key={`${entry.port}-${entry.service}-${idx}`}
                className={`ports-card ${getCategoryClass(entry.category)}`}
                role="listitem"
                aria-label={`ポート ${entry.port} ${entry.service}`}
              >
                <div className="ports-card-header">
                  <span
                    className="ports-number"
                    aria-label={`ポート番号 ${entry.port}`}
                  >
                    {entry.port}
                  </span>
                  <div className="ports-badges">
                    <span
                      className="ports-protocol-badge"
                      aria-label={`プロトコル ${entry.protocol}`}
                    >
                      {entry.protocol}
                    </span>
                    <span
                      className="ports-category-badge"
                      aria-label={`カテゴリ ${getCategoryLabel(entry.category)}`}
                    >
                      {getCategoryLabel(entry.category)}
                    </span>
                  </div>
                </div>

                <p className="ports-service">{entry.service}</p>
                <p className="ports-description">{entry.description}</p>

                <div className="ports-card-footer">
                  <button
                    type="button"
                    className="ports-copy-btn"
                    onClick={() => handleCopyPort(entry.port)}
                    aria-label={`ポート番号 ${entry.port} をコピー`}
                  >
                    ポート番号をコピー
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="ports-empty" role="status" aria-live="polite">
            <p>該当するポートが見つかりませんでした。</p>
            <p>検索条件を変更してお試しください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'ポート番号の種別',
              items: [
                'ウェルノウンポート（0–1023）: IANA が標準サービスに予約。管理者権限が必要（Linux）',
                '登録済みポート（1024–49151）: IANA に登録された一般アプリケーション用',
                'ダイナミックポート（49152–65535）: 一時的な通信（エフェメラルポート）に使用',
              ],
            },
            {
              title: 'セキュリティのヒント',
              items: [
                '平文プロトコル（HTTP:80, FTP:21, Telnet:23）はセキュリティ上非推奨',
                'SSH (22) へのアクセスは IP 制限や公開鍵認証で保護を推奨',
                '不要なポートはファイアウォールで閉じ、攻撃対象面を最小化する',
                '本番 DB ポート（3306, 5432, 27017）は外部から直接アクセス不可にすること',
              ],
            },
            {
              title: '主要サービスのポート早見表',
              items: [
                'SSH: 22 / HTTP: 80 / HTTPS: 443',
                'SMTP: 25/465/587 / IMAP: 143/993 / POP3: 110/995',
                'MySQL: 3306 / PostgreSQL: 5432 / MongoDB: 27017 / Redis: 6379',
                'Docker API: 2375(非暗号化) / 2376(TLS) / Kubernetes API: 6443',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
