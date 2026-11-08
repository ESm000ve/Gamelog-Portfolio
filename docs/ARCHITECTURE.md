# Gamelog architecture

The macOS app and browser preview share React screens, local data services, and provider handlers. The browser is the quickest way to review the product. The Electron build adds the Mac menu, Dock commands, system sharing, and desktop notifications.

```text
React screens → repositories → Dexie / IndexedDB
              → local API     → IGDB / Twitch, Gemini, Steam
              → price lookups → CheapShark

Electron → loopback Express server → production renderer
Vite     → development middleware → shared local API handlers
```

## Where the product boundaries live

| Boundary                          | Implementation                                                                                                                                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog and personal records      | Browsing reads catalog information. Saving a reviewed log creates or updates the local records. [Game Details](../src/screens/GameDetail/GameDetailScreen.tsx) · [Log Editor](../src/screens/LogEditor/index.tsx)                                     |
| Offline import and recovery       | Full backups carry game metadata, notes, lists, tags, and sessions. Import validates the data first and writes it in a transaction with a recovery point. [Backup repository](../src/db/repositories/BackupRepo.ts)                                   |
| Local suggestions and optional AI | What to Play filters eligible games before ranking. AI refinement is initiated separately. Resume recaps send selected excerpts after consent. [Recommendations](../src/screens/Recommend/RecommendScreen.tsx) · [Gemini handler](../server/ai.ts)    |
| Native Mac services               | The main process owns the menu, Dock, backups, notifications, and share picker. The preload exposes specific operations to the renderer. [Main process](../electron/main.ts) · [Preload](../electron/preload.ts) · [Mac menu](../electron/macMenu.ts) |

## Credentials and storage

The local API handlers read service credentials from private configuration. Vite exposes only environment variables prefixed with `VITE_PUBLIC_`. The packaged app reads a user-specific `.env` and runs its API on loopback. Its stable production origin, `http://127.0.0.1:43821`, lets the same Electron profile reopen the same IndexedDB library. Browser and desktop profiles store separate libraries.

The API is designed for local use. A hosted multi-user deployment would require authentication, per-user credentials, and a separate deployment design.
