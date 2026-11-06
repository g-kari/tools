/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";

const startup = vi.hoisted(() => ({
  hydrateStart: vi.fn(),
  hydrateRoot: vi.fn(),
  createRouter: vi.fn(),
  StartClient: vi.fn(() => null),
  RouterProvider: vi.fn(() => null),
}));

vi.mock("@tanstack/react-start/client", () => ({
  hydrateStart: startup.hydrateStart,
  StartClient: startup.StartClient,
}));
vi.mock("react-dom/client", () => ({ hydrateRoot: startup.hydrateRoot }));
vi.mock("@tanstack/react-router", () => ({ RouterProvider: startup.RouterProvider }));
vi.mock("../../app/router", () => ({ createRouter: startup.createRouter }));

let resolveStartup: (router: unknown) => void;
let rejectStartup: (reason: unknown) => void;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  document.body.innerHTML = '<main><textarea id="server-input">early input</textarea></main>';
  startup.hydrateStart.mockReturnValue(
    new Promise((resolve, reject) => {
      resolveStartup = resolve;
      rejectStartup = reject;
    }),
  );
});

describe("document startup hydration", () => {
  it("keeps the SSR document untouched until startup preparation resolves", async () => {
    const before = document.documentElement.outerHTML;
    const entry = await import("../../app/client");
    expect(startup.hydrateStart).toHaveBeenCalledTimes(1);
    expect(startup.hydrateRoot).not.toHaveBeenCalled();
    expect(document.documentElement.outerHTML).toBe(before);
    resolveStartup({ id: "server-router" });
    await Reflect.get(entry, "hydration");
  });

  it("hydrates exactly once with the prepared router and no new wrapper or router", async () => {
    const entry = await import("../../app/client");
    const router = { id: "prepared-server-router" };
    const root = { id: "react-root" };
    startup.hydrateRoot.mockReturnValue(root);
    resolveStartup(router);
    await expect(Reflect.get(entry, "hydration")).resolves.toBe(root);
    expect(startup.hydrateStart).toHaveBeenCalledTimes(1);
    expect(startup.hydrateRoot).toHaveBeenCalledTimes(1);
    const [container, element] = startup.hydrateRoot.mock.calls[0]!;
    expect(container).toBe(document);
    expect(element.type).toBe(startup.RouterProvider);
    expect(element.props).toEqual({ router });
    expect(startup.createRouter).not.toHaveBeenCalled();
    expect(startup.StartClient).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(startup.hydrateRoot).toHaveBeenCalledTimes(1);
  });

  it("retains a startup rejection without rendering, retrying or replacing SSR data", async () => {
    const before = document.documentElement.outerHTML;
    const entry = await import("../../app/client");
    const error = new Error("startup data unavailable");
    const rejected = expect(Reflect.get(entry, "hydration")).rejects.toBe(error);
    rejectStartup(error);
    await rejected;
    expect(startup.hydrateStart).toHaveBeenCalledTimes(1);
    expect(startup.hydrateRoot).not.toHaveBeenCalled();
    expect(startup.createRouter).not.toHaveBeenCalled();
    expect(document.documentElement.outerHTML).toBe(before);
  });
});
