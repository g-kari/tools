/** Hosted CI only: GET-only, fixed build roots, loopback, with no application APIs. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";

const root = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};
createServer(async (request, response) => {
  const pathname = request.url || "";
  const file = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
  if (
    request.method !== "GET" ||
    request.headers.host !== "127.0.0.1:4194" ||
    !/^\/(shim|real)\/(?:index\.html|fixture\.js|assets\/[a-zA-Z0-9_.-]+)?$/.test(pathname) ||
    !file.startsWith(`${root}${sep}`) ||
    !mime[extname(file)]
  ) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[extname(file)],
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self'; connect-src 'self' blob: https://unpkg.com; img-src blob: data:; font-src 'none'; base-uri 'none'; form-action 'none'",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end("Fixture missing");
  }
}).listen(4194, "127.0.0.1");
