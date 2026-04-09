import { createServerFn } from "@tanstack/react-start";

/**
 * ポートチェック入力データ
 */
export interface PortCheckInput {
  host: string;
  ports: number[];
  timeout?: number;
}

/**
 * 個別ポートのチェック結果
 */
export interface PortResult {
  port: number;
  isOpen: boolean;
  serviceName?: string;
  error?: string;
  responseTime?: number;
}

/**
 * ポートチェック全体の結果
 */
export interface PortCheckResult {
  host: string;
  results: PortResult[];
  checkTime: string;
  error?: string;
}

/**
 * well-known ポートとサービス名のマッピング
 */
const SERVICE_NAMES: Record<number, string> = {
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  110: "POP3",
  143: "IMAP",
  443: "HTTPS",
  587: "SMTP TLS",
  993: "IMAPS",
  995: "POP3S",
  1433: "MSSQL",
  3306: "MySQL",
  5432: "PostgreSQL",
  6379: "Redis",
  8080: "HTTP Proxy",
  8443: "HTTPS Alt",
  27017: "MongoDB",
};

/** プライベート・内部IPアドレスのパターン */
const PRIVATE_IP_PATTERNS = [
  /^127\./, // ループバック (127.0.0.0/8)
  /^10\./, // プライベート Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2\d|3[01])\./, // プライベート Class B (172.16.0.0/12)
  /^192\.168\./, // プライベート Class C (192.168.0.0/16)
  /^169\.254\./, // リンクローカル・メタデータサービス (169.254.0.0/16)
  /^0\./, // 非ルーティング (0.0.0.0/8)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT (100.64.0.0/10, RFC 6598)
  /^::1$/, // IPv6ループバック
  /^fc[0-9a-f]{2}:/i, // IPv6 ULA (fc00::/7)
  /^fd[0-9a-f]{2}:/i, // IPv6 ULA (fd00::/8)
  /^fe[89ab][0-9a-f]:/i, // IPv6リンクローカル (fe80::/10)
  /^::ffff:/i, // IPv4マップIPv6アドレス
];

/**
 * プライベートIPアドレスまたはローカルホストかどうかを判定する
 * @param host チェック対象のホスト名またはIPアドレス
 * @returns プライベートIPまたはローカルホストの場合true
 */
export function isPrivateHost(host: string): boolean {
  const normalized = host.toLowerCase();

  // ローカルホスト名チェック
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return true;
  }

  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * ホスト名またはIPアドレスのバリデーション
 * @param host - チェックするホスト文字列
 * @returns 有効な場合true
 */
export function validateHost(host: string): boolean {
  if (!host || host.trim().length === 0) return false;
  const trimmed = host.trim();

  // 長さチェック
  if (trimmed.length > 253) return false;

  // IPv4チェック
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(trimmed)) {
    const parts = trimmed.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // ホスト名チェック（RFC 1123準拠）
  const hostnameRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return hostnameRegex.test(trimmed);
}

/**
 * カンマ区切りのポート文字列をパースして数値配列に変換
 * @param input - カンマ区切りのポート番号文字列（例: "80,443,8080"）
 * @returns ポート番号の配列（重複なし、1-65535の範囲内のみ）
 */
export function parsePorts(input: string): number[] {
  if (!input || input.trim().length === 0) return [];

  const ports = input
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => parseInt(p, 10))
    .filter((p) => !isNaN(p) && p >= 1 && p <= 65535);

  // 重複を除去
  return [...new Set(ports)];
}

/**
 * ポート番号に対応するサービス名を取得
 * @param port - ポート番号
 * @returns サービス名（未知の場合はundefined）
 */
export function getServiceName(port: number): string | undefined {
  return SERVICE_NAMES[port];
}

/**
 * 単一ポートの開閉をチェック
 * Cloudflare Workers の cloudflare:sockets を使用
 * @param host - チェックするホスト名またはIPアドレス
 * @param port - チェックするポート番号
 * @param timeout - タイムアウト（ミリ秒）
 * @returns チェック結果（開閉状態、応答時間、エラー情報）
 */
async function checkPort(
  host: string,
  port: number,
  timeout: number,
): Promise<{ isOpen: boolean; responseTime?: number; error?: string }> {
  const start = Date.now();
  const { connect } = await import("cloudflare:sockets");
  const socket = connect({ hostname: host, port });

  try {
    await Promise.race([
      socket.opened,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeout)),
    ]);

    const responseTime = Date.now() - start;
    // close の失敗は結果に影響させない
    try {
      await socket.close();
    } catch {
      // クローズ失敗は無視
    }
    return { isOpen: true, responseTime };
  } catch (e) {
    // タイムアウト・接続拒否どちらの場合もソケットを閉じる
    try {
      await socket.close();
    } catch {
      // close失敗は無視
    }
    const err = e as Error;
    if (err.message === "timeout") {
      return { isOpen: false, error: "タイムアウト" };
    }
    return { isOpen: false, error: "接続拒否" };
  }
}

/**
 * 複数ポートのオープン状態を並列チェックするサーバーファンクション
 */
export const checkPorts = createServerFn({ method: "POST" })
  .inputValidator((data: PortCheckInput) => {
    if (!data.host || !validateHost(data.host.trim())) {
      throw new Error("無効なホスト名またはIPアドレスです");
    }
    if (!data.ports || data.ports.length === 0) {
      throw new Error("ポートを1つ以上指定してください");
    }
    if (data.ports.length > 50) {
      throw new Error("一度にチェックできるポートは50個までです");
    }
    const invalidPorts = data.ports.filter((p) => p < 1 || p > 65535);
    if (invalidPorts.length > 0) {
      throw new Error(`無効なポート番号があります: ${invalidPorts.join(", ")}`);
    }
    return data;
  })
  .handler(async ({ data }) => {
    const host = data.host.trim();
    const timeout = Math.min(Math.max((data.timeout ?? 5) * 1000, 1000), 30000);

    if (isPrivateHost(host)) {
      return {
        host,
        results: [],
        checkTime: new Date().toISOString(),
        error: "プライベートIPアドレスやループバックアドレスへのチェックは許可されていません",
      };
    }

    const result: PortCheckResult = {
      host,
      results: [],
      checkTime: new Date().toISOString(),
    };

    try {
      const portResults = await Promise.all(
        data.ports.map(async (port): Promise<PortResult> => {
          const checkResult = await checkPort(host, port, timeout);
          return {
            port,
            isOpen: checkResult.isOpen,
            serviceName: getServiceName(port),
            error: checkResult.error,
            responseTime: checkResult.responseTime,
          };
        }),
      );

      // ポート番号順に並べ替え
      result.results = portResults.sort((a, b) => a.port - b.port);
    } catch (err) {
      result.error = err instanceof Error ? err.message : "チェック中にエラーが発生しました";
    }

    return result;
  });
