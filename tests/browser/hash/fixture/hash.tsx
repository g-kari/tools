/** Mount the actual hash route with real browser APIs and no application shell. */
import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../../../../app/components/Toast";
import { Route } from "../../../../app/routes/hash";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Hash browser fixture root is missing");
const Component = Route.options.component!;
createRoot(container).render(
  createElement(
    StrictMode,
    null,
    createElement(ToastProvider, { children: createElement(Component) }),
  ),
);
