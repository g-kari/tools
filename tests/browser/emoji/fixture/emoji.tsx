/** Render the production component and production styles, without Workers or a substitute UI. */
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EmojiConverter } from "../../../../app/routes/emoji-converter";
import "./styles.css";

export interface EmojiFixture {
  blobs: Map<string, Blob>;
  revoked: string[];
  unmount: () => void;
  mount: () => void;
  failNextPng: () => void;
}

declare global {
  interface Window {
    emojiFixture: EmojiFixture;
  }
}

const blobs = new Map<string, Blob>();
const revoked: string[] = [];
const createObjectURL = URL.createObjectURL.bind(URL);
const revokeObjectURL = URL.revokeObjectURL.bind(URL);
URL.createObjectURL = (blob: Blob | MediaSource) => {
  const url = createObjectURL(blob);
  if (blob instanceof Blob) blobs.set(url, blob);
  return url;
};
URL.revokeObjectURL = (url: string) => {
  revoked.push(url);
  revokeObjectURL(url);
};

let failPng = false;
// oxlint-disable-next-line typescript/unbound-method -- Retain the original; .call below supplies its canvas receiver.
const toBlob = HTMLCanvasElement.prototype.toBlob;
HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
  if (failPng && type === "image/png") {
    failPng = false;
    queueMicrotask(() => callback(null));
    return;
  }
  toBlob.call(this, callback, type, quality);
};

const container = document.getElementById("root");
if (!container) throw new Error("Fixture root is missing");
let root: Root | undefined;
function mount() {
  if (root) throw new Error("Already mounted");
  root = createRoot(container!);
  root.render(createElement(EmojiConverter));
}
window.emojiFixture = {
  blobs,
  revoked,
  mount,
  unmount() {
    root?.unmount();
    root = undefined;
  },
  failNextPng() {
    failPng = true;
  },
};
mount();
