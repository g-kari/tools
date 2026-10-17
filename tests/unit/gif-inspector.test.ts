import { describe, expect, it } from "vite-plus/test";
import { inspectGif } from "../browser/emoji/gif-inspector";

const text = (value: string) => Array.from(value, (character) => character.charCodeAt(0));
const word = (value: number) => [value & 0xff, (value >> 8) & 0xff];
const header = (signature = "GIF89a", width = 1, height = 1) => [
  ...text(signature),
  ...word(width),
  ...word(height),
  0x80,
  0,
  0,
  0,
  0,
  0,
  255,
  255,
  255,
];
const control = (delay: number, packed = 0, transparentIndex = 0) => [
  0x21,
  0xf9,
  4,
  packed,
  ...word(delay),
  transparentIndex,
  0,
];
const loop = (count: number, application = "NETSCAPE2.0") => [
  0x21,
  0xff,
  11,
  ...text(application),
  3,
  1,
  ...word(count),
  0,
];
const frame = (packed = 0, payload = [0x44, 0x01]) => [
  0x2c,
  0,
  0,
  0,
  0,
  1,
  0,
  1,
  0,
  packed,
  ...(packed & 0x80 ? [0, 0, 0, 255, 255, 255] : []),
  2,
  payload.length,
  ...payload,
  0,
];
const gif = (...blocks: number[][]) => new Uint8Array([...header(), ...blocks.flat(), 0x3b]);

describe("test-only GIF binary inspector", () => {
  it("reads a real one-pixel GIF87a with no animation extension", () => {
    const bytes = new Uint8Array([...header("GIF87a"), ...frame(), 0x3b]);
    expect(inspectGif(bytes.buffer)).toEqual({
      signature: "GIF87a",
      width: 1,
      height: 1,
      globalColorTableSize: 2,
      loopCount: null,
      totalDurationCentiseconds: 0,
      frames: [
        {
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          interlaced: false,
          localColorTableSize: 0,
          delayCentiseconds: 0,
          disposalMethod: 0,
          transparentColorIndex: null,
          userInput: false,
        },
      ],
    });
  });

  it("reads little-endian canvas/frame dimensions and frame offsets", () => {
    const image = frame();
    image.splice(1, 8, ...word(300), ...word(400), ...word(600), ...word(700));
    const bytes = new Uint8Array([...header("GIF89a", 1024, 2048), ...image, 0x3b]);
    const parsed = inspectGif(bytes);
    expect([parsed.width, parsed.height]).toEqual([1024, 2048]);
    expect(parsed.frames[0]).toMatchObject({ left: 300, top: 400, width: 600, height: 700 });
  });

  it.each([0, 7, 65535])(
    "reads NETSCAPE loop count %i and per-frame centisecond delays",
    (count) => {
      const parsed = inspectGif(
        gif(loop(count), control(10, 0x0b, 1), frame(), control(300), frame()),
      );
      expect(parsed.loopCount).toBe(count);
      expect(parsed.frames.map((image) => image.delayCentiseconds)).toEqual([10, 300]);
      expect(parsed.totalDurationCentiseconds).toBe(310);
      expect(parsed.frames[0]).toMatchObject({
        disposalMethod: 2,
        transparentColorIndex: 1,
        userInput: true,
      });
    },
  );

  it("also recognizes the ANIMEXTS loop-extension identifier", () => {
    expect(inspectGif(gif(loop(3, "ANIMEXTS1.0"), frame())).loopCount).toBe(3);
  });

  it("skips local palettes and marker-looking bytes inside image-data sub-blocks", () => {
    const parsed = inspectGif(gif(frame(0xc0, [0x21, 0xf9, 0x2c, 0x3b]), frame()));
    expect(parsed.frames).toHaveLength(2);
    expect(parsed.frames[0]).toMatchObject({ interlaced: true, localColorTableSize: 2 });
  });

  it("keeps a pending GCE across comments/applications and resets it after an image", () => {
    const comment = [0x21, 0xfe, 3, 0x2c, 0xf9, 0x3b, 0];
    const unknownApplication = [0x21, 0xff, 11, ...text("TESTAPP 1.0"), 2, 1, 99, 0];
    const parsed = inspectGif(gif(control(12), comment, unknownApplication, frame(), frame()));
    expect(parsed.frames.map((image) => image.delayCentiseconds)).toEqual([12, 0]);
    expect(parsed.loopCount).toBeNull();
  });

  it("consumes GCE on plain-text rendering blocks", () => {
    const plainText = [0x21, 0x01, 12, ...Array.from({ length: 12 }, () => 0), 1, 65, 0];
    expect(inspectGif(gif(control(20), plainText, frame())).frames[0].delayCentiseconds).toBe(0);
  });

  it("skips multiple image sub-blocks and accepts a sliced byte view", () => {
    const image = frame();
    image.splice(11, 4, 1, 0x44, 1, 0x01, 0);
    const bytes = gif(control(10), image);
    const padded = new Uint8Array([99, ...bytes, 99]);
    expect(inspectGif(padded.subarray(1, padded.length - 1)).frames).toHaveLength(1);
  });

  it("rejects every truncated prefix of a complete animated GIF", () => {
    const bytes = gif(loop(0), control(10), frame(0x80), control(20), frame());
    for (let length = 0; length < bytes.length; length++) {
      expect(() => inspectGif(bytes.subarray(0, length))).toThrow(/Invalid GIF/);
    }
    expect(inspectGif(bytes).frames).toHaveLength(2);
  });

  it.each([
    ["signature", new Uint8Array([...text("PNG89a"), ...header().slice(6), ...frame(), 0x3b])],
    ["zero dimensions", new Uint8Array([...header("GIF89a", 0, 1), ...frame(), 0x3b])],
    ["no frames", gif()],
    ["unknown block", gif([0x77])],
    ["GCE size", gif([0x21, 0xf9, 3, 0, 0, 0, 0], frame())],
    ["GCE terminator", gif([0x21, 0xf9, 4, 0, 0, 0, 0, 1], frame())],
    ["application size", gif([0x21, 0xff, 10, ...text("NETSCAPE2.0"), 0], frame())],
    ["loop payload", gif([0x21, 0xff, 11, ...text("NETSCAPE2.0"), 2, 1, 0, 0], frame())],
    ["plain-text size", gif([0x21, 0x01, 11, ...Array.from({ length: 11 }, () => 0), 0], frame())],
    ["empty image data", gif(frame().slice(0, 11).concat(0))],
    ["LZW minimum code size", gif(frame().map((value, index) => (index === 10 ? 9 : value)))],
    ["zero frame dimensions", gif(frame().map((value, index) => (index === 5 ? 0 : value)))],
  ] as const)("rejects malformed %s", (_description, bytes) => {
    expect(() => inspectGif(bytes)).toThrow(/Invalid GIF/);
  });
});
