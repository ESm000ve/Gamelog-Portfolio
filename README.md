# Gamelog

**A personal game library, play journal, and decision aid for what to play next.**

Gamelog brings together three questions that a game collection alone can’t answer. What do I own? Where did I leave off? What fits the time I have tonight? It’s a local-first app for Apple silicon Macs, with a browser mode for development.

![Gamelog Library with play-status filters, cover art, ratings, and a grid or table toggle](docs/case-study/screenshots/01-library.png)

_Library view using fictional game records and demo cover art._

| Flow                      | Design decision                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organize a library**    | Cover and table views use the same records and filters. Wishlist, Backlog, Playing, and Played describe where a game sits. Outcomes like Completed or Shelved describe how a playthrough ended. |
| **Keep a play journal**   | Sessions, ratings, and notes turn the library into a record of play. Activity connects individual entries to a calendar and summary.                                                            |
| **Choose what to play**   | Start with a pool of games, narrow by available time, and see why a game surfaced. Local picks work without AI.                                                                                 |
| **Stay in control of AI** | Quick log creates an editable draft. Resume recaps show the note excerpts selected for sharing and ask for consent before sending them.                                                         |

[Design rationale, screenshot gallery, and capture instructions](docs/case-study/README.md) · [macOS design system](docs/case-study/design-system/README.md)

## Run locally

Requires Node.js 24 LTS or 22.12+.

```sh
npm ci
cp .env.example .env
npm run dev
```

Use `npm run dev:web` to open the browser version at the URL Vite prints. A fresh profile starts with an empty library. Existing full JSON backups can be restored without credentials from **Settings → Backup and restore**.

### Connect your own services

Add only the credentials for features you use to your local `.env` and restart the app.

| Feature                                  | Environment variables                  | Provider                                                         |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Catalog search, covers, and game details | `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET` | [IGDB authentication](https://api-docs.igdb.com/#authentication) |
| Optional Gemini assistance               | `GEMINI_API_KEY`                       | [Google AI Studio](https://aistudio.google.com/apikey)           |
| Optional Steam library import            | `STEAM_WEB_API_KEY`                    | [Steam Web API key](https://steamcommunity.com/dev/apikey)       |

The Steam profile must expose game details. Gemini text generation defaults to `gemini-3.5-flash`. Use `GEMINI_TEXT_MODEL` to select another compatible model. Keys are read by the local server. Keep `.env` out of Git and avoid the `VITE_PUBLIC_` prefix for private settings.

### Build for macOS

Run `npm run build:desktop` on an Apple silicon Mac to create a disk image under `release/macos/`. Open the image and drag Gamelog to Applications. Packaged builds read credentials from `~/Library/Application Support/Gamelog/.env` or the process environment. Restart after changing them.

The desktop app includes a native Play menu and session timer, Dock shortcuts, daily local recovery backups, and wishlist price notifications. Open the backup folder from Settings.

## Data and privacy

Gamelog stores the library in IndexedDB. Browser and desktop profiles use separate storage. Production Electron uses `http://127.0.0.1:43821`. Export a backup before changing `GAMELOG_PORT`, since it changes the storage origin.

Full backups include games, logs, lists, tags, and sessions. **Merge** updates matching records and keeps unrelated ones. **Replace** swaps the library in a single transaction. Some older exports need IGDB access to restore missing metadata.

Catalog, AI, Steam import, and price lookup contact their respective services. Gemini receives the text or metadata needed by the feature you invoke. Play notes are sent for a resume recap only after you select the excerpts and consent.

## Project structure

- `src/` contains React screens, shared UI, local data, and recommendation logic.
- `server/` handles credential-backed API routes for Vite and the packaged app.
- `electron/` provides the native shell, menus, and desktop integrations.
- `tests/` covers storage, product logic, API contracts, and browser flows.

| Command                      | Purpose                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `npm run check`              | Type-check, lint, and run the regression suite                                  |
| `npm run build`              | Build the renderer and Electron app, then smoke-test the compiled server        |
| `npm run test:ui:production` | Run Playwright against production assets                                        |
| `npm run test:desktop`       | Smoke-test a built desktop app in an isolated Electron profile                  |
| `npm run build:web`          | Build the browser renderer. Catalog and AI require the accompanying API routes. |
