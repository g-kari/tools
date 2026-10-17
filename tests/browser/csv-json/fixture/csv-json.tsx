/** Test real conversion routes with synthetic input, without the app shell or services. */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../../../../app/components/Toast";
import { Route as CsvJsonRoute } from "../../../../app/routes/csv-json";
import { Route as Base64Route } from "../../../../app/routes/base64";
import { Route as UrlRoute } from "../../../../app/routes/url-encode";
import { Route as CsvSqlRoute } from "../../../../app/routes/csv-sql";
import { Route as PasswordRoute } from "../../../../app/routes/password-generator";
import "./styles.css";
const container = document.getElementById("root");
if (!container) throw new Error("Missing fixture root");
const route =
  location.pathname === "/password-generator"
    ? PasswordRoute
    : location.pathname === "/base64"
      ? Base64Route
      : location.pathname === "/url-encode"
        ? UrlRoute
        : location.pathname === "/csv-sql"
          ? CsvSqlRoute
          : CsvJsonRoute;
const Component = route.options.component!;
createRoot(container).render(createElement(ToastProvider, { children: createElement(Component) }));
