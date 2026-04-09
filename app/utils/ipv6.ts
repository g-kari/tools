/**
 * IPv6アドレス解析・変換ユーティリティ
 */

/** IPv6アドレスのタイプ */
export type IPv6AddressType =
  | "loopback"
  | "unspecified"
  | "link-local"
  | "unique-local"
  | "multicast"
  | "ipv4-mapped"
  | "ipv4-compatible"
  | "documentation"
  | "benchmarking"
  | "global-unicast";

/** IPv6解析結果 */
export interface IPv6Info {
  /** 入力文字列 */
  input: string;
  /** 展開形式 (0000:0001:...) */
  expanded: string;
  /** RFC 5952 圧縮形式 (::1) */
  compressed: string;
  /** 8グループの16進数配列 (各4桁) */
  groups: string[];
  /** 8グループの2進数配列 (各16桁) */
  binaryGroups: string[];
  /** コロンなしの16進数文字列 (32桁) */
  hexadecimal: string;
  /** アドレスタイプ */
  type: IPv6AddressType;
  /** アドレスタイプ日本語ラベル */
  typeLabel: string;
  /** アドレスタイプ説明 */
  typeDescription: string;
  /** IPv4射影アドレスか */
  isIPv4Mapped: boolean;
  /** 射影されたIPv4アドレス (IPv4射影の場合のみ) */
  ipv4Mapped: string | null;
  /** ゾーンID (リンクローカルのインターフェース識別子) */
  scopeId: string | null;
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/** 1グループを検証し4桁小文字にパディング */
function validateAndPadGroup(group: string): string {
  if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
    throw new Error(`不正なIPv6グループ: "${group}"`);
  }
  return group.toLowerCase().padStart(4, "0");
}

/**
 * :: を展開して targetGroups 数の配列にする
 */
function expandDoubleColon(address: string, targetGroups: number): string[] {
  if (address === "") {
    return Array(targetGroups).fill("0000");
  }

  const hasDoubleColon = address.includes("::");

  if (hasDoubleColon) {
    const parts = address.split("::");
    if (parts.length !== 2) {
      throw new Error("不正なIPv6アドレスです (:: が複数あります)");
    }

    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];

    const missing = targetGroups - left.length - right.length;
    if (missing < 0) {
      throw new Error("不正なIPv6アドレスです (グループ数が多すぎます)");
    }

    const middle = Array(missing).fill("0000");
    return [...left, ...middle, ...right].map(validateAndPadGroup);
  } else {
    const groups = address.split(":");
    if (groups.length !== targetGroups) {
      throw new Error(
        `不正なIPv6アドレスです (グループ数が ${targetGroups} である必要があります。実際: ${groups.length})`,
      );
    }
    return groups.map(validateAndPadGroup);
  }
}

/**
 * IPv6アドレスを8グループの16進数配列に正規化する
 * IPv4射影形式 (::ffff:192.168.1.1) も処理する
 */
function normalizeToGroups(address: string): string[] {
  // ゾーンIDを除去
  const zoneIdx = address.indexOf("%");
  const addr = zoneIdx !== -1 ? address.slice(0, zoneIdx) : address;

  // IPv4末尾形式を検出 (::ffff:192.168.1.1 や ::192.168.1.1)
  const ipv4Suffix = addr.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipv4Suffix) {
    const prefix = ipv4Suffix[1].replace(/:$/, "");
    const ipv4 = ipv4Suffix[2];
    const octets = ipv4.split(".").map((n) => {
      const num = parseInt(n, 10);
      if (num < 0 || num > 255) throw new Error(`不正なIPv4オクテット: ${n}`);
      return num;
    });
    const ipv4Groups = [
      ((octets[0] << 8) | octets[1]).toString(16).padStart(4, "0"),
      ((octets[2] << 8) | octets[3]).toString(16).padStart(4, "0"),
    ];
    const prefixGroups = expandDoubleColon(prefix, 6);
    return [...prefixGroups, ...ipv4Groups];
  }

  return expandDoubleColon(addr, 8);
}

/**
 * IPv6アドレスのタイプを判定する
 */
