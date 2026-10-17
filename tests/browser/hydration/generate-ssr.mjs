/**
 * Diagnostic-only SSR. No production response HTML or request state is read.
 * Generated HTML and publisher constants stay in memory and must not be saved.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { verifySourceSnapshot } from "./owned-assets.mjs";

export const FIXTURE_ORIGIN = "https://hydration.invalid";
const defaultRepository = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Fail closed if Node resolves a different renderer/SSR helper than the Worker build. */
export function verifyCloudflareSsrExports() {
  const resolutions = [
    ["react-dom/server", "/react-dom/server.browser.js"],
    ["@tanstack/router-core/isServer", "/isServer/server.js"],
    ["@tanstack/router-core/scroll-restoration-script", "/scroll-restoration-script/client.js"],
  ];
  if (resolutions.some(([name, suffix]) => !import.meta.resolve(name).endsWith(suffix))) {
    throw new Error("Cloudflare SSR conditional exports are not selected");
  }
  return {
    renderer: "ReactDOM renderToReadableStream",
    isServer: "server export",
    scrollRestorationScript: "browser null export",
    buildConditions: ["workerd", "worker", "module", "browser"],
  };
}

/** Fail closed when a pinned diagnostic instrumentation site changes. */
function replaceExactly(source, search, replacement, expectedCount, label) {
  const count = source.split(search).length - 1;
  if (count !== expectedCount) {
    throw new Error(
      `Pinned ${label} instrumentation changed (expected ${expectedCount} sites, got ${count})`,
    );
  }
  return source.split(search).join(replacement);
}

/** Read literal build constants only; never execute the downloaded module. */
function readBuildConstants(assets) {
  const siteAssets = [...assets.keys()].filter((path) => /^\/assets\/site-[\w-]+\.js$/.test(path));
  if (siteAssets.length !== 1) throw new Error("Expected one pinned site-constants asset");
  const code = assets.get(siteAssets[0]).toString("utf8");
  const exportList = code.match(/export\{([^}]+)\};?$/)?.[1];
  if (!exportList) throw new Error("Pinned site constant exports changed");
  const literalForExport = (exportName) => {
    const variable = exportList.match(new RegExp(`(?:^|,)([\\w$]+) as ${exportName}(?:,|$)`))?.[1];
    if (!variable) throw new Error("Pinned site constant mapping changed");
    const match = code.match(new RegExp(`\\b${variable}=([\x60"'])([^\x60"'\\\\]*)\\1`));
    if (!match || match[2].includes("${")) throw new Error("Pinned site constant literal changed");
    return match[2];
  };
  // These export aliases belong to the hash-pinned production module, not an
  // environment/account configuration. Values are never returned as metadata.
  const publisher = literalForExport("t");
  const slot = literalForExport("n");
  if (!/^ca-pub-\d+$/.test(publisher) || !/^[\w-]+$/.test(slot)) {
    throw new Error("Pinned site constants no longer match the expected format");
  }
  return { publisher, slot, assetPath: siteAssets[0] };
}

