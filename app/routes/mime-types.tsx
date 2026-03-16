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

export const Route = createFileRoute('/mime-types')({
  head: () => ({
    meta: [
      { title: 'MIMEタイプリファレンス | Web ツール集' },
      {
        name: 'description',
        content:
          'MIMEタイプ（Content-Type）の一覧リファレンス。application・text・image・audio・video・fontカテゴリ別に検索・コピーできます。',
      },
      {
        property: 'og:title',
        content: 'MIMEタイプリファレンス | Web ツール集',
      },
      {
        property: 'og:description',
        content:
          'MIMEタイプ（Content-Type）の一覧リファレンス。application・text・image・audio・video・fontカテゴリ別に検索・コピーできます。',
      },
      { property: 'og:url', content: `${SITE_BASE_URL}/mime-types` },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: SITE_OGP_IMAGE },
      {
        name: 'twitter:title',
        content: 'MIMEタイプリファレンス | Web ツール集',
      },
      {
        name: 'twitter:description',
        content:
          'MIMEタイプ（Content-Type）の一覧リファレンス。application・text・image・audio・video・fontカテゴリ別に検索・コピーできます。',
      },
    ],
  }),
  component: MimeTypesPage,
});

/**
 * MIMEタイプのカテゴリ種別
 */
export type MimeCategory =
  | 'application'
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'font'
  | 'multipart';

/**
 * MIMEタイプの型定義
 */
export interface MimeType {
  /** MIMEタイプ文字列（例: "application/json"） */
  type: string;
  /** 関連するファイル拡張子（例: [".json"]） */
  extensions: string[];
  /** MIMEタイプの説明 */
  description: string;
  /** カテゴリ */
  category: MimeCategory;
}

/**
 * MIMEタイプデータ一覧
 */
