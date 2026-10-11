import { describe, expect, it, vi } from "vite-plus/test";
import {
  buildEmojiGifArgs,
  canSaveEmojiGif,
  encodeEmojiGif,
  validateEmojiGif,
  type EmojiGifEncoder,
  type EmojiGifOptions,
} from "../../app/utils/emojiGifExport";

const options: EmojiGifOptions = {
  fps: 12,
  loop: 0,
  quality: 80,
  dither: "bayer",
  colors: 128,
};

type MockCanvas = Omit<HTMLCanvasElement, "toBlob"> & {
  toBlob: ReturnType<typeof vi.fn<(callback: BlobCallback, type?: string) => void>>;
};

/** Valid GIF89a with a 128×128 logical screen and a one-pixel image. */
function gifBytes(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(
    Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
  );
  bytes[6] = 128;
  bytes[8] = 128;
  return bytes;
}

function frame(png: Blob | null = new Blob(["PNG frame"], { type: "image/png" })) {
  return {
    width: 128,
    height: 128,
    toBlob: vi.fn((callback: BlobCallback, _type?: string) => callback(png)),
  } as unknown as MockCanvas;
}

function encoder() {
  return {
    loaded: true,
    writeFile: vi.fn<EmojiGifEncoder["writeFile"]>().mockResolvedValue(true),
    exec: vi.fn<EmojiGifEncoder["exec"]>().mockResolvedValue(0),
    readFile: vi.fn<EmojiGifEncoder["readFile"]>().mockResolvedValue(gifBytes()),
    deleteFile: vi.fn<EmojiGifEncoder["deleteFile"]>().mockResolvedValue(true),
  } satisfies EmojiGifEncoder;
}

function outputName(ffmpeg: ReturnType<typeof encoder>): string {
  return ffmpeg.exec.mock.calls[0][0].at(-1)!;
}

describe("buildEmojiGifArgs", () => {
  it("uses explicit FPS, zero-based PNG sequence, frame count, palette colors and loop", () => {
    expect(buildEmojiGifArgs("export", 7, { ...options, fps: 24, loop: 3, colors: 64 })).toEqual([
      "-framerate",
      "24",
      "-start_number",
      "0",
      "-i",
      "export-%04d.png",
      "-filter_complex",
      "split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=full[p];[s1][p]paletteuse=dither=bayer:bayer_scale=1",
      "-frames:v",
      "7",
      "-loop",
      "3",
      "export.gif",
    ]);
  });

  it.each([6, 30])("accepts the FPS boundary %i", (fps) => {
    expect(buildEmojiGifArgs("export", 1, { ...options, fps })[1]).toBe(String(fps));
  });

  it.each([0, 65535])("preserves loop count %i", (loop) => {
    const args = buildEmojiGifArgs("export", 1, { ...options, loop });
    expect(args[args.indexOf("-loop") + 1]).toBe(String(loop));
  });

  it.each([
    [1, 5],
    [100, 0],
  ])("maps Bayer quality %i to scale %i", (quality, scale) => {
    expect(buildEmojiGifArgs("export", 1, { ...options, quality }).join(" ")).toContain(
      `paletteuse=dither=bayer:bayer_scale=${scale}`,
    );
  });

  it.each(["floyd_steinberg", "sierra2_4a", "none"] as const)(
    "quality does not alter the %s palette filter",
    (dither) => {
      const low = buildEmojiGifArgs("export", 1, { ...options, dither, quality: 1 });
      const high = buildEmojiGifArgs("export", 1, { ...options, dither, quality: 100 });
      expect(low).toEqual(high);
      expect(high.join(" ")).toContain(`paletteuse=dither=${dither}`);
      expect(high.join(" ")).not.toContain("bayer_scale");
    },
  );

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid frame count %s", (count) => {
    expect(() => buildEmojiGifArgs("export", count, options)).toThrow("GIF設定が無効です");
  });

  it.each([
    { fps: 5 },
    { fps: 31 },
    { fps: 12.5 },
    { loop: -1 },
    { loop: 65536 },
    { loop: 1.5 },
    { colors: 3 },
    { colors: 257 },
    { colors: 64.5 },
    { quality: 0 },
    { quality: 101 },
    { quality: Number.NaN },
    { quality: Infinity },
    { dither: "unsupported" },
  ])("rejects invalid options %j", (invalid) => {
    expect(() =>
      buildEmojiGifArgs("export", 1, { ...options, ...invalid } as EmojiGifOptions),
    ).toThrow("GIF設定が無効です");
  });
});

