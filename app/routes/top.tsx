import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo } from "react";

/**
 * ツールアイテムの型定義
 */
export interface ToolItem {
  /** ツールのパス */
  path: string;
  /** ツールの表示名 */
  label: string;
  /** ツールの説明 */
  description: string;
  /** ツールのアイコン（絵文字） */
  icon: string;
}

/**
 * ツールカテゴリの型定義
 */
export interface ToolCategory {
  /** カテゴリ名 */
  name: string;
  /** カテゴリアイコン */
  icon: string;
  /** カテゴリに含まれるツール */
  items: ToolItem[];
}

/**
 * 全ツールのカタログデータ
 * カテゴリ別に整理されたツール一覧
 */
export const toolCatalog: ToolCategory[] = [
  {
    name: "変換",
    icon: "⇄",
    items: [
      {
        path: "/number-theory",
        label: "数論ツール",
        description:
          "GCD（最大公約数）・LCM（最小公倍数）の複数数値計算、素因数分解、素数判定、冪乗mod（base^exp mod m）、モジュラー逆数、オイラーのトーシェント関数 φ(n) を計算。暗号理論・競技プログラミングに便利。",
        icon: "∑",
      },
      {
        path: "/template",
        label: "Mustache テンプレート",
        description:
          "Mustache 構文のテンプレートを JSON データでリアルタイムレンダリング。{{variable}}・{{#section}}・{{^inverted}} などの構文に対応。設定ファイル生成・コード自動生成・メール文面作成に便利。",
        icon: "📋",
      },
      {
        path: "/ascii-table",
        label: "ASCII テーブル",
        description:
          "ASCII 文字コード 0〜127 の完全リファレンス。10進数・16進数・8進数・2進数・HTML エンティティ・説明を一覧表示。制御文字・印刷可能文字のフィルタリングと検索に対応。",
        icon: "⌨",
      },
      {
        path: "/unicode",
        label: "Unicode変換",
        description: "Unicode文字列のエスケープ/アンエスケープ変換",
        icon: "🔤",
      },
      {
        path: "/unicode-inspector",
        label: "Unicodeコードポイント検査",
        description:
          "テキストの各文字をコードポイント単位で解析。U+XXXX表記・UTF-8バイト列・UTF-16コードユニット・HTMLエンティティ・カテゴリをリアルタイム表示。絵文字・漢字・制御文字にも対応。",
        icon: "🔬",
      },
      {
        path: "/url-encode",
        label: "URLエンコード",
        description: "URL文字列のエンコード/デコード変換",
        icon: "🔗",
      },
      {
        path: "/url-parser",
        label: "URLパーサー/ビルダー",
        description:
          "URLを各コンポーネント（プロトコル、ホスト、パス、クエリパラメータ等）に分解・解析し、各パーツからURLを組み立てる",
        icon: "🔗",
      },
      {
        path: "/env-parser",
        label: ".envパーサー",
        description: ".envファイルのパース・JSON/YAML/Shellへの変換",
        icon: "⚙️",
      },
      {
        path: "/html-encode",
        label: "HTMLエンコード",
        description: "HTML特殊文字のエスケープ変換",
        icon: "📄",
      },
      {
        path: "/string-escape",
        label: "文字列エスケープ",
        description:
          "JavaScript・JSON・Python・正規表現・Shell向けの文字列エスケープ/アンエスケープツール。\\n・\\t・\\uXXXX などの特殊文字をリアルタイム変換。",
        icon: "🔡",
      },
      {
        path: "/html-formatter",
        label: "HTMLフォーマッター",
        description: "HTML を整形・美化。インデント幅（2/4スペース・タブ）選択対応。",
        icon: "✨",
      },
      {
        path: "/msgpack",
        label: "MessagePack変換",
        description: "MessagePackとJSONの相互変換",
        icon: "📦",
      },
      {
        path: "/base64",
        label: "Base64変換",
        description: "文字列/バイナリのBase64エンコード・デコード",
        icon: "🔀",
      },
      {
        path: "/base36",
        label: "Base36変換",
        description:
          "[0-9a-z] の 36 文字を使用した Base36 エンコード・デコード。JavaScript の Number.toString(36) / parseInt(str, 36) と互換。ライセンスキー・短い ID・タイムスタンプベースの ID 生成に最適。整数モード対応。",
        icon: "36",
      },
      {
        path: "/base58",
        label: "Base58変換",
        description:
          "Bitcoin・IPFS・Solanaで使われるBase58エンコード・デコード。視覚的に紛らわしい文字（0, O, I, l）を除いた58文字を使用。Bitcoin（標準）とFlickrアルファベットに対応。",
        icon: "₿",
      },
      {
        path: "/base62",
        label: "Base62変換",
        description:
          "[0-9A-Za-z] の 62 文字を使用したエンコード・デコード。URL 短縮サービス・短い一意 ID 生成・YouTube 動画 ID などに使われる英数字のみのエンコード方式。整数モード対応。",
        icon: "62",
      },
      {
        path: "/base85",
        label: "Base85変換",
        description:
          "ASCII85 / Z85 形式の Base85 エンコード・デコード。4バイトを5文字に変換し Base64 より約25%効率的。PDF・PostScript・ZeroMQ で使用される Base85 エンコーディング。",
        icon: "85",
      },
      {
        path: "/base16",
        label: "Base16 (Hex) 変換",
        description:
          "テキストを Base16（16進数・Hex）形式にエンコード・デコードするツール。大文字/小文字の切り替えや区切り文字（スペース・コロン・ダッシュ）のオプションに対応。",
        icon: "16",
      },
      {
        path: "/base32",
        label: "Base32変換",
        description:
          "RFC 4648 準拠の Base32 エンコード・デコード。Standard (A–Z, 2–7) と Base32hex (0–9, A–V) に対応。TOTP シークレットキーの確認に便利。",
        icon: "🔣",
      },
      {
        path: "/base64-image",
        label: "Base64画像デコード",
        description: "Base64エンコード画像のデコードとプレビュー",
        icon: "🖼️",
      },
      {
        path: "/json",
        label: "JSON整形",
        description: "JSONデータの整形・検証・圧縮",
        icon: "{ }",
      },
      {
        path: "/json-path",
        label: "JSONPath評価",
        description: "JSONデータにJSONPathクエリを適用して値を抽出・評価",
        icon: "🔍",
      },
      {
        path: "/json-flatten",
        label: "JSONフラット化",
        description:
          "ネストされたJSONをフラットなキー構造に変換・復元するツール。区切り文字・配列処理・最大深さを設定可能。",
        icon: "⬇️",
      },
      {
        path: "/json-lines",
        label: "JSON Lines フォーマッター",
        description:
          "JSON Lines（NDJSON）の解析・整形・バリデーション。JSON配列との相互変換も可能。ログファイルやストリーミングAPIのデバッグに便利。",
        icon: "📄",
      },
      {
        path: "/json-merge",
        label: "JSONマージ",
        description:
          "複数のJSONオブジェクトをディープマージ・シャローマージできるツール。配列の結合戦略（上書き・結合・ユニーク）も選択可能。",
        icon: "🔀",
      },
      {
        path: "/json-pointer",
        label: "JSON Pointer評価",
        description:
          "JSON Pointer (RFC 6901) を使ってJSONデータから値を抽出・評価できるオンラインツール。ポインター一覧の列挙にも対応。",
        icon: "📍",
      },
      {
        path: "/html-to-jsx",
        label: "HTML→JSX変換",
        description:
          "HTMLをReact JSXに変換するツール。class→className、for→htmlFor などの属性変換に対応。",
        icon: "⚛️",
      },
      {
        path: "/html-markdown",
        label: "HTML→Markdown変換",
        description:
          "HTMLをMarkdown形式にリアルタイム変換するツール。見出し・リスト・テーブル・コードブロック・リンク・画像など主要なHTML要素に対応。コンテンツ移行やブログ執筆に便利。",
        icon: "📝",
      },
      {
        path: "/php-serialize",
        label: "PHPシリアライズ",
        description: "PHPシリアライズ形式とJSONの相互変換",
        icon: "🐘",
      },
      {
        path: "/minify",
        label: "コード圧縮",
        description: "HTML/CSS/JavaScriptのコード圧縮",
        icon: "⬇️",
      },
      {
        path: "/timestamp",
        label: "タイムスタンプ変換",
        description: "Unixタイムスタンプと日時の相互変換",
        icon: "⏱️",
      },
      {
        path: "/duration",
        label: "時間計算・変換",
        description:
          "秒・HH:MM:SS・人間が読めるフォーマット間を相互変換。2つの時間の加算・減算、24fps/30fps/60fps等のフレームレート変換、各単位（日・時・分・秒・ミリ秒）への変換に対応。",
        icon: "⏳",
      },
      {
        path: "/unit-converter",
        label: "単位変換",
        description: "長さ・重さ・温度など各種単位の相互変換",
        icon: "📐",
      },
      {
        path: "/css-unit",
        label: "CSS単位変換",
        description:
          "px・rem・em・vw・vh・%・pt・cm・mm・in などの CSS 単位をリアルタイムで相互変換。ベースフォントサイズやビューポートサイズも設定可能。",
        icon: "📏",
      },
      {
        path: "/css-shorthand",
        label: "CSSショートハンド展開",
        description:
          "CSS のショートハンドプロパティ（margin・padding・border-radius・flex・gap・place-content など）を個別プロパティに展開、またはロングハンドからショートハンドに圧縮するツール。CSS デバッグや仕様確認に。",
        icon: "⇄",
      },
      {
        path: "/css-clamp",
        label: "CSS Fluid/Clamp 計算機",
        description:
          "ビューポート幅に応じてリニア補間する CSS clamp() 値を計算。フォントサイズ・パディングなどの Fluid スタイルを即時プレビューで生成します。",
        icon: "📐",
      },
      {
        path: "/audio-converter",
        label: "オーディオ変換",
        description: "音声ファイルの形式変換（MP3/WAV/OGG等）",
        icon: "🎵",
      },
      {
        path: "/video-converter",
        label: "動画変換",
        description: "動画ファイルの形式変換（MP4/WebM等）",
        icon: "🎬",
      },
      {
        path: "/yaml-json",
        label: "YAML/JSON変換",
        description: "YAMLとJSONの相互変換ツール。設定ファイルの変換に便利。",
        icon: "🔄",
      },
      {
        path: "/yaml-toml",
        label: "YAML↔TOML変換",
        description: "YAML と TOML を直接相互変換。Cargo.toml・pyproject.toml の変換に。",
        icon: "🔃",
      },
      {
        path: "/yaml-formatter",
        label: "YAMLフォーマッター",
        description:
          "YAMLデータの整形・圧縮・構文検証ツール。インデント幅・キーソートを選択してYAMLを整形。Kubernetes、Docker Compose、GitHub Actions設定ファイルの確認に。",
        icon: "📋",
      },
      {
        path: "/toml-json",
        label: "TOML/JSON変換",
        description: "TOMLとJSONの相互変換ツール。Cargo.toml、pyproject.toml等の変換に便利。",
        icon: "🔄",
      },
      {
        path: "/toml-formatter",
        label: "TOMLフォーマッター",
        description:
          "TOMLデータの整形・圧縮・構文検証ツール。Cargo.toml、pyproject.toml、wrangler.tomlなどの設定ファイルの確認・整形に。",
        icon: "📋",
      },
      {
        path: "/css-formatter",
        label: "CSSフォーマッター",
        description:
          "CSSコードの整形・圧縮・構文検証ツール。インデント幅・プロパティソートを設定してCSSを整形。@media・@keyframes等のネストしたルールにも対応。",
        icon: "🎨",
      },
      {
        path: "/xml",
        label: "XMLフォーマッター",
        description: "XMLデータの整形・圧縮・構文検証ツール",
        icon: "📋",
      },
      {
        path: "/xpath",
        label: "XPath評価器",
        description:
          "XML ドキュメントに対して XPath 1.0 式をブラウザ内で評価するツール。ノードセット・文字列・数値・真偽値の結果表示に対応。サンプル XML と XPath 式付き。",
        icon: "🔍",
      },
      {
        path: "/xml-json",
        label: "XML/JSON変換",
        description:
          "XMLとJSONの相互変換ツール。XML→JSON変換（属性・テキスト・ネスト構造対応）とJSON→XML変換が可能。",
        icon: "🔄",
      },
      {
        path: "/sql",
        label: "SQLフォーマッター",
        description: "SQLクエリの整形・圧縮・構文検証ツール",
        icon: "🗄️",
      },
      {
        path: "/graphql",
        label: "GraphQL フォーマッター",
        description:
          "GraphQL クエリ・スキーマの整形・圧縮・構文検証ツール。query/mutation/subscription/type 定義をブラウザ上で整形。",
        icon: "◈",
      },
      {
        path: "/timezone",
        label: "タイムゾーン変換",
        description: "世界各地のタイムゾーン間で日時を変換",
        icon: "🌍",
      },
      {
        path: "/world-clock",
        label: "ワールドクロック",
        description:
          "世界の主要都市の現在時刻をリアルタイム表示するワールドクロック。東京・ニューヨーク・ロンドンなど25都市対応。1秒ごとに自動更新、12h/24h切替、都市のカスタマイズが可能。",
        icon: "🕐",
      },
      {
        path: "/text-encrypt",
        label: "テキスト暗号化",
        description:
          "ROT13・Caesar暗号・Vigenère暗号・Atbash暗号でテキストを暗号化・復号化するツール",
        icon: "🔒",
      },
      {
        path: "/morse-code",
        label: "Morse Code変換",
        description:
          "テキストとモールス符号（Morse Code）を相互変換するツール。アルファベット・数字・記号対応",
        icon: "📡",
      },
      {
        path: "/nato-alphabet",
        label: "NATOフォネティックアルファベット",
        description:
          "テキストをNATO/ICAO標準のフォネティックアルファベット（Alpha, Bravo, Charlie...）に変換するツール。パスワードや識別子を電話で正確に伝えるのに便利。A-Z・0-9対応。",
        icon: "🔤",
      },
      {
        path: "/braille",
        label: "点字（Braille）変換",
        description:
          "テキストをGrade 1 点字（Braille）のUnicode文字に変換するツール。英字・数字・記号に対応。大文字インジケーター・数字インジケーター付き出力。",
        icon: "⠿",
      },
      {
        path: "/number-base",
        label: "数値進数変換",
        description: "2進数・8進数・10進数・16進数の相互変換ツール。任意の欄入力で他が自動更新",
        icon: "🔢",
      },
      {
        path: "/roman-numerals",
        label: "ローマ数字変換",
        description:
          "アラビア数字とローマ数字を相互変換するツール。1〜3999の整数に対応。IV・IX・XL・XC・CD・CMなどの減算記法も正しく処理します。",
        icon: "Ⅻ",
      },
      {
        path: "/wareki",
        label: "和暦・西暦変換",
        description:
          "西暦と和暦（元号）を相互変換するツール。令和・平成・昭和・大正・明治に対応。元号の遷移年（2019・1989・1926・1912年）も正しく処理します。",
        icon: "🗾",
      },
      {
        path: "/number-words",
        label: "数値テキスト変換",
        description:
          "整数を英語・日本語のテキストに変換するツール。英語基数詞（one hundred twenty-three）・序数詞（twenty-first）・日本語漢数字（百二十三）・読み仮名（ひゃくにじゅうさん）に対応。請求書・法的文書・ローカライズ確認に便利。",
        icon: "🔢",
      },
      {
        path: "/daiji",
        label: "大字変換",
        description:
          "アラビア数字と大字（壱・弐・参など）を相互変換するツール。小切手・契約書・法的文書などで使用される改ざん防止用の漢数字に対応。壱萬弐仟参佰肆拾伍など日本の公式文書で必要な表記を生成できます。",
        icon: "壱",
      },
      {
        path: "/fraction",
        label: "分数変換",
        description:
          "小数と分数を相互変換するツール。0.75→3/4、0.333…→1/3のような変換に対応。最大公約数による自動約分、帯分数（1 と 1/2）表示も可能。",
        icon: "½",
      },
      {
        path: "/csv-sql",
        label: "CSV→SQL変換",
        description:
          "CSVデータからSQL INSERT文を自動生成するツール。MySQL・PostgreSQL・SQLite・SQL Serverに対応。バッチINSERT、NULL変換、数値・ブーリアン自動検出に対応。",
        icon: "🗄️",
      },
      {
        path: "/csv-json",
        label: "CSV/JSON変換",
        description:
          "CSVとJSONの相互変換ツール。ヘッダー行の有無や区切り文字（カンマ・タブ・セミコロン）選択可",
        icon: "📊",
      },
      {
        path: "/math-eval",
        label: "数式評価ツール",
        description:
          "数式をリアルタイムで評価するツール。四則演算・三角関数・対数・べき乗など多彩な演算に対応",
        icon: "🧮",
      },
      {
        path: "/function-plotter",
        label: "関数グラフ描画",
        description:
          "数学関数のグラフをブラウザ内でリアルタイム描画するツール。sin・cos・tan・log・exp・x^2など最大4関数を重ね描き。ズーム・パン操作、PNG出力に対応。",
        icon: "📈",
      },
      {
        path: "/matrix",
        label: "行列計算ツール",
        description:
          "行列の加算・減算・乗算・転置・逆行列・行列式・トレース・ランクをブラウザ内で計算。最大 6×6 の行列に対応。数学・線形代数・機械学習・競技プログラミングに便利。",
        icon: "⊞",
      },
      {
        path: "/lissajous",
        label: "リサジュー図形ビジュアライザー",
        description:
          "リサジュー図形（Lissajous Figure）をリアルタイムでアニメーション描画するツール。周波数比・位相差を自由に変更して美しい曲線を探索できます。",
        icon: "〰️",
      },
      {
        path: "/statistics",
        label: "統計計算ツール",
        description:
          "数値データの記述統計を計算するツール。平均・中央値・最頻値・分散・標準偏差・四分位数・歪度・尖度・幾何平均・調和平均・度数分布をブラウザ内で即座に算出。",
        icon: "📊",
      },
      {
        path: "/combinatorics",
        label: "順列・組合せ計算",
        description:
          "順列 nPr・組合せ nCr・階乗 n! をブラウザ内で計算するツール。計算手順のステップ表示、パスカルの三角形の可視化に対応。確率・統計・競技プログラミングに便利。",
        icon: "₍ₙ₎Cᵣ",
      },
      {
        path: "/truth-table",
        label: "論理式真理値表",
        description:
          "ブール論理式から真理値表を生成するツール。AND・OR・NOT・XOR・NAND・NOR・XNOR に対応。A, B, C などの変数を使って式を入力すると全組み合わせの真偽値を一覧表示。CSV 出力対応。",
        icon: "⊨",
      },
      {
        path: "/bitwise",
        label: "ビット演算計算機",
        description:
          "AND・OR・XOR・NOT・シフト演算をビジュアルで確認できる計算機。2進数・8進数・10進数・16進数で入力可能。32ビットビット表示付き。",
        icon: "🔢",
      },
      {
        path: "/ieee754",
        label: "IEEE 754 浮動小数点数",
        description:
          "IEEE 754浮動小数点数の内部表現をビット単位で可視化するツール。float32（単精度）・float64（倍精度）に対応。符号・指数部・仮数部を対話的に操作。NaN・±Infinity・非正規化数の仕組みも確認できる。",
        icon: "🔣",
      },
      {
        path: "/percentage-calculator",
        label: "パーセンテージ計算機",
        description:
          "「XはYの何%か」「XのY%はいくら」「変化率」「増加・減少後の値」など、よく使うパーセンテージ計算をまとめたツール。割引・税込計算・達成率など日常の計算に便利。",
        icon: "%",
      },
      {
        path: "/loan-calculator",
        label: "ローン計算機",
        description:
          "住宅・車・教育などのローン返済額をシミュレーション。月々の返済額・総返済額・総利息を計算。元利均等返済・元金均等返済に対応した返済スケジュール表示付き。",
        icon: "🏦",
      },
      {
        path: "/hex-viewer",
        label: "Hex Viewer",
        description:
          "ファイルやテキストのバイナリデータを16進数・ASCII形式で表示するツール。バイトオフセット・カラーハイライト対応。",
        icon: "🔬",
      },
      {
        path: "/aspect-ratio",
        label: "アスペクト比計算機",
        description:
          "幅・高さからアスペクト比を計算。比から幅・高さを導出。16:9・4:3・1:1などよく使われる比率のプリセット付き。",
        icon: "📐",
      },
      {
        path: "/number-format",
        label: "数値フォーマット",
        description:
          "Intl.NumberFormat を使用して数値を各ロケール・通貨・パーセント形式でフォーマット。10言語のロケール別フォーマット比較も可能。",
        icon: "🔢",
      },
      {
        path: "/date-calc",
        label: "日付計算",
        description:
          "2つの日付の差を計算・日付の加算/減算・日付情報の確認ができる日付計算ツール。ISO週番号・曜日・年の何日目かなどを表示。",
        icon: "📅",
      },
      {
        path: "/encoding",
        label: "文字コード変換",
        description:
          "テキストをUTF-8・Shift_JIS・EUC-JP・ISO-2022-JPなど複数の文字コードに変換し、16進数バイト列を表示。Hexからテキストへの逆変換・自動文字コード検出にも対応。",
        icon: "🔤",
      },
      {
        path: "/encode-chain",
        label: "エンコードチェーン",
        description:
          "テキストに複数のエンコード・変換を連鎖して適用するツール。Base64・URLエンコード・Hex変換・HTMLエスケープなどを組み合わせ、各ステップの結果を可視化。",
        icon: "⛓️",
      },
      {
        path: "/quoted-printable",
        label: "Quoted-Printable",
        description:
          "RFC 2045 準拠の Quoted-Printable エンコード・デコード。メール本文の MIME エンコードで使われる QP 形式に変換。日本語などのマルチバイト文字を =XX 形式で表現。",
        icon: "✉️",
      },
      {
        path: "/ini-parser",
        label: "INIファイルパーサー",
        description:
          "INIファイルのパース・整形・JSON変換ツール。php.ini・.gitconfig・Windows設定ファイルなど各種INI形式に対応。セクション・キー・値をビジュアルで確認。",
        icon: "⚙️",
      },
      {
        path: "/punycode",
        label: "Punycode変換 (IDN)",
        description:
          "国際化ドメイン名（IDN）のPunycode変換ツール。日本語・中国語・アラビア語などのUnicodeドメインをxn--形式のASCII Compatible Encoding（ACE）に変換。RFC 3492準拠。",
        icon: "🌐",
      },
      {
        path: "/zenkaku",
        label: "全角/半角変換",
        description:
          "全角と半角文字の相互変換ツール。英数字・記号・カタカナ・スペースを選択して変換。日本語テキスト処理・フォームデータの正規化に。",
        icon: "Ａ",
      },
      {
        path: "/kana-convert",
        label: "仮名・ローマ字変換",
        description:
          "ひらがな・カタカナ・ローマ字を相互変換するツール。ヘボン式ローマ字対応。促音・拗音・撥音（ん）の正確な変換をサポート。",
        icon: "あ",
      },
      {
        path: "/line-ending",
        label: "改行コード変換",
        description:
          "テキストの改行コード（CRLF・LF・CR）を検出して相互変換するツール。Windows（CRLF）・Unix/Linux（LF）・旧Mac（CR）形式に対応。",
        icon: "↵",
      },
      {
        path: "/gzip",
        label: "GZip/Deflate 圧縮・解凍",
        description:
          "テキストを gzip・deflate・deflate-raw 形式でブラウザ内圧縮・解凍するツール。圧縮率・サイズ比較表示。Base64エンコードされた圧縮データの解凍にも対応。データは外部送信なし。",
        icon: "🗜️",
      },
      {
        path: "/geometry",
        label: "幾何計算機",
        description:
          "円・三角形・長方形などの2D図形の面積、球・円柱・直方体などの3D図形の体積・表面積を計算するツール。",
        icon: "📐",
      },
    ],
  },
  {
    name: "生成",
    icon: "✦",
    items: [
      {
        path: "/sequences",
        label: "数列ジェネレーター",
        description:
          "フィボナッチ・リュカ・素数・三角数・平方数・立方数・2の冪乗・カタラン数・パドヴァン・等差・等比・コラッツなど12種類の数列を生成。CSV・JSON・改行・タグ形式で出力可能。",
        icon: "∿",
      },
      {
        path: "/html-playground",
        label: "HTML/CSS/JS プレイグラウンド",
        description:
          "HTML・CSS・JavaScript をブラウザ内で編集してリアルタイムにプレビューできるライブエディター。サンドボックス環境で安全に動作。スタンドアロン HTML としてエクスポート可能。",
        icon: "▶",
      },
      {
        path: "/passphrase",
        label: "パスフレーズ生成",
        description:
          "英単語を組み合わせた記憶しやすいパスフレーズを生成するツール。単語数・区切り文字・大文字化・数字/記号追加を設定可能。エントロピー計算とクラック時間推定付き。",
        icon: "🗝️",
      },
      {
        path: "/uuid",
        label: "UUID生成",
        description: "UUID v4のランダム生成",
        icon: "🔑",
      },
      {
        path: "/uuid-inspector",
        label: "UUID解析",
        description:
          "UUID の構造を解析。バージョン (v1〜v8) 判定・タイムスタンプ抽出・バイナリ表示。",
        icon: "🔍",
      },
      {
        path: "/ulid",
        label: "ULID生成",
        description:
          "辞書順ソート可能な識別子 ULID（Universally Unique Lexicographically Sortable Identifier）を生成。タイムスタンプ埋め込みで時系列順に並ぶ UUID 代替。パーサー機能付き。",
        icon: "🔢",
      },
      {
        path: "/password-generator",
        label: "パスワード生成",
        description: "安全なランダムパスワードの生成",
        icon: "🔐",
      },
      {
        path: "/dummy-image",
        label: "ダミー画像",
        description: "開発用プレースホルダー画像の生成",
        icon: "🎨",
      },
      {
        path: "/dummy-audio",
        label: "ダミー音声",
        description: "開発用テスト音声ファイルの生成",
        icon: "🔊",
      },
      {
        path: "/favicon-generator",
        label: "Favicon生成",
        description: "サイト用Faviconアイコンの生成",
        icon: "⭐",
      },
      {
        path: "/qr-code",
        label: "QRコード",
        description: "テキスト・URLからQRコードを生成",
        icon: "📱",
      },
      {
        path: "/barcode",
        label: "バーコード生成",
        description: "各種バーコード形式を生成・ダウンロード",
        icon: "▮▮▮",
      },
      {
        path: "/lorem-ipsum",
        label: "Lorem Ipsum",
        description: "ダミーテキストの生成（段落・単語数・文数対応）",
        icon: "📝",
      },
      {
        path: "/gitignore",
        label: "Gitignore生成",
        description:
          ".gitignoreファイルを自動生成。言語・フレームワーク・IDEを選択してカスタマイズ。",
        icon: "🚫",
      },
      {
        path: "/editorconfig",
        label: "EditorConfigジェネレーター",
        description:
          "インデント・改行コード・文字エンコードを設定して .editorconfig ファイルを自動生成。Python・Go・Webフロントエンドなどのプリセットとファイルタイプ別オーバーライドに対応。",
        icon: "⚙️",
      },
      {
        path: "/gitattributes",
        label: ".gitattributes生成",
        description:
          "改行コード正規化・バイナリ設定・Git LFS・GitHub Linguist ルールを選択して .gitattributes ファイルを自動生成。言語・フレームワーク別のプリセットに対応。",
        icon: "📝",
      },
      {
        path: "/tsconfig-builder",
        label: "tsconfig.jsonビルダー",
        description:
          "TypeScript コンパイラオプションをカテゴリ別に選択して tsconfig.json を自動生成。Node.js・Vite・Next.js・ライブラリなどのプリセット対応。strict・module・target・jsx など主要オプションを視覚的に設定。",
        icon: "🔧",
      },
      {
        path: "/prettier-config-builder",
        label: ".prettierrcビルダー",
        description:
          "Prettier のオプションを選択して .prettierrc を自動生成。printWidth・semi・singleQuote・trailingComma など主要オプションをカテゴリ別に設定。React・Vue・TypeScript 向けプリセット対応。デフォルト値と異なる設定のみ出力。",
        icon: "✨",
      },
      {
        path: "/eslint-config-builder",
        label: "ESLint Config ビルダー",
        description:
          "ESLint のオプションを選択して eslint.config.js または .eslintrc.json を自動生成。TypeScript・React・コード品質ルールをプリセットから素早く設定。ESLint 9 のフラット設定形式対応。",
        icon: "🔍",
      },
      {
        path: "/package-json",
        label: "package.json ビルダー",
        description:
          "npm の package.json を GUI で生成するツール。基本情報・scripts・keywords・エントリポイントをフォームで設定。Node.js CLI・Webアプリ・ライブラリ向けプリセット付き。",
        icon: "📦",
      },
      {
        path: "/robots-txt",
        label: "robots.txtジェネレーター",
        description:
          "robots.txtファイルをGUIで作成。User-agent別のAllow/Disallowルール設定、Crawl-delay、Sitemapを視覚的に編集してコードを即座に生成。",
        icon: "🤖",
      },
      {
        path: "/seo-meta",
        label: "SEOメタタグ生成",
        description:
          "SEO・OGP・Twitterカードのメタタグを一括生成するツール。基本SEO（title/description/keywords/canonical）・Open Graph・Twitter Cardタグを設定し、Google検索結果プレビューとSNSシェアカードプレビューで確認しながらHTMLコードを出力。",
        icon: "🔍",
      },
      {
        path: "/random-data",
        label: "ランダムデータ生成",
        description:
          "氏名・メール・電話番号・住所・UUID・IPアドレスなど様々な形式のテストデータを一括生成。JSON/CSV/TSV出力対応。",
        icon: "🎲",
      },
      {
        path: "/json-schema",
        label: "JSONスキーマ生成",
        description: "JSONデータからJSON Schema (draft-07) を自動生成するツール",
        icon: "📋",
      },
      {
        path: "/json-schema-validator",
        label: "JSON Schema バリデーター",
        description:
          "JSONデータをJSON Schema (draft-07) に対してバリデーションするツール。type・required・pattern・enum・allOf/anyOf/oneOf など主要なキーワードに対応。エラー箇所をパスで表示。",
        icon: "✅",
      },
      {
        path: "/json-to-ts",
        label: "JSON→TS型変換",
        description: "JSONデータからTypeScriptのinterface/type定義を自動生成するツール",
        icon: "🔷",
      },
      {
        path: "/json-to-zod",
        label: "JSON→Zodスキーマ生成",
        description: "JSONデータからZodスキーマを自動生成するツール。optional・nullable対応。",
        icon: "🛡️",
      },
      {
        path: "/json-to-graphql",
        label: "JSON→GraphQLスキーマ生成",
        description:
          "JSONデータからGraphQLスキーマ（SDL形式）を自動生成するツール。type/interface・Non-Null対応。",
        icon: "◈",
      },
      {
        path: "/json-to-sql",
        label: "JSON→SQL CREATE TABLE生成",
        description:
          "JSONデータからSQL CREATE TABLE文を自動生成するツール。PostgreSQL・MySQL・SQLiteに対応。",
        icon: "🗄️",
      },
      {
        path: "/sql-to-ts",
        label: "SQL→TypeScript型変換",
        description:
          "SQL CREATE TABLE文からTypeScriptのinterface/type定義を自動生成するツール。PostgreSQL・MySQL・SQLite対応。",
        icon: "🔷",
      },
      {
        path: "/json-compare",
        label: "JSON比較",
        description: "2つのJSONを並べて比較し、追加・削除・変更されたキーを差分表示するツール",
        icon: "⇆",
      },
      {
        path: "/mermaid",
        label: "Mermaidプレビュー",
        description:
          "Mermaid記法のダイアグラムをリアルタイムでプレビューできるツール。フローチャート、シーケンス図など多数対応",
        icon: "🔀",
      },
      {
        path: "/github-badge",
        label: "GitHubバッジ生成",
        description:
          "shields.io を使った GitHub README バッジを簡単に生成。ラベル・メッセージ・色・スタイル・ロゴをカスタマイズしてMarkdown/HTML/URLをワンクリックコピー。",
        icon: "🏷️",
      },
      {
        path: "/jwt-generator",
        label: "JWT生成",
        description: "HS256/HS384/HS512アルゴリズムでJWTトークンをブラウザ内で生成するツール",
        icon: "🔐",
      },
      {
        path: "/ascii-art",
        label: "ASCIIアート生成",
        description:
          "テキストをASCIIアートに変換するツール。Standard、Block、Banner等の5種類フォント対応",
        icon: "🎨",
      },
      {
        path: "/slug",
        label: "スラッグ生成",
        description:
          "テキストをURLフレンドリーなスラッグに変換するツール。アクセント文字対応、区切り文字・大文字小文字設定可",
        icon: "🔗",
      },
      {
        path: "/cron",
        label: "Cron式ビルダー",
        description:
          "Cron式を視覚的に構築・編集できるツール。各フィールドをGUIで設定してCron式を生成",
        icon: "⏰",
      },
      {
        path: "/typography-scale",
        label: "タイポグラフィスケール生成",
        description:
          "モジュラースケール理論に基づきCSSタイポグラフィスケールを生成。CSS変数・SCSS・JSON・Tailwind形式で出力。Golden Ratio等のプリセット比率対応。",
        icon: "🔡",
      },
      {
        path: "/nano-id",
        label: "Nano ID 生成",
        description:
          "URL フレンドリーな短い一意識別子 Nano ID を生成するツール。サイズ・アルファベットをカスタマイズ可能。UUID より短く暗号論的に安全な識別子を生成。",
        icon: "⚡",
      },
      {
        path: "/short-code",
        label: "ショートコード生成",
        description:
          "チケット番号・バウチャーコード・ライセンスキー・PIN など、人間が読み書きしやすい短いコードを生成するツール。視覚的に紛らわしい文字の除外・セグメント形式のカスタマイズに対応。",
        icon: "🎫",
      },
    ],
  },
  {
    name: "画像",
    icon: "🎨",
    items: [
      {
        path: "/image-compress",
        label: "画像圧縮",
        description: "JPEG/PNG/WebPの画像サイズ圧縮",
        icon: "🗜️",
      },
      {
        path: "/image-base64",
        label: "Base64変換",
        description: "画像ファイルをBase64文字列に変換",
        icon: "🖼️",
      },
      {
        path: "/image-resize",
        label: "画像リサイズ",
        description: "画像の解像度・サイズ変更",
        icon: "📏",
      },
      {
        path: "/image-crop",
        label: "画像トリミング",
        description: "画像の指定範囲を切り抜き",
        icon: "✂️",
      },
      {
        path: "/exif-viewer",
        label: "EXIFビューワー",
        description:
          "JPEG画像のEXIFメタデータ（撮影日時・カメラ情報・GPS位置情報など）を表示。プライバシー保護のためEXIFデータを除去してダウンロード可能。",
        icon: "🔎",
      },
      {
        path: "/transparent-image",
        label: "透過画像",
        description: "画像の背景を透過処理",
        icon: "🔍",
      },
      {
        path: "/background-removal",
        label: "AI背景除去",
        description: "AIで画像の背景を自動除去（人物・商品・動物対応）",
        icon: "✂️",
      },
      {
        path: "/css-gradient",
        label: "CSSグラジェント生成",
        description:
          "linear/radial/conicグラジェントをビジュアルエディターで作成。カラーストップを編集してCSSコードを即座に生成。",
        icon: "🌈",
      },
      {
        path: "/css-animation",
        label: "CSSアニメーション生成",
        description:
          "keyframesアニメーションをビジュアルエディターで作成。duration・easing・delay・繰り返し設定を調整してCSSコードを即座に生成。",
        icon: "✨",
      },
      {
        path: "/css-background-pattern",
        label: "CSS背景パターン生成",
        description:
          "CSSの繰り返しグラジェントを使った背景パターン生成ツール。縞模様・水玉・グリッド・市松・斜め縞・ジグザグを色・サイズ・角度で細かく調整できます。",
        icon: "🔲",
      },
      {
        path: "/css-cubic-bezier",
        label: "CSS Cubic Bezier ジェネレーター",
        description:
          "CSS cubic-bezier() タイミング関数をビジュアルエディターで作成。制御点をドラッグして調整し、transition・animationに使えるCSSコードを即座に生成。linear/ease/bounce等のプリセット多数。",
        icon: "〜",
      },
      {
        path: "/css-flexbox",
        label: "CSSフレックスボックス",
        description:
          "flexbox のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。justify-content・align-items・flex-wrap などを直感的に試せる。",
        icon: "⬛",
      },
      {
        path: "/css-grid",
        label: "CSS Gridジェネレーター",
        description:
          "CSS Grid のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。grid-template-columns・gap・justify-items などを直感的に試せる。",
        icon: "⊞",
      },
      {
        path: "/css-box-shadow",
        label: "CSS Box Shadowジェネレーター",
        description:
          "box-shadowをビジュアルエディターで作成。複数レイヤー・inset・不透明度・プリセット対応。ニューモーフィズムやグロウ効果も直感的に試せる。",
        icon: "🌑",
      },
      {
        path: "/css-text-shadow",
        label: "CSS Text Shadowジェネレーター",
        description:
          "text-shadowをビジュアルエディターで作成。複数レイヤー・不透明度・プリセット対応。ネオン・エンボス・アウトラインなど多彩なテキスト効果を直感的に試せる。",
        icon: "✦",
      },
      {
        path: "/css-border-radius",
        label: "CSS Border Radiusジェネレーター",
        description:
          "border-radiusをビジュアルエディターで作成。4コーナー独立制御・楕円モード・プリセット対応。円形・ピル型・リーフなど多彩な形状を直感的に試せる。",
        icon: "⬜",
      },
      {
        path: "/css-filter",
        label: "CSS Filterジェネレーター",
        description:
          "CSS filterプロパティをビジュアルエディターで作成。blur・brightness・contrast・grayscale・hue-rotate・invert・saturate・sepiaをスライダーで調整。プリセット対応。",
        icon: "🔮",
      },
      {
        path: "/css-clip-path",
        label: "CSS Clip-pathジェネレーター",
        description:
          "CSS clip-pathプロパティをビジュアルエディターで作成。inset・circle・ellipse・polygonを操作してCSSコードを生成。三角形・星形など多彩なプリセット形状も利用可能。",
        icon: "✂️",
      },
      {
        path: "/css-transform",
        label: "CSS Transformジェネレーター",
        description:
          "CSS transformプロパティをビジュアルエディターで作成。translate・rotate・scale・skew・perspectiveをスライダーで調整してCSSコードを即座に生成。",
        icon: "🔄",
      },
      {
        path: "/css-container-query",
        label: "CSS Container Query ビルダー",
        description:
          "CSS Container Queries をビジュアルに構築するツール。container-type・container-name の設定、min-width・max-width・range・aspect-ratio 条件の組み合わせ、ライブプレビューつきで CSS を即座に生成。",
        icon: "📦",
      },
      {
        path: "/css-media-query",
        label: "CSSメディアクエリビルダー",
        description:
          "メディアクエリを視覚的に構築。ブレイクポイント、デバイス特性、カラースキームなどの条件をGUIで設定し、CSS・SCSS・JSON形式でコードを生成。ライブプレビューつき。",
        icon: "📐",
      },
      {
        path: "/css-scroll-snap",
        label: "CSS Scroll Snapジェネレーター",
        description:
          "CSS Scroll Snap のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。scroll-snap-type・scroll-snap-align・scroll-snap-stop などを直感的に試せるオンラインツール。ライブプレビューつき。",
        icon: "🎯",
      },
      {
        path: "/css-logical",
        label: "CSS 論理プロパティ変換",
        description:
          "物理的な CSS プロパティ（margin-left, padding-top, width など）を論理プロパティ（margin-inline-start, padding-block-start, inline-size など）に自動変換。RTL 対応・国際化対応のコードベース移行をサポート。",
        icon: "↔",
      },
      {
        path: "/image-to-gif",
        label: "画像→GIF変換",
        description: "複数画像からアニメーションGIFを作成",
        icon: "🎞️",
      },
      {
        path: "/emoji-converter",
        label: "絵文字変換",
        description: "画像を絵文字サイズに変換",
        icon: "😊",
      },
      {
        path: "/discord-emoji",
        label: "Discord絵文字",
        description: "画像をDiscord絵文字サイズ（128x128px）に変換",
        icon: "💬",
      },
      {
        path: "/discord-sticker",
        label: "Discordスタンプ",
        description: "画像をDiscordスタンプサイズ（320x320px）に変換",
        icon: "🏷️",
      },
      {
        path: "/svg-optimizer",
        label: "SVG最適化",
        description:
          "SVGファイルの最適化・圧縮・整形ツール。メタデータ削除、数値精度調整、空白圧縮に対応",
        icon: "✨",
      },
    ],
  },
  {
    name: "カラー",
    icon: "🎨",
    items: [
      {
        path: "/color-picker",
        label: "カラーピッカー",
        description: "色を視覚的に選択し、HEX・RGB・HSL形式でコピーできるカラーピッカー。",
        icon: "🖌️",
      },
      {
        path: "/color-converter",
        label: "カラーフォーマット変換",
        description:
          "HEX・RGB・HSL・HSV・CMYK・OKLCHなど6種類のカラーフォーマット間をリアルタイムに相互変換。Webデザイン・印刷・CSS設計に活用できるカラーコンバーター。",
        icon: "🎨",
      },
      {
        path: "/color-palette",
        label: "カラーパレット生成",
        description: "補色・三色・類似色など配色理論に基づいたカラーパレットを自動生成するツール。",
        icon: "🖼️",
      },
      {
        path: "/color-harmony",
        label: "カラーハーモニー",
        description:
          "ベースカラーから補色・類似色・トライアド・分割補色・テトラッドを一覧生成するカラーハーモニー配色ツール。",
        icon: "🌈",
      },
      {
        path: "/color-token",
        label: "カラートークン生成",
        description:
          "ベースカラーからデザインシステム用のシェードスケール（50〜950）を自動生成するツール。CSS変数・SCSS・Tailwind設定・JSON形式で出力。",
        icon: "🏷️",
      },
      {
        path: "/color-contrast",
        label: "カラーコントラストチェッカー",
        description:
          "WCAG 2.1準拠のカラーコントラストチェッカー。前景色と背景色のコントラスト比を計算し、AA・AAAの適合性を判定します。",
        icon: "⚖️",
      },
      {
        path: "/color-blind",
        label: "色覚シミュレーター",
        description:
          "色覚異常シミュレーター。Deuteranopia・Protanopia・Tritanopiaなど6種類の色覚タイプで画像がどのように見えるか確認できるアクセシビリティツール。",
        icon: "👁️",
      },
      {
        path: "/color-mix",
        label: "CSS color-mix() プレイグラウンド",
        description:
          "CSS color-mix() 関数をインタラクティブに試せるツール。2色を選んで色空間・割合を調整し、混合結果をリアルタイムプレビュー。CSS コードを即座に生成。",
        icon: "🧪",
      },
      {
        path: "/color-name",
        label: "色名検索",
        description:
          "CSS名前付き色を検索するツール。HEXやRGBカラーを入力すると最も近いCSS色名をΔE色差順に表示。140色のCSS名前付き色を完全収録。",
        icon: "🔖",
      },
      {
        path: "/color-extractor",
        label: "画像カラー抽出",
        description: "画像から主要な色（カラーパレット）を抽出するツール。",
        icon: "💧",
      },
      {
        path: "/color-temperature",
        label: "色温度変換",
        description:
          "色温度（ケルビン）をRGB・HEXカラーに変換するツール。ろうそく・白熱灯・昼光色などのプリセットで照明や写真の色味を視覚的に確認できます。",
        icon: "🌡️",
      },
      {
        path: "/tailwind-colors",
        label: "Tailwind CSS カラー",
        description:
          "Tailwind CSS v3の全カラーパレットを一覧表示。カラー名・HEX値で検索・フィルタリングし、任意のHEXコードに最も近いTailwindカラーを検索。クリックでクラス名をコピー。",
        icon: "🎨",
      },
    ],
  },
  {
    name: "検索",
    icon: "🔍",
    items: [
      {
        path: "/whois",
        label: "WHOIS",
        description: "ドメインの登録情報を検索",
        icon: "🌐",
      },
      {
        path: "/dns-lookup",
        label: "DNSレコード",
        description: "ドメインのDNSレコードを確認",
        icon: "📡",
      },
      {
        path: "/ip-geolocation",
        label: "IP検索",
        description: "IPアドレスから地理情報を取得",
        icon: "📍",
      },
      {
        path: "/global-ip",
        label: "グローバルIP",
        description: "アクセス元のグローバルIPアドレスを表示",
        icon: "🌍",
      },
      {
        path: "/ogp",
        label: "OGPチェック",
        description: "URLのOpen Graph Protocol情報を確認",
        icon: "🔗",
      },
      {
        path: "/http-status",
        label: "HTTPステータスコード",
        description:
          "HTTPステータスコード（1xx〜5xx）のリファレンス。カテゴリ別フィルタリングとキーワード検索でコードを調べられる",
        icon: "ℹ️",
      },
      {
        path: "/http-headers",
        label: "HTTPヘッダーリファレンス",
        description:
          "リクエスト・レスポンスHTTPヘッダーの一覧リファレンス。用途・説明・使用例をカテゴリ別に検索できる",
        icon: "📋",
      },
      {
        path: "/mime-types",
        label: "MIMEタイプリファレンス",
        description:
          "MIMEタイプ（Content-Type）の一覧リファレンス。拡張子・カテゴリ別に検索し、ファイルタイプに対応するMIMEタイプを確認できる",
        icon: "📄",
      },
    ],
  },
  {
    name: "テキスト",
    icon: "📝",
    items: [
      {
        path: "/char-count",
        label: "文字数カウント",
        description: "テキストの文字数・単語数・行数を計算",
        icon: "📝",
      },
      {
        path: "/char-frequency",
        label: "文字頻度分析",
        description:
          "テキスト中の文字の出現頻度を分析するツール。各文字の出現回数・割合をビジュアルバーで表示。大文字小文字・スペース・英数字のみなどフィルター対応。CSV出力可能。",
        icon: "📊",
      },
      {
        path: "/word-frequency",
        label: "単語頻度分析",
        description:
          "テキスト中の単語の出現頻度を分析するツール。各単語の出現回数・割合をビジュアルバーで表示。大文字小文字・句読点・ストップワードのフィルター対応。CSV出力可能。",
        icon: "📈",
      },
      {
        path: "/text-sort",
        label: "ソート/重複削除",
        description: "テキストの行ソートと重複行削除",
        icon: "📋",
      },
      {
        path: "/text-line",
        label: "テキスト行操作",
        description:
          "トリム・空行削除・行番号付加・プレフィックス/サフィックス追加・逆順・シャッフル・フィルタリングなどのテキスト行操作ツール",
        icon: "📄",
      },
      {
        path: "/diff",
        label: "テキスト差分",
        description: "2つのテキストの差分を色分け表示",
        icon: "↔️",
      },
      {
        path: "/user-agent",
        label: "User-Agentパーサー",
        description: "User-Agent文字列を解析してブラウザ・OS・デバイス情報を表示",
        icon: "🔍",
      },
      {
        path: "/markdown-table",
        label: "Markdownテーブル生成",
        description:
          "CSVやテキストデータからMarkdown形式のテーブルを生成。行・列の追加削除や整列方向の設定が可能",
        icon: "📊",
      },
      {
        path: "/markdown-preview",
        label: "Markdownプレビュー",
        description:
          "Markdownをリアルタイムでプレビューできるツール。見出し、リスト、コードブロック、テーブル等対応",
        icon: "📝",
      },
      {
        path: "/text-case",
        label: "テキストケース変換",
        description:
          "テキストをcamelCase、PascalCase、snake_case等様々な命名規則に一括変換するツール",
        icon: "🔤",
      },
      {
        path: "/text-replace",
        label: "テキスト置換",
        description:
          "正規表現対応のテキスト検索・置換ツール。大文字小文字区別・全件/1件置換・複数行モードに対応。マッチ箇所をハイライト表示。",
        icon: "🔄",
      },
      {
        path: "/text-stats",
        label: "テキスト統計・分析",
        description:
          "テキストの詳細な統計情報（単語数・文章数・段落数・読書時間・頻出単語等）をリアルタイム分析",
        icon: "📈",
      },
      {
        path: "/string-similarity",
        label: "文字列類似度計算",
        description:
          "Levenshtein距離・Jaro-Winkler・コサイン類似度・Hamming距離で2つの文字列の類似度をリアルタイム計算。スペルチェック・ファジー検索・NLP用途に。",
        icon: "≈",
      },
      {
        path: "/readability",
        label: "可読性スコア分析",
        description:
          "テキストの可読性をスコア化するツール。英語向けに Flesch Reading Ease・Flesch-Kincaid Grade Level・Gunning Fog Index・SMOG Index を計算。日本語の漢字密度・平均文長にも対応。",
        icon: "📖",
      },
      {
        path: "/token-estimator",
        label: "LLMトークン推定",
        description:
          "テキストのLLMトークン数をリアルタイム推定するツール。GPT-4o・Claude 3.5 Sonnet・Gemini 1.5 Proなど主要モデルのトークン数とAPIコストを比較表示。日本語・英語・コードに対応。",
        icon: "🔢",
      },
      {
        path: "/zero-width",
        label: "ゼロ幅文字検出・除去",
        description:
          "テキストに含まれるゼロ幅スペース・ZWJ・BOM・方向制御文字などの不可視Unicode文字を検出し一括除去するツール。コピペテキストに混入した不可視文字の確認・クリーニングに。",
        icon: "🔍",
      },
      {
        path: "/text-binary",
        label: "テキスト ↔ バイナリ変換",
        description:
          "テキストを UTF-8 バイト列の2進数（01010101…）に変換、または2進数からテキストに逆変換するツール。日本語・絵文字を含む任意の Unicode 文字に対応。",
        icon: "🔢",
      },
      {
        path: "/caesar",
        label: "シーザー暗号・ROT13",
        description:
          "シーザー暗号（Caesar cipher）とROT13のエンコード・デコードツール。シフト量を自由に設定でき、全26パターンのブルートフォース解析にも対応。",
        icon: "🔤",
      },
      {
        path: "/vigenere",
        label: "ヴィジュネル暗号",
        description:
          "ヴィジュネル暗号（Vigenère cipher）のエンコード・デコードツール。キーワードを指定したポリアルファベット換字式暗号の変換に対応。",
        icon: "🔐",
      },
      {
        path: "/affine",
        label: "アフィン暗号",
        description:
          "アフィン暗号（Affine cipher）のエンコード・デコードツール。乗数 a と加数 b を自由に設定でき、ブルートフォース解析にも対応。シーザー暗号の一般化版。",
        icon: "🔏",
      },
      {
        path: "/rail-fence",
        label: "Rail Fence暗号（柵暗号）",
        description:
          "Rail Fence暗号（柵暗号）のエンコード・デコードツール。テキストをジグザグパターンで複数のレールに配置して暗号化。レール数を自由に設定でき、ジグザグパターンの可視化にも対応。",
        icon: "🚧",
      },
      {
        path: "/polybius",
        label: "ポリュビオス暗号",
        description:
          "ポリュビオス暗号（Polybius Square）のエンコード・デコードツール。5×5グリッドで各文字を座標ペア（数字2桁）に変換。カスタムキーワードによる方陣の並び替えにも対応。方陣の可視化付き。",
        icon: "🔢",
      },
      {
        path: "/tap-code",
        label: "タップコード",
        description:
          "タップコード（Tap Code）のエンコード・デコードツール。5×5グリッドで各文字を行・列のタップ数ペアで表現。ドット記法（. ..）・数字記法（1 2）・コンパクト記法（12）の3形式に対応。グリッド可視化付き。",
        icon: "🔔",
      },
      {
        path: "/scytale",
        label: "スキュタレー暗号",
        description:
          "スキュタレー暗号（Scytale cipher）のエンコード・デコードツール。古代スパルタの軍事暗号。円柱の直径（列数）を指定してテキストを転置暗号化。平文・暗号文グリッドの可視化付き。",
        icon: "📜",
      },
      {
        path: "/atbash",
        label: "アトバシュ暗号",
        description:
          "アトバシュ暗号（Atbash cipher）のエンコード・デコードツール。ヘブライ語起源の換字式暗号。アルファベットを逆順にマッピング（A↔Z, B↔Y）。自己逆関数のため暗号化・復号化が同じ操作。アルファベット対応表の可視化付き。",
        icon: "🔄",
      },
      {
        path: "/playfair",
        label: "プレイフェア暗号",
        description:
          "プレイフェア暗号（Playfair cipher）のエンコード・デコードツール。5×5キー方陣を使ったダイグラフ換字式暗号。キーワードを指定してテキストを2文字単位で暗号化。方陣の可視化・ダイグラフ分割の表示付き。",
        icon: "🔡",
      },
      {
        path: "/beaufort",
        label: "ボーフォート暗号",
        description:
          "ボーフォート暗号（Beaufort cipher）のエンコード・デコードツール。サー・フランシス・ボーフォート考案のポリアルファベット換字式暗号。ヴィジュネル暗号の変形で、暗号化と復号化が同じ操作（自己逆関数）。",
        icon: "⚓",
      },
      {
        path: "/adfgvx",
        label: "ADFGVX暗号",
        description:
          "ADFGVX暗号のエンコード・デコードツール。第一次世界大戦でドイツ軍が使用した2段階暗号。6×6ポリビウス方陣による換字（A-Z+0-9対応）と縦列転置を組み合わせた歴史的な野戦暗号。",
        icon: "🪖",
      },
      {
        path: "/columnar-transposition",
        label: "列転置暗号",
        description:
          "列転置暗号（Columnar Transposition Cipher）のエンコード・デコードツール。キーワードのアルファベット順に列を並び替える古典的転置暗号。グリッド可視化・パディング文字設定に対応。第一次・第二次世界大戦でも使用された歴史ある暗号。",
        icon: "📊",
      },
      {
        path: "/four-square",
        label: "四方格子暗号",
        description:
          "四方格子暗号（Four-Square Cipher）の暗号化・復号化ツール。4つの5×5ポリュビオス方陣を使ったダイグラフ換字式暗号。2つのキーワードで独立した方陣を構成し、プレイフェア暗号より高い安全性を実現。方陣の可視化付き。",
        icon: "🔲",
      },
    ],
  },
  {
    name: "検証",
    icon: "✓",
    items: [
      {
        path: "/regex-library",
        label: "正規表現ライブラリ",
        description:
          "よく使われる正規表現パターンのリファレンス。メール・URL・IPアドレス・日付・電話番号・パスワード・日本語など40種類以上のパターンを収録。カテゴリ検索・ライブテスト機能付き。",
        icon: "📚",
      },
      {
        path: "/regex-checker",
        label: "正規表現",
        description: "正規表現のパターンをテスト・検証",
        icon: "🔎",
      },
      {
        path: "/jwt",
        label: "JWTデコード",
        description: "JWTトークンのデコードと検証",
        icon: "🔓",
      },
      {
        path: "/totp",
        label: "TOTP生成",
        description:
          "TOTP（Time-based One-Time Password）コードをブラウザ内で生成。Google Authenticator等の2FAコードをシークレットキーから確認。",
        icon: "🔑",
      },
      {
        path: "/email-dns",
        label: "メールDNS",
        description: "メールドメインのDNS設定を確認",
        icon: "📧",
      },
      {
        path: "/email-header",
        label: "メールヘッダー解析",
        description:
          "生のメールヘッダーを貼り付けて解析。SPF・DKIM・DMARC認証結果、メール経路（Receivedヘッダー）、スパムスコアをわかりやすく可視化。迷惑メール調査・配信トラブル解析に。",
        icon: "📨",
      },
      {
        path: "/hash",
        label: "ハッシュ生成",
        description: "MD5/SHA-1/SHA-256ハッシュ値を生成",
        icon: "🔒",
      },
      {
        path: "/hmac",
        label: "HMAC 生成",
        description:
          "テキストと秘密鍵から HMAC-SHA-256 などの署名値を生成するツール。Webhook 検証・API 認証に対応。HEX/Base64 出力。",
        icon: "🔏",
      },
      {
        path: "/sri-hash",
        label: "SRI ハッシュ生成",
        description:
          "Subresource Integrity (SRI) ハッシュをブラウザ内で生成するツール。SHA-256/384/512 に対応し、CDN リソース改ざん検知用の integrity 属性値と script・link タグの HTML スニペットを即座に生成。",
        icon: "🔐",
      },
      {
        path: "/security-headers",
        label: "セキュリティヘッダー",
        description: "WebサイトのHTTPセキュリティヘッダーを確認",
        icon: "🛡️",
      },
      {
        path: "/cookie-parser",
        label: "クッキーパーサー",
        description:
          "HTTP Cookie / Set-Cookie ヘッダーを解析し、属性（Expires・Path・SameSite等）を視覚的に確認できるツール",
        icon: "🍪",
      },
      {
        path: "/cron-parser",
        label: "Cron式パーサー",
        description: "Cron式の解析と次回実行時刻の表示",
        icon: "⏰",
      },
      {
        path: "/keycode",
        label: "キーコードチェック",
        description:
          "キーボードキー押下時のイベント情報（key, code, keyCode等）をリアルタイムで確認できるツール",
        icon: "⌨️",
      },
      {
        path: "/css-specificity",
        label: "CSS詳細度計算機",
        description:
          "CSSセレクターの詳細度（specificity）を計算するツール。IDセレクター・クラス・タイプの (a, b, c) 表記で表示。複数セレクターの比較も可能。",
        icon: "🎯",
      },
      {
        path: "/css-variables",
        label: "CSS変数エクストラクター",
        description:
          "CSSテキストからカスタムプロパティ（CSS変数）を抽出・一覧表示するツール。カラープレビュー付き。CSS・JSON・TypeScript形式でエクスポート可能。",
        icon: "🎨",
      },
      {
        path: "/css-selector",
        label: "CSS Selectorテスター",
        description:
          "HTMLに対してCSSセレクターをテストし、マッチした要素を確認できるツール。querySelectorAll を使ってリアルタイムでマッチング結果を表示。",
        icon: "🎯",
      },
      {
        path: "/glob-tester",
        label: "Glob パターンテスター",
        description:
          "globパターンをリアルタイムでテストするツール。*, **, ?, [abc], {a,b}, !（否定）に対応。.gitignore・webpack・vite設定のパターン検証に。",
        icon: "🌐",
      },
      {
        path: "/semver",
        label: "Semver チェッカー",
        description:
          "セマンティックバージョン (Semver) のパース・比較・範囲チェックツール。バージョン文字列の解析、2つのバージョンの大小比較、>=/<=/^/~ などの範囲演算子チェックに対応。",
        icon: "🏷️",
      },
      {
        path: "/conventional-commits",
        label: "Conventional Commits",
        description:
          "Git コミットメッセージを Conventional Commits 仕様でパース・検証するツール。タイプ・スコープ・BREAKING CHANGE の検出、エラー・警告表示に対応。",
        icon: "📝",
      },
      {
        path: "/cache-control",
        label: "Cache-Control ビルダー",
        description:
          "Cache-Control HTTPヘッダーをGUIで構築・パース・検証するツール。max-age・no-store・no-cache・immutable・stale-while-revalidate など全ディレクティブに対応。よく使うプリセット付き。",
        icon: "📦",
      },
      {
        path: "/csp-builder",
        label: "CSP ビルダー",
        description:
          "Content-Security-Policy ヘッダーをGUIで構築するツール。fetch・document・reporting の各ディレクティブを設定し、CSP 文字列を即座に生成。既存ヘッダーのパース・検証・セキュリティ警告にも対応。",
        icon: "🛡️",
      },
      {
        path: "/cors-builder",
        label: "CORS ヘッダービルダー",
        description:
          "Cross-Origin Resource Sharing (CORS) ヘッダーをGUIで構築するツール。許可するオリジン・メソッド・ヘッダーを設定し、Access-Control-* ヘッダーを生成。Express・nginx・Cloudflare Workers 向けの設定コードも出力。",
        icon: "🌍",
      },
      {
        path: "/pkce",
        label: "PKCE ジェネレーター",
        description:
          "OAuth 2.0 の PKCE（Proof Key for Code Exchange）に必要な code_verifier と code_challenge を生成。RFC 7636 準拠・S256/plain メソッド対応。ブラウザ内で完結し、値が外部に送信されることはありません。",
        icon: "🔑",
      },
      {
        path: "/password-strength",
        label: "パスワード強度チェッカー",
        description:
          "パスワードのエントロピー・クラック時間・文字クラス・パターン検知（連続文字・繰り返し・よく使われるパスワード）を詳細解析。改善アドバイスつき。ブラウザ内完結で外部送信なし。",
        icon: "🔍",
      },
      {
        path: "/cert-decoder",
        label: "X.509 証明書デコーダー",
        description:
          "PEM 形式の X.509 証明書を解析し、発行者・有効期限・SAN・公開鍵アルゴリズム・拡張フィールドを人間が読みやすい形式で表示するツール。",
        icon: "📜",
      },
      {
        path: "/basic-auth",
        label: "HTTP Basic Auth",
        description:
          "HTTP Basic認証ヘッダーをエンコード・デコードするツール。ユーザー名とパスワードから Authorization: Basic ヘッダーを生成。curl オプションも表示。ブラウザ内完結でデータは外部に送信されません。",
        icon: "🔐",
      },
      {
        path: "/ssh-key",
        label: "SSH鍵生成",
        description:
          "RSA (2048/4096bit) および ECDSA (P-256/P-384) の鍵ペアをブラウザ内で生成。PKCS#8 PEM・OpenSSH形式で出力。秘密鍵は外部に送信されません。",
        icon: "🔑",
      },
      {
        path: "/luhn-check",
        label: "Luhn / クレジットカード検証",
        description:
          "Luhnアルゴリズムでクレジットカード番号の有効性を検証するツール。Visa・Mastercard・Amex・Discover・JCBなどのカード種別を自動判定。テスト用カード番号リスト付き。",
        icon: "💳",
      },
      {
        path: "/iban",
        label: "IBAN バリデーター",
        description:
          "MOD-97アルゴリズムでIBAN（国際銀行口座番号）を検証するツール。ドイツ・イギリス・フランス・スペインなど80カ国以上に対応。ブラウザ内完結で入力データは外部送信されません。",
        icon: "🏦",
      },
      {
        path: "/phone",
        label: "電話番号フォーマッター",
        description:
          "日本の電話番号を入力するとリアルタイムで種別判定・フォーマット変換を行います。ハイフン区切り・国際表記（+81）・E.164形式に対応。携帯・固定・フリーダイヤル・IP電話など全種別対応。",
        icon: "📞",
      },
    ],
  },
  {
    name: "ネットワーク",
    icon: "🌐",
    items: [
      {
        path: "/cidr",
        label: "CIDR計算",
        description: "CIDRブロックのIPレンジ計算",
        icon: "🌐",
      },
      {
        path: "/ip-cidr-check",
        label: "CIDR範囲チェック",
        description: "IPアドレスがCIDRブロックに含まれるか確認",
        icon: "✅",
      },
      {
        path: "/ip-converter",
        label: "IP変換",
        description: "IPアドレスの10進数・16進数・2進数変換",
        icon: "🔄",
      },
      {
        path: "/ipv6",
        label: "IPv6解析・変換",
        description:
          "IPv6アドレスの展開・圧縮・解析ツール。RFC 5952準拠の圧縮形式変換、アドレスタイプ判定（ループバック・リンクローカル・マルチキャスト等）、IPv4射影アドレスの抽出、2進数表示に対応。",
        icon: "🌐",
      },
      {
        path: "/http-client",
        label: "HTTP APIテスター",
        description:
          "HTTP APIリクエストを送信してレスポンスを確認。GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONSに対応。カスタムヘッダーとリクエストボディも設定可能。",
        icon: "🔌",
      },
      {
        path: "/port-check",
        label: "ポートチェック",
        description: "指定したホスト・IPアドレスのポートが開いているか確認するツール",
        icon: "🔌",
      },
      {
        path: "/chmod",
        label: "Chmod計算",
        description:
          "Unixファイルパーミッション（chmod）の数値・シンボル表記を変換・計算するツール",
        icon: "🔒",
      },
      {
        path: "/curl-builder",
        label: "curlビルダー",
        description:
          "GUIでcurlコマンドを組み立てる。HTTPメソッド、ヘッダー、ボディ、各種オプションを設定してコマンドを生成",
        icon: "🔧",
      },
      {
        path: "/curl-to-fetch",
        label: "cURL → fetch 変換",
        description:
          "cURLコマンドをJavaScript Fetch API または axios のコードに変換するツール。-H / -d / -X / -u などのフラグに対応。ブラウザ内完結。",
        icon: "⇄",
      },
      {
        path: "/docker-run-to-compose",
        label: "docker run → Compose 変換",
        description:
          "docker run コマンドを docker-compose.yml 形式に変換するツール。-p / -e / -v / --name / --network などのオプションに対応。ブラウザ内完結。",
        icon: "🐳",
      },
      {
        path: "/dockerfile",
        label: "Dockerfile ジェネレーター",
        description:
          "GUIでDockerfileを生成するツール。FROM・WORKDIR・ARG・ENV・COPY・RUN・EXPOSE・USER・ENTRYPOINT・CMDをフォームで設定。Node.js・Python・Go・Nginxのテンプレートを用意。ブラウザ内完結。",
        icon: "🐋",
      },
      {
        path: "/nginx-config",
        label: "Nginx設定ジェネレーター",
        description:
          "Nginx サーバーブロックの設定を GUI で生成。静的サイト・リバースプロキシ・HTTPSリダイレクトに対応。",
        icon: "⚙️",
      },
      {
        path: "/htaccess-builder",
        label: "Apache .htaccessビルダー",
        description:
          "Apache .htaccess ファイルを GUI で生成。HTTPS リダイレクト・www リダイレクト・キャッシュ制御・GZIP 圧縮・セキュリティヘッダー・カスタムエラーページに対応。",
        icon: "🔧",
      },
      {
        path: "/makefile",
        label: "Makefileジェネレーター",
        description:
          "Node.js・Python・Go・Rust・C/C++など主要プロジェクト向けのMakefileを自動生成。Docker・リントターゲットのオプション付き。ブラウザ内完結。",
        icon: "🔨",
      },
      {
        path: "/openssl-builder",
        label: "OpenSSLビルダー",
        description:
          "OpenSSLコマンドをGUIで設定して生成。鍵生成・証明書作成・CSR生成など各種OpenSSL操作に対応",
        icon: "🔐",
      },
      {
        path: "/har",
        label: "HAR アナライザー",
        description:
          "ブラウザDevToolsからエクスポートしたHARファイルを解析。リクエスト一覧・レスポンスサイズ・タイミング・ステータス別統計を可視化。遅いリクエストや大きなリソースを素早く特定できる。",
        icon: "📊",
      },
      {
        path: "/websocket",
        label: "WebSocket テスター",
        description:
          "WebSocketエンドポイントへの接続・メッセージ送受信テストツール。接続状態のモニタリング・メッセージログ・JSON整形表示に対応。",
        icon: "🔌",
      },
      {
        path: "/redirect-tracer",
        label: "リダイレクトトレーサー",
        description:
          "URLのHTTPリダイレクトチェーンを可視化するツール。301/302/307/308などのリダイレクトを最大15ホップまで追跡し、各ステータスコード・Location・レスポンス時間を表示します。SEOリダイレクト検証・短縮URL確認に便利。",
        icon: "↪️",
      },
      {
        path: "/ports",
        label: "ポート番号リファレンス",
        description:
          "TCP/UDP ウェルノウンポート番号の一覧リファレンス。Web・メール・データベース・セキュリティ・メッセージング・開発ツールなどカテゴリ別に検索。SSH・HTTP・MySQL・Redis・Kafka など主要サービスのポートを網羅。",
        icon: "🔌",
      },
    ],
  },
  {
    name: "情報",
    icon: "ℹ",
    items: [
      {
        path: "/server-env",
        label: "サーバー環境",
        description: "Cloudflare Workers のサーバー環境情報を表示",
        icon: "💻",
      },
    ],
  },
  {
    name: "ゲーム",
    icon: "🎲",
    items: [
      {
        path: "/dice-roll",
        label: "ダイスロール",
        description: "各種ダイスのロールシミュレーター",
        icon: "🎲",
      },
      {
        path: "/typing-speed",
        label: "タイピング速度測定",
        description:
          "タイピング速度（WPM）と精度をリアルタイムで測定するツール。英語・日本語・プログラミングコードに対応。15/30/60/120秒のテスト時間を選択可能。",
        icon: "⌨️",
      },
      {
        path: "/pomodoro",
        label: "ポモドーロタイマー",
        description:
          "ポモドーロ・テクニックに基づく集中タイマー。25分作業と短い休憩を繰り返して生産性を高める",
        icon: "⏱️",
      },
      {
        path: "/countdown",
        label: "カウントダウンタイマー",
        description:
          "指定した日時までのカウントダウンを日・時・分・秒でリアルタイム表示。元日・クリスマスなどのプリセット対応。",
        icon: "⏳",
      },
      {
        path: "/stopwatch",
        label: "ストップウォッチ",
        description:
          "ミリ秒精度のストップウォッチ。ラップタイムの記録・最速/最遅ラップの強調表示に対応。スポーツ計測・ベンチマークに便利。",
        icon: "⏱️",
      },
      {
        path: "/bpm",
        label: "BPM / タップテンポ",
        description:
          "タップしてBPM（テンポ）を計測するツール。スペースキー対応。Larghissimo〜Prestissimoのテンポ記号早見表付き。音楽のテンポ確認・メトロノームのリファレンスに便利。",
        icon: "🥁",
      },
      {
        path: "/random-picker",
        label: "ランダムピッカー",
        description:
          "テキストリストからランダムに項目を抽選するツール。抽選済みを除外する非復元抽出にも対応。くじ引き・当番決めなどに便利。",
        icon: "🎯",
      },
      {
        path: "/brainfuck",
        label: "Brainfuck インタープリター",
        description:
          "Brainfuck コードをブラウザ上で実行できるオンラインインタープリター。サンプルプログラムとメモリ状態の可視化に対応。",
        icon: "🧠",
      },
      {
        path: "/sudoku",
        label: "数独ゲーム",
        description:
          "ブラウザで遊べる数独ゲーム。難易度3段階（簡単・普通・難しい）、ヒント機能、タイマー付き。矢印キーとキーボード入力に対応。",
        icon: "🔢",
      },
      {
        path: "/minesweeper",
        label: "マインスイーパー",
        description:
          "ブラウザで遊べるマインスイーパー。難易度3段階（初級・中級・上級）、タイマー・地雷カウンター付き。右クリックでフラグを立てられます。",
        icon: "💣",
      },
      {
        path: "/game-2048",
        label: "2048",
        description:
          "ブラウザで遊べる2048パズルゲーム。矢印キーまたはスワイプで同じ数字のタイルを合体させ、2048を目指そう！スコア・ベストスコア記録対応。",
        icon: "🔢",
      },
      {
        path: "/snake",
        label: "スネークゲーム",
        description:
          "ブラウザで遊べるクラシックなスネークゲーム。矢印キーでヘビを操作して食べ物を集めよう！スコア・ベストスコア記録対応。",
        icon: "🐍",
      },
      {
        path: "/hangman",
        label: "ハングマン",
        description:
          "単語を推測するハングマンゲーム。プログラミング・動物・国名・食べ物の4カテゴリから英単語を1文字ずつ当てよう。6回ミスするとゲームオーバー。",
        icon: "🎯",
      },
      {
        path: "/tetris",
        label: "テトリス",
        description:
          "ブラウザで遊べるクラシックなテトリスゲーム。矢印キーでピースを操作してラインを消そう！レベル・スコア・ベストスコア記録対応。ゴースト表示・ハードドロップ対応。",
        icon: "🟦",
      },
      {
        path: "/life-game",
        label: "ライフゲーム",
        description:
          "Conway's Game of Life（ライフゲーム）シミュレーター。グライダー・ブリンカー・グライダー銃などのプリセットパターン付き。セルをクリックして自由に編集可能。世代・個体数をリアルタイム表示。",
        icon: "🧬",
      },
      {
        path: "/wordle",
        label: "Wordle",
        description:
          "5文字の英単語を6回以内に当てるワードルゲーム。緑・黄・灰色のヒントを手がかりに推理しよう。",
        icon: "🟩",
      },
      {
        path: "/tic-tac-toe",
        label: "三目並べ",
        description:
          "ブラウザで遊べる三目並べ（Tic-Tac-Toe）。CPUとの対戦（かんたん・強い）や2人対戦に対応。ミニマックスAIで最強のCPUに挑戦しよう。",
        icon: "⭕",
      },
      {
        path: "/sort-visualizer",
        label: "ソートアルゴリズム可視化",
        description:
          "バブルソート・選択ソート・挿入ソート・マージソート・クイックソートをアニメーションで可視化するツール。比較・交換の過程をリアルタイム表示。計算量（O記法）の比較にも便利。",
        icon: "📊",
      },
      {
        path: "/mandelbrot",
        label: "マンデルブロット集合ビジュアライザー",
        description:
          "マンデルブロット集合をインタラクティブに探索できるフラクタルビジュアライザー。クリックでズームイン、右クリックでズームアウト。カラースキームの変更や有名な座標へのジャンプにも対応。",
        icon: "🌀",
      },
    ],
  },
];

