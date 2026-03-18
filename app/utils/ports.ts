/**
 * ウェルノウンポート番号リファレンスユーティリティ
 *
 * TCP/UDP ポート番号の一覧データとフィルタリング機能を提供します。
 * ウェルノウンポート（0–1023）および主要な登録済みポートを収録。
 */

/** ポートのプロトコル種別 */
export type PortProtocol = 'TCP' | 'UDP' | 'TCP/UDP';

/** ポートのカテゴリ */
export type PortCategory =
  | 'web'
  | 'email'
  | 'database'
  | 'security'
  | 'messaging'
  | 'development'
  | 'network'
  | 'remote'
  | 'file';

/**
 * ポートエントリの型定義
 */
export interface PortEntry {
  /** ポート番号 */
  port: number;
  /** プロトコル */
  protocol: PortProtocol;
  /** サービス名 */
  service: string;
  /** 説明（日本語） */
  description: string;
  /** カテゴリ */
  category: PortCategory;
}

/**
 * ウェルノウン・主要登録済みポートのデータベース
 */
export const PORT_DATABASE: PortEntry[] = [
  // ─── ネットワーク ───────────────────────────────────────────
  {
    port: 7,
    protocol: 'TCP/UDP',
    service: 'Echo',
    description: 'エコープロトコル。受信したデータをそのまま返送する。診断用途に使用。',
    category: 'network',
  },
  {
    port: 19,
    protocol: 'TCP/UDP',
    service: 'Chargen',
    description:
      'Character Generator Protocol。文字ストリームを生成するテスト・診断用プロトコル。',
    category: 'network',
  },
  {
    port: 53,
    protocol: 'TCP/UDP',
    service: 'DNS',
    description:
      'Domain Name System。ドメイン名とIPアドレスを相互変換する。UDP は通常クエリ、TCP は大きな応答やゾーン転送に使用。',
    category: 'network',
  },
  {
    port: 67,
    protocol: 'UDP',
    service: 'DHCP (Server)',
    description:
      'Dynamic Host Configuration Protocol サーバーポート。クライアントへIPアドレスを動的に割り当てる。',
    category: 'network',
  },
  {
    port: 68,
    protocol: 'UDP',
    service: 'DHCP (Client)',
    description: 'DHCP クライアントポート。サーバーからIPアドレスの割り当てを受け取る。',
    category: 'network',
  },
  {
    port: 69,
    protocol: 'UDP',
    service: 'TFTP',
    description:
      'Trivial File Transfer Protocol。認証なしの簡易ファイル転送。PXEブート・ネットワーク機器設定に使用。',
    category: 'network',
  },
  {
    port: 123,
    protocol: 'UDP',
    service: 'NTP',
    description:
      'Network Time Protocol。ネットワーク機器の時刻同期に使用。精度はマイクロ秒〜ミリ秒単位。',
    category: 'network',
  },
  {
    port: 161,
    protocol: 'UDP',
    service: 'SNMP',
    description:
      'Simple Network Management Protocol。ネットワーク機器の監視・管理に使用。エージェントへのポーリングに使用。',
    category: 'network',
  },
  {
    port: 162,
    protocol: 'UDP',
    service: 'SNMP Trap',
    description:
      'SNMP トラップ受信ポート。ネットワーク機器がマネージャーに非同期通知（トラップ）を送信する際に使用。',
    category: 'network',
  },
  {
    port: 179,
    protocol: 'TCP',
    service: 'BGP',
    description:
      'Border Gateway Protocol。インターネットの経路制御プロトコル。AS（自律システム）間でルーティング情報を交換。',
    category: 'network',
  },
  {
    port: 514,
    protocol: 'UDP',
    service: 'Syslog',
    description:
      'Syslog プロトコル。ネットワーク機器・サーバーからログをリモートの収集サーバーに送信する標準的な方式。',
    category: 'network',
  },
  {
    port: 520,
    protocol: 'UDP',
    service: 'RIP',
    description:
      'Routing Information Protocol。ホップ数を指標とする距離ベクタ型ルーティングプロトコル。',
    category: 'network',
  },
  {
    port: 546,
    protocol: 'UDP',
    service: 'DHCPv6 (Client)',
    description: 'DHCPv6 クライアントポート。IPv6 ネットワークでのアドレス自動設定に使用。',
    category: 'network',
  },
  {
    port: 547,
    protocol: 'UDP',
    service: 'DHCPv6 (Server)',
    description: 'DHCPv6 サーバーポート。IPv6 アドレスの動的割り当てを提供。',
    category: 'network',
  },
  {
    port: 1900,
    protocol: 'UDP',
    service: 'SSDP / UPnP',
    description:
      'Simple Service Discovery Protocol。UPnP デバイスの検出に使用。ホームネットワーク機器の自動設定に使用される。',
    category: 'network',
  },
  {
    port: 5353,
    protocol: 'UDP',
    service: 'mDNS',
    description:
      'Multicast DNS。ローカルネットワーク内でDNSサーバーなしにホスト名解決を行う（Zeroconf/Bonjour/Avahi）。',
    category: 'network',
  },

  // ─── Web ───────────────────────────────────────────────────
  {
    port: 80,
    protocol: 'TCP',
    service: 'HTTP',
    description:
      'Hypertext Transfer Protocol。Webブラウザとサーバー間の基本通信プロトコル。現在はHTTPSへのリダイレクト用途が多い。',
    category: 'web',
  },
  {
    port: 443,
    protocol: 'TCP',
    service: 'HTTPS',
    description:
      'HTTP Secure（TLS/SSL上のHTTP）。暗号化されたWeb通信の標準ポート。証明書による認証と通信の暗号化を提供。',
    category: 'web',
  },
  {
    port: 8080,
    protocol: 'TCP',
    service: 'HTTP Alt',
    description:
      'HTTP代替ポート。開発・テスト用途や、80番ポートが使用中のときに使われる。プロキシサーバーにも多用される。',
    category: 'web',
  },
  {
    port: 8443,
    protocol: 'TCP',
    service: 'HTTPS Alt',
    description:
      'HTTPS代替ポート。443番の代替として使用される。開発環境やプロキシで使用されることが多い。',
    category: 'web',
  },
  {
    port: 8000,
    protocol: 'TCP',
    service: 'HTTP Dev',
    description:
      'HTTP開発用代替ポート。Django・Python HTTP サーバーのデフォルトポート。開発サーバーに広く使われる。',
    category: 'web',
  },
  {
    port: 3000,
    protocol: 'TCP',
    service: 'Node.js / React Dev',
    description:
      'Node.js・React・Next.js・Express の開発サーバーデフォルトポート。フロントエンド開発に広く使用。',
    category: 'web',
  },
  {
    port: 5173,
    protocol: 'TCP',
    service: 'Vite Dev',
    description:
      'Vite 開発サーバーのデフォルトポート。高速なHMR（ホットモジュール置換）を提供。React・Vue・Svelte 等で使用。',
    category: 'web',
  },
  {
    port: 4200,
    protocol: 'TCP',
    service: 'Angular Dev',
    description: 'Angular CLI 開発サーバーのデフォルトポート（ng serve）。',
    category: 'web',
  },
  {
    port: 5000,
    protocol: 'TCP',
    service: 'Flask / Dev',
    description:
      'Flask（Python Webフレームワーク）のデフォルト開発サーバーポート。ASP.NET 開発にも使用される。',
    category: 'web',
  },
  {
    port: 4000,
    protocol: 'TCP',
    service: 'Jekyll / Phoenix Dev',
    description:
      'Jekyll 静的サイトジェネレーターおよび Phoenix（Elixir）フレームワークの開発サーバーデフォルトポート。',
    category: 'web',
  },
  {
    port: 1080,
    protocol: 'TCP',
    service: 'SOCKS Proxy',
    description: 'SOCKS プロキシサーバーの標準ポート。SOCKS4/SOCKS5 プロトコルをサポート。',
    category: 'web',
  },
  {
    port: 3128,
    protocol: 'TCP',
    service: 'Squid Proxy',
    description:
      'Squid キャッシュプロキシのデフォルトポート。HTTP/HTTPS プロキシとして広く使われる。',
    category: 'web',
  },

  // ─── ファイル転送 ───────────────────────────────────────────
  {
    port: 20,
    protocol: 'TCP',
    service: 'FTP Data',
    description:
      'File Transfer Protocol データ転送ポート。アクティブモードでファイルデータを転送する際に使用。',
    category: 'file',
  },
  {
    port: 21,
    protocol: 'TCP',
    service: 'FTP Control',
    description:
      'File Transfer Protocol 制御ポート。FTPの接続制御・コマンドの送受信に使用。認証情報は平文で送信される（非推奨）。',
    category: 'file',
  },
  {
    port: 115,
    protocol: 'TCP',
    service: 'SFTP (Simple)',
    description:
      'Simple File Transfer Protocol（旧式）。SSH File Transfer Protocol（ポート22）とは異なる古いプロトコル。',
    category: 'file',
  },
  {
    port: 139,
    protocol: 'TCP',
    service: 'NetBIOS / SMB',
    description:
      'NetBIOS セッションサービス。Windows ファイル共有（SMB/CIFS）の旧来の通信ポート。',
    category: 'file',
  },
  {
    port: 445,
    protocol: 'TCP',
    service: 'SMB / CIFS',
    description:
      'Server Message Block（現代版）。Windows ファイル共有・プリンター共有の主要ポート。NetBIOS 不要で直接 TCP 上で動作。',
    category: 'file',
  },
  {
    port: 548,
    protocol: 'TCP',
    service: 'AFP',
    description:
      'Apple Filing Protocol。macOS のファイル共有プロトコル。Time Machine のバックアップにも使用される。',
    category: 'file',
  },
  {
    port: 873,
    protocol: 'TCP',
    service: 'rsync',
    description:
      'rsync デーモンポート。効率的なファイル同期・バックアップツールのネットワーク通信ポート。',
    category: 'file',
  },
  {
    port: 2049,
    protocol: 'TCP/UDP',
    service: 'NFS',
    description:
      'Network File System。Unix/Linux システム間のファイル共有プロトコル。NFS バージョン 3/4 で使用。',
    category: 'file',
  },

  // ─── メール ────────────────────────────────────────────────
  {
    port: 25,
    protocol: 'TCP',
    service: 'SMTP',
    description:
      'Simple Mail Transfer Protocol。メールサーバー間のメール転送（MTA to MTA）に使用。多くのISPではスパム対策のためにブロック。',
    category: 'email',
  },
  {
    port: 110,
    protocol: 'TCP',
    service: 'POP3',
    description:
      'Post Office Protocol v3。メールサーバーからクライアントへのメール受信プロトコル。通信は平文（非推奨）。',
    category: 'email',
  },
  {
    port: 143,
    protocol: 'TCP',
    service: 'IMAP',
    description:
      'Internet Message Access Protocol。メールをサーバーに保管したまま管理するプロトコル。複数デバイスでの同期に適している。',
    category: 'email',
  },
  {
    port: 465,
    protocol: 'TCP',
    service: 'SMTPS',
    description:
      'SMTP over TLS（Implicit TLS）。暗号化されたSMTP送信ポート。メールクライアントからサーバーへの送信に使用。',
    category: 'email',
  },
  {
    port: 587,
    protocol: 'TCP',
    service: 'SMTP Submission',
    description:
      'SMTP メール投稿ポート（STARTTLS対応）。メールクライアントからMTAへのメール送信に推奨されるポート（RFC 6409）。',
    category: 'email',
  },
  {
    port: 993,
    protocol: 'TCP',
    service: 'IMAPS',
    description:
      'IMAP over TLS（Implicit TLS）。暗号化されたIMAP接続。セキュアなメール受信に推奨。',
    category: 'email',
  },
  {
    port: 995,
    protocol: 'TCP',
    service: 'POP3S',
    description: 'POP3 over TLS（Implicit TLS）。暗号化されたPOP3接続。',
    category: 'email',
  },

  // ─── セキュリティ / リモートアクセス ───────────────────────
  {
    port: 22,
    protocol: 'TCP',
    service: 'SSH',
    description:
      'Secure Shell。暗号化されたリモートログイン・ファイル転送（SCP/SFTP）・ポートフォワーディングに使用。',
    category: 'security',
  },
  {
    port: 23,
    protocol: 'TCP',
    service: 'Telnet',
    description:
      'Telnet プロトコル。暗号化なしのリモートターミナル接続。セキュリティ上の理由からSSHへの移行が推奨される（非推奨）。',
    category: 'security',
  },
  {
    port: 389,
    protocol: 'TCP/UDP',
    service: 'LDAP',
    description:
      'Lightweight Directory Access Protocol。ディレクトリサービス（Active Directory等）への問い合わせに使用。通信は平文。',
    category: 'security',
  },
  {
    port: 636,
    protocol: 'TCP',
    service: 'LDAPS',
    description: 'LDAP over TLS。暗号化されたLDAP通信。Active Directory への安全な接続に使用。',
    category: 'security',
  },
  {
    port: 990,
    protocol: 'TCP',
    service: 'FTPS',
    description: 'FTP over TLS（Implicit TLS）。暗号化されたFTP接続のコントロールポート。',
    category: 'security',
  },
  {
    port: 992,
    protocol: 'TCP',
    service: 'Telnet over TLS',
    description: 'TLS で暗号化された Telnet 接続。',
    category: 'security',
  },
  {
    port: 1194,
    protocol: 'UDP',
    service: 'OpenVPN',
    description:
      'OpenVPN のデフォルトポート。オープンソースのVPNプロトコル。TCP でも動作可能（同ポート）。',
    category: 'security',
  },
  {
    port: 1701,
    protocol: 'UDP',
    service: 'L2TP',
    description:
      'Layer 2 Tunneling Protocol。VPN接続に使用されるトンネリングプロトコル。IPSecと組み合わせて使用されることが多い。',
    category: 'security',
  },
  {
    port: 1723,
    protocol: 'TCP',
    service: 'PPTP',
    description:
      'Point-to-Point Tunneling Protocol。VPN プロトコル。セキュリティ上の脆弱性が知られており非推奨。',
    category: 'security',
  },
  {
    port: 4500,
    protocol: 'UDP',
    service: 'IPSec NAT-T',
    description: 'IPSec NAT トラバーサル。NAT 環境下での IPSec VPN 通信に使用。',
    category: 'security',
  },
  {
    port: 500,
    protocol: 'UDP',
    service: 'IKE / IPSec',
    description:
      'Internet Key Exchange。IPSec VPN のセッション確立・鍵交換に使用（IKEv1/IKEv2）。',
    category: 'security',
  },
  {
    port: 51820,
    protocol: 'UDP',
    service: 'WireGuard',
    description:
      'WireGuard VPN のデフォルトポート。シンプルで高速・安全なモダンVPNプロトコル。',
    category: 'security',
  },

  // ─── リモートデスクトップ ───────────────────────────────────
  {
    port: 3389,
    protocol: 'TCP',
    service: 'RDP',
    description:
      'Remote Desktop Protocol。Windows リモートデスクトップ接続のデフォルトポート。暗号化されるが攻撃対象となりやすい。',
    category: 'remote',
  },
  {
    port: 5900,
    protocol: 'TCP',
    service: 'VNC',
    description:
      'Virtual Network Computing（RFB プロトコル）。クロスプラットフォームのリモートデスクトップ接続ポート。',
    category: 'remote',
  },
  {
    port: 5901,
    protocol: 'TCP',
    service: 'VNC Display 1',
    description: 'VNC ディスプレイ番号 :1 に対応するポート（5900 + ディスプレイ番号）。',
    category: 'remote',
  },

  // ─── データベース ───────────────────────────────────────────
  {
    port: 1433,
    protocol: 'TCP',
    service: 'Microsoft SQL Server',
    description:
      'Microsoft SQL Server のデフォルトポート。SQL Server データベースへの接続に使用。',
    category: 'database',
  },
  {
    port: 1521,
    protocol: 'TCP',
    service: 'Oracle DB',
    description: 'Oracle Database のデフォルトリスナーポート。Oracle データベース接続に使用。',
    category: 'database',
  },
  {
    port: 3306,
    protocol: 'TCP',
    service: 'MySQL / MariaDB',
    description:
      'MySQL および MariaDB データベースのデフォルトポート。世界で最も広く使用されるオープンソースRDB。',
    category: 'database',
  },
  {
    port: 5432,
    protocol: 'TCP',
    service: 'PostgreSQL',
    description:
      'PostgreSQL データベースのデフォルトポート。高機能なオープンソースRDB。JSONデータ・地理情報・全文検索等をサポート。',
    category: 'database',
  },
  {
    port: 5984,
    protocol: 'TCP',
    service: 'CouchDB',
    description:
      'Apache CouchDB のデフォルト HTTP API ポート。JSON ドキュメント指向DB。REST API でアクセス。',
    category: 'database',
  },
  {
    port: 6379,
    protocol: 'TCP',
    service: 'Redis',
    description:
      'Redis インメモリデータストアのデフォルトポート。高速なキャッシュ・セッション管理・Pub/Subメッセージングに使用。',
    category: 'database',
  },
  {
    port: 7474,
    protocol: 'TCP',
    service: 'Neo4j HTTP',
    description:
      'Neo4j グラフデータベースの HTTP API ポート。Cypher クエリ言語でグラフデータを操作。',
    category: 'database',
  },
  {
    port: 7687,
    protocol: 'TCP',
    service: 'Neo4j Bolt',
    description:
      'Neo4j Bolt プロトコルポート。Neo4j の高性能バイナリプロトコル。公式ドライバーが使用する。',
    category: 'database',
  },
  {
    port: 8529,
    protocol: 'TCP',
    service: 'ArangoDB',
    description: 'ArangoDB マルチモデルデータベースのデフォルト HTTP ポート。',
    category: 'database',
  },
  {
    port: 9042,
    protocol: 'TCP',
    service: 'Apache Cassandra',
    description:
      'Apache Cassandra のネイティブ転送ポート（CQL）。分散型 NoSQL データベース。',
    category: 'database',
  },
  {
    port: 27017,
    protocol: 'TCP',
    service: 'MongoDB',
    description:
      'MongoDB ドキュメント指向データベースのデフォルトポート。JSON 形式でデータを保存するNoSQL DB。',
    category: 'database',
  },
  {
    port: 27018,
    protocol: 'TCP',
    service: 'MongoDB (shardsvr)',
    description: 'MongoDB シャードサーバーモードのデフォルトポート。',
    category: 'database',
  },
  {
    port: 27019,
    protocol: 'TCP',
    service: 'MongoDB (configsvr)',
    description: 'MongoDB 設定サーバーモードのデフォルトポート。',
    category: 'database',
  },
  {
    port: 6432,
    protocol: 'TCP',
    service: 'PgBouncer',
    description: 'PgBouncer PostgreSQL コネクションプーラーのデフォルトポート。',
    category: 'database',
  },
  {
    port: 8086,
    protocol: 'TCP',
    service: 'InfluxDB',
    description:
      'InfluxDB 時系列データベースの HTTP API ポート。IoT・監視データの保存に広く使用。',
    category: 'database',
  },

  // ─── メッセージング / ストリーミング ────────────────────────
  {
    port: 1883,
    protocol: 'TCP',
    service: 'MQTT',
    description:
      'Message Queuing Telemetry Transport。IoT デバイス向けの軽量 Pub/Sub メッセージングプロトコル。',
    category: 'messaging',
  },
  {
    port: 5671,
    protocol: 'TCP',
    service: 'AMQP over TLS',
    description: 'AMQP プロトコルの TLS 暗号化ポート。RabbitMQ 等での暗号化通信に使用。',
    category: 'messaging',
  },
  {
    port: 5672,
    protocol: 'TCP',
    service: 'AMQP',
    description:
      'Advanced Message Queuing Protocol。RabbitMQ 等のメッセージブローカーが使用する標準プロトコル。',
    category: 'messaging',
  },
  {
    port: 9092,
    protocol: 'TCP',
    service: 'Apache Kafka',
    description:
      'Apache Kafka のブローカーデフォルトポート。高スループットの分散ストリーミングプラットフォーム。',
    category: 'messaging',
  },
  {
    port: 2181,
    protocol: 'TCP',
    service: 'Apache ZooKeeper',
    description:
      'Apache ZooKeeper のクライアント接続ポート。Kafka・Hadoop 等の分散システムの協調サービス。',
    category: 'messaging',
  },
  {
    port: 4369,
    protocol: 'TCP',
    service: 'EPMD (Erlang)',
    description:
      'Erlang Port Mapper Daemon。RabbitMQ のノード検出に使用される Erlang プロセスマッパー。',
    category: 'messaging',
  },
  {
    port: 15672,
    protocol: 'TCP',
    service: 'RabbitMQ Management',
    description:
      'RabbitMQ 管理プラグインの Web UI / HTTP API ポート。ブラウザでキューの管理・監視が可能。',
    category: 'messaging',
  },
  {
    port: 6650,
    protocol: 'TCP',
    service: 'Apache Pulsar',
    description:
      'Apache Pulsar メッセージングシステムのクライアント接続ポート。Kafka の代替として注目される分散メッセージング基盤。',
    category: 'messaging',
  },
  {
    port: 8883,
    protocol: 'TCP',
    service: 'MQTT over TLS',
    description: 'TLS 暗号化された MQTT 接続のポート。IoT デバイスの安全な通信に使用。',
    category: 'messaging',
  },

  // ─── 開発ツール ─────────────────────────────────────────────
  {
    port: 8888,
    protocol: 'TCP',
    service: 'Jupyter Notebook',
    description:
      'Jupyter Notebook / JupyterLab のデフォルトポート。Python・R 等のインタラクティブな開発環境。',
    category: 'development',
  },
  {
    port: 9200,
    protocol: 'TCP',
    service: 'Elasticsearch HTTP',
    description:
      'Elasticsearch の HTTP REST API ポート。全文検索・ログ分析（ELKスタック）に広く使用。',
    category: 'development',
  },
  {
    port: 9300,
    protocol: 'TCP',
    service: 'Elasticsearch Transport',
    description: 'Elasticsearch ノード間の内部通信・クラスター形成に使用されるポート。',
    category: 'development',
  },
  {
    port: 5601,
    protocol: 'TCP',
    service: 'Kibana',
    description:
      'Kibana データ可視化ツールのデフォルトポート。Elasticsearch のデータをダッシュボードで表示。',
    category: 'development',
  },
  {
    port: 9090,
    protocol: 'TCP',
    service: 'Prometheus',
    description:
      'Prometheus 監視システムの HTTP API・Web UI ポート。時系列メトリクス収集・アラート管理。',
    category: 'development',
  },
  {
    port: 3100,
    protocol: 'TCP',
    service: 'Grafana Loki',
    description:
      'Grafana Loki ログ集約システムの HTTP API ポート。Prometheus ライクなログ収集ツール。',
    category: 'development',
  },
  {
    port: 9090,
    protocol: 'TCP',
    service: 'Prometheus / Traefik',
    description:
      'Prometheus のデフォルトポートおよび Traefik リバースプロキシの Web UI ポートとしても使用される。',
    category: 'development',
  },
  {
    port: 3000,
    protocol: 'TCP',
    service: 'Grafana',
    description:
      'Grafana ダッシュボードのデフォルトポート。Prometheus・InfluxDB 等のデータを可視化するオープンソースツール。',
    category: 'development',
  },
  {
    port: 2375,
    protocol: 'TCP',
    service: 'Docker API (非暗号化)',
    description:
      'Docker デーモン REST API ポート（TLS なし）。リモートでの Docker 管理に使用。セキュリティリスクがあるため本番環境では非推奨。',
    category: 'development',
  },
  {
    port: 2376,
    protocol: 'TCP',
    service: 'Docker API (TLS)',
    description:
      'Docker デーモン REST API ポート（TLS 有効）。リモートでの安全な Docker 管理に使用。',
    category: 'development',
  },
  {
    port: 2377,
    protocol: 'TCP',
    service: 'Docker Swarm',
    description: 'Docker Swarm モードのクラスター管理通信ポート。Swarm マネージャーが使用。',
    category: 'development',
  },
  {
    port: 6443,
    protocol: 'TCP',
    service: 'Kubernetes API',
    description:
      'Kubernetes API サーバーのデフォルトポート。kubectl や各コンポーネントが API サーバーと通信する際に使用。',
    category: 'development',
  },
  {
    port: 10250,
    protocol: 'TCP',
    service: 'Kubernetes Kubelet',
    description:
      'Kubernetes ノードエージェント（kubelet）の API ポート。マスターノードからの指示受け取りに使用。',
    category: 'development',
  },
  {
    port: 30000,
    protocol: 'TCP',
    service: 'Kubernetes NodePort（下限）',
    description:
      'Kubernetes NodePort サービスのポート範囲下限（30000–32767）。クラスター外部からサービスへのアクセスに使用。',
    category: 'development',
  },
  {
    port: 32767,
    protocol: 'TCP',
    service: 'Kubernetes NodePort（上限）',
    description: 'Kubernetes NodePort サービスのポート範囲上限（30000–32767）。',
    category: 'development',
  },
];

