/** Actual catalog, modal, CSS and Router links; memory navigation and no app services. */
import { useEffect, useState } from "react";
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
import "./styles.css";

function FixtureShell() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  return (
    <div className="container">
      <button type="button" className="nav-search-btn" onClick={() => setOpen(true)}>
        ツールを検索（Ctrl+K）
      </button>
      <output data-testid="navigation">{path}</output>
      <Outlet />
      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
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
  component: () => <p>Selected tool destination (fixture only)</p>,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([topRoute, destinationRoute]),
  history: createMemoryHistory({ initialEntries: ["/top"] }),
  defaultPreload: false,
});
const container = document.getElementById("root");
if (!container) throw new Error("Missing catalog fixture root");
createRoot(container).render(<RouterProvider router={router} />);
