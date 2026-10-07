import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm";
const FONT_URL = "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2";
const RESVG_VERSION = "2.6.2";
const RESVG_WASM_SHA256 = "22bf6e9f9a100d972da0411a69c5ba504367fc1fa87b3b64e3f35e53926d2d70";

export interface LockedImageAsset {
  installedVersion: string;
  lockVersion: string;
  bytes: Uint8Array<ArrayBuffer>;
}

/** Validate the installed asset against the committed package and known locked bytes. */
export function validateLockedImageAsset(asset: LockedImageAsset): void {
  if (asset.installedVersion !== asset.lockVersion || asset.lockVersion !== RESVG_VERSION) {
    throw new Error("Locked resvg test asset version mismatch");
  }
  if (createHash("sha256").update(asset.bytes).digest("hex") !== RESVG_WASM_SHA256) {
    throw new Error("Locked resvg test asset checksum mismatch");
  }
}

/** Read the exported official package WASM; never download a mutable CDN asset. */
export function loadLockedImageAsset(): LockedImageAsset {
  const wasmPath = fileURLToPath(import.meta.resolve("@resvg/resvg-wasm/index_bg.wasm"));
  const packageMetadata = JSON.parse(
    readFileSync(path.join(path.dirname(wasmPath), "package.json"), "utf8"),
  ) as { version: string };
  const lock = JSON.parse(
    readFileSync(fileURLToPath(new URL("../../package-lock.json", import.meta.url)), "utf8"),
  ) as { packages: Record<string, { version: string }> };
  const asset = {
    installedVersion: packageMetadata.version,
    lockVersion: lock.packages["node_modules/@resvg/resvg-wasm"].version,
    bytes: Uint8Array.from(readFileSync(wasmPath)),
  };
  validateLockedImageAsset(asset);
  return asset;
}

/**
 * Strict offline test transport. The real renderers still run; Roboto deliberately
 * fails through the production null-font fallback. This does not test the CDN,
 * real font appearance, or Cloudflare loading behavior. No native fetch is called.
 */
export function createImageAssetFetch(asset: LockedImageAsset) {
  validateLockedImageAsset(asset);
  const unexpected: string[] = [];
  const fetchAsset: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    if (method.toUpperCase() !== "GET" || (url !== WASM_URL && url !== FONT_URL)) {
      unexpected.push(`${method} ${url}`);
      throw new Error("Unexpected asset request in offline image test");
    }
    if (url === FONT_URL) {
      throw new Error("Offline image test intentionally exercises the missing-font fallback");
    }
    return new Response(asset.bytes.buffer, { headers: { "Content-Type": "application/wasm" } });
  };
  return { fetchAsset, unexpectedRequests: () => [...unexpected] };
}