/**
 * カタログをクエリ文字列でフィルタリングする
 * @param catalog - フィルタリング対象のカタログ
 * @param query - 検索クエリ文字列
 * @returns フィルタリング後のカタログ（アイテムが0のカテゴリは除外）
 */
export function filterCatalog(catalog: ToolCategory[], query: string): ToolCategory[] {
  if (!query.trim()) return catalog;
  const q = query.toLowerCase();
  return catalog
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
      ),
    }))
    .filter((category) => category.items.length > 0);
}

export const Route = createFileRoute("/top")({
  head: () => ({
    meta: [
      { title: "ツール一覧 | Web ツール集" },
      {
        name: "description",
        content:
          "200以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。",
      },
      { property: "og:title", content: "ツール一覧 | Web ツール集" },
      {
        property: "og:description",
        content:
          "200以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/top` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ツール一覧 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "200以上のWebツールをカテゴリ別に一覧表示。開発・デザイン・ネットワーク等のツールを網羅。",
      },
    ],
  }),
  component: TopPage,
});

/**
 * トップページコンポーネント
 * 全ツールをカテゴリ別に一覧表示し、検索機能を提供する
 */
function TopPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCatalog = useMemo(() => filterCatalog(toolCatalog, searchQuery), [searchQuery]);

  const totalCount = toolCatalog.reduce((acc, cat) => acc + cat.items.length, 0);
  const filteredCount = filteredCatalog.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="top-page-container">
      {/* ページヘッダー */}
      <div className="top-page-header">
        <h2 className="top-page-title">ツール一覧</h2>
        <p className="top-page-subtitle">{totalCount} 個のツールが利用可能です</p>
      </div>

      {/* 検索バー */}
      <div className="top-search-section" role="search">
        <label htmlFor="tool-search" className="sr-only">
          ツールを検索
        </label>
        <input
          id="tool-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ツール名や機能で検索..."
          className="top-search-input"
          aria-label="ツールを検索"
        />
        {searchQuery && (
          <button
            className="top-search-clear"
            onClick={() => setSearchQuery("")}
            aria-label="検索をクリア"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* 検索結果カウント */}
      {searchQuery && (
        <p className="top-search-result-count" aria-live="polite" role="status">
          {filteredCount} 件のツールが見つかりました
        </p>
      )}

      {/* カテゴリ別ツールグリッド */}
      {filteredCatalog.map((category) => (
        <section
          key={category.name}
          className="top-category-section"
          aria-labelledby={`cat-${category.name}`}
        >
          <h3 id={`cat-${category.name}`} className="top-category-heading">
            <span aria-hidden="true">{category.icon}</span>
            {category.name}
            <span className="top-category-count">{category.items.length}</span>
          </h3>
          <div className="top-tool-grid" role="list">
            {category.items.map((tool) => (
              <Link key={tool.path} to={tool.path} className="top-tool-card" role="listitem">
                <span className="top-tool-icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <div className="top-tool-info">
                  <span className="top-tool-name">{tool.label}</span>
                  <span className="top-tool-description">{tool.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 検索結果なし */}
      {filteredCatalog.length === 0 && (
        <div className="top-no-results" role="status" aria-live="polite">
          <p>「{searchQuery}」に一致するツールが見つかりませんでした</p>
          <button onClick={() => setSearchQuery("")} type="button" className="btn-primary">
            検索をクリア
          </button>
        </div>
      )}
    </div>
  );
}
