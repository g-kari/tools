import { useCallback, useEffect, useRef, useState } from "react";
import { validateEmojiGif } from "~/utils/emojiGifExport";

interface GifArtifact {
  blob: Blob;
  url: string;
  key: string;
  revision: number;
}

/** Own a generated GIF URL, invalidate changed inputs, and discard late async results. */
export function useGeneratedGif(key: string) {
  const keyRef = useRef(key);
  const revisionRef = useRef(0);
  if (keyRef.current !== key) {
    keyRef.current = key;
    revisionRef.current++;
  }
  const mounted = useRef(false);
  const busy = useRef(false);
  const urlRef = useRef("");
  const releaseUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = "";
  }, []);
  const [artifact, setArtifact] = useState<GifArtifact | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      revisionRef.current++;
      releaseUrl();
    };
  }, [releaseUrl]);

  useEffect(() => {
    releaseUrl();
    setArtifact(null);
    setError("");
  }, [key, releaseUrl]);

  const generate = useCallback(
    async (encode: () => Promise<Blob>) => {
      if (busy.current || !mounted.current) return;
      busy.current = true;
      const startedKey = keyRef.current;
      const startedRevision = revisionRef.current;
      setIsGenerating(true);
      setError("");
      releaseUrl();
      setArtifact(null);
      try {
        const blob = await encode();
        await validateEmojiGif(blob);
        if (mounted.current && revisionRef.current === startedRevision) {
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          setArtifact({ blob, url, key: startedKey, revision: startedRevision });
        }
      } catch (cause) {
        if (mounted.current && revisionRef.current === startedRevision) {
          setError(cause instanceof Error ? cause.message : "GIFの生成に失敗しました");
        }
      } finally {
        busy.current = false;
        if (mounted.current) setIsGenerating(false);
      }
    },
    [releaseUrl],
  );

  return {
    artifact: artifact?.key === key && artifact.revision === revisionRef.current ? artifact : null,
    isGenerating,
    error,
    generate,
  };
}