export const MIME_TYPES: MimeType[] = [
  // application
  {
    type: 'application/json',
    extensions: ['.json'],
    description:
      'JSON形式のデータ。REST APIのリクエスト・レスポンスや設定ファイルに広く使用されます。',
    category: 'application',
  },
  {
    type: 'application/xml',
    extensions: ['.xml'],
    description:
      'XML形式のデータ。設定ファイルや古いSOAP APIのレスポンスに使用されます。',
    category: 'application',
  },
  {
    type: 'application/pdf',
    extensions: ['.pdf'],
    description:
      'PDFドキュメント。電子文書の配布や帳票出力に広く使用されます。',
    category: 'application',
  },
  {
    type: 'application/zip',
    extensions: ['.zip'],
    description:
      'ZIP圧縮アーカイブ。複数ファイルをまとめてダウンロード配布する際に使用します。',
    category: 'application',
  },
  {
    type: 'application/gzip',
    extensions: ['.gz', '.gzip'],
    description:
      'Gzip圧縮ファイル。Linuxでの圧縮やHTTPレスポンスの転送圧縮（Content-Encoding）に使用。',
    category: 'application',
  },
  {
    type: 'application/x-tar',
    extensions: ['.tar'],
    description:
      'TARアーカイブ。複数ファイルをまとめてアーカイブする際に使用（主にLinux）。',
    category: 'application',
  },
  {
    type: 'application/octet-stream',
    extensions: [],
    description:
      '任意のバイナリデータ。強制ダウンロードやファイル種別不明時のフォールバックとして使用。',
    category: 'application',
  },
  {
    type: 'application/x-www-form-urlencoded',
    extensions: [],
    description:
      'HTMLフォームのデフォルトエンコーディング。キー=値ペアのURLエンコード形式で送信。',
    category: 'application',
  },
  {
    type: 'application/javascript',
    extensions: ['.js', '.mjs'],
    description:
      'JavaScriptファイル。Webブラウザで実行されるスクリプト（現在はtext/javascriptが推奨）。',
    category: 'application',
  },
  {
    type: 'application/wasm',
    extensions: ['.wasm'],
    description:
      'WebAssemblyバイナリ。ブラウザでネイティブ並みの高パフォーマンスなコードを実行するために使用。',
    category: 'application',
  },
  {
    type: 'application/ld+json',
    extensions: ['.jsonld'],
    description:
      'JSON-LD（Linked Data）形式。SEO向け構造化データのマークアップに使用。',
    category: 'application',
  },
  {
    type: 'application/manifest+json',
    extensions: ['.webmanifest'],
    description:
      'WebアプリマニフェストのJSON。PWA（Progressive Web App）のアイコンや表示設定に使用。',
    category: 'application',
  },
  {
    type: 'application/rss+xml',
    extensions: ['.rss'],
    description:
      'RSSフィード。ブログやニュースサイトの更新通知配信に使用。',
    category: 'application',
  },
  {
    type: 'application/atom+xml',
    extensions: ['.atom'],
    description: 'Atomフィード。RSSの代替フィード形式。',
    category: 'application',
  },
  {
    type: 'application/vnd.ms-excel',
    extensions: ['.xls'],
    description:
      'Microsoft Excel 旧形式（.xls）のスプレッドシートファイル。',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['.xlsx'],
    description:
      'Microsoft Excel 現行形式（.xlsx）のスプレッドシートファイル。',
    category: 'application',
  },
  {
    type: 'application/msword',
    extensions: ['.doc'],
    description: 'Microsoft Word 旧形式（.doc）の文書ファイル。',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['.docx'],
    description: 'Microsoft Word 現行形式（.docx）の文書ファイル。',
    category: 'application',
  },
  {
    type: 'application/vnd.ms-powerpoint',
    extensions: ['.ppt'],
    description:
      'Microsoft PowerPoint 旧形式（.ppt）のプレゼンテーションファイル。',
    category: 'application',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['.pptx'],
    description:
      'Microsoft PowerPoint 現行形式（.pptx）のプレゼンテーションファイル。',
    category: 'application',
  },
  {
    type: 'application/x-7z-compressed',
    extensions: ['.7z'],
    description: '7-Zip圧縮アーカイブ。高圧縮率のアーカイブ形式。',
    category: 'application',
  },
  {
    type: 'application/vnd.rar',
    extensions: ['.rar'],
    description: 'RARアーカイブ。独自形式の圧縮アーカイブ。',
    category: 'application',
  },
  {
    type: 'application/sql',
    extensions: ['.sql'],
    description: 'SQLスクリプトファイル。データベースの定義やデータ操作に使用。',
    category: 'application',
  },

  // text
  {
    type: 'text/html',
    extensions: ['.html', '.htm'],
    description:
      'HTMLドキュメント。Webページのマークアップ言語。ブラウザが解釈・描画します。',
    category: 'text',
  },
  {
    type: 'text/css',
    extensions: ['.css'],
    description:
      'CSSスタイルシート。Webページの見た目（色・レイアウト等）のスタイル定義。',
    category: 'text',
  },
  {
    type: 'text/javascript',
    extensions: ['.js', '.mjs'],
    description:
      'JavaScriptファイル。ブラウザで実行されるスクリプト（現在はこちらが推奨仕様）。',
    category: 'text',
  },
  {
    type: 'text/plain',
    extensions: ['.txt'],
    description:
      'プレーンテキストファイル。書式なしの文字列データ。ログファイルや設定ファイルに使用。',
    category: 'text',
  },
  {
    type: 'text/csv',
    extensions: ['.csv'],
    description:
      'CSV（カンマ区切り値）形式。スプレッドシートや表形式データの交換に広く使用。',
    category: 'text',
  },
  {
    type: 'text/xml',
    extensions: ['.xml'],
    description:
      'XML形式のテキスト。設定ファイルや構造化データに使用（application/xmlと等価）。',
    category: 'text',
  },
  {
    type: 'text/markdown',
    extensions: ['.md', '.markdown'],
    description:
      'Markdown形式のテキスト。README・ドキュメント・ブログ記事等に使用。',
    category: 'text',
  },
  {
    type: 'text/calendar',
    extensions: ['.ics'],
    description:
      'iCalendar形式。カレンダーイベントの交換・インポートに使用。',
    category: 'text',
  },
  {
    type: 'text/vcard',
    extensions: ['.vcf'],
    description:
      'vCard形式。連絡先情報（氏名・電話・メール等）の交換に使用。',
    category: 'text',
  },
  {
    type: 'text/event-stream',
    extensions: [],
    description:
      'Server-Sent Events（SSE）のストリーム。サーバーからクライアントへのリアルタイム通知に使用。',
    category: 'text',
  },
  {
    type: 'text/tab-separated-values',
    extensions: ['.tsv'],
    description:
      'TSV（タブ区切り値）形式。スプレッドシートデータのCSV代替形式。',
    category: 'text',
  },
  {
    type: 'text/uri-list',
    extensions: ['.uri', '.uris', '.urls'],
    description:
      'URIリスト形式。ドラッグ&ドロップ時のURL受け渡しや複数URLの記述に使用。',
    category: 'text',
  },

  // image
  {
    type: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    description:
      'JPEG画像。写真などの複雑な色を持つ画像の非可逆圧縮形式。ファイルサイズを小さくできる。',
    category: 'image',
  },
  {
    type: 'image/png',
    extensions: ['.png'],
    description:
      'PNG画像。透過対応の可逆圧縮形式。ロゴ・スクリーンショット・アイコンに最適。',
    category: 'image',
  },
  {
    type: 'image/gif',
    extensions: ['.gif'],
    description:
      'GIF画像。アニメーション対応の256色画像形式。シンプルなアニメーションに使用。',
    category: 'image',
  },
  {
    type: 'image/webp',
    extensions: ['.webp'],
    description:
      'WebP画像。JPEGとPNGを置き換えるWeb向けの高効率画像形式。透過・アニメーション両対応。',
    category: 'image',
  },
  {
    type: 'image/avif',
    extensions: ['.avif'],
    description:
      'AVIF画像。WebPよりもさらに高い圧縮率を実現する最新の画像形式（AV1ベース）。',
    category: 'image',
  },
  {
    type: 'image/svg+xml',
    extensions: ['.svg'],
    description:
      'SVG（スケーラブルベクターグラフィックス）。解像度非依存のXMLベースベクター画像形式。',
    category: 'image',
  },
  {
    type: 'image/x-icon',
    extensions: ['.ico'],
    description:
      'ICOファイル。ブラウザのfavicon（タブアイコン）やデスクトップアイコンに使用。',
    category: 'image',
  },
  {
    type: 'image/bmp',
    extensions: ['.bmp'],
    description:
      'BMP（ビットマップ）画像。Windowsの非圧縮ラスター画像形式。ファイルサイズが大きい。',
    category: 'image',
  },
  {
    type: 'image/tiff',
    extensions: ['.tif', '.tiff'],
    description:
      'TIFF画像。高品質の印刷・スキャン・写真編集用画像形式。',
    category: 'image',
  },
  {
    type: 'image/heic',
    extensions: ['.heic', '.heif'],
    description:
      'HEIC/HEIF画像。iPhoneのデフォルト高効率画像形式（iOS 11以降）。',
    category: 'image',
  },

  // audio
  {
    type: 'audio/mpeg',
    extensions: ['.mp3'],
    description:
      'MP3音声。最も広く使われる音声圧縮形式。互換性が高くあらゆる環境で再生可能。',
    category: 'audio',
  },
  {
    type: 'audio/ogg',
    extensions: ['.ogg', '.oga'],
    description:
      'Ogg音声コンテナ。オープンソースのVorbisやOpusコーデックを含む音声形式。',
    category: 'audio',
  },
  {
    type: 'audio/wav',
    extensions: ['.wav'],
    description:
      'WAV音声。非圧縮の高品質音声形式。ファイルサイズが大きいが品質は最高。',
    category: 'audio',
  },
  {
    type: 'audio/aac',
    extensions: ['.aac'],
    description:
      'AAC音声。MP3の後継となる高効率音声圧縮形式。iOSやiTunesで標準採用。',
    category: 'audio',
  },
  {
    type: 'audio/flac',
    extensions: ['.flac'],
    description:
      'FLAC音声。可逆圧縮の高品質音声形式。圧縮しても音質が劣化しない。',
    category: 'audio',
  },
  {
    type: 'audio/webm',
    extensions: ['.weba'],
    description:
      'WebM音声コンテナ。Web向けのオープン音声形式（OpusまたはVorbis）。',
    category: 'audio',
  },
  {
    type: 'audio/midi',
    extensions: ['.mid', '.midi'],
    description:
      'MIDI音声。電子楽器の演奏データ形式。音声波形ではなく音符情報を格納。',
    category: 'audio',
  },
  {
    type: 'audio/opus',
    extensions: ['.opus'],
    description:
      'Opus音声。低遅延・高品質のオープン音声コーデック。VoIPやWebRTCに最適。',
    category: 'audio',
  },

  // video
  {
    type: 'video/mp4',
    extensions: ['.mp4', '.m4v'],
    description:
      'MP4動画。最も広く使われる動画コンテナ形式（H.264/H.265コーデック）。',
    category: 'video',
  },
  {
    type: 'video/webm',
    extensions: ['.webm'],
    description:
      'WebM動画。Web向けのオープン動画形式（VP8/VP9/AV1コーデック）。',
    category: 'video',
  },
  {
    type: 'video/ogg',
    extensions: ['.ogv'],
    description:
      'Ogg動画コンテナ。オープンソースのTheoraコーデックを含む動画形式。',
    category: 'video',
  },
  {
    type: 'video/quicktime',
    extensions: ['.mov'],
    description:
      'QuickTime動画。AppleのQuickTimeプレーヤー向けコンテナ形式。',
    category: 'video',
  },
  {
    type: 'video/x-msvideo',
    extensions: ['.avi'],
    description:
      'AVI動画。Microsoftの旧来の動画コンテナ形式。互換性は高いが効率は低い。',
    category: 'video',
  },
  {
    type: 'video/mpeg',
    extensions: ['.mpeg', '.mpg'],
    description:
      'MPEG動画。旧来の動画圧縮規格（MPEG-1/MPEG-2）。DVDやデジタル放送に使用。',
    category: 'video',
  },
  {
    type: 'video/3gpp',
    extensions: ['.3gp'],
    description:
      '3GP動画。モバイル向けの動画コンテナ形式（主にAndroid/フィーチャーフォン）。',
    category: 'video',
  },

  // font
  {
    type: 'font/woff',
    extensions: ['.woff'],
    description:
      'WOFF（Web Open Font Format）。Webフォントの旧来形式。gzip圧縮済みのTTF/OTFをラップ。',
    category: 'font',
  },
  {
    type: 'font/woff2',
    extensions: ['.woff2'],
    description:
      'WOFF2（Web Open Font Format 2）。WOFFより約30%高圧縮。現在のWebフォント推奨形式。',
    category: 'font',
  },
  {
    type: 'font/ttf',
    extensions: ['.ttf'],
    description:
      'TrueTypeフォント。Windows・macOSで広くサポートされるクロスプラットフォームのフォント形式。',
    category: 'font',
  },
  {
    type: 'font/otf',
    extensions: ['.otf'],
    description:
      'OpenTypeフォント。TrueTypeを拡張した現行フォント規格。高度な組版機能を持つ。',
    category: 'font',
  },
  {
    type: 'font/collection',
    extensions: ['.ttc'],
    description:
      'TrueType Collection。複数のフォントを1ファイルにまとめたコレクション形式。',
    category: 'font',
  },

  // multipart
  {
    type: 'multipart/form-data',
    extensions: [],
    description:
      'マルチパートフォームデータ。ファイルアップロードを含むHTMLフォームのPOST送信に必須。',
    category: 'multipart',
  },
  {
    type: 'multipart/byteranges',
    extensions: [],
    description:
      'バイト範囲マルチパート。206 Partial Contentレスポンスで複数の範囲を返す際に使用。',
    category: 'multipart',
  },
  {
    type: 'multipart/mixed',
    extensions: [],
    description:
      'マルチパート混合型。複数の異なるコンテンツタイプを1つのメッセージに含める場合に使用。',
    category: 'multipart',
  },
];