/**
 * カテゴリの表示ラベルを返す
 * @param category - ポートカテゴリ
 * @returns 日本語ラベル
 */
export function getCategoryLabel(category: PortCategory | 'all'): string {
  switch (category) {
    case 'all':
      return 'すべて';
    case 'web':
      return 'Web';
    case 'email':
      return 'メール';
    case 'database':
      return 'データベース';
    case 'security':
      return 'セキュリティ';
    case 'messaging':
      return 'メッセージング';
    case 'development':
      return '開発ツール';
    case 'network':
      return 'ネットワーク';
    case 'remote':
      return 'リモート';
    case 'file':
      return 'ファイル転送';
  }
}

/**
 * カテゴリに対応する CSS クラスサフィックスを返す
 * @param category - ポートカテゴリ
 * @returns CSSクラスサフィックス
 */
export function getCategoryClass(category: PortCategory): string {
  return `ports-cat-${category}`;
}

/**
 * ポートデータをフィルタリングする
 * @param entries - フィルタリング対象のエントリ一覧
 * @param query - 検索クエリ（ポート番号・サービス名・説明）
 * @param category - カテゴリフィルタ（"all" またはカテゴリ名）
 * @param protocol - プロトコルフィルタ（"all" または "TCP" / "UDP" / "TCP/UDP"）
 * @returns フィルタリングされたエントリ一覧
 */
export function filterPorts(
  entries: PortEntry[],
  query: string,
  category: PortCategory | 'all',
  protocol: PortProtocol | 'all'
): PortEntry[] {
  const lowerQuery = query.toLowerCase().trim();

  return entries.filter((entry) => {
    // カテゴリフィルタ
    if (category !== 'all' && entry.category !== category) {
      return false;
    }

    // プロトコルフィルタ
    if (protocol !== 'all' && entry.protocol !== protocol) {
      return false;
    }

    // キーワード検索
    if (!lowerQuery) return true;

    return (
      String(entry.port).includes(lowerQuery) ||
      entry.service.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * ポート番号からポートレンジの種別を返す
 * @param port - ポート番号
 * @returns ポートレンジの種別文字列
 */
export function getPortRange(port: number): string {
  if (port < 0 || port > 65535) return '不明';
  if (port <= 1023) return 'ウェルノウン（0–1023）';
  if (port <= 49151) return '登録済み（1024–49151）';
  return 'ダイナミック（49152–65535）';
}
