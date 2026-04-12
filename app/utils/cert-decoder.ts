/**
 * X.509 証明書デコーダーユーティリティ
 * PEM/DER 形式の X.509 証明書を解析して各フィールドを抽出します
 * 外部ライブラリ不要 - ブラウザ内 Web Crypto API のみ使用
 */

/** OID → 名前マッピング */
const OID_MAP: Record<string, string> = {
  // Subject/Issuer 属性
  "2.5.4.3": "CN",
  "2.5.4.4": "SN",
  "2.5.4.5": "serialNumber",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.9": "streetAddress",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.17": "postalCode",
  "1.2.840.113549.1.9.1": "emailAddress",
  // 署名アルゴリズム
  "1.2.840.113549.1.1.1": "rsaEncryption",
  "1.2.840.113549.1.1.4": "md5WithRSAEncryption",
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.10045.2.1": "ecPublicKey",
  "1.2.840.10045.4.3.1": "ecdsa-with-SHA224",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
  // EC 曲線
  "1.2.840.10045.3.1.7": "P-256",
  "1.3.132.0.34": "P-384",
  "1.3.132.0.35": "P-521",
  // 拡張
  "2.5.29.14": "subjectKeyIdentifier",
  "2.5.29.15": "keyUsage",
  "2.5.29.17": "subjectAltName",
  "2.5.29.19": "basicConstraints",
  "2.5.29.31": "cRLDistributionPoints",
  "2.5.29.32": "certificatePolicies",
  "2.5.29.35": "authorityKeyIdentifier",
  "2.5.29.37": "extendedKeyUsage",
  "1.3.6.1.5.5.7.1.1": "authorityInfoAccess",
  "1.3.6.1.5.5.7.3.1": "id-kp-serverAuth",
  "1.3.6.1.5.5.7.3.2": "id-kp-clientAuth",
  "1.3.6.1.5.5.7.3.3": "id-kp-codeSigning",
  "1.3.6.1.5.5.7.3.4": "id-kp-emailProtection",
  "1.3.6.1.5.5.7.3.8": "id-kp-timeStamping",
};

/** 識別名 (Distinguished Name) */
export interface DistinguishedName {
  CN?: string;
  C?: string;
  L?: string;
  ST?: string;
  O?: string;
  OU?: string;
  [key: string]: string | undefined;
}

/** 解析済み証明書情報 */
export interface CertificateInfo {
  /** 証明書バージョン (1, 2, 3) */
  version: number;
  /** シリアル番号 (16進数) */
  serialNumber: string;
  /** サブジェクト */
  subject: DistinguishedName;
  /** 発行者 */
  issuer: DistinguishedName;
  /** 有効期限 開始 */
  validFrom: Date;
  /** 有効期限 終了 */
  validTo: Date;
  /** 署名アルゴリズム */
  signatureAlgorithm: string;
  /** 公開鍵アルゴリズム */
  publicKeyAlgorithm: string;
  /** 公開鍵サイズ (RSA: ビット数, EC: ビット数) */
  publicKeySize?: number;
  /** EC 曲線名 */
  publicKeyCurve?: string;
  /** Subject Alternative Names */
  sans: string[];
  /** 鍵用途 */
  keyUsage: string[];
  /** 拡張鍵用途 */
  extendedKeyUsage: string[];
  /** CA フラグ */
  isCA: boolean;
  /** パス長制約 */
  pathLenConstraint?: number;
  /** フィンガープリント */
  fingerprints: {
    sha1: string;
    sha256: string;
  };
  /** 有効期限までの日数 (負の値 = 期限切れ) */
  daysUntilExpiry: number;
  /** 期限切れフラグ */
  isExpired: boolean;
}

