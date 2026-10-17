/** 実際のルートコンポーネントを合成データだけで検証する。 */
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "../../../app/components/Toast";
import { Route } from "../../../app/routes/json-lines";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("検証コンポーネントの描画先がありません");
const Component = Route.options.component!;
createRoot(container).render(createElement(ToastProvider, { children: createElement(Component) }));
