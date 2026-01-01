/**
 * CIDR calculation utilities
 * Provides functions for calculating network addresses, broadcast addresses,
 * subnet masks, and IP address ranges from CIDR notation.
 */

/**
 * Validate IPv4 address format
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
 * Validate CIDR notation (e.g., "192.168.1.0/24")
 */
export function isValidCIDR(cidr: string): boolean {
  const parts = cidr.split("/");
  if (parts.length !== 2) return false;

  const [ip, prefixStr] = parts;
  const prefix = parseInt(prefixStr, 10);

  if (!isValidIPv4(ip)) return false;
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  if (prefixStr !== prefix.toString()) return false; // Reject leading zeros

  return true;
}

/**
 * Convert IPv4 address string to 32-bit integer
 */
export function ipToInt(ip: string): number {
  const parts = ip.split(".");
  return (
    (parseInt(parts[0], 10) << 24) |
    (parseInt(parts[1], 10) << 16) |
    (parseInt(parts[2], 10) << 8) |
    parseInt(parts[3], 10)
  ) >>> 0; // Use unsigned right shift to ensure positive number
}

/**
 * Convert 32-bit integer to IPv4 address string
 */
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff,
  ].join(".");
}

/**
 * Calculate subnet mask from prefix length
 */
export function prefixToSubnetMask(prefix: number): string {
  if (prefix === 0) return "0.0.0.0";
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

/**
 * Calculate network address from IP and prefix
 */
export function calculateNetworkAddress(ip: string, prefix: number): string {
  const ipInt = ipToInt(ip);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  return intToIp(networkInt);
}

/**
 * Calculate broadcast address from network address and prefix
 */
export function calculateBroadcastAddress(
  networkAddress: string,
  prefix: number
): string {
  const networkInt = ipToInt(networkAddress);
  const hostBits = 32 - prefix;
  const broadcastInt = (networkInt | ((1 << hostBits) - 1)) >>> 0;
  return intToIp(broadcastInt);
}

/**
 * Calculate first usable IP address (network address + 1)
 */
export function calculateFirstUsableIP(networkAddress: string): string {
  const networkInt = ipToInt(networkAddress);
  return intToIp(networkInt + 1);
}

/**
 * Calculate last usable IP address (broadcast address - 1)
 */
export function calculateLastUsableIP(broadcastAddress: string): string {
  const broadcastInt = ipToInt(broadcastAddress);
  return intToIp(broadcastInt - 1);
}

/**
 * Calculate total number of IP addresses in the network
 */
export function calculateTotalHosts(prefix: number): number {
  return Math.pow(2, 32 - prefix);
}

/**
 * Calculate number of usable IP addresses (total - 2 for network and broadcast)
 * For /31 (point-to-point) and /32 (single host), special rules apply
 */
export function calculateUsableHosts(prefix: number): number {
  if (prefix === 32) return 1; // Single host
  if (prefix === 31) return 2; // Point-to-point link (RFC 3021)
  return Math.pow(2, 32 - prefix) - 2;
}

/**
 * CIDR calculation result interface
 */
export interface CIDRResult {
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  firstUsableIP: string;
  lastUsableIP: string;
  totalHosts: number;
  usableHosts: number;
  wildcardMask: string;
  binarySubnetMask: string;
  ipClass: string;
  isPrivate: boolean;
}

/**
 * Calculate wildcard mask (inverse of subnet mask)
 */
export function calculateWildcardMask(subnetMask: string): string {
  const maskInt = ipToInt(subnetMask);
  const wildcardInt = (~maskInt) >>> 0;
  return intToIp(wildcardInt);
}

/**
 * Convert subnet mask to binary string with dots
 */
export function subnetMaskToBinary(subnetMask: string): string {
  const parts = subnetMask.split(".");
  return parts
    .map((part) => parseInt(part, 10).toString(2).padStart(8, "0"))
    .join(".");
}

/**
 * Determine IP address class (A, B, C, D, E)
 */
export function getIPClass(ip: string): string {
  const firstOctet = parseInt(ip.split(".")[0], 10);

  if (firstOctet >= 1 && firstOctet <= 126) return "A";
  if (firstOctet >= 128 && firstOctet <= 191) return "B";
  if (firstOctet >= 192 && firstOctet <= 223) return "C";
  if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
  if (firstOctet >= 240 && firstOctet <= 255) return "E (Reserved)";

  return "Unknown";
}

/**
 * Check if IP address is in private range
 */
export function isPrivateIP(ip: string): boolean {
  const ipInt = ipToInt(ip);

  // 10.0.0.0/8
  if (ipInt >= ipToInt("10.0.0.0") && ipInt <= ipToInt("10.255.255.255"))
    return true;

  // 172.16.0.0/12
  if (ipInt >= ipToInt("172.16.0.0") && ipInt <= ipToInt("172.31.255.255"))
    return true;

  // 192.168.0.0/16
  if (ipInt >= ipToInt("192.168.0.0") && ipInt <= ipToInt("192.168.255.255"))
    return true;

  return false;
}

/**
 * Calculate all information for a CIDR block
 */
export function calculateCIDR(cidr: string): CIDRResult {
  if (!isValidCIDR(cidr)) {
    throw new Error("Invalid CIDR notation");
  }

  const [ip, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);

  const networkAddress = calculateNetworkAddress(ip, prefix);
  const broadcastAddress = calculateBroadcastAddress(networkAddress, prefix);
  const subnetMask = prefixToSubnetMask(prefix);
  const firstUsableIP =
    prefix === 32 || prefix === 31
      ? networkAddress
      : calculateFirstUsableIP(networkAddress);
  const lastUsableIP =
    prefix === 32 || prefix === 31
      ? broadcastAddress
      : calculateLastUsableIP(broadcastAddress);
  const totalHosts = calculateTotalHosts(prefix);
  const usableHosts = calculateUsableHosts(prefix);
  const wildcardMask = calculateWildcardMask(subnetMask);
  const binarySubnetMask = subnetMaskToBinary(subnetMask);
  const ipClass = getIPClass(networkAddress);
  const isPrivate = isPrivateIP(networkAddress);

  return {
    cidr,
    networkAddress,
    broadcastAddress,
    subnetMask,
    firstUsableIP,
    lastUsableIP,
    totalHosts,
    usableHosts,
    wildcardMask,
    binarySubnetMask,
    ipClass,
    isPrivate,
  };
}
