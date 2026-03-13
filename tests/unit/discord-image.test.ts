import { describe, it, expect } from "vitest";
import {
  generateDiscordEmojiFilename,
  generateDiscordStickerFilename,
  DISCORD_EMOJI_MAX_SIZE,
  DISCORD_EMOJI_MAX_BYTES,
  DISCORD_STICKER_SIZE,
  DISCORD_STICKER_MAX_BYTES,
} from "../../app/utils/discord-image";

describe("Discord画像ユーティリティ", () => {
  describe("定数の確認", () => {
    it("DISCORD_EMOJI_MAX_SIZE は 128 であること", () => {
      expect(DISCORD_EMOJI_MAX_SIZE).toBe(128);
    });

    it("DISCORD_EMOJI_MAX_BYTES は 256KB であること", () => {
      expect(DISCORD_EMOJI_MAX_BYTES).toBe(256 * 1024);
    });

    it("DISCORD_STICKER_SIZE は 320 であること", () => {
      expect(DISCORD_STICKER_SIZE).toBe(320);
    });

    it("DISCORD_STICKER_MAX_BYTES は 512KB であること", () => {
      expect(DISCORD_STICKER_MAX_BYTES).toBe(512 * 1024);
    });
  });

  describe("generateDiscordEmojiFilename", () => {
    it("PNG拡張子のファイル名を正しく生成すること", () => {
      const result = generateDiscordEmojiFilename("my_image.png");
      expect(result).toBe("my_image_discord_emoji.png");
    });

    it("JPEG拡張子のファイル名を変換してPNGにすること", () => {
      const result = generateDiscordEmojiFilename("photo.jpg");
      expect(result).toBe("photo_discord_emoji.png");
    });

    it("WebP拡張子のファイル名を変換してPNGにすること", () => {
      const result = generateDiscordEmojiFilename("image.webp");
      expect(result).toBe("image_discord_emoji.png");
    });

    it("ドットを含むファイル名を正しく処理すること", () => {
      const result = generateDiscordEmojiFilename("my.cool.image.png");
      expect(result).toBe("my.cool.image_discord_emoji.png");
    });

    it("拡張子なしのファイル名を処理すること", () => {
      const result = generateDiscordEmojiFilename("image");
      expect(result).toBe("image_discord_emoji.png");
    });

    it("日本語ファイル名を処理すること", () => {
      const result = generateDiscordEmojiFilename("絵文字素材.png");
      expect(result).toBe("絵文字素材_discord_emoji.png");
    });
  });

  describe("generateDiscordStickerFilename", () => {
    it("PNG拡張子のファイル名を正しく生成すること", () => {
      const result = generateDiscordStickerFilename("my_image.png");
      expect(result).toBe("my_image_discord_sticker.png");
    });

    it("JPEG拡張子のファイル名を変換してPNGにすること", () => {
      const result = generateDiscordStickerFilename("photo.jpg");
      expect(result).toBe("photo_discord_sticker.png");
    });

    it("WebP拡張子のファイル名を変換してPNGにすること", () => {
      const result = generateDiscordStickerFilename("image.webp");
      expect(result).toBe("image_discord_sticker.png");
    });

    it("ドットを含むファイル名を正しく処理すること", () => {
      const result = generateDiscordStickerFilename("my.cool.image.gif");
      expect(result).toBe("my.cool.image_discord_sticker.png");
    });

    it("拡張子なしのファイル名を処理すること", () => {
      const result = generateDiscordStickerFilename("image");
      expect(result).toBe("image_discord_sticker.png");
    });

    it("日本語ファイル名を処理すること", () => {
      const result = generateDiscordStickerFilename("スタンプ素材.png");
      expect(result).toBe("スタンプ素材_discord_sticker.png");
    });
  });

  describe("Discord絵文字の仕様確認", () => {
    it("絵文字の最大サイズが要件（128px）を満たすこと", () => {
      expect(DISCORD_EMOJI_MAX_SIZE).toBeLessThanOrEqual(128);
    });

    it("絵文字の最大バイト数が要件（256KB）を満たすこと", () => {
      expect(DISCORD_EMOJI_MAX_BYTES).toBeLessThanOrEqual(256 * 1024);
    });
  });

  describe("Discordスタンプの仕様確認", () => {
    it("スタンプのサイズが要件（320px）を満たすこと", () => {
      expect(DISCORD_STICKER_SIZE).toBe(320);
    });

    it("スタンプの最大バイト数が要件（512KB）を満たすこと", () => {
      expect(DISCORD_STICKER_MAX_BYTES).toBeLessThanOrEqual(512 * 1024);
    });
  });

  describe("ファイルサイズ制限の確認", () => {
    it("絵文字の制限（256KB）はスタンプの制限（512KB）より小さいこと", () => {
      expect(DISCORD_EMOJI_MAX_BYTES).toBeLessThan(DISCORD_STICKER_MAX_BYTES);
    });

    it("256KB = 262144バイトであること", () => {
      expect(DISCORD_EMOJI_MAX_BYTES).toBe(262144);
    });

    it("512KB = 524288バイトであること", () => {
      expect(DISCORD_STICKER_MAX_BYTES).toBe(524288);
    });
  });
});
