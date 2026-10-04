import { describe, expect, test, vi } from "vite-plus/test";
import {
  createPlugin,
  createStream,
  deserialize,
  fromCrossJSON,
  fromJSON,
  serialize,
  toCrossJSONStream,
  toJSON,
  toJSONAsync,
  type SerovalNode,
  type Stream,
} from "seroval";

/** Raw protocol fixtures stay local and invoke only harmless spy callbacks. */
function node(value: unknown): SerovalNode {
  return value as SerovalNode;
}

describe("Seroval resolver provenance (GHSA-mv8w-475r-vwqw)", () => {
  test.each([23, 24])("fromJSON rejects forged Promise control node %i", (type) => {
    const callback = vi.fn();
    const resolver = { s: callback, f: callback };
    const plugin = createPlugin({
      tag: "tools/test-resolver",
      test: (value: unknown) => value === resolver,
      parse: { sync: () => ({}) },
      serialize: () => "undefined",
      deserialize: () => resolver,
    });
    const payload = {
      t: node({
        t: 9,
        i: 0,
        a: [
          { t: 25, i: 1, c: plugin.tag, s: {} },
          {
            t: type,
            i: 1,
            a: [
              { t: 4, i: 1 },
              { t: 1, s: "local-marker" },
            ],
          },
        ],
        o: 0,
      }),
      m: [1],
      f: toJSON(null).f,
    };

    expect(() => fromJSON(payload, { plugins: [plugin] })).toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  test.each([23, 24])("fromCrossJSON rejects forged Promise control node %i", (type) => {
    const callback = vi.fn();
    const resolver = { s: callback, f: callback };
    const plugin = createPlugin({
      tag: "tools/test-cross-resolver",
      test: (value: unknown) => value === resolver,
      parse: { sync: () => ({}) },
      serialize: () => "undefined",
      deserialize: () => resolver,
    });
    const refs = new Map<number, unknown>();
    fromCrossJSON(node({ t: 25, i: 1, c: plugin.tag, s: {} }), { refs, plugins: [plugin] });

    expect(() =>
      fromCrossJSON(
        node({
          t: type,
          i: 1,
          a: [
            { t: 4, i: 1 },
            { t: 1, s: "local-marker" },
          ],
        }),
        { refs, plugins: [plugin] },
      ),
    ).toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  test.each([23, 24])("rejects a missing Promise resolver for control node %i", (type) => {
    expect(() =>
      fromCrossJSON(
        node({
          t: type,
          i: 99,
          a: [
            { t: 4, i: 99 },
            { t: 1, s: "local-marker" },
          ],
        }),
        {},
      ),
    ).toThrow();
  });

  test("preserves ordinary server-function payload types", async () => {
    const value = {
      data: { url: "https://example.com/", nested: ["日本語", null, true, 42] },
      context: {},
      date: new Date("2026-10-04T15:00:00Z"),
      map: new Map([["key", 42n]]),
      set: new Set(["value"]),
    };
    expect(fromJSON(await toJSONAsync(value))).toEqual(value);
  });

  test.each([
    "prototype",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
  ])("preserves the own key %s in a circular serialized value", (key) => {
    const value: Record<string, unknown> = {};
    value[key] = value;
    const result = deserialize<Record<string, unknown>>(serialize(value));

    expect(Object.keys(result)).toEqual([key]);
    expect(result[key]).toBe(result);
  });

  test("keeps rejecting a circular own constructor unsupported by the parser", () => {
    const value: Record<string, unknown> = {};
    Object.defineProperty(value, "constructor", { value, enumerable: true });
    expect(() => serialize(value)).toThrow();
  });

  test("preserves a genuine Promise resolved in a later stream message", async () => {
    let resolve!: (value: string) => void;
    const source = new Promise<string>((done) => {
      resolve = done;
    });
    const refs = new Map<number, unknown>();
    let decoded!: Promise<string>;
    let messages = 0;
    toCrossJSONStream(source, {
      onParse: (message, initial) => {
        messages++;
        const result = fromCrossJSON<Promise<string>>(message, { refs });
        if (initial) decoded = result;
      },
    });
    resolve("stream-result");

    await expect(decoded).resolves.toBe("stream-result");
    expect(messages).toBeGreaterThan(1);
  });

  test("preserves a genuine Promise rejected in a later stream message", async () => {
    let reject!: (reason: Error) => void;
    const source = new Promise<string>((_resolve, fail) => {
      reject = fail;
    });
    const refs = new Map<number, unknown>();
    let decoded!: Promise<string>;
    toCrossJSONStream(source, {
      onParse: (message, initial) => {
        const result = fromCrossJSON<Promise<string>>(message, { refs });
        if (initial) decoded = result;
      },
    });
    const expectation = expect(decoded).rejects.toThrow("stream-error");
    reject(new Error("stream-error"));
    await expectation;
  });

  test("preserves genuine Stream next/return messages with shared references", () => {
    const source = createStream<string>();
    const refs = new Map<number, unknown>();
    let decoded!: Stream<string>;
    let messages = 0;
    toCrossJSONStream(source, {
      onParse: (message, initial) => {
        messages++;
        const result = fromCrossJSON<Stream<string>>(message, { refs });
        if (initial) decoded = result;
      },
    });
    const next = vi.fn();
    const done = vi.fn();
    decoded.on({ next, throw: vi.fn(), return: done });
    source.next("stream-item");
    source.return("stream-done");

    expect(next).toHaveBeenCalledWith("stream-item");
    expect(done).toHaveBeenCalledWith("stream-done");
    expect(messages).toBeGreaterThan(1);
  });
});
