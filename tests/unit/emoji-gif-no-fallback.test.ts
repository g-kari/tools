import { describe, expect, it, vi } from "vite-plus/test";
import { canvasToBlobWithLimit } from "../../app/routes/emoji-converter";

describe("canvasToBlobWithLimit GIF fallback prevention", () => {
  it.each([256 * 1024, 1024 * 1024])(
    "refuses GIF for a %i-byte cap without invoking the PNG-only canvas encoder",
    async (maxBytes) => {
      const toBlob = vi.fn((callback: BlobCallback) => {
        callback(new Blob(["PNG fallback"], { type: "image/png" }));
      });
      const canvas = { width: 128, height: 128, toBlob } as unknown as HTMLCanvasElement;
      await expect(canvasToBlobWithLimit(canvas, "gif", 0.92, maxBytes)).resolves.toBeNull();
      expect(toBlob).not.toHaveBeenCalled();
    },
  );

  it("continues to encode explicit PNG requests", async () => {
    const blob = new Blob(["PNG output"], { type: "image/png" });
    const toBlob = vi.fn((callback: BlobCallback) => callback(blob));
    const canvas = { width: 128, height: 128, toBlob } as unknown as HTMLCanvasElement;
    await expect(canvasToBlobWithLimit(canvas, "png", 0.92, 256 * 1024)).resolves.toBe(blob);
    expect(toBlob).toHaveBeenCalledOnce();
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
  });
});
