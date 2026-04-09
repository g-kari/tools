import { test, expect } from "@playwright/test";

test.describe("Dockerfile ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dockerfile");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByLabel("ベースイメージ")).toBeVisible();
    await expect(page.getByLabel("生成されたDockerfile")).toBeVisible();
  });

  test("デフォルトでFROM node:20-alpineが生成される", async ({ page }) => {
    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("FROM node:20-alpine");
  });

  test("ベースイメージを変更するとFROMが更新される", async ({ page }) => {
    const fromInput = page.getByLabel("ベースイメージ");
    await fromInput.fill("python:3.12-slim");

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("FROM python:3.12-slim");
  });

  test("Node.jsテンプレートを読み込む", async ({ page }) => {
    await page.getByLabel("Node.jsテンプレートを読み込む").click();

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("FROM node:20-alpine");
    await expect(preview).toContainText("NODE_ENV=production");
    await expect(preview).toContainText("EXPOSE 3000");
  });

  test("Pythonテンプレートを読み込む", async ({ page }) => {
    await page.getByLabel("Pythonテンプレートを読み込む").click();

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("FROM python:3.12-slim");
    await expect(preview).toContainText("PYTHONUNBUFFERED");
  });

  test("Goテンプレートを読み込む", async ({ page }) => {
    await page.getByLabel("Goテンプレートを読み込む").click();

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("FROM golang:1.22-alpine AS builder");
  });

  test("ENVを追加するとプレビューに反映される", async ({ page }) => {
    await page.getByLabel("ENVを追加").click();

    const envKey = page.getByLabel("ENV 1 の変数名");
    const envVal = page.getByLabel("ENV 1 の値");
    await envKey.fill("MY_VAR");
    await envVal.fill("hello");

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("ENV MY_VAR=hello");
  });

  test("COPYを追加するとプレビューに反映される", async ({ page }) => {
    await page.getByLabel("COPYを追加").click();

    const src = page.getByLabel("COPY 1 のコピー元");
    const dest = page.getByLabel("COPY 1 のコピー先");
    await src.fill("dist/");
    await dest.fill("/app/dist/");

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("COPY dist/ /app/dist/");
  });

  test("RUNを追加するとプレビューに反映される", async ({ page }) => {
    await page.getByLabel("RUNコマンドを追加").click();

    const run = page.getByLabel("RUN 1 のコマンド");
    await run.fill("npm install");

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("RUN npm install");
  });

  test("EXPOSEを追加するとプレビューに反映される", async ({ page }) => {
    await page.getByLabel("EXPOSEポートを追加").click();

    const port = page.getByLabel("EXPOSE 1 のポート番号");
    await port.fill("8080");

    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("EXPOSE 8080");
  });

  test("リセットボタンでデフォルト設定に戻る", async ({ page }) => {
    // テンプレートを読み込んでから
    await page.getByLabel("Pythonテンプレートを読み込む").click();
    const preview = page.getByLabel("生成されたDockerfile");
    await expect(preview).toContainText("python:3.12-slim");

    // リセット
    await page.getByLabel("設定をリセット").click();
    await expect(preview).toContainText("node:20-alpine");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("Dockerfileをコピー")).toBeVisible();
  });

  test("メタデータが正しく設定されている", async ({ page }) => {
    await expect(page).toHaveTitle(/Dockerfile.*ジェネレーター/);
  });
});
