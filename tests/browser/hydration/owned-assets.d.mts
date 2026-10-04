import type { Buffer } from "node:buffer";

export interface OwnedAssetPin {
  path: string;
  bytes: number;
  sha256: string;
}
export interface OwnedManifest {
  version: 1;
  sourceCommit: string;
  sourceTree: string;
  origin: string;
  entry: string;
  activeRoute: "/base64";
  activeChunk: string;
  assets: OwnedAssetPin[];
  sourceFiles: { path: string; gitBlob: string }[];
  routerManifest: {
    routes: Record<
      string,
      {
        preloads: string[];
        assets: { tag: string; attrs: Record<string, string | boolean>; children?: string }[];
      }
    >;
  };
}
export interface OwnedAssets {
  manifest: OwnedManifest;
  assets: Map<string, Buffer>;
}
export function validateOwnedManifest(manifest: unknown): OwnedManifest;
export function verifyOwnedAsset(asset: OwnedAssetPin, bytes: Uint8Array): Buffer;
export function loadOwnedManifest(): Promise<OwnedManifest>;
export function verifySourceSnapshot(repository: string, manifest: OwnedManifest): Promise<void>;
export function prepareOwnedAssets(
  cacheDir: string,
  options?: {
    manifest?: OwnedManifest;
    localDirectory?: string;
    fetchSource?: typeof fetch;
  },
): Promise<OwnedAssets>;
