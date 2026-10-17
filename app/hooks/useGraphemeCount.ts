import { useEffect, useState } from "react";
import { countGraphemes } from "../utils/grapheme-count";

/**
 * Use the browser's segmentation after hydration. The shared initial undefined
 * value prevents server/browser Intl support or Unicode versions from changing
 * the initial markup. Once mounted, count the current input synchronously.
 */
export function useGraphemeCount(text: string): number | null | undefined {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? countGraphemes(text) : undefined;
}
