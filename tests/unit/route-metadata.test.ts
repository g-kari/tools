import { describe, expect, it } from "vite-plus/test";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../../app/constants/site";

// These established routes already have functional tests. Verify their actual
// head callbacks too: metadata must describe the route rather than another page.
const pages = [
  "base32",
  "base64-image",
  "base64",
  "bpm",
  "char-count",
  "char-frequency",
  "color-contrast",
  "color-extractor",
  "color-harmony",
  "color-palette",
  "color-picker",
  "color-temperature",
  "cors-builder",
  "countdown",
  "cron-parser",
  "csv-json",
  "csv-sql",
  "dice-roll",
  "diff",
  "dummy-audio",
  "dummy-image",
  "emoji-converter",
  "encode-chain",
  "entropy",
  "fancy-text",
  "favicon-generator",
  "fraction",
  "game-2048",
  "hangman",
  "hash",
  "http-headers",
  "http-status",
  "image-base64",
  "image-compress",
  "image-resize",
  "image-to-gif",
  "ipv6",
  "json-flatten",
  "json-lines",
  "json-pointer",
  "json-to-sql",
  "json-to-zod",
  "json",
  "life-game",
  "lorem-ipsum",
  "markdown-preview",
  "markdown-table",
  "mermaid",
  "mime-types",
  "minesweeper",
  "password-generator",
  "pomodoro",
  "quoted-printable",
  "random-picker",
  "regex-checker",
  "release-notes",
  "roman-numerals",
  "snake",
  "stopwatch",
  "sudoku",
  "tetris",
  "text-case",
  "text-stats",
  "tic-tac-toe",
  "timestamp",
  "toml-json",
  "transparent-image",
  "typing-speed",
  "url-encode",
  "uuid",
  "websocket",
  "word-frequency",
  "wordle",
  "world-clock",
  "xml-json",
  "yaml-json",
] as const;
const modules = import.meta.glob("../../app/routes/*.tsx");
interface Meta {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
}
interface MetadataRoute {
  Route: { options: { head: () => { meta: Meta[] } } };
}

describe("established tool route metadata", () => {
  it.each(pages)(
    "publishes coherent title, descriptions and canonical social URL for /%s",
    async (page) => {
      const load = modules[`../../app/routes/${page}.tsx`];
      expect(load).toBeTypeOf("function");
      const { Route } = (await load()) as MetadataRoute;
      const meta = Route.options.head().meta;
      const title = meta.find((entry) => entry.title)?.title;
      const description = meta.find((entry) => entry.name === "description")?.content;
      expect(title?.trim().length).toBeGreaterThan(0);
      expect(description?.trim().length).toBeGreaterThan(0);
      expect(meta.filter((entry) => entry.title)).toHaveLength(1);
      expect(meta.find((entry) => entry.property === "og:url")?.content).toBe(
        `${SITE_BASE_URL}/${page}`,
      );
      expect(meta.find((entry) => entry.property === "og:image")?.content).toBe(SITE_OGP_IMAGE);
      expect(
        meta.find((entry) => entry.property === "og:title")?.content?.trim().length,
      ).toBeGreaterThan(0);
      // Some established pages intentionally provide only Open Graph metadata.
      // A Twitter-specific title is optional, but must be nonempty when supplied.
      const twitterTitle = meta.find((entry) => entry.name === "twitter:title");
      if (twitterTitle) expect(twitterTitle.content?.trim().length).toBeGreaterThan(0);
    },
  );
});
