/**
 * Discord画像変換ユーティリティ
 * Discord絵文字（128x128px, 256KB以下）とスタンプ（320x320px, 512KB以下）への変換をサポート
 */

/** Discord絵文字の最大サイズ（px） */
export const DISCORD_EMOJI_MAX_SIZE = 128;

/** Discord絵文字の最大ファイルサイズ（バイト） */
export const DISCORD_EMOJI_MAX_BYTES = 256 * 1024;

/** Discordスタンプのサイズ（px） */
export const DISCORD_STICKER_SIZE = 320;

/** Discordスタンプの最大ファイルサイズ（バイト） */
export const DISCORD_STICKER_MAX_BYTES = 512 * 1024;

/**
 * Discord画像変換オプション
 */
export interface DiscordImageOptions {
  /** 変換タイプ: 'emoji' = 絵文字, 'sticker' = スタンプ */
  type: "emoji" | "sticker";
  /**
   * 絵文字の場合のリサイズモード
   * - 'fit': アスペクト比を維持して128px以内に収める
   * - 'crop': 正方形にクロップ（短辺を128pxに合わせる）
   */
  emojiResizeMode?: "fit" | "crop";
}

/**
 * 画像ファイルをHTMLImageElementとして読み込む
 * @param file - 読み込む画像ファイル
 * @returns 読み込まれたHTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
}

/**
 * CanvasをBlobに変換する
 * @param canvas - 変換するCanvas要素
 * @param quality - 画質（0.0〜1.0, PNGは無視される）
 * @returns PNG形式のBlob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number = 1.0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Blobへの変換に失敗しました"));
        }
      },
      "image/png",
      quality
    );
  });
}

/**
 * Discord絵文字用に画像を変換する（128x128px以内, PNG, 256KB以下）
 *
 * アスペクト比を維持してリサイズする場合は 'fit' モード、
 * 正方形にクロップする場合は 'crop' モードを使用する。
 *
 * @param img - 変換元のHTMLImageElement
 * @param mode - リサイズモード ('fit' | 'crop')
 * @returns 変換後のBlob
 */
async function convertToDiscordEmoji(
  img: HTMLImageElement,
  mode: "fit" | "crop"
): Promise<Blob> {
  const MAX = DISCORD_EMOJI_MAX_SIZE;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2Dコンテキストの取得に失敗しました");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { naturalWidth: srcW, naturalHeight: srcH } = img;

  if (mode === "crop") {
    // 正方形クロップ: 短辺を基準にクロップして128x128に
    const size = Math.min(srcW, srcH);
    const sx = (srcW - size) / 2;
    const sy = (srcH - size) / 2;

    canvas.width = MAX;
    canvas.height = MAX;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX, MAX);
  } else {
    // fit: アスペクト比を維持して128px以内に収める
    const scale = Math.min(MAX / srcW, MAX / srcH, 1);
    const destW = Math.round(srcW * scale);
    const destH = Math.round(srcH * scale);

    canvas.width = destW;
    canvas.height = destH;
    ctx.drawImage(img, 0, 0, destW, destH);
  }

  // PNGで出力。サイズ超過時は品質を下げて再試行（PNGは可逆のため実際にはほぼ効果なし）
  let blob = await canvasToBlob(canvas, 1.0);

  // 256KB以下に収まらない場合、段階的に品質を下げて試みる
  let quality = 0.9;
  while (blob.size > DISCORD_EMOJI_MAX_BYTES && quality > 0.1) {
    blob = await canvasToBlob(canvas, quality);
    quality -= 0.1;
  }

  return blob;
}

/**
 * Discordスタンプ用に画像を変換する（320x320px, PNG, 512KB以下）
 *
 * 画像をアスペクト比を維持して320x320の正方形キャンバスに中央配置する。
 * 背景は透明で、画像が320pxを超える場合はリサイズする。
 *
 * @param img - 変換元のHTMLImageElement
 * @returns 変換後のBlob
 */
async function convertToDiscordSticker(img: HTMLImageElement): Promise<Blob> {
  const SIZE = DISCORD_STICKER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2Dコンテキストの取得に失敗しました");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 背景は透明（clearRect はデフォルトで透明）
  ctx.clearRect(0, 0, SIZE, SIZE);

  const { naturalWidth: srcW, naturalHeight: srcH } = img;

  // アスペクト比を維持して320x320に収まるようにリサイズ
  const scale = Math.min(SIZE / srcW, SIZE / srcH);
  const destW = Math.round(srcW * scale);
  const destH = Math.round(srcH * scale);

  // 中央に配置
  const offsetX = Math.round((SIZE - destW) / 2);
  const offsetY = Math.round((SIZE - destH) / 2);

  ctx.drawImage(img, offsetX, offsetY, destW, destH);

  const blob = await canvasToBlob(canvas, 1.0);

  if (blob.size > DISCORD_STICKER_MAX_BYTES) {
    throw new Error(
      `変換後のファイルサイズ（${Math.round(blob.size / 1024)}KB）が512KBを超えています。より小さな画像を使用してください。`
    );
  }

  return blob;
}

/**
 * 画像ファイルをDiscord用フォーマットに変換する
 *
 * @param file - 変換元の画像ファイル
 * @param options - 変換オプション
 * @returns 変換後のBlob（PNG形式）
 */
export async function convertToDiscordFormat(
  file: File,
  options: DiscordImageOptions
): Promise<Blob> {
  const img = await loadImage(file);

  if (options.type === "emoji") {
    const mode = options.emojiResizeMode ?? "fit";
    return convertToDiscordEmoji(img, mode);
  } else {
    return convertToDiscordSticker(img);
  }
}

/**
 * Discord絵文字用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @returns 変換後のファイル名（.png拡張子）
 */
export function generateDiscordEmojiFilename(originalName: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_discord_emoji.png`;
}

/**
 * Discordスタンプ用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @returns 変換後のファイル名（.png拡張子）
 */
export function generateDiscordStickerFilename(originalName: string): string {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_discord_sticker.png`;
}
