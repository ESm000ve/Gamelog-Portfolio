# Publication verification

Checked November 8, 2026 on Linux (headless Chromium), using Node.js 22.23.4. This records technical checks on the prepared project, not user research outcomes. The project targets Node.js 24 LTS and Apple silicon macOS; hosted results for that configuration are available in [GitHub Actions](https://github.com/ESm000ve/Gamelog-Portfolio/actions/workflows/ci.yml).

| Check                          | Result                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Clean lockfile installation    | `npm ci` completed                                                                                                           |
| TypeScript and lint            | Passed                                                                                                                       |
| Unit and API regressions       | 149 passed                                                                                                                   |
| Production browser build       | Passed; HTML, lazy chunk dependencies and the compiled desktop bootstrap, HTTP routes and preload checked                    |
| Production browser regressions | 119 passed in Chromium with isolated storage and mocked providers                                                            |
| Portfolio capture              | Six production screenshots (1440 × 1000); fictional library, fixed date, mocked provider requests                            |
| Design-system viewer           | All 10 boards load and step through in a browser; board search, previous/next and PNG links work; no failed requests         |
| Publication boundary           | Recognized-secret/private-file scan passed over 303 files                                                                    |

The browser suite covers collection browsing and editing, keyboard interactions, backup and restore, recovery, sharing, catalog filters, AI failure and cancellation states, recommendations, statistics, themes, compact layouts and production chunk failures.

## Not run in this check

- **Electron desktop test and disk image.** `npm run test:desktop` and `npm run build:desktop` need the Electron runtime on macOS and were not run here. The compiled desktop bootstrap and preload were smoke-checked as part of `npm run build`. Run both on a Mac before relying on the packaged app.
- **Live providers.** IGDB, Gemini and Steam account access was not tested. Those features require each user's own valid credentials and provider availability. Mocked tests establish application behavior, not current provider access or quota.
- **Native Mac behavior.** The Play menu, Dock menu, system share picker and notifications were not exercised.

## Known findings

`npm audit` reports six moderate advisories, all from `minimatch` through the Electron packaging toolchain ([upstream advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)). They affect build tooling rather than runtime code, and are not fixed in this checkout. The Windows edition resolves the same advisory with a version-scoped npm override; that change has not been applied here and should be verified with a real macOS package build.

## Screenshots and fonts

Screenshots come from the production browser build in headless Chromium on Linux, which does not have SF Pro. The interface in them is rendered with a substitute sans-serif. The app itself uses the macOS system font stack. The demo library, sample artwork and invented play records are fictional; the images were reviewed and contain no personal data.

## Privacy

The credential file is excluded from the repository and the example contains blank values. Local tool configuration (`.agents/`, `.claude/`) and disk images under `release/` are ignored. Secret pattern scanning cannot establish the absence of every possible private value.

## Limits

Code signing, notarization, automatic updates, cloud sync and public multi-user hosting are outside this delivery. Full VoiceOver, increased-contrast, zoom and all-state accessibility verification remains open, and no participant research is claimed.