/** Clone two verified assets in memory; originals and original hashes survive. */
function instrumentAssets(manifest, assets) {
  const entry = assets.get(manifest.entry)?.toString("utf8");
  const reactPaths = [...assets.keys()].filter((path) =>
    /^\/assets\/react-dom-[\w-]+\.js$/.test(path),
  );
  if (!entry || reactPaths.length !== 1) throw new Error("Pinned entry/ReactDOM asset missing");
  const reactPath = reactPaths[0];
  const react = assets.get(reactPath).toString("utf8");
  const entryTail = "(0,pr.hydrateRoot)(document,(0,V.jsx)(bb,{router:xb}));";
  if (!entry.endsWith(entryTail)) throw new Error("Pinned production hydrateRoot tail changed");
  const diagnosticEntry = replaceExactly(
    entry,
    entryTail,
    "globalThis.__toolsHydration.beforeHydrate();globalThis.__toolsHydration.root=(0,pr.hydrateRoot)(document,(0,V.jsx)(bb,{router:xb}),{onRecoverableError:globalThis.__toolsHydration.recoverable});",
    1,
    "entry",
  );
  let diagnosticReact = replaceExactly(
    react,
    "if(za(e))throw Error(a(418));",
    'if(za(e))throw (globalThis.__toolsHydration.captureHost(e,M,"claim"),Error(a(418)));',
    2,
    "ReactDOM host claim",
  );
  diagnosticReact = replaceExactly(
    diagnosticReact,
    "if(za(e))throw Ua(),Error(a(418));",
    'if(za(e))throw globalThis.__toolsHydration.captureHost(e,M,"extra-host"),Ua(),Error(a(418));',
    1,
    "ReactDOM extra host",
  );
  diagnosticReact = replaceExactly(
    diagnosticReact,
    "Ii(r.textContent,l,e)",
    "Ii(r.textContent,l,e,r,t)",
    2,
    "ReactDOM element text call",
  );
  diagnosticReact = replaceExactly(
    diagnosticReact,
    "Ii(r.nodeValue,n,(e.mode&1)!=0)",
    "Ii(r.nodeValue,n,(e.mode&1)!=0,r,t)",
    2,
    "ReactDOM text node call",
  );
  diagnosticReact = replaceExactly(
    diagnosticReact,
    "function Ii(e,t,n){if(t=Fi(t),Fi(e)!==t&&n)throw Error(a(425))}",
    "function Ii(e,t,n,__node,__fiber){if(t=Fi(t),Fi(e)!==t&&n)throw (globalThis.__toolsHydration.captureText(__fiber,__node,t,e),Error(a(425)))}",
    1,
    "ReactDOM text mismatch",
  );
  diagnosticReact = replaceExactly(
    diagnosticReact,
    "function Dl(e,t){do{var n=q;try{",
    "function Dl(e,t){globalThis.__toolsHydration.captureThrown(t,q);do{var n=q;try{",
    1,
    "ReactDOM render exception",
  );
  const diagnosticAssets = new Map([
    [manifest.entry, Buffer.from(diagnosticEntry)],
    [reactPath, Buffer.from(diagnosticReact)],
  ]);
  return {
    diagnosticAssets,
    instrumentation: [
      {
        path: manifest.entry,
        originalSha256: sha256(assets.get(manifest.entry)),
        diagnosticSha256: sha256(diagnosticEntry),
        changes: [
          "Add beforeHydrate lifecycle capture, root handle, and onRecoverableError to the final hydrateRoot call",
        ],
      },
      {
        path: reactPath,
        originalSha256: sha256(assets.get(reactPath)),
        diagnosticSha256: sha256(diagnosticReact),
        changes: [
          "Snapshot fiber/next DOM node immediately before both host-claim #418 throws",
          "Snapshot unexpected remaining DOM node before extra-host #418 throw",
          "Pass host node/fiber through four text-check calls and snapshot normalized mismatch before #425 throw",
          "Record a redacted non-Promise render exception at the existing unwind handler before React replaces it with #422/#423",
        ],
      },
    ],
  };
}

