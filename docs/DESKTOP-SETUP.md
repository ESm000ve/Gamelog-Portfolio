# macOS desktop setup

The packaged target is **Apple silicon**. Use Node.js 24 LTS and npm.

```sh
npm ci
npm run build:desktop
```

Open the disk image from `release/macos/` and drag Gamelog into Applications. Use `npm run build:desktop -- --dir` for an unpacked build. The repository contains the build configuration. Public distribution requires a separate signing and notarization setup.

## Your API credentials

For packaged Gamelog, copy `.env.example` to `~/Library/Application Support/Gamelog/.env` and fill in the services you use. The app also accepts credentials from its process environment. The per-user file takes precedence over inherited settings. Quit and reopen the app after editing it. For browser development, use a `.env` in the project root.

The fictional [demo library](../examples/demo-library.json) can be imported without credentials. IGDB credentials enable online catalog search and details. Gemini and Steam credentials enable their optional features.

## Backups and profile changes

In the original app, export your library from **Settings → Backup and restore**. Import the backup in the destination app and choose **Merge (Add & Update)** to preserve unrelated records. Use Replace when you intend to replace the library. Version 2 backups include metadata for offline restores. Some older exports need catalog access to restore missing details.

Production Electron uses `http://127.0.0.1:43821`. Changing `GAMELOG_PORT` changes the storage origin. Export your library first. A busy port shows a startup error.

## Mac workflow

Use the **Play** menu to start a timer, then stop it to record a session. The Dock menu offers shortcuts to resume playing or open recommendations. From a list’s share dialog, choose **Share via macOS**. Settings also gives access to daily local backups.

Run `npm run build` to smoke-check the compiled desktop server and preload. Run `npm run test:desktop` after building to check the Electron app using a temporary profile.
