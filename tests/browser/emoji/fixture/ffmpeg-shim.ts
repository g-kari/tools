/** Only the FFmpeg boundary is deterministic; canvas, route, validation, and Blob URLs are real. */
export interface ShimConfig {
  bytes: number;
  loadFailures: number;
  execFailures: number;
  readFailures: number;
  holdLoad: boolean;
  holdExec: boolean;
  invalidMagic: boolean;
}

export interface ShimState {
  config: ShimConfig;
  loadCalls: number;
  execCalls: string[][];
  writes: { name: string; bytes: number; width: number; height: number }[];
  deletes: string[];
  terminations: number;
  configure: (config: Partial<ShimConfig>) => void;
  releaseLoad: () => void;
  releaseExec: () => void;
}

declare global {
  interface Window {
    emojiFFmpeg: ShimState;
  }
}

let releaseLoad: (() => void) | undefined;
let releaseExec: (() => void) | undefined;
const state: ShimState = {
  config: {
    bytes: 16000,
    loadFailures: 0,
    execFailures: 0,
    readFailures: 0,
    holdLoad: false,
    holdExec: false,
    invalidMagic: false,
  },
  loadCalls: 0,
  execCalls: [],
  writes: [],
  deletes: [],
  terminations: 0,
  configure(config) {
    Object.assign(state.config, config);
  },
  releaseLoad() {
    state.config.holdLoad = false;
    releaseLoad?.();
    releaseLoad = undefined;
  },
  releaseExec() {
    state.config.holdExec = false;
    releaseExec?.();
    releaseExec = undefined;
  },
};
window.emojiFFmpeg = state;

/** A complete 128×128 two-color GIF; emit clear codes to keep LZW codes at three bits. */
function gif(bytes: number, invalidMagic: boolean): Uint8Array {
  if (bytes === 0) return new Uint8Array();
  const output = [
    71, 73, 70, 56, 57, 97, 128, 0, 128, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 0, 10, 0,
    0, 0, 44, 0, 0, 0, 0, 128, 0, 128, 0, 0, 2,
  ];
  const compressed: number[] = [];
  let bits = 0;
  let count = 0;
  function code(value: number) {
    bits |= value << count;
    count += 3;
    while (count >= 8) {
      compressed.push(bits & 255);
      bits >>= 8;
      count -= 8;
    }
  }
  for (let i = 0; i < 128 * 128; i++) {
    code(4);
    code(1);
  }
  code(5);
  if (count) compressed.push(bits & 255);
  for (let i = 0; i < compressed.length; i += 255) {
    const block = compressed.slice(i, i + 255);
    output.push(block.length, ...block);
  }
  output.push(0, 59);
  const result = new Uint8Array(bytes);
  result.set(output.slice(0, bytes));
  // Trailing padding keeps the complete valid GIF intact and reaches exact byte limits.
  result[bytes - 1] = 59;
  if (invalidMagic) result.set([137, 80, 78, 71]);
  return result;
}

export class FFmpeg {
  loaded = false;
  async load() {
    state.loadCalls++;
    if (state.config.holdLoad)
      await new Promise<void>((resolve) => {
        releaseLoad = resolve;
      });
    if (state.config.loadFailures > 0) {
      state.config.loadFailures--;
      throw new Error("Fixture load failed");
    }
    this.loaded = true;
    return true;
  }
  async writeFile(name: string, data: Uint8Array) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    state.writes.push({
      name,
      bytes: data.length,
      width: data.length > 24 ? view.getUint32(16) : 0,
      height: data.length > 24 ? view.getUint32(20) : 0,
    });
    return true;
  }
  async exec(args: string[]) {
    state.execCalls.push([...args]);
    if (state.config.holdExec)
      await new Promise<void>((resolve) => {
        releaseExec = resolve;
      });
    if (state.config.execFailures > 0) {
      state.config.execFailures--;
      return 1;
    }
    return 0;
  }
  async readFile() {
    if (state.config.readFailures > 0) {
      state.config.readFailures--;
      throw new Error("Fixture read failed");
    }
    return gif(state.config.bytes, state.config.invalidMagic);
  }
  async deleteFile(name: string) {
    state.deletes.push(name);
    return true;
  }
  terminate() {
    this.loaded = false;
    state.terminations++;
  }
}
