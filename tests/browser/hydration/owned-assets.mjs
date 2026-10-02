import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const assetPathPattern = /^\/assets\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.js$/;
const stylesheetPathPattern = /^\/assets\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.css$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

/** Validate the bounded, checked-in production snapshot before any network read. */
export function validateOwnedManifest(manifest) {
  if (
    manifest?.version !== 1 ||
    manifest.origin !== "https://tools.0g0.xyz" ||
    manifest.activeRoute !== "/base64" ||
    !/^[a-f0-9]{40}$/.test(manifest.sourceCommit ?? "") ||
    !/^[a-f0-9]{40}$/.test(manifest.sourceTree ?? "") ||
    !Array.isArray(manifest.assets) ||
    manifest.assets.length === 0
  ) {
    throw new Error("Invalid owned production manifest");
  }
  const paths = new Set();
  for (const asset of manifest.assets) {
    if (
      !assetPathPattern.test(asset.path ?? "") ||
      paths.has(asset.path) ||
      !sha256Pattern.test(asset.sha256 ?? "") ||
      !Number.isSafeInteger(asset.bytes) ||
      asset.bytes <= 0 ||
      asset.bytes > 2 * 1024 * 1024
    ) {
      throw new Error("Invalid owned asset pin");
    }
    paths.add(asset.path);
  }
  if (!paths.has(manifest.entry) || !paths.has(manifest.activeChunk)) {
    throw new Error("Owned entry or active chunk is not pinned");
  }
  if (!Array.isArray(manifest.sourceFiles) || manifest.sourceFiles.length === 0) {
    throw new Error("Missing source snapshot pins");
  }
  const sourcePaths = new Set();
  for (const source of manifest.sourceFiles) {
    if (
      !/^(?:app\/[A-Za-z0-9_/-]+\.tsx?|package(?:-lock)?\.json)$/.test(source.path ?? "") ||
      sourcePaths.has(source.path) ||
      !/^[a-f0-9]{40}$/.test(source.gitBlob ?? "")
    ) {
      throw new Error("Invalid source snapshot pin");
    }
    sourcePaths.add(source.path);
  }
  const routes = manifest.routerManifest?.routes;
  if (!routes || Object.keys(routes).sort().join(",") !== "/base64,__root__") {
    throw new Error("Unexpected diagnostic route manifest");
  }
  let entryCount = 0;
  for (const route of Object.values(routes)) {
    if (!Array.isArray(route.preloads) || !Array.isArray(route.assets)) {
      throw new Error("Invalid diagnostic route assets");
    }
    for (const preload of route.preloads) {
      if (!paths.has(preload)) throw new Error("Route preload is not pinned");
    }
    for (const asset of route.assets) {
      if (
        asset.tag === "link" &&
        asset.attrs?.rel === "stylesheet" &&
        stylesheetPathPattern.test(asset.attrs?.href ?? "")
      ) {
        continue;
      }
      if (
        asset.tag === "script" &&
        asset.attrs?.type === "module" &&
        asset.attrs?.async === true &&
        Object.keys(asset.attrs).sort().join(",") === "async,type" &&
        asset.children === `import(${JSON.stringify(manifest.entry)})`
      ) {
        entryCount += 1;
        continue;
      }
      throw new Error("Unexpected route asset or script");
    }
  }
  if (entryCount !== 1) throw new Error("Expected exactly one owned entry script");
  return manifest;
}

/** Verify bytes against both size and SHA-256; caches never relax integrity. */
export function verifyOwnedAsset(asset, bytes) {
  if (
    bytes.byteLength !== asset.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== asset.sha256
  ) {
    throw new Error(`Owned asset integrity mismatch: ${asset.path}`);
  }
  return Buffer.from(bytes);
}

/** Load only static asset metadata, never a captured production HTML response. */
export async function loadOwnedManifest() {
  return validateOwnedManifest(
    JSON.parse(await readFile(new URL("./owned-assets.json", import.meta.url), "utf8")),
  );
}

/** Fail closed if any generated SSR graph source or dependency snapshot drifted. */
export async function verifySourceSnapshot(repository, manifest) {
  validateOwnedManifest(manifest);
  for (const source of manifest.sourceFiles) {
    let bytes;
    try {
      bytes = await readFile(join(repository, source.path));
    } catch {
      throw new Error(`Source snapshot is unavailable: ${source.path}`);
    }
    const gitBlob = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    if (gitBlob !== source.gitBlob) {
      throw new Error(`Source snapshot changed: ${source.path}`);
    }
  }
}

/** Read a response with the exact pinned length as a hard streaming ceiling. */
async function readPinnedBody(response, expectedBytes) {
  if (!response.body) throw new Error("Owned asset response has no body");
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > expectedBytes) {
        await reader.cancel();
        throw new Error("Owned asset response exceeds its pinned size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

/**
 * Materialize hash-pinned, public owned JS for isolated hosted Chromium tests.
 * A denied, redirected, altered, or unavailable snapshot fails without retry.
 */
export async function prepareOwnedAssets(cacheDir, options = {}) {
  const manifest = validateOwnedManifest(options.manifest ?? (await loadOwnedManifest()));
  const fetchSource = options.fetchSource ?? fetch;
  const assets = new Map();
  await mkdir(cacheDir, { recursive: true });
  for (const asset of manifest.assets) {
    const cachePath = join(cacheDir, `${asset.sha256}.js`);
    let bytes;
    try {
      bytes = await readFile(cachePath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (options.localDirectory) {
        bytes = await readFile(join(options.localDirectory, basename(asset.path)));
      } else {
        const url = `${manifest.origin}${asset.path}`;
        const response = await fetchSource(url, {
          method: "GET",
          redirect: "error",
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok || response.status !== 200) {
          throw new Error(`Owned asset read failed with status ${response.status}: ${asset.path}`);
        }
        if (response.url && response.url !== url) {
          throw new Error("Owned asset response URL changed");
        }
        const type = response.headers.get("content-type")?.split(";", 1)[0].trim();
        if (type !== "text/javascript" && type !== "application/javascript") {
          throw new Error("Owned asset response is not JavaScript");
        }
        bytes = await readPinnedBody(response, asset.bytes);
      }
      bytes = verifyOwnedAsset(asset, bytes);
      await writeFile(cachePath, bytes);
    }
    assets.set(asset.path, verifyOwnedAsset(asset, bytes));
  }
  return { manifest, assets };
}