/** Generate source-based SSR using the installed TanStack server serializer. */
export async function generateSsrFixture({ manifest, assets, repository = defaultRepository }) {
  await verifySourceSnapshot(repository, manifest).catch(() => {
    throw new Error("Generated source snapshot verification failed; source details were redacted");
  });
  const { publisher, slot, assetPath } = readBuildConstants(assets);
  const entry = assets.get(manifest.entry).toString("utf8");
  const css = entry.match(/`(\/assets\/styles-[\w-]+\.css)`/)?.[1];
  if (
    !css ||
    !manifest.routerManifest?.routes?.__root__ ||
    !manifest.routerManifest?.routes?.[manifest.activeRoute]
  ) {
    throw new Error("Pinned production CSS/router manifest missing");
  }
  const compiled = await build({
    write: false,
    bundle: true,
    format: "esm",
    platform: "node",
    packages: "external",
    logLevel: "silent",
    absWorkingDir: repository,
    stdin: {
      resolveDir: repository,
      contents: `import React from 'react';
        import {createRouter,createMemoryHistory,RouterProvider} from '@tanstack/react-router';
        import {attachRouterServerSsrUtils,renderRouterToStream} from '@tanstack/react-router/ssr/server';
        import {Route as root} from './app/routes/__root.tsx';
        import {Route as base} from './app/routes/base64.tsx';
        export async function render(manifest){
          const routeTree=root.addChildren([base.update({id:'/base64',path:'/base64',getParentRoute:()=>root})]);
          const router=createRouter({routeTree,scrollRestoration:true,
            history:createMemoryHistory({initialEntries:['/base64']}),origin:${JSON.stringify(FIXTURE_ORIGIN)}});
          attachRouterServerSsrUtils({router,manifest});
          await router.load();
          await router.serverSsr.dehydrate();
          const matches=router.state.matches.map(m=>({id:m.id,status:m.status,ssr:m.ssr,
            updatedAt:m.updatedAt,metaCount:m.meta?.length,linkCount:m.links?.length}));
          const response=await renderRouterToStream({request:new Request(${JSON.stringify(FIXTURE_ORIGIN + "/base64")}),router,responseHeaders:new Headers(),
            children:React.createElement(RouterProvider,{router})});
          if(response.status!==200)throw new Error('Generated SSR failed');
          return {html:await response.text(),matches};
        }`,
    },
    alias: { "~": join(repository, "app") },
    define: {
      "import.meta.env.VITE_ADSENSE_PUBLISHER_ID": JSON.stringify(publisher),
      "import.meta.env.VITE_ADSENSE_SLOT": JSON.stringify(slot),
      "process.env.NODE_ENV": '"production"',
    },
    plugins: [
      {
        name: "diagnostic-css-url-only",
        setup(builder) {
          builder.onResolve({ filter: /\.css(\?url)?$/ }, (args) => ({
            path: args.path.endsWith("?url") ? "asset" : "empty",
            namespace: "diagnostic-css",
          }));
          builder.onLoad({ filter: /.*/, namespace: "diagnostic-css" }, (args) => ({
            contents: args.path === "asset" ? `export default ${JSON.stringify(css)};` : "",
            loader: "js",
          }));
        },
      },
    ],
  }).catch(() => {
    throw new Error("Generated source SSR compilation failed; source details were redacted");
  });
  // Resolve external package imports before using a data URL. The source bundle
  // (which contains runtime-only constants) is never written to the filesystem.
  const code = compiled.outputFiles[0].text.replace(
    /(from\s+|import\s+)(["'])([^"']+)\2/g,
    (original, prefix, quote, specifier) =>
      specifier.startsWith(".")
        ? original
        : `${prefix}${quote}${import.meta.resolve(specifier)}${quote}`,
  );
  const previousNodeEnv = process.env.NODE_ENV;
  const previousConsoleError = console.error;
  let serverErrorCount = 0;
  let generated;
  let conditionalExports;
  try {
    process.env.NODE_ENV = "production";
    // The TanStack renderer logs caught server errors itself. Such stacks can
    // contain a data URL, so count them without retaining raw arguments.
    console.error = () => {
      serverErrorCount++;
    };
    conditionalExports = verifyCloudflareSsrExports();
    const server = await import(
      "data:text/javascript;base64," + Buffer.from(code).toString("base64")
    );
    generated = await server.render(manifest.routerManifest);
  } catch {
    // A data-URL stack can include the runtime-only constants. Never expose it.
    throw new Error("Generated source SSR failed; source module details were redacted");
  } finally {
    console.error = previousConsoleError;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
  if (
    !generated.html.includes("self.$_TSR=") ||
    !generated.html.includes(manifest.entry) ||
    !generated.html.includes('id="conv-input"') ||
    generated.matches.some((m) => m.status !== "success")
  ) {
    throw new Error("Generated SSR is missing the serializer/entry/working route");
  }
  const sourceFiles = [
    "app/routes/__root.tsx",
    "app/routes/base64.tsx",
    "app/client.tsx",
    "app/router.tsx",
    "app/constants/site.ts",
    "package-lock.json",
  ];
  const sourceHashes = await Promise.all(
    sourceFiles.map(async (path) => {
      const bytes = await readFile(join(repository, path));
      return {
        path,
        sha256: sha256(bytes),
        gitBlob: createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"),
      };
    }),
  );
  const versions = {};
  for (const name of [
    "react",
    "react-dom",
    "@tanstack/react-router",
    "@tanstack/router-core",
    "esbuild",
  ]) {
    versions[name] = JSON.parse(
      await readFile(join(repository, "node_modules", name, "package.json"), "utf8"),
    ).version;
  }
  const instrumented = instrumentAssets(manifest, assets);
  return {
    html: generated.html,
    diagnosticAssets: instrumented.diagnosticAssets,
    diagnostics: {
      sourceCommit: manifest.sourceCommit,
      sourceTree: manifest.sourceTree,
      generatedAt: new Date().toISOString(),
      conditionalExports,
      syntheticOrigin: FIXTURE_ORIGIN,
      generation:
        "Actual root/Base64 source + reduced server route tree; real TanStack attachRouterServerSsrUtils/dehydrate/renderRouterToStream; buffered generated stream and fresh match timestamps",
      constants: `Public compiled publisher/slot literals derived in memory from verified ${assetPath}; values and generated HTML are never reported or saved`,
      sourceHashes,
      versions,
      matches: generated.matches,
      serverErrorCount,
      ownedAssets: manifest.assets.map(({ path, bytes, sha256: hash }) => ({
        path,
        bytes,
        sha256: hash,
      })),
      instrumentation: instrumented.instrumentation,
      boundaries: [
        "Generated SSR, not a captured production response",
        "No request-specific analytics/challenge identifiers",
        "Only verified pinned owned JavaScript executes; CSS/fonts/ad/analytics/challenge scripts stay inert",
        "Structure, lazy hydration, and controls are tested; visual rendering/performance are outside this fixture",
        "No local web server, sockets, dependency changes, application edits, or settings changes",
      ],
    },
  };
}
