// @vitest-environment jsdom

import { Blob as NodeBlob } from "node:buffer";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useGeneratedGif } from "../../app/hooks/useGeneratedGif";

/** Valid GIF89a with a 128×128 logical screen and a one-pixel image. */
function gifBlob(): Blob {
  const bytes = new Uint8Array(
    Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"),
  );
  bytes[6] = 128;
  bytes[8] = 128;
  // jsdom's Blob does not expose arrayBuffer; Node's implements the browser API used here.
  return new NodeBlob([bytes], { type: "image/gif" }) as unknown as Blob;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("useGeneratedGif", () => {
  let root: Root;
  let container: HTMLDivElement;
  let result: ReturnType<typeof useGeneratedGif>;
  let unmounted: boolean;
  let createObjectURL: ReturnType<typeof vi.fn<(blob: Blob) => string>>;
  let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>;

  function Harness({ inputKey }: { inputKey: string }) {
    result = useGeneratedGif(inputKey);
    return null;
  }

  function renderKey(key: string) {
    act(() => root.render(createElement(Harness, { inputKey: key })));
  }

  function unmount() {
    act(() => root.unmount());
    unmounted = true;
  }

  function start(encode: () => Promise<Blob>) {
    let generation!: Promise<void>;
    act(() => {
      generation = result.generate(encode);
    });
    return generation;
  }

  async function finish(generation: Promise<void>, operation: () => void = () => {}) {
    await act(async () => {
      operation();
      await generation;
    });
  }

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    createObjectURL = vi
      .fn<(blob: Blob) => string>()
      .mockImplementation(() => `blob:generated-${createObjectURL.mock.calls.length}`);
    revokeObjectURL = vi.fn<(url: string) => void>();
    vi.stubGlobal("URL", Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }));
    container = document.createElement("div");
    (document.body as HTMLBodyElement).appendChild(container);
    root = createRoot(container);
    unmounted = false;
    renderKey("A");
  });

  afterEach(() => {
    if (!unmounted) unmount();
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("starts without a generated artifact, loading state or error", () => {
    expect(result.artifact).toBeNull();
    expect(result.isGenerating).toBe(false);
    expect(result.error).toBe("");
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("publishes only the validated encoder bytes and a generated preview URL", async () => {
    const blob = gifBlob();
    const completion = deferred<Blob>();
    const encode = vi.fn(() => completion.promise);
    const generation = start(encode);

    expect(result.isGenerating).toBe(true);
    expect(result.artifact).toBeNull();
    await finish(generation, () => completion.resolve(blob));

    expect(encode).toHaveBeenCalledOnce();
    expect(result.artifact).toMatchObject({ blob, url: "blob:generated-1", key: "A" });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(result.isGenerating).toBe(false);
    expect(result.error).toBe("");
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("ignores repeated generation clicks until the active encode settles", async () => {
    const completion = deferred<Blob>();
    const firstEncode = vi.fn(() => completion.promise);
    const ignoredEncode = vi.fn(async () => gifBlob());
    const first = start(firstEncode);
    const second = start(ignoredEncode);
    await finish(second);

    expect(firstEncode).toHaveBeenCalledOnce();
    expect(ignoredEncode).not.toHaveBeenCalled();
    expect(result.isGenerating).toBe(true);
    await finish(first, () => completion.resolve(gifBlob()));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(result.isGenerating).toBe(false);
  });

  it("allows a fresh generation after the active one finishes", async () => {
    await finish(start(async () => gifBlob()));
    const firstUrl = result.artifact!.url;
    const next = deferred<Blob>();
    const generation = start(() => next.promise);

    expect(result.artifact).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith(firstUrl);
    expect(result.isGenerating).toBe(true);
    await finish(generation, () => next.resolve(gifBlob()));
    expect(result.artifact!.url).toBe("blob:generated-2");
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it("reports an encode failure and permits retry without keeping an older artifact", async () => {
    await finish(start(async () => gifBlob()));
    const firstUrl = result.artifact!.url;
    await finish(
      start(async () => {
        throw new Error("encoder failed");
      }),
    );

    expect(result.artifact).toBeNull();
    expect(result.error).toBe("encoder failed");
    expect(result.isGenerating).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith(firstUrl);

    const completion = deferred<Blob>();
    const retry = start(() => completion.promise);
    expect(result.error).toBe("");
    await finish(retry, () => completion.resolve(gifBlob()));
    expect(result.artifact).not.toBeNull();
    expect(result.isGenerating).toBe(false);
  });

  it("provides a readable error for a non-Error encoder rejection", async () => {
    await finish(
      start(async () => {
        throw "worker failed";
      }),
    );
    expect(result.error).toBe("GIFの生成に失敗しました");
    expect(result.artifact).toBeNull();
    expect(result.isGenerating).toBe(false);
  });

  it.each(["image/png", "image/gif"])(
    "rejects invalid %s output without making a preview or exposing a fallback",
    async (type) => {
      const invalid = new NodeBlob(["not a GIF"], { type }) as unknown as Blob;
      await finish(start(async () => invalid));
      expect(result.artifact).toBeNull();
      expect(result.error).toContain("128×128 GIF");
      expect(result.isGenerating).toBe(false);
      expect(createObjectURL).not.toHaveBeenCalled();
    },
  );

  it("invalidates an artifact and revokes its URL when settings change", async () => {
    await finish(start(async () => gifBlob()));
    const url = result.artifact!.url;
    renderKey("B");

    expect(result.artifact).toBeNull();
    expect(result.error).toBe("");
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
    renderKey("A");
    expect(result.artifact).toBeNull();
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it("does not invalidate a current artifact on a same-key rerender", async () => {
    await finish(start(async () => gifBlob()));
    const artifact = result.artifact;
    renderKey("A");
    expect(result.artifact).toBe(artifact);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("clears an old error on key changes", async () => {
    await finish(
      start(async () => {
        throw new Error("old failure");
      }),
    );
    expect(result.error).toBe("old failure");
    renderKey("B");
    expect(result.error).toBe("");
  });

  it("discards a generation that resolves after its input key changes", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    renderKey("B");
    await finish(generation, () => completion.resolve(gifBlob()));

    expect(result.artifact).toBeNull();
    expect(result.error).toBe("");
    expect(result.isGenerating).toBe(false);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("discards an old rejection after its input key changes", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    renderKey("B");
    await finish(generation, () => completion.reject(new Error("stale error")));

    expect(result.error).toBe("");
    expect(result.artifact).toBeNull();
    expect(result.isGenerating).toBe(false);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("discards stale success even when inputs change A→B→A", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    renderKey("B");
    renderKey("A");
    await finish(generation, () => completion.resolve(gifBlob()));

    expect(result.artifact).toBeNull();
    expect(result.error).toBe("");
    expect(result.isGenerating).toBe(false);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("discards stale errors even when inputs change A→B→A", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    renderKey("B");
    renderKey("A");
    await finish(generation, () => completion.reject(new Error("previous revision failed")));

    expect(result.error).toBe("");
    expect(result.artifact).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("discards a result if inputs change while GIF validation is still pending", async () => {
    const bytes = deferred<ArrayBuffer>();
    const blob = gifBlob();
    const originalBytes = await blob.arrayBuffer();
    vi.spyOn(blob, "arrayBuffer").mockReturnValue(bytes.promise);
    const generation = start(async () => blob);
    await act(async () => {
      await Promise.resolve();
    });
    renderKey("B");
    renderKey("A");
    await finish(generation, () => bytes.resolve(originalBytes));

    expect(result.artifact).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it.each(["empty/reset", "new-file:2"])(
    "clears the generated preview when the route key becomes %s",
    async (key) => {
      await finish(start(async () => gifBlob()));
      const oldUrl = result.artifact!.url;
      renderKey(key);
      expect(result.artifact).toBeNull();
      expect(result.error).toBe("");
      expect(revokeObjectURL).toHaveBeenCalledWith(oldUrl);
      expect(revokeObjectURL).toHaveBeenCalledOnce();
    },
  );

  it.each(["empty/reset", "new-file:2"])(
    "does not publish an in-flight result after the route key becomes %s",
    async (key) => {
      const completion = deferred<Blob>();
      const generation = start(() => completion.promise);
      renderKey(key);
      await finish(generation, () => completion.resolve(gifBlob()));
      expect(result.artifact).toBeNull();
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(result.isGenerating).toBe(false);
    },
  );

  it("revokes the current generated URL exactly once on unmount", async () => {
    await finish(start(async () => gifBlob()));
    const url = result.artifact!.url;
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });

  it("does not allocate a URL when an encode resolves after unmount", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    unmount();
    await finish(generation, () => completion.resolve(gifBlob()));
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it("revokes a generated URL when unmount occurs before artifact state commits", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    await act(async () => {
      completion.resolve(gifBlob());
      await generation;
      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(result.artifact).toBeNull();
      root.unmount();
      unmounted = true;
    });
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:generated-1");
  });

  it("does not publish an error when an encode rejects after unmount", async () => {
    const completion = deferred<Blob>();
    const generation = start(() => completion.promise);
    unmount();
    await expect(
      finish(generation, () => completion.reject(new Error("late failure"))),
    ).resolves.toBeUndefined();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("ignores a captured generation callback after unmount", async () => {
    const generate = result.generate;
    const encode = vi.fn(async () => gifBlob());
    unmount();
    await generate(encode);
    expect(encode).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("cleans every URL once across replacement, key invalidation and unmount", async () => {
    await finish(start(async () => gifBlob()));
    await finish(start(async () => gifBlob()));
    renderKey("B");
    await finish(start(async () => gifBlob()));
    unmount();

    expect(createObjectURL).toHaveBeenCalledTimes(3);
    expect(revokeObjectURL.mock.calls.map(([url]) => url)).toEqual([
      "blob:generated-1",
      "blob:generated-2",
      "blob:generated-3",
    ]);
  });
});
