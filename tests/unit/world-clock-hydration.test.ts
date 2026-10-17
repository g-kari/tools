// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, createElement, StrictMode, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { Route } from "../../app/routes/world-clock";
import { TIMEZONES } from "../../app/utils/timezone";
import { getClockData } from "../../app/utils/world-clock";

// Keep the actual route component and its real utilities/children; routing
// transport and the browser's host timezone are supplied by this fixture.
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
const WorldClockPage = (Route as unknown as { component: ComponentType }).component;
let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  container.remove();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setClock(time: string, timezone: string) {
  vi.setSystemTime(new Date(time));
  vi.stubEnv("TZ", timezone);
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(timezone);
}
function clockCards() {
  return [...container.querySelectorAll<HTMLElement>(".wc-card")];
}
function assertClock(time: string, timezone: string, hour12 = false) {
  for (const card of clockCards()) {
    const title = card.querySelector(".wc-city-title")!.textContent!.replace("LOCAL", "");
    const city = TIMEZONES.find((item) => item.city === title)!;
    const expected = getClockData(new Date(time), city.id, hour12, timezone);
    expect(card.querySelector(".wc-time")!.textContent).toBe(expected.time);
    expect(card.querySelector(".wc-date")!.textContent).toBe(expected.date);
    expect(card.querySelector(".wc-offset")!.textContent).toBe(expected.offset);
    expect(card.querySelector(".wc-day-diff")?.textContent ?? "").toBe(
      expected.dayDiff === 0 ? "" : expected.dayDiff > 0 ? "+1" : "-1",
    );
    expect(card.classList.contains("wc-card--local")).toBe(city.id === timezone);
    expect(card.getAttribute("aria-label")).toBe(`${city.city} ${expected.time}`);
    expect(card.querySelector(".wc-time")!.getAttribute("aria-label")).toBe(
      `現在時刻 ${expected.time}`,
    );
  }
}

describe("World Clock deterministic hydration", () => {
  it("SSR is stable across host clock/timezone and does not publish a host-local clock", () => {
    setClock("2026-10-07T23:59:59Z", "UTC");
    const server = renderToString(createElement(WorldClockPage));
    setClock("2026-10-08T00:00:02Z", "Asia/Tokyo");
    expect(renderToString(createElement(WorldClockPage))).toBe(server);
    container.innerHTML = server;
    expect(clockCards()).toHaveLength(10);
    expect([...container.querySelectorAll(".wc-time")].map((item) => item.textContent)).toEqual(
      Array(10).fill("--:--:--"),
    );
    expect(container.querySelector(".wc-local-badge")).toBeNull();
    expect(container.querySelector(".wc-day-diff")).toBeNull();
    expect(
      container.querySelector('[aria-label="ワールドクロック一覧"]')!.getAttribute("aria-live"),
    ).toBe("off");
  });

  it.each([
    ["UTC", "UTC", "2026-10-07T08:00:00Z", "2026-10-07T08:00:00Z"],
    ["UTC", "Asia/Tokyo", "2026-10-07T20:00:00Z", "2026-10-07T20:00:00Z"],
    ["UTC", "UTC", "2026-10-07T08:00:00Z", "2026-10-07T08:00:02Z"],
    ["Asia/Tokyo", "America/Los_Angeles", "2026-10-07T23:59:59Z", "2026-10-08T00:00:02Z"],
    ["UTC", "America/New_York", "2026-03-08T06:59:59Z", "2026-03-08T07:00:02Z"],
    ["Europe/London", "America/New_York", "2026-11-01T05:59:59Z", "2026-11-01T06:00:02Z"],
  ])(
    "%s SSR → %s client hydrates without root replacement",
    async (serverTz, clientTz, serverTime, clientTime) => {
      setClock(serverTime, serverTz);
      container.innerHTML = renderToString(createElement(WorldClockPage));
      const initialCards = clockCards();
      const errors: unknown[] = [];
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      setClock(clientTime, clientTz);
      await act(async () => {
        root = hydrateRoot(container, createElement(WorldClockPage), {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(errors).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
      expect(clockCards()[0]).toBe(initialCards[0]);
      expect(clockCards()).toHaveLength(10);
      assertClock(clientTime, clientTz);
    },
  );

  it("mounts immediately, keeps controls/announcements and ticks, then cleans up and remounts", async () => {
    setClock("2026-10-07T08:00:00Z", "Asia/Tokyo");
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(StrictMode, null, createElement(WorldClockPage)));
    });
    assertClock("2026-10-07T08:00:00Z", "Asia/Tokyo");
    const initial = clockCards()[0];
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    assertClock("2026-10-07T08:00:01Z", "Asia/Tokyo");
    expect(clockCards()[0]).toBe(initial);
    const button = (text: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].find(
        (item) => item.textContent === text,
      )!;
    await act(async () => button("12h").click());
    expect(button("12h").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      "12時間表示に切り替えました",
    );
    assertClock("2026-10-07T08:00:01Z", "Asia/Tokyo", true);
    await act(async () => button("24h").click());
    expect(button("24h").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[role="status"]')!.textContent).toBe(
      "24時間表示に切り替えました",
    );
    assertClock("2026-10-07T08:00:01Z", "Asia/Tokyo");
    await act(async () => button("都市を選択").click());
    const selector = container.querySelector("#wc-selector")!;
    expect(selector.getAttribute("aria-label")).toBe("表示都市の選択");
    const tokyo = [...container.querySelectorAll<HTMLInputElement>(".wc-city-checkbox")].find(
      (item) => item.getAttribute("aria-label")?.startsWith("東京（"),
    )!;
    await act(async () => tokyo.click());
    expect(tokyo.checked).toBe(false);
    expect(clockCards()).toHaveLength(9);
    await act(async () => tokyo.click());
    expect(tokyo.checked).toBe(true);
    expect(clockCards()).toHaveLength(10);
    await act(async () => button("すべて解除").click());
    expect(clockCards()).toHaveLength(0);
    expect(container.querySelector(".wc-empty")!.getAttribute("role")).toBe("status");
    await act(async () => button("すべて選択").click());
    expect(clockCards()).toHaveLength(TIMEZONES.length);
    await act(async () => button("リセット").click());
    expect(clockCards()).toHaveLength(10);
    await act(async () => button("都市を閉じる").click());
    expect(container.querySelector("#wc-selector")).toBeNull();
    await act(async () => root?.unmount());
    root = undefined;
    expect(vi.getTimerCount()).toBe(0);
    setClock("2026-10-08T00:00:00Z", "America/New_York");
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(WorldClockPage));
    });
    assertClock("2026-10-08T00:00:00Z", "America/New_York");
    expect(button("24h").getAttribute("aria-pressed")).toBe("true");
    expect(vi.getTimerCount()).toBe(1);
  });
});
