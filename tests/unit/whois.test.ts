import { describe, it, expect } from 'vitest';

describe('Domain validation regex', () => {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  it('should match valid domain', () => {
    expect(domainRegex.test('example.com')).toBe(true);
  });

  it('should match subdomain', () => {
    expect(domainRegex.test('sub.example.com')).toBe(true);
  });

  it('should match multi-level subdomain', () => {
    expect(domainRegex.test('a.b.c.example.com')).toBe(true);
  });

  it('should not match domain without TLD', () => {
    expect(domainRegex.test('example')).toBe(false);
  });

  it('should not match domain starting with hyphen', () => {
    expect(domainRegex.test('-example.com')).toBe(false);
  });

  it('should not match domain with invalid characters', () => {
    expect(domainRegex.test('test@domain.com')).toBe(false);
  });

  it('should match domain with numbers', () => {
    expect(domainRegex.test('123.example.com')).toBe(true);
  });

  it('should match domain with hyphen in middle', () => {
    expect(domainRegex.test('my-example.com')).toBe(true);
  });
});
