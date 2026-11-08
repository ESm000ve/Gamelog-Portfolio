# Gamelog macOS design system — Figma handoff

Design-system snapshot recorded November 8, 2026. The Figma library and exported reference boards document the macOS app.

- [Open the design system](https://www.figma.com/design/TiuL5F9dS9HemUafC0ZnIM?node-id=2-2)
- [Portfolio board](https://www.figma.com/design/TiuL5F9dS9HemUafC0ZnIM?node-id=2-687)

## What is in the file

10 pages, each with one presentation frame (a documentation frame per page). The library contains 105 variables in three collections: 47 primitives, 35 semantic colors with Dark and Light modes, and 23 metrics. It also holds five text styles, four elevation effect styles and 10 component sets plus two standalone components (115 component masters in total).

| Page | Contents |
| --- | --- |
| 00 · Start here | Scope, Light and Dark appearance, reference links |
| 01 · Foundations | Semantic color, type, spacing, radii and elevation |
| 02 · Actions | Primary, Secondary, Outline, Ghost and Danger buttons in three sizes and six states |
| 03 · Inputs & selection | Search states and the grid/table view selection |
| 04 · Navigation | Sidebar item states |
| 05 · Content & status | Status badges and the cover card |
| 06 · Overlays & feedback | Draft dialog and operation feedback |
| 07 · UX patterns | Browse, review, save or dismiss, and return focus |
| 08 · Accessibility & governance | Keyboard, semantics and implementation review |
| 09 · Portfolio | Library, What to Play and Activity flows |

`figma-manifest.json` records stable node IDs, collection names and counts.

## Font

The Figma file and the app both use SF Pro. The app uses the macOS system font stack, so no font file is bundled or redistributed.

## Scope and evidence

- Source: `src/styles/platforms/macos.css`, `src/styles/theme.css`, shared controls, the sidebar, cover cards, the draft modal and feedback modules in this checkout. The source map is in the [design-system guide](../README.md#design-to-code-source-map).
- Light and Dark foundations share one board on this page; the Windows library splits them into two.
- There is no Figma prototype for macOS yet. The Windows library includes a four-screen browse-to-save prototype and an offline walkthrough of it.
- Code Connect is not enabled. A manual source map is provided instead.
- No research participants, adoption figures or efficiency metrics are claimed. Full VoiceOver, increased-contrast, zoom/reflow and every accent-by-appearance combination remain open review items.

The library is editable in the file and has not been published as a team library.

## Portfolio use

Start on page 00 for the system introduction and page 09 for the product flows. The case study credits the implementation as AI-assisted and describes personal ownership accurately. Use `boards/` for reviewed Figma exports; these screenshots are references, not flattened substitutes for the editable library.

## References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)
- [WCAG contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WCAG non-text contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