describe("validateEmojiGif", () => {
  it.each(["GIF87a", "GIF89a"])("accepts %s at 128×128", async (magic) => {
    const bytes = gifBytes();
    bytes.set(new TextEncoder().encode(magic));
    await expect(
      validateEmojiGif(new Blob([bytes], { type: "image/gif" })),
    ).resolves.toBeUndefined();
  });

  it.each(["image/png", "image/webp", "application/octet-stream", ""])(
    "rejects correct GIF bytes with MIME %s",
    async (type) => {
      await expect(validateEmojiGif(new Blob([gifBytes()], { type }))).rejects.toThrow(
        "128×128 GIF",
      );
    },
  );

  it.each([0, 6, 13])("rejects empty or truncated %i-byte output", async (size) => {
    await expect(
      validateEmojiGif(new Blob([gifBytes().slice(0, size)], { type: "image/gif" })),
    ).rejects.toThrow("128×128 GIF");
  });

  it.each([
    [0, 0x89, "PNG magic"],
    [6, 127, "wrong width"],
    [7, 1, "wrong high width byte"],
    [8, 129, "wrong height"],
    [9, 1, "wrong high height byte"],
  ] as const)("rejects byte %i=%i (%s)", async (index, value, _description) => {
    const bytes = gifBytes();
    bytes[index] = value;
    await expect(validateEmojiGif(new Blob([bytes], { type: "image/gif" }))).rejects.toThrow(
      "128×128 GIF",
    );
  });

  it("requires the GIF trailer", async () => {
    const bytes = gifBytes();
    bytes[bytes.length - 1] = 0;
    await expect(validateEmojiGif(new Blob([bytes], { type: "image/gif" }))).rejects.toThrow(
      "128×128 GIF",
    );
  });
});

describe("canSaveEmojiGif", () => {
  const cap = 256 * 1024;

  it.each([cap - 1, cap])("allows a GIF of exactly %i bytes", (size) => {
    expect(canSaveEmojiGif(new Blob([new Uint8Array(size)], { type: "image/gif" }), cap)).toBe(
      true,
    );
  });

  it("rejects one byte over the cap even though rounded KB is unchanged", () => {
    const blob = new Blob([new Uint8Array(cap + 1)], { type: "image/gif" });
    expect((blob.size / 1024).toFixed(1)).toBe("256.0");
    expect(canSaveEmojiGif(blob, cap)).toBe(false);
  });

  it("rejects zero bytes, absent artifacts, wrong MIME and a zero cap", () => {
    expect(canSaveEmojiGif(new Blob([], { type: "image/gif" }), cap)).toBe(false);
    expect(canSaveEmojiGif(null, cap)).toBe(false);
    expect(canSaveEmojiGif(new Blob([gifBytes()], { type: "image/png" }), cap)).toBe(false);
    expect(canSaveEmojiGif(new Blob([gifBytes()], { type: "image/gif" }), 0)).toBe(false);
  });
});

