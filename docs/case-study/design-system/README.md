# Gamelog for macOS | Design system

The macOS system follows the Windows library’s ten-page organization. It uses Gamelog’s macOS window and sidebar surfaces, SF Pro typography, default indigo accent, and the interaction patterns in the shipped React app.

[Open the editable Figma file](https://www.figma.com/design/TiuL5F9dS9HemUafC0ZnIM?node-id=2-2) · [Product design case study](../README.md)

The Figma file is in Ariana’s Team and may require access. The examples and source references below are available directly on GitHub.

## Foundations

Light and Dark semantic colors alias shared primitives. Color, spacing, corner radius, and type-size variables reference their corresponding CSS names. The examples use the default Indigo accent. The running app also offers other accent choices.

![Figma foundations showing light and dark color tokens, SF Pro typography, spacing, and radii](foundations.png)

## Components and source

| Figma family                    | Implementation                                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations                     | [macOS tokens](../../../src/styles/platforms/macos.css) and [theme aliases](../../../src/styles/theme.css)                                                             |
| Buttons                         | [Button](../../../src/components/ui/Button.tsx) and [variant styles](../../../src/components/ui/Button.css)                                                            |
| Search and selection            | [Controls](../../../src/components/ui/Controls.tsx) and [Library controls](../../../src/screens/Library/LibraryScreen.tsx)                                             |
| Sidebar                         | [Sidebar](../../../src/shell/Sidebar.tsx) and [sidebar styles](../../../src/shell/Sidebar.css)                                                                         |
| Cover card, status, and outcome | [Cover card](../../../src/components/CoverCard/index.tsx) and [status colors](../../../src/components/ui/statusColors.ts)                                              |
| Draft dialog and feedback       | [Modal](../../../src/components/ui/Modal.tsx), [focus behavior](../../../src/hooks/useFocusTrap.ts), and [operation feedback](../../../src/components/ui/Feedback.tsx) |

![Figma button families showing rest, hover, pressed, focus, disabled, and loading states](actions.png)

![Figma cover-card specimen and labeled status and outcome badges](content-status.png)

## Using the system

For a new screen, start with semantic color, shared typography, and the closest existing component. Check the real interaction in the running app, including keyboard focus and dismissal. When a token or state changes, update the CSS and its Figma specimen together. The specimens document the UI. The [browser tests](../../../tests/browser/) verify how it behaves.
