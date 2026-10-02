import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  containRequests,
  coreBase,
  generate,
  preview,
  previewBytes,
  save,
  upload,
} from "./helpers";
import { inspectGif } from "./gif-inspector";

/** No encoder shim in /real/: exercise the exact package/core already used in production. */
test("browser FFmpeg produces real 128px GIFs with FPS timing, infinite/finite loop, and byte-identical Save", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const blocked = await containRequests(page, true);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/real/");
  expect(await page.evaluate(() => "emojiFFmpeg" in window)).toBe(false);
  await upload(page);
  await page.locator('input[name="outputFormat"][value="gif"]').check();
  await page.locator('input[name="animationEffect"][value="rotate"]').check();
  await page.locator("#gifColors").selectOption("64");
  await page.locator("#animationFps").fill("12");
  await page.locator("#animationDuration").fill("1");
  await expect(generate(page)).toBeEnabled({ timeout: 120000 });
  await expect(save(page)).toBeDisabled();
  await expect(preview(page)).toHaveCount(0);

  for (const loop of [0, 2]) {
    await page.locator("#animationLoop").selectOption(String(loop));
    await generate(page).click();
    await expect(preview(page)).toBeVisible({ timeout: 60000 });
    await expect(preview(page)).toHaveJSProperty("naturalWidth", 128);
    await expect(preview(page)).toHaveJSProperty("naturalHeight", 128);
    await expect(save(page)).toBeEnabled();
    const artifact = await previewBytes(page);
    const bytes = new Uint8Array(artifact.bytes);
    const inspected = inspectGif(bytes);
    expect(artifact.mime).toBe("image/gif");
    expect(inspected.signature).toBe("GIF89a");
    expect(inspected.width).toBe(128);
    expect(inspected.height).toBe(128);
    expect(inspected.frames).toHaveLength(12);
    expect(inspected.loopCount).toBe(loop);
    expect(
      inspected.frames.every(
        (frame) =>
          frame.width > 0 &&
          frame.height > 0 &&
          frame.left + frame.width <= 128 &&
          frame.top + frame.height <= 128,
      ),
    ).toBe(true);
    expect(
      inspected.frames.every(
        (frame) => frame.delayCentiseconds === 8 || frame.delayCentiseconds === 9,
      ),
    ).toBe(true);
    expect(Math.abs(inspected.totalDurationCentiseconds - 100)).toBeLessThanOrEqual(2);
    expect(bytes.length).toBeLessThanOrEqual(262144);
    await expect(page.locator(".file-size-info")).toContainText(
      `${bytes.length.toLocaleString("en-US")} bytes`,
    );
    const pending = page.waitForEvent("download");
    await save(page).click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
    expect(await readFile((await download.path())!)).toEqual(Buffer.from(bytes));
    await info.attach(`real-ffmpeg-loop-${loop}.gif`, {
      body: Buffer.from(bytes),
      contentType: "image/gif",
    });
    await info.attach(`real-ffmpeg-loop-${loop}.json`, {
      body: JSON.stringify(
        { coreBase, bytes: bytes.length, mime: artifact.mime, ...inspected },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }

  await page.locator("#gifAnimate").uncheck();
  await expect(preview(page)).toHaveCount(0);
  await expect(save(page)).toBeDisabled();
  await expect(generate(page)).toBeEnabled();
  await generate(page).click();
  await expect(preview(page)).toBeVisible({ timeout: 60000 });
  const staticGif = await previewBytes(page);
  expect(staticGif.mime).toBe("image/gif");
  expect(inspectGif(new Uint8Array(staticGif.bytes)).frames).toHaveLength(1);
  expect(blocked, "No unexpected destinations or outbound writes").toEqual([]);
  expect(errors, "No browser exceptions").toEqual([]);
  await page.screenshot({ path: "test-results/emoji-gif-real-ffmpeg.png", fullPage: true });
});