describe("encodeEmojiGif", () => {
  it("encodes every PNG in order, returns real GIF bytes, reports progress and cleans all files", async () => {
    const ffmpeg = encoder();
    const frames = [frame(), frame(), frame()];
    const progress = vi.fn();
    const blob = await encodeEmojiGif(ffmpeg, frames, options, progress);
    const output = outputName(ffmpeg);
    const prefix = output.slice(0, -4);

    expect(blob.type).toBe("image/gif");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(gifBytes());
    frames.forEach((canvas, i) => {
      expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
      expect(ffmpeg.writeFile).toHaveBeenNthCalledWith(
        i + 1,
        `${prefix}-${String(i).padStart(4, "0")}.png`,
        expect.any(Uint8Array),
      );
    });
    expect(ffmpeg.exec).toHaveBeenCalledOnce();
    expect(ffmpeg.exec).toHaveBeenCalledWith(buildEmojiGifArgs(prefix, 3, options));
    expect(ffmpeg.readFile).toHaveBeenCalledWith(output);
    expect(progress.mock.calls.map(([message]) => message)).toEqual([
      "GIFフレームを準備しています... (1/3)",
      "GIFフレームを準備しています... (2/3)",
      "GIFフレームを準備しています... (3/3)",
      "GIFを生成しています...",
    ]);
    expect(ffmpeg.deleteFile.mock.calls.map(([name]) => name).sort()).toEqual(
      [output, ...ffmpeg.writeFile.mock.calls.map(([name]) => name)].sort(),
    );
  });

  it("rejects unloaded FFmpeg without creating files or returning a PNG fallback", async () => {
    const ffmpeg = { ...encoder(), loaded: false };
    const canvas = frame();
    await expect(encodeEmojiGif(ffmpeg, [canvas], options)).rejects.toThrow(
      "読み込みが完了していません",
    );
    expect(canvas.toBlob).not.toHaveBeenCalled();
    expect(ffmpeg.writeFile).not.toHaveBeenCalled();
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).not.toHaveBeenCalled();
  });

  it("rejects an empty frame list before creating files", async () => {
    const ffmpeg = encoder();
    await expect(encodeEmojiGif(ffmpeg, [], options)).rejects.toThrow("GIF設定が無効です");
    expect(ffmpeg.writeFile).not.toHaveBeenCalled();
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).not.toHaveBeenCalled();
  });

  it.each([
    [127, 128],
    [128, 129],
  ])("rejects a %i×%i frame without PNG fallback", async (width, height) => {
    const ffmpeg = encoder();
    const canvas = Object.assign(frame(), { width, height });
    await expect(encodeEmojiGif(ffmpeg, [canvas], options)).rejects.toThrow(
      "フレームのサイズが無効",
    );
    expect(canvas.toBlob).not.toHaveBeenCalled();
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledOnce();
  });

  it.each([
    ["null", null],
    ["zero bytes", new Blob([], { type: "image/png" })],
    ["wrong MIME", new Blob(["frame"], { type: "image/jpeg" })],
  ])("rejects PNG conversion producing %s and cleans output", async (_name, png) => {
    const ffmpeg = encoder();
    await expect(encodeEmojiGif(ffmpeg, [frame(png)], options)).rejects.toThrow(
      "フレームを作成できません",
    );
    expect(ffmpeg.writeFile).not.toHaveBeenCalled();
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledOnce();
  });

  it("cleans prior PNGs after a later canvas toBlob throws", async () => {
    const ffmpeg = encoder();
    const bad = frame();
    vi.mocked(bad.toBlob).mockImplementation(() => {
      throw new Error("PNG unavailable");
    });
    await expect(encodeEmojiGif(ffmpeg, [frame(), bad], options)).rejects.toThrow(
      "PNG unavailable",
    );
    expect(ffmpeg.writeFile).toHaveBeenCalledOnce();
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith(ffmpeg.writeFile.mock.calls[0][0]);
  });

  it("cleans the attempted write and prior PNG after a later write fails", async () => {
    const ffmpeg = encoder();
    ffmpeg.writeFile.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("write failed"));
    await expect(encodeEmojiGif(ffmpeg, [frame(), frame()], options)).rejects.toThrow(
      "write failed",
    );
    expect(ffmpeg.exec).not.toHaveBeenCalled();
    expect(ffmpeg.readFile).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(3);
    ffmpeg.writeFile.mock.calls.forEach(([name]) => {
      expect(ffmpeg.deleteFile).toHaveBeenCalledWith(name);
    });
  });

  it("rejects a nonzero encoder exit without reading or returning a fallback", async () => {
    const ffmpeg = encoder();
    ffmpeg.exec.mockResolvedValue(1);
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow("エンコードに失敗");
    expect(ffmpeg.exec).toHaveBeenCalledOnce();
    expect(ffmpeg.readFile).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("cleans files after an encoder exception", async () => {
    const ffmpeg = encoder();
    ffmpeg.exec.mockRejectedValue(new Error("worker crashed"));
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow("worker crashed");
    expect(ffmpeg.readFile).not.toHaveBeenCalled();
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("propagates a read failure and still cleans every file", async () => {
    const ffmpeg = encoder();
    ffmpeg.readFile.mockRejectedValue(new Error("read failed"));
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow("read failed");
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith(outputName(ffmpeg));
  });

  it.each([
    ["text output", "GIF89a"],
    ["zero bytes", new Uint8Array()],
    ["PNG bytes", new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
  ])("rejects %s rather than relabeling it as a downloadable GIF", async (_name, data) => {
    const ffmpeg = encoder();
    ffmpeg.readFile.mockResolvedValue(data);
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow();
    expect(ffmpeg.exec).toHaveBeenCalledOnce();
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("ignores cleanup errors without masking a successful encode", async () => {
    const ffmpeg = encoder();
    ffmpeg.deleteFile.mockRejectedValue(new Error("file already removed"));
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).resolves.toMatchObject({
      type: "image/gif",
    });
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("ignores cleanup errors without masking the original failure", async () => {
    const ffmpeg = encoder();
    ffmpeg.exec.mockRejectedValue(new Error("original encoder failure"));
    ffmpeg.deleteFile.mockRejectedValue(new Error("cleanup failure"));
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow(
      "original encoder failure",
    );
  });

  it("can retry after failure with a fresh prefix and no stale file reuse", async () => {
    const ffmpeg = encoder();
    ffmpeg.exec.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    await expect(encodeEmojiGif(ffmpeg, [frame()], options)).rejects.toThrow("エンコードに失敗");
    const firstOutput = outputName(ffmpeg);
    const blob = await encodeEmojiGif(ffmpeg, [frame()], options);
    const secondOutput = ffmpeg.exec.mock.calls[1][0].at(-1)!;
    expect(blob.type).toBe("image/gif");
    expect(secondOutput).not.toBe(firstOutput);
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith(firstOutput);
    expect(ffmpeg.deleteFile).toHaveBeenCalledWith(secondOutput);
    expect(ffmpeg.deleteFile).toHaveBeenCalledTimes(4);
  });
});
