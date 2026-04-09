/**
 * @fileoverview User-Agent解析ユーティリティ
 * 外部ライブラリを使用せず、ブラウザ標準APIとregexのみでUser-Agent文字列を解析する
 */

/**
 * User-Agent解析結果の型定義
 */
export interface UserAgentInfo {
  /** ブラウザ名 */
  browserName: string;
  /** ブラウザバージョン */
  browserVersion: string;
  /** エンジン名 */
  engineName: string;
  /** OS名 */
  osName: string;
  /** OSバージョン */
  osVersion: string;
  /** デバイスタイプ */
  deviceType: "Desktop" | "Mobile" | "Tablet" | "Bot" | "Unknown";
  /** モバイル判定 */
  isMobile: boolean;
  /** タブレット判定 */
  isTablet: boolean;
  /** Bot判定 */
  isBot: boolean;
}

/**
 * User-Agent文字列からBotかどうかを判定する
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns Botであればtrue
 */
function detectBot(ua: string): boolean {
  return /bot|crawler|spider|scraper|curl|wget|python|java|Go-http-client|libwww|httpunit|nutch|phpcrawl|biglotron|teoma|convera|gigabot|ia_archiver|webmon|httrack|grub\.org|netresearchserver|speedy|fluffy|findlinks|panscient|ips-agent|yanga|cyberpatrol|postrank|buzzbot|mlbot|perman|yandex|blekkobot|syntryx/i.test(
    ua,
  );
}

/**
 * User-Agent文字列からタブレットかどうかを判定する
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns タブレットであればtrue
 */
function detectTablet(ua: string): boolean {
  return /iPad|Android(?!.*Mobile).*Safari|Tablet|tablet|Kindle|Silk|PlayBook/i.test(ua);
}

/**
 * User-Agent文字列からモバイルかどうかを判定する
 * タブレットはモバイルに含まない
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns モバイルであればtrue
 */
function detectMobile(ua: string): boolean {
  return /Mobile|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|webOS/i.test(
    ua,
  );
}

/**
 * User-Agent文字列からブラウザ名とバージョンを検出する
 * 優先順位: Edge → Chrome → Firefox → Safari → Opera → IE
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns ブラウザ名とバージョンのオブジェクト
 */
function detectBrowser(ua: string): { name: string; version: string } {
  // Edge (Chromium-based)
  let match = ua.match(/Edg\/(\d[\d.]*)/);
  if (match) return { name: "Edge", version: match[1] };

  // Edge (Legacy)
  match = ua.match(/Edge\/(\d[\d.]*)/);
  if (match) return { name: "Edge", version: match[1] };

  // Chrome (Chromeを検出する前にOperaをチェック)
  match = ua.match(/OPR\/(\d[\d.]*)/);
  if (match) return { name: "Opera", version: match[1] };

  match = ua.match(/Opera\/(\d[\d.]*)/);
  if (match) return { name: "Opera", version: match[1] };

  match = ua.match(/Chrome\/(\d[\d.]*)/);
  if (match) return { name: "Chrome", version: match[1] };

  match = ua.match(/Firefox\/(\d[\d.]*)/);
  if (match) return { name: "Firefox", version: match[1] };

  // Safari (CrMoなどChrome系を除外)
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    match = ua.match(/Version\/(\d[\d.]*)/);
    if (match) return { name: "Safari", version: match[1] };
    return { name: "Safari", version: "Unknown" };
  }

  // Internet Explorer
  match = ua.match(/MSIE (\d[\d.]*)/);
  if (match) return { name: "Internet Explorer", version: match[1] };

  match = ua.match(/Trident\/.*rv:(\d[\d.]*)/);
  if (match) return { name: "Internet Explorer", version: match[1] };

  return { name: "Unknown", version: "Unknown" };
}

/**
 * User-Agent文字列からレンダリングエンジン名を検出する
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns エンジン名
 */
function detectEngine(ua: string): string {
  if (/Gecko\//.test(ua) && /Firefox\//.test(ua)) return "Gecko";
  if (/AppleWebKit\//.test(ua) && !/Chrome\//.test(ua)) return "WebKit";
  if (/Blink|Chrome\//.test(ua)) return "Blink";
  if (/Trident\//.test(ua)) return "Trident";
  if (/Presto\//.test(ua)) return "Presto";
  if (/Gecko\//.test(ua)) return "Gecko";
  return "Unknown";
}

/**
 * User-Agent文字列からOS名とバージョンを検出する
 * 優先順位: Windows → macOS → iOS → Android → Linux
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns OS名とバージョンのオブジェクト
 */
function detectOS(ua: string): { name: string; version: string } {
  // Windows
  let match = ua.match(/Windows NT (\d[\d.]*)/);
  if (match) {
    const versionMap: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
      "6.0": "Vista",
      "5.2": "XP x64",
      "5.1": "XP",
      "5.0": "2000",
    };
    const version = versionMap[match[1]] ?? match[1];
    return { name: "Windows", version };
  }

  // iOS (iPhone/iPad - macOSより先に検出)
  match = ua.match(/(?:iPhone|iPad|iPod).*OS (\d[\d_]*)/);
  if (match) {
    return { name: "iOS", version: match[1].replace(/_/g, ".") };
  }

  // macOS
  match = ua.match(/Mac OS X (\d[\d_.]*)/);
  if (match) {
    return { name: "macOS", version: match[1].replace(/_/g, ".") };
  }

  // Android
  match = ua.match(/Android (\d[\d.]*)/);
  if (match) {
    return { name: "Android", version: match[1] };
  }

  // Chrome OS (Linuxより先に検出する)
  match = ua.match(/CrOS \S+ (\d[\d.]*)/);
  if (match) {
    return { name: "Chrome OS", version: match[1] };
  }

  // Linux
  if (/Linux/.test(ua)) {
    return { name: "Linux", version: "Unknown" };
  }

  return { name: "Unknown", version: "Unknown" };
}

/**
 * User-Agent文字列を解析してUserAgentInfoを返す
 *
 * @param ua - 解析するUser-Agent文字列
 * @returns 解析結果のUserAgentInfoオブジェクト
 *
 * @example
 * ```ts
 * const info = parseUserAgent(navigator.userAgent);
 * console.log(info.browserName); // "Chrome"
 * console.log(info.osName);      // "Windows"
 * ```
 */
export function parseUserAgent(ua: string): UserAgentInfo {
  if (!ua.trim()) {
    return {
      browserName: "Unknown",
      browserVersion: "Unknown",
      engineName: "Unknown",
      osName: "Unknown",
      osVersion: "Unknown",
      deviceType: "Unknown",
      isMobile: false,
      isTablet: false,
      isBot: false,
    };
  }

  const isBot = detectBot(ua);
  const isTablet = !isBot && detectTablet(ua);
  const isMobile = !isBot && !isTablet && detectMobile(ua);

  let deviceType: UserAgentInfo["deviceType"];
  if (isBot) {
    deviceType = "Bot";
  } else if (isTablet) {
    deviceType = "Tablet";
  } else if (isMobile) {
    deviceType = "Mobile";
  } else if (ua.trim()) {
    deviceType = "Desktop";
  } else {
    deviceType = "Unknown";
  }

  const browser = detectBrowser(ua);
  const engine = detectEngine(ua);
  const os = detectOS(ua);

  return {
    browserName: browser.name,
    browserVersion: browser.version,
    engineName: engine,
    osName: os.name,
    osVersion: os.version,
    deviceType,
    isMobile,
    isTablet,
    isBot,
  };
}
