import { describe, it, expect } from 'vitest';
import { isValidIPv4, isValidIPv6 } from '../app/utils/validation';

describe('IP address validation', () => {

  describe('IPv4 validation', () => {
    it('should accept valid IPv4 address', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
    });

    it('should accept loopback address', () => {
      expect(isValidIPv4('127.0.0.1')).toBe(true);
    });

    it('should accept 0.0.0.0', () => {
      expect(isValidIPv4('0.0.0.0')).toBe(true);
    });

    it('should accept 255.255.255.255', () => {
      expect(isValidIPv4('255.255.255.255')).toBe(true);
    });

    it('should reject IP with out of range octet', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false);
    });

    it('should reject IP with too few octets', () => {
      expect(isValidIPv4('192.168.1')).toBe(false);
    });

    it('should reject IP with too many octets', () => {
      expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    });

    it('should reject IP with leading zeros', () => {
      expect(isValidIPv4('192.168.01.1')).toBe(false);
    });

    it('should reject IP with non-numeric characters', () => {
      expect(isValidIPv4('192.168.a.1')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidIPv4('')).toBe(false);
    });
  });

  describe('IPv6 validation', () => {
    it('should accept valid full IPv6 address', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should accept compressed IPv6 address', () => {
      expect(isValidIPv6('2001:db8::1')).toBe(true);
    });

    it('should accept loopback IPv6 address', () => {
      expect(isValidIPv6('::1')).toBe(true);
    });

    it('should accept all zeros compressed', () => {
      expect(isValidIPv6('::')).toBe(true);
    });

    it('should accept trailing compression', () => {
      expect(isValidIPv6('2001:db8::')).toBe(true);
    });

    it('should accept IPv4-mapped IPv6 prefix', () => {
      expect(isValidIPv6('::ffff:c000:280')).toBe(true);
    });

    it('should accept link-local address', () => {
      expect(isValidIPv6('fe80::1')).toBe(true);
    });

    it('should accept multicast address', () => {
      expect(isValidIPv6('ff02::1')).toBe(true);
    });

    it('should reject triple colons', () => {
      expect(isValidIPv6(':::')).toBe(false);
    });

    it('should reject trailing single colon', () => {
      expect(isValidIPv6('1:2:')).toBe(false);
    });

    it('should reject leading single colon', () => {
      expect(isValidIPv6(':1:2')).toBe(false);
    });

    it('should reject multiple double colons', () => {
      expect(isValidIPv6('2001::db8::1')).toBe(false);
    });

    it('should reject too many groups', () => {
      expect(isValidIPv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    });

    it('should reject too many groups with compression', () => {
      expect(isValidIPv6('1:2:3:4:5:6:7::8:9')).toBe(false);
    });

    it('should reject invalid IPv6 format', () => {
      expect(isValidIPv6('not-an-ipv6')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidIPv6('')).toBe(false);
    });

    it('should reject group with more than 4 hex digits', () => {
      expect(isValidIPv6('2001:0db8:85a3:00000:0000:8a2e:0370:7334')).toBe(false);
    });

    it('should reject invalid hex characters', () => {
      expect(isValidIPv6('2001:0db8:85a3:gggg:0000:8a2e:0370:7334')).toBe(false);
    });
  });
});
