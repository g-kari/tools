/**
 * IP address format conversion utilities
 * Supports conversion between decimal, hexadecimal, binary, and integer formats
 */

import { isValidIPv4, ipToInt, intToIp } from "./cidr";

/**
 * IP conversion result interface
 */
export interface IPConversionResult {
  decimal: string; // 192.168.1.1
  hexDotted: string; // C0.A8.01.01
  hexSolid: string; // 0xC0A80101
  binaryDotted: string; // 11000000.10101000.00000001.00000001
  binarySolid: string; // 11000000101010000000000100000001
  integer: number; // 3232235777
}

/**
 * Convert IPv4 address to hexadecimal dotted notation (e.g., "C0.A8.01.01")
 */
export function ipToHexDotted(ip: string): string {
  const parts = ip.split(".");
  return parts
    .map((part) => parseInt(part, 10).toString(16).toUpperCase().padStart(2, "0"))
    .join(".");
}

/**
 * Convert IPv4 address to hexadecimal solid notation (e.g., "0xC0A80101")
 */
export function ipToHexSolid(ip: string): string {
  const int = ipToInt(ip);
  return "0x" + int.toString(16).toUpperCase().padStart(8, "0");
}

/**
 * Convert IPv4 address to binary dotted notation
 */
export function ipToBinaryDotted(ip: string): string {
  const parts = ip.split(".");
  return parts
    .map((part) => parseInt(part, 10).toString(2).padStart(8, "0"))
    .join(".");
}

/**
 * Convert IPv4 address to binary solid notation (32-bit string)
 */
export function ipToBinarySolid(ip: string): string {
  const parts = ip.split(".");
  return parts
    .map((part) => parseInt(part, 10).toString(2).padStart(8, "0"))
    .join("");
}

/**
 * Convert hexadecimal dotted notation to decimal IP (e.g., "C0.A8.01.01" -> "192.168.1.1")
 */
export function hexDottedToIp(hex: string): string {
  const parts = hex.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid hexadecimal dotted notation");
  }

  const octets = parts.map((part) => {
    const num = parseInt(part, 16);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error("Invalid hexadecimal value");
    }
    return num.toString();
  });

  return octets.join(".");
}

/**
 * Convert hexadecimal solid notation to decimal IP (e.g., "0xC0A80101" -> "192.168.1.1")
 */
export function hexSolidToIp(hex: string): string {
  // Remove 0x prefix if present
  const cleanHex = hex.replace(/^0x/i, "");

  // Validate hex string
  if (!/^[0-9a-fA-F]{1,8}$/.test(cleanHex)) {
    throw new Error("Invalid hexadecimal notation");
  }

  const int = parseInt(cleanHex, 16);
  if (int > 0xffffffff) {
    throw new Error("Hexadecimal value exceeds IPv4 range");
  }

  return intToIp(int);
}

/**
 * Convert binary dotted notation to decimal IP
 */
export function binaryDottedToIp(binary: string): string {
  const parts = binary.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid binary dotted notation");
  }

  const octets = parts.map((part) => {
    if (!/^[01]+$/.test(part)) {
      throw new Error("Invalid binary value");
    }
    const num = parseInt(part, 2);
    if (num > 255) {
      throw new Error("Binary value exceeds octet range");
    }
    return num.toString();
  });

  return octets.join(".");
}

/**
 * Convert binary solid notation to decimal IP
 */
export function binarySolidToIp(binary: string): string {
  // Remove spaces if present
  const cleanBinary = binary.replace(/\s/g, "");

  // Validate binary string
  if (!/^[01]{1,32}$/.test(cleanBinary)) {
    throw new Error("Invalid binary notation");
  }

  // Pad to 32 bits if necessary
  const paddedBinary = cleanBinary.padStart(32, "0");

  // Split into 4 octets
  const octets = [];
  for (let i = 0; i < 32; i += 8) {
    const octet = paddedBinary.substring(i, i + 8);
    octets.push(parseInt(octet, 2).toString());
  }

  return octets.join(".");
}

