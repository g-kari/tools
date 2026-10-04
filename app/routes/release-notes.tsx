import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useMemo, useState } from "react";

/**
 * リリースエントリのタイプ
 */
export type ReleaseType = "feat" | "fix" | "security" | "refactor" | "test" | "chore" | "docs";

/**
 * リリースエントリ（1件の変更）
 */
export interface ReleaseEntry {
  /** タイプ（feat / fix / security など） */
  type: ReleaseType;
  /** 変更タイトル（1行） */
  title: string;
  /** 詳細説明（任意） */
  description?: string;
}

/**
 * 1つのリリース（バージョン単位）
 */
export interface Release {
  /** バージョン表記（例: "2026.04"） */
  version: string;
  /** リリース日（YYYY-MM-DD） */
  date: string;
  /** 見出し（任意。例: "MessagePack対応"） */
  headline?: string;
  /** 含まれる変更 */
  entries: ReleaseEntry[];
}

/**
 * リリースノートのデータ
 * 新しいものを上にする
 */
export const releases: Release[] = [
  {
    version: "2026.10.3",
    date: "2026-10-04",
    entries: [
      {
        type: "feat",
        title: "ツール検索を複数キーワード・全角入力に対応",
        description:
          "ツール一覧とCtrl+K検索で「JSON 圧縮」のように空白区切りで絞り込めます。カテゴリ名・パス、全角英数字・半角かなにも対応。検索クリア後のフォーカスと日本語入力の確定操作を保持します。",
      },
      {
        type: "fix",
        title: "コピー後のキーボード操作とテキスト選択を保持",
        description:
          "Clipboard API非対応時のコピーで、元のボタンや入力欄へフォーカスを戻し、選択範囲と入力欄のスクロール位置を保持します。コピー失敗時も一時入力欄を残さず、再試行できます。",
      },
    ],
  },
  {
    version: "2026.10.2",
    date: "2026-10-03",
    entries: [
      {
        type: "fix",
        title: "CSV/JSON変換で後続レコードの列が欠落する不具合を修正",
        description:
          "JSONの全オブジェクトから初出順に列を集め、欠けたキーは空欄にします。重複CSVヘッダー・余分な列・JSONの混在行や空配列は、値を黙って失わず修正方法付きのエラーで案内します。",
      },
    ],
  },
  {
    version: "2026.10.1",
    date: "2026-10-02",
    entries: [
      {
        type: "fix",
        title: "JSON整形・圧縮で数値と元のデータ表記を保持",
        description:
          "大きな整数・精密な小数・指数表記を丸めず、負のゼロ・文字列のエスケープ・キーの順序と重複も保持して空白だけを変更します。入力編集やエラー時は古い結果をクリアします。",
      },
      {
        type: "feat",
        title: "絵文字GIFの生成結果を確認して保存",
        description:
          "色数・ディザリングとBayer専用調整を追加。生成されたGIFの実際のプレビューと容量を表示し、ツールの容量上限以内の場合だけ同じファイルを保存できます。設定変更時は再生成が必要です。",
      },
      {
        type: "fix",
        title: "Markdownプレビュー: 禁止要素と危険なURL属性の除去を修正",
        description:
          "埋め込み・フォーム・スクリプト・スタイルなどの禁止要素を子要素ごと除去し、イベント・style属性と難読化された危険なURLスキームをフィルターします。通常のMarkdown構文・リンク・画像は保持します。",
      },
      {
        type: "fix",
        title: "リンク共有用のデフォルト画像が表示されない不具合を修正",
        description:
          "OGP・Twitterカードの参照先に、サイトの配色と名前を使った1200×630のPNG画像を追加しました。画像URLが404ページになる問題を解消します。",
      },
    ],
  },
  {
    version: "2026.10",
    date: "2026-10-01",
    entries: [
      {
        type: "fix",
        title: "共有メタデータのURLを本番サイトのドメインに統一",
        description:
          "各ページのOGP URLとOGP・Twitter画像の参照元を、本番サイトの https://tools.0g0.xyz に修正しました。",
      },
      {
        type: "fix",
        title: "JSON Lines: 整形・圧縮で1レコード1行を保持",
        description:
          "整形後もJSON Linesとして検証・変換できるように修正。不正な行がある場合は入力を変更せず修正を案内し、圧縮で後続レコードを結合しません。選択中モードの再クリックで内容を保持し、変換ショートカットは変換モードのみで動作します。",
      },
      {
        type: "fix",
        title: "CSV/JSON変換: 引用符内の複数行と前後の空白を保持",
        description:
          "CSVの引用符内の改行・空行・エスケープされた引用符とフィールド前後の空白を保持し、LF/CRLF/CRのレコード区切りとUTF-8 BOMに対応。閉じ忘れなど不正な引用符はエラーで知らせ、以前の変換結果をクリアします。",
      },
    ],
  },
  {
    version: "2026.04.3",
    date: "2026-04-19",
    entries: [
      {
        type: "refactor",
        title: "Base64 ツールをモード切替 UI に刷新",
        description:
          "Base64 エンコード・デコードをタブ切替 UI に統一。出力のコピー・入出力の⇄入れ替え・エラー表示に対応し、他の Base 系ツールと体験を揃えた。",
      },
    ],
  },
  {
    version: "2026.04.2",
    date: "2026-04-19",
    entries: [
      {
        type: "docs",
        title: "ドキュメント整備: 新ツール追加ガイドと JSDoc ヘッダ規約を追加",
        description:
          "docs/tools-guide.md に新ツール追加テンプレートを整備。.claude/rules/new-tool.md に JSDoc モジュールヘッダ（@tool / @description 等）の記載を必須化。代表ツール（base64 / hash / jwt-inspector）にヘッダを適用。README を現状に合わせて更新。",
      },
    ],
  },
  {
    version: "2026.04.1",
    date: "2026-04-18",
    entries: [
      {
        type: "feat",
        title: "新ツール追加: JWT Inspector",
        description:
          "JWTのヘッダー・ペイロードをデコードし、exp/iat/nbfをリアルタイムで評価。HS256/384/512・RS256/384/512・ES256/384の署名検証をWeb Crypto APIでブラウザ内完結（秘密情報はサーバー送信なし）。",
      },
      {
        type: "fix",
        title: "和暦変換: 元号期間の終了日が年のみで表示されていた不具合を修正",
        description:
          "平成・昭和・大正・明治の期間が「1989年1月8日〜2019年4月30日」のように月日まで正しく表示されるようになりました。",
      },
      {
        type: "security",
        title: "セキュリティ修正: protobufjs の任意コード実行脆弱性 (GHSA-xq3m-2v4x-88gg) 対応",
        description:
          "transitive dependency の protobufjs を overrides で修正版 (>=7.5.5) に固定しました。",
      },
    ],
  },
  {
    version: "2026.04",
    date: "2026-04-17",
    headline: "WebSocketテスター強化・UI洗練",
    entries: [
      {
        type: "feat",
        title: "WebSocketテスター: MessagePack・バイナリ送受信対応",
        description:
          "JSON以外にMessagePack形式と任意バイナリの送受信をサポート。受信メッセージも自動でデコード表示します。",
      },
      {
        type: "fix",
        title: "UI修正: tipsカードの配色改善・ドロップダウン誤閉じ防止",
      },
      {
        type: "fix",
        title: "UI改善: コントラスト・ボタン崩れ・フォント修正",
      },
      {
        type: "chore",
        title: "Dependabot: minimum-release-age を cooldown に変更",
        description: "Dependabotの設定を最新仕様に合わせ、依存更新の自動化を継続可能にしました。",
      },
      {
        type: "chore",
        title: "CI追加: lint・フォーマット・ユニットテストをPR/pushで自動実行",
      },
      {
        type: "test",
        title: "テストカバレッジ向上",
        description:
          "ip-geolocation, curl-to-fetch, docker-run-to-compose, password-generator, yaml-toml, statistics などのユニットテストを追加。",
      },
      {
        type: "security",
        title: "セキュリティ修正: vite・axios の脆弱性対応",
      },
    ],
  },
  {
    version: "2026.04.0",
    date: "2026-04-09",
    headline: "Vite+移行・背景除去ツール追加",
    entries: [
      {
        type: "feat",
        title: "AI背景除去ツールを追加",
        description: "@imgly/background-removal を使ってブラウザ内で画像の背景を自動除去できます。",
      },
      {
        type: "feat",
        title: "全文検索モーダル（Ctrl+K）",
        description: "どのページからでもCtrl+Kで全ツールを検索・ジャンプできるようになりました。",
      },
      {
        type: "chore",
        title: "ツールチェーン移行: Vite+ (vite-plus) を導入",
        description:
          "Rolldown/Oxc ベースの vite-plus に移行し、ビルド・lint・フォーマットを高速化。",
      },
      {
        type: "feat",
        title: "デプロイ最適化: static assets を CF CDN から配信",
        description: "Cloudflare Worker 呼び出し回数を削減し、配信を高速化しました。",
      },
      {
        type: "security",
        title: "lodash / lodash-es の脆弱性対応（CVE）",
      },
    ],
  },
  {
    version: "2026.04.0-rc",
    date: "2026-04-03",
    headline: "ビジュアライザー系ツール拡充",
    entries: [
      {
        type: "feat",
        title: "マンデルブロット集合ビジュアライザー (/mandelbrot)",
      },
      {
        type: "feat",
        title: "リサジュー図形ビジュアライザー (/lissajous)",
      },
      {
        type: "feat",
        title: "二分探索木ビジュアライザー (/bst-visualizer)",
      },
      {
        type: "feat",
        title: "ソートアルゴリズム可視化ツール (/sort-visualizer)",
      },
      {
        type: "feat",
        title: "三角関数計算機 (/trig)",
      },
      {
        type: "refactor",
        title: "useOutputCopy フックでコピー処理を一元化",
      },
      {
        type: "security",
        title: "port-check の SSRF 対策（localhost・プライベートIPブロック）",
      },
      {
        type: "fix",
        title: "ip-api.com のリクエストを HTTP に調整",
      },
    ],
  },
  {
    version: "2026.03",
    date: "2026-03-20",
    headline: "初版公開",
    entries: [
      {
        type: "feat",
        title: "Webツール集を公開",
        description:
          "変換・計算・エンコード・情報・ゲームなど 200 以上のツールをカテゴリ別に提供開始。",
      },
    ],
  },
];

