import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { hydrateStart } from "@tanstack/react-start/client";

// Prepare the server router before React can synchronously hydrate the document
// in response to an early focus or input event.
export const hydration = hydrateStart().then((router) =>
  hydrateRoot(document, <RouterProvider router={router} />),
);
