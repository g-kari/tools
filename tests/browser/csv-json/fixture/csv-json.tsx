/** Test the real route with synthetic CSV/JSON and URL strings only, without the app shell or services. */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../../../../app/components/Toast";
import { Route as CsvRoute } from "../../../../app/routes/csv-json";
import { Route as UrlRoute } from "../../../../app/routes/url-encode";
import "./styles.css";
const container = document.getElementById("root");
if (!container) throw new Error("Missing fixture root");
const Component =
  window.location.pathname === "/url-encode"
    ? UrlRoute.options.component!
    : CsvRoute.options.component!;
createRoot(container).render(createElement(ToastProvider, { children: createElement(Component) }));