/**
 * タイプごとの日本語ラベル
 */
export const typeLabels: Record<ReleaseType, string> = {
  feat: "新機能",
  fix: "修正",
  security: "セキュリティ",
  refactor: "リファクタ",
  test: "テスト",
  chore: "メンテナンス",
  docs: "ドキュメント",
};

/**
 * リリース一覧をタイプでフィルタリングする
 * @param list - リリース一覧
 * @param type - フィルタ対象のタイプ（null の場合は絞り込みなし）
 * @returns エントリが残ったリリースのみ
 */
export function filterReleases(list: Release[], type: ReleaseType | null): Release[] {
  if (type === null) return list;
  return list
    .map((release) => ({
      ...release,
      entries: release.entries.filter((entry) => entry.type === type),
    }))
    .filter((release) => release.entries.length > 0);
}

/**
 * リリースノートに含まれる全タイプの集合を取得する
 */
export function collectTypes(list: Release[]): ReleaseType[] {
  const set = new Set<ReleaseType>();
  for (const release of list) {
    for (const entry of release.entries) {
      set.add(entry.type);
    }
  }
  return Array.from(set);
}

export const Route = createFileRoute("/release-notes")({
  head: () => ({
    meta: [
      { title: "リリースノート | Web ツール集" },
      {
        name: "description",
        content:
          "Web ツール集のリリースノート。新機能・修正・セキュリティ対応などの変更履歴を時系列で確認できます。",
      },
      { property: "og:title", content: "リリースノート | Web ツール集" },
      {
        property: "og:description",
        content:
          "Web ツール集のリリースノート。新機能・修正・セキュリティ対応などの変更履歴を時系列で確認できます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/release-notes` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "リリースノート | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "Web ツール集のリリースノート。新機能・修正・セキュリティ対応などの変更履歴を時系列で確認できます。",
      },
    ],
  }),
  component: ReleaseNotesPage,
});

