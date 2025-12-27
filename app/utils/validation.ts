/**
 * Validation utilities for IP addresses and domains
 */

/**
 * Domain validation regex pattern
 * Matches valid domain names like example.com, sub.domain.co.uk
 */
export const domainRegex =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

/**
 * Validate an IPv4 address
 * @param ip - The IP address to validate
 * @returns true if valid IPv4, false otherwise
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Validate an IPv6 address
 * @param ip - The IP address to validate
 * @returns true if valid IPv6, false otherwise
 */
export function isValidIPv6(ip: string): boolean {
  if (!ip || ip.length < 2) return false;
  if (ip.includes(":::")) return false;
  if (
    (ip.startsWith(":") && !ip.startsWith("::")) ||
    (ip.endsWith(":") && !ip.endsWith("::"))
  ) {
    return false;
  }
  const doubleColonCount = (ip.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;
  const groups = ip.split(":");
  const hasDoubleColon = ip.includes("::");
  if (!hasDoubleColon && groups.length !== 8) return false;
  if (hasDoubleColon && groups.length > 9) return false;
  const hexGroupRegex = /^[0-9a-fA-F]{1,4}$/;
  for (const group of groups) {
    if (group === "") {
      if (!hasDoubleColon) return false;
      continue;
    }
    if (!hexGroupRegex.test(group)) return false;
  }
  return true;
}
