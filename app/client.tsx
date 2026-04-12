import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { createRouter } from "./router";

const router = createRouter();

// @ts-expect-error - TanStack Start framework internal
hydrateRoot(document, <StartClient router={router} />);
