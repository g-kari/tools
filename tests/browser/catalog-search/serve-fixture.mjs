/** GETと固定ファイルだけを許可する、ループバック限定の検証用サーバー。 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/fixture.js", ["fixture.js", "text/javascript; charset=utf-8"]],
  ["/fixture.css", ["fixture.css", "text/css; charset=utf-8"]],
]);
const server = createServer(async (request, response) => {
  const file = files.get(request.url);
  if (request.method !== "GET" || request.headers.host !== "127.0.0.1:4196" || !file) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(new URL(`./dist/${file[0]}`, import.meta.url));
    response.writeHead(200, {
      "Content-Type": file[1],
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("Fixture missing");
  }
});
server.listen(4196, "127.0.0.1");
