import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

export function protectAppRequests(req: IncomingMessage, res: ServerResponse, next: () => void) {
  res.setHeader("X-Frame-Options", "DENY");
  const pathname = req.url?.split("?", 1)[0] ?? "";
  if (/^\/api(?:\/|$)/i.test(pathname)) {
    res.setHeader("Cache-Control", "no-store");
    // Browsers set this header themselves. Third-party pages cannot forge it.
    if (req.headers["sec-fetch-site"] !== "same-origin") {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Open Gamelog to use its local API." }));
      return;
    }
  }
  next();
}

export function appRequestGuard(): Plugin {
  return {
    name: "gamelog-app-request-guard",
    configureServer(server) {
      server.middlewares.use(protectAppRequests);
    },
    configurePreviewServer(server) {
      server.middlewares.use(protectAppRequests);
    },
  };
}