// ASN.1 DER タグ定数
const T_BOOL = 0x01;
const T_INT = 0x02;
const T_BITS = 0x03;
const T_OCTET = 0x04;
const T_OID = 0x06;
const T_SEQ = 0x30;
const _T_SET = 0x31;
const _T_UTF8STR = 0x0c;
const _T_PRINTSTR = 0x13;
const _T_IA5STR = 0x16;
const T_UTCTIME = 0x17;
const T_GENTIME = 0x18;
const _T_BMPSTR = 0x1e;

interface AsnNode {
  tag: number;
  valueStart: number;
  valueEnd: number;
}

/** DER ノードを読み取る */
function readNode(d: Uint8Array, offset: number): AsnNode {
  const tag = d[offset];
  let p = offset + 1;
  let len: number;
  if (d[p] < 0x80) {
    len = d[p++];
  } else {
    const nb = d[p++] & 0x7f;
    len = 0;
    for (let i = 0; i < nb; i++) len = len * 256 + d[p++];
  }
  return { tag, valueStart: p, valueEnd: p + len };
}

/** SEQUENCE/SET の子ノード一覧を返す */
function readChildren(d: Uint8Array, start: number, end: number): AsnNode[] {
  const nodes: AsnNode[] = [];
  let pos = start;
  while (pos < end) {
    const n = readNode(d, pos);
    nodes.push(n);
    pos = n.valueEnd;
  }
  return nodes;
}

/** OID バイト列をドット表記文字列にデコードする */
export function decodeOid(d: Uint8Array, start: number, end: number): string {
  const parts: number[] = [];
  let i = start;
  if (i >= end) return "";
  const first = d[i++];
  parts.push(Math.floor(first / 40), first % 40);
  while (i < end) {
    let v = 0;
    let b: number;
    do {
      b = d[i++];
      v = (v << 7) | (b & 0x7f);
    } while (b & 0x80);
    parts.push(v);
  }
  return parts.join(".");
}

/** DER 文字列ノードをデコードする */
function decodeStr(d: Uint8Array, tag: number, start: number, end: number): string {
  const slice = d.slice(start, end);
  if (tag === 0x1e /* BMPString */) return new TextDecoder("utf-16be").decode(slice);
  return new TextDecoder().decode(slice);
}

/** UTCTime / GeneralizedTime を Date にデコードする */
export function decodeTime(d: Uint8Array, tag: number, start: number, end: number): Date {
  const s = new TextDecoder().decode(d.slice(start, end));
  if (tag === T_UTCTIME) {
    const yr = parseInt(s.slice(0, 2));
    return new Date(
      Date.UTC(
        yr >= 50 ? 1900 + yr : 2000 + yr,
        parseInt(s.slice(2, 4)) - 1,
        parseInt(s.slice(4, 6)),
        parseInt(s.slice(6, 8)),
        parseInt(s.slice(8, 10)),
        parseInt(s.slice(10, 12)),
      ),
    );
  }
  return new Date(
    Date.UTC(
      parseInt(s.slice(0, 4)),
      parseInt(s.slice(4, 6)) - 1,
      parseInt(s.slice(6, 8)),
      parseInt(s.slice(8, 10)),
      parseInt(s.slice(10, 12)),
      parseInt(s.slice(12, 14)),
    ),
  );
}

/** バイト列を16進数文字列に変換する */
export function bytesToHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

/** 16進数文字列をコロン区切りにフォーマットする */
export function hexWithColon(hex: string): string {
  return (hex.match(/.{1,2}/g) ?? []).join(":");
}

/** Name (RDN の SEQUENCE) を解析する */
function parseName(d: Uint8Array, start: number, end: number): DistinguishedName {
  const result: DistinguishedName = {};
  let pos = start;
  while (pos < end) {
    const rdnNode = readNode(d, pos);
    pos = rdnNode.valueEnd;
    let rdnPos = rdnNode.valueStart;
    while (rdnPos < rdnNode.valueEnd) {
      const atavNode = readNode(d, rdnPos);
      rdnPos = atavNode.valueEnd;
      const children = readChildren(d, atavNode.valueStart, atavNode.valueEnd);
      if (children.length >= 2) {
        const oidNode = children[0];
        const valNode = children[1];
        const oid = decodeOid(d, oidNode.valueStart, oidNode.valueEnd);
        const attrName = OID_MAP[oid] ?? oid;
        const value = decodeStr(d, valNode.tag, valNode.valueStart, valNode.valueEnd);
        result[attrName] = value;
      }
    }
  }
  return result;
}

