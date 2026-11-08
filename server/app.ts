import express from "express";
import { protectAppRequests } from "./requestGuard.ts";
import { attachIgdbRoutes } from "./igdb.ts";
import { attachAiRoutes } from "./ai.ts";
import { attachSteamRoutes } from "./steam.ts";

/** Shared production server. Route handlers consume the raw request body. */
export function createServerApp(distPath: string) {
  const serverApp = express();
  serverApp.use((req, res, next) => {
    // Prevent DNS rebinding from making this loopback server appear same-origin to another site.
    if (req.hostname !== "127.0.0.1") {
      res.sendStatus(403);
      return;
    }
    protectAppRequests(req, res, next);
  });
  attachIgdbRoutes(serverApp);
  attachAiRoutes(serverApp);
  attachSteamRoutes(serverApp);
  serverApp.use("/api", (_req, res) => {
    res.status(404).json({ error: "Unknown API route" });
  });
  serverApp.use(express.static(distPath));
  // A RegExp also matches the root route with Express 5.
  serverApp.get(/.*/, (_req, res) => {
    res.sendFile("index.html", { root: distPath });
  });
  return serverApp;
}
