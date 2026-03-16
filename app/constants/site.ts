/**
 * サイト全体で使用する定数
 */
export const SITE_NAME = 'Web ツール集';
export const SITE_BASE_URL = 'https://tools.0g0.dev';
export const SITE_OGP_IMAGE = `${SITE_BASE_URL}/ogp-default.png`;
export const SITE_DESCRIPTION = '開発者向けWebツール集。Unicode変換、JSON整形、UUID生成、パスワード生成など100以上のツールを無料で提供。';

/** Google AdSense パブリッシャーID（環境変数から読み込む） */
export const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID ?? '';
/** Google AdSense スロットID（環境変数から読み込む） */
export const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT ?? '';
