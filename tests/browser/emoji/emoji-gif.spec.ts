import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  containRequests,
  coreBase,
  configure,
  encodedPreview,
  generate,
  imageFile,
  openGif,
  preview,
  previewBytes,
  save,
  upload,
  type FixtureWindow,
} from "./helpers";

const requests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  requests.set(page, await containRequests(page, false));
});
test.afterEach(async ({ page }) => {
  expect(requests.get(page), "No outbound writes or unexpected destinations").toEqual([]);
});

test("GIF generation is explicit, and preview/save use the same actual Blob without re-encoding", async ({
  page,
}) => {
  await openGif(page);
  await expect(generate(page)).toBeEnabled();
  await expect(save(page)).toBeDisabled();
  await expect(preview(page)).toHaveCount(0);
  await expect(page.locator("#outputQuality")).toHaveCount(0);
  expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.execCalls.length)).toBe(0);

  const url = await encodedPreview(page);
  const actual = await previewBytes(page);
  expect(actual.mime).toBe("image/gif");
  expect(Buffer.from(actual.bytes.slice(0, 6)).toString()).toBe("GIF89a");
  await expect(page.locator(".file-size-info")).toContainText("16,000 bytes");
  await expect(page.locator(".file-size-info")).toContainText("262,144 bytes");
  for (let i = 0; i < 2; i++) {
    const pending = page.waitForEvent("download");
    await save(page).click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/^emoji_\d+\.gif$/);
    expect(download.url()).toBe(url);
    expect(await readFile((await download.path())!)).toEqual(Buffer.from(actual.bytes));
  }
  const state = await page.evaluate(() => {
    const shim = (window as FixtureWindow).emojiFFmpeg;
    return { exec: shim.execCalls, writes: shim.writes, deletes: shim.deletes };
  });
  expect(state.exec).toHaveLength(1);
  expect(state.writes.length).toBeGreaterThan(1);
  expect(
    state.writes.every((write) => write.width === 128 && write.height === 128 && write.bytes > 0),
  ).toBe(true);
  expect(state.writes.every((write) => state.deletes.includes(write.name))).toBe(true);
  expect(state.deletes.some((name) => name.endsWith(".gif"))).toBe(true);
  await expect(page.getByRole("status").first()).toContainText("プレビューと同じGIFを保存しました");
});

for (const platform of ["discord", "slack"] as const) {
  const cap = platform === "discord" ? 262144 : 1048576;
  for (const extra of [0, 1]) {
    test(`${platform}: byte-exact ${extra ? "one byte over" : "at"} cap gates Save`, async ({
      page,
    }) => {
      await openGif(page, { bytes: cap + extra });
      await page.locator("#platform").selectOption(platform);
      await expect(generate(page)).toBeEnabled();
      await generate(page).click();
      await expect(preview(page)).toBeVisible();
      const body = page.locator(".file-size-info");
      await expect(body).toContainText(`${(cap + extra).toLocaleString("en-US")} bytes`);
      await expect(body).toContainText(
        `${platform === "discord" ? "Discord" : "Slack"}向けのツール上限: ${cap.toLocaleString("en-US")} bytes`,
      );
      if (extra) {
        await expect(save(page)).toBeDisabled();
        await expect(body).toContainText("容量制限を超えています");
        await page.locator("#gifColors").selectOption("16");
        await expect(preview(page)).toHaveCount(0);
        await configure(page, { bytes: 16000 });
        await encodedPreview(page);
      } else {
        await expect(save(page)).toBeEnabled();
        await expect(body).toContainText("容量制限内です");
      }
    });
  }
}

test("loading disables generation; a failed shared load is visible and explicitly retryable", async ({
  page,
}) => {
  await openGif(page, { holdLoad: true, loadFailures: 1 });
  await expect(page.getByText("FFmpegを読み込んでいます...", { exact: true })).toBeVisible();
  await expect(generate(page)).toBeDisabled();
  await expect(save(page)).toBeDisabled();
  await page.locator("#gifColors").selectOption("64");
  await page.locator("#animationLoop").selectOption("2");
  expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.loadCalls)).toBe(1);
  await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.releaseLoad());
  const retry = page.getByRole("button", { name: "FFmpegを再読み込み", exact: true });
  await expect(retry).toBeVisible();
  await expect(generate(page)).toBeDisabled();
  await expect(preview(page)).toHaveCount(0);
  await retry.click();
  await encodedPreview(page);
  expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.loadCalls)).toBe(2);
});