/**
 * カテゴリの表示ラベルを返す
 * @param category - カテゴリ文字列
 * @returns 日本語ラベル
 */
export function getMimeCategoryLabel(category: string): string {
  switch (category) {
    case 'all':
      return 'すべて';
    case 'application':
      return 'application';
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'audio':
      return 'audio';
    case 'video':
      return 'video';
    case 'font':
      return 'font';
    case 'multipart':
      return 'multipart';
    default:
      return category;
  }
}

/**
 * カテゴリのCSSクラス名を返す
 * @param category - カテゴリ文字列
 * @returns CSSクラス名
 */
export function getMimeCategoryClass(category: string): string {
  switch (category) {
    case 'application':
      return 'mime-cat-application';
    case 'text':
      return 'mime-cat-text';
    case 'image':
      return 'mime-cat-image';
    case 'audio':
      return 'mime-cat-audio';
    case 'video':
      return 'mime-cat-video';
    case 'font':
      return 'mime-cat-font';
    case 'multipart':
      return 'mime-cat-multipart';
    default:
      return '';
  }
}

/**
 * MIMEタイプをフィルタリングする
 * @param types - フィルタリング対象のMIMEタイプ一覧
 * @param query - 検索クエリ（タイプ名・拡張子・説明）
 * @param category - カテゴリフィルタ（"all"または各カテゴリ名）
 * @returns フィルタリングされたMIMEタイプ一覧
 */