/** Subject Alternative Name 拡張を解析する */
function parseSAN(d: Uint8Array, start: number, end: number): string[] {
  const result: string[] = [];
  let pos = start;
  while (pos < end) {
    const n = readNode(d, pos);
    pos = n.valueEnd;
    const type = n.tag & 0x1f;
    const str = new TextDecoder().decode(d.slice(n.valueStart, n.valueEnd));
    switch (type) {
      case 1:
        result.push(`email:${str}`);
        break;
      case 2:
        result.push(str);
        break;
      case 6:
        result.push(`uri:${str}`);
        break;
      case 7: {
        const bytes = d.slice(n.valueStart, n.valueEnd);
        if (bytes.length === 4) {
          result.push(Array.from(bytes).join("."));
        } else if (bytes.length === 16) {
          const hex = bytesToHex(bytes);
          const parts = hex.match(/.{1,4}/g) ?? [];
          result.push(parts.join(":"));
        }
        break;
      }
    }
  }
  return result;
}

/** KeyUsage 拡張を解析する */
function parseKeyUsage(d: Uint8Array, start: number, end: number): string[] {
  const NAMES = [
    "digitalSignature",
    "nonRepudiation",
    "keyEncipherment",
    "dataEncipherment",
    "keyAgreement",
    "keyCertSign",
    "cRLSign",
    "encipherOnly",
    "decipherOnly",
  ];
  const result: string[] = [];
  if (start + 1 >= end) return result;
  // BIT STRING: 最初の1バイトは未使用ビット数
  const byte1 = d[start + 1] ?? 0;
  const byte2 = end > start + 2 ? d[start + 2] : 0;
  const bits = (byte1 << 8) | byte2;
  for (let i = 0; i < 9; i++) {
    if (bits & (0x8000 >> i)) result.push(NAMES[i]);
  }
  return result;
}

/** ExtendedKeyUsage 拡張を解析する */
function parseEKU(d: Uint8Array, start: number, end: number): string[] {
  const result: string[] = [];
  let pos = start;
  while (pos < end) {
    const n = readNode(d, pos);
    pos = n.valueEnd;
    if (n.tag === T_OID) {
      const oid = decodeOid(d, n.valueStart, n.valueEnd);
      result.push(OID_MAP[oid] ?? oid);
    }
  }
  return result;
}

/** BasicConstraints 拡張を解析する */
function parseBasicConstraints(
  d: Uint8Array,
  start: number,
  end: number,
): { isCA: boolean; pathLen?: number } {
  let isCA = false;
  let pathLen: number | undefined;
  let booleanSeen = false;
  let pos = start;
  while (pos < end) {
    const n = readNode(d, pos);
    pos = n.valueEnd;
    if (n.tag === T_BOOL) {
      isCA = d[n.valueStart] !== 0;
      booleanSeen = true;
    } else if (n.tag === T_INT) {
      if (!booleanSeen) {
        // 非標準エンコーディング: 一部の古い実装では BOOLEAN の代わりに
        // INTEGER を使って cA フラグを表現することがある (例: INTEGER 1 = TRUE)
        const valLen = n.valueEnd - n.valueStart;
        const val = valLen === 1 ? d[n.valueStart] : 0;
        if (val !== 0) {
          isCA = true;
        } else {
          pathLen = 0;
          for (let i = n.valueStart; i < n.valueEnd; i++) {
            pathLen = pathLen * 256 + d[i];
          }
        }
      } else {
        pathLen = 0;
        for (let i = n.valueStart; i < n.valueEnd; i++) {
          pathLen = pathLen * 256 + d[i];
        }
      }
    }
  }
  return { isCA, pathLen };
}

