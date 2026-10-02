import type { OwnedManifest } from "./owned-assets.mjs";

export const FIXTURE_ORIGIN: string;
export function generateSsrFixture(input: {
  manifest: OwnedManifest;
  assets: Map<string, Buffer>;
  repository?: string;
}): Promise<{
  html: string;
  diagnosticAssets: Map<string, Buffer>;
  diagnostics: Record<string, unknown>;
}>;
