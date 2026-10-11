import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadOwnedManifest,
  prepareOwnedAssets,
  validateOwnedManifest,
  verifyOwnedAsset,
  verifySourceSnapshot,
  type OwnedManifest,
} from "../browser/hydration/owned-assets.mjs";

const body = Buffer.from("export const diagnostic = true;");
const digest = createHash("sha256").update(body).digest("hex");
const directories: string[] = [];

function fixture(): OwnedManifest {
  return {
    version: 1,
    sourceCommit: "a".repeat(40),
    sourceTree: "b".repeat(40),
    origin: "https://tools.0g0.xyz",
    entry: "/assets/main-diagnostic.js",
    activeRoute: "/base64",
    activeChunk: "/assets/base64-diagnostic.js",
    assets: ["main", "base64"].map((name) => ({
      path: `/assets/${name}-diagnostic.js`,
      bytes: body.length,
      sha256: digest,
    })),
    sourceFiles: [
      {
        path: "package.json",
        gitBlob: createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex"),
      },
    ],
    routerManifest: {
      routes: {
        __root__: {
          preloads: ["/assets/main-diagnostic.js"],
          assets: [
            {
              tag: "script",
              attrs: { type: "module", async: true },
              children: 'import("/assets/main-diagnostic.js")',
            },
          ],
        },
        "/base64": {
          preloads: ["/assets/base64-diagnostic.js"],
          assets: [
            {
              tag: "link",
              attrs: { rel: "stylesheet", href: "/assets/base64-diagnostic.css" },
            },
          ],
        },
      },
    },
  };
}

async function directory() {
  const path = await mkdtemp(join(tmpdir(), "tools-owned-hydration-"));
  directories.push(path);
  return path;
}

