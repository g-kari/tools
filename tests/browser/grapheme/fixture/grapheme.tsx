/** Render only the real text-tool components; no app shell, bindings or external services. */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { Route as CharCountRoute } from "../../../../app/routes/char-count";
import { Route as TextStatsRoute } from "../../../../app/routes/text-stats";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("検証コンポーネントの描画先がありません");
const routes = new Map([
  ["/char-count", CharCountRoute.options.component],
  ["/text-stats", TextStatsRoute.options.component],
]);
const Component = routes.get(window.location.pathname);
if (!Component) throw new Error("検証対象外のルートです");
createRoot(container).render(createElement(Component));