function detectType(groups: string[]): {
  type: IPv6AddressType;
  label: string;
  description: string;
} {
  const first = parseInt(groups[0], 16);

  // 未指定アドレス: ::/128
  if (groups.every((g) => g === "0000")) {
    return {
      type: "unspecified",
      label: "未指定アドレス",
      description: "::/128 — アドレス未指定。初期化前のソースアドレスとして使用されます。",
    };
  }

  // ループバック: ::1/128
  if (groups.slice(0, 7).every((g) => g === "0000") && groups[7] === "0001") {
    return {
      type: "loopback",
      label: "ループバックアドレス",
      description: "::1/128 — 自ホスト宛通信用（IPv4 の 127.0.0.1 に相当）。",
    };
  }

  // IPv4射影アドレス: ::ffff:x.x.x.x  (::ffff:0:0/96)
  if (groups.slice(0, 5).every((g) => g === "0000") && groups[5] === "ffff") {
    return {
      type: "ipv4-mapped",
      label: "IPv4射影アドレス",
      description:
        "::ffff:0:0/96 — IPv6ソケットでIPv4アドレスを表現する形式。デュアルスタック実装で使用。",
    };
  }

  // IPv4互換アドレス (非推奨): ::x.x.x.x  (::/96 のうち未指定・ループバック除く)
  if (
    groups.slice(0, 6).every((g) => g === "0000") &&
    (groups[6] !== "0000" || groups[7] !== "0000") &&
    groups[5] !== "ffff"
  ) {
    return {
      type: "ipv4-compatible",
      label: "IPv4互換アドレス (非推奨)",
      description: "::/96 — 廃止されたIPv4互換形式 (RFC 4291)。現在は使用されません。",
    };
  }

  // リンクローカル: fe80::/10
  if ((first & 0xffc0) === 0xfe80) {
    return {
      type: "link-local",
      label: "リンクローカルアドレス",
      description:
        "fe80::/10 — 同一リンク（セグメント）内通信専用。ルーターを越えません。自動設定されます。",
    };
  }

  // ユニークローカル: fc00::/7
  if ((first & 0xfe00) === 0xfc00) {
    return {
      type: "unique-local",
      label: "ユニークローカルアドレス",
      description:
        "fc00::/7 — プライベートネットワーク用（IPv4 の 10.x.x.x / 192.168.x.x に相当）。",
    };
  }

  // マルチキャスト: ff00::/8
  if ((first & 0xff00) === 0xff00) {
    return {
      type: "multicast",
      label: "マルチキャストアドレス",
      description:
        "ff00::/8 — マルチキャスト通信用。スコープ（リンク/サイト/グローバル等）で範囲を制御。",
    };
  }

  // ドキュメント用: 2001:db8::/32
  if (groups[0] === "2001" && groups[1] === "0db8") {
    return {
      type: "documentation",
      label: "ドキュメント用アドレス",
      description:
        "2001:db8::/32 (RFC 3849) — ドキュメント・サンプル専用。実際の通信では使用できません。",
    };
  }

  // ベンチマーク用: 2001:2::/48
  if (groups[0] === "2001" && groups[1] === "0002" && parseInt(groups[2], 16) < 0x0100) {
    return {
      type: "benchmarking",
      label: "ベンチマーク用アドレス",
      description: "2001:2::/48 (RFC 5180) — ネットワーク性能測定専用。",
    };
  }

  // グローバルユニキャスト: 2000::/3
  if ((first & 0xe000) === 0x2000) {
    return {
      type: "global-unicast",
      label: "グローバルユニキャストアドレス",
      description: "2000::/3 — インターネット上でグローバルにルーティング可能なアドレス。",
    };
  }

  // その他
  return {
    type: "global-unicast",
    label: "グローバルユニキャストアドレス",
    description: "2000::/3 — インターネット上でグローバルにルーティング可能なアドレス。",
  };
}

// ---------------------------------------------------------------------------
// パブリック API
// ---------------------------------------------------------------------------

/**
 * IPv6アドレスを展開形式（完全な 0000:0001:... 形式）に変換する
 */
export function expandIPv6(address: string): string {
  const groups = normalizeToGroups(address.trim());
  return groups.join(":");
}

/**
 * IPv6アドレスを RFC 5952 準拠の最短圧縮形式に変換する
 */
export function compressIPv6(address: string): string {
  const groups = normalizeToGroups(address.trim());

  // 連続するゼログループのうち最長のものを検出
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === "0000") {
      if (currentStart === -1) {
        currentStart = i;
        currentLen = 1;
      } else {
        currentLen++;
      }
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  }

  // 先頭ゼロを除去
  const shortGroups = groups.map((g) => parseInt(g, 16).toString(16));

  if (bestLen < 2) {
    return shortGroups.join(":");
  }

  const before = shortGroups.slice(0, bestStart);
  const after = shortGroups.slice(bestStart + bestLen);

  if (before.length === 0 && after.length === 0) return "::";
  if (before.length === 0) return "::" + after.join(":");
  if (after.length === 0) return before.join(":") + "::";
  return before.join(":") + "::" + after.join(":");
}

/**
 * IPv6アドレスのバリデーション
 * @returns 有効な場合 true
 */
export function isValidIPv6(address: string): boolean {
  try {
    parseIPv6(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * IPv6アドレスを解析し IPv6Info を返す
 * @throws 不正なアドレスの場合 Error
 */
export function parseIPv6(address: string): IPv6Info {
  const trimmed = address.trim();
  if (!trimmed) throw new Error("アドレスを入力してください");

  // ゾーンID抽出
  const zoneIdx = trimmed.indexOf("%");
  const scopeId = zoneIdx !== -1 ? trimmed.slice(zoneIdx + 1) : null;

  const groups = normalizeToGroups(trimmed);
  if (groups.length !== 8) throw new Error("不正なIPv6アドレスです");

  const expanded = groups.join(":");
  const compressed = compressIPv6(trimmed);
  const hexadecimal = groups.join("");
  const binaryGroups = groups.map((g) => parseInt(g, 16).toString(2).padStart(16, "0"));

  const typeInfo = detectType(groups);

  // IPv4射影アドレスの場合、埋め込まれたIPv4を抽出
  let ipv4Mapped: string | null = null;
  if (typeInfo.type === "ipv4-mapped") {
    const p1 = parseInt(groups[6], 16);
    const p2 = parseInt(groups[7], 16);
    ipv4Mapped = `${(p1 >> 8) & 0xff}.${p1 & 0xff}.${(p2 >> 8) & 0xff}.${p2 & 0xff}`;
  }

  return {
    input: address,
    expanded,
    compressed,
    groups,
    binaryGroups,
    hexadecimal,
    type: typeInfo.type,
    typeLabel: typeInfo.label,
    typeDescription: typeInfo.description,
    isIPv4Mapped: typeInfo.type === "ipv4-mapped",
    ipv4Mapped,
    scopeId,
  };
}
