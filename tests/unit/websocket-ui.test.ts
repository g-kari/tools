// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { encode, decode } from "@msgpack/msgpack";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider } from "../../app/components/Toast";
import { Route } from "../../app/routes/websocket";

describe("WebSocket tester interactions with an offline socket", () => {
  let container: HTMLDivElement;
  let root: Root;
  let failConstruction: boolean;
  const sockets: OfflineSocket[] = [];
  class OfflineSocket {
    binaryType = "";
    onopen: (() => void) | null = null;
    onclose: ((event: { code: number; reason: string }) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    send = vi.fn();
    close = vi.fn((code = 1000, reason = "") => this.onclose?.({ code, reason }));
    constructor(readonly url: string) {
      if (failConstruction) throw new Error("Offline constructor failure");
      sockets.push(this);
    }
  }

  beforeEach(() => {
    sockets.length = 0;
    failConstruction = false;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("WebSocket", OfflineSocket);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const Component = Route.options.component!;
    act(() => root.render(createElement(ToastProvider, { children: createElement(Component) })));
  });
  afterEach(() => {
    act(() => root.unmount());
    for (const socket of sockets) {
      // Live sockets must not retain callbacks after unmount. Closed sockets
      // have already been detached from the component by the close handler.
      if (socket.onopen === null) expect(socket.onmessage).toBeNull();
    }
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function get<T extends Element = HTMLElement>(selector: string): T {
    const result = container.querySelector<T>(selector);
    expect(result, selector).not.toBeNull();
    return result!;
  }
  function click(label: string) {
    act(() => get<HTMLButtonElement>(`button[aria-label="${label}"]`).click());
  }
  function change(selector: string, value: string) {
    const input = get<HTMLInputElement>(selector);
    act(() => {
      input.value = value;
      Simulate.change(input);
    });
  }
  function type(name: string) {
    const button = Array.from(
      get('[aria-label="メッセージタイプ"]').querySelectorAll<HTMLButtonElement>("button"),
    ).find((candidate) => candidate.textContent?.includes(name));
    expect(button, name).toBeDefined();
    act(() => button!.click());
  }
  function connect() {
    click("WebSocketに接続する");
    expect(get(".websocket-status").textContent).toContain("接続中");
    const socket = sockets.at(-1)!;
    expect(socket.binaryType).toBe("arraybuffer");
    act(() => socket.onopen!());
    return socket;
  }

  it("rejects invalid addresses, reports construction failure and recovers on retry", () => {
    change("#ws-url-input", "https://example.com");
    click("WebSocketに接続する");
    expect(sockets).toHaveLength(0);
    expect(container.textContent).toContain("有効なWebSocket URL");
    change("#ws-url-input", "wss://example.com/offline");
    failConstruction = true;
    click("WebSocketに接続する");
    expect(get('[aria-label="WebSocketメッセージログ"]').textContent).toContain(
      "Offline constructor failure",
    );
    failConstruction = false;
    const socket = connect();
    expect(socket.url).toBe("wss://example.com/offline");
    click("WebSocket接続を切断する");
    expect(socket.close).toHaveBeenCalledWith(1000, "ユーザーによる切断");
    expect(get('[aria-label="WebSocketメッセージログ"]').textContent).toContain(
      "ユーザーによる切断",
    );
  });

  it("sends text, JSON, MessagePack and hexadecimal payloads while retaining invalid input", () => {
    const socket = connect();
    const message = '[aria-label="送信するメッセージ"]';
    change(message, "hello");
    act(() => Simulate.keyDown(get(message), { key: "Enter", ctrlKey: true }));
    expect(socket.send).toHaveBeenLastCalledWith("hello");
    expect(get<HTMLTextAreaElement>(message).value).toBe("");
    type("JSON");
    change(message, "{");
    click("メッセージを送信");
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(get<HTMLTextAreaElement>(message).value).toBe("{");
    change(message, '{ "a": 1 }');
    click("メッセージを送信");
    expect(socket.send).toHaveBeenLastCalledWith('{"a":1}');
    type("MessagePack");
    change(message, "bad JSON");
    click("メッセージを送信");
    expect(socket.send).toHaveBeenCalledTimes(2);
    change(message, '{"a":2}');
    click("メッセージを送信");
    expect(decode(socket.send.mock.calls.at(-1)![0] as Uint8Array)).toEqual({ a: 2 });
    type("バイナリ");
    change(message, "0xzz");
    click("メッセージを送信");
    expect(socket.send).toHaveBeenCalledTimes(3);
    change(message, "01 ab ff");
    click("メッセージを送信");
    expect(Array.from(new Uint8Array(socket.send.mock.calls.at(-1)![0] as ArrayBuffer))).toEqual([
      1, 171, 255,
    ]);
    expect(container.querySelectorAll(".websocket-encoding-badge")).toHaveLength(2);
  });

  it("decodes received payloads, bounds logs, clears counters and disconnects on error", () => {
    const socket = connect();
    act(() => socket.onmessage!({ data: '{"ok":true}' }));
    const encoded = encode({ count: 2 });
    act(() =>
      socket.onmessage!({
        data: encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength),
      }),
    );
    act(() => socket.onmessage!({ data: new Uint8Array([0xc1]).buffer }));
    act(() => socket.onmessage!({ data: 42 }));
    expect(get('[aria-label="WebSocketメッセージログ"]').textContent).toContain('"ok": true');
    expect(get('[aria-label="WebSocketメッセージログ"]').textContent).toContain("c1");
    expect(get('[aria-label="統計情報"]').textContent).toContain("4");
    const scroll = get<HTMLInputElement>('[aria-label="自動スクロールを有効にする"]');
    act(() => {
      scroll.checked = false;
      Simulate.change(scroll);
    });
    act(() => {
      for (let i = 0; i < 501; i++) socket.onmessage!({ data: `message-${i}` });
    });
    const log = get('[aria-label="WebSocketメッセージログ"]');
    expect(log.textContent).not.toContain("message-0");
    expect(log.textContent).toContain("message-500");
    expect(log.children).toHaveLength(500);
    click("ログをクリア");
    expect(log.textContent).toContain("ログはここに表示されます");
    expect(get('[aria-label="統計情報"]').textContent).not.toContain("505");
    act(() => socket.onerror!());
    expect(log.textContent).toContain("エラーが発生しました");
    act(() => socket.onclose!({ code: 1006, reason: "" }));
    expect(log.textContent).toContain("code: 1006");
  });

  it("closes a live connection and removes callbacks on unmount", () => {
    const socket = connect();
    act(() => root.unmount());
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(socket.onopen).toBeNull();
    expect(socket.onmessage).toBeNull();
    root = createRoot(container);
  });
});
