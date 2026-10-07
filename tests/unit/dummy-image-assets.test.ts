import { Buffer } from "node:buffer";
import { describe, expect, it } from "vite-plus/test";
import {
  createImageAssetFetch,
  loadLockedImageAsset,
  validateLockedImageAsset,
} from "../fixtures/dummy-image-assets";

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm";
const FONT_URL = "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2";

describe("Dummy image offline asset fixture", () => {
  it("uses the exact locked version and authentic installed WASM bytes", async () => {
    const asset = loadLockedImageAsset();
    expect(asset.installedVersion).toBe(asset.lockVersion);
    expect(asset.lockVersion).toBe("2.6.2");
    const fixture = createImageAssetFetch(asset);
    const response = await fixture.fetchAsset(WASM_URL);
    expect(response.headers.get("Content-Type")).toBe("application/wasm");
    expect(
      Buffer.compare(Buffer.from(await response.arrayBuffer()), Buffer.from(asset.bytes)),
    ).toBe(0);
    expect(fixture.unexpectedRequests()).toEqual([]);
  });

  it("rejects mismatched version or WASM content before a fixture can hide it", () => {
    const asset = loadLockedImageAsset();
    expect(() => validateLockedImageAsset({ ...asset, installedVersion: "0.0.0" })).toThrow(
      "version mismatch",
    );
    expect(() => validateLockedImageAsset({ ...asset, lockVersion: "0.0.0" })).toThrow(
      "version mismatch",
    );
    const altered = Uint8Array.from(asset.bytes);
    altered[0] ^= 1;
    expect(() => createImageAssetFetch({ ...asset, bytes: altered })).toThrow("checksum mismatch");
  });

  it("explicitly rejects the known font without pretending to have loaded Roboto", async () => {
    const fixture = createImageAssetFetch(loadLockedImageAsset());
    await expect(fixture.fetchAsset(FONT_URL)).rejects.toThrow("missing-font fallback");
    expect(fixture.unexpectedRequests()).toEqual([]);
  });

  it.each([
    ["https://example.invalid/unknown.wasm", "GET"],
    ["https://unpkg.com/@resvg/resvg-wasm@0.0.0/index_bg.wasm", "GET"],
    [WASM_URL + "?changed=1", "GET"],
    [WASM_URL, "POST"],
  ])(
    "fails and records unexpected %s %s requests even if a caller catches the error",
    async (url, method) => {
      const fixture = createImageAssetFetch(loadLockedImageAsset());
      await expect(fixture.fetchAsset(url, { method })).rejects.toThrow("Unexpected asset request");
      expect(fixture.unexpectedRequests()).toEqual([`${method} ${url}`]);
      const snapshot = fixture.unexpectedRequests();
      snapshot.pop();
      expect(fixture.unexpectedRequests()).toHaveLength(1);
    },
  );
});