export function filterMimeTypes(
  types: MimeType[],
  query: string,
  category: string
): MimeType[] {
  const lowerQuery = query.toLowerCase().trim();

  return types.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }

    if (!lowerQuery) return true;

    return (
      item.type.toLowerCase().includes(lowerQuery) ||
      item.extensions.some((ext) => ext.toLowerCase().includes(lowerQuery)) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  });
}

const CATEGORIES: Array<'all' | MimeCategory> = [
  'all',
  'application',
  'text',
  'image',
  'audio',
  'video',
  'font',
  'multipart',
];

/**
 * MIMEタイプリファレンスページコンポーネント
 */
function MimeTypesPage() {
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  const filteredTypes = filterMimeTypes(MIME_TYPES, searchQuery, selectedCategory);

  /**
   * MIMEタイプ文字列をクリップボードにコピーする
   * @param mimeType - コピーするMIMEタイプ文字列
   */
  const handleCopyType = useCallback(
    async (mimeType: string) => {
      const success = await copy(mimeType);
      if (success) {
        showToast(`${mimeType} をコピーしました`, 'success');
        announceStatus(`${mimeType} をクリップボードにコピーしました`);
      } else {
        showToast('コピーに失敗しました', 'error');
        announceStatus('コピーに失敗しました');
      }
    },
    [copy, showToast, announceStatus]
  );

  /**
   * カテゴリを選択する
   * @param category - 選択するカテゴリ
   */
  const handleCategoryChange = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      announceStatus(
        `${getMimeCategoryLabel(category)} でフィルタリング。${filterMimeTypes(MIME_TYPES, searchQuery, category).length} 件表示`
      );
    },
    [searchQuery, announceStatus]
  );

  /**
   * 検索クエリを更新する
   * @param query - 検索クエリ
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">MIMEタイプ リファレンス</h2>

        {/* カテゴリフィルタ */}
        <div
          className="mime-filters"
          role="group"
          aria-label="カテゴリフィルター"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`mime-filter-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {getMimeCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* 検索ボックス */}
        <div className="mime-search">
          <label htmlFor="mime-search-input" className="sr-only">
            MIMEタイプを検索
          </label>
          <input
            id="mime-search-input"
            type="search"
            className="mime-search-input"
            placeholder="タイプ名・拡張子・説明で検索..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="MIMEタイプを検索"
          />
        </div>

        {/* 件数表示 */}
        <p
          className="mime-count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredTypes.length} 件 / 全 {MIME_TYPES.length} 件
        </p>

        {/* グリッド表示 */}
        {filteredTypes.length > 0 ? (
          <div
            className="mime-grid"
            role="list"
            aria-label="MIMEタイプ一覧"
          >
            {filteredTypes.map((item) => (
              <article
                key={item.type}
                className={`mime-card ${getMimeCategoryClass(item.category)}`}
                role="listitem"
                aria-label={item.type}
              >
                <div className="mime-card-header">
                  <span
                    className={`mime-badge ${getMimeCategoryClass(item.category)}`}
                    aria-label={`カテゴリ ${item.category}`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="mime-type-value">{item.type}</p>
                {item.extensions.length > 0 && (
                  <div className="mime-extensions" aria-label="対応拡張子">
                    {item.extensions.map((ext) => (
                      <span key={ext} className="mime-ext-tag">
                        {ext}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mime-desc">{item.description}</p>
                <div className="mime-card-footer">
                  <button
                    type="button"
                    className="mime-copy-btn"
                    onClick={() => handleCopyType(item.type)}
                    aria-label={`${item.type} をコピー`}
                  >
                    コピー
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mime-empty" role="status" aria-live="polite">
            <p>該当するMIMEタイプが見つかりませんでした。</p>
            <p>検索条件を変更してお試しください。</p>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: 'MIMEタイプとは',
              items: [
                'MIME（Multipurpose Internet Mail Extensions）は、インターネット上でのデータ形式の識別子です',
                'HTTPの Content-Type ヘッダーで使用し、クライアントにデータの種類を伝えます',
                '形式は「タイプ/サブタイプ」（例: application/json）で表します',
                'charset パラメータで文字コードを指定できます（例: text/html; charset=UTF-8）',
              ],
            },
            {
              title: 'よく使われるMIMEタイプ',
              items: [
                'application/json - REST APIのリクエスト・レスポンス',
                'application/x-www-form-urlencoded - HTMLフォームのPOST送信',
                'multipart/form-data - ファイルアップロード',
                'text/html; charset=UTF-8 - Webページのレスポンス',
                'application/octet-stream - バイナリファイルのダウンロード',
                'image/webp - Web向け高効率画像',
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
