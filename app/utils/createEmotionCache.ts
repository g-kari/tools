import createCache from "@emotion/cache";

/**
 * Emotionキャッシュを作成する
 *
 * SSR対応のため、以下の設定を行う:
 * - key: 'css' - スタイルタグの識別子
 * - prepend: true - スタイルを<head>の先頭に挿入し、既存CSSより優先度を下げる
 *
 * @returns Emotionキャッシュインスタンス
 */
export default function createEmotionCache() {
  return createCache({ key: "css", prepend: true });
}