/**
 * Detect input format and convert to all formats
 */
export function convertIP(input: string): IPConversionResult {
  const trimmedInput = input.trim();

  // Try decimal dotted notation (192.168.1.1) first if it's valid decimal
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmedInput)) {
    if (isValidIPv4(trimmedInput)) {
      const decimal = trimmedInput;
      return {
        decimal,
        hexDotted: ipToHexDotted(decimal),
        hexSolid: ipToHexSolid(decimal),
        binaryDotted: ipToBinaryDotted(decimal),
        binarySolid: ipToBinarySolid(decimal),
        integer: ipToInt(decimal),
      };
    }
    // If it looks like decimal but is invalid, check if it might be hex
    // (e.g., "00.00.00.00" has leading zeros)
    if (/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(trimmedInput) &&
        trimmedInput.split('.').some(part => part.length > 1 && part.startsWith('0'))) {
      // Has leading zeros, might be hex - fall through
    } else {
      // Looks like decimal but invalid (e.g., "256.1.1.1")
      throw new Error("無効なIPアドレスです");
    }
  }

  // Try hexadecimal dotted notation (C0.A8.01.01 or c0.a8.01.01)
  if (/^[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2}\.[0-9a-fA-F]{1,2}$/.test(trimmedInput)) {
    const decimal = hexDottedToIp(trimmedInput);
    return {
      decimal,
      hexDotted: ipToHexDotted(decimal),
      hexSolid: ipToHexSolid(decimal),
      binaryDotted: ipToBinaryDotted(decimal),
      binarySolid: ipToBinarySolid(decimal),
      integer: ipToInt(decimal),
    };
  }

  // Try hexadecimal solid notation (0xC0A80101 or C0A80101)
  // Must be exactly 8 hex digits without 0x, or with 0x prefix
  if (/^(0x[0-9a-fA-F]{1,8}|[0-9a-fA-F]{8})$/i.test(trimmedInput)) {
    const decimal = hexSolidToIp(trimmedInput);
    return {
      decimal,
      hexDotted: ipToHexDotted(decimal),
      hexSolid: ipToHexSolid(decimal),
      binaryDotted: ipToBinaryDotted(decimal),
      binarySolid: ipToBinarySolid(decimal),
      integer: ipToInt(decimal),
    };
  }

  // Try binary dotted notation (11000000.10101000.00000001.00000001)
  if (/^[01]+\.[01]+\.[01]+\.[01]+$/.test(trimmedInput)) {
    const decimal = binaryDottedToIp(trimmedInput);
    return {
      decimal,
      hexDotted: ipToHexDotted(decimal),
      hexSolid: ipToHexSolid(decimal),
      binaryDotted: ipToBinaryDotted(decimal),
      binarySolid: ipToBinarySolid(decimal),
      integer: ipToInt(decimal),
    };
  }

  // Try binary solid notation (11000000101010000000000100000001)
  if (/^[01]+$/.test(trimmedInput)) {
    const decimal = binarySolidToIp(trimmedInput);
    return {
      decimal,
      hexDotted: ipToHexDotted(decimal),
      hexSolid: ipToHexSolid(decimal),
      binaryDotted: ipToBinaryDotted(decimal),
      binarySolid: ipToBinarySolid(decimal),
      integer: ipToInt(decimal),
    };
  }

  // Try integer notation (3232235777)
  if (/^\d+$/.test(trimmedInput)) {
    const int = parseInt(trimmedInput, 10);
    if (int < 0 || int > 0xffffffff) {
      throw new Error("整数値がIPv4の範囲を超えています");
    }
    const decimal = intToIp(int);
    return {
      decimal,
      hexDotted: ipToHexDotted(decimal),
      hexSolid: ipToHexSolid(decimal),
      binaryDotted: ipToBinaryDotted(decimal),
      binarySolid: ipToBinarySolid(decimal),
      integer: int,
    };
  }

  throw new Error("認識できない形式です");
}
