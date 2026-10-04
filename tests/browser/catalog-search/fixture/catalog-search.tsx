/** Actual catalog, modal, CSS and Router links; memory navigation and no app services. */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useRouterState,
} from "@tanstack/react-router";
import { Route } from "../../../../app/routes/top";
import { SearchModal } from "../../../../app/components/SearchModal";
import { Route as MinesweeperRoute } from "../../../../app/routes/minesweeper";
import "./styles.css";

function FixtureShell() {
  const [open, setOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        event.stopPropagation();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  return (
    <div className="container">
      <button
        ref={searchButtonRef}
        type="button"
        className="nav-search-btn"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          setOpen(true);
        }}
      >
        ツールを検索（Ctrl+K）
      </button>
      <output data-testid="navigation">{path}</output>
      <button type="button" data-testid="history-back" onClick={() => router.history.back()}>
        戻る（fixture history）
      </button>
      <Outlet />
      <SearchModal
        isOpen={open}
        onClose={() => setOpen(false)}
        locationKey={path}
        returnFocusRef={searchButtonRef}
      />
    </div>
  );
}

const rootRoute = createRootRoute({ component: FixtureShell });
const topRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/top",
  component: Route.options.component!,
});
const destinationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$tool",
  component: DestinationFixture,
});
function DestinationFixture() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div key={path}>
      <p>Selected tool destination (fixture only)</p>
      <input aria-label="移動先の入力" autoFocus />
    </div>
  );
}
const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/minesweeper",
  component: MinesweeperRoute.options.component!,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([topRoute, gameRoute, destinationRoute]),
  history: createMemoryHistory({ initialEntries: ["/top"] }),
  defaultPreload: false,
});
const container = document.getElementById("root");
if (!container) throw new Error("Missing catalog fixture root");
createRoot(container).render(<RouterProvider router={router} />);
