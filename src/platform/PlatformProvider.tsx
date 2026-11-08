import { useEffect, useState, type ReactNode } from "react";
import {
  FluentProvider,
  webDarkTheme,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === "dark");
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.dataset.theme === "dark")
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  const theme: Theme = {
    ...(dark ? webDarkTheme : webLightTheme),
    fontFamilyBase: "var(--app-font-text)",
    fontFamilyNumeric: "var(--app-font-text)",
    borderRadiusSmall: "var(--radius-sm)",
    borderRadiusMedium: "var(--radius-md)",
    borderRadiusLarge: "var(--radius-lg)",
    borderRadiusXLarge: "var(--radius-xl)",
    colorBrandBackground: "var(--app-accent)",
    colorBrandBackgroundHover: "var(--app-accent-hover)",
    colorBrandBackgroundPressed: "var(--app-accent-pressed)",
    colorBrandForeground1: "var(--app-accent-ink)",
    colorNeutralForegroundOnBrand: "var(--app-accent-foreground)",
    colorCompoundBrandBackground: "var(--app-accent)",
    colorCompoundBrandBackgroundHover: "var(--app-accent-hover)",
    colorCompoundBrandBackgroundPressed: "var(--app-accent-pressed)",
    colorCompoundBrandStroke: "var(--app-accent)",
    colorNeutralForeground1: "var(--app-label)",
    colorNeutralForeground2: "var(--app-secondary-label)",
    colorNeutralBackground1: "var(--app-secondary-bg)",
    colorNeutralBackground1Hover: "var(--app-tertiary-bg)",
    colorNeutralBackground1Pressed: "var(--app-secondary-fill)",
    colorNeutralBackground2: "var(--app-tertiary-bg)",
    colorNeutralBackground3: "var(--app-window-bg)",
    colorNeutralStroke1: "var(--app-separator)",
    colorNeutralStroke2: "var(--app-separator)",
    colorStrokeFocus2: "var(--app-accent-ink)",
  };
  return (
    <FluentProvider theme={theme} className="platform-provider">
      {children}
    </FluentProvider>
  );
}
