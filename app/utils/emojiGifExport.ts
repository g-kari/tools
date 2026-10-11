import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { buildPaletteUseFilter, type DitherMode } from "./gifPalette";

/** Settings applied to the GIF bytes, rather than the editing canvas preview. */
export interface EmojiGifOptions {
  fps: number;
  loop: number;
  quality: number;
  dither: DitherMode;
  colors: number;
}

export type EmojiGifEncoder = Pick<
  FFmpeg,
  "loaded" | "writeFile" | "exec" | "readFile" | "deleteFile"
>;

/** Produce a palette-based GIF from one PNG per frame, with explicit input timing. */
export function buildEmojiGifArgs(
  prefix: string,
  frameCount: number,
  options: EmojiGifOptions,
): string[] {
  if (
    !Number.isInteger(frameCount) ||
    frameCount < 1 ||
    !Number.isInteger(options.fps) ||
    options.fps < 6 ||
    options.fps > 30 ||
    !Number.isInteger(options.loop) ||
    options.loop < 0 ||
    options.loop > 65535 ||
    !Number.isInteger(options.colors) ||
    options.colors < 4 ||
    options.colors > 256 ||
    !Number.isFinite(options.quality) ||
    options.quality < 1 ||
    options.quality > 100 ||
    !["bayer", "floyd_steinberg", "sierra2_4a", "none"].includes(options.dither)
  ) {
    throw new Error("GIF設定が無効です");
  }
  const palette = buildPaletteUseFilter(options.dither, options.quality);
  return [
    "-framerate",
    String(options.fps),
    "-start_number",
    "0",
    "-i",
    `${prefix}-%04d.png`,
    "-filter_complex",
    `split[s0][s1];[s0]palettegen=max_colors=${options.colors}:stats_mode=full[p];[s1][p]${palette}`,
    "-frames:v",
    String(frameCount),
    "-loop",
    String(options.loop),
    `${prefix}.gif`,
  ];
}

/** Reject empty output and format fallbacks before publishing a GIF artifact. */
export async function validateEmojiGif(blob: Blob): Promise<void> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const magic = new TextDecoder().decode(bytes.subarray(0, 6));
  if (
    blob.type !== "image/gif" ||
    bytes.length < 14 ||
    (magic !== "GIF87a" && magic !== "GIF89a") ||
    bytes[bytes.length - 1] !== 0x3b ||
    (bytes[6] | (bytes[7] << 8)) !== 128 ||
    (bytes[8] | (bytes[9] << 8)) !== 128
  ) {
    throw new Error("有効な128×128 GIFを生成できませんでした");
  }
}

/** Byte-exact capacity gate; rounding displayed KB must never enable an oversized save. */
export function canSaveEmojiGif(blob: Blob | null, maxBytes: number): boolean {
  return !!blob && blob.type === "image/gif" && blob.size > 0 && blob.size <= maxBytes;
}

let nextExport = 0;

/** Encode once using the existing browser FFmpeg and palette helper; always clean its files. */
export async function encodeEmojiGif(
  ffmpeg: EmojiGifEncoder,
  frames: HTMLCanvasElement[],
  options: EmojiGifOptions,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  if (!ffmpeg.loaded) throw new Error("FFmpegの読み込みが完了していません");
  const prefix = `emoji-export-${nextExport++}`;
  const args = buildEmojiGifArgs(prefix, frames.length, options);
  const files: string[] = [`${prefix}.gif`];
  try {
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      if (frame.width !== 128 || frame.height !== 128)
        throw new Error("GIFフレームのサイズが無効です");
      const png = await new Promise<Blob | null>((resolve) => frame.toBlob(resolve, "image/png"));
      if (!png || png.size === 0 || png.type !== "image/png")
        throw new Error("GIFフレームを作成できませんでした");
      const name = `${prefix}-${String(i).padStart(4, "0")}.png`;
      files.push(name);
      await ffmpeg.writeFile(name, new Uint8Array(await png.arrayBuffer()));
      onProgress?.(`GIFフレームを準備しています... (${i + 1}/${frames.length})`);
    }
    onProgress?.("GIFを生成しています...");
    const code = await ffmpeg.exec(args);
    if (code !== 0) throw new Error("GIFのエンコードに失敗しました");
    const data = await ffmpeg.readFile(`${prefix}.gif`);
    if (!(data instanceof Uint8Array)) throw new Error("GIFの読み込みに失敗しました");
    const blob = new Blob([new Uint8Array(data)], { type: "image/gif" });
    await validateEmojiGif(blob);
    return blob;
  } finally {
    await Promise.all(
      files.map(async (name) => {
        try {
          await ffmpeg.deleteFile(name);
        } catch {
          /* May not exist after a failed encode. */
        }
      }),
    );
  }
}