test("a core fetch completed after unmount cannot leave a late FFmpeg worker alive", async ({
  page,
}) => {
  let release: (() => void) | undefined;
  let requested = false;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${coreBase}/ffmpeg-core.js`, async (route) => {
    requested = true;
    await pending;
    await route.fulfill({ status: 200, contentType: "text/javascript", body: "fixture" });
  });
  await page.goto("/shim/");
  await upload(page);
  await page.locator('input[name="outputFormat"][value="gif"]').check();
  await expect.poll(() => requested).toBe(true);
  await expect(generate(page)).toBeDisabled();
  await page.evaluate(() => (window as FixtureWindow).emojiFixture.unmount());
  expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.terminations)).toBe(1);
  release!();
  await expect
    .poll(() => page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.loadCalls))
    .toBe(1);
  await expect
    .poll(() => page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.terminations))
    .toBe(2);
  await expect(page.locator("#root")).toBeEmpty();
  expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.execCalls.length)).toBe(0);
});

for (const failure of ["empty", "magic", "exec", "read", "frame"] as const) {
  test(`${failure} failure publishes no fallback and can be retried`, async ({ page }) => {
    await openGif(page);
    await expect(generate(page)).toBeEnabled();
    await configure(page, {
      bytes: failure === "empty" ? 0 : 16000,
      invalidMagic: failure === "magic",
      execFailures: failure === "exec" ? 1 : 0,
      readFailures: failure === "read" ? 1 : 0,
    });
    if (failure === "frame")
      await page.evaluate(() => (window as FixtureWindow).emojiFixture.failNextPng());
    await generate(page).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(preview(page)).toHaveCount(0);
    await expect(save(page)).toBeDisabled();
    await expect(generate(page)).toBeEnabled();
    await configure(page, { bytes: 16000, invalidMagic: false });
    await encodedPreview(page);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("palette options and Bayer-only strength are passed to the real encoder boundary", async ({
  page,
}) => {
  await openGif(page);
  expect(
    await page
      .locator("#gifColors option")
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
  ).toEqual(["256", "128", "64", "32", "16"]);
  expect(
    await page
      .locator("#gifDither option")
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
  ).toEqual(["floyd_steinberg", "sierra2_4a", "bayer", "none"]);
  for (const dither of ["floyd_steinberg", "sierra2_4a", "bayer", "none"]) {
    await page.locator("#gifDither").selectOption(dither);
    await page.locator("#gifColors").selectOption("32");
    if (dither === "bayer") {
      await expect(page.locator("#gifQuality")).toBeVisible();
      await page.locator("#gifQuality").fill("100");
    } else await expect(page.locator("#gifQuality")).toHaveCount(0);
    await encodedPreview(page);
    const args = await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.execCalls.at(-1)!);
    expect(args.join(" ")).toContain("palettegen=max_colors=32");
    expect(args.join(" ")).toContain(`paletteuse=dither=${dither}`);
    if (dither === "bayer") expect(args.join(" ")).toContain("bayer_scale=0");
  }
});

const changes = [
  ["color count", "#gifColors", "64", "select"],
  ["dither", "#gifDither", "none", "select"],
  ["Bayer strength", "#gifQuality", "20", "range"],
  ["FPS", "#animationFps", "18", "range"],
  ["loop", "#animationLoop", "2", "select"],
  ["duration", "#animationDuration", "1.5", "range"],
  ["effect", 'input[name="animationEffect"][value="rotate"]', "", "check"],
  ["easing", 'input[name="gsapEasing"][value="elastic"]', "", "check"],
  ["easing direction", 'input[name="easingDirection"][value="inOut"]', "", "check"],
  ["platform", "#platform", "slack", "select"],
  ["animation off", "#gifAnimate", "", "uncheck"],
  ["format", 'input[name="outputFormat"][value="png"]', "", "check"],
] as const;
for (const [name, selector, value, kind] of changes) {
  test(`${name} change invalidates and revokes the generated artifact`, async ({ page }) => {
    await openGif(page);
    if (selector === "#gifQuality") await page.locator("#gifDither").selectOption("bayer");
    const url = await encodedPreview(page);
    const control = page.locator(selector);
    if (kind === "select") await control.selectOption(value);
    else if (kind === "range") await control.fill(value);
    else if (kind === "check") await control.check();
    else await control.uncheck();
    await expect(preview(page)).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate((src) => (window as FixtureWindow).emojiFixture.revoked.includes(src), url),
      )
      .toBe(true);
    if (name === "format") await page.locator('input[name="outputFormat"][value="gif"]').check();
    await expect(save(page)).toBeDisabled();
    await encodedPreview(page);
    expect(await preview(page).getAttribute("src")).not.toBe(url);
  });
}

test("editing or a replacement image with the same filename invalidates the artifact", async ({
  page,
}) => {
  await openGif(page);
  let url = await encodedPreview(page);
  await page.locator("summary").filter({ hasText: "テキスト埋め込み" }).click();
  await page.locator("#text").fill("新");
  await expect(preview(page)).toHaveCount(0);
  await expect(save(page)).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate((src) => (window as FixtureWindow).emojiFixture.revoked.includes(src), url),
    )
    .toBe(true);
  url = await encodedPreview(page);
  await upload(page, "#2563eb", "synthetic.png");
  await expect(preview(page)).toHaveCount(0);
  await expect(save(page)).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate((src) => (window as FixtureWindow).emojiFixture.revoked.includes(src), url),
    )
    .toBe(true);
  await encodedPreview(page);
});

for (const interruption of ["settings", "reset", "new image", "unmount"] as const) {
  test(`${interruption} during an encode discards the late result`, async ({ page }) => {
    await openGif(page, { holdExec: true });
    await expect(generate(page)).toBeEnabled();
    await generate(page).click();
    await expect
      .poll(() => page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.execCalls.length))
      .toBe(1);
    await expect(save(page)).toBeDisabled();
    const artifactCount = await page.evaluate(
      () =>
        [...(window as FixtureWindow).emojiFixture.blobs.values()].filter(
          (blob) => blob.type === "image/gif",
        ).length,
    );
    if (interruption === "settings") await page.locator("#gifColors").selectOption("16");
    if (interruption === "reset") {
      await page.getByRole("button", { name: "リセット", exact: true }).click();
      await expect(page.locator("#imageFile")).toHaveValue("");
    }
    if (interruption === "new image") await upload(page, "#22c55e", "replacement.png");
    if (interruption === "unmount")
      await page.evaluate(() => (window as FixtureWindow).emojiFixture.unmount());
    await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.releaseExec());
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as FixtureWindow).emojiFFmpeg.deletes.some((name) => name.endsWith(".gif")),
        ),
      )
      .toBe(true);
    await expect(preview(page)).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          [...(window as FixtureWindow).emojiFixture.blobs.values()].filter(
            (blob) => blob.type === "image/gif",
          ).length,
      ),
    ).toBe(artifactCount);
    if (interruption === "unmount") {
      expect(await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.terminations)).toBe(1);
      await expect(page.locator("#root")).toBeEmpty();
      return;
    }
    if (interruption === "reset") await upload(page, "#22c55e", "replacement.png");
    await expect(save(page)).toBeDisabled();
    await encodedPreview(page);
  });
}

test("replacement generation and unmount release every generated preview URL", async ({ page }) => {
  await openGif(page);
  const first = await encodedPreview(page);
  const second = await encodedPreview(page);
  expect(second).not.toBe(first);
  await expect
    .poll(() =>
      page.evaluate((url) => (window as FixtureWindow).emojiFixture.revoked.includes(url), first),
    )
    .toBe(true);
  await page.evaluate(() => (window as FixtureWindow).emojiFixture.unmount());
  expect(
    await page.evaluate(
      (url) => (window as FixtureWindow).emojiFixture.revoked.includes(url),
      second,
    ),
  ).toBe(true);
});

test("static GIF remains real GIF while PNG download keeps its original format", async ({
  page,
}) => {
  await openGif(page);
  await page.locator("#gifAnimate").uncheck();
  await encodedPreview(page);
  const args = await page.evaluate(() => (window as FixtureWindow).emojiFFmpeg.execCalls[0]);
  expect(args[args.indexOf("-frames:v") + 1]).toBe("1");
  await page.locator('input[name="outputFormat"][value="png"]').check();
  const downloadButton = page.getByRole("button", { name: "ダウンロード", exact: true });
  await expect(downloadButton).toBeEnabled();
  const pending = page.waitForEvent("download");
  await downloadButton.click();
  const file = await pending;
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  expect((await readFile((await file.path())!)).subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
});

test("animated GIF to PNG stops playback and preview pixels match the saved static PNG", async ({
  page,
}) => {
  await openGif(page);
  await page.locator('input[name="animationEffect"][value="rotate"]').check();
  await expect(page.locator("#gifAnimate")).toBeChecked();
  const gifUrl = await encodedPreview(page);
  await page.locator('input[name="outputFormat"][value="png"]').check();
  await expect(preview(page)).toHaveCount(0);
  const downloadButton = page.getByRole("button", { name: "ダウンロード", exact: true });
  await expect(downloadButton).toBeEnabled();
  const original = await page
    .locator("canvas.preview-canvas")
    .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL());
  // More than a full animation cycle: hidden GIF playback must not keep altering the PNG canvas.
  await page.waitForTimeout(1100);
  expect(
    await page
      .locator("canvas.preview-canvas")
      .evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
  ).toBe(original);
  const pending = page.waitForEvent("download");
  await downloadButton.click();
  const file = await pending;
  expect(file.suggestedFilename()).toMatch(/\.png$/);
  const equal = await page.evaluate(async (url) => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("PNG preview load failed"));
      image.src = url;
    });
    const actual = document.querySelector<HTMLCanvasElement>("canvas.preview-canvas")!;
    const expected = document.createElement("canvas");
    expected.width = 256;
    expected.height = 256;
    expected.getContext("2d")!.drawImage(image, 0, 0, 256, 256);
    const left = actual.getContext("2d")!.getImageData(0, 0, 256, 256).data;
    const right = expected.getContext("2d")!.getImageData(0, 0, 256, 256).data;
    return left.every((byte, index) => byte === right[index]);
  }, file.url());
  expect(equal).toBe(true);
  expect(
    await page.evaluate(
      (url) => (window as FixtureWindow).emojiFixture.revoked.includes(url),
      gifUrl,
    ),
  ).toBe(true);
});

for (const width of [320, 390, 1280])
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${width}px ${colorScheme} preference: keyboard settings and generation remain usable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      await page.goto("/shim/");
      const zone = page.getByRole("button", { name: "画像ファイルをアップロード", exact: true });
      await zone.focus();
      const chooser = page.waitForEvent("filechooser");
      await zone.press("Enter");
      await (await chooser).setFiles(await imageFile(page));
      await page.locator('input[name="outputFormat"][value="gif"]').focus();
      await page.keyboard.press("Space");
      await expect(generate(page)).toBeEnabled();
      const colors = page.locator("#gifColors");
      await colors.focus();
      await colors.press("ArrowDown");
      await colors.press("Enter");
      await expect(colors).toHaveValue("128");
      await page.locator("#gifDither").focus();
      await page.keyboard.press("b");
      await page.keyboard.press("Enter");
      await expect(page.locator("#gifDither")).toHaveValue("bayer");
      const quality = page.locator("#gifQuality");
      await quality.focus();
      await quality.press("ArrowRight");
      await expect(quality).toHaveValue("81");
      await generate(page).focus();
      await page.keyboard.press("Enter");
      await expect(preview(page)).toBeVisible();
      await expect(save(page)).toBeEnabled();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      for (const control of [
        colors,
        page.locator("#gifDither"),
        generate(page),
        save(page),
        preview(page),
      ]) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
      }
      await save(page).focus();
      const pending = page.waitForEvent("download");
      await page.keyboard.press("Space");
      expect((await pending).suggestedFilename()).toMatch(/\.gif$/);
      await page.screenshot({
        path: `test-results/emoji-gif-${width}-${colorScheme}.png`,
        fullPage: true,
      });
    });
  }
