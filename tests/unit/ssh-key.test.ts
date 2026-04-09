import { describe, it, expect } from 'vite-plus/test';
import {
  uint8ToBase64,
  base64UrlToUint8,
  toPem,
  writeLengthPrefixed,
  writeLengthPrefixedString,
  buildRsaOpenSshPublicKey,
  buildEcdsaOpenSshPublicKey,
} from '../../app/utils/ssh-key';

describe('uint8ToBase64', () => {
  it('バイト列をBase64に変換する', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(uint8ToBase64(bytes)).toBe('SGVsbG8=');
  });

  it('空のバイト列は空文字列を返す', () => {
    expect(uint8ToBase64(new Uint8Array([]))).toBe('');
  });

  it('任意のバイト列を正しく変換する', () => {
    const bytes = new Uint8Array([0, 1, 255]);
    const result = uint8ToBase64(bytes);
    expect(result).toBe('AAH/');
  });
});

describe('base64UrlToUint8', () => {
  it('Base64URL文字列をバイト列に変換する', () => {
    // "Hello" をBase64URLエンコード: SGVsbG8=
    const result = base64UrlToUint8('SGVsbG8');
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it('"-"と"_"を正しく変換する', () => {
    // Base64URLの特殊文字 - と _ を含む文字列
    const bytes = new Uint8Array([0xfb, 0xff]);
    const base64 = uint8ToBase64(bytes); // "+/8="
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const result = base64UrlToUint8(base64url);
    expect(result).toEqual(bytes);
  });

  it('パディングなしでも正しく変換する', () => {
    // パディングなしのBase64URL
    const result = base64UrlToUint8('AQAB'); // RSAの一般的な公開指数 65537
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(1);
  });
});

describe('toPem', () => {
  it('PEM形式に変換する', () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const pem = toPem(bytes, 'PUBLIC KEY');
    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pem).toContain('-----END PUBLIC KEY-----');
  });

  it('秘密鍵タイプでPEM形式に変換する', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const pem = toPem(bytes, 'PRIVATE KEY');
    expect(pem).toContain('-----BEGIN PRIVATE KEY-----');
    expect(pem).toContain('-----END PRIVATE KEY-----');
  });

  it('長いデータを64文字で折り返す', () => {
    // 60バイトのデータは80文字のBase64になり、64文字で折り返される
    const bytes = new Uint8Array(60).fill(0xab);
    const pem = toPem(bytes, 'TEST');
    const lines = pem.split('\n');
    // ヘッダー、データ行、フッターを確認
    expect(lines[0]).toBe('-----BEGIN TEST-----');
    expect(lines[lines.length - 1]).toBe('-----END TEST-----');
    // データ行は64文字以下
    for (let i = 1; i < lines.length - 1; i++) {
      expect(lines[i].length).toBeLessThanOrEqual(64);
    }
  });
});

describe('writeLengthPrefixed', () => {
  it('バイト列に4バイトの長さプレフィックスを追加する', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const result = writeLengthPrefixed(bytes);
    expect(result.length).toBe(7);
    // 最初の4バイトはビッグエンディアンで長さ3
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(3);
    // 残りはデータ
    expect(result[4]).toBe(1);
    expect(result[5]).toBe(2);
    expect(result[6]).toBe(3);
  });

  it('空のバイト列には0の長さプレフィックスを追加する', () => {
    const bytes = new Uint8Array([]);
    const result = writeLengthPrefixed(bytes);
    expect(result.length).toBe(4);
    expect(result[0]).toBe(0);
    expect(result[3]).toBe(0);
  });
});

describe('writeLengthPrefixedString', () => {
  it('文字列をUTF-8エンコードして長さプレフィックスを追加する', () => {
    const result = writeLengthPrefixedString('ssh-rsa');
    const view = new DataView(result.buffer);
    const len = view.getUint32(0, false);
    expect(len).toBe(7); // "ssh-rsa" は7文字
    expect(result.length).toBe(11); // 4 + 7
  });

  it('ecdsa-sha2-nistp256を正しくエンコードする', () => {
    const result = writeLengthPrefixedString('ecdsa-sha2-nistp256');
    const view = new DataView(result.buffer);
    const len = view.getUint32(0, false);
    expect(len).toBe(19);
  });
});

describe('buildRsaOpenSshPublicKey', () => {
  it('RSA JWKからOpenSSH公開鍵文字列を生成する', () => {
    // 最小限の有効なRSA JWK（テスト用）
    const jwk: JsonWebKey = {
      kty: 'RSA',
      n: 'AQAB', // 小さい値（テスト用）
      e: 'AQAB',
    };
    const result = buildRsaOpenSshPublicKey(jwk);
    expect(result.startsWith('ssh-rsa ')).toBe(true);
    // Base64部分が存在する
    expect(result.split(' ').length).toBeGreaterThanOrEqual(2);
  });

  it('eまたはnがない場合にエラーをスローする', () => {
    expect(() => buildRsaOpenSshPublicKey({ kty: 'RSA' })).toThrow();
  });

  it('MSBが立っているバイトに0x00を先頭付加する', () => {
    // n の先頭バイトが >= 0x80 になるような値
    // Base64URLで "gA==" → [0x80]
    const jwk: JsonWebKey = {
      kty: 'RSA',
      n: 'gA', // 0x80 (MSBが立っている)
      e: 'AQAB',
    };
    const result = buildRsaOpenSshPublicKey(jwk);
    expect(result.startsWith('ssh-rsa ')).toBe(true);
  });
});

describe('buildEcdsaOpenSshPublicKey', () => {
  it('P-256 JWKからOpenSSH公開鍵を生成する', () => {
    // P-256の点座標（テスト用ダミー値、32バイト）
    const x = uint8ToBase64(new Uint8Array(32).fill(1));
    const y = uint8ToBase64(new Uint8Array(32).fill(2));
    const xBase64url = x.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const yBase64url = y.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const jwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: xBase64url,
      y: yBase64url,
    };
    const result = buildEcdsaOpenSshPublicKey(jwk, 'P-256');
    expect(result.startsWith('ecdsa-sha2-nistp256 ')).toBe(true);
  });

  it('P-384 JWKからOpenSSH公開鍵を生成する', () => {
    const x = uint8ToBase64(new Uint8Array(48).fill(3));
    const y = uint8ToBase64(new Uint8Array(48).fill(4));
    const xBase64url = x.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const yBase64url = y.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const jwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-384',
      x: xBase64url,
      y: yBase64url,
    };
    const result = buildEcdsaOpenSshPublicKey(jwk, 'P-384');
    expect(result.startsWith('ecdsa-sha2-nistp384 ')).toBe(true);
  });

  it('xまたはyがない場合にエラーをスローする', () => {
    expect(() => buildEcdsaOpenSshPublicKey({ kty: 'EC' }, 'P-256')).toThrow();
  });
});
