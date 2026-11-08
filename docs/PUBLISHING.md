# Publish a clean GitHub repository

The macOS portfolio is published at [ESm000ve/Gamelog-Portfolio](https://github.com/ESm000ve/Gamelog-Portfolio). The Windows edition is a separate repository, [ESm000ve/Gamelog-Windows-Portfolio](https://github.com/ESm000ve/Gamelog-Windows-Portfolio).

## Before publishing

Check the working copy for credentials and private files, then replace any provider credential that was ever committed, even to a private repository. Removing today's `.env` does not clean historical commits. If an earlier remote contains exposed values, rotating them at the provider is necessary; a fresh repository does not erase the earlier remote.

Keep unrelated personal documents, old audits and scratch artifacts out of the repository. Tool configuration folders (`.agents/`, `.claude/`) and local installers under `release/` are ignored and excluded by the publication scan. Personal library data in the installed app is separate and is never copied into the source.

## Export the reviewed source

```sh
npm run check:publication
npm run export:github
```

The export creates `release/github-source/` using an explicit source allowlist. It includes the app, tests, documentation, synthetic examples and the build icon. It excludes `.git`, credentials, local archives, dependencies, generated builds and disk images. It refuses to overwrite an existing export, so stale content cannot silently survive. Move a previous export aside before making another.

Review that folder's README and images. When creating a new repository, initialize Git **inside the fresh source folder**:

```sh
git init -b main
git add .
git commit -m "Introduce Gamelog for macOS product design portfolio project"
```

Create an empty GitHub repository, add its remote URL and push the new `main` branch. Do not reuse or copy an older `.git` folder. GitHub supports a private noreply address if you prefer not to publish your Git author email.

## Repository presentation

Suggested description: **A local-first macOS game library and play journal, exploring collection management, explainable recommendations and a macOS design system.**

Suggested topics: `product-design`, `interaction-design`, `design-system`, `portfolio`, `react`, `typescript`, `electron`, `macos`.

The README includes production screenshots and links to the case study, token documentation and setup guide. A social preview can use the fictional library screenshot. Add your own portfolio URL in repository settings if desired.

Licensing remains the owner's decision. No open-source license is assumed or added. Keep third-party notices. Enable secret scanning and push protection where available, and review the first Actions run.