function response(value: BodyInit | null = body.toString()) {
  return new Response(value, { headers: { "content-type": "text/javascript; charset=utf-8" } });
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("pinned production hydration assets", () => {
  it("validates the checked-in exact owned snapshot without request identifiers", async () => {
    const manifest = await loadOwnedManifest();
    expect(manifest.assets).toHaveLength(43);
    expect(manifest.sourceCommit).toBe("9a0f02f2620e52dc82ac7d7b09e0b6aec0e53ad4");
    expect(JSON.stringify(manifest)).not.toMatch(/ca-pub-|cdn-cgi|cloudflareinsights|token=/);
  });

  it.each([
    "https://other.invalid/asset.js",
    "/assets/../outside.js",
    "/assets/%2e%2e/outside.js",
    "/assets/main.js?secret=value",
    "/assets/main.js#fragment",
    "/assets/main.css",
  ])("rejects non-owned or ambiguous paths: %s", (path) => {
    const manifest = fixture();
    manifest.assets[0].path = path;
    expect(() => validateOwnedManifest(manifest)).toThrow("Invalid owned asset pin");
  });

  it.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER, 2 * 1024 * 1024 + 1])(
    "rejects invalid pinned sizes: %s",
    (bytes) => {
      const manifest = fixture();
      manifest.assets[0].bytes = bytes;
      expect(() => validateOwnedManifest(manifest)).toThrow("Invalid owned asset pin");
    },
  );

  it("rejects wrong origin, duplicate pins, and malformed digests", () => {
    const origin = fixture();
    origin.origin = "https://other.invalid";
    expect(() => validateOwnedManifest(origin)).toThrow("Invalid owned production manifest");
    const duplicate = fixture();
    duplicate.assets.push(duplicate.assets[0]);
    expect(() => validateOwnedManifest(duplicate)).toThrow("Invalid owned asset pin");
    const hash = fixture();
    hash.assets[0].sha256 = "unknown";
    expect(() => validateOwnedManifest(hash)).toThrow("Invalid owned asset pin");
  });

  it("requires the owned entry, active chunk, and every route preload to be pinned", () => {
    const entry = fixture();
    entry.entry = "/assets/unknown.js";
    expect(() => validateOwnedManifest(entry)).toThrow("not pinned");
    const preload = fixture();
    preload.routerManifest.routes.__root__.preloads.push("/assets/unknown.js");
    expect(() => validateOwnedManifest(preload)).toThrow("not pinned");
  });

  it("rejects extra routes, external stylesheets, and altered executable route assets", () => {
    const routes = fixture();
    routes.routerManifest.routes["/unrelated"] = { assets: [], preloads: [] };
    expect(() => validateOwnedManifest(routes)).toThrow("Unexpected diagnostic route manifest");
    const style = fixture();
    style.routerManifest.routes["/base64"].assets[0].attrs.href = "https://other.invalid/style.css";
    expect(() => validateOwnedManifest(style)).toThrow("Unexpected route asset or script");
    const script = fixture();
    script.routerManifest.routes.__root__.assets[0].children = "untrusted()";
    expect(() => validateOwnedManifest(script)).toThrow("Unexpected route asset or script");
    const extra = fixture();
    extra.routerManifest.routes.__root__.assets.push(
      extra.routerManifest.routes.__root__.assets[0],
    );
    expect(() => validateOwnedManifest(extra)).toThrow("exactly one owned entry");
  });

  it("verifies exact bytes and rejects same-length mutations", () => {
    const pin = fixture().assets[0];
    expect(verifyOwnedAsset(pin, body)).toEqual(body);
    expect(() => verifyOwnedAsset(pin, Buffer.alloc(body.length))).toThrow("integrity mismatch");
    expect(() => verifyOwnedAsset(pin, Buffer.alloc(0))).toThrow("integrity mismatch");
  });

  it("checks source and package pins without accepting changed or missing files", async () => {
    const root = await directory();
    const manifest = fixture();
    await expect(verifySourceSnapshot(root, manifest)).rejects.toThrow("unavailable");
    await writeFile(join(root, "package.json"), body);
    await expect(verifySourceSnapshot(root, manifest)).resolves.toBeUndefined();
    await writeFile(join(root, "package.json"), Buffer.alloc(body.length));
    await expect(verifySourceSnapshot(root, manifest)).rejects.toThrow("changed");
  });

  it("rejects absent, ambiguous, duplicate, or malformed source pins", () => {
    for (const path of ["../package.json", "app/../outside.ts", "app/file.ts?query", ".env"]) {
      const manifest = fixture();
      manifest.sourceFiles[0].path = path;
      expect(() => validateOwnedManifest(manifest)).toThrow("Invalid source snapshot pin");
    }
    const absent = fixture();
    absent.sourceFiles = [];
    expect(() => validateOwnedManifest(absent)).toThrow("Missing source snapshot pins");
    const duplicate = fixture();
    duplicate.sourceFiles.push(duplicate.sourceFiles[0]);
    expect(() => validateOwnedManifest(duplicate)).toThrow("Invalid source snapshot pin");
    const malformed = fixture();
    malformed.sourceFiles[0].gitBlob = "unknown";
    expect(() => validateOwnedManifest(malformed)).toThrow("Invalid source snapshot pin");
  });

  it("reads only owned GET URLs, refuses redirects, and re-verifies cached bytes", async () => {
    const cache = await directory();
    const fetchSource = vi.fn(async () => response()) as unknown as typeof fetch;
    const manifest = fixture();
    const first = await prepareOwnedAssets(cache, { manifest, fetchSource });
    expect(first.assets.size).toBe(2);
    expect(fetchSource).toHaveBeenCalledTimes(1);
    expect(fetchSource).toHaveBeenCalledWith(`${manifest.origin}${manifest.entry}`, {
      method: "GET",
      redirect: "error",
      signal: expect.any(AbortSignal),
    });
    expect(await readFile(join(cache, `${digest}.js`))).toEqual(body);
    const unusedFetch = vi.fn() as unknown as typeof fetch;
    expect(
      (await prepareOwnedAssets(cache, { manifest, fetchSource: unusedFetch })).assets.size,
    ).toBe(2);
    expect(unusedFetch).not.toHaveBeenCalled();
    await writeFile(join(cache, `${digest}.js`), Buffer.alloc(body.length));
    await expect(prepareOwnedAssets(cache, { manifest, fetchSource: unusedFetch })).rejects.toThrow(
      "integrity mismatch",
    );
    expect(unusedFetch).not.toHaveBeenCalled();
  });

  it.each([403, 404, 429, 500])(
    "stops a failed source read without retries: %s",
    async (status) => {
      const fetchSource = vi.fn(
        async () => new Response("", { status }),
      ) as unknown as typeof fetch;
      await expect(
        prepareOwnedAssets(await directory(), { manifest: fixture(), fetchSource }),
      ).rejects.toThrow(`status ${status}`);
      expect(fetchSource).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects changed response URLs, HTML, absent bodies, and empty responses", async () => {
    const redirected = response();
    Object.defineProperty(redirected, "url", { value: "https://other.invalid/asset.js" });
    for (const [value, error] of [
      [redirected, "URL changed"],
      [new Response("html", { headers: { "content-type": "text/html" } }), "not JavaScript"],
      [response(null), "no body"],
      [response(""), "integrity mismatch"],
    ] as const) {
      const fetchSource = vi.fn(async () => value) as unknown as typeof fetch;
      await expect(
        prepareOwnedAssets(await directory(), { manifest: fixture(), fetchSource }),
      ).rejects.toThrow(error);
      expect(fetchSource).toHaveBeenCalledTimes(1);
    }
  });

  it("cancels oversized streamed bodies before saving them", async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Buffer.alloc(body.length + 1));
      },
      cancel: cancelled,
    });
    const fetchSource = vi.fn(async () => response(stream)) as unknown as typeof fetch;
    const cache = await directory();
    await expect(prepareOwnedAssets(cache, { manifest: fixture(), fetchSource })).rejects.toThrow(
      "exceeds its pinned size",
    );
    expect(cancelled).toHaveBeenCalledTimes(1);
    await expect(readFile(join(cache, `${digest}.js`))).rejects.toThrow();
  });

  it("propagates failed or redirected fetches without a fallback", async () => {
    const fetchSource = vi.fn(async () => {
      throw new Error("redirect rejected");
    }) as unknown as typeof fetch;
    await expect(
      prepareOwnedAssets(await directory(), { manifest: fixture(), fetchSource }),
    ).rejects.toThrow("redirect rejected");
    expect(fetchSource).toHaveBeenCalledTimes(1);
  });

  it("can materialize independently verified local bytes without network", async () => {
    const local = await directory();
    await writeFile(join(local, "main-diagnostic.js"), body);
    await writeFile(join(local, "base64-diagnostic.js"), body);
    const fetchSource = vi.fn() as unknown as typeof fetch;
    const result = await prepareOwnedAssets(await directory(), {
      manifest: fixture(),
      localDirectory: local,
      fetchSource,
    });
    expect(result.assets.size).toBe(2);
    expect(fetchSource).not.toHaveBeenCalled();
  });
});
