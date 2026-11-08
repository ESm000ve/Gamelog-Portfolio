import { Surface } from "../../components/ui/PageLayout";

import { Button } from "../../components/ui/Button";
import { Palette, Sun, Moon, Monitor, Check } from "../../components/icons";
import { ACCENT_OPTIONS, type ThemeMode, type AccentColor } from "../../services/theme";
import "./Settings.css";

interface ThemeSettingsProps {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  onThemeModeChange: (mode: ThemeMode) => void;
  onAccentColorChange: (color: AccentColor) => void;
}

const THEME_MODES: { key: ThemeMode; label: string; Icon: React.ElementType }[] = [
  { key: "dark", label: "Dark", Icon: Moon },
  { key: "light", label: "Light", Icon: Sun },
  { key: "system", label: "System", Icon: Monitor },
];

export function ThemeSettings({
  themeMode,
  accentColor,
  onThemeModeChange,
  onAccentColorChange,
}: ThemeSettingsProps) {
  return (
    <Surface className="settings-card">
      <div className="settings-card-header">
        <Palette size={24} color="var(--app-accent)" />
        <h2>Appearance</h2>
      </div>

      <p className="settings-card-description">
        Personalize your library&apos;s look and feel by choosing an accent color and selecting your
        preferred color theme.
      </p>

      {/* Accent color Swatches */}
      <div>
        <div className="settings-field-label">Accent color</div>
        <div className="settings-accent-grid">
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = accentColor === opt.id;
            return (
              <Button
                key={opt.id}
                type="button"
                onClick={() => onAccentColorChange(opt.id)}
                aria-label={`Select ${opt.name} accent`}
                aria-pressed={isSelected}
                className={`settings-accent-swatch ${isSelected ? "selected" : ""}`}
              >
                <span className="settings-accent-swatch-dot" style={{ background: opt.hex }} />
                {opt.name}
                {isSelected && (
                  <Check size={12} aria-hidden="true" style={{ marginLeft: "auto" }} />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Theme Mode Toggle */}
      <div>
        <div className="settings-field-label">Color theme</div>
        {
          <div className="settings-theme-toggle" role="group" aria-label="Color theme">
            {THEME_MODES.map(({ key, label, Icon }) => (
              <Button
                key={key}
                type="button"
                aria-pressed={themeMode === key}
                onClick={() => onThemeModeChange(key)}
                className="settings-theme-btn"
              >
                <Icon size={16} />
                {label}
              </Button>
            ))}
          </div>
        }
      </div>
    </Surface>
  );
}
