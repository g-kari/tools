/** Test the real route with synthetic CSV/JSON only, without the app shell or services. */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../../../../app/components/Toast";
import { Route } from "../../../../app/routes/csv-json";
import "./styles.css";
const container = document.getElementById("root");
if (!container) throw new Error("Missing fixture root");
const Component = Route.options.component!;
createRoot(container).render(createElement(ToastProvider, { children: createElement(Component) }));