/**
 * PEM 文字列を DER バイト列に変換する
 */
export function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * PEM / DER 形式の X.509 証明書を解析する
 * @param input PEM 文字列または DER バイト列
 * @throws 無効な証明書の場合エラーをスロー
 */
export async function parseCertificate(input: string | Uint8Array): Promise<CertificateInfo> {
  let der: Uint8Array;

  if (typeof input === "string") {
    const trimmed = input.trim();
    try {
      der = pemToDer(trimmed);
    } catch {
      throw new Error("PEM 証明書のデコードに失敗しました。正しい PEM 形式か確認してください。");
    }
  } else {
    der = input;
  }

  if (der.length < 4) {
    throw new Error("証明書データが短すぎます");
  }

  // フィンガープリント計算
  const [sha1Buf, sha256Buf] = await Promise.all([
    crypto.subtle.digest("SHA-1", der as BufferSource),
    crypto.subtle.digest("SHA-256", der as BufferSource),
  ]);
  const sha1 = hexWithColon(bytesToHex(new Uint8Array(sha1Buf)));
  const sha256 = hexWithColon(bytesToHex(new Uint8Array(sha256Buf)));

  // --- DER 解析 ---
  const certNode = readNode(der, 0);
  if (certNode.tag !== T_SEQ) {
    throw new Error("有効な X.509 証明書ではありません（外側は SEQUENCE である必要があります）");
  }

  const certChildren = readChildren(der, certNode.valueStart, certNode.valueEnd);
  if (certChildren.length < 3) throw new Error("証明書の構造が不正です");

  // TBSCertificate
  const tbsNode = certChildren[0];
  if (tbsNode.tag !== T_SEQ) throw new Error("TBSCertificate が見つかりません");

  // signatureAlgorithm (outer)
  const sigAlgNode = certChildren[1];
  let signatureAlgorithm = "unknown";
  if (sigAlgNode.tag === T_SEQ) {
    const algChildren = readChildren(der, sigAlgNode.valueStart, sigAlgNode.valueEnd);
    if (algChildren.length > 0 && algChildren[0].tag === T_OID) {
      const oid = decodeOid(der, algChildren[0].valueStart, algChildren[0].valueEnd);
      signatureAlgorithm = OID_MAP[oid] ?? oid;
    }
  }

  // --- TBSCertificate を解析 ---
  let version = 1;
  let serialNumber = "";
  let issuer: DistinguishedName = {};
  let validFrom = new Date();
  let validTo = new Date();
  let subject: DistinguishedName = {};
  let publicKeyAlgorithm = "unknown";
  let publicKeySize: number | undefined;
  let publicKeyCurve: string | undefined;
  let sans: string[] = [];
  let keyUsage: string[] = [];
  let extendedKeyUsage: string[] = [];
  let isCA = false;
  let pathLenConstraint: number | undefined;

  const tbsChildren = readChildren(der, tbsNode.valueStart, tbsNode.valueEnd);
  let idx = 0;

  // version [0] EXPLICIT (オプション)
  if (tbsChildren.length > idx && tbsChildren[idx].tag === 0xa0) {
    const vNode = tbsChildren[idx++];
    const vChildren = readChildren(der, vNode.valueStart, vNode.valueEnd);
    if (vChildren.length > 0 && vChildren[0].tag === T_INT) {
      version = der[vChildren[0].valueStart] + 1;
    }
  }

  // serialNumber
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_INT) {
    const sn = tbsChildren[idx++];
    const snBytes = der.slice(sn.valueStart, sn.valueEnd);
    // 先頭の 0x00 は符号パディング
    const snStart = snBytes[0] === 0x00 ? 1 : 0;
    serialNumber = bytesToHex(snBytes.slice(snStart));
  }

  // signature AlgorithmIdentifier (TBSCertificate 内 - outer と同じ内容なのでスキップ)
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_SEQ) idx++;

  // issuer
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_SEQ) {
    const issuerNode = tbsChildren[idx++];
    issuer = parseName(der, issuerNode.valueStart, issuerNode.valueEnd);
  }

  // validity
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_SEQ) {
    const valNode = tbsChildren[idx++];
    const valChildren = readChildren(der, valNode.valueStart, valNode.valueEnd);
    if (valChildren.length >= 2) {
      const nb = valChildren[0];
      const na = valChildren[1];
      if (nb.tag === T_UTCTIME || nb.tag === T_GENTIME) {
        validFrom = decodeTime(der, nb.tag, nb.valueStart, nb.valueEnd);
      }
      if (na.tag === T_UTCTIME || na.tag === T_GENTIME) {
        validTo = decodeTime(der, na.tag, na.valueStart, na.valueEnd);
      }
    }
  }

  // subject
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_SEQ) {
    const subjectNode = tbsChildren[idx++];
    subject = parseName(der, subjectNode.valueStart, subjectNode.valueEnd);
  }

  // subjectPublicKeyInfo
  if (tbsChildren.length > idx && tbsChildren[idx].tag === T_SEQ) {
    const spkiNode = tbsChildren[idx++];
    const spkiChildren = readChildren(der, spkiNode.valueStart, spkiNode.valueEnd);

    if (spkiChildren.length >= 1 && spkiChildren[0].tag === T_SEQ) {
      const algNode = spkiChildren[0];
      const algChildren = readChildren(der, algNode.valueStart, algNode.valueEnd);

      if (algChildren.length > 0 && algChildren[0].tag === T_OID) {
        const algOid = decodeOid(der, algChildren[0].valueStart, algChildren[0].valueEnd);
        publicKeyAlgorithm = OID_MAP[algOid] ?? algOid;

        // EC 曲線情報
        if (
          algOid === "1.2.840.10045.2.1" &&
          algChildren.length > 1 &&
          algChildren[1].tag === T_OID
        ) {
          const curveOid = decodeOid(der, algChildren[1].valueStart, algChildren[1].valueEnd);
          publicKeyCurve = OID_MAP[curveOid] ?? curveOid;
          if (curveOid === "1.2.840.10045.3.1.7") publicKeySize = 256;
          else if (curveOid === "1.3.132.0.34") publicKeySize = 384;
          else if (curveOid === "1.3.132.0.35") publicKeySize = 521;
        }

        // Ed25519 / Ed448
        if (algOid === "1.3.101.112") {
          publicKeyAlgorithm = "Ed25519";
          publicKeySize = 256;
        }
        if (algOid === "1.3.101.113") {
          publicKeyAlgorithm = "Ed448";
          publicKeySize = 448;
        }
      }
    }

    // RSA 鍵長を modulus から算出
    if (
      publicKeyAlgorithm === "rsaEncryption" &&
      spkiChildren.length >= 2 &&
      spkiChildren[1].tag === T_BITS
    ) {
      const bitsNode = spkiChildren[1];
      // BIT STRING の先頭1バイトは未使用ビット数
      const bitsPos = bitsNode.valueStart + 1;
      const rsaPubNode = readNode(der, bitsPos);
      if (rsaPubNode.tag === T_SEQ) {
        const rsaChildren = readChildren(der, rsaPubNode.valueStart, rsaPubNode.valueEnd);
        // タグは INTEGER (0x02) が標準だが、非標準実装では他のタグになる場合もある
        if (rsaChildren.length > 0) {
          const modNode = rsaChildren[0];
          const modLen = modNode.valueEnd - modNode.valueStart;
          const effLen = der[modNode.valueStart] === 0x00 ? modLen - 1 : modLen;
          publicKeySize = effLen * 8;
        }
      }
    }
  }

  // issuerUniqueID [1], subjectUniqueID [2] をスキップ
  while (
    idx < tbsChildren.length &&
    (tbsChildren[idx].tag === 0xa1 || tbsChildren[idx].tag === 0xa2)
  ) {
    idx++;
  }

  // Extensions [3] EXPLICIT
  // 構造: [3] EXPLICIT { SEQUENCE OF Extension }
  // ctxChildren[0] が Extensions SEQUENCE、その子が個々の Extension
  if (idx < tbsChildren.length && tbsChildren[idx].tag === 0xa3) {
    const extCtxNode = tbsChildren[idx];
    const ctxChildren = readChildren(der, extCtxNode.valueStart, extCtxNode.valueEnd);
    const extSeqChildren =
      ctxChildren.length > 0 && ctxChildren[0].tag === T_SEQ
        ? readChildren(der, ctxChildren[0].valueStart, ctxChildren[0].valueEnd)
        : [];

    for (const extSeq of extSeqChildren) {
      if (extSeq.tag !== T_SEQ) continue;
      const extFields = readChildren(der, extSeq.valueStart, extSeq.valueEnd);
      if (extFields.length < 2) continue;

      const oidNode = extFields[0];
      if (oidNode.tag !== T_OID) continue;
      const oid = decodeOid(der, oidNode.valueStart, oidNode.valueEnd);

      // OCTET STRING を探す (critical BOOLEAN がある場合もある)
      let octetNode: AsnNode | null = null;
      for (let i = 1; i < extFields.length; i++) {
        if (extFields[i].tag === T_OCTET) {
          octetNode = extFields[i];
          break;
        }
      }
      if (!octetNode) continue;

      // 拡張値は OCTET STRING 内に DER でネストされている
      const extValNode = readNode(der, octetNode.valueStart);

      switch (oid) {
        case "2.5.29.17": // subjectAltName
          if (extValNode.tag === T_SEQ) {
            sans = parseSAN(der, extValNode.valueStart, extValNode.valueEnd);
          }
          break;
        case "2.5.29.15": // keyUsage
          if (extValNode.tag === T_BITS) {
            keyUsage = parseKeyUsage(der, extValNode.valueStart, extValNode.valueEnd);
          }
          break;
        case "2.5.29.37": // extendedKeyUsage
          if (extValNode.tag === T_SEQ) {
            extendedKeyUsage = parseEKU(der, extValNode.valueStart, extValNode.valueEnd);
          }
          break;
        case "2.5.29.19": // basicConstraints
          if (extValNode.tag === T_SEQ) {
            const bc = parseBasicConstraints(der, extValNode.valueStart, extValNode.valueEnd);
            isCA = bc.isCA;
            pathLenConstraint = bc.pathLen;
          }
          break;
      }
    }
  }

  const now = new Date();
  const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = now > validTo;

  return {
    version,
    serialNumber,
    subject,
    issuer,
    validFrom,
    validTo,
    signatureAlgorithm,
    publicKeyAlgorithm,
    publicKeySize,
    publicKeyCurve,
    sans,
    keyUsage,
    extendedKeyUsage,
    isCA,
    pathLenConstraint,
    fingerprints: { sha1, sha256 },
    daysUntilExpiry,
    isExpired,
  };
}

/** DistinguishedName を人間が読みやすい文字列に変換する */
export function formatDN(dn: DistinguishedName): string {
  const order = ["CN", "O", "OU", "L", "ST", "C"];
  const parts: string[] = [];
  for (const key of order) {
    if (dn[key]) parts.push(`${key}=${dn[key]}`);
  }
  // 上記以外のフィールドも追加
  for (const [key, val] of Object.entries(dn)) {
    if (!order.includes(key) && val) parts.push(`${key}=${val}`);
  }
  return parts.join(", ");
}
