import type { OwnedManifest } from "./owned-assets.mjs";
export class LiveResponseRejected extends Error {
  code: string;
  diagnostics?: Record<string, unknown>;
}
export function prepareLiveResponse(input: {
  status: number;
  responseUrl: string;
  contentType: string | undefined;
  mitigated?: boolean;
  html: Buffer;
  manifest: OwnedManifest;
  repository: string;
  ownedStylesheetPaths?: Set<string>;
  trustedGeneratedHtml: string;
}): Promise<{
  html: string;
  observedExternalScriptUrls: Set<string>;
  observedExternalStylesheetUrls: Set<string>;
  diagnostics: Record<string, unknown>;
}>;
export function containLiveResponseHeaders(headers: Record<string, string>): {
  headers: Record<string, string>;
  diagnostics: Record<string, unknown>;
};
