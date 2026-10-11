/** Structural GIF inspection for browser-export assertions; this does not decode pixels. */
export interface GifFrame {
  left: number;
  top: number;
  width: number;
  height: number;
  interlaced: boolean;
  localColorTableSize: number;
  delayCentiseconds: number;
  disposalMethod: number;
  transparentColorIndex: number | null;
  userInput: boolean;
}

export interface GifInspection {
  signature: "GIF87a" | "GIF89a";
  width: number;
  height: number;
  globalColorTableSize: number;
  /** null means no loop extension; zero means infinite looping. */
  loopCount: number | null;
  frames: GifFrame[];
  totalDurationCentiseconds: number;
}

interface GraphicControl {
  delayCentiseconds: number;
  disposalMethod: number;
  transparentColorIndex: number | null;
  userInput: boolean;
}

const DEFAULT_CONTROL: GraphicControl = {
  delayCentiseconds: 0,
  disposalMethod: 0,
  transparentColorIndex: null,
  userInput: false,
};

/**
 * Parse actual GIF blocks, so marker-looking bytes inside palettes/compressed
 * image data cannot be mistaken for frames or animation metadata.
 * Throws a descriptive error for malformed or truncated structural data.
 */
export function inspectGif(input: Uint8Array | ArrayBuffer): GifInspection {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let offset = 0;

  function fail(message: string): never {
    throw new Error(`Invalid GIF at byte ${offset}: ${message}`);
  }
  const take = (length: number, description: string): Uint8Array => {
    if (offset + length > bytes.length) fail(`truncated ${description}`);
    const value = bytes.subarray(offset, offset + length);
    offset += length;
    return value;
  };
  const byte = (description: string): number => take(1, description)[0];
  const uint16 = (description: string): number => {
    const value = take(2, description);
    return value[0] | (value[1] << 8);
  };
  const ascii = (value: Uint8Array): string => String.fromCharCode(...value);
  const colorTableSize = (packed: number): number =>
    packed & 0x80 ? 1 << ((packed & 0x07) + 1) : 0;
  const subBlocks = (description: string): Uint8Array[] => {
    const blocks: Uint8Array[] = [];
    while (true) {
      const length = byte(`${description} sub-block size`);
      if (length === 0) return blocks;
      blocks.push(take(length, `${description} sub-block`));
    }
  };

  const signature = ascii(take(6, "header"));
  if (signature !== "GIF87a" && signature !== "GIF89a") fail("missing GIF87a/GIF89a signature");
  const width = uint16("logical-screen width");
  const height = uint16("logical-screen height");
  if (width === 0 || height === 0) fail("zero logical-screen dimensions");
  const screenPacked = byte("logical-screen flags");
  take(2, "logical-screen background/aspect ratio");
  const globalColorTableSize = colorTableSize(screenPacked);
  take(globalColorTableSize * 3, "global color table");

  const frames: GifFrame[] = [];
  let loopCount: number | null = null;
  let pendingControl: GraphicControl | null = null;

  while (offset < bytes.length) {
    const marker = byte("block marker");
    if (marker === 0x3b) {
      if (frames.length === 0) fail("no image frames");
      return {
        signature,
        width,
        height,
        globalColorTableSize,
        loopCount,
        frames,
        totalDurationCentiseconds: frames.reduce(
          (total, frame) => total + frame.delayCentiseconds,
          0,
        ),
      };
    }

    if (marker === 0x2c) {
      const left = uint16("image left offset");
      const top = uint16("image top offset");
      const frameWidth = uint16("image width");
      const frameHeight = uint16("image height");
      if (frameWidth === 0 || frameHeight === 0) fail("zero image dimensions");
      const packed = byte("image flags");
      const localColorTableSize = colorTableSize(packed);
      take(localColorTableSize * 3, "local color table");
      const codeSize = byte("LZW minimum code size");
      if (codeSize < 2 || codeSize > 8) fail("invalid LZW minimum code size");
      if (subBlocks("image data").length === 0) fail("empty image data");
      frames.push({
        left,
        top,
        width: frameWidth,
        height: frameHeight,
        interlaced: Boolean(packed & 0x40),
        localColorTableSize,
        ...(pendingControl ?? DEFAULT_CONTROL),
      });
      pendingControl = null;
      continue;
    }

    if (marker !== 0x21) fail(`unexpected block marker 0x${marker.toString(16)}`);
    const label = byte("extension label");
    if (label === 0xf9) {
      if (byte("graphic-control size") !== 4) fail("graphic-control size must be four");
      const packed = byte("graphic-control flags");
      const delayCentiseconds = uint16("graphic-control delay");
      const transparencyIndex = byte("graphic-control transparent color");
      if (byte("graphic-control terminator") !== 0) fail("missing graphic-control terminator");
      pendingControl = {
        delayCentiseconds,
        disposalMethod: (packed >> 2) & 0x07,
        transparentColorIndex: packed & 0x01 ? transparencyIndex : null,
        userInput: Boolean(packed & 0x02),
      };
    } else if (label === 0xff) {
      if (byte("application-extension size") !== 11)
        fail("application-extension size must be eleven");
      const application = ascii(take(11, "application identifier"));
      const blocks = subBlocks("application data");
      if (application === "NETSCAPE2.0" || application === "ANIMEXTS1.0") {
        const loop = blocks.find((block) => block[0] === 1);
        if (!loop || loop.length !== 3) fail("malformed animation loop extension");
        loopCount = loop[1] | (loop[2] << 8);
      }
    } else if (label === 0x01) {
      if (byte("plain-text size") !== 12) fail("plain-text size must be twelve");
      take(12, "plain-text header");
      subBlocks("plain-text data");
      // Graphic control applies to the next rendering block, including text.
      pendingControl = null;
    } else {
      // Comments and unknown extension labels are chains of data sub-blocks.
      subBlocks("extension data");
    }
  }

  return fail("missing GIF trailer");
}