/**
 * リリースノートページコンポーネント
 */
function ReleaseNotesPage() {
  const [activeType, setActiveType] = useState<ReleaseType | null>(null);

  const availableTypes = useMemo(() => collectTypes(releases), []);
  const filteredReleases = useMemo(() => filterReleases(releases, activeType), [activeType]);

  return (
    <div className="release-notes-container">
      <header className="release-notes-header">
        <h2 className="release-notes-title">リリースノート</h2>
        <p className="release-notes-subtitle">主要な変更を時系列で掲載しています</p>
      </header>

      <nav className="release-notes-filters" role="tablist" aria-label="タイプで絞り込み">
        <button
          type="button"
          role="tab"
          aria-selected={activeType === null}
          className={`release-notes-filter-chip${activeType === null ? " is-active" : ""}`}
          onClick={() => setActiveType(null)}
        >
          すべて
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={activeType === type}
            className={`release-notes-filter-chip release-notes-filter-chip--${type}${activeType === type ? " is-active" : ""}`}
            onClick={() => setActiveType(type)}
          >
            {typeLabels[type]}
          </button>
        ))}
      </nav>

      {filteredReleases.length === 0 ? (
        <p className="release-notes-empty" role="status" aria-live="polite">
          該当する変更はありません
        </p>
      ) : (
        <ol className="release-notes-list">
          {filteredReleases.map((release) => (
            <li key={release.version} className="release-notes-item">
              <div className="release-notes-item-heading">
                <span className="release-notes-version">v{release.version}</span>
                <time className="release-notes-date" dateTime={release.date}>
                  {release.date}
                </time>
                {release.headline && (
                  <span className="release-notes-headline">{release.headline}</span>
                )}
              </div>
              <ul className="release-notes-entries">
                {release.entries.map((entry, idx) => (
                  <li key={`${release.version}-${idx}`} className="release-notes-entry">
                    <span className={`release-notes-badge release-notes-badge--${entry.type}`}>
                      {typeLabels[entry.type]}
                    </span>
                    <div className="release-notes-entry-body">
                      <span className="release-notes-entry-title">{entry.title}</span>
                      {entry.description && (
                        <span className="release-notes-entry-description">{entry.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
